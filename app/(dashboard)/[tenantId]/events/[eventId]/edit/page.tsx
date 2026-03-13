'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/features/auth/services/authService';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { ProgramEventType, EventVisibility, RecurrenceFrequency, RecurrenceEndType, RecurrenceDay } from '@/features/events/types/event.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface EditEventPageProps {
  params: Promise<{ tenantId: string; eventId: string }>;
}

const EVENT_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'group_meeting', label: 'Group Meeting' },
  { value: 'house_meeting', label: 'House Meeting' },
  { value: 'class', label: 'Class' },
  { value: 'course', label: 'Course' },
  { value: 'na_meeting', label: 'NA Meeting' },
  { value: 'aa_meeting', label: 'AA Meeting' },
  { value: 'church', label: 'Church' },
  { value: 'bible_study', label: 'Bible Study' },
  { value: 'therapy_session', label: 'Therapy Session' },
  { value: 'job_training', label: 'Job Training' },
  { value: 'community_service', label: 'Community Service' },
  { value: 'outing', label: 'Outing' },
  { value: 'other', label: 'Other' },
];

const FREQUENCY_OPTIONS: Array<{ value: RecurrenceFrequency; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const DAYS_OF_WEEK: Array<{ value: RecurrenceDay; label: string }> = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
];

interface HouseOption {
  id: string;
  name: string;
}

interface FormData {
  title: string;
  description: string;
  type: ProgramEventType;
  scheduledAt: string;
  duration: string;
  location: string;
  facilitator: string;
  visibility: EventVisibility;
  houseId: string;
  recurrenceFrequency: RecurrenceFrequency;
  recurrenceEndType: RecurrenceEndType;
  recurrenceEndAfter: string;
  recurrenceEndDate: string;
}

