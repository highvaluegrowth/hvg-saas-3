import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { CreateResidentSchema } from '@/features/residents/schemas/resident.schemas';
import { canWrite } from '@/lib/utils/permissions';
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

    // Fetch resident profiles from the global /residents collection
    // Firebase 'in' queries are limited to 30 items
    const residents: any[] = [];

    for (let i = 0; i < uniqueIds.length; i += 30) {
      const chunk = uniqueIds.slice(i, i + 30);
      const profilesSnap = await adminDb.collection('residents').where(FieldPath.documentId(), 'in', chunk).get();

      const profileMap = new Map<string, FirebaseFirestore.DocumentData>();
      profilesSnap.docs.forEach(d => profileMap.set(d.id, d.data()));

      enrollmentsSnap.docs.forEach(eDoc => {
        const eData = eDoc.data();
        if (chunk.includes(eData.residentId)) {
          const profile = profileMap.get(eData.residentId);
          if (profile) {
            const nameParts = [profile.firstName, profile.lastName].filter(Boolean);
            const name = nameParts.length > 0 ? nameParts.join(' ') : (profile.displayName || profile.name || 'Unknown Resident');
            if (!search || name.toLowerCase().includes(search)) {
              residents.push({
                id: eData.residentId,
                enrollmentId: eDoc.id,
                name,
                email: profile.email ?? null,
                phone: profile.phone ?? null,
                status: eData.status,
                houseId: eData.houseId ?? null,
                phase: eData.phase ?? null,
                moveInDate: eData.moveInDate ?? null,
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

    // Atomically create the resident profile and their enrollment
    const now = Timestamp.now();
    const residentRef = adminDb.collection('residents').doc();
    const enrollmentRef = adminDb.collection(`tenants/${tenantId}/enrollments`).doc();

    const residentData = {
      ...parsed.data,
      secondarySubstances: parsed.data.secondarySubstances ?? [],
      treatmentHistory: parsed.data.treatmentHistory ?? '',
      allergies: parsed.data.allergies ?? [],
      medications: parsed.data.medications ?? [],
      diagnosisCodes: parsed.data.diagnosisCodes ?? [],
      notes: parsed.data.notes ?? '',
      createdAt: now,
      updatedAt: now,
    };

    const enrollmentData = {
      residentId: residentRef.id,
      tenantId,
      status: 'active',
      phase: 1,
      houseId: null,
      roomId: null,
      bedId: null,
      sobrietyStartDate: null,
      moveInDate: now,
      moveOutDate: null,
      createdAt: now,
      updatedAt: now,
    };

    const batch = adminDb.batch();
    batch.set(residentRef, residentData);
    batch.set(enrollmentRef, enrollmentData);
    await batch.commit();

    const resident = { id: residentRef.id, ...residentData };
    return NextResponse.json({ resident }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
  }
}
