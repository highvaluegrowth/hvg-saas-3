// app/api/cron/publish-scheduled-posts/route.ts
// Vercel Cron job — runs every 5 minutes.
// Finds all posts where scheduledAt <= now && status === 'scheduled'
// and calls the publish endpoint for each.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { postsService } from '@/features/marketing/services/postsService';
import type { SocialPost, SocialAccount } from '@/features/marketing/types';

export const dynamic = 'force-dynamic';

const META_GRAPH = 'https://graph.facebook.com/v19.0';

function buildPostText(post: SocialPost): string {
  const tags = post.hashtags.map((t) => `#${t}`).join(' ');
  return tags ? `${post.content}\n\n${tags}` : post.content;
}

async function publishFacebook(pageId: string, token: string, post: SocialPost): Promise<string> {
  const body: Record<string, string> = { message: buildPostText(post), access_token: token };
  if (post.imageUrl) body.link = post.imageUrl;
  const res = await fetch(`${META_GRAPH}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json() as { id?: string; error?: { message: string } };
  if (!res.ok || data.error || !data.id) throw new Error(data.error?.message ?? 'Facebook publish failed');
  return data.id;
}

async function publishInstagram(igUserId: string, token: string, post: SocialPost): Promise<string> {
  if (!post.imageUrl) throw new Error('Instagram requires an image');
  const c = await fetch(`${META_GRAPH}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: post.imageUrl, caption: buildPostText(post), access_token: token }),
  }).then((r) => r.json()) as { id?: string; error?: { message: string } };
  if (c.error || !c.id) throw new Error(c.error?.message ?? 'IG container failed');
  const p = await fetch(`${META_GRAPH}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: c.id, access_token: token }),
  }).then((r) => r.json()) as { id?: string; error?: { message: string } };
  if (p.error || !p.id) throw new Error(p.error?.message ?? 'IG publish failed');
  return p.id;
}

export async function GET(request: NextRequest) {
  // Verify cron secret (set CRON_SECRET in Vercel env vars)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  let processed = 0;
  let failed = 0;

  try {
    // Find all scheduled posts across all tenants where scheduledAt <= now
    const snap = await adminDb
      .collectionGroup('socialPosts')
      .where('status', '==', 'scheduled')
      .where('scheduledAt', '<=', now.toISOString())
      .limit(50)
      .get();

    if (snap.empty) {
      return NextResponse.json({ processed: 0, failed: 0, message: 'No posts due' });
    }

    await Promise.all(
      snap.docs.map(async (doc) => {
        const post = doc.data() as SocialPost;
        const tenantId = post.tenantId;

        try {
          // Get active accounts for this tenant
          const accountsSnap = await adminDb
            .collection('tenants')
            .doc(tenantId)
            .collection('socialAccounts')
            .where('status', '==', 'active')
            .get();

          const accounts = accountsSnap.docs.map((d) => d.data() as SocialAccount);
          let anySuccess = false;
          const externalIds: Record<string, string> = {};

          for (const platform of post.platforms) {
            const account = accounts.find((a) => a.platform === platform);
            if (!account) continue;
            try {
              if (platform === 'facebook') {
                const externalId = await publishFacebook(account.accountId, account.accessToken, post);
                externalIds.facebook = externalId;
                anySuccess = true;
              } else if (platform === 'instagram') {
                const externalId = await publishInstagram(account.accountId, account.accessToken, post);
                externalIds.instagram = externalId;
                anySuccess = true;
              }
            } catch (platformErr) {
              console.error(`Cron: failed to publish ${post.id} to ${platform}:`, platformErr);
            }
          }

          await postsService.update(tenantId, post.id, {
            status: anySuccess ? 'published' : 'failed',
            publishedAt: anySuccess ? now.toISOString() : null,
            externalIds: anySuccess ? externalIds : undefined,
          });

          if (anySuccess) processed++;
          else failed++;
        } catch (err) {
          console.error(`Cron: error processing post ${post.id}:`, err);
          await postsService.update(tenantId, post.id, { status: 'failed', publishedAt: null });
          failed++;
        }
      })
    );

    return NextResponse.json({ processed, failed, timestamp: now.toISOString() });
  } catch (error) {
    console.error('Cron publish-scheduled-posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
