// app/(marketing)/blog/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { adminDb } from '@/lib/firebase/admin';
import { MarketingNavbar } from '@/components/marketing/MarketingNavbar';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import type { BlogPost } from '@/features/blog/types';

async function getPublishedPosts(): Promise<BlogPost[]> {
  const snapshot = await adminDb
    .collection('blogPosts')
    .where('published', '==', true)
    .orderBy('publishedAt', 'desc')
    .limit(20)
    .get();

  return snapshot.docs.map((doc) => {
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
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const metadata = {
  title: 'Blog — High Value Growth',
  description: 'Insights, guides, and news from the High Value Growth team on sober living, recovery, and house management.',
};

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNavbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            HVG Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Insights, guides, and resources for sober living operators and residents in recovery.
          </p>
        </div>

        {/* Posts grid */}
        {posts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-muted-foreground text-lg">No posts yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Cover image */}
                {post.coverImageUrl ? (
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    <Image
                      src={post.coverImageUrl}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="h-48 w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <span className="text-4xl select-none">&#9998;</span>
                  </div>
                )}

                <div className="flex flex-col flex-1 p-6 space-y-3">
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  <h2 className="text-xl font-semibold leading-snug group-hover:text-primary transition-colors">
                    <Link href={`/blog/${post.slug}`} className="stretched-link">
                      {post.title}
                    </Link>
                  </h2>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border">
                    <span>{post.authorName}</span>
                    <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <MarketingFooter />
    </div>
  );
}
