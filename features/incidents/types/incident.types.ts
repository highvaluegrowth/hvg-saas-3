import { BaseDocument } from '@/lib/firestore/types';

export type IncidentType = 'medical' | 'behavioral' | 'property' | 'safety' | 'other';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export interface Incident extends BaseDocument {
  tenantId: string;
  title: string;
  description: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  houseId?: string;
  involvedResidentIds: string[];
  involvedStaffIds: string[];
  reportedBy: string;
  reportedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}
