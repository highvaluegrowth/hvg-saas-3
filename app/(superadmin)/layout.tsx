'use client';

// Legacy SuperAdmin layout — redirects /admin/* → /{tenantId}/superadmin/*
// The new unified dashboard (app/(dashboard)/[tenantId]/superadmin/) handles all SuperAdmin pages.

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function LegacySuperAdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (loading) return;
        if (!user) { router.push('/login'); return; }
        if (user.role !== 'super_admin') { router.push('/unauthorized'); return; }

        const tenantId = user.tenantId;
        if (!tenantId) return;

        // Map /admin/X → /{tenantId}/superadmin/X
        const newPath = pathname.replace(/^\/admin/, `/${tenantId}/superadmin`);
        if (newPath !== pathname) {
            router.replace(newPath);
        }
    }, [user, loading, router, pathname]);

    // Render loading spinner while redirecting
    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#0C1A2E' }}>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent" />
        </div>
    );
}
