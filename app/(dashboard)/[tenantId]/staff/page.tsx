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
    <TableRow className="border-b border-white/5 hover:bg-transparent">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <TableCell key={i}>
          <div className="h-4 rounded animate-pulse w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
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

  const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Manage your staff members and their schedules</p>
        </div>
        {userCanManage && (
          <Link href={`/${tenantId}/staff/new`}>
            <Button className="text-white border-none font-semibold transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg,#0891B2,#059669)' }}>
              Add Staff Member
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <p className="text-sm" style={{ color: '#FECACA' }}>{error}</p>
        </div>
      )}

      <Card className="overflow-hidden border-0 shadow-none" style={cardStyle}>
        <CardHeader className="pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            Staff Members
            {!loading && (
              <span className="text-sm font-normal py-0.5 px-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                {staff.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="[&_tr]:border-b [&_tr]:border-white/10 hover:bg-transparent">
              <TableRow className="border-b border-white/10 hover:bg-transparent">
                <TableCell as="th" className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Name</TableCell>
                <TableCell as="th" className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Email</TableCell>
                <TableCell as="th" className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Phone</TableCell>
                <TableCell as="th" className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Role</TableCell>
                <TableCell as="th" className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Houses</TableCell>
                <TableCell as="th" className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Status</TableCell>
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
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell className="text-center py-16" as="td" colSpan={6}>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <svg className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.4)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-base font-medium text-white">No staff members yet</p>
                      <p className="text-sm mt-1 mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>Get started by adding your first staff member.</p>
                      {userCanManage && (
                        <Link href={`/${tenantId}/staff/new`}>
                          <Button className="text-white border-none font-medium text-sm transition-all" size="sm" style={{ background: 'rgba(8,145,178,0.2)', border: '1px solid rgba(8,145,178,0.4)', color: '#67E8F9' }}>
                            Add Staff Member
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((member: StaffMember) => (
                  <TableRow key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <Link href={`/${tenantId}/staff/${member.id}`} className="font-medium transition-colors hover:underline" style={{ color: '#67E8F9' }}>
                        {member.firstName} {member.lastName}
                      </Link>
                    </TableCell>
                    <TableCell style={{ color: 'rgba(255,255,255,0.7)' }}>{member.email}</TableCell>
                    <TableCell style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {member.phone ?? <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant[member.role]}>
                        {roleLabel[member.role]}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {member.houseIds.length === 0
                        ? <span style={{ color: 'rgba(255,255,255,0.3)' }}>None</span>
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
