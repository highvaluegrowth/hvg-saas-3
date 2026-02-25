'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/features/auth/services/authService';
import { ProgramEventType } from '@/features/events/types/event.types';
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

interface FormData {
  title: string;
  description: string;
  type: ProgramEventType;
  scheduledAt: string;
  duration: string;
  location: string;
  facilitator: string;
}

const DEFAULT_FORM: FormData = {
  title: '',
  description: '',
  type: 'group_meeting',
  scheduledAt: '',
  duration: '60',
  location: '',
  facilitator: '',
};

export default function NewEventPage({ params }: NewEventPageProps) {
  const { tenantId } = use(params);
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
        <Link href={`/${tenantId}/events`} className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Event</h1>
          <p className="text-gray-600 mt-0.5 text-sm">Schedule a new program event</p>
        </div>
      </div>

      <Card className="border border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Monday Morning Group Meeting"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date &amp; Time <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => handleChange('scheduledAt', e.target.value)}
                  required
                  className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="60"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  required
                  className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Main Lounge"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facilitator
                </label>
                <Input
                  type="text"
                  placeholder="e.g. John Smith"
                  value={formData.facilitator}
                  onChange={(e) => handleChange('facilitator', e.target.value)}
                  className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href={`/${tenantId}/events`}>
                <Button type="button" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
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
