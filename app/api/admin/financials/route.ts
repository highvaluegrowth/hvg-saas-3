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

        // Fetch all tenants to see their subscription status
        const snap = await adminDb.collection('tenants').get();
        const summary = snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                plan: data.subscription?.plan || 'Standard',
                status: data.subscription?.status || 'active',
                amount: data.subscription?.amount || 0,
                currency: data.subscription?.currency || 'USD',
                nextBilling: data.subscription?.nextBillingDate || null,
            };
        });

        const stats = {
            totalRevenue: summary.reduce((acc, curr) => acc + (curr.amount || 0), 0),
            activeSubscriptions: summary.filter(s => s.status === 'active').length,
            planBreakdown: summary.reduce((acc: any, curr) => {
                acc[curr.plan] = (acc[curr.plan] || 0) + 1;
                return acc;
            }, {})
        };

        return NextResponse.json({ summary, stats });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
