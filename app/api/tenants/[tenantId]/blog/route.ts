// app/api/tenants/[tenantId]/blog/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import type { BlogPost } from '@/features/blog/types';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string }>;

/** Generate a URL-safe slug from a title */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Map a Firestore doc to BlogPost */
function docToPost(doc: FirebaseFirestore.DocumentSnapshot): BlogPost {
  const data = doc.data() ?? {};
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
  };
}

// GET — list all posts for this tenant (draft + published)
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.role !== 'super_admin' && token.role !== 'tenant_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const snapshot = await adminDb
      .collection('blogPosts')
      .where('tenantId', '==', tenantId)
      .orderBy('createdAt', 'desc')
      .get();

    const posts: BlogPost[] = snapshot.docs.map(docToPost);
    return NextResponse.json({ posts });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST — create a new blog post
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: postBody, excerpt, tags, coverImageUrl, published } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    if (!postBody || typeof postBody !== 'string') {
      return NextResponse.json({ error: 'body is required' }, { status: 400 });
    }

    const slug = slugify(title);
    const now = new Date().toISOString();
    const isPublished = Boolean(published);

    const docData: Omit<BlogPost, 'id'> = {
      title: title.trim(),
      slug,
      authorId: token.uid,
      authorName: token.name ?? token.email ?? 'Unknown',
      tenantId,
      body: postBody,
      excerpt: excerpt ?? '',
      coverImageUrl: coverImageUrl ?? undefined,
      tags: Array.isArray(tags) ? tags : [],
      published: isPublished,
      publishedAt: isPublished ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await adminDb.collection('blogPosts').add(docData);

    return NextResponse.json({ success: true, id: ref.id, slug }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// PATCH — update an existing blog post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { ...updates, updatedAt: now };

    // If publishing for the first time, stamp publishedAt
    if (updates.published === true) {
      const existing = await adminDb.collection('blogPosts').doc(id).get();
      if (!existing.data()?.publishedAt) {
        updateData.publishedAt = now;
      }
    }

    await adminDb.collection('blogPosts').doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE — remove a blog post by ?id=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    await adminDb.collection('blogPosts').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
