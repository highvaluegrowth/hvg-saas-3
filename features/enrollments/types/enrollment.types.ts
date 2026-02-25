import { BaseDocument } from '@/lib/firestore/types';

export type EnrollmentStatus = 'waitlist' | 'active' | 'graduated' | 'discharged';
export type DischargeReason = 'graduated' | 'voluntary' | 'rule_violation' | 'relapse' | 'other';

export interface Enrollment extends BaseDocument {
  tenantId: string;
  residentId: string;
  houseId: string | null;
  roomId: string | null;
  bedId: string | null;
  status: EnrollmentStatus;
  phase: 1 | 2 | 3 | 4;
  sobrietyStartDate: Date | null;
  moveInDate: Date | null;
  moveOutDate: Date | null;
  dischargeReason?: DischargeReason;
}

export interface CreateEnrollmentInput {
  residentId: string;
  houseId?: string | null;
  roomId?: string | null;
  bedId?: string | null;
  status?: EnrollmentStatus;
  phase?: 1 | 2 | 3 | 4;
  sobrietyStartDate?: Date | null;
  moveInDate?: Date | null;
}

export interface UpdateEnrollmentInput {
  houseId?: string | null;
  roomId?: string | null;
  bedId?: string | null;
  status?: EnrollmentStatus;
  phase?: 1 | 2 | 3 | 4;
  sobrietyStartDate?: Date | null;
  moveInDate?: Date | null;
  moveOutDate?: Date | null;
  dischargeReason?: DischargeReason;
}
