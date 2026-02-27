'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRides } from '@/features/rides/hooks/useRides';
import { Ride, RideStatus } from '@/features/rides/types/ride.types';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { canWrite } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';

const STATUS_COLORS: Record<RideStatus, string> = {
  requested: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  assigned: 'bg-cyan-100 text-cyan-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
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
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transportation</h1>
          <p className="text-sm text-gray-500 mt-1">{rides.length} ride{rides.length !== 1 ? 's' : ''} total</p>
        </div>
        {userCanWrite && (
          <Link href={`/${tenantId}/rides/new`}>
            <Button>+ Schedule Ride</Button>
          </Link>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-800 px-4 py-3 rounded-md text-sm">{error}</div>}

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap border-b border-gray-200">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${filter === f.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            {f.label}
            {f.value !== 'all' && (
              <span className="ml-1 text-xs text-gray-400">
                ({rides.filter((r) => r.status === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">No rides{filter !== 'all' ? ` with status "${STATUS_LABELS[filter as RideStatus]}"` : ''}</p>
          {userCanWrite && (
            <Link href={`/${tenantId}/rides/new`} className="mt-4 inline-block">
              <Button>Schedule a Ride</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passengers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((ride) => (
                <tr key={ride.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4">
                    <Link href={`/${tenantId}/rides/${ride.id}`} className="block">
                      <div className="font-medium text-gray-900">
                        {new Date(ride.scheduledAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(ride.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/${tenantId}/rides/${ride.id}`} className="block text-sm">
                      <div className="text-gray-900 truncate max-w-xs">{ride.pickupAddress}</div>
                      <div className="text-gray-500 truncate max-w-xs">→ {ride.dropoffAddress}</div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {ride.purpose || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {ride.passengerIds.length}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ride.status]}`}>
                      {STATUS_LABELS[ride.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
