'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { authService } from '@/features/auth/services/authService';
import type { House, Room, Bed, BedStatus } from '@/features/houses/types/house.types';

interface EditHousePageProps {
  params: Promise<{ tenantId: string; houseId: string }>;
}

interface FormErrors {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  capacity?: string;
  general?: string;
}

type RoomWithBeds = Room & { beds: Bed[] };

const US_STATES = [
  { value: '', label: 'Select state...' },
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const BED_STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'unavailable', label: 'Unavailable' },
];

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

export default function EditHousePage({ params }: EditHousePageProps) {
  const { tenantId, houseId } = use(params);
  const router = useRouter();

  const [loadingHouse, setLoadingHouse] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // House form fields
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Rooms data
  const [rooms, setRooms] = useState<RoomWithBeds[]>([]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Edit Room modal
  const [editRoomOpen, setEditRoomOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomCapacity, setEditRoomCapacity] = useState('');
  const [editRoomSaving, setEditRoomSaving] = useState(false);
  const [editRoomError, setEditRoomError] = useState<string | null>(null);

  // Delete Room modal
  const [deleteRoomOpen, setDeleteRoomOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [deleteRoomBusy, setDeleteRoomBusy] = useState(false);
  const [deleteRoomError, setDeleteRoomError] = useState<string | null>(null);

  // Edit Bed modal
  const [editBedOpen, setEditBedOpen] = useState(false);
  const [editingBed, setEditingBed] = useState<Bed | null>(null);
  const [editingBedRoomId, setEditingBedRoomId] = useState('');
  const [editBedLabel, setEditBedLabel] = useState('');
  const [editBedStatus, setEditBedStatus] = useState<BedStatus>('available');
  const [editBedSaving, setEditBedSaving] = useState(false);
  const [editBedError, setEditBedError] = useState<string | null>(null);

  // Delete Bed modal
  const [deleteBedOpen, setDeleteBedOpen] = useState(false);
  const [deletingBed, setDeletingBed] = useState<Bed | null>(null);
  const [deletingBedRoomId, setDeletingBedRoomId] = useState('');
  const [deleteBedBusy, setDeleteBedBusy] = useState(false);
  const [deleteBedError, setDeleteBedError] = useState<string | null>(null);

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
      const { house, rooms: fetchedRooms } = await res.json() as { house: House; rooms: RoomWithBeds[] };
      setName(house.name);
      setStreet(house.address.street);
      setCity(house.address.city);
      setState(house.address.state);
      setZip(house.address.zip);
      setPhone(house.phone ?? '');
      setCapacity(String(house.capacity));
      setStatus(house.status);
      setRooms(fetchedRooms ?? []);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoadingHouse(false);
    }
  }, [tenantId, houseId]);

  useEffect(() => {
    fetchHouse();
  }, [fetchHouse]);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = 'House name is required.';
    if (!street.trim()) errs.street = 'Street address is required.';
    if (!city.trim()) errs.city = 'City is required.';
    if (!state) errs.state = 'State is required.';
    if (!zip.trim()) errs.zip = 'ZIP code is required.';
    const cap = Number(capacity);
    if (!capacity || isNaN(cap) || cap < 1) {
      errs.capacity = 'Capacity must be a positive number.';
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const token = await authService.getIdToken();
      const body: Partial<House> & { address: House['address'] } = {
        name: name.trim(),
        address: {
          street: street.trim(),
          city: city.trim(),
          state,
          zip: zip.trim(),
        },
        capacity: Number(capacity),
        status,
        phone: phone.trim() || undefined,
      };

      const res = await fetch(`/api/tenants/${tenantId}/houses/${houseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.errors && typeof data.errors === 'object') {
          const fieldErrors: FormErrors = {};
          for (const [field, messages] of Object.entries(data.errors)) {
            const msg = Array.isArray(messages) ? messages[0] : String(messages);
            (fieldErrors as Record<string, string>)[field] = msg;
          }
          setErrors(fieldErrors);
        } else {
          setErrors({ general: data.message || data.error || 'Failed to update house. Please try again.' });
        }
        return;
      }

      router.push(`/${tenantId}/houses/${houseId}`);
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : 'An unexpected error occurred.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);

    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/houses/${houseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.message || data.error || 'Failed to delete house. Please try again.');
        return;
      }

      router.push(`/${tenantId}/houses`);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setDeleting(false);
    }
  }

  // Room handlers
  function openEditRoom(room: Room) {
    setEditingRoom(room);
    setEditRoomName(room.name);
    setEditRoomCapacity(String(room.capacity));
    setEditRoomError(null);
    setEditRoomOpen(true);
  }

  async function handleEditRoom() {
    if (!editingRoom) return;
    setEditRoomSaving(true);
    setEditRoomError(null);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(
        `/api/tenants/${tenantId}/houses/${houseId}/rooms/${editingRoom.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: editRoomName.trim(), capacity: Number(editRoomCapacity) }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setEditRoomError(data.error || 'Failed to update room.');
        return;
      }
      setEditRoomOpen(false);
      setEditingRoom(null);
      await fetchHouse();
    } catch (err: unknown) {
      setEditRoomError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setEditRoomSaving(false);
    }
  }

  function openDeleteRoom(room: Room) {
    setDeletingRoom(room);
    setDeleteRoomError(null);
    setDeleteRoomOpen(true);
  }

  async function handleDeleteRoom() {
    if (!deletingRoom) return;
    setDeleteRoomBusy(true);
    setDeleteRoomError(null);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(
        `/api/tenants/${tenantId}/houses/${houseId}/rooms/${deletingRoom.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteRoomError(data.error || 'Failed to delete room.');
        return;
      }
      setDeleteRoomOpen(false);
      setDeletingRoom(null);
      await fetchHouse();
    } catch (err: unknown) {
      setDeleteRoomError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setDeleteRoomBusy(false);
    }
  }

  // Bed handlers
  function openEditBed(bed: Bed, roomId: string) {
    setEditingBed(bed);
    setEditingBedRoomId(roomId);
    setEditBedLabel(bed.label);
    setEditBedStatus(bed.status);
    setEditBedError(null);
    setEditBedOpen(true);
  }

  async function handleEditBed() {
    if (!editingBed) return;
    setEditBedSaving(true);
    setEditBedError(null);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(
        `/api/tenants/${tenantId}/houses/${houseId}/rooms/${editingBedRoomId}/beds/${editingBed.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ label: editBedLabel.trim(), status: editBedStatus }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setEditBedError(data.error || 'Failed to update bed.');
        return;
      }
      setEditBedOpen(false);
      setEditingBed(null);
      await fetchHouse();
    } catch (err: unknown) {
      setEditBedError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setEditBedSaving(false);
    }
  }

  function openDeleteBed(bed: Bed, roomId: string) {
    setDeletingBed(bed);
    setDeletingBedRoomId(roomId);
    setDeleteBedError(null);
    setDeleteBedOpen(true);
  }

  async function handleDeleteBed() {
    if (!deletingBed) return;
    setDeleteBedBusy(true);
    setDeleteBedError(null);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(
        `/api/tenants/${tenantId}/houses/${houseId}/rooms/${deletingBedRoomId}/beds/${deletingBed.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteBedError(data.error || 'Failed to delete bed.');
        return;
      }
      setDeleteBedOpen(false);
      setDeletingBed(null);
      await fetchHouse();
    } catch (err: unknown) {
      setDeleteBedError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setDeleteBedBusy(false);
    }
  }

  if (loadingHouse) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-700">{loadError}</p>
        <Link href={`/${tenantId}/houses`} className="mt-2 inline-block text-sm text-cyan-600 hover:underline">
          Back to houses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/${tenantId}/houses`} className="text-sm text-gray-500 hover:text-cyan-600">
            Houses
          </Link>
          <span className="text-gray-400">/</span>
          <Link href={`/${tenantId}/houses/${houseId}`} className="text-sm text-gray-500 hover:text-cyan-600">
            {name}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-sm text-gray-900">Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit House</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">House Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            )}

            {/* House Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                House Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sunrise Recovery House"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Address */}
            <fieldset>
              <legend className="text-sm font-medium text-white mb-2">Address</legend>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-white mb-1">
                    Street <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="123 Main St"
                    className={errors.street ? 'border-red-500' : ''}
                  />
                  {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-white mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Springfield"
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-white mb-1">
                      ZIP Code <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="12345"
                      className={errors.zip ? 'border-red-500' : ''}
                    />
                    {errors.zip && <p className="mt-1 text-sm text-red-600">{errors.zip}</p>}
                  </div>
                </div>

                <div>
                  <Select
                    label="State *"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    options={US_STATES}
                    error={errors.state}
                  />
                </div>
              </div>
            </fieldset>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Phone Number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 000-0000"
                type="tel"
              />
            </div>

            {/* Capacity and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Capacity <span className="text-red-500">*</span>
                </label>
                <Input
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="10"
                  type="number"
                  min="1"
                  className={errors.capacity ? 'border-red-500' : ''}
                />
                {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
              </div>
              <div>
                <Select
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  options={STATUS_OPTIONS}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
              <Link href={`/${tenantId}/houses/${houseId}`}>
                <Button type="button" variant="outline" disabled={submitting}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Rooms & Beds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rooms &amp; Beds</CardTitle>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <p className="text-sm text-gray-500">No rooms have been added to this house yet.</p>
          ) : (
            <div className="space-y-6">
              {rooms.map((room) => (
                <div key={room.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  {/* Room header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{room.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Capacity: {room.capacity}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="text-xs h-8 px-3"
                        onClick={() => openEditRoom(room)}
                      >
                        Edit Room
                      </Button>
                      <Button
                        type="button"
                        className="text-xs h-8 px-3 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => openDeleteRoom(room)}
                      >
                        Delete Room
                      </Button>
                    </div>
                  </div>

                  {/* Beds */}
                  {room.beds && room.beds.length > 0 ? (
                    <div className="space-y-2 pl-4 border-l border-gray-100">
                      {room.beds.map((bed) => (
                        <div key={bed.id} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-800">{bed.label}</span>
                            <Badge variant={bedStatusVariant(bed.status)}>
                              {bedStatusLabel(bed.status)}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="text-xs h-7 px-2"
                              onClick={() => openEditBed(bed, room.id)}
                            >
                              Edit Bed
                            </Button>
                            <Button
                              type="button"
                              className="text-xs h-7 px-2 bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => openDeleteBed(bed, room.id)}
                            >
                              Delete Bed
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="pl-4 text-xs text-gray-400">No beds in this room.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-white">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Delete this house</p>
              <p className="text-sm text-white mt-0.5">
                Permanently remove this house and all associated data. This cannot be undone.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteModalOpen(true)}
              className="ml-4 shrink-0 bg-red-600 hover:bg-red-700 text-white"
            >
              Delete House
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete House Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setDeleteError(null);
          }
        }}
        title="Delete House"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <strong>{name}</strong>? This action is permanent and
            cannot be undone. All rooms, beds, and associated data will be removed.
          </p>

          {deleteError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{deleteError}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteError(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete House'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Room Modal */}
      <Modal
        isOpen={editRoomOpen}
        onClose={() => {
          if (!editRoomSaving) {
            setEditRoomOpen(false);
            setEditingRoom(null);
            setEditRoomError(null);
          }
        }}
        title="Edit Room"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Room Name</label>
            <Input
              value={editRoomName}
              onChange={(e) => setEditRoomName(e.target.value)}
              placeholder="e.g. Room A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Capacity</label>
            <Input
              value={editRoomCapacity}
              onChange={(e) => setEditRoomCapacity(e.target.value)}
              type="number"
              min="1"
              placeholder="4"
            />
          </div>
          {editRoomError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{editRoomError}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditRoomOpen(false);
                setEditingRoom(null);
                setEditRoomError(null);
              }}
              disabled={editRoomSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleEditRoom}
              disabled={editRoomSaving}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {editRoomSaving ? 'Saving...' : 'Save Room'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Room Modal */}
      <Modal
        isOpen={deleteRoomOpen}
        onClose={() => {
          if (!deleteRoomBusy) {
            setDeleteRoomOpen(false);
            setDeletingRoom(null);
            setDeleteRoomError(null);
          }
        }}
        title="Delete Room"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <strong>{deletingRoom?.name}</strong>? All beds in this
            room will also be removed. This cannot be undone.
          </p>
          {deleteRoomError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{deleteRoomError}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteRoomOpen(false);
                setDeletingRoom(null);
                setDeleteRoomError(null);
              }}
              disabled={deleteRoomBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteRoom}
              disabled={deleteRoomBusy}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteRoomBusy ? 'Deleting...' : 'Yes, Delete Room'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Bed Modal */}
      <Modal
        isOpen={editBedOpen}
        onClose={() => {
          if (!editBedSaving) {
            setEditBedOpen(false);
            setEditingBed(null);
            setEditBedError(null);
          }
        }}
        title="Edit Bed"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Bed Label</label>
            <Input
              value={editBedLabel}
              onChange={(e) => setEditBedLabel(e.target.value)}
              placeholder="e.g. Bed 1"
            />
          </div>
          <div>
            <Select
              label="Status"
              value={editBedStatus}
              onChange={(e) => setEditBedStatus(e.target.value as BedStatus)}
              options={BED_STATUS_OPTIONS}
            />
          </div>
          {editBedError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{editBedError}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditBedOpen(false);
                setEditingBed(null);
                setEditBedError(null);
              }}
              disabled={editBedSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleEditBed}
              disabled={editBedSaving}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {editBedSaving ? 'Saving...' : 'Save Bed'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Bed Modal */}
      <Modal
        isOpen={deleteBedOpen}
        onClose={() => {
          if (!deleteBedBusy) {
            setDeleteBedOpen(false);
            setDeletingBed(null);
            setDeleteBedError(null);
          }
        }}
        title="Delete Bed"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete bed <strong>{deletingBed?.label}</strong>? This cannot
            be undone.
          </p>
          {deleteBedError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{deleteBedError}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteBedOpen(false);
                setDeletingBed(null);
                setDeleteBedError(null);
              }}
              disabled={deleteBedBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteBed}
              disabled={deleteBedBusy}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteBedBusy ? 'Deleting...' : 'Yes, Delete Bed'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
