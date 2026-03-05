import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string; postId: string }>;

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = await verifyAuthToken(request);

    const { tenantId, postId } = await params;
    const body = await request.json();

    const { emoji } = body;
    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json({ error: 'emoji is required' }, { status: 400 });
    }

    const postRef = adminDb.doc(`tenants/${tenantId}/feed/${postId}`);
    const postSnap = await postRef.get();

    if (!postSnap.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const data = postSnap.data()!;
    const reactions: Record<string, string[]> = data.reactions ?? {};
    const currentUids: string[] = reactions[emoji] ?? [];
    const uid = token.uid;

    let updatedReactions: Record<string, string[]>;

    if (currentUids.includes(uid)) {
      // Remove reaction
      const filtered = currentUids.filter((id) => id !== uid);
      updatedReactions = { ...reactions };
      if (filtered.length === 0) {
        delete updatedReactions[emoji];
      } else {
        updatedReactions[emoji] = filtered;
      }
    } else {
      // Add reaction
      updatedReactions = { ...reactions, [emoji]: [...currentUids, uid] };
    }

    await postRef.update({
      reactions: updatedReactions,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, reactions: updatedReactions });
  } catch (error: any) {
    if (error?.message === 'Unauthorized' || error?.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/tenants/[tenantId]/feed/[postId]/react:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
