'use client';

import { use } from 'react';
import Link from 'next/link';
import { useStaff } from '@/features/staff/hooks/useStaff';
import { StaffMember, StaffRole } from '@/features/staff/types/staff.types';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { canManageStaff } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';

interface StaffPageProps {
  params: Promise<{ tenantId: string }>;
}

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

function SkeletonRow() {
  return (
    <TableRow>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <TableCell key={i}>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function StaffPage({ params }: StaffPageProps) {
  const { tenantId } = use(params);
  const { staff, loading, error } = useStaff(tenantId);

  const { user } = useAuth();
  const userCanManage = user?.role ? canManageStaff(user.role as UserRole) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-600 mt-1">Manage your staff members and their schedules</p>
        </div>
        {userCanManage && (
          <Link href={`/${tenantId}/staff/new`}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Add Staff Member
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Card className="border-gray-200 bg-white">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Staff Members
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({staff.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell as="th">Name</TableCell>
                <TableCell as="th">Email</TableCell>
                <TableCell as="th">Phone</TableCell>
                <TableCell as="th">Role</TableCell>
                <TableCell as="th">Houses</TableCell>
                <TableCell as="th">Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : staff.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center py-12 text-gray-500" as="td">
                    <div className="col-span-6 flex flex-col items-center">
                      <svg
                        className="w-12 h-12 text-gray-300 mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-900">No staff members yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Get started by adding your first staff member.
                      </p>
                      {userCanManage && (
                        <Link href={`/${tenantId}/staff/new`} className="mt-4">
                          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
                            Add Staff Member
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((member: StaffMember) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Link
                        href={`/${tenantId}/staff/${member.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {member.firstName} {member.lastName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-600">{member.email}</TableCell>
                    <TableCell className="text-gray-600">
                      {member.phone ?? <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant[member.role]}>
                        {roleLabel[member.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {member.houseIds.length === 0
                        ? <span className="text-gray-400">None</span>
                        : member.houseIds.length}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'active' ? 'success' : 'default'}>
                        {member.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
