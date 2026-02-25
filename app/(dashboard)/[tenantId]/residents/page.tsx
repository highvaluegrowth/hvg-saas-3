'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useEnrollments } from '@/features/enrollments/hooks/useEnrollments';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Card, CardContent } from '@/components/ui/Card';
import { authService } from '@/features/auth/services/authService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { canWrite } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';
import type { Enrollment, EnrollmentStatus } from '@/features/enrollments/types/enrollment.types';
import type { Resident } from '@/features/residents/types/resident.types';

interface ResidentsPageProps {
  params: Promise<{ tenantId: string }>;
}

const STATUS_TABS: { label: string; value: EnrollmentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Waitlist', value: 'waitlist' },
  { label: 'Graduated', value: 'graduated' },
  { label: 'Discharged', value: 'discharged' },
];

function statusBadgeVariant(status: EnrollmentStatus): 'success' | 'warning' | 'info' | 'default' {
  switch (status) {
    case 'active': return 'success';
    case 'waitlist': return 'warning';
    case 'graduated': return 'info';
    case 'discharged': return 'default';
  }
}

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString();
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-6 py-4 flex items-center space-x-4 border-b border-gray-100">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ tenantId, statusFilter, userCanWrite }: { tenantId: string; statusFilter: string; userCanWrite: boolean }) {
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-indigo-50 mb-4">
        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {statusFilter === 'all' ? 'No residents yet' : `No ${statusFilter} residents`}
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        {statusFilter === 'all'
          ? 'Enroll your first resident to get started.'
          : `No residents with ${statusFilter} status found.`}
      </p>
      {statusFilter === 'all' && userCanWrite && (
        <Link href={`/${tenantId}/residents/new`}>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Enroll First Resident
          </Button>
        </Link>
      )}
    </div>
  );
}

interface EnrollmentWithResident extends Enrollment {
  resident?: Resident;
}

export default function ResidentsPage({ params }: ResidentsPageProps) {
  const { tenantId } = use(params);
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [residents, setResidents] = useState<Record<string, Resident>>({});
  const [residentsLoading, setResidentsLoading] = useState(true);

  const { user } = useAuth();
  const userCanWrite = user?.role ? canWrite(user.role as UserRole) : false;

  const filterStatus = statusFilter === 'all' ? undefined : statusFilter;
  const { enrollments, loading: enrollmentsLoading, error } = useEnrollments(tenantId, { status: filterStatus });

  // Fetch all residents once
  useEffect(() => {
    async function fetchResidents() {
      try {
        const token = await authService.getIdToken();
        const res = await fetch(`/api/tenants/${tenantId}/residents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, Resident> = {};
          for (const r of data.residents ?? []) {
            map[r.id] = r;
          }
          setResidents(map);
        }
      } catch {
        // silent — resident names just won't show
      } finally {
        setResidentsLoading(false);
      }
    }
    fetchResidents();
  }, [tenantId]);

  const loading = enrollmentsLoading || residentsLoading;

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-700">Failed to load residents: {error}</p>
      </div>
    );
  }

  // Merge and filter
  const rows: EnrollmentWithResident[] = enrollments.map((e) => ({
    ...e,
    resident: residents[e.residentId],
  }));

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const name = r.resident
      ? `${r.resident.firstName} ${r.resident.lastName}`.toLowerCase()
      : r.residentId.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Residents</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage enrolled residents across your program
          </p>
        </div>
        {userCanWrite && (
          <Link href={`/${tenantId}/residents/new`}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Enroll Resident
            </Button>
          </Link>
        )}
      </div>

      {/* Status tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search by resident name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState tenantId={tenantId} statusFilter={statusFilter} userCanWrite={userCanWrite} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell as="th">Name</TableCell>
                  <TableCell as="th">Status</TableCell>
                  <TableCell as="th">Phase</TableCell>
                  <TableCell as="th">Move-In Date</TableCell>
                  <TableCell as="th">Sobriety Start</TableCell>
                  <TableCell as="th">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/${tenantId}/residents/${row.residentId}`}
                        className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {row.resident
                          ? `${row.resident.firstName} ${row.resident.lastName}`
                          : row.residentId}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(row.status)}>
                        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">Phase {row.phase}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600 text-sm">{formatDate(row.moveInDate)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600 text-sm">{formatDate(row.sobrietyStartDate)}</span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/${tenantId}/residents/${row.residentId}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
