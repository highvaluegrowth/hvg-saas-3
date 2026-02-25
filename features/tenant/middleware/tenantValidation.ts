import { adminAuth } from '@/lib/firebase/admin';
import { TenantError } from '@/lib/utils/errors';

export async function validateTenantAccess(
  token: string,
  tenantId: string
): Promise<boolean> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Super admins can access any tenant
    if (decodedToken.role === 'super_admin') {
      return true;
    }

    // Other users must match tenant_id
    if (decodedToken.tenant_id !== tenantId) {
      throw new TenantError('Unauthorized access to tenant');
    }

    return true;
  } catch (error) {
    throw new TenantError('Invalid tenant access');
  }
}
