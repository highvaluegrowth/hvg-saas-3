import { NextRequest, NextResponse } from 'next/server';
import { verifyResidentToken } from '@/lib/middleware/residentAuthMiddleware';
import { adminDb as db } from '@/lib/firebase/admin';
import type { Chat } from '@/shared/types/chat';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { uid } = await verifyResidentToken(request);

        const chatsSnap = await db.collection('chats')
            .where('participants', 'array-contains', uid)
            .orderBy('updatedAt', 'desc')
            .get();

        const chats = chatsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Chat[];

        return NextResponse.json({ chats });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { uid } = await verifyResidentToken(request);
        const body = await request.json();
        const { type, participants, tenantId, metadata } = body;

        // Ensure current user is in participants
        const allParticipants = [...new Set([...(participants || []), uid])];

        const chatData = {
            type: type || 'dm',
            tenantId,
            participants: allParticipants,
            metadata: metadata || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await db.collection('chats').add(chatData);

        return NextResponse.json({ id: docRef.id, chat: { id: docRef.id, ...chatData } }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
