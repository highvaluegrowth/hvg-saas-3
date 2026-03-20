'use client';

import { use, useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMyChores } from '@/features/chores/hooks/useMyChores';
import type { Chore } from '@/features/chores/types/chore.types';

interface ChoresPageProps {
  params: Promise<{ tenantId: string }>;
}

function ActionableChoreCard({
  chore,
  onComplete,
}: {
  chore: Chore;
  onComplete: (id: string) => Promise<void>;
}) {
  const [completing, setCompleting] = useState(false);
  const [done, setDone] = useState(false);

  const handleComplete = useCallback(async () => {
    if (completing || done) return;
    setCompleting(true);
    try {
      await onComplete(chore.id);
      setDone(true);
    } finally {
      setCompleting(false);
    }
  }, [chore.id, completing, done, onComplete]);

  if (done) {
    return (
      <div
        className="flex items-center gap-3 rounded-2xl p-4 transition-all"
        style={{
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.25)',
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 animate-bounce"
          style={{ background: 'rgba(16,185,129,0.2)' }}
        >
          <svg className="w-5 h-5" style={{ color: '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold line-through" style={{ color: 'rgba(16,185,129,0.8)' }}>
            {chore.title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(16,185,129,0.6)' }}>
            Marked complete!
          </p>
        </div>
      </div>
    );
  }

  const isOverdue = chore.status === 'overdue';

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-2 h-2 rounded-full mt-2 shrink-0"
          style={{
            background: isOverdue ? '#ef4444' : '#06b6d4',
            boxShadow: isOverdue ? '0 0 6px rgba(239,68,68,0.6)' : '0 0 6px rgba(6,182,212,0.5)',
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{chore.title}</p>
          {chore.description && (
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {chore.description}
            </p>
          )}
          {chore.dueDate && (
            <p
              className="text-xs mt-1 font-semibold"
              style={{ color: isOverdue ? '#ef4444' : 'rgba(255,255,255,0.35)' }}
            >
              {isOverdue ? '⚠ ' : ''}Due {new Date(chore.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleComplete}
        disabled={completing}
        className="mt-3 w-full rounded-xl py-2.5 text-sm font-black uppercase tracking-wider transition-all active:scale-[0.97]"
        style={{
          background: completing
            ? 'rgba(16,185,129,0.1)'
            : 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(16,185,129,0.3)',
          color: completing ? 'rgba(16,185,129,0.5)' : '#10b981',
        }}
      >
        {completing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin inline-block" />
            Saving…
          </span>
        ) : (
          '✓ Mark Complete'
        )}
      </button>
    </div>
  );
}

function CompletedChoreCard({ chore }: { chore: Chore }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'rgba(16,185,129,0.1)' }}
      >
        <svg className="w-4 h-4" style={{ color: '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold line-through" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {chore.title}
        </p>
      </div>
    </div>
  );
}

export default function ChoresPage({ params }: ChoresPageProps) {
  const { tenantId } = use(params);
  const { user } = useAuth();
  const { chores, loading, error, completeChore } = useMyChores(tenantId, user?.uid);

  const pendingChores = chores.filter((c) => c.status !== 'done');
  const completedChores = chores.filter((c) => c.status === 'done');

  return (
    <div className="flex flex-col px-4 pt-10 pb-4">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(103,232,249,0.7)' }}>
          Resident Portal
        </p>
        <h1 className="text-3xl font-black text-white">My Chores</h1>
        {!loading && (
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {pendingChores.length === 0
              ? 'All done — great work!'
              : `${pendingChores.length} pending task${pendingChores.length !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {error && (
        <div
          className="rounded-2xl p-4 mb-6"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl animate-pulse"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          ))}
        </div>
      ) : (
        <>
          {/* Pending / Active */}
          {pendingChores.length > 0 && (
            <section className="mb-8">
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Pending ({pendingChores.length})
              </p>
              <div className="space-y-3">
                {pendingChores.map((chore) => (
                  <ActionableChoreCard
                    key={chore.id}
                    chore={chore}
                    onComplete={completeChore}
                  />
                ))}
              </div>
            </section>
          )}

          {pendingChores.length === 0 && (
            <div
              className="rounded-2xl p-6 flex flex-col items-center text-center mb-8"
              style={{
                background: 'rgba(16,185,129,0.07)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(16,185,129,0.15)' }}
              >
                <svg className="w-7 h-7" style={{ color: '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-base font-black" style={{ color: '#10b981' }}>You&apos;re all caught up!</p>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>No pending chores right now.</p>
            </div>
          )}

          {/* Completed */}
          {completedChores.length > 0 && (
            <section>
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Completed ({completedChores.length})
              </p>
              <div className="space-y-2">
                {completedChores.map((chore) => (
                  <CompletedChoreCard key={chore.id} chore={chore} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
