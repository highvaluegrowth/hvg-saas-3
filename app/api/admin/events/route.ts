import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const token = await verifyAuthToken(request);
        if (token.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all events across all tenants using Collection Group query
        const snap = await adminDb.collectionGroup('events').get();
        const events = snap.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
        }));

        // Sort by scheduledAt desc
        const sorted = events.sort((a: any, b: any) => {
            return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
        });

        return NextResponse.json({ events: sorted });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
