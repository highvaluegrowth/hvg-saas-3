'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { authService } from '@/features/auth/services/authService';
import type { House, Room, Bed, BedStatus } from '@/features/houses/types/house.types';

interface HouseDetailPageProps {
  params: Promise<{ tenantId: string; houseId: string }>;
}

interface HouseWithRooms extends House {
  rooms?: RoomWithBeds[];
}

interface RoomWithBeds extends Room {
  beds?: Bed[];
}

function bedStatusVariant(status: BedStatus): 'success' | 'danger' | 'warning' | 'default' {
  switch (status) {
    case 'available': return 'success';
    case 'occupied': return 'danger';
    case 'reserved': return 'warning';
    case 'unavailable': return 'default';
  }
}

function bedStatusLabel(status: BedStatus): string {
  switch (status) {
    case 'available': return 'Available';
    case 'occupied': return 'Occupied';
    case 'reserved': return 'Reserved';
    case 'unavailable': return 'Unavailable';
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-10 w-28 bg-gray-200 rounded" />
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="h-5 w-64 bg-gray-200 rounded" />
        <div className="h-5 w-48 bg-gray-200 rounded" />
        <div className="h-5 w-32 bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
            <div className="h-6 w-32 bg-gray-200 rounded" />
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddRoomModal({
  isOpen,
  onClose,
  tenantId,
  houseId,
  onRoomAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  houseId: string;
  onRoomAdded: () => void;
}) {
  const [roomName, setRoomName] = useState('');
  const [roomCapacity, setRoomCapacity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomName.trim()) {
      setError('Room name is required.');
      return;
    }
    const cap = Number(roomCapacity);
    if (!roomCapacity || isNaN(cap) || cap < 1) {
      setError('Capacity must be a positive number.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/houses/${houseId}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: roomName.trim(), capacity: cap }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || data.error || 'Failed to add room.');
        return;
      }

      setRoomName('');
      setRoomCapacity('');
      onRoomAdded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setRoomName('');
    setRoomCapacity('');
    setError(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Room" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g. Room 1, Master Suite"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capacity <span className="text-red-500">*</span>
          </label>
          <Input
            value={roomCapacity}
            onChange={(e) => setRoomCapacity(e.target.value)}
            placeholder="4"
            type="number"
            min="1"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {submitting ? 'Adding...' : 'Add Room'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AddBedModal({
  isOpen,
  onClose,
  tenantId,
  houseId,
  roomId,
  onBedAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  houseId: string;
  roomId: string;
  onBedAdded: () => void;
}) {
  const [label, setLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      setError('Bed label is required.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const token = await authService.getIdToken();
      const res = await fetch(
        `/api/tenants/${tenantId}/houses/${houseId}/rooms/${roomId}/beds`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ label: label.trim() }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || data.error || 'Failed to add bed.');
        return;
      }

      setLabel('');
      onBedAdded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setLabel('');
    setError(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Bed" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bed Label <span className="text-red-500">*</span>
          </label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Bed A, Bed 1, Top Bunk"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {submitting ? 'Adding...' : 'Add Bed'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RoomCard({
  room,
  tenantId,
  houseId,
  onBedAdded,
}: {
  room: RoomWithBeds;
  tenantId: string;
  houseId: string;
  onBedAdded: () => void;
}) {
  const [addBedOpen, setAddBedOpen] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState('');

  function openAddBed() {
    setTargetRoomId(room.id);
    setAddBedOpen(true);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{room.name}</CardTitle>
            <p className="text-sm text-gray-500 mt-0.5">Capacity: {room.capacity}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={openAddBed}
          >
            Add Bed
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {room.beds && room.beds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {room.beds.map((bed) => (
              <Badge key={bed.id} variant={bedStatusVariant(bed.status)}>
                {bed.label} &middot; {bedStatusLabel(bed.status)}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No beds yet. Add a bed to get started.</p>
        )}
      </CardContent>

      {addBedOpen && (
        <AddBedModal
          isOpen={addBedOpen}
          onClose={() => setAddBedOpen(false)}
          tenantId={tenantId}
          houseId={houseId}
          roomId={targetRoomId}
          onBedAdded={onBedAdded}
        />
      )}
    </Card>
  );
}

export default function HouseDetailPage({ params }: HouseDetailPageProps) {
  const { tenantId, houseId } = use(params);

  const [house, setHouse] = useState<HouseWithRooms | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addRoomOpen, setAddRoomOpen] = useState(false);

  const fetchHouse = useCallback(async () => {
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/houses/${houseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Failed to load house.');
      }
      const data = await res.json();
      setHouse(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, houseId]);

  useEffect(() => {
    fetchHouse();
  }, [fetchHouse]);

  if (loading) return <LoadingSkeleton />;

  if (error || !house) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-700">{error || 'House not found.'}</p>
        <Link href={`/${tenantId}/houses`} className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
          Back to houses
        </Link>
      </div>
    );
  }

  const statusVariant = house.status === 'active' ? 'success' : 'default';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/${tenantId}/houses`} className="text-sm text-gray-500 hover:text-indigo-600">
              Houses
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-900">{house.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{house.name}</h1>
        </div>
        <Link href={`/${tenantId}/houses/${houseId}/edit`}>
          <Button variant="outline">Edit House</Button>
        </Link>
      </div>

      {/* House Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Address</p>
              {house.address ? (
                <>
                  <p className="text-sm text-gray-900">{house.address.street}</p>
                  <p className="text-sm text-gray-900">
                    {house.address.city}, {house.address.state} {house.address.zip}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400 italic">No address provided</p>
              )}
            </div>
            {house.phone && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                <p className="text-sm text-gray-900">{house.phone}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Capacity</p>
              <p className="text-sm text-gray-900">{house.capacity} beds</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <Badge variant={statusVariant}>
                {house.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Manager</p>
              <p className="text-sm text-gray-900">
                {house.managerId || <span className="text-gray-400 italic">Unassigned</span>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rooms Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Rooms
            {house.rooms && house.rooms.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({house.rooms.length})
              </span>
            )}
          </h2>
          <Button
            onClick={() => setAddRoomOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Add Room
          </Button>
        </div>

        {!house.rooms || house.rooms.length === 0 ? (
          <div className="text-center py-10 bg-white border border-gray-200 rounded-lg">
            <p className="text-gray-500 text-sm">No rooms yet.</p>
            <p className="text-gray-400 text-sm mt-1">Add a room to start tracking beds and occupancy.</p>
            <Button
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => setAddRoomOpen(true)}
            >
              Add First Room
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {house.rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                tenantId={tenantId}
                houseId={houseId}
                onBedAdded={fetchHouse}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Room Modal */}
      <AddRoomModal
        isOpen={addRoomOpen}
        onClose={() => setAddRoomOpen(false)}
        tenantId={tenantId}
        houseId={houseId}
        onRoomAdded={fetchHouse}
      />
    </div>
  );
}
