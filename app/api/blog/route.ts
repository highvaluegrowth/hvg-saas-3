// app/api/blog/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import type { BlogPost } from '@/features/blog/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('blogPosts')
      .where('published', '==', true)
      .orderBy('publishedAt', 'desc')
      .limit(20)
      .get();

    const posts: BlogPost[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title ?? '',
        slug: data.slug ?? '',
        authorId: data.authorId ?? '',
        authorName: data.authorName ?? '',
        tenantId: data.tenantId ?? '',
        body: data.body ?? '',
        excerpt: data.excerpt ?? '',
        coverImageUrl: data.coverImageUrl ?? undefined,
        tags: data.tags ?? [],
        published: data.published ?? false,
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() ?? data.publishedAt ?? undefined,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? '',
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt ?? '',
      } satisfies BlogPost;
    });

    return NextResponse.json({ posts });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
