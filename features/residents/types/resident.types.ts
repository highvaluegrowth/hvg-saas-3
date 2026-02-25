import { BaseDocument } from '@/lib/firestore/types';

export type ResidentGender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy?: string;
}

export interface PhysicianInfo {
  name: string;
  phone: string;
  clinic: string;
}

export interface InsuranceInfo {
  provider: string;
  memberId: string;
  groupNumber?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface Resident extends BaseDocument {
  // Identity
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: ResidentGender;
  email: string;
  phone: string;
  photoUrl?: string;

  // Substance history
  primarySubstance: string;
  secondarySubstances: string[];
  treatmentHistory: string;

  // Vitals
  height?: string;
  weight?: string;
  bloodType?: string;
  allergies: string[];
  medications: Medication[];

  // Clinical
  diagnosisCodes: string[];
  physician?: PhysicianInfo;
  insurance?: InsuranceInfo;

  // Employment
  employer?: string;
  jobTitle?: string;
  workSchedule?: string;
  workPhone?: string;

  // Emergency contact
  emergencyContact: EmergencyContact;

  notes: string;

  // Mobile app link
  firebaseUid?: string | null;   // links to /users/{uid} when resident uses the app
}

export type ResidentEventType =
  | 'appointment'
  | 'meeting'
  | 'class'
  | 'drug_test'
  | 'check_in'
  | 'note';

export type ResidentEventStatus =
  | 'scheduled'
  | 'completed'
  | 'missed'
  | 'cancelled';

export interface ResidentEvent extends BaseDocument {
  residentId: string;
  type: ResidentEventType;
  title: string;
  description?: string;
  scheduledAt: Date;
  completedAt?: Date;
  status: ResidentEventStatus;
  createdBy: string;
}

export interface CreateResidentInput {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: ResidentGender;
  email: string;
  phone: string;
  photoUrl?: string;
  primarySubstance: string;
  secondarySubstances?: string[];
  treatmentHistory?: string;
  height?: string;
  weight?: string;
  bloodType?: string;
  allergies?: string[];
  medications?: Medication[];
  diagnosisCodes?: string[];
  physician?: PhysicianInfo;
  insurance?: InsuranceInfo;
  employer?: string;
  jobTitle?: string;
  workSchedule?: string;
  workPhone?: string;
  emergencyContact: EmergencyContact;
  notes?: string;
}

export interface CreateResidentEventInput {
  type: ResidentEventType;
  title: string;
  description?: string;
  scheduledAt: Date;
  createdBy: string;
}
