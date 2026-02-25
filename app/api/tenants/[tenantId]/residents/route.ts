import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { residentService } from '@/features/residents/services/residentService';
import { CreateResidentSchema } from '@/features/residents/schemas/resident.schemas';
import { canWrite } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';

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
    const search = url.searchParams.get('search');

    let residents;
    if (search) {
      residents = await residentService.searchByName(search);
    } else {
      const { items } = await residentService.query({
        orderBy: { field: 'lastName', direction: 'asc' },
        limit: 100,
      });
      residents = items;
    }

    return NextResponse.json({ residents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
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

    return NextResponse.json({ resident }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
  }
}
