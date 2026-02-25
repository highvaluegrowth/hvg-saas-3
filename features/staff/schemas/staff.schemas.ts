import { z } from 'zod';

export const ShiftTimeSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
});

export const StaffScheduleSchema = z.object({
  monday: ShiftTimeSchema.optional(),
  tuesday: ShiftTimeSchema.optional(),
  wednesday: ShiftTimeSchema.optional(),
  thursday: ShiftTimeSchema.optional(),
  friday: ShiftTimeSchema.optional(),
  saturday: ShiftTimeSchema.optional(),
  sunday: ShiftTimeSchema.optional(),
});

export const CreateStaffSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  role: z.enum(['house_manager', 'staff', 'staff_admin']),
  houseIds: z.array(z.string()).default([]),
  schedule: StaffScheduleSchema.optional(),
});

export const UpdateStaffSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(['house_manager', 'staff', 'staff_admin']).optional(),
  houseIds: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  schedule: StaffScheduleSchema.optional(),
});

export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;
export type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>;
