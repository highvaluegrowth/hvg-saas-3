'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Chore } from '../types/chore.types';

interface UseChoresReturn {
  chores: Chore[];
  loading: boolean;
  error: string | null;
}

export function useChores(tenantId: string | undefined): UseChoresReturn {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `tenants/${tenantId}/chores`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
          dueDate: doc.data().dueDate?.toDate?.() ?? undefined,
        })) as Chore[];
        setChores(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [tenantId]);

  return { chores, loading, error };
}
