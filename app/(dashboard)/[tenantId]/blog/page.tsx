// app/(dashboard)/[tenantId]/blog/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { authService } from '@/features/auth/services/authService';
import type { BlogPost } from '@/features/blog/types';

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function BlogDashboardPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const resolvedParams = React.use(params);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchPosts() {
    setLoading(true);
    setError(null);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${resolvedParams.tenantId}/blog`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Request failed: ${res.status}`);
      }
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.tenantId]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(
        `/api/tenants/${resolvedParams.tenantId}/blog?id=${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Delete failed: ${res.status}`);
      }
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Blog Posts</h1>
          <p className="text-white/60 mt-1">
            Create and manage public blog content for your organisation.
          </p>
        </div>
        <Link
          href={`/${resolvedParams.tenantId}/blog/new`}
          className="bg-cyan-600 text-white hover:bg-cyan-700 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-lg shadow-cyan-900/20"
        >
          New Post
        </Link>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-12 text-center">
          <p className="text-white/60">Loading posts...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-3">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && posts.length === 0 && (
        <div className="py-20 text-center border border-dashed border-white/10 rounded-xl">
          <p className="text-white text-lg mb-4 font-semibold">No blog posts yet.</p>
          <Link
            href={`/${resolvedParams.tenantId}/blog/new`}
            className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
          >
            Write your first post
          </Link>
        </div>
      )}

      {/* Posts table */}
      {!loading && !error && posts.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                  {/* Title */}
                  <td className="px-4 py-3 max-w-xs">
                    <span className="font-medium truncate block">{post.title}</span>
                    {post.excerpt && (
                      <span className="text-xs text-muted-foreground truncate block max-w-xs">
                        {post.excerpt}
                      </span>
                    )}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    {post.published ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                        Draft
                      </span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {formatDate(post.publishedAt ?? post.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/${resolvedParams.tenantId}/blog/${post.id}/edit`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        disabled={deletingId === post.id}
                        className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                      >
                        {deletingId === post.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
