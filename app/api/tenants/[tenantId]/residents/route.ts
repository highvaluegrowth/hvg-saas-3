import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { residentService } from '@/features/residents/services/residentService';
import { CreateResidentSchema } from '@/features/residents/schemas/resident.schemas';
import { canWrite } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';
import { adminDb, FieldValue, FieldPath } from '@/lib/firebase/admin';

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

    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    const status = url.searchParams.get('status');

    let query = adminDb.collection(`tenants/${tenantId}/enrollments`) as FirebaseFirestore.Query;
    if (status) {
      query = query.where('status', '==', status);
    }

    const enrollmentsSnap = await query.get();
    
    if (enrollmentsSnap.empty) {
      return NextResponse.json({ residents: [] });
    }

    // Get all resident IDs
    const residentIds = enrollmentsSnap.docs.map(doc => doc.data().residentId);
    
    // De-duplicate if needed, though they should be unique per enrollment ideally
    const uniqueIds = [...new Set(residentIds)].filter(Boolean);

    if (uniqueIds.length === 0) {
       return NextResponse.json({ residents: [] });
    }

    // Fetch the global user profiles for these IDs
    // Firebase 'in' queries are limited to 30 items
    const residents: any[] = [];
    
    for (let i = 0; i < uniqueIds.length; i += 30) {
      const chunk = uniqueIds.slice(i, i + 30);
      const usersSnap = await adminDb.collection('users').where(FieldPath.documentId(), 'in', chunk).get();
      
      // Also attempt to fetch from legacy residents collection just in case
      // This bridges the gap between the old siloed data and the new global user data
      const legacySnap = await adminDb.collection(`tenants/${tenantId}/residents`).where(FieldPath.documentId(), 'in', chunk).get();
      
      const userMap = new Map();
      usersSnap.docs.forEach(d => userMap.set(d.id, d.data()));
      legacySnap.docs.forEach(d => {
        if (!userMap.has(d.id)) userMap.set(d.id, d.data());
      });

      enrollmentsSnap.docs.forEach(eDoc => {
        const eData = eDoc.data();
        if (chunk.includes(eData.residentId)) {
           const profile = userMap.get(eData.residentId);
           if (profile) {
              const name = profile.displayName || profile.name || `${profile.firstName} ${profile.lastName}` || 'Unknown Resident';
              if (!search || name.toLowerCase().includes(search)) {
                residents.push({
                  id: eData.residentId, // Use the user's ID as the resident ID for consistency
                  enrollmentId: eDoc.id,
                  name: name,
                  email: profile.email,
                  phone: profile.phone,
                  status: eData.status,
                  houseId: eData.houseId,
                  // Keep legacy fields available if they exist in the joined profile
                  ...profile,
                });
              }
           }
        }
      });
    }

    return NextResponse.json({ residents });
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

    if (!canWrite(token.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = CreateResidentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const resident = await residentService.createResident(parsed.data);

    // Create a default enrollment for this resident in this tenant
    const now = new Date();
    await adminDb.collection(`tenants/${tenantId}/enrollments`).add({
      residentId: resident.id,
      tenantId,
      status: 'active',
      phase: 1,
      sobrietyStartDate: null,
      moveInDate: now,
      moveOutDate: null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ resident }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
  }
}
