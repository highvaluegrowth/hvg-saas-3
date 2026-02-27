'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/authService';
import { StaffRole, StaffSchedule, ShiftTime } from '@/features/staff/types/staff.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface NewStaffPageProps {
  params: Promise<{ tenantId: string }>;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

type DayKey = typeof DAYS[number]['key'];

interface ScheduleState {
  monday: ShiftTime | null;
  tuesday: ShiftTime | null;
  wednesday: ShiftTime | null;
  thursday: ShiftTime | null;
  friday: ShiftTime | null;
  saturday: ShiftTime | null;
  sunday: ShiftTime | null;
}

const defaultSchedule: ScheduleState = {
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
};

const roleOptions = [
  { value: 'staff', label: 'Staff' },
  { value: 'house_manager', label: 'House Manager' },
  { value: 'staff_admin', label: 'Staff Admin' },
];

export default function NewStaffPage({ params }: NewStaffPageProps) {
  const { tenantId } = use(params);
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('staff');
  const [userId, setUserId] = useState('');
  const [schedule, setSchedule] = useState<ScheduleState>(defaultSchedule);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  function setShiftField(day: DayKey, field: 'start' | 'end', value: string) {
    setSchedule((prev) => {
      const existing = prev[day] ?? { start: '', end: '' };
      return { ...prev, [day]: { ...existing, [field]: value } };
    });
  }

  function clearDay(day: DayKey) {
    setSchedule((prev) => ({ ...prev, [day]: null }));
  }

  function enableDay(day: DayKey) {
    setSchedule((prev) => ({ ...prev, [day]: { start: '08:00', end: '16:00' } }));
  }

  function buildSchedulePayload(): StaffSchedule {
    const result: StaffSchedule = {};
    for (const { key } of DAYS) {
      const shift = schedule[key];
      if (shift && (shift.start || shift.end)) {
        result[key] = { start: shift.start, end: shift.end };
      }
    }
    return result;
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!userId.trim()) newErrors.userId = 'Firebase User ID is required';
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
      const response = await fetch(`/api/tenants/${tenantId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role,
          houseIds: [],
          schedule: buildSchedulePayload(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.errors && typeof data.errors === 'object') {
          setErrors(data.errors);
        } else {
          setApiError(data.error ?? data.message ?? 'Failed to create staff member');
        }
        return;
      }

      router.push(`/${tenantId}/staff`);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Staff Member</h1>
        <p className="text-gray-600 mt-1">Create a new staff member record</p>
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

            <div>
              <Select
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                options={roleOptions}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Firebase User ID <span className="text-red-500">*</span>
              </label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="abc123xyz..."
                disabled={submitting}
                className={errors.userId ? 'border-red-500' : ''}
              />
              {errors.userId && (
                <p className="mt-1 text-sm text-red-600">{errors.userId}</p>
              )}
              <p className="mt-1.5 text-sm text-gray-500">
                The user must already have a Firebase account. Enter their Firebase UID.
              </p>
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
            onClick={() => router.push(`/${tenantId}/staff`)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {submitting ? 'Creating...' : 'Create Staff Member'}
          </Button>
        </div>
      </form>
    </div>
  );
}
