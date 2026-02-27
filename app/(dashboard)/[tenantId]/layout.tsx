'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { AISidebar } from '@/components/ai-sidebar/AISidebar';
import { useAISidebarStore } from '@/lib/stores/aiSidebarStore';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}

export default function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { tenantId } = use(params);
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tenantName, setTenantName] = useState<string>('');
  const [tenantStatus, setTenantStatus] = useState<string | null>(null);
  const { isOpen, sidebarWidth } = useAISidebarStore();

  useEffect(() => {
    if (!loading) {
      // Check if user is authenticated
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user has tenant access
      if (!user.tenantId) {
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
          } else {
            setTenantName('Dashboard');
          }
        } catch {
          setTenantName('Dashboard');
        }
      }

      fetchTenantName();
    }
  }, [user, loading, tenantId, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated or doesn't have access
  if (!user || (!user.tenantId && user.role !== 'super_admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar
        tenantId={tenantId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        className={`flex-1 flex flex-col min-h-screen lg:pl-64`}
        style={
          isOpen && typeof window !== 'undefined' && window.innerWidth >= 1024
            ? { paddingRight: `${sidebarWidth}px`, transition: 'padding-right 0.3s ease' }
            : { transition: 'padding-right 0.3s ease' }
        }
      >
        <Header
          tenantName={tenantName}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {tenantStatus === 'pending' && (
          <div className="bg-amber-50 border-b border-amber-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm text-amber-800">
                  <strong>Awaiting Approval:</strong> Your application to manage a sober-living house is currently being reviewed. You have limited access to the platform until approved.
                </p>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      <AISidebar />
    </div>
  );
}
