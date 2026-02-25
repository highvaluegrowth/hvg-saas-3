'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ResidentSelector } from '@/components/ui/ResidentSelector';
import { authService } from '@/features/auth/services/authService';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function NewRidePage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passengerIds, setPassengerIds] = useState<string[]>([]);

  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
  const defaultDatetime = now.toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    scheduledAt: defaultDatetime,
    pickupAddress: '',
    dropoffAddress: '',
    purpose: '',
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
        requestedBy: user?.uid ?? '',
        requestedByType: 'staff',
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        pickupAddress: formData.pickupAddress,
        dropoffAddress: formData.dropoffAddress,
        purpose: formData.purpose || undefined,
        passengerIds,
        status: 'requested',
        tenantId,
        notes: formData.notes || undefined,
      };

      const res = await fetch(`/api/tenants/${tenantId}/rides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to schedule ride');
      router.push(`/${tenantId}/rides`);
    } catch (err: any) {
      setError(err.message || 'Failed to schedule ride');
    } finally {
      setIsLoading(false);
    }
  };

  const f = (key: keyof typeof formData) => ({
    value: formData[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData({ ...formData, [key]: e.target.value }),
    disabled: isLoading,
  });

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Schedule Ride</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new transportation request</p>
      </div>

      {error && <div className="bg-red-50 text-red-800 px-4 py-3 rounded-md text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Trip Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
              <Input {...f('scheduledAt')} type="datetime-local" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address *</label>
              <Input {...f('pickupAddress')} placeholder="123 Main St, City, State" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Address *</label>
              <Input {...f('dropoffAddress')} placeholder="456 Oak Ave, City, State" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
              <Input {...f('purpose')} placeholder="Doctor appointment, NA meeting, etc." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={isLoading}
                rows={3}
                placeholder="Any additional details..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Passengers</CardTitle></CardHeader>
          <CardContent>
            <ResidentSelector
              tenantId={tenantId}
              selectedIds={passengerIds}
              onChange={setPassengerIds}
              label="Passengers"
              placeholder="Search residents..."
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Scheduling...' : 'Schedule Ride'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
