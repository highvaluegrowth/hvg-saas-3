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

        // Aggregate high-level stats parallel
        const [usersSnap, tenantsSnap, applicationsSnap, enrollmentsSnap] = await Promise.all([
            adminDb.collection('users').count().get(),
            adminDb.collection('tenants').count().get(),
            adminDb.collection('applications').count().get(),
            adminDb.collectionGroup('enrollments').count().get(),
        ]);

        const stats = {
            totalUsers: usersSnap.data().count,
            totalTenants: tenantsSnap.data().count,
            totalApplications: applicationsSnap.data().count,
            totalActiveResidents: enrollmentsSnap.data().count,
        };

        // Get status breakdown for applications
        const appStatusSnap = await adminDb.collection('applications').get();
        const appStatusBreakdown = appStatusSnap.docs.reduce((acc: any, doc) => {
            const status = doc.data().status || 'pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        return NextResponse.json({ stats, appStatusBreakdown });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
