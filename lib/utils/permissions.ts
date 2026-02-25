import type { UserRole } from '@/features/auth/types/auth.types';

const ROLE_HIERARCHY: UserRole[] = [
  'resident',
  'staff',
  'staff_admin',
  'tenant_admin',
  'super_admin',
];

export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

export function hasMinimumRole(userRole: UserRole, min: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(min);
}

/** staff_admin+ can create/edit most resources */
export function canWrite(role: UserRole): boolean {
  return hasMinimumRole(role, 'staff_admin');
}

/** tenant_admin+ can manage staff and houses */
export function canManageStaff(role: UserRole): boolean {
  return hasMinimumRole(role, 'tenant_admin');
}

/** staff+ can read and report incidents */
export function canReadAll(role: UserRole): boolean {
  return hasMinimumRole(role, 'staff');
}
