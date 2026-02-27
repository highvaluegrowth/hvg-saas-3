export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  status: TenantStatus;
  settings: TenantSettings;
  subscription?: SubscriptionInfo;
  createdAt: Date;
  updatedAt: Date;
}

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'inactive' | 'pending' | 'approved' | 'rejected';

export interface TenantSettings {
  allowMultipleHouses: boolean;
  requireIncidentReview: boolean;
  maxResidents?: number;
  timezone: string;
}

export interface SubscriptionInfo {
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due';
  currentPeriodEnd?: Date;
}

export interface TenantMember {
  userId: string;
  tenantId: string;
  role: import('../../auth/types/auth.types').UserRole;
  addedAt: Date;
}

/**
 * Tenant creation input
 */
export interface CreateTenantInput {
  name: string;
  slug: string;
  ownerId: string;
}

/**
 * Tenant with admin user info
 */
export interface TenantWithAdmin {
  tenant: Tenant;
  adminUid: string;
}
