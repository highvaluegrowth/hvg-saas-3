import { NextRequest, NextResponse } from 'next/server';
import { verifyResidentToken } from '@/lib/middleware/residentAuthMiddleware';
import { appUserService } from '@/features/appUser/services/appUserService';
import { UpdateAppUserSchema } from '@/features/appUser/schemas/appUser.schemas';

export async function GET(request: NextRequest) {
  try {
    const { appUser } = await verifyResidentToken(request);
    return NextResponse.json({ user: appUser });
  } catch (error: unknown) {
    const e = error as { message?: string; statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { uid } = await verifyResidentToken(request);
    const body = await request.json();
    const parsed = UpdateAppUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    await appUserService.update(uid, parsed.data);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const e = error as { message?: string; statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}
