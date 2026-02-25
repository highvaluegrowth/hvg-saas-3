'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { StaffMember } from '../types/staff.types';

interface UseStaffReturn {
  staff: StaffMember[];
  loading: boolean;
  error: string | null;
}

export function useStaff(tenantId: string | undefined): UseStaffReturn {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `tenants/${tenantId}/staff`),
      where('status', '==', 'active'),
      orderBy('lastName', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
        })) as StaffMember[];
        setStaff(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [tenantId]);

  return { staff, loading, error };
}
