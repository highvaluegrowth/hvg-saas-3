'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { getNavigationForRole, iconPaths } from '@/lib/constants/navigation';
import { LogOut } from 'lucide-react';

interface SidebarProps {
  tenantId: string;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ tenantId, isOpen = true, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  const navigationItems = getNavigationForRole(user?.role);

  const isActiveRoute = (href: string) => {
    const fullPath = `/${tenantId}${href}`;
    if (href === '') {
      return pathname === `/${tenantId}` || pathname === `/${tenantId}/dashboard`;
    }
    return pathname.startsWith(fullPath);
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
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
        style={{
          background: '#060E1A',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex flex-col h-full">

          {/* Logo */}
          <div
            className={`flex items-center h-16 px-6 ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <Link href={`/${tenantId}`} className="flex items-center space-x-2">
              <div
                className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0891B2, #0e7490)' }}
              >
                <span className="text-white font-bold text-sm">HVG</span>
              </div>
              {!isCollapsed && (
                <span className="font-semibold truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  High Value Growth
                </span>
              )}
            </Link>

            {/* Mobile close */}
            {!isCollapsed && (
              <button
                onClick={onClose}
                className="lg:hidden transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Org Switcher */}
          {user?.tenantIds && user.tenantIds.length > 1 && !isCollapsed && (
            <div
              className="px-4 py-3"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <label
                className="block text-xs font-medium uppercase tracking-wider mb-2"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                Organization
              </label>
              <div className="relative">
                <select
                  value={tenantId}
                  onChange={(e) => {
                    const newTenantId = e.target.value;
                    const currentPathWithoutTenant = pathname.replace(`/${tenantId}`, '');
                    window.location.href = `/${newTenantId}${currentPathWithoutTenant}`;
                  }}
                  className="block w-full pl-3 pr-10 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  {user.tenantIds.map((tid) => (
                    <option key={tid} value={tid} style={{ background: '#0C1A2E' }}>
                      {tid}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              const href = `/${tenantId}${item.href === '' ? '' : item.href}`;

              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`
                    flex items-center rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${isCollapsed ? 'justify-center py-3 px-2' : 'px-3 py-2.5'}
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
                  onClick={onClose}
                  title={isCollapsed ? item.label : undefined}
                >
                  <svg
                    className={`shrink-0 w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: isActive ? '#67E8F9' : 'rgba(255,255,255,0.4)' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={iconPaths[item.icon]}
                    />
                  </svg>
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div
            className="p-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
              <div
                className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center cursor-pointer"
                style={{ background: 'rgba(8,145,178,0.2)' }}
              >
                <span className="font-medium text-sm" style={{ color: '#67E8F9' }}>
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              {!isCollapsed && (
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {user?.displayName || user?.email}
                  </p>
                  <p className="text-xs truncate capitalize" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
              )}

              {!isCollapsed && (
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 ml-2 shrink-0 rounded-lg transition-colors hover:bg-white/5"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Collapse Toggle */}
          <div
            className="hidden lg:flex p-2 justify-end"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; }}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                className="w-5 h-5 transition-transform duration-300"
                style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

        </div>
      </aside>
    </>
  );
}
