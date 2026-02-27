'use client';

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { authService } from '@/features/auth/services/authService';

interface NewResidentPageProps {
  params: Promise<{ tenantId: string }>;
}

type Step = 'identity' | 'clinical' | 'employment' | 'emergency';
const STEPS: { id: Step; label: string }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'clinical', label: 'Clinical' },
  { id: 'employment', label: 'Employment' },
  { id: 'emergency', label: 'Emergency Contact' },
];

interface FormData {
  // Identity
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  // Clinical
  primarySubstance: string;
  secondarySubstances: string;
  treatmentHistory: string;
  height: string;
  weight: string;
  bloodType: string;
  allergies: string;
  diagnosisCodes: string;
  // Employment
  employer: string;
  jobTitle: string;
  workSchedule: string;
  workPhone: string;
  // Emergency contact
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
}

const INITIAL: FormData = {
  firstName: '', lastName: '', dateOfBirth: '', gender: 'prefer_not_to_say', email: '', phone: '',
  primarySubstance: '', secondarySubstances: '', treatmentHistory: '',
  height: '', weight: '', bloodType: '', allergies: '', diagnosisCodes: '',
  employer: '', jobTitle: '', workSchedule: '', workPhone: '',
  emergencyName: '', emergencyPhone: '', emergencyRelationship: '',
};

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label, name, value, onChange, type = 'text', required = false,
  placeholder, as, rows, options,
}: {
  label: string;
  name: keyof FormData;
  value: string;
  onChange: (name: keyof FormData, val: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  as?: 'textarea' | 'select';
  rows?: number;
  options?: { value: string; label: string }[];
}) {
  const cls = 'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500';
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {as === 'textarea' ? (
        <textarea
          className={cls}
          rows={rows ?? 3}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      ) : as === 'select' ? (
        <select className={cls} value={value} onChange={(e) => onChange(name, e.target.value)} required={required}>
          {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input
          type={type}
          className={cls}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      )}
    </div>
  );
}

