import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb as db, FieldValue } from '@/lib/firebase/admin';
import type { ApplicationType } from '@/features/applications/types';
import { notificationService } from '@/lib/firebase/notificationService';

export const dynamic = 'force-dynamic';


const VALID_TYPES: ApplicationType[] = ['bed', 'staff', 'course', 'event', 'tenant'];

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ type: string }> }
) {
    try {
        const { type } = await params;

        if (!VALID_TYPES.includes(type as ApplicationType)) {
            return NextResponse.json({ error: 'Invalid application type' }, { status: 400 });
        }

        // Applications can be submitted without an account (public),
        // but if a token is present we use it to associate the applicant.
        let applicantId = 'anonymous';
        let tokenName: string | undefined;
        let tokenEmail: string | undefined;

        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            try {
                const token = await verifyAuthToken(request);
                applicantId = token.uid;
                tokenName = token.name as string | undefined;
                tokenEmail = token.email as string | undefined;
            } catch {
                // unauthenticated submission allowed
            }
        }

        const body = await request.json();
        const now = new Date().toISOString();
        const docRef = db.collection('applications').doc();

        const application = {
            id: docRef.id,
            type,
            status: 'pending_triage',
            applicantId,
            userId: applicantId !== 'anonymous' ? applicantId : null,
            tenantId: null,
            requestedTenantId: body.requestedTenantId ?? null,
            requestedHouseId: body.requestedHouseId ?? null,
            applicantName: tokenName ?? body.applicantName ?? '',
            applicantEmail: tokenEmail ?? body.applicantEmail ?? '',
            zipCode: body.zipCode ?? '',
            submittedAt: now,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            data: body.data ?? {},
        };

        // We use set directly. To return the client a Date string, we could override createdAt/updatedAt
        // but for now returning FieldValue is fine or we can omit it from the response.

        await docRef.set(application);

        // Notify all super_admins when a new tenant application arrives
        // Also spawn an application_thread conversation if applicant is authenticated
        let threadAdminUids: string[] = [];
        let threadTenantId: string | null = null;

        if (type === 'tenant') {
            const superAdminsSnap = await db.collection('users')
                .where('role', '==', 'super_admin')
                .limit(10)
                .get();

            threadAdminUids = superAdminsSnap.docs.map(d => d.id);
            threadTenantId = null;

            await Promise.all(superAdminsSnap.docs.map((userDoc) =>
                notificationService.createNotification({
                    tenantId: userDoc.id,
                    userId: userDoc.id,
                    type: 'application',
                    title: 'New Tenant Application',
                    preview: `${application.applicantName || 'New applicant'} — review in Tenant Approvals.`,
                    refId: docRef.id,
                    refCollection: 'applications',
                    priority: 'high',
                })
            ));
        }

        // Notify the facility's admins when a bed or staff application targets their tenant
        if ((type === 'bed' || type === 'staff') && application.requestedTenantId) {
            const facilityAdminsSnap = await db.collection('users')
                .where('tenantId', '==', application.requestedTenantId)
                .where('role', 'in', ['tenant_admin', 'staff_admin'])
                .limit(20)
                .get();

            threadAdminUids = facilityAdminsSnap.docs.map(d => d.id);
            threadTenantId = application.requestedTenantId;

            const typeLabel = type === 'bed' ? 'Bed' : 'Staff';
            await Promise.all(facilityAdminsSnap.docs.map((userDoc) =>
                notificationService.createNotification({
                    tenantId: application.requestedTenantId!,
                    userId: userDoc.id,
                    type: 'application',
                    title: `New ${typeLabel} Application`,
                    preview: `${application.applicantName || 'New applicant'} — review in Applications.`,
                    refId: docRef.id,
                    refCollection: 'applications',
                    priority: 'high',
                })
            ));
        }

        // Spawn an application_thread conversation for direct messaging
        // Only when applicant is authenticated (has a real UID) and admins were found
        if (applicantId !== 'anonymous' && threadAdminUids.length > 0) {
            try {
                const threadRef = db.collection('conversations').doc();
                await threadRef.set({
                    id: threadRef.id,
                    type: 'application_thread',
                    participants: [applicantId, ...threadAdminUids],
                    tenantId: threadTenantId,
                    title: `Application: ${application.applicantName || 'Applicant'}`,
                    lastMessage: null,
                    updatedAt: new Date(),
                    metadata: { applicationId: docRef.id, applicationType: type },
                });
                await docRef.update({ threadId: threadRef.id });
            } catch (threadErr) {
                console.error('Failed to create application thread:', threadErr);
                // Non-blocking — application was already created
            }
        }

        return NextResponse.json({ applicationId: docRef.id, application }, { status: 201 });
    } catch (error) {
        console.error('POST /api/applications/[type]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
