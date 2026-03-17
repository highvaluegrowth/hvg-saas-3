import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }

    let userDoc;

    // 1. Try treating query as exact UID
    const uidSnap = await adminDb.collection('users').doc(query).get();
    if (uidSnap.exists) {
        userDoc = uidSnap;
    } else {
        // 2. Try treating query as Email
        const emailSnap = await adminDb.collection('users').where('email', '==', query.toLowerCase().trim()).limit(1).get();
        if (!emailSnap.empty) {
            userDoc = emailSnap.docs[0];
        }
    }

    if (!userDoc) {
        return NextResponse.json({ error: 'User not found in global directory' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Check if already enrolled
    const enrollSnap = await adminDb.collection(`tenants/${tenantId}/enrollments`).where('residentId', '==', userDoc.id).get();
    if (!enrollSnap.empty) {
        return NextResponse.json({ error: 'User is already enrolled in this organization' }, { status: 409 });
    }

    return NextResponse.json({ 
        user: { 
            uid: userDoc.id, 
            email: userData?.email, 
            displayName: userData?.displayName || userData?.name || `${userData?.firstName} ${userData?.lastName}`.trim()
        } 
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
