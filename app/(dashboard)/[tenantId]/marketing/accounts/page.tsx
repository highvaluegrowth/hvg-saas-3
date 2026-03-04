// app/(dashboard)/[tenantId]/marketing/accounts/page.tsx
'use client';
import { use } from 'react';
import { useAccounts } from '@/features/marketing/hooks/useAccounts';
import type { SocialPlatform } from '@/features/marketing/types';

const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; color: string; icon: string }> = {
    facebook: { label: 'Facebook', color: 'bg-blue-600', icon: 'f' },
    instagram: { label: 'Instagram', color: 'bg-pink-500', icon: '📷' },
    tiktok: { label: 'TikTok', color: 'bg-gray-900', icon: '♪' },
    x: { label: 'X / Twitter', color: 'bg-gray-800', icon: '𝕏' },
    linkedin: { label: 'LinkedIn', color: 'bg-blue-700', icon: 'in' },
};

const AVAILABLE_PLATFORMS: SocialPlatform[] = ['facebook', 'instagram', 'tiktok', 'x', 'linkedin'];

async function handleConnect(tenantId: string) {
    const res = await fetch(`/api/oauth/meta/authorize?tenantId=${tenantId}`);
    const data = await res.json();
    alert(data.message ?? 'Coming soon!');
}

export default function AccountsPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const { accounts, loading } = useAccounts(tenantId);

    const connectedPlatforms = new Set(accounts.filter(a => a.status === 'active').map(a => a.platform));

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Connected Accounts</h1>
                <p className="text-gray-500 mt-1">Link your social platforms to publish posts directly</p>
            </div>
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
                                {isConnected ? (
                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">Active</span>
                                ) : (
                                    <button onClick={() => handleConnect(tenantId)}
                                        className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                                        Connect
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <strong>Coming Soon:</strong> Direct publishing to Facebook and Instagram is in progress. For now, use the composer to create and save posts to your library, then copy them manually to your social accounts.
            </div>
        </div>
    );
}
