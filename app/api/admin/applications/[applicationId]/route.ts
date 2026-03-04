import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb as db } from '@/lib/firebase/admin';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ applicationId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);

        if (token.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { applicationId } = await params;
        const doc = await db.collection('applications').doc(applicationId).get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ application: { id: doc.id, ...doc.data() } });
    } catch (error) {
        console.error('GET /api/admin/applications/[applicationId]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
