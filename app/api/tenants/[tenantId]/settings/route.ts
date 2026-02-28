import { NextResponse, type NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';

interface RouteParams {
    params: Promise<{ tenantId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    const { tenantId } = await params;
    const user = await verifyAuthToken(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hasAccess = user.tenantId === tenantId || user.role === 'super_admin';
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const doc = await adminDb.collection('tenants').doc(tenantId).get();
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data = doc.data() ?? {};
    // Only reveal whether a key exists, never the value
    return NextResponse.json({
        settings: {
            aiApiKey: data.aiApiKey ? true : false,
        },
    });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { tenantId } = await params;
    const user = await verifyAuthToken(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = (user.tenantId === tenantId && user.role === 'tenant_admin') || user.role === 'super_admin';
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();

    const update: Record<string, unknown> = {};
    if ('aiApiKey' in body) {
        update.aiApiKey = body.aiApiKey ?? null;
    }

    if (Object.keys(update).length === 0) {
        return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    await adminDb.collection('tenants').doc(tenantId).update(update);
    return NextResponse.json({ success: true });
}
