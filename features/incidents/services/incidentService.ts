import { adminDb } from '@/lib/firebase/admin';
import { BaseRepository } from '@/lib/firestore';
import { Incident } from '../types/incident.types';
import type { CreateIncidentInput, UpdateIncidentInput } from '../schemas/incident.schemas';

class IncidentService extends BaseRepository<Incident> {
  private tenantId: string;

  constructor(tenantId: string) {
    super(adminDb, `tenants/${tenantId}/incidents`);
    this.tenantId = tenantId;
  }

  async createIncident(input: CreateIncidentInput, reportedBy: string): Promise<Incident> {
    return this.create({
      ...input,
      tenantId: this.tenantId,
      status: 'open',
      involvedResidentIds: input.involvedResidentIds ?? [],
      involvedStaffIds: input.involvedStaffIds ?? [],
      reportedBy,
      reportedAt: input.reportedAt ?? new Date(),
    });
  }

  async updateIncident(incidentId: string, input: UpdateIncidentInput): Promise<void> {
    return this.update(incidentId, input);
  }

  async getAllIncidents(): Promise<Incident[]> {
    const result = await this.query({
      orderBy: { field: 'reportedAt', direction: 'desc' },
    });
    return result.items;
  }

  async getByStatus(status: Incident['status']): Promise<Incident[]> {
    const result = await this.query({
      where: [{ field: 'status', operator: '==', value: status }],
      orderBy: { field: 'reportedAt', direction: 'desc' },
    });
    return result.items;
  }
}

export function createIncidentService(tenantId: string): IncidentService {
  return new IncidentService(tenantId);
}
