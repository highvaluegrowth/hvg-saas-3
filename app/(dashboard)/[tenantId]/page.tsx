'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats';
import { useEvents } from '@/features/events/hooks/useEvents';

interface DashboardPageProps {
  params: Promise<{ tenantId: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatEventDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

// ─── Occupancy Ring ───────────────────────────────────────────────────────────

function OccupancyRing({ rate }: { rate: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (rate / 100) * circ;
  const color = rate >= 90 ? '#ef4444' : rate >= 70 ? '#f59e0b' : '#10b981';

  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill="#111827">
        {rate}%
      </text>
    </svg>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  href: string;
  accent: string;      // tailwind bg+text combo for icon bubble
  badge?: { text: string; color: string } | null;
  loading?: boolean;
}

function KPICard({ label, value, sub, icon, href, accent, badge, loading }: KPICardProps) {
  return (
    <Link href={href} className="group block">
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-cyan-300 hover:shadow-md transition-all h-full">
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
            {icon}
          </div>
          {badge && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
              {badge.text}
            </span>
          )}
        </div>
        <div className="mt-3">
          {loading ? (
            <>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
              {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconHouse = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const IconPeople = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconUser = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const IconCalendar = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const IconInbox = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);
const IconUserPlus = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);
const IconPlus = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
const IconChevron = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);
const IconDot = ({ color }: { color: string }) => (
  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage({ params }: DashboardPageProps) {
  const { tenantId } = use(params);
  const { stats, loading } = useDashboardStats(tenantId);
  const { events, loading: eventsLoading } = useEvents(tenantId);

  const upcomingEvents = events.slice(0, 6);

  const occupancyRate =
    stats.totalCapacity > 0
      ? Math.round((stats.activeResidentCount / stats.totalCapacity) * 100)
      : 0;

  const needsAttention =
    stats.openApplicationsCount > 0 || stats.pendingJoinRequestsCount > 0;

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {needsAttention && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium px-3 py-1.5 rounded-lg">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {stats.openApplicationsCount + stats.pendingJoinRequestsCount} item{stats.openApplicationsCount + stats.pendingJoinRequestsCount !== 1 ? 's' : ''} need attention
          </div>
        )}
      </div>

      {/* ── Occupancy Feature Card + KPI Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Occupancy hero card */}
        <Link href={`/${tenantId}/residents`} className="group lg:col-span-1">
          <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl p-5 text-white hover:from-cyan-500 hover:to-cyan-600 transition-all h-full flex flex-col justify-between">
            <div>
              <p className="text-cyan-100 text-xs font-semibold uppercase tracking-wider mb-1">Occupancy</p>
              <div className="flex items-center gap-4 mt-2">
                {loading ? (
                  <Skeleton className="w-18 h-18 rounded-full bg-cyan-500" />
                ) : (
                  <OccupancyRing rate={occupancyRate} />
                )}
                <div>
                  {loading ? (
                    <Skeleton className="h-8 w-20 bg-cyan-500 mb-1" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold">{stats.activeResidentCount}</p>
                      <p className="text-cyan-200 text-sm">of {stats.totalCapacity} beds</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <p className="text-cyan-200 text-xs mt-3 group-hover:text-white transition-colors">
              View all residents →
            </p>
          </div>
        </Link>

        {/* KPI cards */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <KPICard
            label="Active Houses"
            value={stats.houseCount}
            icon={<IconHouse />}
            href={`/${tenantId}/houses`}
            accent="bg-blue-50 text-blue-600"
            loading={loading}
          />
          <KPICard
            label="Staff Members"
            value={stats.staffCount}
            icon={<IconUser />}
            href={`/${tenantId}/staff`}
            accent="bg-violet-50 text-violet-600"
            loading={loading}
          />
          <KPICard
            label="Upcoming Events"
            value={stats.upcomingEventCount}
            icon={<IconCalendar />}
            href={`/${tenantId}/events`}
            accent="bg-emerald-50 text-emerald-600"
            loading={loading}
          />
          <KPICard
            label="Applications"
            value={stats.openApplicationsCount}
            sub={stats.openApplicationsCount === 0 ? 'All reviewed' : 'Awaiting review'}
            icon={<IconInbox />}
            href={`/${tenantId}/applications`}
            accent={stats.openApplicationsCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}
            badge={stats.openApplicationsCount > 0 ? { text: 'New', color: 'bg-amber-100 text-amber-700' } : null}
            loading={loading}
          />
          <KPICard
            label="Join Requests"
            value={stats.pendingJoinRequestsCount}
            sub={stats.pendingJoinRequestsCount === 0 ? 'None pending' : 'Residents requesting access'}
            icon={<IconUserPlus />}
            href={`/${tenantId}/join-requests`}
            accent={stats.pendingJoinRequestsCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-400'}
            badge={stats.pendingJoinRequestsCount > 0 ? { text: 'New', color: 'bg-rose-100 text-rose-700' } : null}
            loading={loading}
          />
          <KPICard
            label="People"
            value={stats.activeResidentCount + stats.staffCount}
            sub="Residents + Staff"
            icon={<IconPeople />}
            href={`/${tenantId}/residents`}
            accent="bg-teal-50 text-teal-600"
            loading={loading}
          />
        </div>
      </div>

      {/* ── Bottom: Events + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Upcoming events feed */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Upcoming Events</h2>
            <Link href={`/${tenantId}/events`}
              className="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1">
              View all <IconChevron />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {eventsLoading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm">No upcoming events</p>
                <Link href={`/${tenantId}/events/new`}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-600 hover:text-cyan-700 border border-cyan-200 rounded-lg px-3 py-1.5">
                  <IconPlus /> Schedule Event
                </Link>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/${tenantId}/events/${event.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <IconDot color={
                      event.type.includes('meeting') ? 'bg-cyan-500' :
                      event.type.includes('group') ? 'bg-violet-500' :
                      event.type === 'class' || event.type === 'course' ? 'bg-amber-500' : 'bg-gray-400'
                    } />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {event.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
                    {formatEventDate(event.scheduledAt)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-3 space-y-1">
              {[
                { label: 'Add House', href: `/${tenantId}/houses/new`, color: 'text-blue-600' },
                { label: 'Enroll Resident', href: `/${tenantId}/residents/new`, color: 'text-green-600' },
                { label: 'Add Staff Member', href: `/${tenantId}/staff/new`, color: 'text-violet-600' },
                { label: 'Schedule Event', href: `/${tenantId}/events/new`, color: 'text-cyan-600' },
                { label: 'Create Course', href: `/${tenantId}/lms`, color: 'text-amber-600' },
                { label: 'Post to Social', href: `/${tenantId}/marketing`, color: 'text-pink-600' },
              ].map(({ label, href, color }) => (
                <Link key={label} href={href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
                  <span className={`${color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <IconChevron />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* AI Partner shortcut */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-sm font-semibold">HVG Partner</span>
            </div>
            <p className="text-slate-400 text-xs mb-3">Your AI house manager — ask anything about operations, residents, or analytics.</p>
            <button
              onClick={() => {
                const btn = document.querySelector<HTMLButtonElement>('[data-ai-toggle]');
                btn?.click();
              }}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              Open AI Assistant →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
