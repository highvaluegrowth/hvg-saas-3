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

interface ActiveResident {
  id: string;
  name: string;
  houseId: string | null;
}

function bedStatusVariant(status: BedStatus): 'success' | 'danger' | 'warning' | 'default' {
  switch (status) {
    case 'available': return 'success';
    case 'occupied': return 'danger';
    case 'reserved': return 'warning';
    case 'unavailable': return 'default';
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-white/10 rounded" />
        <div className="h-10 w-28 bg-white/10 rounded" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
        <div className="h-5 w-64 bg-white/10 rounded" />
        <div className="h-5 w-48 bg-white/10 rounded" />
        <div className="h-5 w-32 bg-white/10 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3">
            <div className="h-6 w-32 bg-white/10 rounded" />
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-white/10 rounded-full" />
              <div className="h-6 w-20 bg-white/10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddRoomModal({
  isOpen, onClose, tenantId, houseId, onRoomAdded,
}: {
  isOpen: boolean; onClose: () => void; tenantId: string; houseId: string; onRoomAdded: () => void;
}) {
  const [roomName, setRoomName] = useState('');
  const [roomCapacity, setRoomCapacity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomName.trim()) { setError('Room name is required.'); return; }
    const cap = Number(roomCapacity);
    if (!roomCapacity || isNaN(cap) || cap < 1) { setError('Capacity must be a positive number.'); return; }
    setError(null);
    setSubmitting(true);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/houses/${houseId}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: roomName.trim(), capacity: cap }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || data.error || 'Failed to add room.');
        return;
      }
      setRoomName(''); setRoomCapacity('');
      onRoomAdded(); onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally { setSubmitting(false); }
  }

  function handleClose() { setRoomName(''); setRoomCapacity(''); setError(null); onClose(); }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Room" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3"><p className="text-sm text-red-400">{error}</p></div>}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Room Name <span className="text-red-500">*</span></label>
          <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="e.g. Room 1, Master Suite" className="bg-white/5 border-white/10 text-white placeholder-white/40" />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Capacity <span className="text-red-500">*</span></label>
          <Input value={roomCapacity} onChange={(e) => setRoomCapacity(e.target.value)} placeholder="4" type="number" min="1" className="bg-white/5 border-white/10 text-white placeholder-white/40" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting} className="border-white/10 text-white/70 hover:bg-white/10 bg-transparent">Cancel</Button>
          <Button type="submit" disabled={submitting} className="bg-cyan-600 hover:bg-cyan-700 text-white">{submitting ? 'Adding...' : 'Add Room'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function AddBedModal({
  isOpen, onClose, tenantId, houseId, roomId, onBedAdded,
}: {
  isOpen: boolean; onClose: () => void; tenantId: string; houseId: string; roomId: string; onBedAdded: () => void;
}) {
  const [label, setLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) { setError('Bed label is required.'); return; }
    setError(null);
    setSubmitting(true);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/houses/${houseId}/rooms/${roomId}/beds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label: label.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || data.error || 'Failed to add bed.');
        return;
      }
      setLabel(''); onBedAdded(); onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally { setSubmitting(false); }
  }

  function handleClose() { setLabel(''); setError(null); onClose(); }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Bed" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3"><p className="text-sm text-red-400">{error}</p></div>}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Bed Label <span className="text-red-500">*</span></label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Bed A, Bed 1, Top Bunk" className="bg-white/5 border-white/10 text-white placeholder-white/40" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting} className="border-white/10 text-white/70 hover:bg-white/10 bg-transparent">Cancel</Button>
          <Button type="submit" disabled={submitting} className="bg-cyan-600 hover:bg-cyan-700 text-white">{submitting ? 'Adding...' : 'Add Bed'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function AssignBedModal({
  isOpen, onClose, tenantId, houseId, roomId, bedId, availableResidents, onAssigned,
}: {
  isOpen: boolean; onClose: () => void; tenantId: string; houseId: string; roomId: string; bedId: string;
  availableResidents: ActiveResident[]; onAssigned: () => void;
}) {
  const [residentId, setResidentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!residentId) { setError('Please select a resident.'); return; }
    setError(null);
    setSubmitting(true);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(
        `/api/tenants/${tenantId}/houses/${houseId}/rooms/${roomId}/beds/${bedId}/assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ residentId }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to assign resident.');
        return;
      }
      setResidentId(''); onAssigned(); onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally { setSubmitting(false); }
  }

  function handleClose() { setResidentId(''); setError(null); onClose(); }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assign Resident to Bed" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3"><p className="text-sm text-red-400">{error}</p></div>}
        {availableResidents.length === 0 ? (
          <p className="text-sm text-white/50 py-2">No unassigned active residents found.</p>
        ) : (
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Select Resident <span className="text-red-500">*</span></label>
            <select
              value={residentId}
              onChange={(e) => setResidentId(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">— Choose a resident —</option>
              {availableResidents.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting} className="border-white/10 text-white/70 hover:bg-white/10 bg-transparent">Cancel</Button>
          {availableResidents.length > 0 && (
            <Button type="submit" disabled={submitting || !residentId} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              {submitting ? 'Assigning...' : 'Assign'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

function BedItem({
  bed, tenantId, houseId, roomId, availableResidents, residentName, onRefresh,
}: {
  bed: Bed; tenantId: string; houseId: string; roomId: string;
  availableResidents: ActiveResident[]; residentName?: string; onRefresh: () => void;
}) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [unassigning, setUnassigning] = useState(false);

  async function handleUnassign() {
    setUnassigning(true);
    try {
      const token = await authService.getIdToken();
      await fetch(
        `/api/tenants/${tenantId}/houses/${houseId}/rooms/${roomId}/beds/${bed.id}/assign`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      onRefresh();
    } catch {
      // silent — page will not change, user can retry
    } finally { setUnassigning(false); }
  }

  const isOccupied = bed.status === 'occupied';

  return (
    <div
      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Badge variant={bedStatusVariant(bed.status)} className="shrink-0">
          {bed.label}
        </Badge>
        <span className="text-sm truncate" style={{ color: isOccupied ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)' }}>
          {isOccupied ? (residentName ?? 'Occupied') : bed.status === 'available' ? 'Available' : bed.status}
        </span>
      </div>
      <div className="shrink-0">
        {isOccupied ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnassign}
            disabled={unassigning}
            className="border-white/10 text-white/50 hover:text-red-400 hover:border-red-500/40 bg-transparent text-xs"
          >
            {unassigning ? '...' : 'Unassign'}
          </Button>
        ) : bed.status === 'available' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAssignOpen(true)}
            className="border-white/10 text-cyan-400 hover:bg-cyan-500/10 bg-transparent text-xs"
          >
            Assign
          </Button>
        ) : null}
      </div>

      {assignOpen && (
        <AssignBedModal
          isOpen={assignOpen}
          onClose={() => setAssignOpen(false)}
          tenantId={tenantId}
          houseId={houseId}
          roomId={roomId}
          bedId={bed.id}
          availableResidents={availableResidents}
          onAssigned={onRefresh}
        />
      )}
    </div>
  );
}

function RoomCard({
  room, tenantId, houseId, availableResidents, residentNameMap, onRefresh,
}: {
  room: RoomWithBeds; tenantId: string; houseId: string;
  availableResidents: ActiveResident[]; residentNameMap: Record<string, string>; onRefresh: () => void;
}) {
  const [addBedOpen, setAddBedOpen] = useState(false);

  return (
    <Card className="bg-white/5 border border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base text-white">{room.name}</CardTitle>
            <p className="text-sm text-white/50 mt-0.5">Capacity: {room.capacity}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddBedOpen(true)}
            className="border-white/10 text-white/70 hover:bg-white/10 bg-transparent"
          >
            Add Bed
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {room.beds && room.beds.length > 0 ? (
          <div className="space-y-2">
            {room.beds.map((bed) => (
              <BedItem
                key={bed.id}
                bed={bed}
                tenantId={tenantId}
                houseId={houseId}
                roomId={room.id}
                availableResidents={availableResidents}
                residentName={bed.residentId ? residentNameMap[bed.residentId] : undefined}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/40 italic">No beds yet. Add a bed to get started.</p>
        )}
      </CardContent>

      {addBedOpen && (
        <AddBedModal
          isOpen={addBedOpen}
          onClose={() => setAddBedOpen(false)}
          tenantId={tenantId}
          houseId={houseId}
          roomId={room.id}
          onBedAdded={onRefresh}
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
  const [activeResidents, setActiveResidents] = useState<ActiveResident[]>([]);

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
      setHouse({ ...data.house, rooms: data.rooms });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, houseId]);

  const fetchResidents = useCallback(async () => {
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/residents?status=active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setActiveResidents(
        (data.residents ?? []).map((r: any) => ({ id: r.id, name: r.name, houseId: r.houseId ?? null }))
      );
    } catch {
      // non-critical — assignment dropdown just won't populate
    }
  }, [tenantId]);

  useEffect(() => {
    fetchHouse();
    fetchResidents();
  }, [fetchHouse, fetchResidents]);

  const handleRefresh = useCallback(() => {
    fetchHouse();
    fetchResidents();
  }, [fetchHouse, fetchResidents]);

  // Residents available for assignment (no house yet or in this house already but unassigned from a bed)
  const availableResidents = activeResidents.filter((r) => !r.houseId || r.houseId === houseId);

  // Map residentId → name for bed labels
  const residentNameMap = activeResidents.reduce<Record<string, string>>((acc, r) => {
    acc[r.id] = r.name;
    return acc;
  }, {});

  if (loading) return <LoadingSkeleton />;

  if (error || !house) {
    return (
      <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4">
        <p className="text-sm text-red-400">{error || 'House not found.'}</p>
        <Link href={`/${tenantId}/houses`} className="mt-2 inline-block text-sm text-cyan-600 hover:underline">
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
            <Link href={`/${tenantId}/houses`} className="text-sm text-white/50 hover:text-cyan-400">Houses</Link>
            <span className="text-white/20">/</span>
            <span className="text-sm text-white/90">{house.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{house.name}</h1>
        </div>
        <Link href={`/${tenantId}/houses/${houseId}/edit`}>
          <Button variant="outline" className="border-white/10 text-white/70 hover:bg-white/10 bg-transparent">Edit House</Button>
        </Link>
      </div>

      {/* House Details */}
      <Card className="bg-white/5 border border-white/10">
        <CardHeader>
          <CardTitle className="text-lg text-white">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Address</p>
              {house.address ? (
                <>
                  <p className="text-sm text-white/90">{house.address.street}</p>
                  <p className="text-sm text-white/90">{house.address.city}, {house.address.state} {house.address.zip}</p>
                </>
              ) : (
                <p className="text-sm text-white/30 italic">No address provided</p>
              )}
            </div>
            {house.phone && (
              <div>
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Phone</p>
                <p className="text-sm text-white/90">{house.phone}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Capacity</p>
              <p className="text-sm text-white/90">{house.capacity} beds</p>
            </div>
            <div>
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Status</p>
              <Badge variant={statusVariant}>{house.status === 'active' ? 'Active' : 'Inactive'}</Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Manager</p>
              <p className="text-sm text-white/90">{house.managerId || <span className="text-white/30 italic">Unassigned</span>}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rooms Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Rooms
            {house.rooms && house.rooms.length > 0 && (
              <span className="ml-2 text-sm font-normal text-white/40">({house.rooms.length})</span>
            )}
          </h2>
          <Button onClick={() => setAddRoomOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            Add Room
          </Button>
        </div>

        {!house.rooms || house.rooms.length === 0 ? (
          <div className="text-center py-10 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-white/50 text-sm">No rooms yet.</p>
            <p className="text-white/30 text-sm mt-1">Add a room to start tracking beds and occupancy.</p>
            <Button className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => setAddRoomOpen(true)}>
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
                availableResidents={availableResidents}
                residentNameMap={residentNameMap}
                onRefresh={handleRefresh}
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
        onRoomAdded={handleRefresh}
      />
    </div>
  );
}
