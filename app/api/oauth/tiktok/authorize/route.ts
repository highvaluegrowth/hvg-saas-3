// app/api/oauth/tiktok/authorize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
    if (!process.env.TIKTOK_CLIENT_KEY) {
        return NextResponse.json(
            { error: 'TikTok credentials not configured', message: 'TikTok connection coming soon. Contact HVG support for early access.' },
            { status: 501 }
        );
    }
    try {
        await verifyAuthToken(request);
        const url = new URL(request.url);
        const tenantId = url.searchParams.get('tenantId') ?? '';
        const state = Buffer.from(JSON.stringify({ tenantId, platform: 'tiktok' })).toString('base64url');
        const redirectUri = encodeURIComponent(process.env.TIKTOK_REDIRECT_URI ?? '');
        const oauthUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&redirect_uri=${redirectUri}&scope=user.info.basic,video.publish&state=${state}&response_type=code`;
        return NextResponse.redirect(oauthUrl, 302);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
