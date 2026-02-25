'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats';
import { useEvents } from '@/features/events/hooks/useEvents';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface DashboardPageProps {
  params: Promise<{ tenantId: string }>;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

function StatCard({ label, value, icon, href, color }: StatCardProps) {
  return (
    <Link href={href} className="block group">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
            {icon}
          </div>
        </div>
      </div>
    </Link>
  );
}

function HouseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function ResidentsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function StaffIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function EventsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function formatEventDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const { tenantId } = use(params);
  const { stats, loading: statsLoading } = useDashboardStats(tenantId);
  const { events, loading: eventsLoading } = useEvents(tenantId);

  const upcomingEvents = events.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to your recovery house management platform</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Houses"
          value={statsLoading ? '—' : stats.houseCount}
          icon={<HouseIcon />}
          href={`/${tenantId}/houses`}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Active Residents"
          value={statsLoading ? '—' : stats.activeResidentCount}
          icon={<ResidentsIcon />}
          href={`/${tenantId}/residents`}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          label="Staff Members"
          value={statsLoading ? '—' : stats.staffCount}
          icon={<StaffIcon />}
          href={`/${tenantId}/staff`}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Upcoming Events"
          value={statsLoading ? '—' : stats.upcomingEventCount}
          icon={<EventsIcon />}
          href={`/${tenantId}/events`}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming events */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Events</CardTitle>
              <Link href={`/${tenantId}/events`}>
                <Button variant="ghost" size="sm" className="text-indigo-600">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 py-2">
                      <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No upcoming events scheduled.</p>
                  <Link href={`/${tenantId}/events/new`}>
                    <Button variant="outline" size="sm" className="mt-3">
                      Schedule Event
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/${tenantId}/events/${event.id}`}
                      className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-4 px-4 rounded transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500">{event.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-4">
                        {formatEventDate(event.scheduledAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/${tenantId}/houses/new`} className="block">
                <Button variant="outline" className="w-full justify-start space-x-2">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add House</span>
                </Button>
              </Link>
              <Link href={`/${tenantId}/residents/new`} className="block">
                <Button variant="outline" className="w-full justify-start space-x-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Enroll Resident</span>
                </Button>
              </Link>
              <Link href={`/${tenantId}/staff/new`} className="block">
                <Button variant="outline" className="w-full justify-start space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Staff Member</span>
                </Button>
              </Link>
              <Link href={`/${tenantId}/events/new`} className="block">
                <Button variant="outline" className="w-full justify-start space-x-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Schedule Event</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Getting started / onboarding hint */}
          {!statsLoading && stats.houseCount === 0 && (
            <Card className="mt-4 border-indigo-200 bg-indigo-50">
              <CardHeader>
                <CardTitle className="text-indigo-900 text-sm">Getting Started</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-1 text-sm text-indigo-800">
                  <li>Add a house</li>
                  <li>Invite staff members</li>
                  <li>Enroll residents</li>
                  <li>Schedule program events</li>
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
