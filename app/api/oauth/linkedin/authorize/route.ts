// app/api/oauth/linkedin/authorize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
    if (!process.env.LINKEDIN_CLIENT_ID) {
        return NextResponse.json(
            { error: 'LinkedIn credentials not configured', message: 'LinkedIn connection coming soon.' },
            { status: 501 }
        );
    }
    try {
        await verifyAuthToken(request);
        const url = new URL(request.url);
        const tenantId = url.searchParams.get('tenantId') ?? '';
        const state = Buffer.from(JSON.stringify({ tenantId, platform: 'linkedin' })).toString('base64url');
        const redirectUri = encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI ?? '');
        const oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUri}&scope=w_member_social&state=${state}`;
        return NextResponse.redirect(oauthUrl, 302);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
