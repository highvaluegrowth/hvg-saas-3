import { NextRequest, NextResponse } from 'next/server';
import { verifyAppUserToken } from '@/lib/middleware/residentAuthMiddleware';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { uid } = await verifyAppUserToken(request);

    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    if (conversationId) {
      const convDoc = await adminDb.collection('conversations').doc(conversationId).get();
      if (!convDoc.exists || convDoc.data()?.userId !== uid) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      const messagesSnap = await adminDb
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('createdAt', 'asc')
        .get();

      const messages = messagesSnap.docs.map(doc => ({
        id: doc.id,
        role: doc.data().role,
        content: doc.data().content,
        component: doc.data().component,
        componentData: doc.data().componentData,
        createdAt: doc.data().createdAt?.toMillis() ?? Date.now(),
      }));

      return NextResponse.json({ messages });
    }

    const convsSnap = await adminDb
      .collection('conversations')
      .where('userId', '==', uid)
      .where('tier', '==', 'operator')
      .orderBy('updatedAt', 'desc')
      .limit(10)
      .get();

    const conversations = convsSnap.docs.map(doc => ({
      id: doc.id,
      updatedAt: doc.data().updatedAt?.toDate?.() ?? null,
    }));

    return NextResponse.json({ conversations });
  } catch (error: unknown) {
    const e = error as { message?: string; statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}
