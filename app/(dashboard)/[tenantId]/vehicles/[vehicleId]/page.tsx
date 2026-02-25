'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/features/auth/services/authService';
import { Vehicle, MaintenanceLog } from '@/features/vehicles/types/vehicle.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

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

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string; vehicleId: string }>;
}) {
  const { tenantId, vehicleId } = use(params);
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogForm, setShowLogForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    mileage: '',
    type: 'oil_change' as MaintenanceLog['type'],
    description: '',
    cost: '',
    performedBy: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await authService.getIdToken();
        const [vRes, lRes] = await Promise.all([
          fetch(`/api/tenants/${tenantId}/vehicles/${vehicleId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/tenants/${tenantId}/vehicles/${vehicleId}/maintenance`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const vData = await vRes.json();
        const lData = await lRes.json();
        setVehicle(vData.vehicle);
        setLogs(lData.logs ?? []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenantId, vehicleId]);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = await authService.getIdToken();
      const body = {
        date: logForm.date,
        mileage: parseInt(logForm.mileage),
        type: logForm.type,
        description: logForm.description,
        cost: logForm.cost ? parseFloat(logForm.cost) : undefined,
        performedBy: logForm.performedBy || undefined,
      };
      const res = await fetch(`/api/tenants/${tenantId}/vehicles/${vehicleId}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add log');
      setLogs((prev) => [data.log, ...prev]);
      setShowLogForm(false);
      setLogForm({ date: new Date().toISOString().split('T')[0], mileage: '', type: 'oil_change', description: '', cost: '', performedBy: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6 animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/3 mb-4" /><div className="h-48 bg-gray-200 rounded" /></div>;
  if (!vehicle) return <div className="p-6 text-red-600">Vehicle not found</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{vehicle.color} · {vehicle.licensePlate}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${tenantId}/vehicles/${vehicleId}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Link href={`/${tenantId}/vehicles`}>
            <Button variant="outline">← Back</Button>
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-800 px-4 py-3 rounded-md text-sm">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Vehicle Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Status</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[vehicle.status] ?? ''}`}>{vehicle.status}</span>
            </div>
            <div className="flex justify-between"><span className="text-gray-500">Seats</span><span>{vehicle.seats}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Mileage</span><span>{vehicle.currentMileage.toLocaleString()} mi</span></div>
            {vehicle.vin && <div className="flex justify-between"><span className="text-gray-500">VIN</span><span className="font-mono text-xs">{vehicle.vin}</span></div>}
            {vehicle.wheelchairAccessible && <div className="text-blue-600 text-xs font-medium">♿ Wheelchair Accessible</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Insurance & Registration</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Provider</span><span>{vehicle.insurance.provider}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Policy #</span><span>{vehicle.insurance.policyNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Ins. Expires</span>
              <span>{new Date(vehicle.insurance.expiresAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between"><span className="text-gray-500">Reg. Expires</span>
              <span>{new Date(vehicle.registration.expiresAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {vehicle.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-700">{vehicle.notes}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Maintenance Log</CardTitle>
            <Button size="sm" onClick={() => setShowLogForm(!showLogForm)}>
              {showLogForm ? 'Cancel' : '+ Add Log'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showLogForm && (
            <form onSubmit={handleAddLog} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                  <Input type="date" value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mileage *</label>
                  <Input type="number" min="0" value={logForm.mileage} onChange={(e) => setLogForm({ ...logForm, mileage: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                  <select value={logForm.type} onChange={(e) => setLogForm({ ...logForm, type: e.target.value as any })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {Object.entries(MAINTENANCE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                <Input value={logForm.description} onChange={(e) => setLogForm({ ...logForm, description: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cost ($)</label>
                  <Input type="number" min="0" step="0.01" value={logForm.cost} onChange={(e) => setLogForm({ ...logForm, cost: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Performed By</label>
                  <Input value={logForm.performedBy} onChange={(e) => setLogForm({ ...logForm, performedBy: e.target.value })} />
                </div>
              </div>
              <Button type="submit" size="sm" disabled={submitting}>{submitting ? 'Adding...' : 'Add Log'}</Button>
            </form>
          )}

          {logs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No maintenance logs yet</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{MAINTENANCE_TYPE_LABELS[log.type] ?? log.type}</span>
                    <span className="text-gray-500">{new Date(log.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700">{log.description}</p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    <span>{log.mileage.toLocaleString()} mi</span>
                    {log.cost != null && <span>${log.cost.toFixed(2)}</span>}
                    {log.performedBy && <span>by {log.performedBy}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
