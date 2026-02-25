import { UserRole } from '@/features/auth/types/auth.types';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  tenantId?: string;
  role?: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
