import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb as db } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
    try {
        const token = await verifyAuthToken(request);

        if (token.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);

        let query: FirebaseFirestore.Query = db.collection('applications');
        if (type) query = query.where('type', '==', type);
        if (status) query = query.where('status', '==', status);
        query = query.orderBy('submittedAt', 'desc').limit(limit);

        const snapshot = await query.get();
        const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ applications });
    } catch (error) {
        console.error('GET /api/admin/applications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
