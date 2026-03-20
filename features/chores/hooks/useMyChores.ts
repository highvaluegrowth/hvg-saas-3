'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, onSnapshot, query,
  where, orderBy, updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Chore } from '../types/chore.types';

interface UseMyChoresReturn {
  chores: Chore[];
  loading: boolean;
  error: string | null;
  completeChore: (choreId: string) => Promise<void>;
}

export function useMyChores(
  tenantId: string | undefined,
  uid: string | undefined,
): UseMyChoresReturn {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId || !uid) {
      setLoading(false);
      return;
    }

    // assigneeIds is a string[] — use array-contains to scope to this resident only
    const q = query(
      collection(db, `tenants/${tenantId}/chores`),
      where('assigneeIds', 'array-contains', uid),
      orderBy('createdAt', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
          updatedAt: d.data().updatedAt?.toDate?.() ?? new Date(),
          dueDate: d.data().dueDate?.toDate?.() ?? undefined,
        })) as Chore[];
        setChores(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsub;
  }, [tenantId, uid]);

  const completeChore = useCallback(
    async (choreId: string) => {
      if (!tenantId) return;
      await updateDoc(doc(db, `tenants/${tenantId}/chores`, choreId), {
        status: 'done',
      });
    },
    [tenantId],
  );

  return { chores, loading, error, completeChore };
}
