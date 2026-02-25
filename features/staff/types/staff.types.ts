import { BaseDocument } from '@/lib/firestore/types';

export type StaffRole = 'house_manager' | 'staff' | 'staff_admin';
export type StaffStatus = 'active' | 'inactive';

export interface ShiftTime {
  start: string; // "08:00"
  end: string;   // "16:00"
}

export interface StaffSchedule {
  monday?: ShiftTime;
  tuesday?: ShiftTime;
  wednesday?: ShiftTime;
  thursday?: ShiftTime;
  friday?: ShiftTime;
  saturday?: ShiftTime;
  sunday?: ShiftTime;
}

export interface StaffMember extends BaseDocument {
  userId: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: StaffRole;
  houseIds: string[];
  status: StaffStatus;
  schedule?: StaffSchedule;
}

export interface CreateStaffInput {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: StaffRole;
  houseIds?: string[];
  schedule?: StaffSchedule;
}

export interface UpdateStaffInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: StaffRole;
  houseIds?: string[];
  status?: StaffStatus;
  schedule?: StaffSchedule;
}
