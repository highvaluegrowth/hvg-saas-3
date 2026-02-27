import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { tenantService } from '@/features/tenant/services/tenantService';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tenantId } = await params;
        const updates = await request.json();

        const tenant = await tenantService.getById(tenantId);
        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        if (token.tenant_id !== tenantId && token.role !== 'super_admin' && tenant.ownerId !== token.uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await tenantService.update(tenantId, updates);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PATCH /api/tenants/[tenantId]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
