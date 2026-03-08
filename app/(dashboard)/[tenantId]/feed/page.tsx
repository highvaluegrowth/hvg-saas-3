'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { FeedPost } from '@/features/feed/types';

type ScopeFilter = 'all' | 'house' | 'global';

const SCOPE_TABS: { value: ScopeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'house', label: 'House' },
  { value: 'global', label: 'Announcements' },
];

const REACTION_EMOJIS = ['👍', '❤️', '🙏', '💪'];

const STAFF_ROLES = ['tenant_admin', 'staff_admin', 'staff', 'super_admin'];

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function roleBadgeClass(role: string): string {
  switch (role) {
    case 'super_admin': return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
    case 'tenant_admin': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
    case 'staff_admin': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    case 'staff': return 'bg-teal-500/20 text-teal-300 border border-teal-500/30';
    default: return 'bg-white/10 text-white/50 border border-white/10';
  }
}

function roleLabel(role: string): string {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'tenant_admin': return 'Admin';
    case 'staff_admin': return 'Staff Admin';
    case 'staff': return 'Staff';
    case 'resident': return 'Resident';
    default: return role;
  }
}

interface PostCardProps {
  post: FeedPost;
  currentUid: string | undefined;
  tenantId: string;
  onReact: (postId: string, emoji: string) => Promise<void>;
}

function PostCard({ post, currentUid, tenantId, onReact }: PostCardProps) {
  const [reacting, setReacting] = useState(false);

  async function handleReact(emoji: string) {
    if (reacting) return;
    setReacting(true);
    try {
      await onReact(post.id, emoji);
    } finally {
      setReacting(false);
    }
  }

  return (
    <div className="rounded-xl border p-5 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(8,145,178,0.4), rgba(5,150,105,0.4))', border: '1px solid rgba(103,232,249,0.2)' }}>
            <span className="text-sm font-semibold text-cyan-300">
              {post.authorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{post.authorName}</span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass(post.authorRole)}`}>
                {roleLabel(post.authorRole)}
              </span>
              {post.pinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  📌 Pinned
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{formatTimestamp(post.createdAt)}</p>
          </div>
        </div>
        {/* Scope badge */}
        {post.scope === 'global' && (
          <span className="shrink-0 text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
            Announcement
          </span>
        )}
        {post.scope === 'house' && (
          <span className="shrink-0 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
            House
          </span>
        )}
      </div>

      {/* Body */}
      <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>{post.body}</p>

      {/* Image */}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post image"
          className="rounded-lg w-full max-h-72 object-cover"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        />
      )}

      {/* Reactions */}
      <div className="flex items-center gap-2 pt-1">
        {REACTION_EMOJIS.map((emoji) => {
          const uids = post.reactions[emoji] ?? [];
          const hasReacted = currentUid ? uids.includes(currentUid) : false;
          return (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              disabled={reacting || !currentUid}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-all
                ${hasReacted
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-medium'
                  : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ background: hasReacted ? undefined : 'rgba(255,255,255,0.04)' }}
            >
              <span>{emoji}</span>
              {uids.length > 0 && (
                <span className="text-xs font-medium">{uids.length}</span>
              )}
            </button>
          );
        })}
        {post.commentCount > 0 && (
          <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {post.commentCount} comment{post.commentCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

export default function FeedPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params);
  const { user, loading: authLoading } = useAuth();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');

  const [composing, setComposing] = useState(false);
  const [composeBody, setComposeBody] = useState('');
  const [composeScope, setComposeScope] = useState<'tenant' | 'house' | 'global'>('tenant');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canCompose = user?.role ? STAFF_ROLES.includes(user.role) : false;

  const fetchPosts = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/tenants/${tenantId}/feed`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load feed');
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filteredPosts = scopeFilter === 'all'
    ? posts
    : posts.filter((p) => p.scope === scopeFilter);

  async function handleSubmitPost() {
    if (!composeBody.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          body: composeBody,
          scope: composeScope,
          authorName: user?.displayName || user?.email || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to post');
      }
      setComposeBody('');
      setComposing(false);
      await fetchPosts();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReact(postId: string, emoji: string) {
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/feed/${postId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, reactions: data.reactions } : p
        )
      );
    } catch (err) {
      console.error('React failed', err);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">News Feed</h1>
        <p className="mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Updates and announcements from your community</p>
      </div>

      {/* Compose Bar */}
      {canCompose && (
        <div className="rounded-xl border p-4" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}>
          {!composing ? (
            <button
              onClick={() => setComposing(true)}
              className="w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors hover:border-white/20"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
            >
              Share an update with your community...
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                autoFocus
              />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Scope:</label>
                  <select
                    value={composeScope}
                    onChange={(e) => setComposeScope(e.target.value as typeof composeScope)}
                    className="text-xs rounded-md px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    <option value="tenant">Tenant-wide</option>
                    <option value="house">House</option>
                    {(user?.role === 'super_admin' || user?.role === 'tenant_admin') && (
                      <option value="global">Announcement</option>
                    )}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setComposing(false); setComposeBody(''); setSubmitError(null); }}
                    className="px-4 py-1.5 text-sm transition-colors"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitPost}
                    disabled={submitting || !composeBody.trim()}
                    className="px-4 py-1.5 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #0891B2, #059669)' }}
                  >
                    {submitting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
              {submitError && (
                <p className="text-xs text-red-400">{submitError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scope Filter Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {SCOPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setScopeFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
              ${scopeFilter === tab.value
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent hover:border-white/20'
              }`}
            style={{ color: scopeFilter === tab.value ? undefined : 'rgba(255,255,255,0.45)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'rgba(252,165,165,0.9)' }}>
          {error}
        </div>
      )}

      {/* Feed List */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-xl py-16 text-center border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="text-4xl mb-3">📰</div>
          <p className="font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>No posts yet</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {scopeFilter === 'all'
              ? 'Be the first to share an update with your community.'
              : `No ${scopeFilter === 'global' ? 'announcement' : scopeFilter} posts yet.`}
          </p>
          {canCompose && !composing && (
            <button
              onClick={() => setComposing(true)}
              className="mt-4 px-4 py-2 text-sm font-medium rounded-lg transition-all border"
              style={{ color: '#67E8F9', borderColor: 'rgba(103,232,249,0.3)', background: 'rgba(8,145,178,0.1)' }}
            >
              Create a post
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUid={user?.uid}
              tenantId={tenantId}
              onReact={handleReact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
