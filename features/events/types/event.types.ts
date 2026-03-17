import { BaseDocument } from '@/lib/firestore/types';

export type ProgramEventType =
  | 'group_meeting' | 'house_meeting' | 'class' | 'course'
  | 'na_meeting' | 'aa_meeting' | 'church' | 'bible_study'
  | 'therapy_session' | 'job_training' | 'community_service' | 'outing' | 'other';

export type EventVisibility = 'universal' | 'tenant' | 'house';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
export type RecurrenceDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type RecurrenceEndType = 'never' | 'after' | 'on_date';

export interface EventRecurrence {
  frequency: RecurrenceFrequency;
  days?: RecurrenceDay[];
  endType: RecurrenceEndType;
  endAfter?: number;
  endDate?: string;
}

export interface ProgramEvent extends BaseDocument {
  tenantId: string;
  title: string;
  description?: string;
  type: ProgramEventType;
  houseIds: string[];
  visibility: EventVisibility;
  houseId?: string;
  scheduledAt: Date;
  duration: number;
  location?: string;
  facilitator?: string;
  recurrence?: EventRecurrence;
  attendeeIds: string[];
  createdBy: string;
  coverImageUrl?: string;
  requireVerification?: boolean;
  verificationPin?: string;
}

export interface CreateProgramEventInput {
  title: string;
  description?: string;
  type: ProgramEventType;
  houseIds?: string[];
  visibility?: EventVisibility;
  houseId?: string;
  scheduledAt: Date;
  duration: number;
  location?: string;
  facilitator?: string;
  recurrence?: EventRecurrence;
  coverImageUrl?: string;
  requireVerification?: boolean;
  verificationPin?: string;
}

export interface UpdateProgramEventInput {
  title?: string;
  description?: string;
  type?: ProgramEventType;
  houseIds?: string[];
  visibility?: EventVisibility;
  houseId?: string;
  scheduledAt?: Date;
  duration?: number;
  location?: string;
  facilitator?: string;
  recurrence?: EventRecurrence;
  attendeeIds?: string[];
  requireVerification?: boolean;
  verificationPin?: string;
}
