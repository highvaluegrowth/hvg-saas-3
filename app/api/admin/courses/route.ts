import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import { CourseDoc } from '@/features/lms/services/courseService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const token = await verifyAuthToken(request);
        if (token.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all courses across all tenants using Collection Group query
        const snap = await adminDb.collectionGroup('courses').get();
        const courses = snap.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
        })) as CourseDoc[];

        // Sort by createdAt desc
        const sorted = courses.sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return NextResponse.json({ courses: sorted });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
