import { z } from 'zod';

export const CreateEnrollmentSchema = z.object({
  residentId: z.string().min(1, 'Resident ID is required'),
  houseId: z.string().nullable().optional(),
  roomId: z.string().nullable().optional(),
  bedId: z.string().nullable().optional(),
  status: z.enum(['waitlist', 'active', 'graduated', 'discharged']).default('waitlist'),
  phase: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).default(1),
  sobrietyStartDate: z.coerce.date().nullable().optional(),
  moveInDate: z.coerce.date().nullable().optional(),
});

export const UpdateEnrollmentSchema = z.object({
  houseId: z.string().nullable().optional(),
  roomId: z.string().nullable().optional(),
  bedId: z.string().nullable().optional(),
  status: z.enum(['waitlist', 'active', 'graduated', 'discharged']).optional(),
  phase: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  sobrietyStartDate: z.coerce.date().nullable().optional(),
  moveInDate: z.coerce.date().nullable().optional(),
  moveOutDate: z.coerce.date().nullable().optional(),
  dischargeReason: z.enum(['graduated', 'voluntary', 'rule_violation', 'relapse', 'other']).optional(),
});

export type CreateEnrollmentInput = z.infer<typeof CreateEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof UpdateEnrollmentSchema>;
