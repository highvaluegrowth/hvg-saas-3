'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { authService } from '@/features/auth/services/authService';
import type { Contract, ContractStatus } from '@/features/contracts/types';

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string }> = {
  pending: { label: 'Awaiting Signature', color: 'bg-yellow-100 text-yellow-700' },
  signed:  { label: 'Signed',             color: 'bg-emerald-100 text-emerald-700' },
  voided:  { label: 'Voided',             color: 'bg-gray-100 text-gray-500' },
};

export default function ContractsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params);

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ residentName: '', residentEmail: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newSigningUrl, setNewSigningUrl] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/contracts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to load contracts');
      const json = await res.json();
      setContracts(json.contracts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.residentName.trim() || !formData.residentEmail.trim()) return;
    setFormLoading(true);
    setFormError(null);
    setNewSigningUrl(null);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create contract');
      const json = await res.json();
      setNewSigningUrl(json.signingUrl ?? `${window.location.origin}/sign/${json.id}`);
      setFormData({ residentName: '', residentEmail: '' });
      await fetchContracts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create contract');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleVoid(contractId: string) {
    if (!confirm('Void this contract? This cannot be undone.')) return;
    try {
      const token = await authService.getIdToken();
      await fetch(`/api/tenants/${tenantId}/contracts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: contractId, status: 'voided' }),
      });
      await fetchContracts();
    } catch {
      alert('Failed to void contract');
    }
  }

  function copyLink(url: string, id: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const getSigningUrl = (c: Contract) =>
    `${window.location.origin}/sign/${c.id}`;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
          <p className="text-gray-500 mt-1">Send digital contracts for residents to sign online</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setNewSigningUrl(null); setFormError(null); }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          + New Contract
        </button>
      </div>

      {/* New Contract Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Send Resident Intake Agreement</h2>
          {newSigningUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-emerald-700 font-medium">✓ Contract created! Share this link with the resident:</p>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <code className="text-sm text-emerald-800 flex-1 truncate">{newSigningUrl}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(newSigningUrl); }}
                  className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Copy
                </button>
              </div>
              <button
                onClick={() => { setShowForm(false); setNewSigningUrl(null); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resident Name</label>
                  <input
                    type="text"
                    required
                    value={formData.residentName}
                    onChange={(e) => setFormData((f) => ({ ...f, residentName: e.target.value }))}
                    placeholder="Jane Smith"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resident Email</label>
                  <input
                    type="email"
                    required
                    value={formData.residentEmail}
                    onChange={(e) => setFormData((f) => ({ ...f, residentEmail: e.target.value }))}
                    placeholder="jane@email.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {formLoading ? 'Creating…' : 'Create & Get Signing Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Contracts Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">{error}</div>
      ) : contracts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-gray-900 font-medium">No contracts yet</p>
          <p className="text-gray-500 text-sm mt-1">Create your first contract to get a resident signing link.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Resident</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Template</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.map((c) => {
                const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.pending;
                const createdDate = c.createdAt
                  ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '—';
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.residentName}</p>
                      <p className="text-gray-500 text-xs">{c.residentEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.templateTitle}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{createdDate}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.status === 'signed' && c.pdfUrl && (
                          <a
                            href={c.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            View PDF
                          </a>
                        )}
                        {c.status === 'pending' && (
                          <button
                            onClick={() => copyLink(getSigningUrl(c), c.id)}
                            className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            {copiedId === c.id ? 'Copied!' : 'Copy Link'}
                          </button>
                        )}
                        {c.status === 'pending' && (
                          <button
                            onClick={() => handleVoid(c.id)}
                            className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            Void
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
