'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Vehicle } from '../types/vehicle.types';

interface UseVehiclesReturn {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
}

export function useVehicles(tenantId: string | undefined): UseVehiclesReturn {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `tenants/${tenantId}/vehicles`),
      orderBy('make', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
          insurance: {
            ...doc.data().insurance,
            expiresAt: doc.data().insurance?.expiresAt?.toDate?.() ?? new Date(),
          },
          registration: {
            ...doc.data().registration,
            expiresAt: doc.data().registration?.expiresAt?.toDate?.() ?? new Date(),
          },
        })) as Vehicle[];
        setVehicles(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [tenantId]);

  return { vehicles, loading, error };
}
