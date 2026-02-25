import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth } from '@/lib/firebase/admin';
import { appUserService } from '@/features/appUser/services/appUserService';
import { CreateAppUserSchema } from '@/features/appUser/schemas/appUser.schemas';

const RegisterSchema = CreateAppUserSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password, displayName, photoURL } = parsed.data;

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({ email, password, displayName });

    // Set resident role claim (no tenant_id — enrollment-based)
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'resident' });

    // Create /users/{uid} document
    const appUser = await appUserService.create(userRecord.uid, { email, displayName, photoURL });

    return NextResponse.json({ uid: userRecord.uid, appUser }, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'auth/email-already-exists'
    ) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
