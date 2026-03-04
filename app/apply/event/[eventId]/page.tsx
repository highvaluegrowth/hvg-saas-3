'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { use } from 'react';

interface EventFormData {
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string;
    eventId: string;
    dietaryRequirements: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    additionalNotes: string;
}

const defaultFormData = (eventId: string): EventFormData => ({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    eventId,
    dietaryRequirements: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    additionalNotes: '',
});

export default function EventRegistrationPage({
    params,
}: {
    params: Promise<{ eventId: string }>;
}) {
    const { eventId } = use(params);
    const { user, loading: authLoading } = useAuth();

    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [formData, setFormData] = useState<EventFormData>(() => defaultFormData(eventId));

    const eventLabel = eventId === 'general' ? 'General Registration' : eventId;

    useEffect(() => {
        if (authLoading) return;
        if (user) {
            setFormData(prev => ({
                ...prev,
                applicantName: prev.applicantName || user.displayName || '',
                applicantEmail: prev.applicantEmail || user.email || '',
            }));
        }
    }, [user, authLoading]);

    const set = <K extends keyof EventFormData>(key: K, value: EventFormData[K]) =>
        setFormData(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError(null);
        try {
            const token = await authService.getIdToken();
            const res = await fetch('/api/applications/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    applicantName: formData.applicantName,
                    applicantEmail: formData.applicantEmail,
                    zipCode: '',
                    data: {
                        eventId: formData.eventId,
                        phone: formData.applicantPhone,
                        dietaryRequirements: formData.dietaryRequirements,
                        emergencyContactName: formData.emergencyContactName,
                        emergencyContactPhone: formData.emergencyContactPhone,
                        additionalNotes: formData.additionalNotes,
                    },
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as { message?: string }).message || 'Submission failed');
            }
            setSubmitted(true);
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Submission failed. Please try again.';
            setSubmitError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass =
        'w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow';
    const labelClass = 'block text-sm font-medium text-slate-700 mb-1';
    const submitBtnClass =
        'px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    // ---- Success Screen ----
    if (submitted) {
        return (
            <div className="flex-1 container mx-auto max-w-3xl py-12 px-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                    <div className="text-5xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re Registered!</h2>
                    <p className="text-slate-500 mb-6">
                        You&apos;re registered! We&apos;ll send confirmation to{' '}
                        <strong>{formData.applicantEmail}</strong>.
                    </p>
                    <p className="text-sm text-slate-400">
                        Event: <strong>{eventLabel}</strong>
                    </p>
                </div>
            </div>
        );
    }

    const canSubmit =
        formData.applicantName.trim() &&
        formData.applicantEmail.trim() &&
        formData.emergencyContactName.trim() &&
        formData.emergencyContactPhone.trim();

    return (
        <div className="flex-1 container mx-auto max-w-3xl py-12 px-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Event Registration</h2>
                <p className="text-sm text-slate-500 mb-6">
                    Event reference:{' '}
                    <span className="font-medium text-slate-700">{eventLabel}</span>
                </p>

                <div className="space-y-5">
                    {/* Personal Info */}
                    <div>
                        <label className={labelClass}>Full Name</label>
                        <input
                            type="text"
                            value={formData.applicantName}
                            onChange={e => set('applicantName', e.target.value)}
                            className={inputClass}
                            placeholder="Jane Smith"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Email Address</label>
                        <input
                            type="email"
                            value={formData.applicantEmail}
                            onChange={e => set('applicantEmail', e.target.value)}
                            className={inputClass}
                            placeholder="jane@example.com"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>
                            Phone Number{' '}
                            <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <input
                            type="tel"
                            value={formData.applicantPhone}
                            onChange={e => set('applicantPhone', e.target.value)}
                            className={inputClass}
                            placeholder="(555) 123-4567"
                        />
                    </div>

                    <hr className="border-slate-100" />

                    {/* Event-specific fields */}
                    <div>
                        <label className={labelClass}>
                            Dietary Requirements{' '}
                            <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={formData.dietaryRequirements}
                            onChange={e => set('dietaryRequirements', e.target.value)}
                            className={inputClass}
                            placeholder="e.g., vegetarian, gluten-free, none"
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Emergency Contact Name</label>
                        <input
                            type="text"
                            value={formData.emergencyContactName}
                            onChange={e => set('emergencyContactName', e.target.value)}
                            className={inputClass}
                            placeholder="Contact full name"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Emergency Contact Phone</label>
                        <input
                            type="tel"
                            value={formData.emergencyContactPhone}
                            onChange={e => set('emergencyContactPhone', e.target.value)}
                            className={inputClass}
                            placeholder="(555) 000-0000"
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            Additional Notes{' '}
                            <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={formData.additionalNotes}
                            onChange={e => set('additionalNotes', e.target.value)}
                            className={inputClass}
                            rows={4}
                            placeholder="Anything else we should know?"
                        />
                    </div>

                    {submitError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {submitError}
                        </div>
                    )}

                    <p className="text-xs text-slate-400">
                        By registering, you confirm that the information provided is accurate. A confirmation
                        will be sent to your email address.
                    </p>

                    <div className="flex justify-end pt-2">
                        <button
                            className={submitBtnClass}
                            onClick={handleSubmit}
                            disabled={submitting || !canSubmit}
                        >
                            {submitting ? 'Registering...' : 'Register for Event'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
