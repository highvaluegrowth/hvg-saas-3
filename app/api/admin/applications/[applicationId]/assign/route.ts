import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb as db } from '@/lib/firebase/admin';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ applicationId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);

        if (token.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { applicationId } = await params;
        const { tenantId } = await request.json();

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }

        const appRef = db.collection('applications').doc(applicationId);
        const appDoc = await appRef.get();

        if (!appDoc.exists) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        const now = new Date().toISOString();
        const appData = appDoc.data()!;

        await appRef.update({
            status: 'assigned',
            assignedTenantId: tenantId,
            assignedAt: now,
            updatedAt: now,
        });

        // Mirror to tenant's assignedApplications sub-collection
        await db
            .collection('tenants')
            .doc(tenantId)
            .collection('assignedApplications')
            .doc(applicationId)
            .set({
                applicationId,
                type: appData.type,
                applicantName: appData.applicantName,
                applicantEmail: appData.applicantEmail,
                assignedAt: now,
                status: 'assigned',
            });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('POST /api/admin/applications/[applicationId]/assign:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
