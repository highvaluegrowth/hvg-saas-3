import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { createStaffService } from '@/features/staff/services/staffService';
import { CreateStaffSchema } from '@/features/staff/schemas/staff.schemas';
import { canManageStaff } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';
import { adminDb, FieldPath } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const snapshot = await adminDb.collection(`tenants/${tenantId}/staffMembers`).get();

    if (snapshot.empty) {
       return NextResponse.json({ staff: [] });
    }

    const staffIds = snapshot.docs.map(doc => doc.id);
    const uniqueIds = [...new Set(staffIds)].filter(Boolean);

    const staffMembers: any[] = [];

    for (let i = 0; i < uniqueIds.length; i += 30) {
      const chunk = uniqueIds.slice(i, i + 30);
      const usersSnap = await adminDb.collection('users').where(FieldPath.documentId(), 'in', chunk).get();

      const userMap = new Map();
      usersSnap.docs.forEach(d => userMap.set(d.id, d.data()));

      snapshot.docs.forEach(sDoc => {
        const sData = sDoc.data();
        if (chunk.includes(sDoc.id)) {
           const profile = userMap.get(sDoc.id);
           if (profile) {
              staffMembers.push({
                id: sDoc.id,
                firstName: profile.firstName || profile.displayName?.split(' ')[0] || 'Unknown',
                lastName: profile.lastName || profile.displayName?.split(' ')[1] || 'Staff',
                email: profile.email,
                phone: profile.phone,
                role: sData.role,
                status: sData.status,
                ...sData
              });
           }
        }
      });
    }

    return NextResponse.json({ staff: staffMembers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!canManageStaff(token.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = CreateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const staffService = createStaffService(tenantId);
    const staff = await staffService.createStaff(parsed.data);

    return NextResponse.json({ staff }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
  }
}
