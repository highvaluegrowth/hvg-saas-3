import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await params;

    // Ensure user has access to this tenant
    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const data = tenantDoc.data() ?? {};
    const dir = data.directory ?? {};

    const profile = {
      listed: dir.listed ?? false,
      bio: dir.bio ?? '',
      logoUrl: dir.logoUrl ?? '',
      website: dir.website ?? '',
      specializations: dir.specializations ?? [],
      amenities: dir.amenities ?? [],
      acceptedFunding: dir.acceptedFunding ?? [],
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('GET /api/tenants/[tenantId]/directory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await params;

    if (token.role !== 'tenant_admin' && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden — tenant_admin role required' }, { status: 403 });
    }

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json() as {
      listed?: boolean;
      bio?: string;
      logoUrl?: string;
      website?: string;
      specializations?: string[];
      amenities?: string[];
      acceptedFunding?: string[];
    };

    // Build dot-notation update to avoid overwriting sibling directory fields
    const updates: Record<string, unknown> = {};
    const allowed = ['listed', 'bio', 'logoUrl', 'website', 'specializations', 'amenities', 'acceptedFunding'] as const;
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[`directory.${key}`] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    await adminDb.collection('tenants').doc(tenantId).update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/tenants/[tenantId]/directory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
