// app/(marketing)/blog/[slug]/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import { MarketingNavbar } from '@/components/marketing/MarketingNavbar';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import type { BlogPost } from '@/features/blog/types';

type Params = Promise<{ slug: string }>;

async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const snapshot = await adminDb
    .collection('blogPosts')
    .where('slug', '==', slug)
    .where('published', '==', true)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
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
  };
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found — HVG Blog' };
  return {
    title: `${post.title} — HVG Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNavbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Blog
        </Link>

        {/* Cover image */}
        {post.coverImageUrl && (
          <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden mb-10 bg-muted">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
          {post.title}
        </h1>

        {/* Author + date */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-10 pb-8 border-b border-border">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs uppercase">
            {post.authorName.charAt(0)}
          </div>
          <div>
            <span className="font-medium text-foreground">{post.authorName}</span>
            {post.publishedAt && (
              <>
                <span className="mx-1.5">·</span>
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              </>
            )}
          </div>
        </div>

        {/* Body — rendered HTML */}
        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      </main>

      <MarketingFooter />
    </div>
  );
}
