import { z } from 'zod';

export const CreateIncidentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['medical', 'behavioral', 'property', 'safety', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  houseId: z.string().optional(),
  involvedResidentIds: z.array(z.string()).default([]),
  involvedStaffIds: z.array(z.string()).default([]),
  reportedAt: z.coerce.date().optional(),
});

export const UpdateIncidentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['medical', 'behavioral', 'property', 'safety', 'other']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
  houseId: z.string().optional(),
  involvedResidentIds: z.array(z.string()).optional(),
  involvedStaffIds: z.array(z.string()).optional(),
  resolvedAt: z.coerce.date().optional(),
  resolution: z.string().optional(),
});

export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof UpdateIncidentSchema>;
