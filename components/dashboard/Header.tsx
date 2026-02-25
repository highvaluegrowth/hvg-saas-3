'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { authService } from '@/features/auth/services/authService';

interface HeaderProps {
  tenantName?: string;
  onMenuClick?: () => void;
}

export function Header({ tenantName, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Left side - Mobile menu + Tenant name */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Tenant name */}
        {tenantName && (
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-gray-900">{tenantName}</h1>
          </div>
        )}
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center space-x-4">
        {/* Notifications button (placeholder) */}
        <button className="text-gray-400 hover:text-gray-600 relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {/* Notification badge (example) */}
          {/* <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" /> */}
        </button>

        {/* User dropdown (simplified - just logout for now) */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.displayName || user?.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-sm"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
