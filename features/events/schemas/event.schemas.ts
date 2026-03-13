import { z } from 'zod';

export const EventRecurrenceSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'custom']),
  days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).optional(),
  endType: z.enum(['never', 'after', 'on_date']),
  endAfter: z.number().int().positive().optional(),
  endDate: z.string().optional(),
});

const EventTypeEnum = z.enum([
  'group_meeting', 'house_meeting', 'class', 'course',
  'na_meeting', 'aa_meeting', 'church', 'bible_study',
  'therapy_session', 'job_training', 'community_service', 'outing', 'other',
]);

const EventVisibilitySchema = z.enum(['universal', 'tenant', 'house']).default('tenant');

export const CreateProgramEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: EventTypeEnum,
  houseIds: z.array(z.string()).default([]),
  visibility: EventVisibilitySchema,
  houseId: z.string().optional(),
  scheduledAt: z.coerce.date(),
  duration: z.number().int().min(1),
  location: z.string().optional(),
  facilitator: z.string().optional(),
  recurrence: EventRecurrenceSchema.optional(),
  coverImageUrl: z.string().optional(),
}).refine(
  (data) => data.visibility !== 'house' || !!data.houseId,
  { message: 'houseId is required when visibility is "house"', path: ['houseId'] }
);

export const UpdateProgramEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: EventTypeEnum.optional(),
  houseIds: z.array(z.string()).optional(),
  visibility: z.enum(['universal', 'tenant', 'house']).optional(),
  houseId: z.string().optional(),
  scheduledAt: z.coerce.date().optional(),
  duration: z.number().int().min(1).optional(),
  location: z.string().optional(),
  facilitator: z.string().optional(),
  recurrence: EventRecurrenceSchema.optional(),
  attendeeIds: z.array(z.string()).optional(),
});

export type CreateProgramEventInput = z.infer<typeof CreateProgramEventSchema>;
export type UpdateProgramEventInput = z.infer<typeof UpdateProgramEventSchema>;
