'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getNavigationForRole, iconPaths } from '@/lib/constants/navigation';

interface SidebarProps {
  tenantId: string;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ tenantId, isOpen = true, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navigationItems = getNavigationForRole(user?.role);

  const isActiveRoute = (href: string) => {
    const fullPath = `/${tenantId}${href}`;
    if (href === '') {
      // Dashboard home - exact match
      return pathname === `/${tenantId}` || pathname === `/${tenantId}/dashboard`;
    }
    return pathname.startsWith(fullPath);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center h-16 px-6 border-b border-gray-200 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <Link href={`/${tenantId}`} className="flex items-center space-x-2">
              <div className="w-8 h-8 flex-shrink-0 bg-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">HVG</span>
              </div>
              {!isCollapsed && <span className="font-semibold text-gray-900 truncate">High Value Growth</span>}
            </Link>

            {/* Mobile close button */}
            {!isCollapsed && (
              <button
                onClick={onClose}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Organization Switcher (Only for multi-tenant operators) */}
          {user?.tenantIds && user.tenantIds.length > 1 && !isCollapsed && (
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Organization
              </label>
              <div className="relative">
                <select
                  value={tenantId}
                  onChange={(e) => {
                    const newTenantId = e.target.value;
                    // Keep the user on the same sub-path, just change the tenant
                    const currentPathWithoutTenant = pathname.replace(`/${tenantId}`, '');
                    window.location.href = `/${newTenantId}${currentPathWithoutTenant}`;
                  }}
                  className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 rounded-md shadow-sm bg-white"
                >
                  {user.tenantIds.map((tid) => (
                    <option key={tid} value={tid}>
                      {tid}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
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
                    ${isCollapsed ? 'justify-center py-3' : 'px-3 py-2'}
                    ${isActive
                      ? 'bg-cyan-50 text-cyan-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  onClick={onClose}
                  title={isCollapsed ? item.label : undefined}
                >
                  <svg
                    className={`flex-shrink-0 w-5 h-5 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-cyan-600' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
          <div className="p-4 border-t border-gray-200">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 flex-shrink-0 bg-cyan-100 rounded-full flex items-center justify-center cursor-pointer">
                <span className="text-cyan-600 font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              {!isCollapsed && (
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.displayName || user?.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate capitalize">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Collapse Toggle */}
          <div className="hidden lg:flex p-2 border-t border-gray-200 justify-end">
            <button
              onClick={onToggleCollapse}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg className="w-5 h-5 transition-transform duration-300" style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

