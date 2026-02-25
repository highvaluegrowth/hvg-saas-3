import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { createVehicleService } from '@/features/vehicles/services/vehicleService';
import { CreateMaintenanceLogSchema } from '@/features/vehicles/schemas/vehicle.schemas';

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
    const logs = await vehicleService.getMaintenanceLogs(vehicleId);

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; vehicleId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId, vehicleId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = CreateMaintenanceLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const vehicleService = createVehicleService(tenantId);
    const log = await vehicleService.addMaintenanceLog(vehicleId, parsed.data);

    return NextResponse.json({ log }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
  }
}
