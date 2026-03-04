'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';

const TOTAL_STEPS = 4;
const STEP_LABELS = [
    'Personal Info',
    'Position & Certifications',
    'Experience & References',
    'Review & Submit',
];

type PositionType =
    | 'House Manager'
    | 'Counselor'
    | 'Peer Support Specialist'
    | 'Driver'
    | 'Other';

type Availability = 'Full-time' | 'Part-time' | 'On-call';

type Certification =
    | 'CADC'
    | 'CPR Certified'
    | 'First Aid'
    | 'CNA'
    | 'Social Work License'
    | 'None';

const ALL_CERTIFICATIONS: Certification[] = [
    'CADC',
    'CPR Certified',
    'First Aid',
    'CNA',
    'Social Work License',
    'None',
];

interface Reference {
    name: string;
    phone: string;
    relationship: string;
}

const emptyReference = (): Reference => ({ name: '', phone: '', relationship: '' });

interface StaffFormData {
    // Step 1
    applicantName: string;
    applicantEmail: string;
    phone: string;
    zipCode: string;
    // Step 2
    positionType: PositionType | '';
    certifications: Certification[];
    availability: Availability | '';
    // Step 3
    yearsExperience: string;
    experienceSummary: string;
    references: [Reference, Reference];
    resumeFile: File | null;
}

const defaultFormData = (): StaffFormData => ({
    applicantName: '',
    applicantEmail: '',
    phone: '',
    zipCode: '',
    positionType: '',
    certifications: [],
    availability: '',
    yearsExperience: '',
    experienceSummary: '',
    references: [emptyReference(), emptyReference()],
    resumeFile: null,
});

