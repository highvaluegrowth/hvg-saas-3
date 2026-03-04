// app/(dashboard)/[tenantId]/marketing/accounts/page.tsx
'use client';
import { use, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAccounts } from '@/features/marketing/hooks/useAccounts';
import type { SocialAccount, SocialPlatform } from '@/features/marketing/types';

const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; color: string; icon: string; comingSoon: boolean }> = {
    facebook:  { label: 'Facebook',    color: 'bg-blue-600', icon: 'f',  comingSoon: false },
    instagram: { label: 'Instagram',   color: 'bg-pink-500', icon: '📷', comingSoon: false },
    tiktok:    { label: 'TikTok',      color: 'bg-gray-900', icon: '♪',  comingSoon: true  },
    x:         { label: 'X / Twitter', color: 'bg-gray-800', icon: '𝕏',  comingSoon: true  },
    linkedin:  { label: 'LinkedIn',    color: 'bg-blue-700', icon: 'in', comingSoon: true  },
};

const AVAILABLE_PLATFORMS: SocialPlatform[] = ['facebook', 'instagram', 'tiktok', 'x', 'linkedin'];

function getOAuthUrl(tenantId: string, platform: SocialPlatform): string {
    switch (platform) {
        case 'facebook':
        case 'instagram':
            return `/api/oauth/meta/authorize?tenantId=${tenantId}&platform=${platform}`;
        case 'tiktok':
            return `/api/oauth/tiktok/authorize?tenantId=${tenantId}`;
        case 'x':
            return `/api/oauth/x/authorize?tenantId=${tenantId}`;
        case 'linkedin':
            return `/api/oauth/linkedin/authorize?tenantId=${tenantId}`;
    }
}

export default function AccountsPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const { accounts, loading } = useAccounts(tenantId);
    const searchParams = useSearchParams();
    const router = useRouter();

    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [disconnecting, setDisconnecting] = useState<string | null>(null);

    useEffect(() => {
        if (connected === 'meta') {
            setBanner({ type: 'success', message: 'Meta accounts connected successfully.' });
            router.replace(`/${tenantId}/marketing/accounts`);
        } else if (error === 'meta_failed') {
            setBanner({ type: 'error', message: 'Meta connection failed. Please try again.' });
            router.replace(`/${tenantId}/marketing/accounts`);
        } else if (error === 'not_configured') {
            setBanner({ type: 'error', message: 'Meta credentials are not configured. Contact HVG support.' });
            router.replace(`/${tenantId}/marketing/accounts`);
        } else if (error === 'meta_invalid') {
            setBanner({ type: 'error', message: 'Invalid OAuth response from Meta. Please try again.' });
            router.replace(`/${tenantId}/marketing/accounts`);
        }
    }, [connected, error, tenantId, router]);

    async function handleDisconnect(account: SocialAccount) {
        setDisconnecting(account.id);
        try {
            const res = await fetch(`/api/tenants/${tenantId}/marketing/accounts`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: account.id }),
            });
            if (!res.ok) {
                const data = await res.json() as { error?: string };
                setBanner({ type: 'error', message: data.error ?? 'Failed to disconnect account.' });
            } else {
                setBanner({ type: 'success', message: `${PLATFORM_CONFIG[account.platform].label} disconnected.` });
            }
        } catch {
            setBanner({ type: 'error', message: 'Network error. Please try again.' });
        } finally {
            setDisconnecting(null);
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Connected Accounts</h1>
                <p className="text-gray-500 mt-1">Link your social platforms to publish posts directly</p>
            </div>

            {banner && (
                <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between ${
                    banner.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                    <span>{banner.message}</span>
                    <button onClick={() => setBanner(null)} className="ml-4 text-current opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {loading ? (
                <div className="text-gray-400 text-sm">Loading...</div>
            ) : (
                <div className="space-y-3">
                    {AVAILABLE_PLATFORMS.map(platform => {
                        const config = PLATFORM_CONFIG[platform];
                        const account = accounts.find(a => a.platform === platform && a.status === 'active');
                        const isConnected = !!account;

                        return (
                            <div key={platform} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 ${config.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                                        {config.icon}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{config.label}</p>
                                        {isConnected ? (
                                            <p className="text-xs text-emerald-600">Connected as {account?.accountName}</p>
                                        ) : (
                                            <p className="text-xs text-gray-400">Not connected</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {isConnected ? (
                                        <>
                                            <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">Active</span>
                                            <button
                                                onClick={() => account && handleDisconnect(account)}
                                                disabled={disconnecting === account?.id}
                                                className="text-sm px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {disconnecting === account?.id ? 'Disconnecting...' : 'Disconnect'}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {config.comingSoon && (
                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Coming Soon</span>
                                            )}
                                            <button
                                                onClick={() => { window.location.href = getOAuthUrl(tenantId, platform); }}
                                                className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                            >
                                                Connect
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
