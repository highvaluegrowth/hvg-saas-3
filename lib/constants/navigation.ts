import { UserRole } from '@/features/auth/types/auth.types';

export interface NavigationItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[] | 'all';
  description?: string;
}

/**
 * Dashboard navigation items with role-based access control
 */
export const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '',
    icon: 'home',
    roles: 'all',
    description: 'Overview and quick stats',
  },
  {
    label: 'Houses',
    href: '/houses',
    icon: 'building',
    roles: ['tenant_admin', 'staff_admin', 'super_admin'],
    description: 'Manage recovery houses',
  },
  {
    label: 'Residents',
    href: '/residents',
    icon: 'users',
    roles: ['tenant_admin', 'staff_admin', 'staff'],
    description: 'Resident directory',
  },
  {
    label: 'Staff',
    href: '/staff',
    icon: 'user',
    roles: ['tenant_admin', 'staff_admin', 'super_admin'],
    description: 'Staff management',
  },
  {
    label: 'Events',
    href: '/events',
    icon: 'calendar',
    roles: 'all',
    description: 'Program events and activities',
  },
  {
    label: 'Vehicles',
    href: '/vehicles',
    icon: 'vehicle',
    roles: ['tenant_admin', 'staff_admin', 'staff', 'super_admin'],
    description: 'Fleet management',
  },
  {
    label: 'Transportation',
    href: '/rides',
    icon: 'map',
    roles: 'all',
    description: 'Rides and transportation',
  },
  {
    label: 'Chores',
    href: '/chores',
    icon: 'clipboard',
    roles: ['tenant_admin', 'staff_admin', 'staff', 'super_admin'],
    description: 'House chores and tasks',
  },
  {
    label: 'Incidents',
    href: '/incidents',
    icon: 'alert',
    roles: 'all',
    description: 'Incident reports',
  },
  {
    label: 'Join Requests',
    href: '/join-requests',
    icon: 'inbox',
    roles: ['tenant_admin', 'staff_admin', 'super_admin'],
    description: 'Resident join requests from the mobile app',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: 'settings',
    roles: ['tenant_admin', 'super_admin'],
    description: 'Organization settings',
  },
  {
    label: 'Courses',
    href: '/lms',
    icon: 'book',
    roles: ['tenant_admin', 'super_admin'],
    description: 'Course builder and LMS',
  },
];

/**
 * Filters navigation items based on user role
 */
export function getNavigationForRole(role?: UserRole): NavigationItem[] {
  if (!role) return [];

  return navigationItems.filter((item) => {
    if (item.roles === 'all') return true;
    return item.roles.includes(role);
  });
}

/**
 * Icon name to SVG path mapping
 */
export const iconPaths: Record<string, string> = {
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  alert: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  vehicle: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
  map: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  inbox: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
  book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
};
