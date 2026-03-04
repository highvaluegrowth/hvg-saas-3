'use client';
import { use } from 'react';
import Link from 'next/link';
import { usePosts } from '@/features/marketing/hooks/usePosts';
import { useAccounts } from '@/features/marketing/hooks/useAccounts';

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    published: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
};

export default function MarketingHubPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const { posts, loading } = usePosts(tenantId);
    const { accounts } = useAccounts(tenantId);

    const draft = posts.filter(p => p.status === 'draft').length;
    const scheduled = posts.filter(p => p.status === 'scheduled').length;
    const published = posts.filter(p => p.status === 'published').length;
    const connected = accounts.filter(a => a.status === 'active').length;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
                    <p className="text-gray-500 mt-1">Create and schedule social media content with AI assistance</p>
                </div>
                <Link
                    href={`/${tenantId}/marketing/compose`}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                    + New Post
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Drafts', value: draft, color: 'text-gray-700' },
                    { label: 'Scheduled', value: scheduled, color: 'text-blue-600' },
                    { label: 'Published', value: published, color: 'text-emerald-600' },
                    { label: 'Connected Platforms', value: connected, color: 'text-purple-600' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'All Posts', href: `/${tenantId}/marketing/posts`, icon: '📋', desc: 'View and manage all posts' },
                    { label: 'Compose', href: `/${tenantId}/marketing/compose`, icon: '✍️', desc: 'AI-powered content creator' },
                    { label: 'Connected Accounts', href: `/${tenantId}/marketing/accounts`, icon: '🔗', desc: 'Manage social platforms' },
                ].map(card => (
                    <Link key={card.href} href={card.href}
                        className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-sm transition-all group">
                        <div className="text-2xl mb-2">{card.icon}</div>
                        <p className="font-semibold text-gray-900 group-hover:text-emerald-700">{card.label}</p>
                        <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
                    </Link>
                ))}
            </div>

            {/* Recent posts */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Posts</h2>
                {loading ? (
                    <div className="text-gray-400 text-sm">Loading...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-4xl mb-3">📭</p>
                        <p>No posts yet. Create your first post with AI!</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Content</th>
                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {posts.slice(0, 10).map(post => (
                                    <tr key={post.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{post.content}</td>
                                        <td className="px-4 py-3 text-gray-500 capitalize">{post.postType.replace('_', ' ')}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[post.status]}`}>
                                                {post.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400">
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
