'use client';

import { use } from 'react';
import Link from 'next/link';
import { useVehicles } from '@/features/vehicles/hooks/useVehicles';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/features/auth/hooks/useAuth';
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-sm text-gray-500 mt-1">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}</p>
        </div>
        {userCanWrite && (
          <Link href={`/${tenantId}/vehicles/new`}>
            <Button>+ Add Vehicle</Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      {vehicles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">No vehicles yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first vehicle to start managing your fleet</p>
          {userCanWrite && (
            <Link href={`/${tenantId}/vehicles/new`} className="mt-4 inline-block">
              <Button>Add Vehicle</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Plate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seats</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mileage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4">
                    <Link href={`/${tenantId}/vehicles/${vehicle.id}`} className="block">
                      <div className="font-medium text-gray-900">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span>{vehicle.color}</span>
                        {vehicle.wheelchairAccessible && (
                          <span className="text-blue-600 text-xs font-medium">♿ Accessible</span>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{vehicle.licensePlate}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{vehicle.seats}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{vehicle.currentMileage.toLocaleString()} mi</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[vehicle.status] ?? 'bg-gray-100 text-gray-800'}`}>
                      {vehicle.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <Link href={`/${tenantId}/vehicles/${vehicle.id}/edit`} className="text-blue-600 hover:text-blue-800">
                      Edit
                    </Link>
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
