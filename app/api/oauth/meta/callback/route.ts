// app/api/oauth/meta/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { accountsService } from '@/features/marketing/services/accountsService';

export const dynamic = 'force-dynamic';


const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

interface MetaStatePayload {
    tenantId: string;
    platform: string;
    uid: string;
}

interface MetaPage {
    id: string;
    name: string;
    access_token: string;
    instagram_business_account?: { id: string };
}

interface MetaPagesResponse {
    data: MetaPage[];
}

interface MetaTokenResponse {
    access_token: string;
    token_type?: string;
    expires_in?: number;
}

interface MetaIgProfile {
    id: string;
    name?: string;
    username?: string;
}

export async function GET(request: NextRequest) {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_REDIRECT_URI ?? '';

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    // Step 1: Validate params
    if (!code || !state) {
        return NextResponse.redirect(`${BASE_URL}/login?error=meta_invalid`);
    }

    // Step 2: Decode state
    let statePayload: MetaStatePayload;
    try {
        statePayload = JSON.parse(Buffer.from(state, 'base64').toString()) as MetaStatePayload;
    } catch {
        return NextResponse.redirect(`${BASE_URL}/login?error=meta_invalid`);
    }

    const { tenantId, uid } = statePayload;
    const failRedirect = `${BASE_URL}/${tenantId}/marketing/accounts?error=meta_failed`;

    if (!appId || !appSecret) {
        return NextResponse.redirect(`${BASE_URL}/${tenantId}/marketing/accounts?error=not_configured`);
    }

    try {
        // Step 3: Exchange code for short-lived token
        const shortTokenRes = await fetch(
            `https://graph.facebook.com/v20.0/oauth/access_token` +
            `?client_id=${appId}` +
            `&client_secret=${appSecret}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&code=${code}`
        );
        if (!shortTokenRes.ok) {
            console.error('[Meta OAuth] Short token exchange failed', await shortTokenRes.text());
            return NextResponse.redirect(failRedirect);
        }
        const shortTokenData = await shortTokenRes.json() as MetaTokenResponse;
        const shortToken = shortTokenData.access_token;

        // Step 4: Exchange for long-lived token (60 days)
        const longTokenRes = await fetch(
            `https://graph.facebook.com/v20.0/oauth/access_token` +
            `?grant_type=fb_exchange_token` +
            `&client_id=${appId}` +
            `&client_secret=${appSecret}` +
            `&fb_exchange_token=${shortToken}`
        );
        if (!longTokenRes.ok) {
            console.error('[Meta OAuth] Long token exchange failed', await longTokenRes.text());
            return NextResponse.redirect(failRedirect);
        }
        const longTokenData = await longTokenRes.json() as MetaTokenResponse;
        const longToken = longTokenData.access_token;

        // Step 5: Fetch user's pages
        const pagesRes = await fetch(
            `https://graph.facebook.com/v20.0/me/accounts?access_token=${longToken}`
        );
        if (!pagesRes.ok) {
            console.error('[Meta OAuth] Pages fetch failed', await pagesRes.text());
            return NextResponse.redirect(failRedirect);
        }
        const pagesData = await pagesRes.json() as MetaPagesResponse;
        const pages = pagesData.data ?? [];

        const now = new Date().toISOString();
        const tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

        // Step 6 + 7: Upsert each page and any linked Instagram account
        for (const page of pages) {
            await accountsService.upsert(tenantId, {
                platform: 'facebook',
                accountId: page.id,
                accountName: page.name,
                accessToken: page.access_token,
                tokenExpiresAt,
                status: 'active',
                connectedAt: now,
                connectedBy: uid,
            });

            if (page.instagram_business_account) {
                const igId = page.instagram_business_account.id;
                // Fetch IG profile details
                const igRes = await fetch(
                    `https://graph.facebook.com/v20.0/${igId}?fields=id,name,username&access_token=${page.access_token}`
                );
                let igName = igId;
                if (igRes.ok) {
                    const igProfile = await igRes.json() as MetaIgProfile;
                    igName = igProfile.username ?? igProfile.name ?? igId;
                }

                await accountsService.upsert(tenantId, {
                    platform: 'instagram',
                    accountId: igId,
                    accountName: igName,
                    accessToken: page.access_token,
                    tokenExpiresAt,
                    status: 'active',
                    connectedAt: now,
                    connectedBy: uid,
                });
            }
        }

        // Step 8: Redirect to success
        return NextResponse.redirect(`${BASE_URL}/${tenantId}/marketing/accounts?connected=meta`);
    } catch (err) {
        console.error('[Meta OAuth] Callback error', err);
        return NextResponse.redirect(failRedirect);
    }
}
