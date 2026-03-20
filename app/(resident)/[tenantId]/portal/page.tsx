'use client';

import { use } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ResidentHomeProps {
  params: Promise<{ tenantId: string }>;
}

export default function ResidentHome({ params }: ResidentHomeProps) {
  const { tenantId } = use(params);
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen px-4 pt-12">
      {/* Header */}
      <div className="mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, #0891B2, #0e7490)' }}
        >
          <span className="text-white font-black text-sm">HVG</span>
        </div>
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(103,232,249,0.7)' }}>
          Resident Portal
        </p>
        <h1 className="text-2xl font-black text-white">
          Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Your recovery dashboard
        </p>
      </div>

      {/* Placeholder cards — Phase 8.2 will wire these up */}
      <div className="space-y-3">
        {[
          { icon: '✦', label: 'HVG Outlet AI', desc: 'Chat with your AI support companion', color: '#0891B2' },
          { icon: '📚', label: 'My Courses', desc: 'Continue your learning journey', color: '#6366F1' },
          { icon: '📋', label: 'My Applications', desc: 'Track your submitted applications', color: '#0891B2' },
          { icon: '📅', label: 'Events', desc: 'Upcoming house and community events', color: '#6366F1' },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-4 rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}
            >
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">{item.label}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.desc}</p>
            </div>
            <svg className="w-4 h-4 ml-auto shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}
