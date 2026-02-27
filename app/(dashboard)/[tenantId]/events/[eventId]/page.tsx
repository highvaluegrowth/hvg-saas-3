'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { authService } from '@/features/auth/services/authService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProgramEvent, ProgramEventType } from '@/features/events/types/event.types';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ResidentSelector } from '@/components/ui/ResidentSelector';
import { canWrite } from '@/lib/utils/permissions';
import { UserRole } from '@/features/auth/types/auth.types';

interface EventDetailPageProps {
  params: Promise<{ tenantId: string; eventId: string }>;
}

const TYPE_LABELS: Record<ProgramEventType, string> = {
  group_meeting: 'Group Meeting',
  house_meeting: 'House Meeting',
  class: 'Class',
  course: 'Course',
  na_meeting: 'NA Meeting',
  aa_meeting: 'AA Meeting',
  church: 'Church',
  bible_study: 'Bible Study',
  therapy_session: 'Therapy Session',
  job_training: 'Job Training',
  community_service: 'Community Service',
  outing: 'Outing',
  other: 'Other',
};

const TYPE_BADGE_VARIANTS: Record<ProgramEventType, BadgeVariant> = {
  group_meeting: 'info',
  house_meeting: 'warning',
  class: 'success',
  course: 'default',
  na_meeting: 'info',
  aa_meeting: 'info',
  church: 'default',
  bible_study: 'default',
  therapy_session: 'success',
  job_training: 'success',
  community_service: 'success',
  outing: 'danger',
  other: 'default',
};

const TYPE_BADGE_CLASSES: Record<ProgramEventType, string> = {
  group_meeting: '',
  house_meeting: '',
  class: '',
  course: 'bg-cyan-100 text-cyan-800',
  na_meeting: 'bg-blue-100 text-blue-800',
  aa_meeting: 'bg-blue-100 text-blue-800',
  church: 'bg-cyan-100 text-cyan-800',
  bible_study: 'bg-emerald-100 text-emerald-800',
  therapy_session: '',
  job_training: 'bg-teal-100 text-teal-800',
  community_service: 'bg-teal-100 text-teal-800',
  outing: 'bg-cyan-100 text-cyan-800',
  other: '',
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours} hour${hours !== 1 ? 's' : ''}`;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-gray-100 last:border-0">
      <dt className="w-32 flex-shrink-0 text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { tenantId, eventId } = use(params);
  const { user } = useAuth();
  const userCanWrite = user?.role ? canWrite(user.role as UserRole) : false;

  const [event, setEvent] = useState<ProgramEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      setLoading(true);
      setError(null);
      try {
        const token = await authService.getIdToken();
        const response = await fetch(`/api/tenants/${tenantId}/events`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to load events (status ${response.status})`);
        }
        const data: Array<ProgramEvent & { scheduledAt: string; createdAt: string; updatedAt: string }> = await response.json();
        const found = data.find((e) => e.id === eventId);
        if (!found) {
          throw new Error('Event not found.');
        }
        setEvent({
          ...found,
          scheduledAt: new Date(found.scheduledAt),
          createdAt: new Date(found.createdAt),
          updatedAt: new Date(found.updatedAt),
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load event.');
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [tenantId, eventId]);

  async function handleAttendeesChange(newIds: string[]) {
    if (!event) return;
    try {
      const token = await authService.getIdToken();
      const response = await fetch(`/api/tenants/${tenantId}/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ attendeeIds: newIds }),
      });
      if (!response.ok) {
        throw new Error(`Failed to update attendees (status ${response.status})`);
      }
      setEvent({ ...event, attendeeIds: newIds });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update attendees.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/${tenantId}/events`} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Event</h1>
        </div>
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error ?? 'Event not found.'}</p>
        </div>
      </div>
    );
  }

  const badgeVariant = TYPE_BADGE_VARIANTS[event.type];
  const badgeClass = TYPE_BADGE_CLASSES[event.type];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/${tenantId}/events`} className="text-gray-500 hover:text-gray-700 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge variant={badgeVariant} className={badgeClass}>
                {TYPE_LABELS[event.type]}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 truncate">{event.title}</h1>
          </div>
        </div>
        {userCanWrite && (
          <Link href={`/${tenantId}/events/${event.id}/edit`} className="flex-shrink-0">
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Edit
            </Button>
          </Link>
        )}
      </div>

      <Card className="border border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900">Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <dl>
            <DetailRow label="Date &amp; Time" value={formatDateTime(event.scheduledAt)} />
            <DetailRow label="Duration" value={formatDuration(event.duration)} />
            {event.location && <DetailRow label="Location" value={event.location} />}
            {event.facilitator && <DetailRow label="Facilitator" value={event.facilitator} />}
            {event.description && <DetailRow label="Description" value={event.description} />}
          </dl>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900">
            Attendees ({event.attendeeIds.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {userCanWrite ? (
            <ResidentSelector
              tenantId={tenantId}
              selectedIds={event.attendeeIds}
              onChange={handleAttendeesChange}
              label="Attendees"
            />
          ) : (
            <p className="text-sm text-gray-700 py-2">
              {event.attendeeIds.length === 0
                ? 'No attendees registered yet.'
                : `${event.attendeeIds.length} resident${event.attendeeIds.length !== 1 ? 's' : ''} assigned`}
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-gray-400">
        Created {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(event.createdAt)}
        {' '}&middot;{' '}
        Last updated {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(event.updatedAt)}
      </p>
    </div>
  );
}
