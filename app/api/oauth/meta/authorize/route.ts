// app/api/oauth/meta/authorize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';

export async function GET(request: NextRequest) {
    try {
        await verifyAuthToken(request);
        // Log the attempt so SuperAdmin knows tenants are trying to connect
        console.log('[Meta OAuth] Authorize attempt at', new Date().toISOString());
        return NextResponse.json({
            error: 'Meta integration coming soon',
            message: 'Facebook and Instagram connection will be available shortly. Contact HVG support to get early access.',
        }, { status: 501 });
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
