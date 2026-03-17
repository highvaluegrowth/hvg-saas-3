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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="p-6 animate-pulse"><div className="h-64 bg-white/10 rounded" /></div>;

  const f = (key: keyof typeof formData) => ({
    value: formData[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFormData({ ...formData, [key]: e.target.value }),
    disabled: isLoading,
  });

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight italic">Edit Vehicle</h1>
        <p className="text-sm text-white/50 mt-1">Update organization vehicle specifications</p>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white/5 border border-white/10 shadow-xl">
          <CardHeader className="pb-3 border-b border-white/5 mb-4"><CardTitle className="text-base text-white font-semibold uppercase tracking-widest">Vehicle Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Make *</label><Input {...f('make')} placeholder="Ford" required className="bg-white/5 border-white/10 text-white" /></div>
              <div><label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Model *</label><Input {...f('model')} placeholder="Transit" required className="bg-white/5 border-white/10 text-white" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Year *</label><Input {...f('year')} type="number" required className="bg-white/5 border-white/10 text-white" /></div>
              <div><label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Color *</label><Input {...f('color')} required className="bg-white/5 border-white/10 text-white" /></div>
              <div><label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Seats *</label><Input {...f('seats')} type="number" min="1" required className="bg-white/5 border-white/10 text-white" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">License Plate *</label><Input {...f('licensePlate')} required className="bg-white/5 border-white/10 text-white" /></div>
              <div><label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">VIN</label><Input {...f('vin')} className="bg-white/5 border-white/10 text-white font-mono" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Current Mileage *</label><Input {...f('currentMileage')} type="number" min="0" required className="bg-white/5 border-white/10 text-white" /></div>
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Status</label>
                <select {...f('status')} className="w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 scheme-dark">
                  <option value="active" className="bg-[#0C1A2E]">Active</option>
                  <option value="maintenance" className="bg-[#0C1A2E]">In Maintenance</option>
                  <option value="retired" className="bg-[#0C1A2E]">Retired</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input type="checkbox" id="wc" checked={formData.wheelchairAccessible}
                onChange={(e) => setFormData({ ...formData, wheelchairAccessible: e.target.checked })}
                disabled={isLoading} className="rounded border-white/20 bg-white/5 text-cyan-600 focus:ring-cyan-500" />
              <label htmlFor="wc" className="text-sm font-medium text-white/80">Wheelchair Accessible</label>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border border-white/10 shadow-xl">
          <CardHeader className="pb-3 border-b border-white/5 mb-4"><CardTitle className="text-base text-white font-semibold uppercase tracking-widest">Insurance & Registration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Provider *</label><Input {...f('insuranceProvider')} required className="bg-white/5 border-white/10 text-white" /></div>
              <div><label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Policy # *</label><Input {...f('insurancePolicyNumber')} required className="bg-white/5 border-white/10 text-white font-mono" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Insurance Expires *</label><Input {...f('insuranceExpiresAt')} type="date" required className="bg-white/5 border-white/10 text-white scheme-dark" /></div>
              <div><label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Registration Expires *</label><Input {...f('registrationExpiresAt')} type="date" required className="bg-white/5 border-white/10 text-white scheme-dark" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border border-white/10 shadow-xl">
          <CardHeader className="pb-2 border-b border-white/5 mb-3"><CardTitle className="text-sm text-white uppercase tracking-widest">Notes</CardTitle></CardHeader>
          <CardContent>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} disabled={isLoading} rows={3}
              className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 scheme-dark resize-none" placeholder="Additional details..." />
          </CardContent>
        </Card>
        <div className="flex gap-4 pt-2">
          <Button type="submit" disabled={isLoading} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-900/20">{isLoading ? 'Saving...' : 'Save Changes'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading} className="flex-1 border-white/10 text-white/70 hover:bg-white/10 bg-transparent">Cancel</Button>
        </div>
      </form>
    </div>
  );
}