export default function StaffApplicationPage() {
    const { user, loading: authLoading } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [formData, setFormData] = useState<StaffFormData>(defaultFormData);

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

    const set = <K extends keyof StaffFormData>(key: K, value: StaffFormData[K]) =>
        setFormData(prev => ({ ...prev, [key]: value }));

    const setRef = (index: 0 | 1, field: keyof Reference, value: string) => {
        setFormData(prev => {
            const refs = [
                { ...prev.references[0] },
                { ...prev.references[1] },
            ] as [Reference, Reference];
            refs[index] = { ...refs[index], [field]: value };
            return { ...prev, references: refs };
        });
    };

    const toggleCertification = (cert: Certification) => {
        setFormData(prev => {
            if (cert === 'None') {
                // Selecting "None" clears all others
                return {
                    ...prev,
                    certifications: prev.certifications.includes('None') ? [] : ['None'],
                };
            }
            // Selecting any real cert removes "None"
            const without = prev.certifications.filter(c => c !== 'None');
            if (without.includes(cert)) {
                return { ...prev, certifications: without.filter(c => c !== cert) };
            }
            return { ...prev, certifications: [...without, cert] };
        });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError(null);
        try {
            const token = await authService.getIdToken();
            const res = await fetch('/api/applications/staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    applicantName: formData.applicantName,
                    applicantEmail: formData.applicantEmail,
                    zipCode: formData.zipCode,
                    data: {
                        phone: formData.phone,
                        positionType: formData.positionType,
                        certifications: formData.certifications,
                        availability: formData.availability,
                        yearsExperience: formData.yearsExperience,
                        experienceSummary: formData.experienceSummary,
                        references: formData.references,
                        resumeUploaded: false, // Resume upload coming soon
                    },
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || 'Submission failed');
            }
            setSubmitted(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Submission failed. Please try again.';
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
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
                    <p className="text-slate-500 mb-6">
                        Thank you for applying, <strong>{formData.applicantName}</strong>. Our team will review
                        your application and reach out to you at{' '}
                        <strong>{formData.applicantEmail}</strong> shortly.
                    </p>
                    <p className="text-sm text-slate-400">
                        Position applied for: <strong>{formData.positionType}</strong>
                    </p>
                </div>
            </div>
        );
    }

    const ref1Valid =
        formData.references[0].name.trim() &&
        formData.references[0].phone.trim() &&
        formData.references[0].relationship.trim();
    const ref2Valid =
        formData.references[1].name.trim() &&
        formData.references[1].phone.trim() &&
        formData.references[1].relationship.trim();

    return (
        <div className="flex-1 container mx-auto max-w-3xl py-12 px-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Staff / Job Application</h2>
                <p className="text-sm text-slate-500 mb-6">
                    Apply to work at a sober-living house in your area.
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

                {/* ---- Step 1: Personal Info ---- */}
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
                            <label className={labelClass}>Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => set('phone', e.target.value)}
                                className={inputClass}
                                placeholder="(555) 123-4567"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>ZIP Code</label>
                            <input
                                type="text"
                                value={formData.zipCode}
                                onChange={e => set('zipCode', e.target.value)}
                                className={inputClass}
                                placeholder="90210"
                                maxLength={10}
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <button
                                className={nextBtnClass}
                                disabled={
                                    !formData.applicantName.trim() ||
                                    !formData.applicantEmail.trim() ||
                                    !formData.zipCode.trim()
                                }
                                onClick={() => setStep(2)}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* ---- Step 2: Position & Certifications ---- */}
                {step === 2 && (
                    <div className="space-y-5">
                        <div>
                            <label className={labelClass}>Position Type</label>
                            <select
                                value={formData.positionType}
                                onChange={e => set('positionType', e.target.value as PositionType)}
                                className={inputClass}
                            >
                                <option value="">Select a position...</option>
                                <option value="House Manager">House Manager</option>
                                <option value="Counselor">Counselor</option>
                                <option value="Peer Support Specialist">Peer Support Specialist</option>
                                <option value="Driver">Driver</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Certifications</label>
                            <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50">
                                {ALL_CERTIFICATIONS.map(cert => (
                                    <label
                                        key={cert}
                                        className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.certifications.includes(cert)}
                                            onChange={() => toggleCertification(cert)}
                                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        {cert}
                                    </label>
                                ))}
                            </div>
                            {formData.certifications.length === 0 && (
                                <p className="mt-1 text-xs text-slate-400">Select at least one option (including &quot;None&quot;).</p>
                            )}
                        </div>

                        <div>
                            <label className={labelClass}>Availability</label>
                            <select
                                value={formData.availability}
                                onChange={e => set('availability', e.target.value as Availability)}
                                className={inputClass}
                            >
                                <option value="">Select availability...</option>
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="On-call">On-call</option>
                            </select>
                        </div>

                        <div className="flex justify-between pt-4">
                            <button className={backBtnClass} onClick={() => setStep(1)}>
                                Back
                            </button>
                            <button
                                className={nextBtnClass}
                                disabled={
                                    !formData.positionType ||
                                    formData.certifications.length === 0 ||
                                    !formData.availability
                                }
                                onClick={() => setStep(3)}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* ---- Step 3: Experience & References ---- */}
                {step === 3 && (
                    <div className="space-y-5">
                        <div>
                            <label className={labelClass}>Years of Experience</label>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={formData.yearsExperience}
                                onChange={e => set('yearsExperience', e.target.value)}
                                className={inputClass}
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Experience Summary{' '}
                                <span className="text-slate-400 font-normal">(~200 words)</span>
                            </label>
                            <textarea
                                value={formData.experienceSummary}
                                onChange={e => set('experienceSummary', e.target.value)}
                                className={inputClass}
                                rows={6}
                                placeholder="Describe your relevant experience working in recovery, sober living, counseling, or related fields..."
                            />
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">References (2 required)</h3>
                            <div className="space-y-4">
                                {([0, 1] as const).map(idx => (
                                    <div
                                        key={idx}
                                        className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4"
                                    >
                                        <p className="text-sm font-semibold text-slate-600">Reference {idx + 1}</p>
                                        <div>
                                            <label className={labelClass}>Full Name</label>
                                            <input
                                                type="text"
                                                value={formData.references[idx].name}
                                                onChange={e => setRef(idx, 'name', e.target.value)}
                                                className={inputClass}
                                                placeholder="Reference name"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Phone Number</label>
                                            <input
                                                type="tel"
                                                value={formData.references[idx].phone}
                                                onChange={e => setRef(idx, 'phone', e.target.value)}
                                                className={inputClass}
                                                placeholder="(555) 000-0000"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Relationship</label>
                                            <input
                                                type="text"
                                                value={formData.references[idx].relationship}
                                                onChange={e => setRef(idx, 'relationship', e.target.value)}
                                                className={inputClass}
                                                placeholder="e.g. Former supervisor, Colleague"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resume upload — placeholder */}
                        <div>
                            <label className={labelClass}>Resume (optional)</label>
                            <div className="border border-dashed border-slate-300 rounded-lg p-5 bg-slate-50 text-center">
                                <p className="text-sm text-slate-500 mb-2">Resume upload coming soon.</p>
                                <p className="text-xs text-slate-400">
                                    You can email your resume to{' '}
                                    <span className="text-slate-600">apply@hvg.com</span> after submitting.
                                </p>
                                {/* Hidden input preserved for future implementation */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={e => {
                                        const file = e.target.files?.[0] ?? null;
                                        set('resumeFile', file);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <button className={backBtnClass} onClick={() => setStep(2)}>
                                Back
                            </button>
                            <button
                                className={nextBtnClass}
                                disabled={
                                    !formData.yearsExperience ||
                                    !formData.experienceSummary.trim() ||
                                    !ref1Valid ||
                                    !ref2Valid
                                }
                                onClick={() => setStep(4)}
                            >
                                Review Application
                            </button>
                        </div>
                    </div>
                )}

                {/* ---- Step 4: Review & Submit ---- */}
                {step === 4 && (
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
                                    <dd className="mt-0.5 text-slate-900">{formData.phone || '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">ZIP Code</dt>
                                    <dd className="mt-0.5 text-slate-900">{formData.zipCode}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                Position & Certifications
                            </h3>
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Position</dt>
                                    <dd className="mt-0.5 text-slate-900">{formData.positionType}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Availability</dt>
                                    <dd className="mt-0.5 text-slate-900">{formData.availability}</dd>
                                </div>
                                <div className="col-span-2">
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Certifications</dt>
                                    <dd className="mt-0.5 text-slate-900">
                                        {formData.certifications.length > 0
                                            ? formData.certifications.join(', ')
                                            : '—'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                Experience
                            </h3>
                            <dl className="space-y-3 text-sm">
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Years of Experience</dt>
                                    <dd className="mt-0.5 text-slate-900">{formData.yearsExperience}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Summary</dt>
                                    <dd className="mt-0.5 text-slate-900 whitespace-pre-wrap">{formData.experienceSummary}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                References
                            </h3>
                            <div className="space-y-3 text-sm">
                                {formData.references.map((ref, idx) => (
                                    <div key={idx}>
                                        <p className="font-medium text-slate-800">{ref.name}</p>
                                        <p className="text-slate-500">{ref.relationship} &middot; {ref.phone}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {submitError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {submitError}
                            </div>
                        )}

                        <p className="text-xs text-slate-400">
                            By submitting, you confirm that all information provided is accurate and that you consent
                            to a background check as part of the hiring process.
                        </p>

                        <div className="flex justify-between pt-2">
                            <button className={backBtnClass} onClick={() => setStep(3)}>
                                Back
                            </button>
                            <button
                                className={submitBtnClass}
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
