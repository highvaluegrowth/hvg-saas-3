import { z } from 'zod';

export const MedicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  prescribedBy: z.string().optional(),
});

export const PhysicianSchema = z.object({
  name: z.string().min(1, 'Physician name is required'),
  phone: z.string().min(1, 'Phone is required'),
  clinic: z.string().min(1, 'Clinic is required'),
});

export const InsuranceSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  memberId: z.string().min(1, 'Member ID is required'),
  groupNumber: z.string().optional(),
});

export const EmergencyContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  phone: z.string().min(1, 'Contact phone is required'),
  relationship: z.string().min(1, 'Relationship is required'),
});

export const CreateResidentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.coerce.date(),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  photoUrl: z.string().url().optional(),
  primarySubstance: z.string().min(1, 'Primary substance is required'),
  secondarySubstances: z.array(z.string()).default([]),
  treatmentHistory: z.string().default(''),
  height: z.string().optional(),
  weight: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  medications: z.array(MedicationSchema).default([]),
  diagnosisCodes: z.array(z.string()).default([]),
  physician: PhysicianSchema.optional(),
  insurance: InsuranceSchema.optional(),
  employer: z.string().optional(),
  jobTitle: z.string().optional(),
  workSchedule: z.string().optional(),
  workPhone: z.string().optional(),
  emergencyContact: EmergencyContactSchema,
  notes: z.string().default(''),
});

export const UpdateResidentSchema = CreateResidentSchema.partial().extend({
  firebaseUid: z.string().nullable().optional(),
});

export const CreateResidentEventSchema = z.object({
  type: z.enum(['appointment', 'meeting', 'class', 'drug_test', 'check_in', 'note']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  scheduledAt: z.coerce.date(),
  createdBy: z.string().min(1, 'Creator is required'),
});

export const UpdateResidentEventSchema = z.object({
  status: z.enum(['scheduled', 'completed', 'missed', 'cancelled']).optional(),
  completedAt: z.coerce.date().optional(),
  description: z.string().optional(),
});

export type CreateResidentInput = z.infer<typeof CreateResidentSchema>;
export type UpdateResidentInput = z.infer<typeof UpdateResidentSchema>;
export type CreateResidentEventInput = z.infer<typeof CreateResidentEventSchema>;
export type UpdateResidentEventInput = z.infer<typeof UpdateResidentEventSchema>;
