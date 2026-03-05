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
    case 'super_admin': return 'bg-purple-100 text-purple-800';
    case 'tenant_admin': return 'bg-blue-100 text-blue-800';
    case 'staff_admin': return 'bg-cyan-100 text-cyan-800';
    case 'staff': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-600';
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
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-cyan-700">
              {post.authorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">{post.authorName}</span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass(post.authorRole)}`}>
                {roleLabel(post.authorRole)}
              </span>
              {post.pinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  📌 Pinned
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{formatTimestamp(post.createdAt)}</p>
          </div>
        </div>
        {/* Scope badge */}
        {post.scope === 'global' && (
          <span className="flex-shrink-0 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            Announcement
          </span>
        )}
        {post.scope === 'house' && (
          <span className="flex-shrink-0 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            House
          </span>
        )}
      </div>

      {/* Body */}
      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{post.body}</p>

      {/* Image */}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post image"
          className="rounded-lg w-full max-h-72 object-cover border border-gray-100"
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
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-colors
                ${hasReacted
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-700 font-medium'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>{emoji}</span>
              {uids.length > 0 && (
                <span className="text-xs font-medium">{uids.length}</span>
              )}
            </button>
          );
        })}
        {post.commentCount > 0 && (
          <span className="ml-auto text-xs text-gray-500">
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
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
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
    } catch (err: any) {
      setSubmitError(err.message ?? 'Failed to post');
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
      // Optimistically update reactions in state
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
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-cyan-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">News Feed</h1>
        <p className="text-gray-600 mt-1">Updates and announcements from your community</p>
      </div>

      {/* Compose Bar */}
      {canCompose && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          {!composing ? (
            <button
              onClick={() => setComposing(true)}
              className="w-full text-left px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-gray-400 text-sm hover:bg-gray-100 transition-colors"
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
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                autoFocus
              />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 font-medium">Scope:</label>
                  <select
                    value={composeScope}
                    onChange={(e) => setComposeScope(e.target.value as typeof composeScope)}
                    className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                    className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitPost}
                    disabled={submitting || !composeBody.trim()}
                    className="px-4 py-1.5 text-sm font-medium bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
              {submitError && (
                <p className="text-xs text-red-600">{submitError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scope Filter Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {SCOPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setScopeFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
              ${scopeFilter === tab.value
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Feed List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
          <div className="text-4xl mb-3">📰</div>
          <p className="text-gray-500 font-medium">No posts yet</p>
          <p className="text-sm text-gray-400 mt-1">
            {scopeFilter === 'all'
              ? 'Be the first to share an update with your community.'
              : `No ${scopeFilter === 'global' ? 'announcement' : scopeFilter} posts yet.`}
          </p>
          {canCompose && !composing && (
            <button
              onClick={() => setComposing(true)}
              className="mt-4 px-4 py-2 text-sm font-medium text-cyan-600 border border-cyan-300 rounded-lg hover:bg-cyan-50 transition-colors"
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
