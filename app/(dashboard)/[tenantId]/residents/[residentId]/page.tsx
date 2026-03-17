'use client';

import React, { use, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { authService } from '@/features/auth/services/authService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { canWrite } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';
import type { Resident } from '@/features/residents/types/resident.types';
import type { Enrollment, EnrollmentStatus } from '@/features/enrollments/types/enrollment.types';

interface ResidentProfilePageProps {
  params: Promise<{ tenantId: string; residentId: string }>;
}

function statusBadgeVariant(status: EnrollmentStatus): 'success' | 'warning' | 'info' | 'default' {
  switch (status) {
    case 'active': return 'success';
    case 'waitlist': return 'warning';
    case 'graduated': return 'info';
    case 'discharged': return 'default';
  }
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString();
}

function calculateAge(dob: Date | string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function calculateSobrietyDays(startDate: Date | string | null): number | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-base text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start py-2 border-b border-white/5 last:border-0">
      <dt className="w-40 shrink-0 text-sm text-white/50">{label}</dt>
      <dd className="text-sm text-white/90 flex-1">{value ?? '—'}</dd>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3">
              <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-4 w-full bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 h-48 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function ResidentProfilePage({ params }: ResidentProfilePageProps) {
  const { tenantId, residentId } = use(params);
  const { user } = useAuth();
  const [resident, setResident] = useState<Resident | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkMessage, setLinkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const linkEmailRef = useRef<HTMLInputElement>(null);

  const userCanWrite = user?.role ? canWrite(user.role as UserRole) : false;

  useEffect(() => {
    async function load() {
      try {
        const token = await authService.getIdToken();
        const [residentRes, enrollmentRes] = await Promise.all([
          fetch(`/api/tenants/${tenantId}/residents/${residentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/tenants/${tenantId}/enrollments/${residentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!residentRes.ok) throw new Error('Resident not found');
        const residentData = await residentRes.json();
        setResident(residentData.resident ?? residentData);

        if (enrollmentRes.ok) {
          const enrollmentData = await enrollmentRes.json();
          setEnrollment(enrollmentData.enrollment ?? enrollmentData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resident');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tenantId, residentId]);

  async function handleLinkUser(e: React.FormEvent) {
    e.preventDefault();
    if (!linkEmail.trim()) return;
    setLinkLoading(true);
    setLinkMessage(null);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(
        `/api/tenants/${tenantId}/residents/${residentId}/link-user`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ email: linkEmail.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Link failed');
      setLinkMessage({ type: 'success', text: `Linked to app user (${linkEmail.trim()})` });
      setLinkEmail('');
      // Refresh resident data to show updated firebaseUid
      const refreshRes = await fetch(`/api/tenants/${tenantId}/residents/${residentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setResident(refreshData.resident ?? refreshData);
      }
    } catch (err) {
      setLinkMessage({ type: 'error', text: err instanceof Error ? err.message : 'Link failed' });
    } finally {
      setLinkLoading(false);
    }
  }

  if (loading) return <LoadingSkeleton />;

  if (error || !resident) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-700">{error ?? 'Resident not found'}</p>
        <Link href={`/${tenantId}/residents`}>
          <Button variant="outline" size="sm" className="mt-3">← Back to Residents</Button>
        </Link>
      </div>
    );
  }

  const sobrietyDays = calculateSobrietyDays(enrollment?.sobrietyStartDate ?? null);
  const age = calculateAge(resident.dateOfBirth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Link href={`/${tenantId}/residents`} className="text-white/50 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-white">
              {resident.firstName} {resident.lastName}
            </h1>
            {enrollment && (
              <Badge variant={statusBadgeVariant(enrollment.status)}>
                {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
              </Badge>
            )}
          </div>
          <p className="text-white/50 mt-1 text-sm">Age {age} · {resident.primarySubstance}</p>
        </div>
        <Link href={`/${tenantId}/residents/${residentId}/edit`}>
          <Button variant="outline" className="border-white/10 text-white/70 hover:bg-white/10 bg-transparent">Edit Profile</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity */}
          <Section title="Personal Information">
            <dl>
              <InfoRow label="Full Name" value={`${resident.firstName} ${resident.lastName}`} />
              <InfoRow label="Date of Birth" value={`${formatDate(resident.dateOfBirth)} (Age ${age})`} />
              <InfoRow label="Gender" value={resident.gender.replace('_', ' ')} />
              <InfoRow label="Email" value={<a href={`mailto:${resident.email}`} className="text-cyan-600 hover:underline">{resident.email}</a>} />
              <InfoRow label="Phone" value={<a href={`tel:${resident.phone}`} className="text-cyan-600 hover:underline">{resident.phone}</a>} />
            </dl>
          </Section>

          {/* Clinical */}
          <Section title="Clinical Information">
            <dl>
              <InfoRow label="Primary Substance" value={resident.primarySubstance} />
              <InfoRow label="Secondary Substances" value={resident.secondarySubstances?.join(', ') || '—'} />
              <InfoRow label="Treatment History" value={resident.treatmentHistory || '—'} />
              <InfoRow label="Height" value={resident.height} />
              <InfoRow label="Weight" value={resident.weight} />
              <InfoRow label="Blood Type" value={resident.bloodType} />
              <InfoRow label="Allergies" value={resident.allergies?.join(', ') || 'None'} />
              <InfoRow label="Diagnosis Codes" value={resident.diagnosisCodes?.join(', ') || 'None'} />
            </dl>
          </Section>

          {/* Employment */}
          {(resident.employer || resident.jobTitle) && (
            <Section title="Employment">
              <dl>
                <InfoRow label="Employer" value={resident.employer} />
                <InfoRow label="Job Title" value={resident.jobTitle} />
                <InfoRow label="Work Schedule" value={resident.workSchedule} />
                <InfoRow label="Work Phone" value={resident.workPhone} />
              </dl>
            </Section>
          )}

          {/* Emergency contact */}
          <Section title="Emergency Contact">
            <dl>
              <InfoRow label="Name" value={resident.emergencyContact?.name} />
              <InfoRow label="Phone" value={resident.emergencyContact?.phone ? (
                <a href={`tel:${resident.emergencyContact.phone}`} className="text-cyan-600 hover:underline">
                  {resident.emergencyContact.phone}
                </a>
              ) : '—'} />
              <InfoRow label="Relationship" value={resident.emergencyContact?.relationship} />
            </dl>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enrollment card */}
          {enrollment ? (
            <Section title="Enrollment">
              <dl className="space-y-0">
                <InfoRow label="Status" value={
                  <Badge variant={statusBadgeVariant(enrollment.status)}>
                    {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                  </Badge>
                } />
                <InfoRow label="Phase" value={<span className="text-white/90">Phase {enrollment.phase}</span>} />
                <InfoRow label="Move-In Date" value={<span className="text-white/90">{formatDate(enrollment.moveInDate)}</span>} />
                <InfoRow label="Sobriety Start" value={<span className="text-white/90">{formatDate(enrollment.sobrietyStartDate)}</span>} />
                {sobrietyDays !== null && (
                  <InfoRow
                    label="Sobriety Days"
                    value={
                      <span className="font-semibold text-emerald-400">
                        {sobrietyDays} {sobrietyDays === 1 ? 'day' : 'days'}
                      </span>
                    }
                  />
                )}
              </dl>
            </Section>
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardHeader><CardTitle className="text-base text-white">Enrollment</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-white/50">Not yet enrolled in this program.</p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {resident.notes && (
            <Section title="Notes">
              <p className="text-sm text-white/70 whitespace-pre-wrap">{resident.notes}</p>
            </Section>
          )}

          {/* Link App User — for staff_admin+ only */}
          {userCanWrite && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-base text-white">Mobile App Link</CardTitle>
              </CardHeader>
              <CardContent>
                {resident.firebaseUid ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm text-emerald-400 font-medium">Linked to app user</p>
                      <p className="text-xs text-white/40 font-mono mt-0.5 truncate">{resident.firebaseUid}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-white/50 mb-3">
                      Link this resident to their mobile app account by entering the email they registered with.
                    </p>
                    <form onSubmit={handleLinkUser} className="space-y-2">
                      <input
                        ref={linkEmailRef}
                        type="email"
                        placeholder="resident@email.com"
                        value={linkEmail}
                        onChange={e => setLinkEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        required
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                        disabled={linkLoading || !linkEmail.trim()}
                      >
                        {linkLoading ? 'Linking...' : 'Link App User'}
                      </Button>
                    </form>
                    {linkMessage && (
                      <p className={`mt-2 text-xs ${linkMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {linkMessage.text}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
