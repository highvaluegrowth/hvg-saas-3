import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth } from '@/lib/firebase/admin';
import { appUserService } from '@/features/appUser/services/appUserService';
import { CreateAppUserSchema } from '@/features/appUser/schemas/appUser.schemas';

export const dynamic = 'force-dynamic';


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

    let userRecord;
    let isExisting = false;

    try {
      userRecord = await adminAuth.getUserByEmail(email);
      isExisting = true;
    } catch {
      // Create Firebase Auth user
      userRecord = await adminAuth.createUser({ email, password, displayName });
    }

    // Only set resident role claim if account has no role at all
    const claims = (await adminAuth.getUser(userRecord.uid)).customClaims || {};
    if (!claims.role) {
      await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'resident' });
    }

    // Find or Create /users/{uid} document
    let appUser = await appUserService.getByUid(userRecord.uid);
    if (!appUser) {
      appUser = await appUserService.create(userRecord.uid, {
        email,
        displayName,
        photoURL,
        role: claims.role as string | undefined || 'resident',
        permissions: claims.permissions as string[] | undefined || [],
      });
    }

    return NextResponse.json({ uid: userRecord.uid, appUser }, { status: isExisting ? 200 : 201 });
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
