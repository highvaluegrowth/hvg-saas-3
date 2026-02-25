'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { authService } from '@/features/auth/services/authService';

export default function NewVehiclePage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    color: '',
    licensePlate: '',
    vin: '',
    seats: '5',
    wheelchairAccessible: false,
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceExpiresAt: '',
    registrationExpiresAt: '',
    currentMileage: '0',
    status: 'active' as const,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = await authService.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const body = {
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        color: formData.color,
        licensePlate: formData.licensePlate,
        vin: formData.vin || undefined,
        seats: parseInt(formData.seats),
        wheelchairAccessible: formData.wheelchairAccessible,
        insurance: {
          provider: formData.insuranceProvider,
          policyNumber: formData.insurancePolicyNumber,
          expiresAt: formData.insuranceExpiresAt,
        },
        registration: {
          expiresAt: formData.registrationExpiresAt,
        },
        currentMileage: parseInt(formData.currentMileage),
        status: formData.status,
        notes: formData.notes || undefined,
        approvedDriverIds: [],
        tenantId,
      };

      const response = await fetch(`/api/tenants/${tenantId}/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create vehicle');

      router.push(`/${tenantId}/vehicles`);
    } catch (err: any) {
      setError(err.message || 'Failed to create vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  const field = (key: keyof typeof formData) => ({
    value: formData[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFormData({ ...formData, [key]: e.target.value }),
    disabled: isLoading,
  });

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Vehicle</h1>
        <p className="text-sm text-gray-500 mt-1">Add a new vehicle to your fleet</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Vehicle Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
                <Input {...field('make')} placeholder="Ford" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                <Input {...field('model')} placeholder="Transit" required />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                <Input {...field('year')} type="number" min="1900" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
                <Input {...field('color')} placeholder="White" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seats *</label>
                <Input {...field('seats')} type="number" min="1" max="50" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Plate *</label>
                <Input {...field('licensePlate')} placeholder="ABC-1234" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
                <Input {...field('vin')} placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Mileage *</label>
                <Input {...field('currentMileage')} type="number" min="0" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                  disabled={isLoading}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">In Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="wheelchairAccessible"
                checked={formData.wheelchairAccessible}
                onChange={(e) => setFormData({ ...formData, wheelchairAccessible: e.target.checked })}
                disabled={isLoading}
                className="rounded"
              />
              <label htmlFor="wheelchairAccessible" className="text-sm font-medium text-gray-700">
                Wheelchair Accessible
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Insurance & Registration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider *</label>
                <Input {...field('insuranceProvider')} placeholder="State Farm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number *</label>
                <Input {...field('insurancePolicyNumber')} placeholder="POL-123456" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expires *</label>
                <Input {...field('insuranceExpiresAt')} type="date" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Expires *</label>
                <Input {...field('registrationExpiresAt')} type="date" required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={isLoading}
              rows={3}
              placeholder="Any additional notes about this vehicle..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Adding...' : 'Add Vehicle'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
