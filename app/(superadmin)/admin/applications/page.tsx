'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApplicationType = 'bed' | 'staff' | 'course' | 'event' | 'tenant';
type ApplicationStatus = 'pending' | 'pending_triage' | 'assigned_to_tenant' | 'assigned' | 'accepted' | 'rejected' | 'archived' | 'waitlisted';

interface Application {
    id: string;
    type: ApplicationType;
    status: ApplicationStatus;
    applicantName: string;
    applicantEmail: string;
    zipCode: string;
    requestedTenantId?: string | null;
    requestedHouseId?: string | null;
    submittedAt: string | { _seconds: number };
    data: Record<string, unknown>;
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
}

// ─── Badge Helpers ────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, string> = {
    bed: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    staff: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
    course: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
    event: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30',
    tenant: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
};

const STATUS_BADGE: Record<string, string> = {
    pending_triage: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    pending: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30',
    assigned_to_tenant: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    assigned: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    accepted: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-300 border border-red-500/30',
    archived: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
    waitlisted: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
};

function TypeBadge({ type }: { type: string }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_BADGE[type] ?? 'bg-white/10 text-slate-300 border border-white/20'}`}>
            {type}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[status] ?? 'bg-white/10 text-slate-300 border border-white/20'}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}

// ─── Date Helper ──────────────────────────────────────────────────────────────

function formatDate(value: string | { _seconds: number } | undefined): string {
    if (!value) return '—';
    if (typeof value === 'string') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? value : d.toLocaleDateString();
    }
    return new Date(value._seconds * 1000).toLocaleDateString();
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function TableSkeleton() {
    return (
        <div className="animate-pulse">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 px-6 py-4 border-b border-white/10 last:border-0">
                    <div className="h-5 w-16 bg-white/5 rounded-full" />
                    <div className="h-4 w-32 bg-white/5 rounded" />
                    <div className="h-4 w-40 bg-white/5 rounded flex-1" />
                    <div className="h-4 w-16 bg-white/5 rounded" />
                    <div className="h-4 w-20 bg-white/5 rounded" />
                    <div className="h-5 w-20 bg-white/5 rounded-full" />
                    <div className="h-8 w-16 bg-white/5 rounded-lg" />
                </div>
            ))}
        </div>
    );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const APPLICATION_TYPES = [
    { label: 'All', value: 'all' },
    { label: 'Bed', value: 'bed' },
    { label: 'Staff', value: 'staff' },
    { label: 'Course', value: 'course' },
    { label: 'Event', value: 'event' },
    { label: 'Tenant', value: 'tenant' },
];

const APPLICATION_STATUSES = [
    { label: 'All', value: 'all' },
    { label: 'Pending Triage', value: 'pending_triage' },
    { label: 'Assigned', value: 'assigned_to_tenant' },
    { label: 'Pending', value: 'pending' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Waitlisted', value: 'waitlisted' },
    { label: 'Rejected', value: 'rejected' },
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function ApplicationsInboxPage() {
    const { user } = useAuth();

    const [applications, setApplications] = useState<Application[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Client-side filters
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('pending_triage');

    // Dispatching Modal State
    const [dispatchApp, setDispatchApp] = useState<Application | null>(null);
    const [matches, setMatches] = useState<TenantMatchScore[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [selectedTenantId, setSelectedTenantId] = useState<string>('');
    const [dispatching, setDispatching] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await authService.getIdToken();

            // Fetch apps and tenants parallel
            const [appRes, tenantRes] = await Promise.all([
                fetch('/api/admin/applications?limit=100', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch('/api/admin/tenants?status=active', { // assuming this gets active
                    headers: { Authorization: `Bearer ${token}` },
                })
            ]);

            if (appRes.ok) {
                const data = await appRes.json();
                setApplications(data.applications || []);
            } else {
                throw new Error('Failed to fetch applications');
            }

            if (tenantRes.ok) {
                const data = await tenantRes.json();
                setTenants(data.tenants || []);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
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
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tenantId: selectedTenantId }),
            });

            if (!res.ok) throw new Error('Failed to dispatch application');

            // Remove from local state or update status
            setApplications(prev => prev.map(a =>
                a.id === dispatchApp.id
                    ? { ...a, status: 'assigned_to_tenant', assignedTenantId: selectedTenantId }
                    : a
            ));

            setDispatchApp(null);
            setSelectedTenantId('');
        } catch (err) {
            alert(err instanceof Error ? err.message : String(err));
        } finally {
            setDispatching(false);
        }
    };

    // Apply client-side filters
    const filtered = applications.filter((app) => {
        const matchesType = typeFilter === 'all' || app.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchesType && matchesStatus;
    });

    return (
        <div className="space-y-6 min-h-screen bg-[#0F071A] p-6 text-white rounded-xl">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Central Triage Dashboard</h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Review globally submitted applications and dispatch to appropriate organizations.
                    </p>
                </div>
                {!loading && !error && (
                    <span className="text-sm text-slate-400 mt-1 pt-1 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                        {filtered.length} application{filtered.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 items-center">
                {/* Type Filter */}
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                    {APPLICATION_TYPES.map(({ label, value }) => (
                        <button
                            key={value}
                            onClick={() => setTypeFilter(value)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${typeFilter === value
                                ? 'bg-[#D946EF] text-white shadow-lg shadow-fuchsia-500/20'
                                : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                    {APPLICATION_STATUSES.map(({ label, value }) => (
                        <button
                            key={value}
                            onClick={() => setStatusFilter(value)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${statusFilter === value
                                ? 'bg-[#D946EF] text-white shadow-lg shadow-fuchsia-500/20'
                                : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white/5 rounded-xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-sm">
                {loading ? (
                    <TableSkeleton />
                ) : error ? (
                    <div className="p-10 text-center text-red-400">{error}</div>
                ) : filtered.length === 0 ? (
                    <div className="p-10 text-center">
                        <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-white">No applications</h3>
                        <p className="mt-1 text-sm text-slate-400">
                            {typeFilter !== 'all' || statusFilter !== 'all'
                                ? 'No applications match your current filters.'
                                : 'There are currently no applications to review.'}
                        </p>
                        {(typeFilter !== 'all' || statusFilter !== 'all') && (
                            <button
                                onClick={() => { setTypeFilter('all'); setStatusFilter('all'); }}
                                className="mt-3 text-sm text-[#D946EF] hover:text-fuchsia-400 font-medium"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/10">
                            <thead className="bg-white/5">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Applicant Name</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Requested Org</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Zip Code</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Submitted</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {filtered.map((app) => (
                                    <tr key={app.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <TypeBadge type={app.type} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-white">
                                                {app.applicantName || '—'}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {app.applicantEmail || ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300">
                                                {app.requestedTenantId ? tenants.find(t => t.id === app.requestedTenantId)?.name || app.requestedTenantId : 'None'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {app.zipCode || '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {formatDate(app.submittedAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={app.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-3">
                                                {app.status === 'pending_triage' && (
                                                    <button
                                                        onClick={() => handleDispatchClick(app)}
                                                        className="text-[#D946EF] hover:text-fuchsia-300 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 px-3 py-1.5 rounded-lg transition-colors border border-[#D946EF]/30 hover:border-[#D946EF]/50"
                                                    >
                                                        Dispatch
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/admin/applications/${app.id}`}
                                                    className="bg-white/10 text-white rounded-lg px-4 py-1.5 text-xs font-medium hover:bg-white/20 transition-colors flex items-center border border-white/10"
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

            {/* Simple Native Dispatch Modal */}
            {dispatchApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#1A0B2E] border border-white/10 p-6 text-left align-middle shadow-xl transition-all relative">
                        {dispatching && (
                            <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center backdrop-blur-[2px] rounded-2xl">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D946EF]"></div>
                            </div>
                        )}
                        <h3 className="text-xl font-bold leading-6 text-white mb-2">
                            AI-Assisted Dispatch
                        </h3>
                        <p className="text-sm text-slate-400 mb-6">
                            Review matches for <strong>{dispatchApp?.applicantName}</strong> (Zip: {dispatchApp?.zipCode})
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Side: Top Matches */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-semibold text-[#D946EF] uppercase tracking-wider">Top Matches</h4>
                                {loadingMatches ? (
                                    <div className="py-10 text-center space-y-3">
                                        <div className="animate-pulse flex flex-col items-center">
                                            <div className="h-4 w-3/4 bg-white/5 rounded mb-2"></div>
                                            <div className="h-4 w-1/2 bg-white/5 rounded"></div>
                                        </div>
                                        <p className="text-xs text-slate-500 italic">Calculating match scores...</p>
                                    </div>
                                ) : matches.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic py-4">No high-confidence matches found.</p>
                                ) : (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {matches.map((match) => (
                                            <button
                                                key={match.tenantId}
                                                onClick={() => setSelectedTenantId(match.tenantId)}
                                                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedTenantId === match.tenantId
                                                    ? 'bg-fuchsia-500/20 border-fuchsia-500/50 ring-1 ring-fuchsia-500/50'
                                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-semibold text-sm text-white">{match.tenantName}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${match.score > 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                                                        }`}>
                                                        {match.score}% Match
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 items-center text-[11px] text-slate-400">
                                                    <span>📍 {match.distanceMiles} miles</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                                    <span className={match.isSorEligible ? 'text-emerald-400 font-medium' : ''}>
                                                        💰 {match.financialMatch}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Side: Manual Selection & Action */}
                            <div className="space-y-4 border-l border-white/10 pl-6">
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Routing Details</h4>

                                {dispatchApp?.requestedTenantId && (
                                    <div className="p-3 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-xl">
                                        <span className="text-[10px] text-fuchsia-400 block mb-1 font-bold uppercase">Applicant Preferred:</span>
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
                                        className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-[#D946EF] focus:border-transparent outline-none transition-all"
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
                                        type="button"
                                        className="w-full inline-flex justify-center rounded-xl border border-transparent bg-[#D946EF] px-4 py-3 text-sm font-bold text-white hover:bg-fuchsia-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/20 transition-all active:scale-[0.98]"
                                        onClick={handleDispatch}
                                        disabled={!selectedTenantId || dispatching}
                                    >
                                        Dispatch Application
                                    </button>
                                    <button
                                        type="button"
                                        className="w-full inline-flex justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 focus:outline-none transition-all"
                                        onClick={() => setDispatchApp(null)}
                                        disabled={dispatching}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
