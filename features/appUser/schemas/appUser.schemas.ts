import { z } from 'zod';

// ─── Shared sub-schemas ───────────────────────────────────────────────────────

const FaithProfileSchema = z.object({
  religion: z.enum(['christian', 'muslim', 'buddhist', 'jewish', 'hindu', 'agnostic', 'atheist']),
  denomination: z.string().optional(),
});

const SubstanceEntrySchema = z.object({
  id: z.string(),
  substance: z.string(),
  startDate: z.string(),      // MM/YYYY
});

const GoalSchema = z.object({
  id: z.string(),
  category: z.enum(['recovery', 'fitness', 'professional', 'personal']),
  specific: z.string(),
  measurable: z.string(),
  achievable: z.string().optional(),
  relevant: z.string().optional(),
  timeBound: z.string().optional(),
  dueDate: z.string().optional(),
  createdAt: z.string(),
});

const SkillEntrySchema = z.object({
  id: z.string(),
  description: z.string(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  yearsPracticed: z.number(),
});

const WorkEntrySchema = z.object({
  id: z.string(),
  company: z.string(),
  position: z.string(),
  start: z.string(),
  end: z.string().optional(),
});

const EducationEntrySchema = z.object({
  id: z.string(),
  institution: z.string(),
  focus: z.string(),
  start: z.string(),
  end: z.string().optional(),
});

const CapabilitiesSchema = z.object({
  skills: z.array(SkillEntrySchema),
  workExperience: z.array(WorkEntrySchema),
  education: z.array(EducationEntrySchema),
});

const MoralResponseSchema = z.object({
  questionId: z.string(),
  type: z.enum(['trolley', 'two_options', 'likert_7']),
  answer: z.union([z.string(), z.number()]),
  answeredAt: z.string(),
});

// ─── Main schemas ─────────────────────────────────────────────────────────────

export const CreateAppUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  photoURL: z.string().url().optional(),
  tenantIds: z.array(z.string()).optional(),
  preferences: z.array(z.string()).optional(),
});

export const UpdateAppUserSchema = z.object({
  displayName: z.string().min(1).optional(),
  photoURL: z.string().url().optional(),
  tenantIds: z.array(z.string()).optional(),
  preferences: z.array(z.string()).optional(),

  // Profile builder fields
  faith: FaithProfileSchema.optional(),
  sobrietyStatus: z.enum(['recovery', 'active_addiction', 'detoxing']).optional(),
  sobrietyCleanSince: z.string().nullable().optional(),
  substances: z.array(SubstanceEntrySchema).optional(),
  goals: z.array(GoalSchema).optional(),
  capabilities: CapabilitiesSchema.optional(),
  morals: z.array(MoralResponseSchema).optional(),
  profileComplete: z.boolean().optional(),

  // Legacy fields
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

