import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb, FieldValue } from '@/lib/firebase/admin';
import type { UserRole } from '@/features/auth/types/auth.types';
import { notificationService } from '@/lib/firebase/notificationService';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedRoles: UserRole[] = ['tenant_admin', 'staff_admin', 'super_admin'];
    if (!allowedRoles.includes(token.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
    }

    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status'); // e.g. 'pending', 'assigned', 'accepted', 'rejected'
    const typeFilter = url.searchParams.get('type');     // e.g. 'bed', 'staff'

    let query = adminDb
      .collection('applications')
      .where('assignedTenantId', '==', tenantId) as FirebaseFirestore.Query;

    if (statusFilter) {
      query = query.where('status', '==', statusFilter);
    }
    if (typeFilter) {
      query = query.where('type', '==', typeFilter);
    }

    query = query.orderBy('submittedAt', 'desc');

    const snap = await query.get();

    const applications = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        submittedAt: d.submittedAt?.toDate?.()?.toISOString() ?? d.submittedAt ?? null,
        assignedAt: d.assignedAt?.toDate?.()?.toISOString() ?? d.assignedAt ?? null,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? d.createdAt ?? null,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? d.updatedAt ?? null,
      };
    });

    return NextResponse.json({ applications });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedRoles: UserRole[] = ['tenant_admin', 'staff_admin', 'super_admin'];
    if (!allowedRoles.includes(token.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
    }

    const body = await request.json();
    const { applicationId, status, notes } = body as {
      applicationId: string;
      status: 'reviewing' | 'waitlisted' | 'accepted' | 'rejected';
      notes?: string;
    };

    if (!applicationId || !['reviewing', 'waitlisted', 'accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'applicationId and valid status required' }, { status: 400 });
    }

    // Verify the application belongs to this tenant
    const docRef = adminDb.collection('applications').doc(applicationId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    const data = snap.data()!;
    if (data.assignedTenantId !== tenantId) {
      return NextResponse.json({ error: 'Application not assigned to this tenant' }, { status: 403 });
    }

    const isWaitlisted = status === 'waitlisted';
    const isAccepted = status === 'accepted';
    let waitlistPosition = null;

    if (isWaitlisted) {
      const waitlistSnap = await adminDb.collection('applications')
        .where('assignedTenantId', '==', tenantId)
        .where('status', '==', 'waitlisted')
        .get();
      waitlistPosition = waitlistSnap.size + 1;
    }

    // 1. Update Application Status
    await docRef.update({
      status,
      notes: notes ?? data.notes ?? '',
      waitlistPosition: waitlistPosition,
      updatedAt: new Date().toISOString(),
    });

    // 2. Automated Contract Triggers
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    const settings = tenantDoc.data()?.stageContracts || {};
    const templateId = settings[status];

    if (templateId) {
        // Trigger contract creation (simplified - in a real app would use a service)
        const contractRef = adminDb.collection('contracts').doc();
        await contractRef.set({
            tenantId,
            residentName: data.applicantName,
            residentEmail: data.applicantEmail,
            templateId,
            status: 'pending',
            applicationId: docRef.id,
            createdAt: new Date().toISOString(),
        });
        
        // Send notification to mobile user via Inbox
        await notificationService.createNotification({
            tenantId,
            userId: data.applicantId,
            type: 'request',
            refId: contractRef.id,
            refCollection: 'contracts',
            title: 'Action Required: Sign Document',
            preview: `A new document needs your signature for your application.`,
            priority: 'high',
            metadata: { signingUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/sign/${contractRef.id}` }
        });
    }

    if (isWaitlisted) {
        await notificationService.createNotification({
            tenantId,
            userId: data.applicantId,
            type: 'system',
            refId: docRef.id,
            refCollection: 'applications',
            title: 'Waitlist Update',
            preview: `You have been added to the waitlist. Current position: ${waitlistPosition}.`,
            metadata: { position: waitlistPosition }
        });
    }

    // 3. Admission Sequence
    if (isAccepted) {
        const uid = data.applicantId;
        const now = new Date().toISOString();
        
        // A. Promote AppUser to Resident
        const residentId = `RES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await adminDb.collection('users').doc(uid).update({
            role: 'resident',
            residentId: residentId,
            updatedAt: now,
        });

        // B. Provision Resident Document (Clinical/Operational)
        await adminDb.collection(`tenants/${tenantId}/residents`).doc(uid).set({
            uid,
            residentId,
            name: data.applicantName,
            email: data.applicantEmail,
            status: 'active',
            admittedAt: now,
            houseId: data.requestedHouseId || null,
        });

        // C. Auto-Enroll in Welcome Course & House Rules
        // Fetch universal or tenant-specific welcome courses
        const coursesSnap = await adminDb.collection(`tenants/${tenantId}/courses`)
            .where('isAutoEnroll', '==', true)
            .get();
        
        const batch = adminDb.batch();
        coursesSnap.forEach(course => {
            const enrollmentRef = adminDb.collection(`tenants/${tenantId}/enrollments`).doc();
            batch.set(enrollmentRef, {
                courseId: course.id,
                userId: uid,
                status: 'active',
                progress: 0,
                enrolledAt: now,
            });
        });
        await batch.commit();

        // D. Add to House Group Chat
        if (data.requestedHouseId) {
            const chatSnap = await adminDb.collection('chats')
                .where('type', '==', 'house')
                .where('metadata.houseId', '==', data.requestedHouseId)
                .limit(1)
                .get();
            
            if (!chatSnap.empty) {
                const chatId = chatSnap.docs[0].id;
                await adminDb.collection('chats').doc(chatId).update({
                    participants: FieldValue.arrayUnion(uid),
                    updatedAt: now,
                });
            }
        }
    }

    return NextResponse.json({ success: true, status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
