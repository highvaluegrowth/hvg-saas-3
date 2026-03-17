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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6 animate-pulse space-y-4"><div className="h-8 bg-white/10 rounded w-1/3 mb-4" /><div className="h-48 bg-white/10 rounded" /></div>;
  if (!vehicle) return <div className="p-6 text-red-400">Vehicle not found</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight italic">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p className="text-sm text-white/50 mt-1">{vehicle.color} · {vehicle.licensePlate}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${tenantId}/vehicles/${vehicleId}/edit`}>
            <Button variant="outline" className="border-white/10 text-white/70 hover:bg-white/10 bg-transparent">Edit</Button>
          </Link>
          <Link href={`/${tenantId}/vehicles`}>
            <Button variant="outline" className="border-white/10 text-white/70 hover:bg-white/10 bg-transparent">← Back</Button>
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white/5 border border-white/10 shadow-xl">
          <CardHeader className="pb-3 border-b border-white/5 mb-4">
            <CardTitle className="text-base text-white font-semibold uppercase tracking-widest">Vehicle Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center"><span className="text-white/40 font-bold uppercase text-[10px]">Status</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                vehicle.status === 'active' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-white/5 text-slate-500 border-white/10'
              }`}>{vehicle.status}</span>
            </div>
            <div className="flex justify-between"><span className="text-white/40 font-bold uppercase text-[10px]">Seats</span><span className="text-white/90">{vehicle.seats}</span></div>
            <div className="flex justify-between"><span className="text-white/40 font-bold uppercase text-[10px]">Mileage</span><span className="text-white/90">{vehicle.currentMileage.toLocaleString()} mi</span></div>
            {vehicle.vin && <div className="flex justify-between"><span className="text-white/40 font-bold uppercase text-[10px]">VIN</span><span className="font-mono text-xs text-white/70">{vehicle.vin}</span></div>}
            {vehicle.wheelchairAccessible && <div className="text-cyan-400 text-[10px] font-black uppercase tracking-widest bg-cyan-400/10 px-2 py-1 rounded border border-cyan-400/20 text-center">♿ Wheelchair Accessible</div>}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border border-white/10 shadow-xl">
          <CardHeader className="pb-3 border-b border-white/5 mb-4">
            <CardTitle className="text-base text-white font-semibold uppercase tracking-widest">Insurance & Registration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-white/40 font-bold uppercase text-[10px]">Provider</span><span className="text-white/90">{vehicle.insurance.provider}</span></div>
            <div className="flex justify-between"><span className="text-white/40 font-bold uppercase text-[10px]">Policy #</span><span className="text-white/90 font-mono">{vehicle.insurance.policyNumber}</span></div>
            <div className="flex justify-between"><span className="text-white/40 font-bold uppercase text-[10px]">Ins. Expires</span>
              <span className="text-white/90">{new Date(vehicle.insurance.expiresAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between"><span className="text-white/40 font-bold uppercase text-[10px]">Reg. Expires</span>
              <span className="text-white/90">{new Date(vehicle.registration.expiresAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {vehicle.notes && (
        <Card className="bg-white/5 border border-white/10">
          <CardHeader className="pb-2 border-b border-white/5 mb-3"><CardTitle className="text-sm text-white uppercase tracking-widest">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-white/70 leading-relaxed">{vehicle.notes}</p></CardContent>
        </Card>
      )}

      <Card className="bg-white/5 border border-white/10 shadow-xl">
        <CardHeader className="border-b border-white/5 mb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-white font-semibold uppercase tracking-widest">Maintenance Log</CardTitle>
            <Button size="sm" onClick={() => setShowLogForm(!showLogForm)} className={showLogForm ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}>
              {showLogForm ? 'Cancel' : '+ Add Log'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showLogForm && (
            <form onSubmit={handleAddLog} className="mb-6 p-6 bg-black/40 border border-white/10 rounded-2xl space-y-4 shadow-inner">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Date *</label>
                  <Input type="date" value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })} required className="bg-white/5 border-white/10 text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Mileage *</label>
                  <Input type="number" min="0" value={logForm.mileage} onChange={(e) => setLogForm({ ...logForm, mileage: e.target.value })} required className="bg-white/5 border-white/10 text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Type *</label>
                  <select value={logForm.type} onChange={(e) => setLogForm({ ...logForm, type: e.target.value as MaintenanceLog['type'] })} className="w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 scheme-dark">
                    {Object.entries(MAINTENANCE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v} className="bg-[#0C1A2E]">{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Description *</label>
                <Input value={logForm.description} onChange={(e) => setLogForm({ ...logForm, description: e.target.value })} required className="bg-white/5 border-white/10 text-white" placeholder="What was done?" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Cost ($)</label>
                  <Input type="number" min="0" step="0.01" value={logForm.cost} onChange={(e) => setLogForm({ ...logForm, cost: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Performed By</label>
                  <Input value={logForm.performedBy} onChange={(e) => setLogForm({ ...logForm, performedBy: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="Shop name or person" />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <Button type="submit" size="sm" disabled={submitting} className="bg-cyan-600 hover:bg-cyan-700 text-white px-8">{submitting ? 'Adding...' : 'Save Log Entry'}</Button>
              </div>
            </form>
          )}

          {logs.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8 italic bg-white/5 rounded-xl border border-dashed border-white/10">No maintenance logs recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="bg-white/5 border border-white/10 rounded-xl p-4 transition-all hover:bg-white/[0.08]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm">{MAINTENANCE_TYPE_LABELS[log.type] ?? log.type}</span>
                    <span className="text-[10px] font-bold text-white/40 uppercase tabular-nums">{new Date(log.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-white/70 mb-3 leading-relaxed">{log.description}</p>
                  <div className="flex gap-4 items-center border-t border-white/5 pt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mileage</span>
                      <span className="text-xs font-bold text-white/90 tabular-nums">{log.mileage.toLocaleString()} mi</span>
                    </div>
                    {log.cost != null && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cost</span>
                        <span className="text-xs font-bold text-emerald-400 tabular-nums">${log.cost.toFixed(2)}</span>
                      </div>
                    )}
                    {log.performedBy && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">By</span>
                        <span className="text-xs font-bold text-white/60">{log.performedBy}</span>
                      </div>
                    )}
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
