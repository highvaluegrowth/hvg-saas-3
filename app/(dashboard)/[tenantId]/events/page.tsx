'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, dateFnsLocalizer, type Event as BigCalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEvents } from '@/features/events/hooks/useEvents';
import { ProgramEvent, ProgramEventType } from '@/features/events/types/event.types';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { canWrite } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS },
});

interface EventsPageProps {
  params: Promise<{ tenantId: string }>;
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

// Some types need custom styles
const TYPE_BADGE_CLASSES: Record<ProgramEventType, string> = {
  group_meeting: '',
  house_meeting: '',
  class: '',
  course: 'bg-indigo-100 text-indigo-800',
  na_meeting: 'bg-blue-100 text-blue-800',
  aa_meeting: 'bg-blue-100 text-blue-800',
  church: 'bg-purple-100 text-purple-800',
  bible_study: 'bg-purple-100 text-purple-800',
  therapy_session: '',
  job_training: 'bg-teal-100 text-teal-800',
  community_service: 'bg-teal-100 text-teal-800',
  outing: 'bg-orange-100 text-orange-800',
  other: '',
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function EventCard({ event, tenantId }: { event: ProgramEvent; tenantId: string }) {
  const badgeVariant = TYPE_BADGE_VARIANTS[event.type];
  const badgeClass = TYPE_BADGE_CLASSES[event.type];

  return (
    <Link href={`/${tenantId}/events/${event.id}`} className="block group">
      <Card className="border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-150">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={badgeVariant} className={badgeClass}>
                  {TYPE_LABELS[event.type]}
                </Badge>
              </div>
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 truncate">
                {event.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {formatDateTime(event.scheduledAt)}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                <span>{formatDuration(event.duration)}</span>
                {event.location && (
                  <span className="flex items-center gap-1">
                    <span className="text-gray-400">at</span> {event.location}
                  </span>
                )}
                {event.facilitator && (
                  <span className="flex items-center gap-1">
                    <span className="text-gray-400">by</span> {event.facilitator}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold">
                {event.attendeeIds.length}
              </span>
              <p className="text-xs text-gray-500 mt-1">attendees</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function EventsPage({ params }: EventsPageProps) {
  const { tenantId } = use(params);
  const router = useRouter();
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const { user } = useAuth();
  const userCanWrite = user?.role ? canWrite(user.role as UserRole) : false;

  const { events, loading, error } = useEvents(tenantId);
  const { events: allEvents } = useEvents(tenantId, { showAll: true });

  const calendarEvents: BigCalendarEvent[] = allEvents.map((e) => ({
    title: e.title,
    start: new Date(e.scheduledAt),
    end: new Date(new Date(e.scheduledAt).getTime() + (e.duration ?? 60) * 60 * 1000),
    resource: e,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {view === 'list' ? 'Upcoming Events' : 'Events Calendar'}
          </h1>
          <p className="text-gray-600 mt-1">Scheduled programs, meetings, and activities</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-md border border-gray-200 overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-200 ${
                view === 'calendar'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Calendar
            </button>
          </div>
          {userCanWrite && (
            <Link href={`/${tenantId}/events/new`}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Add Event
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* List view */}
      {view === 'list' && (
        <>
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading events...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700">Failed to load events: {error}</p>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No upcoming events</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-xs">
                Schedule your first event to get started with program management.
              </p>
              {userCanWrite && (
                <Link href={`/${tenantId}/events/new`}>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Add Event
                  </Button>
                </Link>
              )}
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="space-y-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} tenantId={tenantId} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Calendar view */}
      {view === 'calendar' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            defaultView="month"
            views={['month', 'week', 'day']}
            style={{ height: 600 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSelectEvent={(event: any) =>
              router.push(`/${tenantId}/events/${(event.resource as { id: string }).id}`)
            }
          />
        </div>
      )}
    </div>
  );
}
