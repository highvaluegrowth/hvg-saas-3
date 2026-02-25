import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { createVehicleService } from '@/features/vehicles/services/vehicleService';
import { UpdateVehicleSchema } from '@/features/vehicles/schemas/vehicle.schemas';
import { canWrite } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; vehicleId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId, vehicleId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const vehicleService = createVehicleService(tenantId);
    const vehicle = await vehicleService.getById(vehicleId);

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json({ vehicle });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; vehicleId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId, vehicleId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!canWrite(token.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = UpdateVehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const vehicleService = createVehicleService(tenantId);
    await vehicleService.updateVehicle(vehicleId, parsed.data);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; vehicleId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId, vehicleId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!canWrite(token.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
    }

    const vehicleService = createVehicleService(tenantId);
    await vehicleService.delete(vehicleId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
  }
}
