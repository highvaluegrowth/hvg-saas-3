'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { GlobalNavbar } from '@/components/layout/GlobalNavbar';
import { GlobalDrawerContainer } from '@/features/chat/components/GlobalDrawerContainer';
import { useLayoutStore } from '@/lib/stores/useLayoutStore';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}

export default function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { tenantId } = use(params);
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { sidebarWidth } = useLayoutStore();
  const [tenantName, setTenantName] = useState<string>('');
  const [tenantStatus, setTenantStatus] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      // Check if user is authenticated
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user has tenant access
      if (!user.tenantId) {
        // VIP bypass — only redirect if stuck on a non-dashboard page
        if (user.email === 'petergaiennie@gmail.com') {
          const BYPASS_TENANT = 'gFqQoYCftGnRAMXOqIVx';
          const alreadyInDashboard = pathname?.startsWith(`/${BYPASS_TENANT}/`);
          if (!alreadyInDashboard) {
            router.push(`/${BYPASS_TENANT}/operations`);
          }
          return;
        }
        router.push('/create-tenant');
        return;
      }

      // Verify user has access to this tenant
      if (user.tenantId !== tenantId && user.role !== 'super_admin') {
        router.push('/unauthorized');
        return;
      }

      // Fetch real tenant name from Firestore via API
      async function fetchTenantName() {
        try {
          const token = await authService.getIdToken();
          const res = await fetch(`/api/tenants/${tenantId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setTenantName(data.tenant?.name ?? 'Dashboard');
            setTenantStatus(data.tenant?.status ?? null);

            // Gate new tenant_admins through onboarding
            // Skip if: already on onboarding, super_admin, or localStorage bypass set
            const isOnboardingPath = pathname?.includes('/onboarding');
            const localBypass = localStorage.getItem(`hvg_ob_${tenantId}`) === '1';

            if (data.tenant?.onboardingComplete) {
              // Firestore confirms complete — persist locally so future loads are instant
              localStorage.setItem(`hvg_ob_${tenantId}`, '1');
            } else if (!localBypass && !isOnboardingPath && user?.role === 'tenant_admin') {
              router.push(`/${tenantId}/onboarding`);
              return;
            }
          } else {
            setTenantName('Dashboard');
          }
        } catch {
          setTenantName('Dashboard');
        }
      }

      fetchTenantName();
    }
  }, [user, loading, tenantId, router, pathname]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0C1A2E' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent"></div>
          <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated or doesn't have access
  if (!user || (!user.tenantId && user.role !== 'super_admin')) {
    return null;
  }

  // Onboarding path renders full-page without sidebar chrome
  if (pathname?.includes('/onboarding')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#0C1A2E' }}>
      <Sidebar
        tenantId={tenantId}
        tenantName={tenantName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ paddingLeft: isSidebarCollapsed ? 80 : sidebarWidth }}
      >
        {user?.isImpersonating && (
          <div className="bg-amber-500 text-black px-4 py-2 text-center text-[10px] font-black uppercase flex items-center justify-center gap-4 z-[60] tracking-widest shadow-xl">
            <span>⚠️ SuperAdmin Impersonation Mode Active</span>
            <button 
              onClick={() => authService.stopImpersonating()}
              className="bg-black text-white px-3 py-1 rounded-full hover:bg-zinc-800 transition-colors text-[9px]"
            >
              Exit Impersonation
            </button>
          </div>
        )}
        <GlobalNavbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        {tenantStatus === 'pending' && (
          <div
            className="p-4"
            style={{
              background: 'rgba(245,158,11,0.08)',
              borderBottom: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <div className="flex items-center">
              <div className="shrink-0">
                <svg className="h-5 w-5" style={{ color: '#F59E0B' }} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm" style={{ color: 'rgba(245,158,11,0.9)' }}>
                  <strong>Awaiting Approval:</strong> Your application to manage a sober-living house is currently being reviewed. You have limited access to the platform until approved.
                </p>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-6 overflow-y-auto" style={{ background: '#0C1A2E' }}>
          {children}
        </main>
      </div>

      <GlobalDrawerContainer currentUserId={user?.uid ?? ''} />
    </div>
  );
}
