'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';

const TOTAL_STEPS = 5;
const STEP_LABELS = [
    'Personal Info',
    'Recovery Profile',
    'Preferences',
    'References',
    'Review & Submit',
];

type FundingSource = 'Self-Pay' | 'Insurance' | 'County/State' | 'Other';
type Gender = 'Male' | 'Female' | 'Non-binary' | 'Other';
type HouseGenderPref = "Men's" | "Women's" | 'Co-ed' | 'No preference';

interface Reference {
    name: string;
    phone: string;
    relationship: string;
}

interface BedFormData {
    // Step 1 — Personal Info
    applicantName: string;
    applicantEmail: string;
    phone: string;
    zipCode: string;
    // Step 2 — Recovery Profile
    sobrietyDate: string;
    substanceHistory: string;
    goals: string;
    fundingSource: FundingSource | '';
    // Step 3 — Preferences
    gender: Gender | '';
    housePref: HouseGenderPref | '';
    accessibilityNeeds: string;
    // Step 4 — References
    references: Reference[];
}

const emptyReference = (): Reference => ({ name: '', phone: '', relationship: '' });

const defaultFormData = (): BedFormData => ({
    applicantName: '',
    applicantEmail: '',
    phone: '',
    zipCode: '',
    sobrietyDate: '',
    substanceHistory: '',
    goals: '',
    fundingSource: '',
    gender: '',
    housePref: '',
    accessibilityNeeds: '',
    references: [emptyReference()],
});

