import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb as db } from '@/lib/firebase/admin';
import type { Chat } from '@/shared/types/chat';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string; applicationId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId, applicationId } = await params;

        // Verify access
        if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get application to find applicant UID
        const appDoc = await db.collection('applications').doc(applicationId).get();
        if (!appDoc.exists) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }
        const appData = appDoc.data()!;
        const applicantId = appData.applicantId;

        if (!applicantId) {
            return NextResponse.json({ error: 'Applicant ID not found' }, { status: 400 });
        }

        // Try to find existing DM chat between this staff/tenant and applicant
        // For simplicity, we'll look for a chat of type 'dm' that includes the applicant 
        // and is associated with this tenantId.
        const chatsSnap = await db.collection('chats')
            .where('tenantId', '==', tenantId)
            .where('type', '==', 'dm')
            .where('participants', 'array-contains', applicantId)
            .get();

        const chat = chatsSnap.docs.find(d => d.data().participants.includes(token.uid));

        if (!chat) {
            // Create new chat
            const chatData = {
                type: 'dm',
                tenantId,
                participants: [token.uid, applicantId],
                metadata: {
                    name: `Chat with ${appData.applicantName}`,
                    applicationId: applicationId,
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const docRef = await db.collection('chats').add(chatData);
            return NextResponse.json({ chatId: docRef.id, chat: { id: docRef.id, ...chatData } });
        }

        return NextResponse.json({ chatId: chat.id, chat: { id: chat.id, ...chat.data() } });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
