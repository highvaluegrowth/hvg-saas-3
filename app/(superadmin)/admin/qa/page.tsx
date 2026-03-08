'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { qaService } from '@/features/qa/services/qaService';
import { QAFeedback, QAFeedbackStatus, FeedbackType } from '@/features/qa/types/qa.types';
import { Bug, CheckCircle2, ChevronDown, ChevronUp, Copy, MessageSquare, Paintbrush, CircleDashed, ExternalLink, Sparkles } from 'lucide-react';

function formatDate(value: string | { _seconds: number } | undefined | null): string {
    if (!value) return '—';
    if (typeof value === 'string') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? value : d.toLocaleString();
    }
    if (value._seconds) {
        return new Date(value._seconds * 1000).toLocaleString();
    }
    return '—';
}

const TYPE_CONFIG: Record<FeedbackType, { color: string; icon: React.ReactNode }> = {
    'Bug': { color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', icon: <Bug size={14} className="mr-1.5" /> },
    'Suggestion': { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: <MessageSquare size={14} className="mr-1.5" /> },
    'UI Issue': { color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20', icon: <Paintbrush size={14} className="mr-1.5" /> },
    'Design Reference': { color: 'text-violet-500 bg-violet-500/10 border-violet-500/20', icon: <Sparkles size={14} className="mr-1.5" /> },
};

function FeedbackRow({ item, onStatusChange }: { item: QAFeedback; onStatusChange: (id: string, status: QAFeedbackStatus) => void }) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG['Suggestion'];

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();

        let antigravityPrompt = '';

        if (item.type === 'Design Reference') {
            antigravityPrompt = `
Here is a Design Reference from the ${item.route} route. Use this exact DOM structure, component styling, and Tailwind class combination as the baseline standard for...
${item.description}

## Target Element Data
\`\`\`json
${JSON.stringify(item.targetElement, null, 2)}
\`\`\`
            `.trim();
        } else {
            antigravityPrompt = `
# QA Feedback Issue to Fix

**Type:** ${item.type}
**Status:** ${item.status}
**Route/Context:** ${item.route}
**Reporter ID:** ${item.reporterId || 'Unknown'}

## Description
${item.description}

## Target Element Data
\`\`\`json
${JSON.stringify(item.targetElement, null, 2)}
\`\`\`
            `.trim();
        }

        navigator.clipboard.writeText(antigravityPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <tr
                className="hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0"
                onClick={() => setExpanded(!expanded)}
            >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                        {item.status === 'open' ? (
                            <CircleDashed size={16} className="text-purple-500" />
                        ) : item.status === 'resolved' ? (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : (
                            <CheckCircle2 size={16} className="text-slate-400" />
                        )}
                        <select
                            value={item.status}
                            onChange={(e) => onStatusChange(item.id!, e.target.value as QAFeedbackStatus)}
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 p-0 cursor-pointer hover:bg-slate-50 capitalize"
                        >
                            <option value="open">Open</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${config.color}`}>
                        {config.icon}
                        {item.type}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                    <div className="max-w-[200px] truncate" title={item.route}>
                        {item.route}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="max-w-[300px] truncate" title={item.description}>
                        {item.description}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatDate(item.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-400">
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </td>
            </tr>

            {expanded && (
                <tr className="bg-slate-50/50 border-b border-slate-100">
                    <td colSpan={6} className="px-6 py-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 mb-1">Description</h4>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.description}</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Target Context</h4>
                                    <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                                        <pre className="text-xs text-slate-300 font-mono">
                                            {JSON.stringify(item.targetElement, null, 2)}
                                        </pre>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        onClick={handleCopy}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors"
                                    >
                                        <Copy size={14} />
                                        {copied ? 'Copied to Clipboard' : 'Copy for Antigravity'}
                                    </button>

                                    <a
                                        href={item.route}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors"
                                    >
                                        <ExternalLink size={14} />
                                        Visit Route
                                    </a>
                                </div>
                            </div>

                            {item.screenshotDataUrl && (
                                <div className="w-full lg:w-1/3 shrink-0">
                                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Screenshot Extract</h4>
                                    <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={item.screenshotDataUrl}
                                            alt="QA Screenshot"
                                            className="w-full h-auto object-contain max-h-[300px]"
                                        />
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

export default function SuperAdminQADashboard() {
    const { user } = useAuth();
    const [feedback, setFeedback] = useState<QAFeedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleStatusChange = async (id: string, newStatus: QAFeedbackStatus) => {
        try {
            await qaService.updateQAFeedbackStatus(id, newStatus);
            setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    useEffect(() => {
        async function fetchFeedback() {
            if (!user) return;
            try {
                const data = await qaService.getAllQAFeedback();
                setFeedback(data || []);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch QA feedback. Insufficient permissions or network error.';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        }

        fetchFeedback();
    }, [user]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">QA Feedback Center</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Review, categorize, and convert user feedback into actionable prompts for Antigravity.
                    </p>
                </div>
                {!loading && !error && (
                    <span className="text-sm text-slate-500 mt-1 pt-1 bg-slate-100 px-3 py-1 rounded-full font-medium">
                        {feedback.length} item{feedback.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center animate-pulse flex flex-col items-center justify-center">
                        <div className="h-8 w-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4" />
                        <p className="text-slate-500 text-sm font-medium">Loading QA intelligence...</p>
                    </div>
                ) : error ? (
                    <div className="p-10 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                            <CircleDashed size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-1">Access Restricted</h3>
                        <p className="text-slate-500 text-sm">{error}</p>
                    </div>
                ) : feedback.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-400 mb-4 border border-slate-100">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="mt-2 text-base font-medium text-slate-900">All Clear</h3>
                        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                            No feedback has been submitted yet. When users submit bug reports or suggestions via the Global QA Tool, they will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50/80">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Route Context</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reported</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Expand</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {feedback.map((item) => (
                                    <FeedbackRow key={item.id} item={item} onStatusChange={handleStatusChange} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
