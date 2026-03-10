import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb as db } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const token = await verifyAuthToken(request);

        // Find applications where applicantId or userId matches this user
        // According to our previous changes, we added userId = token.uid
        const snapshot = await db.collection('applications')
            .where('userId', '==', token.uid)
            .orderBy('createdAt', 'desc')
            .get();

        const applications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure createdAt/updatedAt are serializable (ignore Timestamp objects or convert them)
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
            updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate().toISOString() : doc.data().updatedAt,
        }));

        return NextResponse.json({ applications }, { status: 200 });
    } catch (error) {
        console.error('GET /api/applications/user:', error);
        return NextResponse.json({ error: 'Unauthorized or Internal server error' }, { status: 401 });
    }
}
