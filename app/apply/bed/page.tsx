'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';

const TOTAL_STEPS = 6;
const STEP_LABELS = [
    'Personal Info',
    'Recovery Profile',
    'Funding & Insurance',
    'Housing & Background',
    'Preferences & References',
    'Review & Submit',
];

type ThreeState = '' | 'yes' | 'no';
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
    dateOfBirth: string;
    raceEthnicity: string;
    // Step 2 — Recovery Profile
    sobrietyDate: string;
    primarySubstance: string;
    daysUsedPast30: number | '';
    matStatus: ThreeState;
    matMedication: string;
    injectionDrugUse: ThreeState;
    substanceHistory: string;
    goals: string;
    // Step 3 — Funding & Insurance
    fundingSources: string[];
    insuranceCarrier: string;
    insuranceMemberId: string;
    insuranceGroupNumber: string;
    insurancePriorAuth: 'Yes' | 'No' | 'In progress' | '';
    // Step 4 — Housing & Background
    currentHousing: string;
    criminalJusticeSupervision: ThreeState;
    supervisionType: string;
    employmentStatus: string;
    coOccurringDiagnosis: ThreeState;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
    // Step 5 — Preferences
    gender: Gender | '';
    housePref: HouseGenderPref | '';
    accessibilityNeeds: string;
    // Step 5 — References
    references: Reference[];
}

const FUNDING_OPTIONS = [
    'Medicaid',
    'Medicare',
    'Private Insurance',
    'SOR Grant',
    'SAPT Block Grant',
    'Oxford House Grant',
    'Self-Pay',
    'Scholarship / Other',
];
const INSURANCE_TRIGGERS = ['Medicaid', 'Medicare', 'Private Insurance'];

const RACE_OPTIONS = [
    'American Indian / Alaska Native',
    'Asian',
    'Black / African American',
    'Hispanic / Latino',
    'Native Hawaiian / Pacific Islander',
    'White / Caucasian',
    'Multi-racial',
    'Prefer not to say',
];

const SUBSTANCE_OPTIONS = [
    'Alcohol',
    'Opioids (heroin / fentanyl)',
    'Prescription Opioids',
    'Methamphetamine',
    'Cocaine / Crack',
    'Cannabis',
    'Benzodiazepines',
    'Other',
];

const HOUSING_OPTIONS = [
    'Homeless / shelter',
    'With family / friends',
    'Renting independently',
    'Transitional / sober living',
    'Treatment facility',
    'Correctional facility / recently released',
    'Other',
];

const EMPLOYMENT_OPTIONS = [
    'Employed full-time',
    'Employed part-time',
    'Unemployed – seeking work',
    'Unemployed – not seeking',
    'Student',
    'Disabled / unable to work',
];

const emptyReference = (): Reference => ({ name: '', phone: '', relationship: '' });

