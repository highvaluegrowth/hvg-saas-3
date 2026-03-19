import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { tenantService } from '@/features/tenant/services/tenantService';

export const dynamic = 'force-dynamic';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  let token;
  try {
    token = await verifyAuthToken(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tenantId } = await params;

    let tenant = await tenantService.getById(tenantId);

    // If not found by ID, try looking up by slug for vanity URLs
    if (!tenant) {
      tenant = await tenantService.getBySlug(tenantId);
    }

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Allow super_admin, the tenant's own members, or the draft owner
    if (token.role !== 'super_admin' && token.tenant_id !== tenantId && tenant.ownerId !== token.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('GET /api/tenants/[tenantId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  let token;
  try {
    token = await verifyAuthToken(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tenantId } = await params;
    const updates = await request.json();

    let tenant = await tenantService.getById(tenantId);
    if (!tenant) {
      tenant = await tenantService.getBySlug(tenantId);
    }

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (token.role !== 'super_admin' && token.tenant_id !== tenantId && tenant.ownerId !== token.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await tenantService.update(tenantId, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/tenants/[tenantId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
