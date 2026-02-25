'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { authService } from '@/features/auth/services/authService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Ride, RideStatus } from '@/features/rides/types/ride.types';
import { useVehicles } from '@/features/vehicles/hooks/useVehicles';
import { canWrite } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ResidentSelector } from '@/components/ui/ResidentSelector';
import { StaffSelector } from '@/components/ui/StaffSelector';

const STATUS_COLORS: Record<RideStatus, string> = {
  requested: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  assigned: 'bg-purple-100 text-purple-800',
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

const STATUS_TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  requested: ['approved', 'cancelled'],
  approved: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export default function RideDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string; rideId: string }>;
}) {
  const { tenantId, rideId } = use(params);
  const { user } = useAuth();
  const userCanWrite = user?.role ? canWrite(user.role as UserRole) : false;
  const { vehicles } = useVehicles(tenantId);

  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState<string[]>([]);
  const [passengerIds, setPassengerIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const token = await authService.getIdToken();
        const res = await fetch(`/api/tenants/${tenantId}/rides/${rideId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load ride');
        setRide(data.ride);
        setPassengerIds(data.ride.passengerIds ?? []);
        setDriverId(data.ride.driverId ? [data.ride.driverId] : []);
        setVehicleId(data.ride.vehicleId ?? '');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRide();
  }, [tenantId, rideId]);

  const handleStatusUpdate = async (newStatus: RideStatus) => {
    if (!ride) return;
    setUpdating(true);
    setError('');
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: newStatus,
          vehicleId: vehicleId || undefined,
          driverId: driverId[0] || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update ride');
      setRide((prev) => (prev ? { ...prev, status: newStatus } : prev));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignmentUpdate = async () => {
    if (!ride) return;
    setUpdating(true);
    setError('');
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          vehicleId: vehicleId || undefined,
          driverId: driverId[0] || undefined,
          passengerIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update assignment');
      setRide((prev) =>
        prev
          ? {
              ...prev,
              vehicleId: vehicleId || undefined,
              driverId: driverId[0] || undefined,
              passengerIds,
            }
          : prev
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-48 bg-gray-200 rounded" />
      </div>
    );
  if (!ride) return <div className="p-6 text-red-600">Ride not found</div>;

  const nextStatuses = STATUS_TRANSITIONS[ride.status];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ride Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(ride.scheduledAt).toLocaleDateString()} at{' '}
            {new Date(ride.scheduledAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[ride.status]}`}
          >
            {STATUS_LABELS[ride.status]}
          </span>
          <Link href={`/${tenantId}/rides`}>
            <Button variant="outline">← Back</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Trip Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">
                Pickup
              </p>
              <p className="text-gray-900">{ride.pickupAddress}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">
                Dropoff
              </p>
              <p className="text-gray-900">{ride.dropoffAddress}</p>
            </div>
          </div>
          {ride.purpose && (
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">
                Purpose
              </p>
              <p className="text-gray-900">{ride.purpose}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">
                Requested By
              </p>
              <p className="text-gray-900 capitalize">{ride.requestedByType}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">
                Passengers
              </p>
              <p className="text-gray-900">
                {passengerIds.length === 0
                  ? 'None assigned'
                  : `${passengerIds.length} passenger(s)`}
              </p>
            </div>
          </div>
          {ride.notes && (
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">
                Notes
              </p>
              <p className="text-gray-700">{ride.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Card */}
      {userCanWrite && ride.status !== 'completed' && ride.status !== 'cancelled' && (
        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ResidentSelector
              tenantId={tenantId}
              selectedIds={passengerIds}
              onChange={setPassengerIds}
              label="Passengers"
            />
            <StaffSelector
              tenantId={tenantId}
              selectedIds={driverId}
              onChange={setDriverId}
              label="Driver"
              singleSelect={true}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— No vehicle assigned —</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.year} {v.make} {v.model} ({v.licensePlate})
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAssignmentUpdate}
              disabled={updating}
            >
              {updating ? 'Saving...' : 'Save Assignment'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status Progression */}
      {nextStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {nextStatuses.map((status) => (
                <Button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updating}
                  variant={status === 'cancelled' ? 'outline' : 'default'}
                  size="sm"
                >
                  {updating ? 'Updating...' : `Mark as ${STATUS_LABELS[status]}`}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(ride.status === 'completed' || ride.status === 'cancelled') && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
          This ride is {STATUS_LABELS[ride.status].toLowerCase()} and cannot be modified.
        </div>
      )}
    </div>
  );
}
