'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

// Extended Tenant interface for the application fields
interface ApplicationData {
    id: string;
    name: string;
    slug: string;
    status: string;
    ownerId: string;
    createdAt: any;
    businessName?: string;
    contactEmail?: string;
    contactPhone?: string;
    governmentIdUrl?: string;
    businessDocUrl?: string;
    applicationPreferences?: string[];
}

export default function OnboardingDetailPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [application, setApplication] = useState<ApplicationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        async function fetchApplication() {
            if (!user) return;
            try {
                const token = await authService.getIdToken();
                const res = await fetch(`/api/tenants/${tenantId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setApplication(data.tenant);
                } else {
                    setError('Failed to fetch application details.');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchApplication();
    }, [user, tenantId]);

    const handleStatusUpdate = async (newStatus: 'approved' | 'rejected') => {
        if (!confirm(`Are you sure you want to ${newStatus} this application?`)) return;

        setProcessing(true);
        try {
            const token = await authService.getIdToken();
            const res = await fetch(`/api/tenants/${tenantId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                router.push('/admin/onboarding');
            } else {
                const data = await res.json();
                alert(`Failed to update status: ${data.error}`);
            }
        } catch (err: any) {
            alert(`Error updating status: ${err.message}`);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="text-center py-10 text-slate-500">Loading application details...</div>;
    }

    if (error || !application) {
        return (
            <div className="text-center py-10 text-red-500">
                <p>{error || 'Application not found.'}</p>
                <Link href="/admin/onboarding" className="mt-4 inline-block text-emerald-600 hover:underline">
                    &larr; Back to Queue
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/onboarding" className="text-slate-400 hover:text-slate-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-900">Application Review</h2>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${application.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    application.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {application.status.toUpperCase()}
                </span>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-slate-200">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-slate-900">Applicant Information</h3>
                        <p className="mt-1 max-w-2xl text-sm text-slate-500">Personal details and application ID.</p>
                    </div>
                </div>
                <div className="border-t border-slate-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-slate-200">
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Business / House Name</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">{application.businessName || application.name}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Contact Email</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">{application.contactEmail || 'Not provided'}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Contact Phone</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">{application.contactPhone || 'Not provided'}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Owner UID</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2 font-mono text-xs">{application.ownerId}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Applied For Features</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2 flex flex-wrap gap-2">
                                {application.applicationPreferences?.map(pref => (
                                    <span key={pref} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md border border-slate-200">
                                        {pref.replace('_', ' ')}
                                    </span>
                                )) || 'None specified'}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-slate-200">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">Verification Documents</h3>
                    <p className="mt-1 max-w-2xl text-sm text-slate-500">Official documents submitted for review.</p>
                </div>
                <div className="border-t border-slate-200 px-4 py-5 sm:p-6 space-y-6">
                    <div>
                        <h4 className="text-sm font-medium text-slate-900 mb-2">Government ID</h4>
                        {application.governmentIdUrl ? (
                            <a href={application.governmentIdUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
                                <svg className="-ml-1 mr-2 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                View Government ID
                            </a>
                        ) : (
                            <p className="text-sm text-slate-500 italic">No document uploaded.</p>
                        )}
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-medium text-slate-900 mb-2">Business Operating Document</h4>
                        {application.businessDocUrl ? (
                            <a href={application.businessDocUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
                                <svg className="-ml-1 mr-2 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                View Business Document
                            </a>
                        ) : (
                            <p className="text-sm text-slate-500 italic">No document uploaded.</p>
                        )}
                    </div>
                </div>
            </div>

            {application.status === 'pending' && (
                <div className="flex justify-end space-x-4 pt-4">
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={processing}
                        onClick={() => handleStatusUpdate('rejected')}
                    >
                        {processing ? 'Processing...' : 'Reject Application'}
                    </Button>
                    <Button
                        type="button"
                        variant="default"
                        disabled={processing}
                        onClick={() => handleStatusUpdate('approved')}
                    >
                        {processing ? 'Processing...' : 'Approve Application'}
                    </Button>
                </div>
            )}
        </div>
    );
}
