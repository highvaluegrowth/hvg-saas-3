'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export interface DashboardStats {
  houseCount: number;
  activeResidentCount: number;
  totalCapacity: number;
  staffCount: number;
  upcomingEventCount: number;
  openApplicationsCount: number;
  pendingJoinRequestsCount: number;
}

interface UseDashboardStatsReturn {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
}

const DEFAULT_STATS: DashboardStats = {
  houseCount: 0,
  activeResidentCount: 0,
  totalCapacity: 0,
  staffCount: 0,
  upcomingEventCount: 0,
  openApplicationsCount: 0,
  pendingJoinRequestsCount: 0,
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

    // Houses: count + sum total capacity
    const housesUnsub = onSnapshot(
      query(
        collection(db, `tenants/${tenantId}/houses`),
        where('status', '==', 'active')
      ),
      (snapshot) => {
        const totalCapacity = snapshot.docs.reduce(
          (sum, doc) => sum + (doc.data().capacity ?? 0),
          0
        );
        setStats((prev) => ({
          ...prev,
          houseCount: snapshot.size,
          totalCapacity,
        }));
        setLoading(false);
      },
      (err) => setError(err.message)
    );

    // Active resident enrollments
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

    // Active staff
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

    // Upcoming events
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

    // Open bed/staff applications assigned to this tenant
    const appsUnsub = onSnapshot(
      query(
        collection(db, 'applications'),
        where('assignedTenantId', '==', tenantId),
        where('status', '==', 'assigned')
      ),
      (snapshot) => {
        setStats((prev) => ({ ...prev, openApplicationsCount: snapshot.size }));
      },
      (err) => setError(err.message)
    );

    // Pending join requests (mobile residents wanting to join)
    const joinUnsub = onSnapshot(
      query(
        collection(db, `tenants/${tenantId}/joinRequests`),
        where('status', '==', 'pending')
      ),
      (snapshot) => {
        setStats((prev) => ({ ...prev, pendingJoinRequestsCount: snapshot.size }));
      },
      (err) => setError(err.message)
    );

    return () => {
      housesUnsub();
      enrollmentsUnsub();
      staffUnsub();
      eventsUnsub();
      appsUnsub();
      joinUnsub();
    };
  }, [tenantId]);

  return { stats, loading, error };
}
