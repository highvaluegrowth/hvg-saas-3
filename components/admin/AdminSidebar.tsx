'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Building2,
    BugPlay,
    GraduationCap,
    CalendarDays,
    CircleDollarSign,
    Activity,
    ServerCrash
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

const adminLinks = [
    { href: '/admin/tenants', label: 'Tenants', icon: Building2 },
    { href: '/admin/qa', label: 'QA Feedback', icon: BugPlay },
    { href: '/admin/courses', label: 'Courses', icon: GraduationCap },
    { href: '/admin/events', label: 'Events', icon: CalendarDays },
    { href: '/admin/financials', label: 'Financials', icon: CircleDollarSign },
    { href: '/admin/reporting', label: 'Reporting', icon: Activity },
    { href: '/admin/system', label: 'System Health', icon: ServerCrash },
];

interface AdminSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
    const pathname = usePathname();
    const { user } = useAuth();

    const isActiveRoute = (href: string) => {
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed inset-y-0 left-0 z-30
          transition-all duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          w-64
        `}
                style={{
                    background: '#060E1A',
                    borderRight: '1px solid rgba(255,255,255,0.07)',
                }}
            >
                <div className="flex flex-col h-full">

                    {/* Logo */}
                    <div
                        className={`flex items-center h-16 px-6 justify-between`}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                    >
                        <Link href={`/admin`} className="flex items-center space-x-2">
                            <div
                                className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-cyan-600"
                            >
                                <span className="text-white font-bold text-sm">HVG</span>
                            </div>
                            <span className="font-semibold truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
                                SuperAdmin
                            </span>
                        </Link>

                        {/* Mobile close */}
                        <button
                            onClick={onClose}
                            className="lg:hidden transition-colors"
                            style={{ color: 'rgba(255,255,255,0.4)' }}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
                        {adminLinks.map((item) => {
                            const isActive = isActiveRoute(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                    flex items-center rounded-lg text-sm font-medium
                    transition-colors duration-150 px-3 py-2.5
                  `}
                                    style={{
                                        background: isActive ? 'rgba(8,145,178,0.15)' : 'transparent',
                                        color: isActive ? '#67E8F9' : 'rgba(255,255,255,0.55)',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                                            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                                            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
                                        }
                                    }}
                                >
                                    <Icon className="shrink-0 w-5 h-5 mr-3" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User info */}
                    <div
                        className="p-4"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
                    >
                        <div className={`flex items-center`}>
                            <div
                                className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center cursor-pointer"
                                style={{ background: 'rgba(8,145,178,0.2)' }}
                            >
                                <span className="font-medium text-sm" style={{ color: '#67E8F9' }}>
                                    {user?.email?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                                    {user?.displayName || user?.email}
                                </p>
                                <p className="text-xs truncate capitalize" style={{ color: '#0891B2' }}>
                                    Super Admin
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
