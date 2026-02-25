'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Enrollment, EnrollmentStatus } from '../types/enrollment.types';

interface UseEnrollmentsOptions {
  status?: EnrollmentStatus;
  houseId?: string;
}

interface UseEnrollmentsReturn {
  enrollments: Enrollment[];
  loading: boolean;
  error: string | null;
}

export function useEnrollments(
  tenantId: string | undefined,
  options: UseEnrollmentsOptions = {}
): UseEnrollmentsReturn {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
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
    if (options.houseId) {
      constraints.push(where('houseId', '==', options.houseId));
    }
    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(
      collection(db, `tenants/${tenantId}/enrollments`),
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
          moveInDate: doc.data().moveInDate?.toDate?.() ?? null,
          moveOutDate: doc.data().moveOutDate?.toDate?.() ?? null,
          sobrietyStartDate: doc.data().sobrietyStartDate?.toDate?.() ?? null,
        })) as Enrollment[];
        setEnrollments(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, options.status, options.houseId]);

  return { enrollments, loading, error };
}
