'use client';

import { use, useState } from 'react';
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

interface NewEventPageProps {
  params: Promise<{ tenantId: string }>;
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

const DEFAULT_FORM: FormData = {
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
};

export default function NewEventPage({ params }: NewEventPageProps) {
  const { tenantId } = use(params);
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recurrence state
  const [repeats, setRepeats] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState<RecurrenceDay[]>([]);
  const [showAdvancedRecurrence, setShowAdvancedRecurrence] = useState(false);

  // House dropdown state
  const [houses, setHouses] = useState<HouseOption[]>([]);
  const [loadingHouses, setLoadingHouses] = useState(false);

  function handleChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function loadHouses() {
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
    if (v === 'house') {
      void loadHouses();
    }
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
      const response = await fetch(`/api/tenants/${tenantId}/events`, {
        method: 'POST',
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

      router.push(`/${tenantId}/events`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${tenantId}/events`} className="text-white/50 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Add Event</h1>
          <p className="text-white/50 mt-0.5 text-sm">Schedule a new program event</p>
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
                storagePath={`tenants/${tenantId}/events/new/cover`}
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
              <Link href={`/${tenantId}/events`}>
                <Button type="button" variant="outline" className="border-white/10 text-white/70 hover:bg-white/10 bg-transparent">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 shadow-lg shadow-cyan-900/20"
              >
                {submitting ? 'Saving...' : 'Add Event'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
