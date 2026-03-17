import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb as db, adminAuth } from '@/lib/firebase/admin';
import { tenantOnboardingService } from '@/features/tenants/services/tenantOnboardingService';
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
        const docRef = db.collection('applications').doc(applicationId);
        const appSnap = await docRef.get();

        if (!appSnap.exists) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        const appData = appSnap.data()!;
        if (appData.type !== 'tenant') {
            return NextResponse.json({ error: 'Not a tenant application' }, { status: 400 });
        }

        const applicantUid = appData.applicantId;
        if (!applicantUid) {
            return NextResponse.json({ error: 'Applicant UID missing' }, { status: 400 });
        }

        // 1. Generate tenantId
        const tenantId = `org-${Math.random().toString(36).substring(2, 10)}`;
        const now = new Date().toISOString();

        // 2. Update Application Status
        await docRef.update({
            status: 'accepted',
            approvedTenantId: tenantId,
            updatedAt: now,
        });

        // 3. Create Tenant Document
        await db.collection('tenants').doc(tenantId).set({
            name: appData.data?.orgName || appData.applicantName + "'s Organization",
            status: 'active',
            ownerId: applicantUid,
            city: appData.zipCode || '', // Simplified zip-to-city
            createdAt: now,
            updatedAt: now,
        });

        // 4. Update User Role and Tenant Access
        await db.collection('users').doc(applicantUid).update({
            role: 'tenant_admin',
            tenantIds: db.FieldValue.arrayUnion(tenantId),
            updatedAt: now,
        });

        // Update Firebase Auth Custom Claims
        await adminAuth.setCustomUserClaims(applicantUid, {
            role: 'tenant_admin',
            tenantId: tenantId // Note: this simplifies to primary tenant for SaaS login
        });

        // 5. Seed Default Data (Checklist & Templates)
        await tenantOnboardingService.seedTenant(tenantId, applicantUid);

        // 6. Notify Applicant
        await notificationService.createNotification({
            tenantId: 'system',
            userId: applicantUid,
            type: 'system',
            refId: tenantId,
            refCollection: 'tenants',
            title: 'Organization Approved! 🎉',
            preview: 'Your organization has been approved. Welcome to High Value Growth!',
            priority: 'high',
            metadata: { tenantId }
        });

        // TODO: Trigger Welcome Email

        return NextResponse.json({ success: true, tenantId });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