export default function BedApplicationPage() {
    const { user, loading: authLoading } = useAuth();

    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [formData, setFormData] = useState<BedFormData>(defaultFormData);

    // Pre-fill from logged-in user
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

    const set = <K extends keyof BedFormData>(key: K, value: BedFormData[K]) =>
        setFormData(prev => ({ ...prev, [key]: value }));

    const setRef = (index: number, field: keyof Reference, value: string) => {
        setFormData(prev => {
            const refs = prev.references.map((r, i) =>
                i === index ? { ...r, [field]: value } : r
            );
            return { ...prev, references: refs };
        });
    };

    const addReference = () => {
        if (formData.references.length < 2) {
            setFormData(prev => ({ ...prev, references: [...prev.references, emptyReference()] }));
        }
    };

    const removeReference = (index: number) => {
        setFormData(prev => ({
            ...prev,
            references: prev.references.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError(null);
        try {
            const token = await authService.getIdToken();
            const res = await fetch('/api/applications/bed', {
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
                        sobrietyDate: formData.sobrietyDate,
                        substanceHistory: formData.substanceHistory,
                        goals: formData.goals,
                        fundingSource: formData.fundingSource,
                        gender: formData.gender,
                        housePref: formData.housePref,
                        accessibilityNeeds: formData.accessibilityNeeds,
                        references: formData.references,
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
                        Thank you for applying, <strong>{formData.applicantName}</strong>. Our team will review your
                        application and reach out to you at <strong>{formData.applicantEmail}</strong> shortly.
                    </p>
                    <p className="text-sm text-slate-400">
                        We will match you with available sober-living homes in your area (ZIP: {formData.zipCode}).
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 container mx-auto max-w-3xl py-12 px-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Resident Bed Application</h2>
                <p className="text-sm text-slate-500 mb-6">Find a sober-living home that is right for you.</p>

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
                            <label className={labelClass}>ZIP Code <span className="text-slate-400 font-normal">(used to match nearby homes)</span></label>
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

                {/* ---- Step 2: Recovery Profile ---- */}
                {step === 2 && (
                    <div className="space-y-5">
                        <div>
                            <label className={labelClass}>
                                Sobriety Date{' '}
                                <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <input
                                type="date"
                                value={formData.sobrietyDate}
                                onChange={e => set('sobrietyDate', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Substance History</label>
                            <textarea
                                value={formData.substanceHistory}
                                onChange={e => set('substanceHistory', e.target.value)}
                                className={inputClass}
                                rows={4}
                                placeholder="Please briefly describe your history with substance use..."
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Recovery Goals</label>
                            <textarea
                                value={formData.goals}
                                onChange={e => set('goals', e.target.value)}
                                className={inputClass}
                                rows={4}
                                placeholder="What would you like to achieve in your recovery journey?"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Funding Source</label>
                            <select
                                value={formData.fundingSource}
                                onChange={e => set('fundingSource', e.target.value as FundingSource)}
                                className={inputClass}
                            >
                                <option value="">Select a funding source...</option>
                                <option value="Self-Pay">Self-Pay</option>
                                <option value="Insurance">Insurance</option>
                                <option value="County/State">County / State</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="flex justify-between pt-4">
                            <button className={backBtnClass} onClick={() => setStep(1)}>
                                Back
                            </button>
                            <button
                                className={nextBtnClass}
                                disabled={!formData.substanceHistory.trim() || !formData.goals.trim() || !formData.fundingSource}
                                onClick={() => setStep(3)}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* ---- Step 3: Preferences ---- */}
                {step === 3 && (
                    <div className="space-y-5">
                        <div>
                            <label className={labelClass}>Your Gender</label>
                            <select
                                value={formData.gender}
                                onChange={e => set('gender', e.target.value as Gender)}
                                className={inputClass}
                            >
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Non-binary">Non-binary</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>House Gender Preference</label>
                            <select
                                value={formData.housePref}
                                onChange={e => set('housePref', e.target.value as HouseGenderPref)}
                                className={inputClass}
                            >
                                <option value="">Select preference...</option>
                                <option value="Men's">Men&apos;s House</option>
                                <option value="Women's">Women&apos;s House</option>
                                <option value="Co-ed">Co-ed House</option>
                                <option value="No preference">No preference</option>
                            </select>
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
                                placeholder="Describe any accessibility requirements or accommodations needed..."
                            />
                        </div>
                        <div className="flex justify-between pt-4">
                            <button className={backBtnClass} onClick={() => setStep(2)}>
                                Back
                            </button>
                            <button
                                className={nextBtnClass}
                                disabled={!formData.gender || !formData.housePref}
                                onClick={() => setStep(4)}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* ---- Step 4: References ---- */}
                {step === 4 && (
                    <div className="space-y-6">
                        <p className="text-sm text-slate-500">
                            Please provide 1–2 personal or professional references who can speak to your character
                            and commitment to recovery.
                        </p>

                        {formData.references.map((ref, idx) => (
                            <div
                                key={idx}
                                className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-700">
                                        Reference {idx + 1}
                                    </h3>
                                    {idx > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => removeReference(idx)}
                                            className="text-xs text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <div>
                                    <label className={labelClass}>Full Name</label>
                                    <input
                                        type="text"
                                        value={ref.name}
                                        onChange={e => setRef(idx, 'name', e.target.value)}
                                        className={inputClass}
                                        placeholder="Reference name"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Phone Number</label>
                                    <input
                                        type="tel"
                                        value={ref.phone}
                                        onChange={e => setRef(idx, 'phone', e.target.value)}
                                        className={inputClass}
                                        placeholder="(555) 000-0000"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Relationship</label>
                                    <input
                                        type="text"
                                        value={ref.relationship}
                                        onChange={e => setRef(idx, 'relationship', e.target.value)}
                                        className={inputClass}
                                        placeholder="e.g. Sponsor, Family, Counselor"
                                    />
                                </div>
                            </div>
                        ))}

                        {formData.references.length < 2 && (
                            <button
                                type="button"
                                onClick={addReference}
                                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                            >
                                <span className="text-lg leading-none">+</span> Add another reference
                            </button>
                        )}

                        <div className="flex justify-between pt-4">
                            <button className={backBtnClass} onClick={() => setStep(3)}>
                                Back
                            </button>
                            <button
                                className={nextBtnClass}
                                disabled={
                                    !formData.references[0]?.name.trim() ||
                                    !formData.references[0]?.phone.trim() ||
                                    !formData.references[0]?.relationship.trim()
                                }
                                onClick={() => setStep(5)}
                            >
                                Review Application
                            </button>
                        </div>
                    </div>
                )}

                {/* ---- Step 5: Review & Submit ---- */}
                {step === 5 && (
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
                                Recovery Profile
                            </h3>
                            <dl className="space-y-3 text-sm">
                                {formData.sobrietyDate && (
                                    <div>
                                        <dt className="text-xs text-slate-400 uppercase tracking-wide">Sobriety Date</dt>
                                        <dd className="mt-0.5 text-slate-900">{formData.sobrietyDate}</dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Funding Source</dt>
                                    <dd className="mt-0.5 text-slate-900">{formData.fundingSource}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Substance History</dt>
                                    <dd className="mt-0.5 text-slate-900 whitespace-pre-wrap">{formData.substanceHistory}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Goals</dt>
                                    <dd className="mt-0.5 text-slate-900 whitespace-pre-wrap">{formData.goals}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                Preferences
                            </h3>
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Gender</dt>
                                    <dd className="mt-0.5 text-slate-900">{formData.gender}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">House Preference</dt>
                                    <dd className="mt-0.5 text-slate-900">{formData.housePref}</dd>
                                </div>
                                {formData.accessibilityNeeds && (
                                    <div className="col-span-2">
                                        <dt className="text-xs text-slate-400 uppercase tracking-wide">Accessibility Needs</dt>
                                        <dd className="mt-0.5 text-slate-900 whitespace-pre-wrap">{formData.accessibilityNeeds}</dd>
                                    </div>
                                )}
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
                            By submitting, you confirm that all information provided is accurate. Your application
                            will be reviewed and matched with available homes in your area.
                        </p>

                        <div className="flex justify-between pt-2">
                            <button className={backBtnClass} onClick={() => setStep(4)}>
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
