'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useHouses } from '@/features/houses/hooks/useHouses';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
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
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-6 py-4 flex items-center space-x-4">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
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
      <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-indigo-50 mb-4">
        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">No houses yet</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        Get started by adding your first sober-living house to the platform.
      </p>
      {userCanManage && (
        <Link href={`/${tenantId}/houses/new`}>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Add Your First House
          </Button>
        </Link>
      )}
    </div>
  );
}

function HouseRow({ house, tenantId }: { house: House; tenantId: string }) {
  const occupancy = 0; // Will be derived from residents in future
  const statusVariant = house.status === 'active' ? 'success' : 'default';

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/${tenantId}/houses/${house.id}`}
          className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          {house.name}
        </Link>
      </TableCell>
      <TableCell>
        <span className="text-gray-700">
          {house.address.city}, {house.address.state}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-gray-700">{house.capacity}</span>
      </TableCell>
      <TableCell>
        <span className="text-gray-700">
          {occupancy}/{house.capacity}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant}>
          {house.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-gray-500 text-sm">
          {house.managerId ? house.managerId : 'Unassigned'}
        </span>
      </TableCell>
      <TableCell>
        <Link href={`/${tenantId}/houses/${house.id}`}>
          <Button variant="outline" size="sm">
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
          <h1 className="text-2xl font-bold text-gray-900">Houses</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage your sober-living house locations
          </p>
        </div>
        {userCanManage && (
          <Link href={`/${tenantId}/houses/new`}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Add House
            </Button>
          </Link>
        )}
      </div>

      {/* Content */}
      {houses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState tenantId={tenantId} userCanManage={userCanManage} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell as="th">Name</TableCell>
                  <TableCell as="th">Location</TableCell>
                  <TableCell as="th">Capacity</TableCell>
                  <TableCell as="th">Occupancy</TableCell>
                  <TableCell as="th">Status</TableCell>
                  <TableCell as="th">Manager</TableCell>
                  <TableCell as="th">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {houses.map((house) => (
                  <HouseRow key={house.id} house={house} tenantId={tenantId} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
