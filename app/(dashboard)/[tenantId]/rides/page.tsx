'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRides } from '@/features/rides/hooks/useRides';
import { RideStatus } from '@/features/rides/types/ride.types';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { canWrite } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';

const STATUS_COLORS: Record<RideStatus, React.CSSProperties> = {
  requested: { background: 'rgba(59,130,246,0.15)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.3)' },
  approved: { background: 'rgba(52,211,153,0.15)', color: '#6EE7B7', border: '1px solid rgba(52,211,153,0.3)' },
  assigned: { background: 'rgba(8,145,178,0.15)', color: '#67E8F9', border: '1px solid rgba(8,145,178,0.3)' },
  in_progress: { background: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)' },
  completed: { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' },
  cancelled: { background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)' },
};

const STATUS_LABELS: Record<RideStatus, string> = {
  requested: 'Requested',
  approved: 'Approved',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const FILTERS: Array<{ value: RideStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'requested', label: 'Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function RidesPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  const { rides, loading, error } = useRides(tenantId);
  const [filter, setFilter] = useState<RideStatus | 'all'>('all');

  const { user } = useAuth();
  const userCanWrite = user?.role ? canWrite(user.role as UserRole) : false;

  const filtered = filter === 'all' ? rides : rides.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 rounded w-1/4" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-64 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transportation</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {rides.length} ride{rides.length !== 1 ? 's' : ''} total
          </p>
        </div>
        {userCanWrite && (
          <Link href={`/${tenantId}/rides/new`}>
            <Button className="text-white border-0 font-semibold transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg,#0891B2,#059669)' }}>
              + Schedule Ride
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FECACA' }}>
          {error}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap pb-2 border-b border-white/10">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="px-4 py-2 text-sm font-medium transition-colors rounded-lg"
            style={filter === f.value
              ? { background: 'rgba(8,145,178,0.15)', color: '#67E8F9' }
              : { color: 'rgba(255,255,255,0.5)', background: 'transparent' }
            }
          >
            {f.label}
            {f.value !== 'all' && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={filter === f.value ? { background: 'rgba(8,145,178,0.25)' } : { background: 'rgba(255,255,255,0.08)' }}>
                {rides.filter((r) => r.status === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4" style={{ background: 'rgba(8,145,178,0.15)' }}>
              <svg className="w-8 h-8" style={{ color: '#67E8F9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <p className="text-lg text-white font-semibold mb-1">
              No rides{filter !== 'all' ? ` with status "${STATUS_LABELS[filter as RideStatus]}"` : ''}
            </p>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>Get started by creating a new transportation request.</p>
            {userCanWrite && (
              <Link href={`/${tenantId}/rides/new`} className="inline-block">
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white border-0 transition-opacity hover:opacity-90">
                  Schedule a Ride
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5">
              <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Route</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Purpose</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Passengers</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((ride) => (
                  <tr key={ride.id} className="hover:bg-white/5 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/${tenantId}/rides/${ride.id}`} className="block">
                        <div className="font-semibold text-white">
                          {new Date(ride.scheduledAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm mt-0.5 font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {new Date(ride.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/${tenantId}/rides/${ride.id}`} className="block text-sm">
                        <div className="text-white font-medium truncate max-w-[200px] mb-0.5" title={ride.pickupAddress}>
                          <span className="text-xs mr-1 opacity-50">A</span> {ride.pickupAddress}
                        </div>
                        <div className="truncate max-w-[200px]" style={{ color: 'rgba(255,255,255,0.6)' }} title={ride.dropoffAddress}>
                          <span className="text-xs mr-1 opacity-50">B</span> {ride.dropoffAddress}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {ride.purpose || <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#34D399' }}>
                      {ride.passengerIds.length} <span className="font-normal opacity-70">people</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={STATUS_COLORS[ride.status]}>
                        {STATUS_LABELS[ride.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
