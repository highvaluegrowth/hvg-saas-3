'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Incident, IncidentStatus } from '../types/incident.types';

interface UseIncidentsOptions {
  status?: IncidentStatus;
}

interface UseIncidentsReturn {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
}

export function useIncidents(
  tenantId: string | undefined,
  options: UseIncidentsOptions = {}
): UseIncidentsReturn {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    const constraints: QueryConstraint[] = [];
    if (options.status) {
      constraints.push(where('status', '==', options.status));
    }
    constraints.push(orderBy('reportedAt', 'desc'));

    const q = query(
      collection(db, `tenants/${tenantId}/incidents`),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
          reportedAt: doc.data().reportedAt?.toDate?.() ?? new Date(),
          resolvedAt: doc.data().resolvedAt?.toDate?.() ?? undefined,
        })) as Incident[];
        setIncidents(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, options.status]);

  return { incidents, loading, error };
}
