import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { tenantService } from '@/features/tenant/services/tenantService';
import { getAdminAuth } from '@/lib/firebase/admin';

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

        const tenant = await tenantService.getById(tenantId);
        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // 1. Update tenant status in Firestore
        await tenantService.update(tenantId, { status: 'approved' });

        // 2. Set custom claims on the owner's Firebase Auth token
        //    so their JWT reflects the approved tenantId immediately
        const adminAuth = getAdminAuth();
        const ownerRecord = await adminAuth.getUser(tenant.ownerId);
        const existingClaims = ownerRecord.customClaims ?? {};

        await adminAuth.setCustomUserClaims(tenant.ownerId, {
            ...existingClaims,
            tenant_id: tenantId,
            role: existingClaims.role ?? 'admin', // keep existing or default to admin
        });

        return NextResponse.json({ success: true, tenantId, status: 'approved' });
    } catch (error) {
        console.error('POST /api/admin/tenants/[tenantId]/approve:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
