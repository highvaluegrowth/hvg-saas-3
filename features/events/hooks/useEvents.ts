'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { ProgramEvent } from '../types/event.types';

interface UseEventsReturn {
  events: ProgramEvent[];
  loading: boolean;
  error: string | null;
}

export function useEvents(
  tenantId: string | undefined,
  options: { showAll?: boolean } = {}
): UseEventsReturn {
  const [events, setEvents] = useState<ProgramEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { showAll = false } = options;

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    const q = showAll
      ? query(
          collection(db, `tenants/${tenantId}/events`),
          orderBy('scheduledAt', 'asc')
        )
      : query(
          collection(db, `tenants/${tenantId}/events`),
          where('scheduledAt', '>=', new Date()),
          orderBy('scheduledAt', 'asc')
        );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
          scheduledAt: doc.data().scheduledAt?.toDate?.() ?? new Date(),
        })) as ProgramEvent[];
        setEvents(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [tenantId, showAll]);

  return { events, loading, error };
}
