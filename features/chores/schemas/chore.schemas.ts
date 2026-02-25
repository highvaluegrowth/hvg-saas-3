import { z } from 'zod';

export const CreateChoreSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  houseIds: z.array(z.string()).default([]),
  assigneeIds: z.array(z.string()).default([]),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export const UpdateChoreSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  houseIds: z.array(z.string()).optional(),
  assigneeIds: z.array(z.string()).optional(),
  dueDate: z.coerce.date().optional(),
  status: z.enum(['pending', 'in_progress', 'done', 'overdue']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export type CreateChoreInput = z.infer<typeof CreateChoreSchema>;
export type UpdateChoreInput = z.infer<typeof UpdateChoreSchema>;