const defaultFormData = (): BedFormData => ({
    applicantName: '',
    applicantEmail: '',
    phone: '',
    zipCode: '',
    dateOfBirth: '',
    raceEthnicity: '',
    sobrietyDate: '',
    primarySubstance: '',
    daysUsedPast30: '',
    matStatus: '',
    matMedication: '',
    injectionDrugUse: '',
    substanceHistory: '',
    goals: '',
    fundingSources: [],
    insuranceCarrier: '',
    insuranceMemberId: '',
    insuranceGroupNumber: '',
    insurancePriorAuth: '',
    currentHousing: '',
    criminalJusticeSupervision: '',
    supervisionType: '',
    employmentStatus: '',
    coOccurringDiagnosis: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
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

    const toggleFundingSource = (source: string) => {
        setFormData(prev => ({
            ...prev,
            fundingSources: prev.fundingSources.includes(source)
                ? prev.fundingSources.filter(s => s !== source)
                : [...prev.fundingSources, source],
        }));
    };

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

    const showInsurance = formData.fundingSources.some(f => INSURANCE_TRIGGERS.includes(f));

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
                        dateOfBirth: formData.dateOfBirth || undefined,
                        raceEthnicity: formData.raceEthnicity || undefined,
                        sobrietyDate: formData.sobrietyDate || undefined,
                        primarySubstance: formData.primarySubstance || undefined,
                        daysUsedPast30: formData.daysUsedPast30 !== '' ? formData.daysUsedPast30 : undefined,
                        matStatus: formData.matStatus !== '' ? formData.matStatus === 'yes' : undefined,
                        matMedication: formData.matMedication || undefined,
                        injectionDrugUse: formData.injectionDrugUse !== '' ? formData.injectionDrugUse === 'yes' : undefined,
                        substanceHistory: formData.substanceHistory || undefined,
                        goals: formData.goals,
                        fundingSources: formData.fundingSources,
                        fundingSource: formData.fundingSources.join(', '), // legacy compat
                        insuranceDetails: showInsurance && formData.insuranceCarrier ? {
                            carrier: formData.insuranceCarrier,
                            memberId: formData.insuranceMemberId,
                            groupNumber: formData.insuranceGroupNumber || undefined,
                            priorAuthStatus: formData.insurancePriorAuth || 'No',
                        } : undefined,
                        currentHousing: formData.currentHousing || undefined,
                        criminalJusticeSupervision: formData.criminalJusticeSupervision !== '' ? formData.criminalJusticeSupervision === 'yes' : undefined,
                        supervisionType: formData.supervisionType || undefined,
                        employmentStatus: formData.employmentStatus || undefined,
                        coOccurringDiagnosis: formData.coOccurringDiagnosis !== '' ? formData.coOccurringDiagnosis === 'yes' : undefined,
                        emergencyContactName: formData.emergencyContactName || undefined,
                        emergencyContactPhone: formData.emergencyContactPhone || undefined,
                        emergencyContactRelationship: formData.emergencyContactRelationship || undefined,
                        gender: formData.gender,
                        genderPreference: formData.housePref || undefined,
                        accessibilityNeeds: formData.accessibilityNeeds || undefined,
                        references: formData.references.filter(r => r.name.trim()),
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

    const ThreeStateRadio = ({
        label,
        value,
        onChange,
        optional = false,
    }: {
        label: string;
        value: ThreeState;
        onChange: (v: ThreeState) => void;
        optional?: boolean;
    }) => (
        <div>
            <label className={labelClass}>
                {label}{' '}
                {optional && <span className="text-slate-400 font-normal">(optional)</span>}
            </label>
            <div className="flex gap-3">
                {(['yes', 'no'] as const).map(opt => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(value === opt ? '' : opt)}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            value === opt
                                ? opt === 'yes'
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'bg-slate-700 border-slate-700 text-white'
                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        {opt === 'yes' ? 'Yes' : 'No'}
                    </button>
                ))}
            </div>
        </div>
    );

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
                            <input type="text" value={formData.applicantName}
                                onChange={e => set('applicantName', e.target.value)}
                                className={inputClass} placeholder="Jane Smith" />
                        </div>
                        <div>
                            <label className={labelClass}>Email Address</label>
                            <input type="email" value={formData.applicantEmail}
                                onChange={e => set('applicantEmail', e.target.value)}
                                className={inputClass} placeholder="jane@example.com" />
                        </div>
                        <div>
                            <label className={labelClass}>Phone Number</label>
                            <input type="tel" value={formData.phone}
                                onChange={e => set('phone', e.target.value)}
                                className={inputClass} placeholder="(555) 123-4567" />
                        </div>
                        <div>
                            <label className={labelClass}>
                                ZIP Code <span className="text-slate-400 font-normal">(used to match nearby homes)</span>
                            </label>
                            <input type="text" value={formData.zipCode}
                                onChange={e => set('zipCode', e.target.value)}
                                className={inputClass} placeholder="63101" maxLength={10} />
                        </div>
                        <div>
                            <label className={labelClass}>
                                Date of Birth <span className="text-slate-400 font-normal">(optional — used for grant eligibility)</span>
                            </label>
                            <input type="date" value={formData.dateOfBirth}
                                onChange={e => set('dateOfBirth', e.target.value)}
                                className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>
                                Race / Ethnicity <span className="text-slate-400 font-normal">(optional — required for SAMHSA GPRA reporting)</span>
                            </label>
                            <select value={formData.raceEthnicity}
                                onChange={e => set('raceEthnicity', e.target.value)}
                                className={inputClass}>
                                <option value="">Prefer not to answer / select...</option>
                                {RACE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button className={nextBtnClass}
                                disabled={!formData.applicantName.trim() || !formData.applicantEmail.trim() || !formData.zipCode.trim()}
                                onClick={() => setStep(2)}>
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
                                Sobriety / Recovery Date <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <input type="date" value={formData.sobrietyDate}
                                onChange={e => set('sobrietyDate', e.target.value)}
                                className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Primary Substance</label>
                            <select value={formData.primarySubstance}
                                onChange={e => set('primarySubstance', e.target.value)}
                                className={inputClass}>
                                <option value="">Select primary substance...</option>
                                {SUBSTANCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>
                                Days Used in Past 30 Days <span className="text-slate-400 font-normal">(0 = none, optional)</span>
                            </label>
                            <input type="number" min={0} max={30}
                                value={formData.daysUsedPast30 === '' ? '' : formData.daysUsedPast30}
                                onChange={e => set('daysUsedPast30', e.target.value === '' ? '' : Math.min(30, Math.max(0, parseInt(e.target.value) || 0)))}
                                className={inputClass} placeholder="0–30" />
                        </div>
                        <ThreeStateRadio
                            label="Currently receiving Medication-Assisted Treatment (MAT)?"
                            value={formData.matStatus}
                            onChange={v => set('matStatus', v)}
                            optional
                        />
                        {formData.matStatus === 'yes' && (
                            <div>
                                <label className={labelClass}>MAT Medication</label>
                                <input type="text" value={formData.matMedication}
                                    onChange={e => set('matMedication', e.target.value)}
                                    className={inputClass}
                                    placeholder="e.g. Suboxone, Vivitrol, Methadone" />
                            </div>
                        )}
                        <ThreeStateRadio
                            label="History of injection drug use?"
                            value={formData.injectionDrugUse}
                            onChange={v => set('injectionDrugUse', v)}
                            optional
                        />
                        <div>
                            <label className={labelClass}>Recovery Goals</label>
                            <textarea value={formData.goals}
                                onChange={e => set('goals', e.target.value)}
                                className={inputClass} rows={4}
                                placeholder="What would you like to achieve in your recovery journey?" />
                        </div>
                        <div>
                            <label className={labelClass}>
                                Anything else about your substance history? <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <textarea value={formData.substanceHistory}
                                onChange={e => set('substanceHistory', e.target.value)}
                                className={inputClass} rows={3}
                                placeholder="Any additional context you'd like to share..." />
                        </div>
                        <div className="flex justify-between pt-4">
                            <button className={backBtnClass} onClick={() => setStep(1)}>Back</button>
                            <button className={nextBtnClass}
                                disabled={!formData.primarySubstance || !formData.goals.trim()}
                                onClick={() => setStep(3)}>
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* ---- Step 3: Funding & Insurance (NEW) ---- */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div>
                            <label className={labelClass}>
                                Funding Source(s) <span className="text-slate-400 font-normal">(select all that apply)</span>
                            </label>
                            <p className="text-xs text-slate-400 mb-3">
                                This helps us match you with homes that accept your coverage and identify grant eligibility.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {FUNDING_OPTIONS.map(option => {
                                    const selected = formData.fundingSources.includes(option);
                                    return (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => toggleFundingSource(option)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-left transition-colors ${
                                                selected
                                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                                                selected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                                            }`}>
                                                {selected && (
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </span>
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Conditional insurance fields */}
                        {showInsurance && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
                                <h3 className="text-sm font-semibold text-blue-900">Insurance Details</h3>
                                <p className="text-xs text-blue-700">
                                    Providing insurance details helps operators verify coverage and begin pre-authorization faster.
                                </p>
                                <div>
                                    <label className={labelClass}>Insurance Carrier / Plan Name</label>
                                    <input type="text" value={formData.insuranceCarrier}
                                        onChange={e => set('insuranceCarrier', e.target.value)}
                                        className={inputClass} placeholder="e.g. MO HealthNet, BlueCross" />
                                </div>
                                <div>
                                    <label className={labelClass}>Member / Subscriber ID</label>
                                    <input type="text" value={formData.insuranceMemberId}
                                        onChange={e => set('insuranceMemberId', e.target.value)}
                                        className={inputClass} placeholder="Member ID from your insurance card" />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        Group Number <span className="text-slate-400 font-normal">(optional)</span>
                                    </label>
                                    <input type="text" value={formData.insuranceGroupNumber}
                                        onChange={e => set('insuranceGroupNumber', e.target.value)}
                                        className={inputClass} placeholder="Group or plan number" />
                                </div>
                                <div>
                                    <label className={labelClass}>Prior Authorization Status</label>
                                    <select value={formData.insurancePriorAuth}
                                        onChange={e => set('insurancePriorAuth', e.target.value as BedFormData['insurancePriorAuth'])}
                                        className={inputClass}>
                                        <option value="">Select status...</option>
                                        <option value="Yes">Yes — already approved</option>
                                        <option value="In progress">In progress</option>
                                        <option value="No">No / not started</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-2">
                            <button className={backBtnClass} onClick={() => setStep(2)}>Back</button>
                            <button className={nextBtnClass}
                                disabled={formData.fundingSources.length === 0}
                                onClick={() => setStep(4)}>
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* ---- Step 4: Housing & Background (NEW) ---- */}
                {step === 4 && (
                    <div className="space-y-5">
                        <div>
                            <label className={labelClass}>Current Housing Situation</label>
                            <select value={formData.currentHousing}
                                onChange={e => set('currentHousing', e.target.value)}
                                className={inputClass}>
                                <option value="">Select current situation...</option>
                                {HOUSING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Current Employment Status</label>
                            <select value={formData.employmentStatus}
                                onChange={e => set('employmentStatus', e.target.value)}
                                className={inputClass}>
                                <option value="">Select employment status...</option>
                                {EMPLOYMENT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <ThreeStateRadio
                            label="Currently under criminal justice supervision (probation / parole / drug court)?"
                            value={formData.criminalJusticeSupervision}
                            onChange={v => set('criminalJusticeSupervision', v)}
                            optional
                        />
                        {formData.criminalJusticeSupervision === 'yes' && (
                            <div>
                                <label className={labelClass}>
                                    Type of supervision <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <input type="text" value={formData.supervisionType}
                                    onChange={e => set('supervisionType', e.target.value)}
                                    className={inputClass}
                                    placeholder="e.g. Probation, Drug Court, Parole" />
                            </div>
                        )}
                        <ThreeStateRadio
                            label="Co-occurring mental health diagnosis?"
                            value={formData.coOccurringDiagnosis}
                            onChange={v => set('coOccurringDiagnosis', v)}
                            optional
                        />

                        {/* Emergency Contact */}
                        <div className="border-t border-slate-100 pt-5">
                            <h3 className="text-sm font-semibold text-slate-700 mb-4">Emergency Contact</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>Contact Name</label>
                                    <input type="text" value={formData.emergencyContactName}
                                        onChange={e => set('emergencyContactName', e.target.value)}
                                        className={inputClass} placeholder="Full name" />
                                </div>
                                <div>
                                    <label className={labelClass}>Contact Phone</label>
                                    <input type="tel" value={formData.emergencyContactPhone}
                                        onChange={e => set('emergencyContactPhone', e.target.value)}
                                        className={inputClass} placeholder="(555) 000-0000" />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        Relationship <span className="text-slate-400 font-normal">(optional)</span>
                                    </label>
                                    <input type="text" value={formData.emergencyContactRelationship}
                                        onChange={e => set('emergencyContactRelationship', e.target.value)}
                                        className={inputClass} placeholder="e.g. Parent, Sibling, Sponsor" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <button className={backBtnClass} onClick={() => setStep(3)}>Back</button>
                            <button className={nextBtnClass}
                                disabled={!formData.currentHousing || !formData.emergencyContactName.trim() || !formData.emergencyContactPhone.trim()}
                                onClick={() => setStep(5)}>
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* ---- Step 5: Preferences & References ---- */}
                {step === 5 && (
                    <div className="space-y-5">
                        <div>
                            <label className={labelClass}>Your Gender</label>
                            <select value={formData.gender}
                                onChange={e => set('gender', e.target.value as Gender)}
                                className={inputClass}>
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Non-binary">Non-binary</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>House Gender Preference</label>
                            <select value={formData.housePref}
                                onChange={e => set('housePref', e.target.value as HouseGenderPref)}
                                className={inputClass}>
                                <option value="">Select preference...</option>
                                <option value="Men's">Men&apos;s House</option>
                                <option value="Women's">Women&apos;s House</option>
                                <option value="Co-ed">Co-ed House</option>
                                <option value="No preference">No preference</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>
                                Accessibility Needs <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <textarea value={formData.accessibilityNeeds}
                                onChange={e => set('accessibilityNeeds', e.target.value)}
                                className={inputClass} rows={3}
                                placeholder="Describe any accessibility requirements or accommodations needed..." />
                        </div>

                        {/* References */}
                        <div className="border-t border-slate-100 pt-5">
                            <h3 className="text-sm font-semibold text-slate-700 mb-1">References</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Please provide 1–2 personal or professional references who can speak to your character
                                and commitment to recovery.
                            </p>
                            <div className="space-y-4">
                                {formData.references.map((ref, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-slate-700">Reference {idx + 1}</h4>
                                            {idx > 0 && (
                                                <button type="button" onClick={() => removeReference(idx)}
                                                    className="text-xs text-red-500 hover:text-red-700">
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <div>
                                            <label className={labelClass}>Full Name</label>
                                            <input type="text" value={ref.name}
                                                onChange={e => setRef(idx, 'name', e.target.value)}
                                                className={inputClass} placeholder="Reference name" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Phone Number</label>
                                            <input type="tel" value={ref.phone}
                                                onChange={e => setRef(idx, 'phone', e.target.value)}
                                                className={inputClass} placeholder="(555) 000-0000" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Relationship</label>
                                            <input type="text" value={ref.relationship}
                                                onChange={e => setRef(idx, 'relationship', e.target.value)}
                                                className={inputClass} placeholder="e.g. Sponsor, Family, Counselor" />
                                        </div>
                                    </div>
                                ))}
                                {formData.references.length < 2 && (
                                    <button type="button" onClick={addReference}
                                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                                        <span className="text-lg leading-none">+</span> Add another reference
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <button className={backBtnClass} onClick={() => setStep(4)}>Back</button>
                            <button className={nextBtnClass}
                                disabled={
                                    !formData.gender || !formData.housePref ||
                                    !formData.references[0]?.name.trim() ||
                                    !formData.references[0]?.phone.trim() ||
                                    !formData.references[0]?.relationship.trim()
                                }
                                onClick={() => setStep(6)}>
                                Review Application
                            </button>
                        </div>
                    </div>
                )}

                {/* ---- Step 6: Review & Submit ---- */}
                {step === 6 && (
                    <div className="space-y-5">
                        {/* Personal Info */}
                        <ReviewCard title="Personal Info">
                            <ReviewGrid>
                                <ReviewItem label="Name" value={formData.applicantName} />
                                <ReviewItem label="Email" value={formData.applicantEmail} />
                                <ReviewItem label="Phone" value={formData.phone || '—'} />
                                <ReviewItem label="ZIP Code" value={formData.zipCode} />
                                {formData.dateOfBirth && <ReviewItem label="Date of Birth" value={formData.dateOfBirth} />}
                                {formData.raceEthnicity && <ReviewItem label="Race / Ethnicity" value={formData.raceEthnicity} />}
                            </ReviewGrid>
                        </ReviewCard>

                        {/* Recovery Profile */}
                        <ReviewCard title="Recovery Profile">
                            <dl className="space-y-2 text-sm">
                                {formData.sobrietyDate && <ReviewItem label="Sobriety Date" value={formData.sobrietyDate} />}
                                {formData.primarySubstance && <ReviewItem label="Primary Substance" value={formData.primarySubstance} />}
                                {formData.daysUsedPast30 !== '' && <ReviewItem label="Days Used (Past 30)" value={String(formData.daysUsedPast30)} />}
                                {formData.matStatus && <ReviewItem label="On MAT" value={formData.matStatus === 'yes' ? 'Yes' : 'No'} />}
                                {formData.matMedication && <ReviewItem label="MAT Medication" value={formData.matMedication} />}
                                {formData.injectionDrugUse && <ReviewItem label="Injection Drug Use" value={formData.injectionDrugUse === 'yes' ? 'Yes' : 'No'} />}
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Recovery Goals</dt>
                                    <dd className="mt-0.5 text-slate-900 whitespace-pre-wrap">{formData.goals}</dd>
                                </div>
                            </dl>
                        </ReviewCard>

                        {/* Funding */}
                        <ReviewCard title="Funding & Insurance">
                            <dl className="space-y-2 text-sm">
                                <div>
                                    <dt className="text-xs text-slate-400 uppercase tracking-wide mb-1">Funding Sources</dt>
                                    <dd className="flex flex-wrap gap-1.5">
                                        {formData.fundingSources.map(s => (
                                            <span key={s} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs rounded-md">{s}</span>
                                        ))}
                                    </dd>
                                </div>
                                {showInsurance && formData.insuranceCarrier && (
                                    <>
                                        <ReviewItem label="Carrier" value={formData.insuranceCarrier} />
                                        {formData.insuranceMemberId && <ReviewItem label="Member ID" value={formData.insuranceMemberId} />}
                                        {formData.insurancePriorAuth && <ReviewItem label="Prior Auth" value={formData.insurancePriorAuth} />}
                                    </>
                                )}
                            </dl>
                        </ReviewCard>

                        {/* Housing & Background */}
                        <ReviewCard title="Housing & Background">
                            <dl className="space-y-2 text-sm">
                                {formData.currentHousing && <ReviewItem label="Current Housing" value={formData.currentHousing} />}
                                {formData.employmentStatus && <ReviewItem label="Employment" value={formData.employmentStatus} />}
                                {formData.criminalJusticeSupervision && <ReviewItem label="CJ Supervision" value={formData.criminalJusticeSupervision === 'yes' ? 'Yes' : 'No'} />}
                                {formData.coOccurringDiagnosis && <ReviewItem label="Co-Occurring Diagnosis" value={formData.coOccurringDiagnosis === 'yes' ? 'Yes' : 'No'} />}
                                {formData.emergencyContactName && (
                                    <ReviewItem label="Emergency Contact" value={`${formData.emergencyContactName} · ${formData.emergencyContactPhone}${formData.emergencyContactRelationship ? ` (${formData.emergencyContactRelationship})` : ''}`} />
                                )}
                            </dl>
                        </ReviewCard>

                        {/* Preferences */}
                        <ReviewCard title="Preferences">
                            <ReviewGrid>
                                <ReviewItem label="Gender" value={formData.gender} />
                                <ReviewItem label="House Preference" value={formData.housePref} />
                                {formData.accessibilityNeeds && (
                                    <div className="col-span-2">
                                        <ReviewItem label="Accessibility Needs" value={formData.accessibilityNeeds} />
                                    </div>
                                )}
                            </ReviewGrid>
                        </ReviewCard>

                        {/* References */}
                        <ReviewCard title="References">
                            <div className="space-y-2 text-sm">
                                {formData.references.filter(r => r.name.trim()).map((ref, idx) => (
                                    <div key={idx}>
                                        <p className="font-medium text-slate-800">{ref.name}</p>
                                        <p className="text-slate-500">{ref.relationship} &middot; {ref.phone}</p>
                                    </div>
                                ))}
                            </div>
                        </ReviewCard>

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
                            <button className={backBtnClass} onClick={() => setStep(5)}>Back</button>
                            <button className={submitBtnClass} onClick={handleSubmit} disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ---- Review helpers ----

function ReviewCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">{title}</h3>
            {children}
        </div>
    );
}

function ReviewGrid({ children }: { children: React.ReactNode }) {
    return <dl className="grid grid-cols-2 gap-3 text-sm">{children}</dl>;
}

function ReviewItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs text-slate-400 uppercase tracking-wide">{label}</dt>
            <dd className="mt-0.5 text-slate-900 break-words">{value || '—'}</dd>
        </div>
    );
}
