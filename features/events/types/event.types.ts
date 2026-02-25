import { BaseDocument } from '@/lib/firestore/types';

export type ProgramEventType =
  | 'group_meeting'
  | 'house_meeting'
  | 'class'
  | 'course'
  | 'na_meeting'
  | 'aa_meeting'
  | 'church'
  | 'bible_study'
  | 'therapy_session'
  | 'job_training'
  | 'community_service'
  | 'outing'
  | 'other';

export interface EventRecurrence {
  pattern: 'daily' | 'weekly' | 'monthly';
  daysOfWeek?: number[]; // 0=Sun, 6=Sat
  endsAt?: Date;
}

export interface ProgramEvent extends BaseDocument {
  tenantId: string;
  title: string;
  description?: string;
  type: ProgramEventType;
  houseIds: string[];
  scheduledAt: Date;
  duration: number; // minutes
  location?: string;
  facilitator?: string;
  recurrence?: EventRecurrence;
  attendeeIds: string[];
  createdBy: string;
}

export interface CreateProgramEventInput {
  title: string;
  description?: string;
  type: ProgramEventType;
  houseIds?: string[];
  scheduledAt: Date;
  duration: number;
  location?: string;
  facilitator?: string;
  recurrence?: EventRecurrence;
}

export interface UpdateProgramEventInput {
  title?: string;
  description?: string;
  type?: ProgramEventType;
  houseIds?: string[];
  scheduledAt?: Date;
  duration?: number;
  location?: string;
  facilitator?: string;
  recurrence?: EventRecurrence;
  attendeeIds?: string[];
}
