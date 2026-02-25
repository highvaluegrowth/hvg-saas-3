'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export interface DashboardStats {
  houseCount: number;
  activeResidentCount: number;
  staffCount: number;
  upcomingEventCount: number;
}

interface UseDashboardStatsReturn {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
}

const DEFAULT_STATS: DashboardStats = {
  houseCount: 0,
  activeResidentCount: 0,
  staffCount: 0,
  upcomingEventCount: 0,
};

export function useDashboardStats(tenantId: string | undefined): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    // Real-time listener on houses collection for count
    const housesUnsub = onSnapshot(
      query(
        collection(db, `tenants/${tenantId}/houses`),
        where('status', '==', 'active')
      ),
      (snapshot) => {
        setStats((prev) => ({ ...prev, houseCount: snapshot.size }));
        setLoading(false);
      },
      (err) => setError(err.message)
    );

    // Real-time listener on enrollments for active resident count
    const enrollmentsUnsub = onSnapshot(
      query(
        collection(db, `tenants/${tenantId}/enrollments`),
        where('status', '==', 'active')
      ),
      (snapshot) => {
        setStats((prev) => ({ ...prev, activeResidentCount: snapshot.size }));
      },
      (err) => setError(err.message)
    );

    // Real-time listener on staff
    const staffUnsub = onSnapshot(
      query(
        collection(db, `tenants/${tenantId}/staff`),
        where('status', '==', 'active')
      ),
      (snapshot) => {
        setStats((prev) => ({ ...prev, staffCount: snapshot.size }));
      },
      (err) => setError(err.message)
    );

    // Real-time listener on upcoming events
    const now = new Date();
    const eventsUnsub = onSnapshot(
      query(
        collection(db, `tenants/${tenantId}/events`),
        where('scheduledAt', '>=', now)
      ),
      (snapshot) => {
        setStats((prev) => ({ ...prev, upcomingEventCount: snapshot.size }));
      },
      (err) => setError(err.message)
    );

    return () => {
      housesUnsub();
      enrollmentsUnsub();
      staffUnsub();
      eventsUnsub();
    };
  }, [tenantId]);

  return { stats, loading, error };
}
