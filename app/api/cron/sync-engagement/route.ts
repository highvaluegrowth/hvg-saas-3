import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { postsService } from '@/features/marketing/services/postsService';
import type { SocialPost, SocialAccount } from '@/features/marketing/types';

export const dynamic = 'force-dynamic';

const META_GRAPH = 'https://graph.facebook.com/v19.0';

async function fetchFacebookMetrics(postId: string, token: string) {
  try {
    const res = await fetch(`${META_GRAPH}/${postId}?fields=engagement,insights.metric(post_impressions_unique)&access_token=${token}`);
    const data = await res.json();
    if (!res.ok || data.error) return null;
    
    return {
      impressions: data.insights?.data?.find((m: any) => m.name === 'post_impressions_unique')?.values?.[0]?.value || 0,
      likes: data.engagement?.count || 0,
      comments: 0, 
    };
  } catch (err) {
    return null;
  }
}

async function fetchInstagramMetrics(igMediaId: string, token: string) {
  try {
    const res = await fetch(`${META_GRAPH}/${igMediaId}?fields=like_count,comments_count,impressions&access_token=${token}`);
    const data = await res.json();
    if (!res.ok || data.error) return null;

    return {
      likes: data.like_count || 0,
      comments: data.comments_count || 0,
      impressions: data.impressions || 0,
    };
  } catch (err) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  let updated = 0;

  try {
    // Find published posts
    const snap = await adminDb
      .collectionGroup('socialPosts')
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .limit(50)
      .get();

    if (snap.empty) {
      return NextResponse.json({ updated: 0, message: 'No published posts to sync' });
    }

    for (const doc of snap.docs) {
      const post = doc.data() as SocialPost;
      const tenantId = post.tenantId;

      if (!post.externalIds || Object.keys(post.externalIds).length === 0) continue;

      try {
        const accountsSnap = await adminDb
          .collection('tenants')
          .doc(tenantId)
          .collection('socialAccounts')
          .where('status', '==', 'active')
          .get();

        const accounts = accountsSnap.docs.map((d) => d.data() as SocialAccount);
        const aggregatedEngagement = {
          likes: 0,
          comments: 0,
          impressions: 0,
        };

        let anyUpdate = false;

        for (const [platform, externalId] of Object.entries(post.externalIds)) {
          const account = accounts.find(a => a.platform === platform);
          if (!account) continue;

          let metrics = null;
          if (platform === 'facebook') {
            metrics = await fetchFacebookMetrics(externalId, account.accessToken);
          } else if (platform === 'instagram') {
            metrics = await fetchInstagramMetrics(externalId, account.accessToken);
          }

          if (metrics) {
            aggregatedEngagement.likes += metrics.likes;
            aggregatedEngagement.comments += metrics.comments;
            aggregatedEngagement.impressions += metrics.impressions;
            anyUpdate = true;
          }
        }

        if (anyUpdate) {
          await postsService.update(tenantId, post.id, {
            engagement: {
              ...aggregatedEngagement,
              fetchedAt: now.toISOString(),
            }
          });
          updated++;
        }
      } catch (err) {
        console.error(`Sync: error for post ${post.id}:`, err);
      }
    }

    return NextResponse.json({ updated, timestamp: now.toISOString() });
  } catch (error) {
    console.error('Cron sync-engagement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
