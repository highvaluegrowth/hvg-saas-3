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

    const [activeTab, setActiveTab] = useState<'stats' | 'universal'>('stats');

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-6 min-h-screen bg-[#0F071A] text-white rounded-xl">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase">Global Content & Marketing</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage tenant marketing activity and publish universal mobile content.</p>
                </div>
                <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'stats' ? 'bg-[#D946EF] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Activity & Templates
                    </button>
                    <button 
                        onClick={() => setActiveTab('universal')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'universal' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Universal Content
                    </button>
                </div>
            </div>

            {activeTab === 'stats' ? (
                <>
                    {/* Tenant stats */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Organization Marketing Activity</h2>
                        </div>
                        {loading ? (
                            <div className="p-10 text-center text-slate-500 animate-pulse">Synchronizing activity data...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/5 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase">
                                        <tr>
                                            <th className="text-left px-6 py-4">Organization</th>
                                            <th className="text-left px-6 py-4">Posts This Month</th>
                                            <th className="text-left px-6 py-4">Last Published</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-slate-300">
                                        {stats.length === 0 ? (
                                            <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic">No marketing data recorded yet.</td></tr>
                                        ) : stats.map(s => (
                                            <tr key={s.tenantId} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-bold text-white">{s.name}</td>
                                                <td className="px-6 py-4">{s.postsThisMonth}</td>
                                                <td className="px-6 py-4 text-xs font-mono">{s.lastPublished ? new Date(s.lastPublished).toLocaleDateString() : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Template library */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">AI Marketing Templates</h2>
                            <button onClick={() => setShowNewTemplate(!showNewTemplate)}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20">
                                {showNewTemplate ? 'Close' : '+ Create Template'}
                            </button>
                        </div>

                        {showNewTemplate && (
                            <div className="bg-black/40 border-b border-white/5 p-8 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input placeholder="Template name (e.g. Bed Availability Alert)" value={newTemplate.name}
                                        onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))}
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                                    <select value={newTemplate.category}
                                        onChange={e => setNewTemplate(p => ({ ...p, category: e.target.value as MarketingTemplate['category'] }))}
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                                        {Object.entries(POST_TYPE_LABELS).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <textarea placeholder="Prompt hint: Tell the AI how to style this post. (e.g. Professional yet welcoming, highlight location...)" value={newTemplate.promptHint}
                                    onChange={e => setNewTemplate(p => ({ ...p, promptHint: e.target.value }))} rows={3}
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
                                <input placeholder="Default hashtags: recovery, soberliving, match (comma separated)" value={newTemplate.defaultHashtags}
                                    onChange={e => setNewTemplate(p => ({ ...p, defaultHashtags: e.target.value }))}
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                                <div className="flex gap-3 justify-end pt-2">
                                    <button onClick={createTemplate} disabled={saving || !newTemplate.name}
                                        className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold uppercase disabled:opacity-40 hover:bg-emerald-500 transition-all active:scale-[0.98]">
                                        {saving ? 'Creating...' : 'Finalize Template'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-white/5 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase">
                                    <tr>
                                        <th className="text-left px-6 py-4">Name</th>
                                        <th className="text-left px-6 py-4">Category</th>
                                        <th className="text-left px-6 py-4">Default Hashtags</th>
                                        <th className="text-left px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {templates.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">No templates defined.</td></tr>
                                    ) : templates.map(t => (
                                        <tr key={t.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-bold text-white">{t.name}</td>
                                            <td className="px-6 py-4 text-slate-400 font-medium">{POST_TYPE_LABELS[t.category] ?? t.category}</td>
                                            <td className="px-6 py-4 text-slate-500 text-xs font-mono">{t.defaultHashtags.slice(0, 3).map(h => `#${h}`).join(' ')}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${t.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                                                    {t.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto border border-cyan-500/20">
                        <span className="text-4xl text-cyan-400">🌍</span>
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                        <h2 className="text-xl font-bold text-white">Universal Content Management</h2>
                        <p className="text-sm text-slate-400">Draft and publish courses, events, and announcements that appear globally for every user on the mobile application.</p>
                    </div>
                    <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                        <button className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all group">
                            <div className="text-2xl mb-3">📚</div>
                            <div className="text-xs font-black uppercase tracking-widest text-white group-hover:text-cyan-400 transition-colors">Global Course</div>
                        </button>
                        <button className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all group">
                            <div className="text-2xl mb-3">📅</div>
                            <div className="text-xs font-black uppercase tracking-widest text-white group-hover:text-cyan-400 transition-colors">Global Event</div>
                        </button>
                        <button className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all group">
                            <div className="text-2xl mb-3">📣</div>
                            <div className="text-xs font-black uppercase tracking-widest text-white group-hover:text-cyan-400 transition-colors">Global Post</div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
