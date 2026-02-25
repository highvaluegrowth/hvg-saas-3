import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import { createEnrollmentService } from '@/features/enrollments/services/enrollmentService';
import { canWrite } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';

type Params = Promise<{ tenantId: string; uid: string }>;

const ActionSchema = z.object({
  action: z.enum(['approve', 'deny']),
  residentId: z.string().optional(), // required when approving and app user has no residentId yet
});

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId, uid } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!canWrite(token.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const reqRef = adminDb
      .collection(`tenants/${tenantId}/joinRequests`)
      .doc(uid);
    const reqDoc = await reqRef.get();

    if (!reqDoc.exists) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 });
    }

    const reqData = reqDoc.data()!;

    if (parsed.data.action === 'deny') {
      await reqRef.update({ status: 'denied', updatedAt: new Date() });
      return NextResponse.json({ success: true, action: 'denied' });
    }

    // Approve: need a residentId to create enrollment
    const residentId = reqData.residentId ?? parsed.data.residentId;
    if (!residentId) {
      return NextResponse.json(
        {
          error:
            'residentId required. Link the app user to a resident record first via POST /api/tenants/{id}/residents/{id}/link-user, then approve.',
        },
        { status: 400 }
      );
    }

    // Create enrollment at waitlist status
    const enrollmentService = createEnrollmentService(tenantId);
    await enrollmentService.enroll({ residentId, status: 'waitlist', phase: 1 });
    await reqRef.update({ status: 'approved', updatedAt: new Date() });

    return NextResponse.json({ success: true, action: 'approved', residentId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
