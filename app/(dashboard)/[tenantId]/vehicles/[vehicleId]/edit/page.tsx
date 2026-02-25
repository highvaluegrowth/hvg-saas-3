'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { authService } from '@/features/auth/services/authService';
import { Vehicle } from '@/features/vehicles/types/vehicle.types';

export default function EditVehiclePage({
  params,
}: {
  params: Promise<{ tenantId: string; vehicleId: string }>;
}) {
  const { tenantId, vehicleId } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    make: '', model: '', year: '', color: '', licensePlate: '', vin: '',
    seats: '', wheelchairAccessible: false,
    insuranceProvider: '', insurancePolicyNumber: '', insuranceExpiresAt: '',
    registrationExpiresAt: '', currentMileage: '',
    status: 'active' as Vehicle['status'], notes: '',
  });

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const token = await authService.getIdToken();
        const res = await fetch(`/api/tenants/${tenantId}/vehicles/${vehicleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load vehicle');
        const v: Vehicle = data.vehicle;
        setFormData({
          make: v.make, model: v.model, year: v.year.toString(), color: v.color,
          licensePlate: v.licensePlate, vin: v.vin ?? '', seats: v.seats.toString(),
          wheelchairAccessible: v.wheelchairAccessible,
          insuranceProvider: v.insurance.provider,
          insurancePolicyNumber: v.insurance.policyNumber,
          insuranceExpiresAt: new Date(v.insurance.expiresAt).toISOString().split('T')[0],
          registrationExpiresAt: new Date(v.registration.expiresAt).toISOString().split('T')[0],
          currentMileage: v.currentMileage.toString(), status: v.status, notes: v.notes ?? '',
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsFetching(false);
      }
    };
    fetchVehicle();
  }, [tenantId, vehicleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const token = await authService.getIdToken();
      const body = {
        make: formData.make, model: formData.model, year: parseInt(formData.year),
        color: formData.color, licensePlate: formData.licensePlate,
        vin: formData.vin || undefined, seats: parseInt(formData.seats),
        wheelchairAccessible: formData.wheelchairAccessible,
        insurance: { provider: formData.insuranceProvider, policyNumber: formData.insurancePolicyNumber, expiresAt: formData.insuranceExpiresAt },
        registration: { expiresAt: formData.registrationExpiresAt },
        currentMileage: parseInt(formData.currentMileage), status: formData.status,
        notes: formData.notes || undefined,
      };
      const res = await fetch(`/api/tenants/${tenantId}/vehicles/${vehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update vehicle');
      router.push(`/${tenantId}/vehicles/${vehicleId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="p-6 animate-pulse"><div className="h-64 bg-gray-200 rounded" /></div>;

  const f = (key: keyof typeof formData) => ({
    value: formData[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFormData({ ...formData, [key]: e.target.value }),
    disabled: isLoading,
  });

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Vehicle</h1>
        <p className="text-sm text-gray-500 mt-1">Update vehicle information</p>
      </div>
      {error && <div className="bg-red-50 text-red-800 px-4 py-3 rounded-md text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Vehicle Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Make *</label><Input {...f('make')} placeholder="Ford" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Model *</label><Input {...f('model')} placeholder="Transit" required /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Year *</label><Input {...f('year')} type="number" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Color *</label><Input {...f('color')} required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Seats *</label><Input {...f('seats')} type="number" min="1" required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">License Plate *</label><Input {...f('licensePlate')} required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">VIN</label><Input {...f('vin')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Mileage *</label><Input {...f('currentMileage')} type="number" min="0" required /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select {...f('status')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="active">Active</option>
                  <option value="maintenance">In Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="wc" checked={formData.wheelchairAccessible}
                onChange={(e) => setFormData({ ...formData, wheelchairAccessible: e.target.checked })}
                disabled={isLoading} className="rounded" />
              <label htmlFor="wc" className="text-sm font-medium text-gray-700">Wheelchair Accessible</label>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Insurance & Registration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Provider *</label><Input {...f('insuranceProvider')} required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Policy # *</label><Input {...f('insurancePolicyNumber')} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expires *</label><Input {...f('insuranceExpiresAt')} type="date" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Registration Expires *</label><Input {...f('registrationExpiresAt')} type="date" required /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} disabled={isLoading} rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading} className="flex-1">{isLoading ? 'Saving...' : 'Save Changes'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
