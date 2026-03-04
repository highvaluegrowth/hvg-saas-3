// app/api/oauth/meta/authorize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';

const META_SCOPES = 'pages_show_list,pages_manage_posts,instagram_basic,instagram_content_publish';

export async function GET(request: NextRequest) {
    if (!process.env.META_APP_ID) {
        return NextResponse.json(
            { error: 'Meta credentials not configured' },
            { status: 501 }
        );
    }

    try {
        const token = await verifyAuthToken(request);
        const url = new URL(request.url);
        const tenantId = url.searchParams.get('tenantId');
        const platform = url.searchParams.get('platform') ?? 'facebook';

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
        }

        // Build state — base64url encoded JSON
        const statePayload = JSON.stringify({ tenantId, platform, uid: token.uid });
        const state = Buffer.from(statePayload).toString('base64url');

        const redirectUri = process.env.META_REDIRECT_URI ?? '';
        const oauthUrl =
            `https://www.facebook.com/v20.0/dialog/oauth` +
            `?client_id=${process.env.META_APP_ID}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&scope=${META_SCOPES}` +
            `&state=${state}` +
            `&response_type=code`;

        return NextResponse.redirect(oauthUrl, 302);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
