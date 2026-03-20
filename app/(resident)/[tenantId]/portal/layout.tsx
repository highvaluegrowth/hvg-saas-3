'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { GlobalDrawerContainer } from '@/features/chat/components/GlobalDrawerContainer';
import { MobileBottomNav } from '@/components/resident/MobileBottomNav';

interface ResidentLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}

const STAFF_ROLES = new Set(['super_admin', 'tenant_admin', 'staff_admin', 'staff']);

export default function ResidentLayout({ children, params }: ResidentLayoutProps) {
  const { tenantId } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!STAFF_ROLES.has(user.role ?? '') && user.role !== 'resident') {
      router.push('/login');
      return;
    }
  }, [user, loading, router, tenantId]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#060E1A' }}
      >
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      {/* Page shell — mobile-first, max-width centered */}
      <div
        className="relative min-h-screen pb-24"
        style={{ background: '#060E1A', maxWidth: '28rem', margin: '0 auto' }}
      >
        {children}
      </div>

      {/* Universal comms drawer — accessible from any resident page */}
      <GlobalDrawerContainer currentUserId={user.uid} />

      {/* Mobile bottom nav — fixed, constrained to max-w-md */}
      <MobileBottomNav tenantId={tenantId} />
    </>
  );
}
