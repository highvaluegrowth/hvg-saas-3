import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb as db } from '@/lib/firebase/admin';
import { notificationService } from '@/lib/firebase/notificationService';

export const dynamic = 'force-dynamic';

type Params = Promise<{ applicationId: string }>;

export async function POST(request: NextRequest, { params }: { params: Params }) {
    try {
        const token = await verifyAuthToken(request);

        if (token.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { applicationId } = await params;
        const body = await request.json();
        const { reason, rectification } = body;

        if (!reason) {
            return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
        }

        const docRef = db.collection('applications').doc(applicationId);
        const appSnap = await docRef.get();

        if (!appSnap.exists) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        const appData = appSnap.data()!;

        await docRef.update({
            status: 'rejected',
            rejectionReason: reason,
            rectificationSteps: rectification || '',
            updatedAt: new Date().toISOString(),
        });

        // Notify the applicant
        if (appData.applicantId) {
            await notificationService.createNotification({
                tenantId: 'system',
                userId: appData.applicantId,
                type: 'system',
                refId: applicationId,
                refCollection: 'applications',
                title: 'Application Update',
                preview: `Your application has been reviewed. Status: Rejected. Reason: ${reason}`,
                priority: 'high',
                metadata: {
                    status: 'rejected',
                    reason,
                    rectification: rectification || ''
                }
            });
        }

        // TODO: Trigger Email to applicant with rectification steps

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
