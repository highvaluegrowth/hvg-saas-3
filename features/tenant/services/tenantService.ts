import { adminDb } from '@/lib/firebase/admin';
import { BaseRepository } from '@/lib/firestore';
import { Tenant, CreateTenantInput, TenantWithAdmin } from '../types/tenant.types';
import { setCustomClaims } from '@/features/auth/services/customClaimsService';

/**
 * Tenant repository for managing organizations
 * Note: Unlike domain repositories, this is NOT tenant-scoped since tenants
 * themselves are top-level entities
 */
class TenantService extends BaseRepository<Tenant> {
  constructor() {
    super(adminDb, 'tenants');
  }

  /**
   * Creates a new tenant with default settings
   * @param input - Tenant creation data
   * @returns Created tenant
   */
  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    // Check if slug is already taken
    const existing = await this.query({
      where: [{ field: 'slug', operator: '==', value: input.slug }],
      limit: 1,
    });

    if (existing.items.length > 0) {
      throw new Error('Tenant slug already exists');
    }

    // Create tenant with default settings
    const tenant = await this.create({
      name: input.name,
      slug: input.slug,
      ownerId: input.ownerId,
      status: 'trial',
      settings: {
        allowMultipleHouses: true,
        requireIncidentReview: true,
        maxResidents: 100,
        timezone: 'America/New_York',
      },
      subscription: {
        plan: 'free',
        status: 'active',
      },
    });

    return tenant;
  }

  /**
   * Creates a tenant and sets the owner's custom claims
   * @param input - Tenant creation data
   * @returns Tenant with admin user ID
   */
  async createTenantWithAdmin(input: CreateTenantInput): Promise<TenantWithAdmin> {
    // Create the tenant
    const tenant = await this.createTenant(input);

    // Set custom claims for the owner
    await setCustomClaims(input.ownerId, {
      tenant_id: tenant.id,
      role: 'tenant_admin',
    });

    return {
      tenant,
      adminUid: input.ownerId,
    };
  }

  /**
   * Gets a tenant by slug
   * @param slug - Tenant slug
   * @returns Tenant or null if not found
   */
  async getBySlug(slug: string): Promise<Tenant | null> {
    const result = await this.query({
      where: [{ field: 'slug', operator: '==', value: slug }],
      limit: 1,
    });

    return result.items[0] || null;
  }

  /**
   * Gets tenants owned by a specific user
   * @param ownerId - User ID
   * @returns Array of owned tenants
   */
  async getByOwnerId(ownerId: string): Promise<Tenant[]> {
    const result = await this.query({
      where: [{ field: 'ownerId', operator: '==', value: ownerId }],
    });

    return result.items;
  }

  /**
   * Updates tenant settings
   * @param tenantId - Tenant ID
   * @param settings - Partial settings to update
   */
  async updateSettings(
    tenantId: string,
    settings: Partial<Tenant['settings']>
  ): Promise<void> {
    const tenant = await this.getById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    await this.update(tenantId, {
      settings: {
        ...tenant.settings,
        ...settings,
      },
    });
  }

  /**
   * Updates tenant subscription
   * @param tenantId - Tenant ID
   * @param subscription - Subscription info
   */
  async updateSubscription(
    tenantId: string,
    subscription: Tenant['subscription']
  ): Promise<void> {
    await this.update(tenantId, { subscription });
  }

  /**
   * Suspends a tenant (sets status to suspended)
   * @param tenantId - Tenant ID
   */
  async suspend(tenantId: string): Promise<void> {
    await this.update(tenantId, { status: 'suspended' });
  }

  /**
   * Activates a tenant (sets status to active)
   * @param tenantId - Tenant ID
   */
  async activate(tenantId: string): Promise<void> {
    await this.update(tenantId, { status: 'active' });
  }
}

// Export singleton instance
export const tenantService = new TenantService();
