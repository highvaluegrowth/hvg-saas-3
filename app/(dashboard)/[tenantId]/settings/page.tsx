'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { authService } from '@/features/auth/services/authService';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function SettingsPage() {
    const { tenantId } = useParams<{ tenantId: string }>();
    const { user } = useAuth();

    const [apiKey, setApiKey] = useState('');
    const [apiKeySaved, setApiKeySaved] = useState(false);
    const [apiKeyLoading, setApiKeyLoading] = useState(true);
    const [apiKeySaving, setApiKeySaving] = useState(false);
    const [showKey, setShowKey] = useState(false);

    const [logoUrl, setLogoUrl] = useState('');
    const [logoSaved, setLogoSaved] = useState(false);
    const [coverUrl, setCoverUrl] = useState('');
    const [coverSaved, setCoverSaved] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [avatarSaved, setAvatarSaved] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const token = await authService.getIdToken();
                const res = await fetch(`/api/tenants/${tenantId}/settings`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) {
                    const data = await res.json();
                    setApiKey(data.settings?.aiApiKey ? '••••••••••••••••' : '');
                    setApiKeySaved(!!data.settings?.aiApiKey);
                    if (data.settings?.logoUrl) setLogoUrl(data.settings.logoUrl);
                    if (data.settings?.coverUrl) setCoverUrl(data.settings.coverUrl);
                }
            } catch { /* fail silently */ }
            finally { setApiKeyLoading(false); }
        }
        loadSettings();
    }, [tenantId]);

    async function handleSaveApiKey(e: React.FormEvent) {
        e.preventDefault();
        if (!apiKey.trim() || apiKey === '••••••••••••••••') return;
        setApiKeySaving(true);
        try {
            const token = await authService.getIdToken();
            const res = await fetch(`/api/tenants/${tenantId}/settings`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ aiApiKey: apiKey.trim() }) });
            if (res.ok) { setApiKeySaved(true); setApiKey('••••••••••••••••'); setShowKey(false); }
        } catch { /* fail silently */ }
        finally { setApiKeySaving(false); }
    }

    async function handleClearApiKey() {
        setApiKeySaving(true);
        try {
            const token = await authService.getIdToken();
            await fetch(`/api/tenants/${tenantId}/settings`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ aiApiKey: null }) });
            setApiKey(''); setApiKeySaved(false);
        } finally { setApiKeySaving(false); }
    }

    async function handleSaveLogo(url: string) {
        setLogoUrl(url);
        try { const token = await authService.getIdToken(); await fetch(`/api/tenants/${tenantId}/settings`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ logoUrl: url }) }); setLogoSaved(true); setTimeout(() => setLogoSaved(false), 3000); } catch {/**/ }
    }

    async function handleSaveCover(url: string) {
        setCoverUrl(url);
        try { const token = await authService.getIdToken(); await fetch(`/api/tenants/${tenantId}/settings`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ coverUrl: url }) }); setCoverSaved(true); setTimeout(() => setCoverSaved(false), 3000); } catch {/**/ }
    }

    async function handleSaveAvatar(url: string) {
        setAvatarUrl(url);
        try { const token = await authService.getIdToken(); await fetch(`/api/auth/profile`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ avatarUrl: url }) }); setAvatarSaved(true); setTimeout(() => setAvatarSaved(false), 3000); } catch {/**/ }
    }

    const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };
    const cardHeaderBorder: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.07)' };

    const iconBadgeStyle: React.CSSProperties = { background: 'rgba(8,145,178,0.15)', border: '1px solid rgba(8,145,178,0.25)' };

    const SavedBadge = ({ label }: { label: string }) => (
        <p className="flex items-center gap-1.5 text-sm" style={{ color: '#6EE7B7' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            {label}
        </p>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Manage your organization preferences and integrations.</p>
            </div>

            {/* Branding */}
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="px-6 py-4" style={cardHeaderBorder}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={iconBadgeStyle}>
                            <svg className="w-4 h-4" style={{ color: '#67E8F9' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white">Organisation Branding</h2>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Logo and cover image shown throughout the platform</p>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>Organisation Logo</label>
                        <ImageUpload storagePath={`tenants/${tenantId}/logo`} onUpload={handleSaveLogo} currentUrl={logoUrl || undefined} />
                        {logoSaved && <div className="mt-2"><SavedBadge label="Logo saved" /></div>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>Cover / Banner Image</label>
                        <ImageUpload storagePath={`tenants/${tenantId}/cover`} onUpload={handleSaveCover} currentUrl={coverUrl || undefined} />
                        {coverSaved && <div className="mt-2"><SavedBadge label="Cover saved" /></div>}
                    </div>
                </div>
            </div>

            {/* Profile Photo */}
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="px-6 py-4" style={cardHeaderBorder}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={iconBadgeStyle}>
                            <svg className="w-4 h-4" style={{ color: '#67E8F9' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white">Your Profile Photo</h2>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{user?.email ?? 'Shown next to your name across the platform'}</p>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-5">
                    <div className="flex items-start gap-6">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Your profile photo" className="w-20 h-20 rounded-full object-cover flex-shrink-0" style={{ border: '2px solid rgba(8,145,178,0.4)' }} />
                        ) : (
                            <div className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(8,145,178,0.15)', border: '2px solid rgba(8,145,178,0.3)' }}>
                                <span className="text-2xl font-bold" style={{ color: '#67E8F9' }}>{user?.email?.[0]?.toUpperCase() ?? '?'}</span>
                            </div>
                        )}
                        <div className="flex-1">
                            <ImageUpload storagePath={`tenants/${tenantId}/users/${user?.uid ?? 'me'}/avatar`} onUpload={handleSaveAvatar} currentUrl={avatarUrl || undefined} />
                            {avatarSaved && <div className="mt-2"><SavedBadge label="Profile photo saved" /></div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Configuration */}
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="px-6 py-4" style={cardHeaderBorder}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={iconBadgeStyle}>
                            <svg className="w-4 h-4" style={{ color: '#67E8F9' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white">HVG Partner — AI Configuration</h2>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Bring your own Gemini API key for premium AI features</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Info notice */}
                    <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <p className="text-sm" style={{ color: 'rgba(253,230,138,0.9)' }}>
                            <strong className="text-amber-300">Optional:</strong> By default, HVG Partner uses shared AI capacity. Enter your own{' '}
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-amber-200">
                                Google AI / Gemini API key
                            </a>{' '}
                            to use your own quota and unlock higher rate limits.
                        </p>
                    </div>

                    {apiKeyLoading ? (
                        <div className="h-10 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    ) : (
                        <form onSubmit={handleSaveApiKey} className="flex flex-col gap-3">
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Gemini API Key</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIza..."
                                            className="w-full px-3 py-2.5 text-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono placeholder-white/25"
                                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} autoComplete="off" />
                                        <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                            {showKey ? (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                    <button type="submit" disabled={apiKeySaving || !apiKey.trim() || apiKey === '••••••••••••••••'}
                                        className="px-4 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
                                        style={{ background: 'linear-gradient(135deg,#0891B2,#059669)' }}>
                                        {apiKeySaving ? 'Saving…' : 'Save'}
                                    </button>
                                    {apiKeySaved && (
                                        <button type="button" onClick={handleClearApiKey} disabled={apiKeySaving}
                                            className="px-4 py-2.5 text-sm font-medium rounded-xl disabled:opacity-50 transition-all"
                                            style={{ color: 'rgba(248,113,113,0.9)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                            {apiKeySaved && (
                                <p className="flex items-center gap-1.5 text-sm" style={{ color: '#6EE7B7' }}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                    Your API key is saved and active
                                </p>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
