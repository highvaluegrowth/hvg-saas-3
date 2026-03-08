import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb as db } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const token = await verifyAuthToken(request);

        if (token.role !== 'super_admin') {
            console.error('Unauthorized access attempt to GET /api/admin/qa by user with role:', token.role);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const snapshot = await db.collection('qa_feedback').orderBy('createdAt', 'desc').get();
        const feedback = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ feedback });
    } catch (error) {
        console.error('GET /api/admin/qa:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
