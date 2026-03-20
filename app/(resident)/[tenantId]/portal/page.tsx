'use client';

import { use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMyChores } from '@/features/chores/hooks/useMyChores';
import { useChatStore } from '@/lib/stores/useChatStore';

interface ResidentHomeProps {
  params: Promise<{ tenantId: string }>;
}

export default function ResidentHome({ params }: ResidentHomeProps) {
  const { tenantId } = use(params);
  const { user } = useAuth();
  const { chores, loading } = useMyChores(tenantId, user?.uid);
  const { openDrawer, setActiveConversation, setVoiceMode } = useChatStore();

  const firstName = user?.displayName?.split(' ')[0] ?? 'there';
  const pendingChores = chores.filter((c) => c.status === 'pending' || c.status === 'in_progress');
  const focusChores = pendingChores.slice(0, 3);

  const handleOutletPress = () => {
    setVoiceMode(false);
    setActiveConversation('__new_outlet__');
    openDrawer();
  };

  return (
    <div className="flex flex-col px-4 pt-10 pb-4">
      {/* Welcome Header */}
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(103,232,249,0.7)' }}>
          Good day
        </p>
        <h1 className="text-3xl font-black text-white leading-tight">
          Hello, {firstName}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Here&apos;s what&apos;s on your plate today.
        </p>
      </div>

      {/* Today's Focus — Chore Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Today&apos;s Focus
          </p>
          <Link
            href={`/${tenantId}/portal/chores`}
            className="text-xs font-bold"
            style={{ color: '#67E8F9' }}
          >
            See all
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl animate-pulse"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              />
            ))}
          </div>
        ) : focusChores.length === 0 ? (
          <div
            className="rounded-2xl p-5 flex items-center gap-3"
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(16,185,129,0.15)' }}
            >
              <svg className="w-5 h-5" style={{ color: '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#10b981' }}>All caught up!</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>No pending chores right now.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {focusChores.map((chore) => (
              <Link
                key={chore.id}
                href={`/${tenantId}/portal/chores`}
                className="flex items-center gap-3 rounded-2xl p-4 active:opacity-70 transition-opacity"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: chore.status === 'overdue' ? '#ef4444' : '#06b6d4',
                    boxShadow: chore.status === 'overdue'
                      ? '0 0 6px rgba(239,68,68,0.6)'
                      : '0 0 6px rgba(6,182,212,0.6)',
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{chore.title}</p>
                  {chore.dueDate && (
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Due {new Date(chore.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
                <svg className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Outlet AI Card */}
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Your AI Support
        </p>
        <button
          onClick={handleOutletPress}
          className="w-full rounded-2xl p-5 text-left active:scale-[0.98] transition-transform"
          style={{
            background: 'linear-gradient(135deg, rgba(8,145,178,0.2), rgba(14,116,144,0.12))',
            border: '1px solid rgba(8,145,178,0.3)',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #0891B2, #0e7490)',
                boxShadow: '0 0 20px rgba(8,145,178,0.35)',
              }}
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white">HVG Outlet AI</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Talk through anything on your mind
              </p>
            </div>
            <div
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-black"
              style={{
                background: 'rgba(8,145,178,0.25)',
                color: '#67E8F9',
              }}
            >
              Open
            </div>
          </div>
        </button>
      </div>

      {/* Quick Links */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Quick Access
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'My Courses', icon: '📚', href: `/${tenantId}/portal/courses` },
            { label: 'Applications', icon: '📋', href: `/${tenantId}/portal/applications` },
            { label: 'Events', icon: '📅', href: `/${tenantId}/portal/events` },
            { label: 'Profile', icon: '👤', href: `/${tenantId}/portal/profile` },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-2 rounded-2xl p-4 active:opacity-70 transition-opacity"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <span className="text-2xl">{item.icon}</span>
              <p className="text-xs font-bold text-white text-center">{item.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
