'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';

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
  const { user } = useAuth();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    try {
      const token = await (user as { getIdToken?: () => Promise<string> }).getIdToken?.();
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
  }, [tenantId, user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleAction(uid: string, action: 'approve' | 'deny') {
    setActionLoading(uid);
    try {
      const token = await (user as { getIdToken?: () => Promise<string> }).getIdToken?.();
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
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Join Requests</h1>
        <p className="text-gray-500 mt-1">
          Residents requesting to join your organization via the mobile app.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-300 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-gray-500 font-medium">No pending join requests</p>
          <p className="text-gray-400 text-sm mt-1">
            When residents request to join from the mobile app, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900">{req.displayName}</p>
                  {req.residentId ? (
                    <Badge variant="success">Linked to resident</Badge>
                  ) : (
                    <Badge variant="warning">No resident record</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">{req.email}</p>

                {req.message && (
                  <p className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-2 italic">
                    &ldquo;{req.message}&rdquo;
                  </p>
                )}

                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  {req.createdAt && (
                    <span>Requested: {new Date(req.createdAt).toLocaleDateString()}</span>
                  )}
                  {req.desiredMoveInDate && (
                    <span>
                      Desired move-in: {new Date(req.desiredMoveInDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {!req.residentId && (
                  <p className="mt-2 text-xs text-emerald-600">
                    ⚠ Link this app user to a resident record before approving.
                  </p>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(req.id, 'deny')}
                  disabled={actionLoading === req.id}
                >
                  Deny
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAction(req.id, 'approve')}
                  disabled={actionLoading === req.id || !req.residentId}
                >
                  {actionLoading === req.id ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
