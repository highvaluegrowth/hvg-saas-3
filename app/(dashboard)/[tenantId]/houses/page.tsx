'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useHouses } from '@/features/houses/hooks/useHouses';
import { useEnrollments } from '@/features/enrollments/hooks/useEnrollments';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { canManageStaff } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';
import type { House } from '@/features/houses/types/house.types';

interface HousesPageProps {
  params: Promise<{ tenantId: string }>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-10 w-28 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
      <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="divide-y divide-white/5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-6 py-4 flex items-center space-x-4">
              <div className="h-5 w-40 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-5 w-32 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-5 w-16 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-5 w-16 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-5 w-20 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ tenantId, userCanManage }: { tenantId: string; userCanManage: boolean }) {
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4" style={{ background: 'rgba(8,145,178,0.15)' }}>
        <svg className="w-8 h-8" style={{ color: '#67E8F9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-1" style={{ color: 'white' }}>No houses yet</h3>
      <p className="mb-6 max-w-sm mx-auto text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
        Get started by adding your first sober-living house to the platform.
      </p>
      {userCanManage && (
        <Link href={`/${tenantId}/houses/new`}>
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
            Add Your First House
          </Button>
        </Link>
      )}
    </div>
  );
}

function HouseRow({ house, tenantId, occupancy }: { house: House; tenantId: string; occupancy: number }) {
  const statusVariant = house.status === 'active' ? 'success' : 'default';

  return (
    <TableRow className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <TableCell>
        <Link
          href={`/${tenantId}/houses/${house.id}`}
          className="font-medium transition-colors hover:underline"
          style={{ color: '#67E8F9' }}
        >
          {house.name}
        </Link>
      </TableCell>
      <TableCell style={{ color: 'rgba(255,255,255,0.7)' }}>
        {house.address.city}, {house.address.state}
      </TableCell>
      <TableCell style={{ color: 'rgba(255,255,255,0.7)' }}>
        {house.capacity}
      </TableCell>
      <TableCell style={{ color: 'rgba(255,255,255,0.7)' }}>
        {occupancy}/{house.capacity}
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant}>
          {house.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell style={{ color: 'rgba(255,255,255,0.5)' }}>
        {house.managerId ? house.managerId : 'Unassigned'}
      </TableCell>
      <TableCell>
        <Link href={`/${tenantId}/houses/${house.id}`}>
          <Button variant="outline" size="sm" className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white">
            View
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  );
}

export default function HousesPage({ params }: HousesPageProps) {
  const { tenantId } = use(params);
  const { houses, loading, error } = useHouses(tenantId);
  const { enrollments: activeEnrollments } = useEnrollments(tenantId, { status: 'active' });

  const occupancyByHouse = activeEnrollments.reduce<Record<string, number>>((acc, e) => {
    if (e.houseId) acc[e.houseId] = (acc[e.houseId] ?? 0) + 1;
    return acc;
  }, {});

  const { user } = useAuth();
  const userCanManage = user?.role ? canManageStaff(user.role as UserRole) : false;

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-700">Failed to load houses: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Houses</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Manage your sober-living house locations
          </p>
        </div>
        {userCanManage && (
          <Link href={`/${tenantId}/houses/new`}>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              Add House
            </Button>
          </Link>
        )}
      </div>

      {/* Content */}
      {houses.length === 0 ? (
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="p-6">
            <EmptyState tenantId={tenantId} userCanManage={userCanManage} />
          </div>
        </div>
      ) : (
        <Card className="overflow-hidden border-0 shadow-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="[&_tr]:border-b [&_tr]:border-white/10 hover:bg-transparent">
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  <TableCell as="th" className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Name</TableCell>
                  <TableCell as="th" className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Location</TableCell>
                  <TableCell as="th" className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Capacity</TableCell>
                  <TableCell as="th" className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Occupancy</TableCell>
                  <TableCell as="th" className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Status</TableCell>
                  <TableCell as="th" className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Manager</TableCell>
                  <TableCell as="th" className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {houses.map((house) => (
                  <HouseRow key={house.id} house={house} tenantId={tenantId} occupancy={occupancyByHouse[house.id] ?? 0} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
