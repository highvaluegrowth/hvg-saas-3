import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { appUserService } from '@/features/appUser/services/appUserService';
import { adminDb } from '@/lib/firebase/admin';
import { canWrite } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';

type Params = Promise<{ tenantId: string; residentId: string }>;

const LinkUserSchema = z.object({
  email: z.string().email('Valid email required'),
});

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId, residentId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!canWrite(token.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = LinkUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Verify the resident exists
    const residentDoc = await adminDb.collection('residents').doc(residentId).get();
    if (!residentDoc.exists) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
    }

    // Find app user by email
    const appUser = await appUserService.getByEmail(parsed.data.email);
    if (!appUser) {
      return NextResponse.json(
        { error: 'No app user found with that email. Ask the resident to download the app and register first.' },
        { status: 404 }
      );
    }

    // Link both directions
    // Use adminDb directly for firebaseUid since it's not in CreateResidentInput
    await Promise.all([
      adminDb.collection('residents').doc(residentId).update({
        firebaseUid: appUser.uid,
        updatedAt: new Date(),
      }),
      appUserService.linkResident(appUser.uid, residentId),
    ]);

    return NextResponse.json({ success: true, linkedUid: appUser.uid });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
