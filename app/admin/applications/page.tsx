'use client';

import { useState, useEffect } from 'react';
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
    zipCode: string;
    submittedAt: string | { _seconds: number };
    data: Record<string, unknown>;
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
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_BADGE[type] ?? 'bg-slate-100 text-slate-700'}`}>
            {type}
        </span>
    );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[status] ?? 'bg-slate-100 text-slate-700'}`}>
            {status}
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
    // Firestore Timestamp-like object
    return new Date(value._seconds * 1000).toLocaleDateString();
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function TableSkeleton() {
    return (
        <div className="animate-pulse">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 px-6 py-4 border-b border-slate-100 last:border-0">
                    <div className="h-5 w-16 bg-slate-200 rounded-full" />
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <div className="h-4 w-40 bg-slate-200 rounded flex-1" />
                    <div className="h-4 w-16 bg-slate-200 rounded" />
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                    <div className="h-5 w-20 bg-slate-200 rounded-full" />
                    <div className="h-8 w-16 bg-slate-200 rounded-lg" />
                </div>
            ))}
        </div>
    );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const APPLICATION_TYPES: { label: string; value: ApplicationType | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Bed', value: 'bed' },
    { label: 'Staff', value: 'staff' },
    { label: 'Course', value: 'course' },
    { label: 'Event', value: 'event' },
    { label: 'Tenant', value: 'tenant' },
];

const APPLICATION_STATUSES: { label: string; value: ApplicationStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Assigned', value: 'assigned' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Rejected', value: 'rejected' },
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function ApplicationsInboxPage() {
    const { user } = useAuth();

    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Client-side filters
    const [typeFilter, setTypeFilter] = useState<ApplicationType | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');

    useEffect(() => {
        async function fetchApplications() {
            if (!user) return;
            try {
                const token = await authService.getIdToken();
                const res = await fetch('/api/admin/applications?limit=50', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();
                    setApplications(data.applications || []);
                } else {
                    setError('Failed to fetch applications.');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchApplications();
    }, [user]);

    // Apply client-side filters
    const filtered = applications.filter((app) => {
        const matchesType = typeFilter === 'all' || app.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchesType && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Applications Inbox</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Review all incoming applications and assign them to tenants.
                    </p>
                </div>
                {!loading && !error && (
                    <span className="text-sm text-slate-500 mt-1 pt-1">
                        {filtered.length} application{filtered.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 items-center">
                {/* Type Filter */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                    {APPLICATION_TYPES.map(({ label, value }) => (
                        <button
                            key={value}
                            onClick={() => setTypeFilter(value as ApplicationType | 'all')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                typeFilter === value
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                    {APPLICATION_STATUSES.map(({ label, value }) => (
                        <button
                            key={value}
                            onClick={() => setStatusFilter(value as ApplicationStatus | 'all')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                statusFilter === value
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <TableSkeleton />
                ) : error ? (
                    <div className="p-10 text-center text-red-500">{error}</div>
                ) : filtered.length === 0 ? (
                    <div className="p-10 text-center">
                        <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-slate-900">No applications</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {typeFilter !== 'all' || statusFilter !== 'all'
                                ? 'No applications match your current filters.'
                                : 'There are currently no applications to review.'}
                        </p>
                        {(typeFilter !== 'all' || statusFilter !== 'all') && (
                            <button
                                onClick={() => { setTypeFilter('all'); setStatusFilter('all'); }}
                                className="mt-3 text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Applicant Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Zip</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Submitted</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filtered.map((app) => (
                                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <TypeBadge type={app.type} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">
                                                {app.applicantName || '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-500">{app.applicantEmail || '—'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {app.zipCode || '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {formatDate(app.submittedAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={app.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={`/admin/applications/${app.id}`}
                                                className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-800 transition-colors"
                                            >
                                                Review
                                                <span className="sr-only">, {app.applicantName}</span>
                                            </Link>
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
