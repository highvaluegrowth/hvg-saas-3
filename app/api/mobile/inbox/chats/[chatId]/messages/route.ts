import { NextRequest, NextResponse } from 'next/server';
import { verifyResidentToken } from '@/lib/middleware/residentAuthMiddleware';
import { adminDb as db } from '@/lib/firebase/admin';
import type { ChatMessage } from '@/shared/types/chat';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const { uid } = await verifyResidentToken(request);
        const { chatId } = await params;

        // Verify user is in chat participants
        const chatDoc = await db.collection('chats').doc(chatId).get();
        if (!chatDoc.exists || !chatDoc.data()?.participants.includes(uid)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const messagesSnap = await db.collection(`chats/${chatId}/messages`)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const messages = messagesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ChatMessage[];

        return NextResponse.json({ messages: messages.reverse() });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const { uid, appUser } = await verifyResidentToken(request);
        const { chatId } = await params;
        const body = await request.json();
        const { content, type } = body;

        // Verify user is in chat participants
        const chatRef = db.collection('chats').doc(chatId);
        const chatDoc = await chatRef.get();
        if (!chatDoc.exists || !chatDoc.data()?.participants.includes(uid)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const now = new Date().toISOString();
        const messageData = {
            chatId,
            senderId: uid,
            senderName: appUser.displayName || 'User',
            senderImage: appUser.photoURL || null,
            content,
            type: type || 'text',
            createdAt: now,
        };

        const msgRef = await chatRef.collection('messages').add(messageData);
        
        // Update last message in chat document
        await chatRef.update({
            lastMessage: {
                content,
                senderId: uid,
                createdAt: now,
            },
            updatedAt: now
        });

        return NextResponse.json({ 
            success: true, 
            message: { id: msgRef.id, ...messageData } 
        }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
