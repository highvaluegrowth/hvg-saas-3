'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase/client';
import type { SocialPost, SocialAccount, SocialPlatform, PostType, PostStatus } from '@/features/marketing/types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; color: string }> = {
    facebook:  { label: 'Facebook',   color: 'bg-blue-600'  },
    instagram: { label: 'Instagram',  color: 'bg-pink-500'  },
    tiktok:    { label: 'TikTok',     color: 'bg-gray-900'  },
    x:         { label: 'X / Twitter', color: 'bg-gray-700' },
    linkedin:  { label: 'LinkedIn',   color: 'bg-blue-700'  },
};

const POST_TYPE_LABELS: Record<PostType, string> = {
    bed_availability: 'Bed Availability',
    success_story:    'Success Story',
    event_promo:      'Event Promo',
    job_listing:      'Job Listing',
    general:          'General',
};

// ---------------------------------------------------------------------------
// API response shape
// ---------------------------------------------------------------------------

interface AnalyticsData {
    total: number;
    byStatus: Record<PostStatus, number>;
    byType: Record<PostType, number>;
    byPlatform: Record<SocialPlatform, number>;
    aiVsManual: { ai: number; manual: number };
    thisMonth: number;
    lastMonth: number;
    recentPublished: SocialPost[];
    topHashtags: Array<{ tag: string; count: number }>;
    accounts: SocialAccount[];
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function StatCard({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-gray-500 text-sm mt-1">{label}</p>
        </div>
    );
}

function SkeletonCard({ rows = 3 }: { rows?: number }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-3 bg-gray-100 rounded" />
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MarketingAnalyticsPage({
    params,
}: {
    params: Promise<{ tenantId: string }>;
}) {
    const { tenantId } = use(params);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const token = await auth.currentUser?.getIdToken();
                const res = await fetch(
                    `/api/tenants/${tenantId}/marketing/analytics`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json() as AnalyticsData;
                setData(json);
            } catch (e) {
                setError(String(e));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [tenantId]);

    // Connected platforms map for quick lookup
    const connectedPlatforms = new Set(
        (data?.accounts ?? [])
            .filter(a => a.status === 'active')
            .map(a => a.platform)
    );

    // Max byType count for bar scaling
    const maxTypeCount = data
        ? Math.max(...Object.values(data.byType), 1)
        : 1;

    // Max byPlatform count for bar scaling
    const maxPlatformCount = data
        ? Math.max(...Object.values(data.byPlatform), 1)
        : 1;

    // AI percentage
    const aiPct = data && data.total > 0
        ? Math.round((data.aiVsManual.ai / data.total) * 100)
        : 0;

    // Month over month
    const momDiff = data ? data.thisMonth - data.lastMonth : 0;
    const momPct =
        data && data.lastMonth > 0
            ? Math.round((momDiff / data.lastMonth) * 100)
            : null;

    if (error) {
        return (
            <div className="max-w-5xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
                    <p className="font-semibold">Failed to load analytics</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href={`/${tenantId}/marketing`}
                    className="text-sm text-gray-500 hover:text-emerald-600 transition-colors"
                >
                    ← Back to Marketing
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Marketing Analytics</h1>
            </div>

            {/* Row 1 — Stat cards */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                            <div className="h-8 bg-gray-200 rounded mb-2" />
                            <div className="h-3 bg-gray-100 rounded w-2/3 mx-auto" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard label="Total Posts"         value={data?.total ?? 0}               color="text-gray-800"    />
                    <StatCard label="Published"           value={data?.byStatus.published ?? 0}  color="text-emerald-600" />
                    <StatCard label="Scheduled"           value={data?.byStatus.scheduled ?? 0}  color="text-blue-600"    />
                    <StatCard label="Connected Accounts"  value={connectedPlatforms.size}        color="text-purple-600"  />
                </div>
            )}

            {/* Row 2 — 3 section cards */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SkeletonCard rows={5} />
                    <SkeletonCard rows={5} />
                    <SkeletonCard rows={3} />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Content Mix */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Content Mix</h2>
                        <div className="space-y-3">
                            {(Object.entries(data?.byType ?? {}) as [PostType, number][])
                                .sort(([, a], [, b]) => b - a)
                                .map(([type, count]) => (
                                    <div key={type}>
                                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                                            <span>{POST_TYPE_LABELS[type]}</span>
                                            <span className="font-medium">{count}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className="bg-emerald-500 h-2 rounded-full transition-all"
                                                style={{ width: `${(count / maxTypeCount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Platform Targeting */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Platform Targeting</h2>
                        <div className="space-y-3">
                            {(Object.entries(PLATFORM_CONFIG) as [SocialPlatform, { label: string; color: string }][]).map(
                                ([platform, cfg]) => {
                                    const count = data?.byPlatform[platform] ?? 0;
                                    const isConnected = connectedPlatforms.has(platform);
                                    return (
                                        <div key={platform}>
                                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`inline-block w-2 h-2 rounded-full ${
                                                            isConnected ? 'bg-emerald-500' : 'bg-gray-300'
                                                        }`}
                                                    />
                                                    <span
                                                        className={`px-1.5 py-0.5 rounded text-white text-xs font-medium ${cfg.color}`}
                                                    >
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <span className="font-medium">{count}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${cfg.color}`}
                                                    style={{
                                                        width: `${(count / maxPlatformCount) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    {/* AI Usage */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">AI Usage</h2>
                        <div className="text-center mb-4">
                            <p className="text-4xl font-bold text-purple-600">{aiPct}%</p>
                            <p className="text-xs text-gray-500 mt-1">AI-generated</p>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1 mb-4">
                            <p>{data?.aiVsManual.ai ?? 0} posts created with AI</p>
                            <p>{data?.aiVsManual.manual ?? 0} created manually</p>
                        </div>
                        {/* Split bar */}
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                            <div
                                className="bg-purple-500 h-full transition-all"
                                style={{ width: `${aiPct}%` }}
                            />
                            <div className="bg-gray-200 h-full flex-1" />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>AI</span>
                            <span>Manual</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Row 3 — Monthly Activity + Top Hashtags */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SkeletonCard rows={4} />
                    <SkeletonCard rows={10} />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Monthly Activity */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Activity</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">This month</span>
                                <span className="text-2xl font-bold text-gray-900">{data?.thisMonth ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Last month</span>
                                <span className="text-2xl font-bold text-gray-400">{data?.lastMonth ?? 0}</span>
                            </div>
                            {momPct !== null && (
                                <div
                                    className={`flex items-center gap-1 text-sm font-medium ${
                                        momDiff >= 0 ? 'text-emerald-600' : 'text-red-500'
                                    }`}
                                >
                                    <span>{momDiff >= 0 ? '▲' : '▼'}</span>
                                    <span>{Math.abs(momPct)}% vs last month</span>
                                </div>
                            )}
                            {momPct === null && data && data.lastMonth === 0 && data.thisMonth > 0 && (
                                <p className="text-xs text-gray-400">No posts last month to compare</p>
                            )}
                        </div>
                    </div>

                    {/* Top Hashtags */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Top Hashtags</h2>
                        {(data?.topHashtags ?? []).length === 0 ? (
                            <p className="text-sm text-gray-400">No hashtags yet.</p>
                        ) : (
                            <ol className="space-y-1.5">
                                {(data?.topHashtags ?? []).map(({ tag, count }) => (
                                    <li key={tag} className="flex items-center justify-between text-sm">
                                        <span className="text-blue-600 font-mono">{tag}</span>
                                        <span className="text-gray-400 text-xs">used in {count} post{count !== 1 ? 's' : ''}</span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </div>
            )}

            {/* Row 4 — Published Posts table */}
            {loading ? (
                <SkeletonCard rows={8} />
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Published Posts</h2>
                    {(data?.recentPublished ?? []).length === 0 ? (
                        <p className="text-sm text-gray-400">No published posts yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[640px]">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-3 py-2 text-gray-600 font-medium text-xs">Date</th>
                                        <th className="text-left px-3 py-2 text-gray-600 font-medium text-xs">Content</th>
                                        <th className="text-left px-3 py-2 text-gray-600 font-medium text-xs">Platforms</th>
                                        <th className="text-left px-3 py-2 text-gray-600 font-medium text-xs">Type</th>
                                        <th className="text-right px-3 py-2 text-gray-600 font-medium text-xs">Likes</th>
                                        <th className="text-right px-3 py-2 text-gray-600 font-medium text-xs">Comments</th>
                                        <th className="text-right px-3 py-2 text-gray-600 font-medium text-xs">Shares</th>
                                        <th className="text-right px-3 py-2 text-gray-600 font-medium text-xs">Impressions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(data?.recentPublished ?? []).map(post => (
                                        <tr key={post.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">
                                                {post.publishedAt
                                                    ? new Date(post.publishedAt).toLocaleDateString()
                                                    : '—'}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate">
                                                {post.content.length > 60
                                                    ? `${post.content.slice(0, 60)}…`
                                                    : post.content}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {post.platforms.map(p => (
                                                        <span
                                                            key={p}
                                                            className={`px-1.5 py-0.5 rounded text-white text-xs font-medium ${PLATFORM_CONFIG[p].color}`}
                                                        >
                                                            {PLATFORM_CONFIG[p].label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-gray-500 text-xs capitalize whitespace-nowrap">
                                                {POST_TYPE_LABELS[post.postType]}
                                            </td>
                                            <td className="px-3 py-2 text-right text-gray-500 text-xs">
                                                {post.engagement?.likes ?? '—'}
                                            </td>
                                            <td className="px-3 py-2 text-right text-gray-500 text-xs">
                                                {post.engagement?.comments ?? '—'}
                                            </td>
                                            <td className="px-3 py-2 text-right text-gray-500 text-xs">
                                                {post.engagement?.shares ?? '—'}
                                            </td>
                                            <td className="px-3 py-2 text-right text-gray-500 text-xs">
                                                {post.engagement?.impressions ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <p className="text-xs text-gray-400 mt-4">
                        Engagement data will auto-sync once Meta API permissions are approved.
                    </p>
                </div>
            )}
        </div>
    );
}