function StepIndicator({ steps, current }: { steps: typeof STEPS; current: Step }) {
  const currentIdx = steps.findIndex((s) => s.id === current);
  return (
    <nav className="flex items-center space-x-4 mb-8">
      {steps.map((step, idx) => {
        const done = idx < currentIdx;
        const active = step.id === current;
        return (
          <React.Fragment key={step.id}>
            {idx > 0 && (
              <div className={`flex-1 h-0.5 ${done ? 'bg-cyan-600' : 'bg-gray-200'}`} />
            )}
            <div className="flex items-center space-x-2 shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  active
                    ? 'bg-cyan-600 text-white'
                    : done
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span className={`text-sm font-medium ${active ? 'text-cyan-600' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default function NewResidentPage({ params }: NewResidentPageProps) {
  const { tenantId } = use(params);
  const router = useRouter();
  const [step, setStep] = useState<Step>('identity');
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(name: keyof FormData, val: string) {
    setForm((prev) => ({ ...prev, [name]: val }));
  }

  function next() {
    const order: Step[] = ['identity', 'clinical', 'employment', 'emergency'];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  }

  function back() {
    const order: Step[] = ['identity', 'clinical', 'employment', 'emergency'];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const token = await authService.getIdToken();
      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        email: form.email,
        phone: form.phone,
        primarySubstance: form.primarySubstance,
        secondarySubstances: form.secondarySubstances ? form.secondarySubstances.split(',').map((s) => s.trim()).filter(Boolean) : [],
        treatmentHistory: form.treatmentHistory || '',
        height: form.height || undefined,
        weight: form.weight || undefined,
        bloodType: form.bloodType || undefined,
        allergies: form.allergies ? form.allergies.split(',').map((s) => s.trim()).filter(Boolean) : [],
        diagnosisCodes: form.diagnosisCodes ? form.diagnosisCodes.split(',').map((s) => s.trim()).filter(Boolean) : [],
        employer: form.employer || undefined,
        jobTitle: form.jobTitle || undefined,
        workSchedule: form.workSchedule || undefined,
        workPhone: form.workPhone || undefined,
        emergencyContact: {
          name: form.emergencyName,
          phone: form.emergencyPhone,
          relationship: form.emergencyRelationship,
        },
        notes: '',
      };

      const res = await fetch(`/api/tenants/${tenantId}/residents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed: ${res.status}`);
      }

      const data = await res.json();
      const newId = data.resident?.id ?? data.id;
      router.push(`/${tenantId}/residents/${newId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resident');
    } finally {
      setSubmitting(false);
    }
  }

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non_binary', label: 'Non-binary' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enroll New Resident</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Create a resident profile and enroll them in your program.
        </p>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{STEPS.find((s) => s.id === step)?.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'identity' && (
            <>
              <FieldGroup>
                <Field label="First Name" name="firstName" value={form.firstName} onChange={update} required placeholder="Jane" />
                <Field label="Last Name" name="lastName" value={form.lastName} onChange={update} required placeholder="Smith" />
              </FieldGroup>
              <FieldGroup>
                <Field label="Date of Birth" name="dateOfBirth" value={form.dateOfBirth} onChange={update} type="date" required />
                <Field label="Gender" name="gender" value={form.gender} onChange={update} as="select" options={genderOptions} />
              </FieldGroup>
              <FieldGroup>
                <Field label="Email" name="email" value={form.email} onChange={update} type="email" required placeholder="jane@example.com" />
                <Field label="Phone" name="phone" value={form.phone} onChange={update} type="tel" required placeholder="(555) 000-0000" />
              </FieldGroup>
            </>
          )}

          {step === 'clinical' && (
            <>
              <Field label="Primary Substance" name="primarySubstance" value={form.primarySubstance} onChange={update} required placeholder="e.g. Alcohol" />
              <Field label="Secondary Substances (comma-separated)" name="secondarySubstances" value={form.secondarySubstances} onChange={update} placeholder="e.g. Cocaine, Cannabis" />
              <Field label="Treatment History" name="treatmentHistory" value={form.treatmentHistory} onChange={update} as="textarea" rows={3} placeholder="Previous treatment programs, hospitalizations, etc." />
              <FieldGroup>
                <Field label="Height" name="height" value={form.height} onChange={update} placeholder='e.g. 5&apos;10"' />
                <Field label="Weight" name="weight" value={form.weight} onChange={update} placeholder="e.g. 165 lbs" />
              </FieldGroup>
              <FieldGroup>
                <Field label="Blood Type" name="bloodType" value={form.bloodType} onChange={update} placeholder="e.g. A+" />
                <Field label="Allergies (comma-separated)" name="allergies" value={form.allergies} onChange={update} placeholder="e.g. Penicillin, Latex" />
              </FieldGroup>
              <Field label="Diagnosis Codes (comma-separated)" name="diagnosisCodes" value={form.diagnosisCodes} onChange={update} placeholder="e.g. F10.20, F33.0" />
            </>
          )}

          {step === 'employment' && (
            <>
              <FieldGroup>
                <Field label="Employer" name="employer" value={form.employer} onChange={update} placeholder="Company name" />
                <Field label="Job Title" name="jobTitle" value={form.jobTitle} onChange={update} placeholder="e.g. Warehouse Associate" />
              </FieldGroup>
              <FieldGroup>
                <Field label="Work Schedule" name="workSchedule" value={form.workSchedule} onChange={update} placeholder="e.g. Mon-Fri 9am-5pm" />
                <Field label="Work Phone" name="workPhone" value={form.workPhone} onChange={update} type="tel" placeholder="(555) 000-0000" />
              </FieldGroup>
            </>
          )}

          {step === 'emergency' && (
            <>
              <Field label="Contact Name" name="emergencyName" value={form.emergencyName} onChange={update} required placeholder="Full name" />
              <FieldGroup>
                <Field label="Phone" name="emergencyPhone" value={form.emergencyPhone} onChange={update} type="tel" required placeholder="(555) 000-0000" />
                <Field label="Relationship" name="emergencyRelationship" value={form.emergencyRelationship} onChange={update} required placeholder="e.g. Mother, Spouse" />
              </FieldGroup>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={step === 'identity' ? () => router.back() : back}>
          {step === 'identity' ? 'Cancel' : 'Back'}
        </Button>
        {step !== 'emergency' ? (
          <Button onClick={next} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            Next
          </Button>
        ) : (
          <Button
            onClick={submit}
            disabled={submitting}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {submitting ? 'Enrolling...' : 'Enroll Resident'}
          </Button>
        )}
      </div>
    </div>
  );
}
