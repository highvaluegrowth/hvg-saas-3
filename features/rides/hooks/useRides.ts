'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Ride } from '../types/ride.types';

interface UseRidesReturn {
  rides: Ride[];
  loading: boolean;
  error: string | null;
}

export function useRides(tenantId: string | undefined): UseRidesReturn {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `tenants/${tenantId}/rides`),
      orderBy('scheduledAt', 'desc')
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
        })) as Ride[];
        setRides(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [tenantId]);

  return { rides, loading, error };
}
