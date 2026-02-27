'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/features/auth/services/authService';
import { StaffMember, StaffRole, StaffSchedule, ShiftTime } from '@/features/staff/types/staff.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface EditStaffPageProps {
  params: Promise<{ tenantId: string; staffId: string }>;
}

const DAYS: { key: keyof StaffSchedule; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

type ScheduleState = Record<keyof StaffSchedule, ShiftTime | null>;

const roleOptions = [
  { value: 'staff', label: 'Staff' },
  { value: 'house_manager', label: 'House Manager' },
  { value: 'staff_admin', label: 'Staff Admin' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

function buildScheduleState(schedule?: StaffSchedule): ScheduleState {
  return {
    monday: schedule?.monday ?? null,
    tuesday: schedule?.tuesday ?? null,
    wednesday: schedule?.wednesday ?? null,
    thursday: schedule?.thursday ?? null,
    friday: schedule?.friday ?? null,
    saturday: schedule?.saturday ?? null,
    sunday: schedule?.sunday ?? null,
  };
}

function buildSchedulePayload(state: ScheduleState): StaffSchedule {
  const result: StaffSchedule = {};
  for (const { key } of DAYS) {
    const shift = state[key];
    if (shift && (shift.start || shift.end)) {
      result[key] = { start: shift.start, end: shift.end };
    }
  }
  return result;
}

export default function EditStaffPage({ params }: EditStaffPageProps) {
  const { tenantId, staffId } = use(params);
  const router = useRouter();

  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('staff');
  const [status, setStatus] = useState<StaffMember['status']>('active');
  const [schedule, setSchedule] = useState<ScheduleState>(buildScheduleState());

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoadingData(true);
    setFetchError(null);
    try {
      const token = await authService.getIdToken();
      const response = await fetch(`/api/tenants/${tenantId}/staff/${staffId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? data.message ?? 'Failed to fetch staff member');
      }
      const data: StaffMember = await response.json();
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setEmail(data.email);
      setPhone(data.phone ?? '');
      setRole(data.role);
      setStatus(data.status);
      setSchedule(buildScheduleState(data.schedule));
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoadingData(false);
    }
  }, [tenantId, staffId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  function setShiftField(day: keyof StaffSchedule, field: 'start' | 'end', value: string) {
    setSchedule((prev) => {
      const existing = prev[day] ?? { start: '', end: '' };
      return { ...prev, [day]: { ...existing, [field]: value } };
    });
  }

  function clearDay(day: keyof StaffSchedule) {
    setSchedule((prev) => ({ ...prev, [day]: null }));
  }

  function enableDay(day: keyof StaffSchedule) {
    setSchedule((prev) => ({ ...prev, [day]: { start: '08:00', end: '16:00' } }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setApiError(null);

    try {
      const token = await authService.getIdToken();
      const response = await fetch(`/api/tenants/${tenantId}/staff/${staffId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role,
          status,
          schedule: buildSchedulePayload(schedule),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.errors && typeof data.errors === 'object') {
          setErrors(data.errors);
        } else {
          setApiError(data.error ?? data.message ?? 'Failed to update staff member');
        }
        return;
      }

      router.push(`/${tenantId}/staff/${staffId}`);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingData) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-md bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-sm font-medium text-red-700">{fetchError}</p>
          <Link href={`/${tenantId}/staff`} className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              Back to Staff
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/${tenantId}/staff`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Staff
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            href={`/${tenantId}/staff/${staffId}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {firstName} {lastName}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-sm text-gray-700">Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Staff Member</h1>
      </div>

      {apiError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  disabled={submitting}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  disabled={submitting}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                disabled={submitting}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                options={roleOptions}
                disabled={submitting}
              />
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StaffMember['status'])}
                options={statusOptions}
                disabled={submitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">
              Weekly Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {DAYS.map(({ key, label }) => {
              const shift = schedule[key];
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-28 text-sm font-medium text-gray-700">{label}</div>
                  {shift === null ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => enableDay(key)}
                      disabled={submitting}
                      className="text-cyan-600 border-cyan-300 hover:bg-cyan-50"
                    >
                      + Add shift
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={shift.start}
                        onChange={(e) => setShiftField(key, 'start', e.target.value)}
                        disabled={submitting}
                        className="block px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                      <span className="text-gray-500 text-sm">to</span>
                      <input
                        type="time"
                        value={shift.end}
                        onChange={(e) => setShiftField(key, 'end', e.target.value)}
                        disabled={submitting}
                        className="block px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => clearDay(key)}
                        disabled={submitting}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                        aria-label={`Remove ${label} shift`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${tenantId}/staff/${staffId}`)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
