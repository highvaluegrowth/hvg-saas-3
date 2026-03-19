import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb as db } from '@/lib/firebase/admin';
import { notificationService } from '@/lib/firebase/notificationService';

export const dynamic = 'force-dynamic';


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
            status: 'assigned_to_tenant',
            assignedTenantId: tenantId,
            tenantId: tenantId, // Assigns the app to the tenant for security rules
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
                applicantName: appData.applicantName || null,
                applicantEmail: appData.applicantEmail || null,
                assignedAt: now,
                status: 'assigned_to_tenant',
            });

        // Notify the tenant admin that a new application has been assigned to them
        await notificationService.createNotification({
            tenantId: tenantId,
            userId: tenantId,
            type: 'application',
            title: 'New Application Assigned',
            preview: `${appData.applicantName || 'An applicant'} — review in Applications.`,
            refId: applicationId,
            refCollection: 'applications',
            priority: 'high',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('POST /api/admin/applications/[applicationId]/assign:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
