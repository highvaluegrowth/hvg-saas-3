import { z } from 'zod';

export const CreateAppUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  photoURL: z.string().url().optional(),
});

export const UpdateAppUserSchema = z.object({
  displayName: z.string().min(1).optional(),
  photoURL: z.string().url().optional(),
  sobrietyDate: z.coerce.date().nullable().optional(),
  recoveryGoals: z.array(z.string()).optional(),
  notificationPreferences: z
    .object({
      events: z.boolean(),
      chores: z.boolean(),
      rides: z.boolean(),
      messages: z.boolean(),
    })
    .optional(),
});

export type CreateAppUserInput = z.infer<typeof CreateAppUserSchema>;
export type UpdateAppUserInput = z.infer<typeof UpdateAppUserSchema>;
