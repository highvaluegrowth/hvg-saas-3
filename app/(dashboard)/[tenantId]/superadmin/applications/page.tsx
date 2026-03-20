'use client';

// Tenant Approvals — embedded in the Tenant Dashboard for super_admin.
// Calls the same /api/admin/* endpoints as the standalone /admin/applications page.

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApplicationType = 'bed' | 'staff' | 'course' | 'event' | 'tenant';
type ApplicationStatus = 'pending_triage' | 'pending' | 'assigned_to_tenant' | 'assigned' | 'reviewing' | 'accepted' | 'waitlisted' | 'rejected' | 'archived';

interface Application {
    id: string;
    type: ApplicationType;
    status: ApplicationStatus;
    applicantName: string;
    applicantEmail: string;
    zipCode?: string;
    submittedAt: string | { _seconds: number };
    requestedTenantId?: string;
    data?: Record<string, unknown>;
}

interface Tenant {
    id: string;
    name: string;
}

interface TenantMatchScore {
    tenantId: string;
    tenantName: string;
    city: string;
    state: string;
    score: number;
    distanceMiles: number;
    financialMatch: string;
    isSorEligible: boolean;
    hasCapacity: boolean;
    availableBeds?: number;
}

// ─── Badge Helpers ────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, string> = {
    bed: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    staff: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
    course: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
    event: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    tenant: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
};

const STATUS_BADGE: Record<string, string> = {
    pending_triage: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    pending: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    assigned_to_tenant: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    assigned: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    accepted: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20',
    rejected: 'bg-red-500/20 text-red-300 border border-red-500/30',
    archived: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
    waitlisted: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
};

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_BADGE[status] ?? 'bg-white/5 text-slate-400 border border-white/10'}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}

