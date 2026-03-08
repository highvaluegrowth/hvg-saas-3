'use client';

import { use } from 'react';
import Link from 'next/link';
import { useVehicles } from '@/features/vehicles/hooks/useVehicles';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { canWrite } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  retired: 'bg-gray-100 text-gray-800',
};

const MAINTENANCE_TYPE_LABELS: Record<string, string> = {
  oil_change: 'Oil Change',
  tire: 'Tire',
  inspection: 'Inspection',
  repair: 'Repair',
  other: 'Other',
};

export default function VehiclesPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  const { vehicles, loading, error } = useVehicles(tenantId);

  const { user } = useAuth();
  const userCanWrite = user?.role ? canWrite(user.role as UserRole) : false;

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fleet Management</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}</p>
        </div>
        {userCanWrite && (
          <Link href={`/${tenantId}/vehicles/new`}>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">Add Vehicle</Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      {vehicles.length === 0 ? (
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4" style={{ background: 'rgba(8,145,178,0.15)' }}>
              <svg className="w-8 h-8" style={{ color: '#67E8F9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <p className="text-white text-lg font-semibold mb-1">No vehicles yet</p>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>Add your first vehicle to start managing your fleet</p>
            {userCanWrite && (
              <Link href={`/${tenantId}/vehicles/new`} className="inline-block">
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">Add Vehicle</Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Vehicle</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>License Plate</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Seats</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Mileage</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Status</th>
                  <th className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-white/5 transition-colors cursor-pointer text-sm">
                    <td className="px-6 py-4">
                      <Link href={`/${tenantId}/vehicles/${vehicle.id}`} className="block">
                        <div className="font-medium text-white transition-colors hover:underline" style={{ color: '#67E8F9' }}>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          <span>{vehicle.color}</span>
                          {vehicle.wheelchairAccessible && (
                            <span className="text-blue-400 text-xs font-medium">♿ Accessible</span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{vehicle.licensePlate}</td>
                    <td className="px-6 py-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{vehicle.seats}</td>
                    <td className="px-6 py-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{vehicle.currentMileage.toLocaleString()} mi</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[vehicle.status] ?? 'bg-white/10 text-white/80'}`}>
                        {vehicle.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/${tenantId}/vehicles/${vehicle.id}/edit`}>
                        <Button variant="outline" size="sm" className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white">Edit</Button>
                      </Link>
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