/** Convert a Date to the value format required by <input type="datetime-local"> */
function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function EditEventPage({ params }: EditEventPageProps) {
  const { tenantId, eventId } = use(params);
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: 'group_meeting',
    scheduledAt: '',
    duration: '60',
    location: '',
    facilitator: '',
    visibility: 'tenant',
    houseId: '',
    recurrenceFrequency: 'weekly',
    recurrenceEndType: 'never',
    recurrenceEndAfter: '',
    recurrenceEndDate: '',
  });
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [repeats, setRepeats] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState<RecurrenceDay[]>([]);
  const [showAdvancedRecurrence, setShowAdvancedRecurrence] = useState(false);
  const [houses, setHouses] = useState<HouseOption[]>([]);
  const [loadingHouses, setLoadingHouses] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing event on mount
  useEffect(() => {
    async function fetchEvent() {
      setLoading(true);
      setLoadError(null);
      try {
        const token = await authService.getIdToken();
        const response = await fetch(`/api/tenants/${tenantId}/events`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!response.ok) {
          throw new Error(`Failed to load event (status ${response.status})`);
        }
        const json = await response.json();
        const data: Array<{
          id: string;
          title: string;
          description?: string;
          type: ProgramEventType;
          scheduledAt: string;
          duration: number;
          location?: string;
          facilitator?: string;
          coverImageUrl?: string;
          visibility: EventVisibility;
          houseId?: string;
          recurrence?: {
            frequency: RecurrenceFrequency;
            days?: RecurrenceDay[];
            endType: RecurrenceEndType;
            endAfter?: number;
            endDate?: string;
          };
        }> = Array.isArray(json) ? json : (json.events ?? []);

        const found = data.find((e) => e.id === eventId);
        if (!found) throw new Error('Event not found.');

        const scheduledDate = new Date(found.scheduledAt);

        setFormData({
          title: found.title ?? '',
          description: found.description ?? '',
          type: found.type ?? 'group_meeting',
          scheduledAt: isNaN(scheduledDate.getTime()) ? '' : toDatetimeLocal(scheduledDate),
          duration: String(found.duration ?? 60),
          location: found.location ?? '',
          facilitator: found.facilitator ?? '',
          visibility: found.visibility ?? 'tenant',
          houseId: found.houseId ?? '',
          recurrenceFrequency: found.recurrence?.frequency ?? 'weekly',
          recurrenceEndType: found.recurrence?.endType ?? 'never',
          recurrenceEndAfter: found.recurrence?.endAfter != null ? String(found.recurrence.endAfter) : '',
          recurrenceEndDate: found.recurrence?.endDate ?? '',
        });

        setCoverImageUrl(found.coverImageUrl ?? '');

        if (found.recurrence) {
          setRepeats(true);
          setRecurrenceDays(found.recurrence.days ?? []);
          const hasAdvanced =
            (found.recurrence.days?.length ?? 0) > 0 ||
            found.recurrence.endType !== 'never';
          setShowAdvancedRecurrence(hasAdvanced);
        }

        if (found.visibility === 'house') {
          void loadHouseOptions();
        }
      } catch (err: unknown) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load event.');
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, eventId]);

  function handleChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function loadHouseOptions() {
    if (houses.length > 0) return;
    setLoadingHouses(true);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/houses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHouses(data.houses ?? []);
    } finally {
      setLoadingHouses(false);
    }
  }

  function handleVisibilityChange(v: EventVisibility) {
    handleChange('visibility', v);
    if (v === 'house') void loadHouseOptions();
  }

  function toggleRecurrenceDay(day: RecurrenceDay) {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!formData.scheduledAt) {
      setError('Date and time are required.');
      return;
    }
    const durationNum = parseInt(formData.duration, 10);
    if (isNaN(durationNum) || durationNum < 1) {
      setError('Duration must be a positive number of minutes.');
      return;
    }
    if (formData.visibility === 'house' && !formData.houseId) {
      setError('Please select a house for House Only visibility.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await authService.getIdToken();
      const response = await fetch(`/api/tenants/${tenantId}/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          type: formData.type,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          duration: durationNum,
          location: formData.location.trim() || undefined,
          facilitator: formData.facilitator.trim() || undefined,
          coverImageUrl: coverImageUrl || undefined,
          visibility: formData.visibility,
          houseId: formData.visibility === 'house' ? formData.houseId : undefined,
          recurrence: repeats
            ? {
                frequency: formData.recurrenceFrequency,
                days: recurrenceDays.length > 0 ? recurrenceDays : undefined,
                endType: formData.recurrenceEndType,
                endAfter:
                  formData.recurrenceEndType === 'after' && formData.recurrenceEndAfter
                    ? parseInt(formData.recurrenceEndAfter, 10)
                    : undefined,
                endDate:
                  formData.recurrenceEndType === 'on_date'
                    ? formData.recurrenceEndDate
                    : undefined,
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed with status ${response.status}`);
      }

      router.push(`/${tenantId}/events/${eventId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent" />
          <p className="mt-4 text-white/50">Loading event...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/${tenantId}/events`} className="text-white/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-white">Edit Event</h1>
        </div>
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-sm text-red-400">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${tenantId}/events/${eventId}`} className="text-white/50 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Event</h1>
          <p className="text-white/50 mt-0.5 text-sm">Update event details</p>
        </div>
      </div>

      <Card className="border border-white/10 bg-white/5 rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Monday Morning Group Meeting"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            <div>
              <Textarea
                label="Description"
                placeholder="Optional description of the event..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Select
                label="Type"
                options={EVENT_TYPE_OPTIONS}
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Date &amp; Time <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => handleChange('scheduledAt', e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="60"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Location
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Main Lounge"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Facilitator
                </label>
                <Input
                  type="text"
                  placeholder="e.g. John Smith"
                  value={formData.facilitator}
                  onChange={(e) => handleChange('facilitator', e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Cover Image <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <ImageUpload
                storagePath={`tenants/${tenantId}/events/${eventId}/cover`}
                onUpload={(url) => setCoverImageUrl(url)}
                currentUrl={coverImageUrl || undefined}
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Visibility
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: 'universal', label: 'Universal Access', desc: 'All tenants' },
                    { value: 'tenant', label: 'Tenant Only', desc: 'Your organization' },
                    { value: 'house', label: 'House Only', desc: 'One house' },
                  ] as Array<{ value: EventVisibility; label: string; desc: string }>
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleVisibilityChange(opt.value)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors ${
                      formData.visibility === opt.value
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xs font-semibold">{opt.label}</span>
                    <span className="text-[10px] text-white/40">{opt.desc}</span>
                  </button>
                ))}
              </div>

              {formData.visibility === 'house' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Select House <span className="text-red-500">*</span>
                  </label>
                  {loadingHouses ? (
                    <p className="text-sm text-white/50">Loading houses...</p>
                  ) : (
                    <select
                      value={formData.houseId}
                      onChange={(e) => handleChange('houseId', e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      required
                    >
                      <option value="" className="bg-gray-900">-- Select a house --</option>
                      {houses.map((h) => (
                        <option key={h.id} value={h.id} className="bg-gray-900">
                          {h.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Recurrence */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-white/80">
                  Repeating Event
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={repeats}
                  onClick={() => setRepeats((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    repeats ? 'bg-cyan-600' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                      repeats ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {repeats && (
                <div className="mt-3 space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Frequency
                    </label>
                    <select
                      value={formData.recurrenceFrequency}
                      onChange={(e) => handleChange('recurrenceFrequency', e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      {FREQUENCY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-gray-900">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Advanced toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAdvancedRecurrence((prev) => !prev)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {showAdvancedRecurrence ? 'Hide advanced options' : 'Show advanced options'}
                  </button>

                  {showAdvancedRecurrence && (
                    <div className="space-y-4">
                      {/* Days of week */}
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Days of Week
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map((day) => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleRecurrenceDay(day.value)}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                                recurrenceDays.includes(day.value)
                                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                                  : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10'
                              }`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* End condition */}
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          End Condition
                        </label>
                        <div className="space-y-2">
                          {(
                            [
                              { value: 'never', label: 'Never' },
                              { value: 'after', label: 'After N occurrences' },
                              { value: 'on_date', label: 'On date' },
                            ] as Array<{ value: RecurrenceEndType; label: string }>
                          ).map((opt) => (
                            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="recurrenceEndType"
                                value={opt.value}
                                checked={formData.recurrenceEndType === opt.value}
                                onChange={() => handleChange('recurrenceEndType', opt.value)}
                                className="accent-cyan-500"
                              />
                              <span className="text-sm text-white/70">{opt.label}</span>
                            </label>
                          ))}
                        </div>

                        {formData.recurrenceEndType === 'after' && (
                          <div className="mt-2">
                            <Input
                              type="number"
                              min="1"
                              placeholder="e.g. 10"
                              value={formData.recurrenceEndAfter}
                              onChange={(e) => handleChange('recurrenceEndAfter', e.target.value)}
                              className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-cyan-500 focus:border-cyan-500"
                            />
                          </div>
                        )}

                        {formData.recurrenceEndType === 'on_date' && (
                          <div className="mt-2">
                            <Input
                              type="date"
                              value={formData.recurrenceEndDate}
                              onChange={(e) => handleChange('recurrenceEndDate', e.target.value)}
                              className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-cyan-500 focus:border-cyan-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href={`/${tenantId}/events/${eventId}`}>
                <Button type="button" variant="outline" className="border-white/10 text-white/70 hover:bg-white/10 bg-transparent">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 shadow-lg shadow-cyan-900/20"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
