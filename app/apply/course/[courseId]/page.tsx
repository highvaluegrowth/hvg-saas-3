'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { use } from 'react';

const TOTAL_STEPS = 2;
const STEP_LABELS = ['Course Details', 'Review & Submit'];

interface CourseFormData {
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string;
    courseId: string;
    preferredStartDate: string;
    motivation: string;
    hasCompletedSimilarCourse: boolean;
    accessibilityNeeds: string;
}

const defaultFormData = (courseId: string): CourseFormData => ({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    courseId,
    preferredStartDate: '',
    motivation: '',
    hasCompletedSimilarCourse: false,
    accessibilityNeeds: '',
});

export default function CourseEnrollmentPage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = use(params);
    const { user, loading: authLoading } = useAuth();

    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [formData, setFormData] = useState<CourseFormData>(() => defaultFormData(courseId));

    const courseName = courseId === 'general' ? 'General Enrollment' : courseId;

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

    const set = <K extends keyof CourseFormData>(key: K, value: CourseFormData[K]) =>
        setFormData(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError(null);
        try {
            const token = await authService.getIdToken();
            const res = await fetch('/api/applications/course', {
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
                        courseId: formData.courseId,
                        phone: formData.applicantPhone,
                        preferredStartDate: formData.preferredStartDate,
                        motivation: formData.motivation,
                        hasCompletedSimilarCourse: formData.hasCompletedSimilarCourse,
                        accessibilityNeeds: formData.accessibilityNeeds,
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

    const progressPct = Math.round((step / TOTAL_STEPS) * 100);

    const inputClass =
        'w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow';
    const labelClass = 'block text-sm font-medium text-slate-700 mb-1';
    const backBtnClass =
        'px-6 py-2 bg-white text-slate-700 border border-slate-300 font-medium rounded-lg hover:bg-slate-50 transition-colors';
    const nextBtnClass =
        'px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    const submitBtnClass =
        'px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    // ---- Success Screen ----
    if (submitted) {
        return (
            <div className="flex-1 container mx-auto max-w-3xl py-12 px-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                    <div className="text-5xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Enrollment Submitted!</h2>
                    <p className="text-slate-500 mb-6">
                        Your enrollment application has been submitted. A coordinator will contact you at{' '}
                        <strong>{formData.applicantEmail}</strong> to confirm your spot.
                    </p>
                    <p className="text-sm text-slate-400">
                        Course: <strong>{courseName}</strong>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 container mx-auto max-w-3xl py-12 px-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Course Enrollment Application</h2>
                <p className="text-sm text-slate-500 mb-6">
                    Enrolling in: <span className="font-medium text-slate-700">{courseName}</span>
                </p>

                {/* Progress bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500">
                            Step {step} of {TOTAL_STEPS}
                        </span>
                        <span className="text-sm font-medium text-emerald-600">{STEP_LABELS[step - 1]}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>

                {/* ---- Step 1: Course Details ---- */}
                {step === 1 && (
                    <div className="space-y-5">
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
                        <div>
                            <label className={labelClass}>Preferred Start Date</label>
                            <input
                                type="date"
                                value={formData.preferredStartDate}
                                onChange={e => set('preferredStartDate', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                Why do you want to take this course?{' '}
                                <span className="text-slate-400 font-normal">(min. 50 characters encouraged)</span>
                            </label>
                            <textarea
                                value={formData.motivation}
                                onChange={e => set('motivation', e.target.value)}
                                className={inputClass}
                                rows={5}
                                placeholder="Share what motivates you to enroll and what you hope to gain from this course..."
                            />
                            {formData.motivation.length > 0 && formData.motivation.length < 50 && (
                                <p className="mt-1 text-xs text-amber-600">
                                    {50 - formData.motivation.length} more characters recommended.
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.hasCompletedSimilarCourse}
                                    onChange={e => set('hasCompletedSimilarCourse', e.target.checked)}
                                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-700">
                                    I have completed a similar course before
                                </span>
                            </label>
                        </div>
                        <div>
                            <label className={labelClass}>
                                Accessibility Needs{' '}
                                <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <textarea
                                value={formData.accessibilityNeeds}
                                onChange={e => set('accessibilityNeeds', e.target.value)}
                                className={inputClass}
                                rows={3}
                                placeholder="Any accommodations needed?"
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <button
                                className={nextBtnClass}
                                disabled={
                                    !formData.applicantName.trim() ||
                                    !formData.applicantEmail.trim() ||
                                    !formData.preferredStartDate ||
                                    !formData.motivation.trim()
                                }
                                onClick={() => setStep(2)}
                            >
                                Review Enrollment
                            </button>
                        </div>
                    </div>
                )}

                {/* ---- Step 2: Review & Submit ---- */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                Personal Info
                            </h3>
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Name</dt>
                                    <dd className="mt-0.5 text-slate-900">{formData.applicantName}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Email</dt>
                                    <dd className="mt-0.5 text-slate-900">{formData.applicantEmail}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Phone</dt>
                                    <dd className="mt-0.5 text-slate-900">{formData.applicantPhone || '—'}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                Enrollment Details
                            </h3>
                            <dl className="space-y-3 text-sm">
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Course</dt>
                                    <dd className="mt-0.5 text-slate-900">{courseName}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Preferred Start Date</dt>
                                    <dd className="mt-0.5 text-slate-900">{formData.preferredStartDate}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">
                                        Completed Similar Course
                                    </dt>
                                    <dd className="mt-0.5 text-slate-900">
                                        {formData.hasCompletedSimilarCourse ? 'Yes' : 'No'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Motivation</dt>
                                    <dd className="mt-0.5 text-slate-900 whitespace-pre-wrap">{formData.motivation}</dd>
                                </div>
                                {formData.accessibilityNeeds && (
                                    <div>
                                        <dt className="text-xs text-slate-400 uppercase tracking-wide">
                                            Accessibility Needs
                                        </dt>
                                        <dd className="mt-0.5 text-slate-900 whitespace-pre-wrap">
                                            {formData.accessibilityNeeds}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {submitError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {submitError}
                            </div>
                        )}

                        <p className="text-xs text-slate-400">
                            By submitting, you confirm that all information provided is accurate. A coordinator will
                            review your enrollment and contact you to confirm your spot.
                        </p>

                        <div className="flex justify-between pt-2">
                            <button className={backBtnClass} onClick={() => setStep(1)}>
                                Back
                            </button>
                            <button
                                className={submitBtnClass}
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting...' : 'Submit Enrollment'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
