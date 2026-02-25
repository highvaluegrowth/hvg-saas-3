'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/authService';
import { StaffMember, StaffRole, StaffSchedule } from '@/features/staff/types/staff.types';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

interface StaffDetailPageProps {
  params: Promise<{ tenantId: string; staffId: string }>;
}

const DAYS: { key: keyof StaffSchedule; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const roleBadgeVariant: Record<StaffRole, BadgeVariant> = {
  house_manager: 'info',
  staff: 'default',
  staff_admin: 'warning',
};

const roleLabel: Record<StaffRole, string> = {
  house_manager: 'House Manager',
  staff: 'Staff',
  staff_admin: 'Staff Admin',
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start py-3 border-b border-gray-100 last:border-0">
      <dt className="w-40 text-sm font-medium text-gray-500 shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 flex-1">{children}</dd>
    </div>
  );
}

export default function StaffDetailPage({ params }: StaffDetailPageProps) {
  const { tenantId, staffId } = use(params);
  const router = useRouter();

  const [member, setMember] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const token = await authService.getIdToken();
      const response = await fetch(`/api/tenants/${tenantId}/staff/${staffId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? data.message ?? 'Failed to fetch staff member');
      }
      const data = await response.json();
      setMember(data);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [tenantId, staffId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  async function handleDeactivate() {
    setDeactivating(true);
    setDeactivateError(null);
    try {
      const token = await authService.getIdToken();
      const response = await fetch(`/api/tenants/${tenantId}/staff/${staffId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? data.message ?? 'Failed to deactivate staff member');
      }
      router.push(`/${tenantId}/staff`);
    } catch (err: unknown) {
      setDeactivateError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setDeactivating(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 py-3 border-b border-gray-100">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (fetchError || !member) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-md bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-sm font-medium text-red-700">
            {fetchError ?? 'Staff member not found'}
          </p>
          <Link href={`/${tenantId}/staff`} className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              Back to Staff
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/${tenantId}/staff`}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Staff
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-700">
              {member.firstName} {member.lastName}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {member.firstName} {member.lastName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${tenantId}/staff/${staffId}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setShowDeactivateModal(true)}
          >
            Deactivate
          </Button>
        </div>
      </div>

      {/* Profile */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900">Profile</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <dl>
            <DetailRow label="Full Name">
              {member.firstName} {member.lastName}
            </DetailRow>
            <DetailRow label="Email">{member.email}</DetailRow>
            <DetailRow label="Phone">
              {member.phone ?? <span className="text-gray-400">Not provided</span>}
            </DetailRow>
            <DetailRow label="Role">
              <Badge variant={roleBadgeVariant[member.role]}>
                {roleLabel[member.role]}
              </Badge>
            </DetailRow>
            <DetailRow label="Status">
              <Badge variant={member.status === 'active' ? 'success' : 'default'}>
                {member.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </DetailRow>
            <DetailRow label="Firebase UID">
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono">
                {member.userId}
              </code>
            </DetailRow>
          </dl>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900">Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-gray-100">
            {DAYS.map(({ key, label }) => {
              const shift = member.schedule?.[key];
              return (
                <div key={key} className="flex items-center py-3">
                  <span className="w-32 text-sm font-medium text-gray-700">{label}</span>
                  {shift ? (
                    <span className="text-sm text-gray-900">
                      {shift.start} – {shift.end}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">Off</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Assigned Houses */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900">
            Assigned Houses
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({member.houseIds.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {member.houseIds.length === 0 ? (
            <p className="text-sm text-gray-400">No houses assigned</p>
          ) : (
            <ul className="space-y-2">
              {member.houseIds.map((houseId) => (
                <li key={houseId}>
                  <Link
                    href={`/${tenantId}/houses/${houseId}`}
                    className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline font-mono"
                  >
                    {houseId}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Deactivate Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => {
          if (!deactivating) {
            setShowDeactivateModal(false);
            setDeactivateError(null);
          }
        }}
        title="Deactivate Staff Member"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to deactivate{' '}
            <span className="font-medium">
              {member.firstName} {member.lastName}
            </span>
            ? This will remove their access to the platform.
          </p>

          {deactivateError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{deactivateError}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeactivateModal(false);
                setDeactivateError(null);
              }}
              disabled={deactivating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deactivating}
            >
              {deactivating ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
