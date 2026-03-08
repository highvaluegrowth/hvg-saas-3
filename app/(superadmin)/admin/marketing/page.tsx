// app/admin/marketing/page.tsx
'use client';
import { useState, useEffect } from 'react';
import type { MarketingTemplate } from '@/features/marketing/types';

type TenantStat = { tenantId: string; name: string; postsThisMonth: number; lastPublished: string | null };

export default function AdminMarketingPage() {
    const [stats, setStats] = useState<TenantStat[]>([]);
    const [templates, setTemplates] = useState<MarketingTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewTemplate, setShowNewTemplate] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        category: 'general' as MarketingTemplate['category'],
        promptHint: '',
        defaultHashtags: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/admin/marketing')
            .then(r => r.json())
            .then(d => { setStats(d.stats ?? []); setTemplates(d.templates ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    async function createTemplate() {
        setSaving(true);
        try {
            await fetch('/api/admin/marketing/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newTemplate.name,
                    category: newTemplate.category,
                    promptHint: newTemplate.promptHint,
                    defaultHashtags: newTemplate.defaultHashtags.split(',').map(t => t.trim()).filter(Boolean),
                    active: true,
                }),
            });
            setShowNewTemplate(false);
            setNewTemplate({ name: '', category: 'general', promptHint: '', defaultHashtags: '' });
            // Refresh
            const res = await fetch('/api/admin/marketing');
            const d = await res.json();
            setTemplates(d.templates ?? []);
        } finally {
            setSaving(false);
        }
    }

    const POST_TYPE_LABELS: Record<string, string> = {
        bed_availability: 'Bed Availability',
        success_story: 'Success Story',
        event_promo: 'Event Promo',
        job_listing: 'Job Listing',
        general: 'General',
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Marketing Overview</h1>

            {/* Tenant stats */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Tenant Activity</h2>
                {loading ? (
                    <div className="text-gray-400 text-sm">Loading...</div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Tenant</th>
                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Posts This Month</th>
                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Last Published</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.length === 0 ? (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No tenant data yet</td></tr>
                                ) : stats.map(s => (
                                    <tr key={s.tenantId} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{s.postsThisMonth}</td>
                                        <td className="px-4 py-3 text-gray-400">{s.lastPublished ? new Date(s.lastPublished).toLocaleDateString() : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Template library */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Template Library</h2>
                    <button onClick={() => setShowNewTemplate(!showNewTemplate)}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
                        + New Template
                    </button>
                </div>

                {showNewTemplate && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
                        <input placeholder="Template name" value={newTemplate.name}
                            onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        <select value={newTemplate.category}
                            onChange={e => setNewTemplate(p => ({ ...p, category: e.target.value as MarketingTemplate['category'] }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            {Object.entries(POST_TYPE_LABELS).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                        <textarea placeholder="Prompt hint (injected into AI generation)" value={newTemplate.promptHint}
                            onChange={e => setNewTemplate(p => ({ ...p, promptHint: e.target.value }))} rows={3}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        <input placeholder="Default hashtags (comma-separated, no #)" value={newTemplate.defaultHashtags}
                            onChange={e => setNewTemplate(p => ({ ...p, defaultHashtags: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        <div className="flex gap-2">
                            <button onClick={() => setShowNewTemplate(false)}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">Cancel</button>
                            <button onClick={createTemplate} disabled={saving || !newTemplate.name}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm disabled:opacity-40">
                                {saving ? 'Saving...' : 'Save Template'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Category</th>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Default Hashtags</th>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {templates.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No templates yet</td></tr>
                            ) : templates.map(t => (
                                <tr key={t.id}>
                                    <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                                    <td className="px-4 py-3 text-gray-500">{POST_TYPE_LABELS[t.category] ?? t.category}</td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">{t.defaultHashtags.slice(0, 3).map(h => `#${h}`).join(' ')}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {t.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
