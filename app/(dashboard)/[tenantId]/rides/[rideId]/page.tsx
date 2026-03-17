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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-8 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-48 bg-white/10 rounded" />
      </div>
    );
  if (!ride) return <div className="p-6 text-red-400">Ride not found</div>;

  const nextStatuses = STATUS_TRANSITIONS[ride.status];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ride Details</h1>
          <p className="text-sm text-white/50 mt-1">
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
            <Button variant="outline" className="border-white/10 text-white/70 hover:bg-white/10 bg-transparent">← Back</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      <Card className="bg-white/5 border border-white/10">
        <CardHeader>
          <CardTitle className="text-lg text-white font-semibold">Trip Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">
                Pickup
              </p>
              <p className="text-white/90">{ride.pickupAddress}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">
                Dropoff
              </p>
              <p className="text-white/90">{ride.dropoffAddress}</p>
            </div>
          </div>
          {ride.purpose && (
            <div>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">
                Purpose
              </p>
              <p className="text-white/90">{ride.purpose}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">
                Requested By
              </p>
              <p className="text-white/90 capitalize">{ride.requestedByType}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">
                Passengers
              </p>
              <p className="text-white/90">
                {passengerIds.length === 0
                  ? 'None assigned'
                  : `${passengerIds.length} passenger(s)`}
              </p>
            </div>
          </div>
          {ride.notes && (
            <div>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">
                Notes
              </p>
              <p className="text-white/70">{ride.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Card */}
      {userCanWrite && ride.status !== 'completed' && ride.status !== 'cancelled' && (
        <Card className="bg-white/5 border border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white font-semibold">Assignment</CardTitle>
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
              <label className="block text-sm font-medium text-white/80 mb-1">Vehicle</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 scheme-dark"
              >
                <option value="" className="bg-[#0C1A2E]">-- No vehicle assigned --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id} className="bg-[#0C1A2E]">
                    {v.year} {v.make} {v.model} ({v.licensePlate})
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleAssignmentUpdate}
                disabled={updating}
                className="border-white/10 text-white/70 hover:bg-white/10 bg-transparent"
              >
                {updating ? 'Saving...' : 'Save Assignment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Progression */}
      {nextStatuses.length > 0 && (
        <Card className="bg-white/5 border border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white font-semibold">Update Status</CardTitle>
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
                  className={status === 'cancelled' ? 'border-white/10 text-white/70 hover:bg-white/10 bg-transparent' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}
                >
                  {updating ? 'Updating...' : `Mark as ${STATUS_LABELS[status]}`}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(ride.status === 'completed' || ride.status === 'cancelled') && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center text-sm text-white/50">
          This ride is {STATUS_LABELS[ride.status].toLowerCase()} and cannot be modified.
        </div>
      )}
    </div>
  );
}
