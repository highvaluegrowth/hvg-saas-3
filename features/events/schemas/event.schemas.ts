import { z } from 'zod';

export const EventRecurrenceSchema = z.object({
  pattern: z.enum(['daily', 'weekly', 'monthly']),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  endsAt: z.coerce.date().optional(),
});

export const CreateProgramEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['group_meeting', 'house_meeting', 'class', 'course', 'na_meeting', 'aa_meeting', 'church', 'bible_study', 'therapy_session', 'job_training', 'community_service', 'outing', 'other']),
  houseIds: z.array(z.string()).default([]),
  scheduledAt: z.coerce.date(),
  duration: z.number().int().min(1, 'Duration must be at least 1 minute'),
  location: z.string().optional(),
  facilitator: z.string().optional(),
  recurrence: EventRecurrenceSchema.optional(),
});

export const UpdateProgramEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['group_meeting', 'house_meeting', 'class', 'course', 'na_meeting', 'aa_meeting', 'church', 'bible_study', 'therapy_session', 'job_training', 'community_service', 'outing', 'other']).optional(),
  houseIds: z.array(z.string()).optional(),
  scheduledAt: z.coerce.date().optional(),
  duration: z.number().int().min(1).optional(),
  location: z.string().optional(),
  facilitator: z.string().optional(),
  recurrence: EventRecurrenceSchema.optional(),
  attendeeIds: z.array(z.string()).optional(),
});

export type CreateProgramEventInput = z.infer<typeof CreateProgramEventSchema>;
export type UpdateProgramEventInput = z.infer<typeof UpdateProgramEventSchema>;
