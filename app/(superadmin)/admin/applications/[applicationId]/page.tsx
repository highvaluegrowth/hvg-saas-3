'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import Link from 'next/link';

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

const TYPE_BADGE: Record<ApplicationType, string> = {
    bed:    'bg-indigo-100 text-indigo-800',
    staff:  'bg-violet-100 text-violet-800',
    course: 'bg-teal-100 text-teal-800',
    event:  'bg-orange-100 text-orange-800',
    tenant: 'bg-emerald-100 text-emerald-800',
};

const STATUS_BADGE: Record<ApplicationStatus, string> = {
    pending:  'bg-amber-100 text-amber-800',
    assigned: 'bg-blue-100 text-blue-800',
    accepted: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
    archived: 'bg-slate-100 text-slate-600',
};

function TypeBadge({ type }: { type: ApplicationType }) {
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${TYPE_BADGE[type] ?? 'bg-slate-100 text-slate-700'}`}>
            {type}
        </span>
    );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${STATUS_BADGE[status] ?? 'bg-slate-100 text-slate-700'}`}>
            {status}
        </span>
    );
}

// ─── Match Score Bar ──────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
    const color =
        score >= 70 ? 'bg-emerald-500' :
        score >= 40 ? 'bg-yellow-400' :
        'bg-red-400';

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-2 rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                />
            </div>
            <span className={`text-sm font-semibold tabular-nums ${
                score >= 70 ? 'text-emerald-600' :
                score >= 40 ? 'text-yellow-600' :
                'text-red-500'
            }`}>
                {score}
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
        <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
            <div className="flex items-center gap-4">
                <div className="h-6 w-6 bg-slate-200 rounded" />
                <div className="h-7 w-48 bg-slate-200 rounded" />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="grid grid-cols-3 gap-4">
                        <div className="h-4 bg-slate-200 rounded col-span-1" />
                        <div className="h-4 bg-slate-200 rounded col-span-2" />
                    </div>
                ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-slate-100 rounded-lg" />
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
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
        }`}>
            {type === 'success' ? (
                <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )}
            {message}
            <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
        <div className="fixed inset-0 z-40 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
            />
            {/* Panel */}
            <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-md mx-4 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">Confirm Assignment</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Assign <span className="font-medium text-slate-700">{applicantName}</span> to{' '}
                            <span className="font-medium text-slate-700">{tenantName}</span>?
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                            The tenant will be notified and the application status will update to "assigned".
                        </p>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {loading && (
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        )}
                        {loading ? 'Assigning…' : 'Confirm Assignment'}
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
    const router = useRouter();
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
            } catch (err: any) {
                setAppError(err.message);
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
            } catch (err: any) {
                setMatchesError(err.message);
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
        } catch (err: any) {
            setToast({ message: err.message || 'An error occurred.', type: 'error' });
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
        <>
            <div className="space-y-6 max-w-4xl mx-auto">
                {/* ── Header ── */}
                <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/applications"
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                            aria-label="Back to Applications"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <TypeBadge type={application.type} />
                                <StatusBadge status={application.status} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mt-1">
                                {application.applicantName || 'Unknown Applicant'}
                            </h2>
                            {application.applicantEmail && (
                                <p className="text-sm text-slate-500">{application.applicantEmail}</p>
                            )}
                        </div>
                    </div>
                    <div className="text-sm text-slate-400">
                        Submitted {formatDate(application.submittedAt)}
                    </div>
                </div>

                {/* ── Application Details ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100">
                        <h3 className="text-base font-semibold text-slate-900">Application Details</h3>
                        <p className="text-sm text-slate-500 mt-0.5">Information submitted with this application.</p>
                    </div>
                    {sortedDataFields.length === 0 ? (
                        <div className="px-6 py-8 text-center text-slate-400 text-sm italic">
                            No additional fields submitted.
                        </div>
                    ) : (
                        <dl className="divide-y divide-slate-100">
                            {sortedDataFields.map(([key, value]) => (
                                <div
                                    key={key}
                                    className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 px-6"
                                >
                                    <dt className="text-sm font-medium text-slate-500">{labelify(key)}</dt>
                                    <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
                                        {Array.isArray(value) ? (
                                            typeof (value as unknown[])[0] === 'object' && (value as unknown[])[0] !== null ? (
                                                // Array of objects (e.g. references)
                                                <div className="space-y-2">
                                                    {(value as Record<string, unknown>[]).map((item, idx) => (
                                                        <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs space-y-1">
                                                            {Object.entries(item).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => (
                                                                <div key={k} className="flex gap-2">
                                                                    <span className="text-slate-400 min-w-[80px] shrink-0">{labelify(k)}:</span>
                                                                    <span className="text-slate-700">{String(v)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                // Array of primitives — pill badges
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(value as unknown[]).map((item, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-md border border-slate-200"
                                                        >
                                                            {String(item).replace(/_/g, ' ')}
                                                        </span>
                                                    ))}
                                                </div>
                                            )
                                        ) : typeof value === 'boolean' ? (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {value ? 'Yes' : 'No'}
                                            </span>
                                        ) : typeof value === 'object' && value !== null ? (
                                            // Nested object (e.g. insuranceDetails)
                                            <dl className="space-y-1.5">
                                                {Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => (
                                                    <div key={k} className="flex gap-2 text-xs">
                                                        <dt className="text-slate-400 min-w-[100px] shrink-0">{labelify(k)}:</dt>
                                                        <dd className="text-slate-700">{String(v)}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        ) : typeof value === 'string' && value.startsWith('http') ? (
                                            <a
                                                href={value}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-emerald-600 hover:underline break-all"
                                            >
                                                {value}
                                            </a>
                                        ) : (
                                            <span className="break-words">{String(value)}</span>
                                        )}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </div>

                {/* ── Top Matches ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-slate-900">Top Matches</h3>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Tenants ranked by compatibility with this application.
                            </p>
                        </div>
                        {!matchesLoading && !matchesError && (
                            <span className="text-sm text-slate-400">
                                {matches.length} tenant{matches.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    <div className="p-6">
                        {matchesLoading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="animate-pulse h-24 bg-slate-100 rounded-xl" />
                                ))}
                            </div>
                        ) : matchesError ? (
                            <p className="text-sm text-red-500 text-center py-4">{matchesError}</p>
                        ) : matches.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                No matching tenants found for this application.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {matches.map((match, index) => {
                                    const isAssigned = assignedTenantId === match.tenantId;
                                    const isAnyAssigned = assignedTenantId !== null;

                                    return (
                                        <div
                                            key={match.tenantId}
                                            className={`rounded-xl border p-4 transition-all ${
                                                isAssigned
                                                    ? 'border-emerald-300 bg-emerald-50'
                                                    : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                                {/* Left — tenant info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-slate-400 tabular-nums">
                                                            #{index + 1}
                                                        </span>
                                                        <h4 className="text-sm font-semibold text-slate-900 truncate">
                                                            {match.tenantName}
                                                        </h4>
                                                        {isAssigned && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Assigned
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {match.city}, {match.state} · ZIP {match.zipCode}
                                                    </p>

                                                    {/* Score bar */}
                                                    <div className="mt-2 max-w-xs">
                                                        <ScoreBar score={match.score} />
                                                    </div>

                                                    {/* Metadata row */}
                                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                        {match.hasCapacity && match.availableBeds !== undefined && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M3 6h18M3 18h18" />
                                                                </svg>
                                                                {match.availableBeds} bed{match.availableBeds !== 1 ? 's' : ''} available
                                                            </span>
                                                        )}
                                                        {!match.hasCapacity && (
                                                            <span className="text-xs text-red-500 font-medium">No capacity</span>
                                                        )}
                                                    </div>

                                                    {/* Specializations */}
                                                    {match.specializations.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {match.specializations.map((spec) => (
                                                                <span
                                                                    key={spec}
                                                                    className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 text-xs rounded-md"
                                                                >
                                                                    {spec.replace(/_/g, ' ')}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right — assign button */}
                                                <div className="shrink-0">
                                                    {isAssigned ? (
                                                        <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Done
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setPendingAssign(match)}
                                                            disabled={isAnyAssigned || application.status === 'assigned'}
                                                            className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
        </>
    );
}