function TypeBadge({ type }: { type: string }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${TYPE_BADGE[type] ?? 'bg-white/5 text-slate-400 border border-white/10'}`}>
            {type}
        </span>
    );
}

function formatDate(value: string | { _seconds: number } | null | undefined): string {
    if (!value) return '—';
    if (typeof value === 'string') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? value : d.toLocaleDateString();
    }
    if (value._seconds) {
        return new Date(value._seconds * 1000).toLocaleDateString();
    }
    return '—';
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SuperAdminApplicationsPage() {
    const { user } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);

    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('pending_triage');

    // Dispatch Modal
    const [dispatchApp, setDispatchApp] = useState<Application | null>(null);
    const [matches, setMatches] = useState<TenantMatchScore[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [matchSort, setMatchSort] = useState<'score' | 'distance' | 'availability'>('score');
    const [selectedTenantId, setSelectedTenantId] = useState<string>('');
    const [dispatching, setDispatching] = useState(false);

    const sortedMatches = useMemo(() => {
        return [...matches].sort((a, b) => {
            if (matchSort === 'score') return b.score - a.score;
            if (matchSort === 'distance') return a.distanceMiles - b.distanceMiles;
            if (matchSort === 'availability') {
                if (a.hasCapacity && !b.hasCapacity) return -1;
                if (!a.hasCapacity && b.hasCapacity) return 1;
                return b.score - a.score;
            }
            return 0;
        });
    }, [matches, matchSort]);

    // Rejection Modal
    const [rejectingApp, setRejectingApp] = useState<Application | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rectificationSteps, setRectificationSteps] = useState('');
    const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await authService.getIdToken();
            const [appRes, tenantRes] = await Promise.all([
                fetch('/api/admin/applications', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/tenants', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const appData = await appRes.json();
            const tenantData = await tenantRes.json();
            setApplications(appData.applications || []);
            setTenants(tenantData.tenants || []);
        } catch (err) {
            console.error('Failed to fetch inbox data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleDispatchClick = async (app: Application) => {
        setDispatchApp(app);
        setMatches([]);
        setLoadingMatches(true);
        try {
            const token = await authService.getIdToken();
            const res = await fetch(`/api/admin/applications/${app.id}/matches`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setMatches(data.matches || []);
            }
        } catch (err) {
            console.error('Failed to fetch matches:', err);
        } finally {
            setLoadingMatches(false);
        }
    };

    const handleDispatch = async () => {
        if (!dispatchApp || !selectedTenantId) return;
        setDispatching(true);
        try {
            const token = await authService.getIdToken();
            const res = await fetch(`/api/admin/applications/${dispatchApp.id}/assign`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: selectedTenantId }),
            });
            if (!res.ok) throw new Error('Failed to dispatch application');
            setApplications(prev => prev.map(a =>
                a.id === dispatchApp.id ? { ...a, status: 'assigned_to_tenant' } : a
            ));
            setDispatchApp(null);
            setSelectedTenantId('');
        } catch (err) {
            alert(err instanceof Error ? err.message : String(err));
        } finally {
            setDispatching(false);
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectingApp) return;
        setIsSubmittingRejection(true);
        try {
            const token = await authService.getIdToken();
            const res = await fetch(`/api/admin/applications/${rejectingApp.id}/reject`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectionReason, rectification: rectificationSteps }),
            });
            if (!res.ok) throw new Error('Failed to reject application');
            setApplications(prev => prev.map(a =>
                a.id === rejectingApp.id ? { ...a, status: 'rejected' } : a
            ));
            setRejectingApp(null);
            setRejectionReason('');
            setRectificationSteps('');
        } catch (err) {
            alert(err instanceof Error ? err.message : String(err));
        } finally {
            setIsSubmittingRejection(false);
        }
    };

    const handleApproveTenant = async (app: Application) => {
        if (!confirm(`Approve tenant application for ${app.applicantName}?`)) return;
        try {
            const token = await authService.getIdToken();
            const res = await fetch(`/api/admin/applications/${app.id}/approve-tenant`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to approve tenant');
            setApplications(prev => prev.map(a =>
                a.id === app.id ? { ...a, status: 'accepted' } : a
            ));
            alert('Tenant approved and onboarding initialized.');
        } catch (err) {
            alert(err instanceof Error ? err.message : String(err));
        }
    };

    const filteredApplications = applications.filter((app) => {
        const matchesType = typeFilter === 'all' || app.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchesType && matchesStatus;
    });

    const pendingTriageCount = applications.filter(a => a.status === 'pending_triage').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">Tenant Approvals</h2>
                        {pendingTriageCount > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                {pendingTriageCount} pending
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">Review and dispatch placement or organization requests.</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex gap-2 p-1 bg-black/20 rounded-xl">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'pending_triage', label: 'Triage' },
                        { id: 'assigned_to_tenant', label: 'Assigned' },
                        { id: 'accepted', label: 'Accepted' },
                        { id: 'rejected', label: 'Rejected' },
                    ].map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setStatusFilter(id)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === id
                                ? 'bg-cyan-700 text-white shadow-lg'
                                : 'text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                >
                    <option value="all">All Types</option>
                    <option value="bed">Bed Application</option>
                    <option value="staff">Staff Application</option>
                    <option value="tenant">Tenant Request</option>
                    <option value="course">LMS Course</option>
                    <option value="event">Program Event</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading...</p>
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="text-4xl mb-4 opacity-20">📥</div>
                        <p className="text-slate-500 font-medium italic">No applications matching your current filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Applicant</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Submitted</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredApplications.map((app) => (
                                    <tr key={app.id} className="hover:bg-white/[0.03] transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">{app.applicantName}</div>
                                            <div className="text-[10px] text-slate-500 font-medium">{app.applicantEmail}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap"><TypeBadge type={app.type} /></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-400">{app.zipCode || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={app.status} /></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 tabular-nums">{formatDate(app.submittedAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2">
                                                {app.status === 'pending_triage' && (
                                                    <>
                                                        {(app.type === 'bed' || app.type === 'staff') ? (
                                                            <button
                                                                onClick={() => handleDispatchClick(app)}
                                                                className="text-white bg-cyan-700 hover:bg-cyan-600 px-3 py-1.5 rounded-lg text-xs transition-colors shadow-lg shadow-cyan-500/20"
                                                            >
                                                                Dispatch
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleApproveTenant(app)}
                                                                className="text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg text-xs transition-colors shadow-lg shadow-emerald-500/20"
                                                            >
                                                                Approve
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setRejectingApp(app)}
                                                            className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-xs transition-colors border border-red-500/30"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                <Link
                                                    href={`/admin/applications/${app.id}`}
                                                    className="bg-white/10 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-white/20 transition-colors border border-white/10"
                                                >
                                                    View
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Dispatch Modal */}
            {dispatchApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-[#0D1117] border border-white/10 p-6 shadow-xl relative">
                        {dispatching && (
                            <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center backdrop-blur-[2px] rounded-2xl">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
                            </div>
                        )}
                        <h3 className="text-xl font-bold text-white mb-2 uppercase italic tracking-tight">AI-Assisted Dispatch</h3>
                        <p className="text-sm text-slate-400 mb-6">
                            Review matches for <strong>{dispatchApp.applicantName}</strong> (Zip: {dispatchApp.zipCode})
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Property Matches</h4>
                                    <select
                                        value={matchSort}
                                        onChange={(e) => setMatchSort(e.target.value as 'score' | 'distance' | 'availability')}
                                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-400 outline-none focus:border-cyan-500"
                                    >
                                        <option value="score">By Score</option>
                                        <option value="distance">By Distance</option>
                                        <option value="availability">By Availability</option>
                                    </select>
                                </div>
                                {loadingMatches ? (
                                    <div className="py-10 text-center">
                                        <p className="text-xs text-slate-500 italic">Calculating match scores...</p>
                                    </div>
                                ) : sortedMatches.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic py-4">No high-confidence matches found.</p>
                                ) : (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                        {sortedMatches.map((match) => (
                                            <button
                                                key={match.tenantId}
                                                onClick={() => setSelectedTenantId(match.tenantId)}
                                                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedTenantId === match.tenantId
                                                    ? 'bg-fuchsia-500/20 border-cyan-500/50 ring-1 ring-cyan-500/50'
                                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-semibold text-sm text-white">{match.tenantName}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${match.score > 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                        {match.score}% Match
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                                                    <span>📍 {match.distanceMiles} miles</span>
                                                    <span className={match.isSorEligible ? 'text-emerald-400 font-medium' : ''}>💰 {match.financialMatch}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4 border-l border-white/10 pl-6">
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Routing Details</h4>
                                {dispatchApp.requestedTenantId && (
                                    <div className="p-3 bg-fuchsia-500/5 border border-cyan-500/20 rounded-xl">
                                        <span className="text-[10px] text-cyan-400 block mb-1 font-bold uppercase">Applicant Preferred:</span>
                                        <span className="text-white text-sm font-medium">
                                            {tenants.find(t => t.id === dispatchApp.requestedTenantId)?.name || dispatchApp.requestedTenantId}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1.5 ml-1">Assigned Organization</label>
                                    <select
                                        value={selectedTenantId}
                                        onChange={(e) => setSelectedTenantId(e.target.value)}
                                        className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                        disabled={dispatching}
                                    >
                                        <option value="" disabled>Select manually...</option>
                                        {tenants.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="pt-4 space-y-3">
                                    <button
                                        onClick={handleDispatch}
                                        disabled={!selectedTenantId || dispatching}
                                        className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                                    >
                                        Dispatch Application
                                    </button>
                                    <button
                                        onClick={() => setDispatchApp(null)}
                                        disabled={dispatching}
                                        className="w-full bg-white/5 hover:bg-white/10 text-slate-300 font-medium py-3 rounded-xl border border-white/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectingApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-[#0D1117] border border-white/10 p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-2 uppercase italic tracking-tighter">⚠️ Reject Application</h3>
                        <p className="text-sm text-slate-400 mb-6">
                            Provide a reason for rejecting <strong>{rejectingApp.applicantName}</strong>.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Rejection Reason</label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="e.g. Incomplete documentation..."
                                    className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-red-500 outline-none h-24 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Rectification Steps</label>
                                <textarea
                                    value={rectificationSteps}
                                    onChange={(e) => setRectificationSteps(e.target.value)}
                                    placeholder="What should the applicant do to be reconsidered?"
                                    className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setRejectingApp(null)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectSubmit}
                                    disabled={!rejectionReason || isSubmittingRejection}
                                    className="flex-[2] bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-600/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                                >
                                    {isSubmittingRejection ? 'Processing...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
