import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { tenantService } from '@/features/tenant/services/tenantService';
import { AuthError } from '@/lib/utils/errors';

/**
 * POST /api/tenants
 * Creates a new tenant organization
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const decodedToken = await verifyAuthToken(request);

    // Parse request body
    const body = await request.json();
    const { name, slug } = body;

    // Validation
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase, alphanumeric, hyphens only)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase alphanumeric with hyphens only' },
        { status: 400 }
      );
    }

    // Create tenant with the authenticated user as owner
    const result = await tenantService.createTenantWithAdmin({
      name,
      slug,
      ownerId: decodedToken.uid,
    });

    return NextResponse.json(
      {
        success: true,
        tenant: result.tenant,
        message: 'Tenant created successfully. Please refresh your session to apply new permissions.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating tenant:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error.message === 'Tenant slug already exists') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tenants
 * Gets tenants for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const decodedToken = await verifyAuthToken(request);

    // Super admins can see all tenants
    let tenants;
    if (decodedToken.role === 'super_admin') {
      tenants = await tenantService.getAll();
    } else {
      // Regular users see only their owned tenants
      tenants = await tenantService.getByOwnerId(decodedToken.uid);
    }

    return NextResponse.json({ tenants });
  } catch (error: any) {
    console.error('Error fetching tenants:', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}
