'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { authService } from '@/features/auth/services/authService';

type Params = Promise<{ tenantId: string }>;

interface JoinRequest {
  id: string;
  email: string;
  displayName: string;
  residentId?: string | null;
  message?: string | null;
  desiredMoveInDate?: string | null;
  createdAt?: string | null;
  status: string;
}

export default function JoinRequestsPage({ params }: { params: Params }) {
  const { tenantId } = use(params);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/join-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load requests');
      setRequests(data.requests ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading requests');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleAction(uid: string, action: 'approve' | 'deny') {
    setActionLoading(uid);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/join-requests/${uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? 'Action failed');
        return;
      }
      setRequests(prev => prev.filter(r => r.id !== uid));
    } catch {
      alert('Failed to process request');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      </div>
    );
  }

  const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Join Requests</h1>
        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Residents requesting to join your organization via the mobile app.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={cardStyle}>
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <svg className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-white font-medium">No pending join requests</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            When residents request to join from the mobile app, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="rounded-2xl p-6 flex flex-col sm:flex-row items-start justify-between gap-5 transition-all hover:bg-white/5" style={cardStyle}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <p className="font-semibold text-white">{req.displayName}</p>
                  {req.residentId ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(52,211,153,0.15)', color: '#6EE7B7', border: '1px solid rgba(52,211,153,0.3)' }}>
                      Linked to resident
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)' }}>
                      No resident record
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{req.email}</p>

                {req.message && (
                  <p className="mt-3 text-sm rounded-xl p-3 italic" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }}>
                    &ldquo;{req.message}&rdquo;
                  </p>
                )}

                <div className="flex gap-4 mt-4 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {req.createdAt && (
                    <span>Requested: {new Date(req.createdAt).toLocaleDateString()}</span>
                  )}
                  {req.desiredMoveInDate && (
                    <span>Desired move-in: {new Date(req.desiredMoveInDate).toLocaleDateString()}</span>
                  )}
                </div>

                {!req.residentId && (
                  <p className="mt-3 text-xs font-medium" style={{ color: '#FDE68A' }}>
                    ⚠ Link this app user to a resident record before approving.
                  </p>
                )}
              </div>

              <div className="flex sm:flex-col gap-2 shrink-0 sm:w-32">
                <button onClick={() => handleAction(req.id, 'approve')} disabled={actionLoading === req.id || !req.residentId}
                  className="w-full py-2 px-3 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#0891B2,#059669)' }}>
                  {actionLoading === req.id ? 'Loading...' : 'Approve'}
                </button>
                <button onClick={() => handleAction(req.id, 'deny')} disabled={actionLoading === req.id}
                  className="w-full py-2 px-3 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
