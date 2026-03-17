import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb as db } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
    try {
        const token = await verifyAuthToken(request);
        if (token.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { tenantId } = await params;
        const doc = await db.collection('tenants').doc(tenantId).get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        const data = doc.data()!;
        
        // Fetch stats parallel
        const [residentsSnap, applicationsSnap] = await Promise.all([
            db.collection(`tenants/${tenantId}/residents`).get(),
            db.collection('applications').where('assignedTenantId', '==', tenantId).get()
        ]);

        return NextResponse.json({
            tenant: {
                id: doc.id,
                ...data,
                residentCount: residentsSnap.size,
                applicationCount: applicationsSnap.size,
            }
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
    try {
        const token = await verifyAuthToken(request);
        if (token.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { tenantId } = await params;
        const body = await request.json();
        const { status, name, aiApiKey } = body;

        const update: Record<string, any> = {
            updatedAt: new Date().toISOString()
        };

        if (status) update.status = status;
        if (name) update.name = name;
        if (aiApiKey !== undefined) update.aiApiKey = aiApiKey;

        await db.collection('tenants').doc(tenantId).update(update);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
