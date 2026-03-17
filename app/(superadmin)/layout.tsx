'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { GlobalNavbar } from '@/components/layout/GlobalNavbar';
import { DirectorChat } from '@/components/ai-sidebar/DirectorChat';
import { useDirectorSidebarStore } from '@/lib/stores/directorSidebarStore';

interface SuperAdminLayoutProps {
    children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { isOpen, sidebarWidth } = useDirectorSidebarStore();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
                return;
            }
            if (user.role !== 'super_admin') {
                router.push('/unauthorized');
                return;
            }
        }
    }, [user, loading, router]);

    // Show loading state
    if (loading || !user || user.role !== 'super_admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F071A]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-fuchsia-600 border-t-transparent"></div>
                    <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Verifying SuperAdmin Access...</p>
                </div>
            </div>
        );
    }

    // Onboarding path renders full-page without sidebar chrome
    if (pathname?.includes('/admin/onboarding')) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-[#1A0B2E] via-[#0F071A] to-[#2D0B3E]">
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div
                className={`flex-1 flex flex-col min-h-screen transition-all duration-300 lg:pl-64`}
                style={
                    isOpen && typeof window !== 'undefined' && window.innerWidth >= 1024
                        ? { paddingRight: `${sidebarWidth}px`, transition: 'padding-right 0.3s ease' }
                        : { transition: 'padding-right 0.3s ease' }
                }
            >
                <GlobalNavbar
                    onMenuClick={() => setSidebarOpen(true)}
                />


                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>

            <DirectorChat />
        </div>
    );
}
