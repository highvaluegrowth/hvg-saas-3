'use client';

import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { useAISidebarStore } from '@/lib/stores/aiSidebarStore';
import { useInboxStore } from '@/lib/stores/inboxStore';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import {
    Calendar,
    Layout, // Kanban
    Settings,
    Inbox,
    Menu,
    Bug,
} from 'lucide-react';

interface GlobalNavbarProps {
    tenantName?: string;
    onMenuClick?: () => void;
}

export function GlobalNavbar({ tenantName, onMenuClick }: GlobalNavbarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const tenantId = params.tenantId as string;
    const { user } = useAuth();
    const { isOpen, setOpen } = useAISidebarStore();
    const { unreadCount } = useInboxStore();

    const handleLogout = async () => {
        await authService.logout();
        router.push('/login');
    };

    const isAdminRoute = pathname?.startsWith('/admin');
    const navLinks = isAdminRoute ? [
        { name: 'Calendar', href: `/admin/events`, icon: Calendar, roles: ['super_admin'] },
        { name: 'Kanban', href: `/admin/kanban`, icon: Layout, roles: ['super_admin'] },
        { name: 'Inbox', href: `/admin/inbox`, icon: Inbox, badge: unreadCount, roles: ['super_admin'] },
        { name: 'Settings', href: `/admin/system`, icon: Settings, roles: ['super_admin'] },
    ] : [
        { name: 'Calendar', href: `/${tenantId}/events`, icon: Calendar, roles: ['all'] },
        { name: 'Kanban', href: `/${tenantId}/kanban`, icon: Layout, roles: ['tenant_admin', 'staff_admin', 'super_admin'] },
        { name: 'Inbox', href: `/${tenantId}/inbox`, icon: Inbox, badge: unreadCount, roles: ['tenant_admin', 'staff_admin', 'super_admin'] },
        { name: 'Settings', href: `/${tenantId}/settings`, icon: Settings, roles: ['tenant_admin', 'super_admin'] },
    ];

    const filteredNavLinks = navLinks.filter(link => {
        if (!user?.role) return false;
        if (link.roles.includes('all')) return true;
        return link.roles.includes(user.role);
    });

    return (
        <header
            style={{
                background: 'rgba(6,14,26,0.92)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
            className="h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40 transition-all duration-300"
        >
            {/* Left Section: Mobile Menu Toggle, Tenant Name & Global Search */}
            <div className="flex items-center space-x-4 flex-1">
                <button
                    onClick={onMenuClick}
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                    className="lg:hidden hover:text-white focus:outline-none transition-colors"
                    title="Open Menu"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {tenantName && (
                    <div className="hidden lg:block shrink-0 mr-2">
                        <h1 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                            {tenantName}
                        </h1>
                    </div>
                )}

                <div className="hidden sm:block w-full max-w-sm xl:max-w-md">
                    <GlobalSearch />
                </div>
            </div>

            {/* Center/Right Section: Icon Links & Profile */}
            <div className="flex items-center space-x-2 shrink-0">

                {/* Quick Links */}
                <nav className="hidden md:flex items-center space-x-1 mr-2">
                    {filteredNavLinks.map((link) => {
                        const isActive = pathname?.startsWith(link.href);
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="relative p-2 rounded-lg flex items-center justify-center transition-colors group"
                                style={{
                                    color: isActive
                                        ? (isAdminRoute ? '#D946EF' : '#67E8F9')
                                        : 'rgba(255,255,255,0.45)',
                                    background: isActive
                                        ? (isAdminRoute ? 'rgba(217,70,239,0.1)' : 'rgba(8,145,178,0.1)')
                                        : 'transparent',
                                }}
                                title={link.name}
                            >
                                <Icon className={`w-5 h-5 transition-colors ${isAdminRoute ? 'group-hover:text-fuchsia-400' : 'group-hover:text-cyan-400'}`} />
                                {link.badge && link.badge > 0 ? (
                                    <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse ${isAdminRoute ? 'bg-fuchsia-500' : 'bg-cyan-500'}`} />
                                ) : null}
                            </Link>
                        );
                    })}
                </nav>

                {/* Divider */}
                <span
                    className="hidden md:block h-5 mx-1"
                    style={{ width: 1, background: 'rgba(255,255,255,0.1)' }}
                />

                {/* AI Sidebar Toggle */}
                <button
                    onClick={() => setOpen(!isOpen)}
                    data-ai-toggle
                    title="Toggle AI Assistant"
                    style={{
                        color: isOpen
                            ? (isAdminRoute ? '#D946EF' : '#67E8F9')
                            : 'rgba(255,255,255,0.45)'
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:text-white transition-colors ml-1"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                    </svg>
                </button>

                {/* Divider */}
                <span
                    className="hidden md:block h-5 mx-1"
                    style={{ width: 1, background: 'rgba(255,255,255,0.1)' }}
                />

                {/* SuperAdmin QA Link */}
                {user?.role === 'super_admin' && (
                    <Link
                        href="/admin/qa"
                        title="SuperAdmin: QA Feedback"
                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:text-white transition-colors hover:bg-white/5"
                        style={{
                            color: pathname === '/admin/qa' ? '#D946EF' : 'rgba(255,255,255,0.45)',
                        }}
                    >
                        <Bug className="w-5 h-5" />
                    </Link>
                )}

                {/* User Profile & Logout */}
                <div className="flex items-center space-x-3 pl-1">
                    <div className="hidden lg:block text-right">
                        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                            {user?.displayName || user?.email || 'User'}
                        </p>
                        <p className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {user?.role?.replace('_', ' ')}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
                        style={{
                            color: 'rgba(255,255,255,0.55)',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}
