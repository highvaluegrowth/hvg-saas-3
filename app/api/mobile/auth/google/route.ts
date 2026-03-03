import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { appUserService } from '@/features/appUser/services/appUserService';

/**
 * POST /api/mobile/auth/google
 *
 * Called after a successful Google Sign-In on the mobile client.
 * Verifies the Firebase ID token, then JIT-provisions the AppUser + resident
 * role claim if they don't already exist.
 *
 * This is safe to call on every Google sign-in — it's idempotent.
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
        }
        const idToken = authHeader.slice(7);

        let decodedToken: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
        try {
            decodedToken = await adminAuth.verifyIdToken(idToken);
        } catch {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const { uid, email, name, picture } = decodedToken;

        // Only set resident claim if account has no role at all
        // (preserves existing admin/tenant_admin/super_admin claims)
        const existingRole = decodedToken.role as string | undefined;
        if (!existingRole) {
            await adminAuth.setCustomUserClaims(uid, { role: 'resident' });
        }

        // Find or create AppUser document
        let appUser = await appUserService.getByUid(uid);
        if (!appUser) {
            appUser = await appUserService.create(uid, {
                email: email ?? '',
                displayName: name ?? email ?? 'User',
                photoURL: picture,
            });
        }

        return NextResponse.json({ uid, appUser }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
