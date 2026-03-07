'use client';
import { use } from 'react';
import Link from 'next/link';
import { usePosts } from '@/features/marketing/hooks/usePosts';
import { useAccounts } from '@/features/marketing/hooks/useAccounts';

const STATUS_COLORS: Record<string, React.CSSProperties> = {
    draft: { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' },
    scheduled: { background: 'rgba(59,130,246,0.15)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.25)' },
    published: { background: 'rgba(52,211,153,0.15)', color: '#6EE7B7', border: '1px solid rgba(52,211,153,0.25)' },
    failed: { background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.25)' },
};

export default function MarketingHubPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const { posts, loading } = usePosts(tenantId);
    const { accounts } = useAccounts(tenantId);

    const draft = posts.filter(p => p.status === 'draft').length;
    const scheduled = posts.filter(p => p.status === 'scheduled').length;
    const published = posts.filter(p => p.status === 'published').length;
    const connected = accounts.filter(a => a.status === 'active').length;

    const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };
    const linkHoverStyle = 'hover:border-cyan-500/50 hover:bg-white/5 transition-all group';

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Marketing</h1>
                    <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Create and schedule social media content with AI assistance
                    </p>
                </div>
                <Link
                    href={`/${tenantId}/marketing/compose`}
                    className="px-4 py-2 text-white rounded-xl transition-all font-semibold hover:opacity-90 flex items-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg,#0891B2,#059669)' }}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    New Post
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Drafts', value: draft, color: '#A1A1AA' },
                    { label: 'Scheduled', value: scheduled, color: '#67E8F9' },
                    { label: 'Published', value: published, color: '#34D399' },
                    { label: 'Connected Platforms', value: connected, color: '#C084FC' },
                ].map(stat => (
                    <div key={stat.label} className="rounded-2xl p-5 text-center transition-all hover:bg-white/5" style={cardStyle}>
                        <p className="text-3xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</p>
                        <p className="text-xs uppercase tracking-wider font-semibold mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                    { label: 'All Posts', href: `/${tenantId}/marketing/posts`, icon: '📋', desc: 'View and manage all posts' },
                    { label: 'Compose', href: `/${tenantId}/marketing/compose`, icon: '✨', desc: 'AI-powered content creator' },
                    { label: 'Connected Accounts', href: `/${tenantId}/marketing/accounts`, icon: '🔗', desc: 'Manage social platforms' },
                    { label: 'Analytics', href: `/${tenantId}/marketing/analytics`, icon: '📊', desc: 'Performance and content insights' },
                ].map(card => (
                    <Link key={card.href} href={card.href} className={`rounded-2xl p-5 ${linkHoverStyle}`} style={cardStyle}>
                        <div className="text-2xl mb-3 w-10 h-10 rounded-xl flex items-center justify-center bg-white/5">{card.icon}</div>
                        <p className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{card.label}</p>
                        <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{card.desc}</p>
                    </Link>
                ))}
            </div>

            {/* Recent posts */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Recent Posts</h2>
                {loading ? (
                    <div className="h-64 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                ) : posts.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <p className="text-4xl mb-3">📭</p>
                        <p className="text-white font-medium">No posts yet</p>
                        <p className="text-sm mt-1 mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>Create your first post using our AI composer.</p>
                        <Link href={`/${tenantId}/marketing/compose`}>
                            <button className="px-4 py-2 text-sm font-semibold rounded-xl text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all border border-cyan-500/20">
                                Launch Composer
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    <tr>
                                        <th className="text-left px-5 py-4 font-semibold uppercase tracking-wider text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Content</th>
                                        <th className="text-left px-5 py-4 font-semibold uppercase tracking-wider text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Type</th>
                                        <th className="text-left px-5 py-4 font-semibold uppercase tracking-wider text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Status</th>
                                        <th className="text-left px-5 py-4 font-semibold uppercase tracking-wider text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {posts.slice(0, 10).map(post => {
                                        const statusCfg = STATUS_COLORS[post.status] ?? STATUS_COLORS.draft;
                                        return (
                                            <tr key={post.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => window.location.href = `/${tenantId}/marketing/posts`}>
                                                <td className="px-5 py-4">
                                                    <p className="text-white max-w-sm truncate">{post.content}</p>
                                                </td>
                                                <td className="px-5 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                                    {post.postType.replace('_', ' ')}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize" style={statusCfg}>
                                                        {post.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 font-mono text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
