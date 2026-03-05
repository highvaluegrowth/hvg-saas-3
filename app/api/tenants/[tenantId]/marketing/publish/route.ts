// app/api/tenants/[tenantId]/marketing/publish/route.ts
// Publishes a post to Facebook and/or Instagram via Meta Graph API.
// Called by "Publish Now" in the compose wizard or by the scheduled-posts cron.

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import { postsService } from '@/features/marketing/services/postsService';
import type { SocialAccount, SocialPost } from '@/features/marketing/types';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string }>;

// ─── Meta Graph API helpers ───────────────────────────────────────────────────

const META_GRAPH = 'https://graph.facebook.com/v19.0';

async function publishToFacebook(
  pageId: string,
  accessToken: string,
  post: SocialPost
): Promise<string> {
  const body: Record<string, string> = {
    message: buildPostText(post),
    access_token: accessToken,
  };
  if (post.imageUrl) body.link = post.imageUrl;

  const res = await fetch(`${META_GRAPH}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json() as { id?: string; error?: { message: string } };
  if (!res.ok || data.error) throw new Error(data.error?.message ?? 'Facebook publish failed');
  return data.id ?? '';
}

async function publishToInstagram(
  igUserId: string,
  accessToken: string,
  post: SocialPost
): Promise<string> {
  const text = buildPostText(post);

  if (post.imageUrl) {
    // Step 1: Create media container
    const containerRes = await fetch(`${META_GRAPH}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: post.imageUrl,
        caption: text,
        access_token: accessToken,
      }),
    });
    const containerData = await containerRes.json() as { id?: string; error?: { message: string } };
    if (!containerRes.ok || containerData.error) {
      throw new Error(containerData.error?.message ?? 'Instagram container creation failed');
    }

    // Step 2: Publish the container
    const publishRes = await fetch(`${META_GRAPH}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: accessToken,
      }),
    });
    const publishData = await publishRes.json() as { id?: string; error?: { message: string } };
    if (!publishRes.ok || publishData.error) {
      throw new Error(publishData.error?.message ?? 'Instagram publish failed');
    }
    return publishData.id ?? '';
  } else {
    // Text-only — use caption via a carousel approach or just feed text
    // Instagram doesn't support text-only posts via API; use a minimal workaround
    throw new Error('Instagram requires an image. Add an image to publish to Instagram.');
  }
}

function buildPostText(post: SocialPost): string {
  const tags = post.hashtags.map((t) => `#${t}`).join(' ');
  return tags ? `${post.content}\n\n${tags}` : post.content;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json() as { postId: string };
    const { postId } = body;
    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    // Fetch post
    const posts = await postsService.list(tenantId, undefined, 500);
    const post = posts.find((p) => p.id === postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Fetch connected social accounts for this tenant
    const accountsSnap = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('socialAccounts')
      .where('status', '==', 'active')
      .get();

    const accounts = accountsSnap.docs.map((d) => d.data() as SocialAccount);

    const results: { platform: string; success: boolean; externalId?: string; error?: string }[] = [];

    for (const platform of post.platforms) {
      const account = accounts.find((a) => a.platform === platform);
      if (!account) {
        results.push({ platform, success: false, error: 'No connected account' });
        continue;
      }

      try {
        let externalId = '';
        if (platform === 'facebook') {
          externalId = await publishToFacebook(account.accountId, account.accessToken, post);
        } else if (platform === 'instagram') {
          externalId = await publishToInstagram(account.accountId, account.accessToken, post);
        } else {
          results.push({ platform, success: false, error: 'Platform not yet supported for publishing' });
          continue;
        }
        results.push({ platform, success: true, externalId });
      } catch (err) {
        results.push({ platform, success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }

    const anySuccess = results.some((r) => r.success);
    const allFailed = results.every((r) => !r.success);

    // Update post status
    await postsService.update(tenantId, postId, {
      status: anySuccess ? 'published' : 'failed',
      publishedAt: anySuccess ? new Date().toISOString() : null,
    });

    return NextResponse.json({
      success: anySuccess,
      results,
      status: allFailed ? 'failed' : anySuccess ? 'published' : 'partial',
    });
  } catch (error) {
    console.error('POST /api/tenants/[tenantId]/marketing/publish:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
