// app/(dashboard)/[tenantId]/marketing/posts/page.tsx
'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { usePosts } from '@/features/marketing/hooks/usePosts';
import type { PostStatus } from '@/features/marketing/types';

const STATUS_TABS: { value: PostStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Drafts' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'published', label: 'Published' },
];

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    published: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
};

export default function PostsPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const [activeStatus, setActiveStatus] = useState<PostStatus | 'all'>('all');
    const { posts, loading } = usePosts(tenantId, activeStatus === 'all' ? undefined : activeStatus);

    async function deletePost(postId: string) {
        if (!confirm('Delete this post?')) return;
        await fetch(`/api/tenants/${tenantId}/marketing/posts/${postId}`, { method: 'DELETE' });
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
                <Link href={`/${tenantId}/marketing/compose`}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                    + New Post
                </Link>
            </div>
            <div className="flex gap-2 border-b border-gray-200">
                {STATUS_TABS.map(tab => (
                    <button key={tab.value} onClick={() => setActiveStatus(tab.value)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeStatus === tab.value ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>
            {loading ? (
                <div className="text-gray-400 text-sm">Loading...</div>
            ) : posts.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-4xl mb-3">📭</p>
                    <p>No posts in this category yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Content</th>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Platforms</th>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {posts.map(post => (
                                <tr key={post.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 max-w-xs">
                                        <p className="truncate text-gray-900">{post.content}</p>
                                        {post.hashtags.length > 0 && (
                                            <p className="text-xs text-gray-400 truncate">#{post.hashtags.slice(0, 3).join(' #')}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 capitalize">{post.platforms.join(', ') || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[post.status]}`}>{post.status}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                                        {post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString() : new Date(post.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => deletePost(post.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
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
