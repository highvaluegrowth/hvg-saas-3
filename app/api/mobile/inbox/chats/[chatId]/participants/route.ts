import { NextRequest, NextResponse } from 'next/server';
import { verifyResidentToken } from '@/lib/middleware/residentAuthMiddleware';
import { adminDb as db } from '@/lib/firebase/admin';
import { appUserService } from '@/features/appUser/services/appUserService';

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
        const data = chatDoc.data();
        if (!chatDoc.exists || !data?.participants.includes(uid)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const participantsUids = data.participants as string[];
        
        // Fetch profiles for all participants
        const participantProfiles = await Promise.all(
            participantsUids.map(async (pUid) => {
                const profile = await appUserService.getByUid(pUid);
                return {
                    uid: pUid,
                    displayName: profile?.displayName || 'Unknown User',
                    photoURL: profile?.photoURL || null,
                    role: profile?.role || 'user'
                };
            })
        );

        return NextResponse.json({ participants: participantProfiles });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
