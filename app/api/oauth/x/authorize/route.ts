// app/api/oauth/x/authorize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
    if (!process.env.X_CLIENT_ID) {
        return NextResponse.json(
            { error: 'X credentials not configured', message: 'X / Twitter connection coming soon.' },
            { status: 501 }
        );
    }
    try {
        await verifyAuthToken(request);
        const url = new URL(request.url);
        const tenantId = url.searchParams.get('tenantId') ?? '';
        const state = Buffer.from(JSON.stringify({ tenantId, platform: 'x' })).toString('base64url');
        const redirectUri = encodeURIComponent(process.env.X_REDIRECT_URI ?? '');
        const oauthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.X_CLIENT_ID}&redirect_uri=${redirectUri}&scope=tweet.read%20tweet.write%20users.read&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
        return NextResponse.redirect(oauthUrl, 302);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
