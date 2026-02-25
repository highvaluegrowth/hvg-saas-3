import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { verifyAuthToken, canSetCustomClaims } from '@/lib/middleware/authMiddleware';
import type { UserRole } from '@/features/auth/types/auth.types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const decodedToken = await verifyAuthToken(request);

    const { uid, tenantId, role } = await request.json();

    if (!uid || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: uid, role' },
        { status: 400 }
      );
    }

    // Check authorization
    if (!canSetCustomClaims(decodedToken, uid)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only super_admin can set claims on other users' },
        { status: 403 }
      );
    }

    // Additional validation: users can only set limited fields on themselves
    if (decodedToken.uid === uid && decodedToken.role !== 'super_admin') {
      // Non-admin users can only update their display name, not role or tenantId
      return NextResponse.json(
        { error: 'Unauthorized: Cannot modify role or tenant assignment' },
        { status: 403 }
      );
    }

    // Set custom claims
    await adminAuth.setCustomUserClaims(uid, {
      tenant_id: tenantId || null,
      role: role as UserRole,
    });

    return NextResponse.json({
      success: true,
      message: 'Custom claims set successfully',
    });
  } catch (error: any) {
    console.error('Error setting custom claims:', error);

    // Return appropriate status code based on error type
    const statusCode = error.name === 'AuthError' ? 401 : 500;

    return NextResponse.json(
      { error: error.message || 'Failed to set custom claims' },
      { status: statusCode }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const decodedToken = await verifyAuthToken(request);

    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'Missing uid parameter' },
        { status: 400 }
      );
    }

    // Users can only view their own claims, unless they're super_admin
    if (decodedToken.uid !== uid && decodedToken.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Can only view own claims' },
        { status: 403 }
      );
    }

    const user = await adminAuth.getUser(uid);

    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      customClaims: user.customClaims || {},
    });
  } catch (error: any) {
    console.error('Error getting user claims:', error);

    // Return appropriate status code based on error type
    const statusCode = error.name === 'AuthError' ? 401 : 500;

    return NextResponse.json(
      { error: error.message || 'Failed to get user claims' },
      { status: statusCode }
    );
  }
}
