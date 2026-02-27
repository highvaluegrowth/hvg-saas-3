'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { FileUploader } from '@/components/ui/FileUploader';

export default function ApplicationWizardPage() {
    const { applicationId } = useParams() as { applicationId: string };
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [tenant, setTenant] = useState<any>(null);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        contactEmail: '',
        contactPhone: '',
        governmentIdUrl: '',
        businessDocUrl: '',
    });

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        async function fetchApplication() {
            try {
                const res = await fetch(`/api/tenants/${applicationId}`);
                if (!res.ok) throw new Error('Failed to load application');

                const data = await res.json();
                setTenant(data.tenant);

                // Populate initial form data from draft if it exists
                setFormData(prev => ({
                    ...prev,
                    name: data.tenant.name === 'Draft Application' ? '' : data.tenant.name,
                }));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchApplication();
    }, [user, authLoading, applicationId, router]);

    const handleSave = async () => {
        // Save draft
        try {
            await fetch(`/api/tenants/${applicationId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name || 'Draft Application',
                    // we could add more fields to tenant model depending on needs
                })
            });
        } catch (err) {
            console.error('Failed to save draft:', err);
        }
    };

    const handleSubmit = async () => {
        // Change status from draft to pending
        try {
            await fetch(`/api/tenants/${applicationId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    status: 'pending'
                })
            });
            alert('Application submitted successfully!');
            router.push('/dashboard');
        } catch (err) {
            console.error('Failed to submit application:', err);
        }
    };

    if (loading || authLoading) {
        return <div className="flex-1 flex items-center justify-center p-8">Loading...</div>;
    }

    return (
        <div className="flex-1 container mx-auto max-w-3xl py-12 px-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Partner Application</h2>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500">Step {step} of 3</span>
                        <span className="text-sm font-medium text-emerald-600">
                            {step === 1 ? 'Basic Info' : step === 2 ? 'Upload Documents' : 'Review & Submit'}
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
                        />
                    </div>
                </div>

                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Business/House Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                                placeholder="e.g. Serenity Path Homes"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                            <input
                                type="email"
                                value={formData.contactEmail}
                                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="hello@serenitypath.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                            <input
                                type="tel"
                                value={formData.contactPhone}
                                onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="(555) 123-4567"
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => {
                                    handleSave();
                                    setStep(2);
                                }}
                                className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
                                disabled={!formData.name}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium text-slate-900">Upload Documents</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Please upload verifying documents for your application. We require a Government ID and a Business Document.
                        </p>

                        <div className="border border-slate-200 rounded-xl p-6 bg-slate-50">
                            {formData.governmentIdUrl ? (
                                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 text-sm flex items-center">
                                    ✓ Government ID uploaded successfully
                                </div>
                            ) : (
                                <FileUploader
                                    applicationId={applicationId}
                                    field="gov_id"
                                    label="Government ID"
                                    onUploadSuccess={(url: string) => setFormData({ ...formData, governmentIdUrl: url })}
                                />
                            )}

                            {formData.businessDocUrl ? (
                                <div className="mb-4 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 text-sm flex items-center">
                                    ✓ Business Document uploaded successfully
                                </div>
                            ) : (
                                <div className="mt-4">
                                    <FileUploader
                                        applicationId={applicationId}
                                        field="business_doc"
                                        label="Business Operating Document (LLC, 501c3, etc)"
                                        onUploadSuccess={(url: string) => setFormData({ ...formData, businessDocUrl: url })}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between pt-4">
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-2 bg-white text-slate-700 border border-slate-300 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => {
                                    handleSave();
                                    setStep(3);
                                }}
                                className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Review Information</h3>
                            <dl className="grid grid-cols-2 gap-4">
                                <div>
                                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Business Name</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{formData.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contact Email</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{formData.contactEmail}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contact Phone</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{formData.contactPhone}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Documents</dt>
                                    <dd className="mt-1 text-sm text-slate-900">
                                        {formData.governmentIdUrl ? 'ID Uploaded ✓' : 'Missing ID'} • {formData.businessDocUrl ? 'Business Doc Uploaded ✓' : 'Missing Business Doc'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <p className="text-sm text-slate-500">
                            By submitting this application, you agree to our Terms of Service. SuperAdministrators will review your application and respond shortly.
                        </p>

                        <div className="flex justify-between pt-4">
                            <button
                                onClick={() => setStep(2)}
                                className="px-6 py-2 bg-white text-slate-700 border border-slate-300 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                                disabled={!formData.name || !formData.governmentIdUrl}
                            >
                                Submit Application
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
