'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import type { BaseUserProfile, CreateFacilityApplicationInput } from '@/features/applications/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClinicalForm {
  primarySubstance: string;
  substanceHistory: string;
  sobrietyDate: string;
  matStatus: boolean | null;
  matMedication: string;
  injectionDrugUse: boolean | null;
  fundingSource: string;
  insuranceCarrier: string;
}

const EMPTY_CLINICAL: ClinicalForm = {
  primarySubstance: '',
  substanceHistory: '',
  sobrietyDate: '',
  matStatus: null,
  matMedication: '',
  injectionDrugUse: null,
  fundingSource: '',
  insuranceCarrier: '',
};

const FUNDING_OPTIONS = [
  'Self-Pay',
  'Private Insurance',
  'Medicaid',
  'Medicare',
  'SAMHSA / SOR Grant',
  'State Block Grant',
  'Other',
];

const SUBSTANCE_OPTIONS = [
  'Alcohol',
  'Opioids (heroin/fentanyl)',
  'Prescription Opioids',
  'Methamphetamine',
  'Cocaine / Crack',
  'Benzodiazepines',
  'Cannabis',
  'Multiple / Polysubstance',
  'Other',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const steps = ['Identity', 'Clinical', 'Review'];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, idx) => {
        const step = idx + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                style={{
                  background: done
                    ? 'rgba(16,185,129,0.25)'
                    : active
                    ? 'rgba(8,145,178,0.35)'
                    : 'rgba(255,255,255,0.06)',
                  border: `2px solid ${done ? '#10b981' : active ? '#0891B2' : 'rgba(255,255,255,0.1)'}`,
                  color: done ? '#10b981' : active ? '#67E8F9' : 'rgba(255,255,255,0.3)',
                }}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className="text-xs font-bold hidden sm:block"
                style={{ color: active ? '#67E8F9' : done ? '#10b981' : 'rgba(255,255,255,0.3)' }}
              >
                {label}
              </span>
            </div>
            {idx < total - 1 && (
              <div
                className="flex-1 h-px"
                style={{ background: done ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </span>
      <span className="text-sm font-semibold text-white">{value || '—'}</span>
    </div>
  );
}

function ToggleButton({
  label,
  value,
  selected,
  onSelect,
  accent = 'cyan',
}: {
  label: string;
  value: boolean;
  selected: boolean;
  onSelect: () => void;
  accent?: 'cyan' | 'emerald';
}) {
  const color = accent === 'emerald' ? '#10b981' : '#0891B2';
  const bg = accent === 'emerald' ? 'rgba(16,185,129,0.15)' : 'rgba(8,145,178,0.15)';
  const border = accent === 'emerald' ? 'rgba(16,185,129,0.4)' : 'rgba(8,145,178,0.4)';
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
      style={{
        background: selected ? bg : 'rgba(255,255,255,0.04)',
        border: `1px solid ${selected ? border : 'rgba(255,255,255,0.08)'}`,
        color: selected ? color : 'rgba(255,255,255,0.4)',
      }}
    >
      {label}
    </button>
  );
}

// ─── Step 1: Identity Confirmation ───────────────────────────────────────────

function Step1Identity({
  profile,
  onNext,
}: {
  profile: BaseUserProfile;
  onNext: () => void;
}) {
  const dob = profile.dateOfBirth
    ? new Date(profile.dateOfBirth + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-black text-white">Confirm Your Identity</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Please verify your information before continuing.
        </p>
      </div>

      {/* Profile card */}
      <div
        className="rounded-2xl p-5 mb-3"
        style={{
          background: 'rgba(8,145,178,0.07)',
          border: '1px solid rgba(8,145,178,0.2)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4" style={{ color: '#67E8F9' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#67E8F9' }}>
            HVG Identity Profile
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ProfileRow label="First Name" value={profile.firstName} />
          <ProfileRow label="Last Name" value={profile.lastName} />
          <ProfileRow label="Date of Birth" value={dob} />
          <ProfileRow label="Phone" value={profile.phone} />
          <ProfileRow label="Emergency Contact" value={profile.emergencyContactName} />
          <ProfileRow label="Emergency Phone" value={profile.emergencyContactPhone} />
        </div>

        <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
          This information is pulled securely from your HVG Identity Profile.
        </p>
      </div>

      <button
        onClick={onNext}
        className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #0891B2, #0e7490)',
          color: 'white',
          boxShadow: '0 0 20px rgba(8,145,178,0.3)',
        }}
      >
        Looks correct — Continue →
      </button>
    </div>
  );
}

// ─── Step 2: Clinical & Facility Specifics ────────────────────────────────────

const inputClass =
  'w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all';
const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
};

function Step2Clinical({
  form,
  setForm,
  onBack,
  onNext,
}: {
  form: ClinicalForm;
  setForm: React.Dispatch<React.SetStateAction<ClinicalForm>>;
  onBack: () => void;
  onNext: () => void;
}) {
  const set = (field: keyof ClinicalForm, value: ClinicalForm[keyof ClinicalForm]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <h2 className="text-xl font-black text-white">Clinical & Funding Details</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          This helps us match you with the right facility and resources.
        </p>
      </div>

      <div className="space-y-5">
        {/* Primary Substance */}
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Primary Substance <span style={{ color: '#67E8F9' }}>*</span>
          </label>
          <select
            value={form.primarySubstance}
            onChange={(e) => set('primarySubstance', e.target.value)}
            required
            className={inputClass}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          >
            <option value="">Select substance</option>
            {SUBSTANCE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Substance History */}
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Substance Use History
          </label>
          <textarea
            value={form.substanceHistory}
            onChange={(e) => set('substanceHistory', e.target.value)}
            rows={3}
            placeholder="Briefly describe your history (optional)"
            className={inputClass}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>

        {/* Sobriety Date */}
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Sobriety / Clean Date
          </label>
          <input
            type="date"
            value={form.sobrietyDate}
            onChange={(e) => set('sobrietyDate', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className={inputClass}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>

        {/* MAT Status */}
        <div>
          <label className="block text-xs font-bold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Medication-Assisted Treatment (MAT)
          </label>
          <div className="flex gap-2">
            <ToggleButton label="Yes — currently on MAT" value={true} selected={form.matStatus === true} onSelect={() => set('matStatus', true)} />
            <ToggleButton label="No MAT" value={false} selected={form.matStatus === false} onSelect={() => set('matStatus', false)} />
          </div>
          {form.matStatus === true && (
            <input
              type="text"
              value={form.matMedication}
              onChange={(e) => set('matMedication', e.target.value)}
              placeholder="Medication name (e.g. Suboxone, Vivitrol)"
              className={`${inputClass} mt-2`}
              style={inputStyle}
            />
          )}
        </div>

        {/* Injection Drug Use */}
        <div>
          <label className="block text-xs font-bold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
            History of Injection Drug Use
          </label>
          <div className="flex gap-2">
            <ToggleButton label="Yes" value={true} selected={form.injectionDrugUse === true} onSelect={() => set('injectionDrugUse', true)} />
            <ToggleButton label="No" value={false} selected={form.injectionDrugUse === false} onSelect={() => set('injectionDrugUse', false)} />
          </div>
        </div>

        {/* Funding Source */}
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Primary Funding Source <span style={{ color: '#67E8F9' }}>*</span>
          </label>
          <select
            value={form.fundingSource}
            onChange={(e) => set('fundingSource', e.target.value)}
            required
            className={inputClass}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          >
            <option value="">Select funding source</option>
            {FUNDING_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Insurance Carrier — show if insurance selected */}
        {(form.fundingSource === 'Private Insurance' ||
          form.fundingSource === 'Medicaid' ||
          form.fundingSource === 'Medicare') && (
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Insurance Carrier
            </label>
            <input
              type="text"
              value={form.insuranceCarrier}
              onChange={(e) => set('insuranceCarrier', e.target.value)}
              placeholder="e.g. Aetna, BlueCross"
              className={inputClass}
              style={inputStyle}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-7">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          ← Back
        </button>
        <button
          type="submit"
          className="flex-[2] py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #0891B2, #0e7490)',
            color: 'white',
            boxShadow: '0 0 20px rgba(8,145,178,0.3)',
          }}
        >
          Review Application →
        </button>
      </div>
    </form>
  );
}

// ─── Step 3: Review & Submit ──────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value && value !== false) return null;
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <span className="text-xs font-bold shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <span className="text-sm font-semibold text-white text-right">{value}</span>
    </div>
  );
}

function Step3Review({
  profile,
  clinical,
  onBack,
  onSubmit,
  submitting,
  error,
}: {
  profile: BaseUserProfile;
  clinical: ClinicalForm;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const dob = profile.dateOfBirth
    ? new Date(profile.dateOfBirth + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-black text-white">Review Your Application</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Please review everything below before submitting.
        </p>
      </div>

      {/* Identity Section */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(103,232,249,0.7)' }}>
          Identity
        </p>
        <ReviewRow label="Full Name" value={`${profile.firstName} ${profile.lastName}`} />
        <ReviewRow label="Date of Birth" value={dob} />
        <ReviewRow label="Phone" value={profile.phone} />
        <ReviewRow label="Emergency Contact" value={`${profile.emergencyContactName} · ${profile.emergencyContactPhone}`} />
      </div>

      {/* Clinical Section */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(103,232,249,0.7)' }}>
          Clinical & Funding
        </p>
        <ReviewRow label="Primary Substance" value={clinical.primarySubstance} />
        <ReviewRow label="Sobriety Date" value={clinical.sobrietyDate || null} />
        <ReviewRow
          label="MAT Status"
          value={clinical.matStatus === true ? `Yes — ${clinical.matMedication || 'medication unspecified'}` : clinical.matStatus === false ? 'No' : null}
        />
        <ReviewRow
          label="Injection Drug Use"
          value={clinical.injectionDrugUse === true ? 'Yes' : clinical.injectionDrugUse === false ? 'No' : null}
        />
        <ReviewRow label="Funding Source" value={clinical.fundingSource} />
        <ReviewRow label="Insurance Carrier" value={clinical.insuranceCarrier || null} />
        {clinical.substanceHistory && (
          <div className="pt-2.5">
            <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Substance History</span>
            <p className="text-sm text-white mt-1">{clinical.substanceHistory}</p>
          </div>
        )}
      </div>

      {/* Submit error */}
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm mb-4"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5',
          }}
        >
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="flex-[2] py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #059669, #10b981)',
            color: 'white',
            boxShadow: '0 0 20px rgba(16,185,129,0.25)',
          }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting…
            </span>
          ) : (
            'Submit Application ✓'
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Success ─────────────────────────────────────────────────────────

function Step4Success({ firstName }: { firstName: string }) {
  return (
    <div className="flex flex-col items-center text-center py-4">
      {/* Animated check */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{
          background: 'rgba(16,185,129,0.15)',
          border: '2px solid rgba(16,185,129,0.4)',
          boxShadow: '0 0 40px rgba(16,185,129,0.2)',
        }}
      >
        <svg
          className="w-10 h-10"
          style={{ color: '#10b981' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <p
        className="text-xs font-black uppercase tracking-widest mb-2"
        style={{ color: 'rgba(16,185,129,0.7)' }}
      >
        Application Submitted
      </p>
      <h2 className="text-2xl font-black text-white mb-3">
        You&apos;re in the queue, {firstName}!
      </h2>
      <p className="text-sm leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Your application has been submitted successfully.
      </p>
      <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
        The facility operators have been notified and will review your application. You can expect to hear back within 1–3 business days.
      </p>

      {/* Reference badge */}
      <div
        className="rounded-xl px-5 py-3 mb-8"
        style={{
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
        }}
      >
        <p className="text-xs" style={{ color: 'rgba(16,185,129,0.8)' }}>
          Status: <strong>Pending Review</strong> — we&apos;ll reach out via the email you registered with.
        </p>
      </div>

      <a
        href="/"
        className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all active:scale-[0.98] text-center block"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.6)',
        }}
      >
        Return to Home
      </a>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

interface WizardPageProps {
  params: Promise<{ tenantId: string }>;
}

export default function ApplicationWizardPage({ params }: WizardPageProps) {
  const { tenantId } = use(params);
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [uid, setUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<BaseUserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [clinical, setClinical] = useState<ClinicalForm>(EMPTY_CLINICAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUid(firebaseUser.uid);
      } else {
        router.push('/apply/register');
      }
      setAuthLoading(false);
    });
    return unsub;
  }, [router]);

  // Fetch BaseUserProfile
  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          setProfile(snap.data() as BaseUserProfile);
        } else {
          // Profile not yet created — route to profile capture
          router.push('/apply/profile');
        }
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [uid, router]);

  const handleSubmit = useCallback(async () => {
    if (!profile || !uid) return;
    setSubmitting(true);
    setSubmitError(null);

    const now = new Date().toISOString();
    const payload: CreateFacilityApplicationInput = {
      tenantId,
      applicantId: uid,
      applicantName: `${profile.firstName} ${profile.lastName}`,
      applicantEmail: profile.email ?? '',
      applicantPhone: profile.phone,
      status: 'pending_triage',
      substanceHistory: clinical.substanceHistory || undefined,
      primarySubstance: clinical.primarySubstance || undefined,
      sobrietyDate: clinical.sobrietyDate || undefined,
      matStatus: clinical.matStatus ?? undefined,
      matMedication: clinical.matMedication || undefined,
      injectionDrugUse: clinical.injectionDrugUse ?? undefined,
      fundingSource: clinical.fundingSource || undefined,
      insuranceCarrier: clinical.insuranceCarrier || undefined,
      submittedAt: now,
    };

    try {
      await addDoc(collection(db, 'tenants', tenantId, 'applications'), payload);
      setStep(4);
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [uid, tenantId, profile, clinical, setStep]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="w-full max-w-lg">
      {/* Facility context banner */}
      <div className="mb-6 text-center">
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Facility Application
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Tenant ID: {tenantId}
        </p>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl p-7"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {step < 4 && <StepIndicator current={step} total={3} />}

        {step === 1 && (
          <Step1Identity
            profile={profile}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2Clinical
            form={clinical}
            setForm={setClinical}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <Step3Review
            profile={profile}
            clinical={clinical}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={submitError}
          />
        )}

        {step === 4 && <Step4Success firstName={profile.firstName} />}
      </div>
    </div>
  );
}
