// app/(dashboard)/[tenantId]/blog/new/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/features/auth/services/authService';
import { ImageUpload } from '@/components/ui/ImageUpload';

export default function NewBlogPostPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await authService.getIdToken();

      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/tenants/${resolvedParams.tenantId}/blog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          body,
          excerpt,
          tags: parsedTags,
          coverImageUrl: coverImageUrl || undefined,
          published,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Request failed: ${res.status}`);
      }

      router.push(`/${resolvedParams.tenantId}/blog`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${resolvedParams.tenantId}/blog`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Blog
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Blog Post</h1>
        <p className="text-muted-foreground mt-1">
          Write and publish a new article for your organisation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border p-6 rounded-xl shadow-sm">
        {/* Error banner */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            className="w-full p-2.5 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="e.g. 5 Ways to Build Accountability in Recovery"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <label htmlFor="excerpt" className="text-sm font-medium">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            rows={2}
            className="w-full p-2.5 border border-border bg-background rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="A short summary shown in the blog listing (1–2 sentences)."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          />
        </div>

        {/* Body */}
        <div className="space-y-2">
          <label htmlFor="body" className="text-sm font-medium">
            Body <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground">
            You can use plain text or paste HTML. Rich editor (TipTap) can be integrated later.
          </p>
          <textarea
            id="body"
            rows={16}
            required
            className="w-full p-2.5 border border-border bg-background rounded-md text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="<p>Write your article here...</p>"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        {/* Cover image */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cover Image</label>
          <ImageUpload
            storagePath={`tenants/${resolvedParams.tenantId}/blog/new/cover`}
            onUpload={(url) => setCoverImageUrl(url)}
            currentUrl={coverImageUrl || undefined}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label htmlFor="tags" className="text-sm font-medium">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            className="w-full p-2.5 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="recovery, accountability, sobriety (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        {/* Publish toggle */}
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <input
            id="published"
            type="checkbox"
            className="h-4 w-4 rounded border-border accent-primary"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          <label htmlFor="published" className="text-sm font-medium cursor-pointer select-none">
            Publish immediately
          </label>
          <span className="text-xs text-muted-foreground">
            (Unchecked saves as draft)
          </span>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 px-5 py-2.5 rounded-md text-sm font-medium transition-colors"
          >
            {loading ? 'Saving...' : published ? 'Publish Post' : 'Save Draft'}
          </button>
          <Link
            href={`/${resolvedParams.tenantId}/blog`}
            className="px-5 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
