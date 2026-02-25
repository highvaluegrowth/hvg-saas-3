import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { createIncidentService } from '@/features/incidents/services/incidentService';
import { CreateIncidentSchema } from '@/features/incidents/schemas/incident.schemas';
import { canReadAll } from '@/lib/utils/permissions';
import { UserRole } from '@/features/auth/types/auth.types';

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

    const incidentService = createIncidentService(tenantId);
    const incidents = await incidentService.getAllIncidents();

    return NextResponse.json({ incidents });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    return NextResponse.json({ error: message }, { status });
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

    // staff+ can report incidents (not residents)
    if (!canReadAll(token.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden: staff access required' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = CreateIncidentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const incidentService = createIncidentService(tenantId);
    const incident = await incidentService.createIncident(parsed.data, token.uid);

    return NextResponse.json({ incident }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    return NextResponse.json({ error: message }, { status });
  }
}
