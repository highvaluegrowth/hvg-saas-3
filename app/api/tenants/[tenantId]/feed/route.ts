import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { tenantId } = await params;

    const snapshot = await adminDb
      .collection(`tenants/${tenantId}/feed`)
      .orderBy('createdAt', 'desc')
      .limit(25)
      .get();

    const posts = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        authorId: data.authorId ?? '',
        authorName: data.authorName ?? '',
        authorRole: data.authorRole ?? '',
        body: data.body ?? '',
        imageUrl: data.imageUrl ?? undefined,
        scope: data.scope ?? 'tenant',
        houseId: data.houseId ?? undefined,
        reactions: data.reactions ?? {},
        pinned: data.pinned ?? false,
        commentCount: data.commentCount ?? 0,
        createdAt:
          data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : data.createdAt ?? new Date().toISOString(),
        updatedAt:
          data.updatedAt && typeof data.updatedAt.toDate === 'function'
            ? data.updatedAt.toDate().toISOString()
            : data.updatedAt ?? new Date().toISOString(),
      };
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('GET /api/tenants/[tenantId]/feed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = await verifyAuthToken(request);

    const allowedRoles = ['tenant_admin', 'staff_admin', 'staff', 'super_admin'];
    if (!allowedRoles.includes(token.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { tenantId } = await params;
    const body = await request.json();

    const { body: postBody, scope = 'tenant', imageUrl, authorName, houseId } = body;

    if (!postBody || typeof postBody !== 'string' || postBody.trim().length === 0) {
      return NextResponse.json({ error: 'Post body is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const newPost: Record<string, unknown> = {
      authorId: token.uid,
      authorName: authorName || token.name || token.email || 'Unknown',
      authorRole: token.role ?? 'staff',
      body: postBody.trim(),
      scope,
      reactions: {},
      pinned: false,
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    if (imageUrl) newPost.imageUrl = imageUrl;
    if (houseId) newPost.houseId = houseId;

    const docRef = await adminDb.collection(`tenants/${tenantId}/feed`).add(newPost);

    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error: any) {
    if (error?.message === 'Unauthorized' || error?.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/tenants/[tenantId]/feed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
