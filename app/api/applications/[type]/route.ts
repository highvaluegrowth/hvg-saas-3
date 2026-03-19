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
        if (type === 'tenant') {
            const superAdminsSnap = await db.collection('users')
                .where('role', '==', 'super_admin')
                .limit(10)
                .get();

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

        return NextResponse.json({ applicationId: docRef.id, application }, { status: 201 });
    } catch (error) {
        console.error('POST /api/applications/[type]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
