import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Roles a user can self-assign at registration time (no tenant_id, no super_admin)
const ALLOWED_INITIAL_ROLES = ['resident', 'staff', 'tenant_admin'] as const;
type InitialRole = (typeof ALLOWED_INITIAL_ROLES)[number];

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const body = await request.json();
    const { intentRole } = body as { intentRole: string };

    if (!intentRole || !ALLOWED_INITIAL_ROLES.includes(intentRole as InitialRole)) {
      return NextResponse.json(
        { error: `Invalid intentRole. Must be one of: ${ALLOWED_INITIAL_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    // Safety: only set if user has NO role yet (prevent privilege escalation on re-call)
    if (decodedToken.role) {
      return NextResponse.json(
        { error: 'Role already assigned. Use the admin claims endpoint to change roles.' },
        { status: 409 }
      );
    }

    await adminAuth.setCustomUserClaims(decodedToken.uid, {
      role: intentRole as InitialRole,
      tenant_id: null,
    });

    return NextResponse.json({ success: true, role: intentRole });
  } catch (error: unknown) {
    console.error('Error in init-role:', error);
    const err = error as { name?: string; message?: string };
    const statusCode = err.name === 'AuthError' ? 401 : 500;
    return NextResponse.json(
      { error: err.message || 'Failed to initialise role' },
      { status: statusCode }
    );
  }
}
