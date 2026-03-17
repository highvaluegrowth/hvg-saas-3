'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useStaff } from '@/features/staff/hooks/useStaff';
import { StaffMember, StaffRole } from '@/features/staff/types/staff.types';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { canManageStaff } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';
import type { Application } from '@/features/applications/types';

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

  const [activeTab, setActiveTab] = useState<'active' | 'applicants' | 'roles'>('active');
  
  // Applicants State
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  useEffect(() => {
    if (activeTab === 'applicants') {
      const fetchApplicants = async () => {
        setLoadingApplicants(true);
        try {
          const token = await authService.getIdToken();
          const res = await fetch(`/api/tenants/${tenantId}/applications?type=staff`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          setApplicants(data.applications || []);
        } catch (err) {
          console.error("Failed to fetch applicants", err);
        } finally {
          setLoadingApplicants(false);
        }
      };
      fetchApplicants();
    }
  }, [activeTab, tenantId]);

  const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Staff Management</h1>
          <p className="mt-1 text-sm text-white/50">Manage your staff members, review applicants, and define roles.</p>
        </div>
        {userCanManage && (
          <Link href={`/${tenantId}/staff/new`}>
            <Button className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-all shadow-lg shadow-cyan-600/20">
              Add Staff Member
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
        <button 
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
            Active Staff
        </button>
        <button 
            onClick={() => setActiveTab('applicants')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'applicants' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
            Applicants
        </button>
        <button 
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'roles' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
            Roles & Permissions
        </button>
      </div>

      {activeTab === 'active' && (
        <Card className="bg-white/5 border border-white/10 shadow-xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              Staff Directory
              {!loading && (
                <span className="text-xs font-black py-0.5 px-2 rounded-full bg-white/10 text-white/70">
                  {staff.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="[&_tr]:border-b [&_tr]:border-white/10 hover:bg-transparent">
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  <TableCell as="th" className="text-[10px] font-black uppercase tracking-widest text-white/50">Name</TableCell>
                  <TableCell as="th" className="text-[10px] font-black uppercase tracking-widest text-white/50">Email</TableCell>
                  <TableCell as="th" className="text-[10px] font-black uppercase tracking-widest text-white/50">Phone</TableCell>
                  <TableCell as="th" className="text-[10px] font-black uppercase tracking-widest text-white/50">Role</TableCell>
                  <TableCell as="th" className="text-[10px] font-black uppercase tracking-widest text-white/50">Houses</TableCell>
                  <TableCell as="th" className="text-[10px] font-black uppercase tracking-widest text-white/50">Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : staff.length === 0 ? (
                  <TableRow className="border-none hover:bg-transparent">
                    <TableCell className="text-center py-16" as="td" colSpan={6}>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-white/5">
                          <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-white">No staff members yet</p>
                        <p className="text-xs mt-1 mb-5 text-white/40">Get started by adding your first staff member.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((member: StaffMember) => (
                    <TableRow key={member.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <TableCell>
                        <Link href={`/${tenantId}/staff/${member.id}`} className="font-bold text-white hover:text-cyan-400 transition-colors">
                          {member.firstName} {member.lastName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-white/70">{member.email}</TableCell>
                      <TableCell className="text-white/70">
                        {member.phone ?? <span className="text-white/30">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant[member.role]}>
                          {roleLabel[member.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/70">
                        {member.houseIds.length === 0
                          ? <span className="text-white/30">None</span>
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
      )}

      {activeTab === 'applicants' && (
        <Card className="bg-white/5 border border-white/10 shadow-xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-white/5 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              Staff Applications
            </CardTitle>
            <Link href={`/${tenantId}/applications`} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest">
              Go to Kanban Board →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
             <Table>
              <TableHeader className="[&_tr]:border-b [&_tr]:border-white/10 hover:bg-transparent">
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  <TableCell as="th" className="text-[10px] font-black uppercase tracking-widest text-white/50">Applicant</TableCell>
                  <TableCell as="th" className="text-[10px] font-black uppercase tracking-widest text-white/50">Email</TableCell>
                  <TableCell as="th" className="text-[10px] font-black uppercase tracking-widest text-white/50">Status</TableCell>
                  <TableCell as="th" className="text-[10px] font-black uppercase tracking-widest text-white/50">Submitted</TableCell>
                  <TableCell as="th" className="text-right text-[10px] font-black uppercase tracking-widest text-white/50">Action</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingApplicants ? (
                  <SkeletonRow />
                ) : applicants.length === 0 ? (
                  <TableRow className="border-none hover:bg-transparent">
                    <TableCell className="text-center py-12 text-white/40 italic" as="td" colSpan={5}>
                      No pending staff applications.
                    </TableCell>
                  </TableRow>
                ) : (
                  applicants.map((app) => (
                    <TableRow key={app.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <TableCell className="font-bold text-white">{app.applicantName}</TableCell>
                      <TableCell className="text-white/70">{app.applicantEmail}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded bg-white/10 text-white/80 text-xs font-bold uppercase tracking-wider">
                          {app.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-white/70">
                        {new Date(app.submittedAt as string).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                         <Link href={`/${tenantId}/applications`} className="bg-white/10 text-white text-xs px-3 py-1.5 rounded hover:bg-white/20 transition-colors">
                           Review
                         </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/5 border border-white/10 shadow-xl">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-white">Staff Admin</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-white/70">Full access to all tenant operations, including hiring, billing, and system settings.</p>
                    <ul className="text-xs text-white/50 space-y-2 list-disc pl-4">
                        <li>Can hire/fire staff</li>
                        <li>Can accept/reject residents</li>
                        <li>Can view financial data</li>
                        <li>Can modify house structure</li>
                    </ul>
                </CardContent>
            </Card>

            <Card className="bg-white/5 border border-white/10 shadow-xl">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-white">House Manager</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-white/70">Operational control over assigned houses, residents, and day-to-day activities.</p>
                    <ul className="text-xs text-white/50 space-y-2 list-disc pl-4">
                        <li>Can assign beds and chores</li>
                        <li>Can manage incidents and rides</li>
                        <li>Cannot view financials</li>
                        <li>Cannot manage other staff</li>
                    </ul>
                </CardContent>
            </Card>

            <Card className="bg-white/5 border border-white/10 shadow-xl">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-white">General Staff</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-white/70">Limited access to view assigned tasks, events, and resident profiles.</p>
                    <ul className="text-xs text-white/50 space-y-2 list-disc pl-4">
                        <li>Can view resident clinical info</li>
                        <li>Can complete assigned chores</li>
                        <li>Can drive assigned rides</li>
                        <li>Cannot modify house data</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
