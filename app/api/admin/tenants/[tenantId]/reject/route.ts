import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { tenantService } from '@/features/tenant/services/tenantService';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);

        if (token.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { tenantId } = await params;
        const body = await request.json().catch(() => ({}));
        const reason: string = body.reason ?? '';

        const tenant = await tenantService.getById(tenantId);
        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        await tenantService.update(tenantId, {
            status: 'rejected',
            ...(reason && { rejectionReason: reason }),
        });

        return NextResponse.json({ success: true, tenantId, status: 'rejected' });
    } catch (error) {
        console.error('POST /api/admin/tenants/[tenantId]/reject:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
