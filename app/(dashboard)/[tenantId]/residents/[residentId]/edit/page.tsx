'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { authService } from '@/features/auth/services/authService';
import type { Resident } from '@/features/residents/types/resident.types';

interface EditResidentPageProps {
  params: Promise<{ tenantId: string; residentId: string }>;
}

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  primarySubstance: string;
  secondarySubstances: string;
  treatmentHistory: string;
  height: string;
  weight: string;
  bloodType: string;
  allergies: string;
  diagnosisCodes: string;
  employer: string;
  jobTitle: string;
  workSchedule: string;
  workPhone: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
  notes: string;
}

const EMPTY: FormData = {
  firstName: '', lastName: '', dateOfBirth: '', gender: 'prefer_not_to_say', email: '', phone: '',
  primarySubstance: '', secondarySubstances: '', treatmentHistory: '',
  height: '', weight: '', bloodType: '', allergies: '', diagnosisCodes: '',
  employer: '', jobTitle: '', workSchedule: '', workPhone: '',
  emergencyName: '', emergencyPhone: '', emergencyRelationship: '',
  notes: '',
};

function toFormData(r: Resident): FormData {
  return {
    firstName: r.firstName ?? '',
    lastName: r.lastName ?? '',
    dateOfBirth: r.dateOfBirth ? new Date(r.dateOfBirth).toISOString().split('T')[0] : '',
    gender: r.gender ?? 'prefer_not_to_say',
    email: r.email ?? '',
    phone: r.phone ?? '',
    primarySubstance: r.primarySubstance ?? '',
    secondarySubstances: r.secondarySubstances?.join(', ') ?? '',
    treatmentHistory: r.treatmentHistory ?? '',
    height: r.height ?? '',
    weight: r.weight ?? '',
    bloodType: r.bloodType ?? '',
    allergies: r.allergies?.join(', ') ?? '',
    diagnosisCodes: r.diagnosisCodes?.join(', ') ?? '',
    employer: r.employer ?? '',
    jobTitle: r.jobTitle ?? '',
    workSchedule: r.workSchedule ?? '',
    workPhone: r.workPhone ?? '',
    emergencyName: r.emergencyContact?.name ?? '',
    emergencyPhone: r.emergencyContact?.phone ?? '',
    emergencyRelationship: r.emergencyContact?.relationship ?? '',
    notes: r.notes ?? '',
  };
}

function Field({
  label, name, value, onChange, type = 'text', required = false,
  placeholder, as, rows, options, fullWidth = false,
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
  fullWidth?: boolean;
}) {
  const cls = 'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
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

function SectionFields({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export default function EditResidentPage({ params }: EditResidentPageProps) {
  const { tenantId, residentId } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = await authService.getIdToken();
        const res = await fetch(`/api/tenants/${tenantId}/residents/${residentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load resident');
        const data = await res.json();
        const r: Resident = data.resident ?? data;
        setForm(toFormData(r));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resident');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tenantId, residentId]);

  function update(name: keyof FormData, val: string) {
    setForm((prev) => ({ ...prev, [name]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
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
        treatmentHistory: form.treatmentHistory,
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
        notes: form.notes,
      };

      const res = await fetch(`/api/tenants/${tenantId}/residents/${residentId}`, {
        method: 'PATCH',
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

      router.push(`/${tenantId}/residents/${residentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non_binary', label: 'Non-binary' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/${tenantId}/residents/${residentId}`} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Edit Resident</h1>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Identity */}
        <SectionFields title="Personal Information">
          <Field label="First Name" name="firstName" value={form.firstName} onChange={update} required />
          <Field label="Last Name" name="lastName" value={form.lastName} onChange={update} required />
          <Field label="Date of Birth" name="dateOfBirth" value={form.dateOfBirth} onChange={update} type="date" required />
          <Field label="Gender" name="gender" value={form.gender} onChange={update} as="select" options={genderOptions} />
          <Field label="Email" name="email" value={form.email} onChange={update} type="email" required />
          <Field label="Phone" name="phone" value={form.phone} onChange={update} type="tel" required />
        </SectionFields>

        {/* Clinical */}
        <SectionFields title="Clinical Information">
          <Field label="Primary Substance" name="primarySubstance" value={form.primarySubstance} onChange={update} required />
          <Field label="Secondary Substances (comma-separated)" name="secondarySubstances" value={form.secondarySubstances} onChange={update} />
          <Field label="Treatment History" name="treatmentHistory" value={form.treatmentHistory} onChange={update} as="textarea" rows={3} fullWidth />
          <Field label="Height" name="height" value={form.height} onChange={update} placeholder='5&apos;10"' />
          <Field label="Weight" name="weight" value={form.weight} onChange={update} placeholder="165 lbs" />
          <Field label="Blood Type" name="bloodType" value={form.bloodType} onChange={update} placeholder="A+" />
          <Field label="Allergies (comma-separated)" name="allergies" value={form.allergies} onChange={update} />
          <Field label="Diagnosis Codes (comma-separated)" name="diagnosisCodes" value={form.diagnosisCodes} onChange={update} />
        </SectionFields>

        {/* Employment */}
        <SectionFields title="Employment">
          <Field label="Employer" name="employer" value={form.employer} onChange={update} />
          <Field label="Job Title" name="jobTitle" value={form.jobTitle} onChange={update} />
          <Field label="Work Schedule" name="workSchedule" value={form.workSchedule} onChange={update} />
          <Field label="Work Phone" name="workPhone" value={form.workPhone} onChange={update} type="tel" />
        </SectionFields>

        {/* Emergency contact */}
        <SectionFields title="Emergency Contact">
          <Field label="Name" name="emergencyName" value={form.emergencyName} onChange={update} required />
          <Field label="Relationship" name="emergencyRelationship" value={form.emergencyRelationship} onChange={update} required />
          <Field label="Phone" name="emergencyPhone" value={form.emergencyPhone} onChange={update} type="tel" required />
        </SectionFields>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              rows={4}
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Any additional notes about this resident..."
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pb-8">
          <Link href={`/${tenantId}/residents/${residentId}`}>
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
