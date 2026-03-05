// app/api/blog/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import type { BlogPost } from '@/features/blog/types';

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { slug } = await params;

    const snapshot = await adminDb
      .collection('blogPosts')
      .where('slug', '==', slug)
      .where('published', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    const post: BlogPost = {
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
    };

    return NextResponse.json({ post });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
