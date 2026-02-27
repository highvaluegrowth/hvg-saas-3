export type UserRole =
  | 'super_admin'
  | 'tenant_admin'
  | 'staff_admin'
  | 'staff'
  | 'resident';

export interface User {
  uid: string;
  email: string;
  displayName?: string | null;
  tenantId?: string;
  tenantIds?: string[];
  role?: UserRole;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName?: string;
}
