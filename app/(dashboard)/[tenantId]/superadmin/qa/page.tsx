'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { qaService } from '@/features/qa/services/qaService';
import { QAFeedback, QAFeedbackStatus, FeedbackType } from '@/features/qa/types/qa.types';
import { Bug, CheckCircle2, ChevronDown, ChevronUp, Copy, MessageSquare, Paintbrush, CircleDashed, ExternalLink, Sparkles } from 'lucide-react';

function formatDate(value: string | { _seconds: number } | undefined | null): string {
    if (!value) return '—';
    if (typeof value === 'string') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? value : d.toLocaleString();
    }
    if ((value as { _seconds: number })._seconds) {
        return new Date((value as { _seconds: number })._seconds * 1000).toLocaleString();
    }
    return '—';
}

const TYPE_CONFIG: Record<FeedbackType, { color: string; icon: React.ReactNode }> = {
    'Bug': { color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', icon: <Bug size={14} className="mr-1.5" /> },
    'Suggestion': { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: <MessageSquare size={14} className="mr-1.5" /> },
    'UI Issue': { color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20', icon: <Paintbrush size={14} className="mr-1.5" /> },
    'Design Reference': { color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: <Sparkles size={14} className="mr-1.5" /> },
};

function FeedbackRow({ item, onStatusChange }: { item: QAFeedback; onStatusChange: (id: string, status: QAFeedbackStatus) => void }) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG['Suggestion'];

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const prompt = item.type === 'Design Reference'
            ? `Here is a Design Reference from the ${item.route} route.\n${item.description}\n\n\`\`\`json\n${JSON.stringify(item.targetElement, null, 2)}\n\`\`\``
            : `# QA Feedback\n**Type:** ${item.type}\n**Route:** ${item.route}\n\n## Description\n${item.description}\n\n\`\`\`json\n${JSON.stringify(item.targetElement, null, 2)}\n\`\`\``;
        navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <tr className="hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0" onClick={() => setExpanded(!expanded)}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                        {item.status === 'open' ? (
                            <CircleDashed size={16} className="text-cyan-400" />
                        ) : (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                        )}
                        <select
                            value={item.status}
                            onChange={(e) => onStatusChange(item.id!, e.target.value as QAFeedbackStatus)}
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 p-0 cursor-pointer text-white capitalize"
                            style={{ background: 'transparent' }}
                        >
                            <option value="open" style={{ background: '#0C1A2E' }}>Open</option>
                            <option value="resolved" style={{ background: '#0C1A2E' }}>Resolved</option>
                            <option value="closed" style={{ background: '#0C1A2E' }}>Closed</option>
                        </select>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${config.color}`}>
                        {config.icon}{item.type}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                    <div className="max-w-[200px] truncate" title={item.route}>{item.route}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    <div className="max-w-[300px] truncate" title={item.description}>{item.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(item.createdAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-400">
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </td>
            </tr>
            {expanded && (
                <tr className="bg-white/[0.02] border-b border-white/5">
                    <td colSpan={6} className="px-6 py-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-1">Description</h4>
                                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{item.description}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-2">Target Context</h4>
                                    <div className="bg-black/40 rounded-lg p-3 overflow-x-auto border border-white/10">
                                        <pre className="text-xs text-slate-300 font-mono">{JSON.stringify(item.targetElement, null, 2)}</pre>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button onClick={handleCopy} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white text-sm font-medium rounded-md hover:bg-white/20 transition-colors border border-white/10">
                                        <Copy size={14} />
                                        {copied ? 'Copied!' : 'Copy for AI'}
                                    </button>
                                    <a href={item.route} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-slate-300 text-sm font-medium rounded-md hover:bg-white/10 transition-colors">
                                        <ExternalLink size={14} />
                                        Visit Route
                                    </a>
                                </div>
                            </div>
                            {item.screenshotDataUrl && (
                                <div className="w-full lg:w-1/3 shrink-0">
                                    <h4 className="text-sm font-semibold text-white mb-2">Screenshot</h4>
                                    <div className="relative rounded-lg overflow-hidden border border-white/10">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={item.screenshotDataUrl} alt="QA Screenshot" className="w-full h-auto object-contain max-h-[300px]" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function SuperAdminQAPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'feedback' | 'incidents'>('feedback');
    const [feedback, setFeedback] = useState<QAFeedback[]>([]);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const handleStatusChange = async (id: string, newStatus: QAFeedbackStatus) => {
        try {
            await qaService.updateQAFeedbackStatus(id, newStatus);
            setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            setLoading(true);
            try {
                const token = await authService.getIdToken();
                const [qaData, incidentsRes] = await Promise.all([
                    qaService.getAllQAFeedback(),
                    fetch('/api/admin/incidents', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setFeedback(qaData || []);
                if (incidentsRes.ok) {
                    const data = await incidentsRes.json();
                    setIncidents(data.incidents || []);
                }
            } catch (err) {
                console.error('QA fetch failed:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Safety & Quality Oversight</h1>
                <p className="text-sm text-slate-400 mt-1">Monitor platform health, HIPAA-protected incidents, and user feedback.</p>
            </div>

            <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('feedback')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'feedback' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    QA Feedback ({feedback.length})
                </button>
                <button
                    onClick={() => setActiveTab('incidents')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'incidents' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    High-Intensity Incidents ({incidents.length})
                </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing data...</p>
                    </div>
                ) : activeTab === 'feedback' ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/5">
                                <tr>
                                    {['Status', 'Type', 'Route Context', 'Description', 'Reported', ''].map(h => (
                                        <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {feedback.map((item) => (
                                    <FeedbackRow key={item.id} item={item} onStatusChange={handleStatusChange} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/5">
                                <tr>
                                    {['Organization', 'Incident', 'Resident', 'Reported', 'Action'].map(h => (
                                        <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {incidents.length === 0 ? (
                                    <tr><td colSpan={5} className="p-20 text-center text-slate-500 italic">No high-intensity incidents reported.</td></tr>
                                ) : incidents.map(inc => (
                                    <tr key={inc.id} className="hover:bg-red-500/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white">{inc.tenantName}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium">{inc.title}</div>
                                            <div className="text-[10px] text-red-400 font-bold uppercase">{inc.type}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">{inc.residentName}</td>
                                        <td className="px-6 py-4 text-slate-400">{formatDate(inc.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <button className="bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold uppercase border border-white/10">Log Audit Access</button>
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
