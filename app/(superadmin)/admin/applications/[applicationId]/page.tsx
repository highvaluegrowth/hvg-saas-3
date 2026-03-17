'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import Link from 'next/link';
import { 
    CheckCircle2, 
    AlertCircle, 
    X, 
    ChevronLeft, 
    UserPlus, 
    Mail, 
    MapPin, 
    Calendar
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApplicationType = 'bed' | 'staff' | 'course' | 'event' | 'tenant';
type ApplicationStatus = 'pending' | 'assigned' | 'accepted' | 'rejected' | 'archived';

interface Application {
    id: string;
    type: ApplicationType;
    status: ApplicationStatus;
    applicantName: string;
    applicantEmail: string;
    zipCode?: string;
    submittedAt: string | { _seconds: number };
    data: Record<string, unknown>;
}

interface TenantMatchScore {
    tenantId: string;
    tenantName: string;
    city: string;
    state: string;
    zipCode: string;
    score: number;
    specializationOverlap: number;
    hasCapacity: boolean;
    availableBeds?: number;
    specializations: string[];
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
    accepted: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20',
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

// ─── Match Score Bar ──────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
    const color =
        score >= 70 ? 'bg-emerald-500' :
            score >= 40 ? 'bg-amber-400' :
                'bg-rose-400';

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                />
            </div>
            <span className={`text-[10px] font-black tabular-nums ${score >= 70 ? 'text-emerald-400' :
                    score >= 40 ? 'text-amber-400' :
                        'text-rose-400'
                }`}>
                {score}%
            </span>
        </div>
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

// ─── Field Label Helper ───────────────────────────────────────────────────────

function labelify(key: string): string {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^./, (c) => c.toUpperCase())
        .trim();
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-pulse p-8">
            <div className="flex items-center gap-4">
                <div className="h-6 w-6 bg-white/5 rounded" />
                <div className="h-7 w-48 bg-white/5 rounded" />
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8 space-y-6">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="grid grid-cols-3 gap-4">
                        <div className="h-4 bg-white/5 rounded col-span-1" />
                        <div className="h-4 bg-white/10 rounded col-span-2" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onDismiss: () => void;
}

function Toast({ message, type, onDismiss }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 4000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border text-sm font-bold transition-all backdrop-blur-xl ${type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
            {type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            {message}
            <button onClick={onDismiss} className="ml-2 opacity-40 hover:opacity-100 transition-opacity">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// ─── Confirmation Dialog ──────────────────────────────────────────────────────

interface ConfirmDialogProps {
    applicantName: string;
    tenantName: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}

function ConfirmDialog({ applicantName, tenantName, onConfirm, onCancel, loading }: ConfirmDialogProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-[#1A0B2E] rounded-3xl shadow-2xl border border-white/10 p-8 w-full max-w-md space-y-6">
                <div className="flex items-start gap-4">
                    <div className="shrink-0 w-12 h-12 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center border border-fuchsia-500/20">
                        <UserPlus className="w-6 h-6 text-fuchsia-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Confirm Assignment</h3>
                        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                            Assign <span className="text-white font-bold">{applicantName}</span> to{' '}
                            <span className="text-white font-bold">{tenantName}</span>?
                        </p>
                        <p className="text-xs text-slate-500 mt-4 italic bg-white/5 p-3 rounded-xl border border-white/5">
                            The organization will be notified and the application will be moved to their inbound queue.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 py-3 text-sm font-bold text-slate-400 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-[2] py-3 text-sm font-black uppercase tracking-widest text-white bg-fuchsia-600 rounded-xl hover:bg-fuchsia-500 disabled:opacity-50 transition-all shadow-lg shadow-fuchsia-600/20 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processing...' : 'Confirm Dispatch'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function ApplicationDetailPage({
    params,
}: {
    params: Promise<{ applicationId: string }>;
}) {
    const { applicationId } = use(params);
    const { user } = useAuth();

    const [application, setApplication] = useState<Application | null>(null);
    const [appLoading, setAppLoading] = useState(true);
    const [appError, setAppError] = useState<string | null>(null);

    const [matches, setMatches] = useState<TenantMatchScore[]>([]);
    const [matchesLoading, setMatchesLoading] = useState(true);
    const [matchesError, setMatchesError] = useState<string | null>(null);

    // Assignment state
    const [pendingAssign, setPendingAssign] = useState<TenantMatchScore | null>(null);
    const [assigning, setAssigning] = useState(false);
    const [assignedTenantId, setAssignedTenantId] = useState<string | null>(null);

    // Toast
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Fetch application details
    useEffect(() => {
        async function fetchApplication() {
            if (!user) return;
            try {
                const token = await authService.getIdToken();
                const res = await fetch(`/api/admin/applications/${applicationId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();
                    setApplication(data.application);
                } else {
                    setAppError('Failed to load application details.');
                }
            } catch (err: unknown) {
                setAppError(err instanceof Error ? err.message : String(err));
            } finally {
                setAppLoading(false);
            }
        }

        fetchApplication();
    }, [user, applicationId]);

    // Fetch matches
    useEffect(() => {
        async function fetchMatches() {
            if (!user) return;
            try {
                const token = await authService.getIdToken();
                const res = await fetch(`/api/admin/applications/${applicationId}/matches`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();
                    setMatches(data.matches || []);
                } else {
                    setMatchesError('Failed to load tenant matches.');
                }
            } catch (err: unknown) {
                setMatchesError(err instanceof Error ? err.message : String(err));
            } finally {
                setMatchesLoading(false);
            }
        }

        fetchMatches();
    }, [user, applicationId]);

    // Handle assignment confirmation
    const handleAssign = async () => {
        if (!pendingAssign || !application) return;
        setAssigning(true);
        try {
            const token = await authService.getIdToken();
            const res = await fetch(`/api/admin/applications/${applicationId}/assign`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tenantId: pendingAssign.tenantId }),
            });

            if (res.ok) {
                setAssignedTenantId(pendingAssign.tenantId);
                setApplication((prev) => prev ? { ...prev, status: 'assigned' } : prev);
                setToast({ message: `Assigned to ${pendingAssign.tenantName} successfully.`, type: 'success' });
            } else {
                const data = await res.json().catch(() => ({}));
                setToast({ message: data.error || 'Assignment failed. Please try again.', type: 'error' });
            }
        } catch (err: unknown) {
            setToast({ message: err instanceof Error ? err.message : 'An error occurred.', type: 'error' });
        } finally {
            setAssigning(false);
            setPendingAssign(null);
        }
    };

    if (appLoading) {
        return <DetailSkeleton />;
    }

    if (appError || !application) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500">{appError || 'Application not found.'}</p>
                <Link
                    href="/admin/applications"
                    className="mt-4 inline-block text-emerald-600 hover:underline text-sm"
                >
                    &larr; Back to Applications
                </Link>
            </div>
        );
    }

    // Build the data fields list — skip undefined/null/empty string values
    // If fundingSources array is present, omit the legacy fundingSource string
    const hasFundingSources = Array.isArray(application.data?.fundingSources) && (application.data.fundingSources as string[]).length > 0;
    const dataFields = Object.entries(application.data || {}).filter(
        ([key, v]) => {
            if (v === undefined || v === null || v === '') return false;
            if (Array.isArray(v) && (v as unknown[]).length === 0) return false;
            if (key === 'fundingSource' && hasFundingSources) return false; // hide legacy when array present
            return true;
        }
    );

    // Preferred display order for bed application fields
    const BED_FIELD_ORDER = [
        'phone', 'dateOfBirth', 'raceEthnicity',
        'sobrietyDate', 'primarySubstance', 'daysUsedPast30', 'matStatus', 'matMedication', 'injectionDrugUse', 'substanceHistory', 'goals',
        'fundingSources', 'fundingSource', 'insuranceDetails',
        'currentHousing', 'criminalJusticeSupervision', 'supervisionType', 'employmentStatus', 'coOccurringDiagnosis',
        'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelationship',
        'gender', 'genderPreference', 'housePref', 'accessibilityNeeds',
        'references', 'positionType', 'certifications', 'yearsExperience', 'experienceSummary', 'availability', 'resumeUrl',
    ];

    const sortedDataFields = [...dataFields].sort(([a], [b]) => {
        const ai = BED_FIELD_ORDER.indexOf(a);
        const bi = BED_FIELD_ORDER.indexOf(b);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });

    return (
        <div className="min-h-screen bg-transparent text-white p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* ── Header ── */}
                <div className="flex items-start justify-between flex-wrap gap-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/applications"
                            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            aria-label="Back to Applications"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <TypeBadge type={application.type} />
                                <StatusBadge status={application.status} />
                            </div>
                            <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                                {application.applicantName || 'Unknown Applicant'}
                            </h2>
                            {application.applicantEmail && (
                                <div className="flex items-center gap-2 text-sm text-slate-400 mt-1 font-medium">
                                    <Mail className="w-4 h-4 text-slate-500" />
                                    {application.applicantEmail}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-right">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Submission Date</div>
                        <div className="text-sm font-bold text-slate-300 flex items-center justify-end gap-2">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            {formatDate(application.submittedAt)}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── Application Details ── */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white/5 rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-sm">
                            <div className="px-8 py-6 border-b border-white/10 bg-white/5">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Application Dossier</h3>
                            </div>
                            {sortedDataFields.length === 0 ? (
                                <div className="px-8 py-12 text-center text-slate-500 text-sm italic">
                                    No additional fields submitted.
                                </div>
                            ) : (
                                <dl className="divide-y divide-white/5">
                                    {sortedDataFields.map(([key, value]) => (
                                        <div
                                            key={key}
                                            className="py-5 sm:grid sm:grid-cols-3 sm:gap-6 px-8 hover:bg-white/[0.02] transition-colors"
                                        >
                                            <dt className="text-xs font-black text-slate-500 uppercase tracking-tighter self-center">{labelify(key)}</dt>
                                            <dd className="mt-1 text-sm text-slate-200 sm:mt-0 sm:col-span-2 leading-relaxed">
                                                {Array.isArray(value) ? (
                                                    typeof (value as unknown[])[0] === 'object' && (value as unknown[])[0] !== null ? (
                                                        <div className="space-y-3 pt-1">
                                                            {(value as Record<string, unknown>[]).map((item, idx) => (
                                                                <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10 text-xs space-y-2">
                                                                    {Object.entries(item).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => (
                                                                        <div key={k} className="flex gap-3">
                                                                            <span className="text-slate-500 font-bold uppercase tracking-tighter min-w-[90px] shrink-0">{labelify(k)}:</span>
                                                                            <span className="text-slate-300">{String(v)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2 pt-1">
                                                            {(value as unknown[]).map((item, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-2.5 py-1 bg-white/5 text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/10"
                                                                >
                                                                    {String(item).replace(/_/g, ' ')}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )
                                                ) : typeof value === 'boolean' ? (
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${value ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                                                        {value ? 'Yes' : 'No'}
                                                    </span>
                                                ) : typeof value === 'object' && value !== null ? (
                                                    <dl className="space-y-2 pt-1">
                                                        {Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => (
                                                            <div key={k} className="flex gap-3 text-xs">
                                                                <dt className="text-slate-500 font-bold uppercase tracking-tighter min-w-[100px] shrink-0">{labelify(k)}:</dt>
                                                                <dd className="text-slate-300">{String(v)}</dd>
                                                            </div>
                                                        ))}
                                                    </dl>
                                                ) : typeof value === 'string' && value.startsWith('http') ? (
                                                    <a
                                                        href={value}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-4 decoration-cyan-400/30 transition-colors break-all"
                                                    >
                                                        {value}
                                                    </a>
                                                ) : (
                                                    <span className="break-words font-medium">{String(value)}</span>
                                                )}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            )}
                        </div>
                    </div>

                    {/* ── Sidebar: Matches ── */}
                    <div className="space-y-8">
                        <div className="bg-white/5 rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-sm sticky top-24">
                            <div className="px-6 py-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Recommended Matches</h3>
                                </div>
                                {!matchesLoading && !matchesError && (
                                    <span className="text-[10px] font-black text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded-full border border-fuchsia-500/20">
                                        {matches.length}
                                    </span>
                                )}
                            </div>

                            <div className="p-6">
                                {matchesLoading ? (
                                    <div className="space-y-4">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="animate-pulse h-28 bg-white/5 rounded-2xl border border-white/5" />
                                        ))}
                                    </div>
                                ) : matchesError ? (
                                    <div className="p-6 text-center">
                                        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2 opacity-50" />
                                        <p className="text-xs text-rose-400 font-medium">{matchesError}</p>
                                    </div>
                                ) : matches.length === 0 ? (
                                    <div className="text-center py-12 px-4">
                                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                                            <UserPlus className="w-6 h-6 text-slate-600" />
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">No matching tenants found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {matches.map((match) => {
                                            const isAssigned = assignedTenantId === match.tenantId;
                                            const isAnyAssigned = assignedTenantId !== null;

                                            return (
                                                <div
                                                    key={match.tenantId}
                                                    className={`group rounded-2xl border p-5 transition-all ${isAssigned
                                                            ? 'border-emerald-500/50 bg-emerald-500/10'
                                                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                                                        }`}
                                                >
                                                    <div className="space-y-4">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                                                                    {match.tenantName}
                                                                </h4>
                                                                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {match.city}, {match.state}
                                                                </div>
                                                            </div>
                                                            {isAssigned && (
                                                                <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <ScoreBar score={match.score} />

                                                        <div className="flex items-center justify-between gap-2 pt-2">
                                                            <div className="flex flex-col">
                                                                {match.hasCapacity ? (
                                                                    <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">
                                                                        {match.availableBeds} BED{match.availableBeds !== 1 ? 'S' : ''} OPEN
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] text-rose-500 font-black uppercase tracking-widest">AT CAPACITY</span>
                                                                )}
                                                            </div>
                                                            {!isAssigned && (
                                                                <button
                                                                    onClick={() => setPendingAssign(match)}
                                                                    disabled={isAnyAssigned || application.status === 'assigned'}
                                                                    className="bg-white text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all disabled:opacity-30 disabled:hover:bg-white"
                                                                >
                                                                    Assign
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Confirmation Dialog ── */}
            {pendingAssign && application && (
                <ConfirmDialog
                    applicantName={application.applicantName}
                    tenantName={pendingAssign.tenantName}
                    onConfirm={handleAssign}
                    onCancel={() => setPendingAssign(null)}
                    loading={assigning}
                />
            )}

            {/* ── Toast ── */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onDismiss={() => setToast(null)}
                />
            )}
        </div>
    );
}
