import { z } from 'zod';

// ─── Conversation ─────────────────────────────────────────────────────────────

export const ConversationTypeSchema = z.enum([
  'dm',
  'group',
  'course',
  'event',
  'application_thread',
  'system_alert',
  'ai_chat',
]);

export type ConversationType = z.infer<typeof ConversationTypeSchema>;

export const LastMessageSchema = z.object({
  text: z.string(),
  senderId: z.string(),
  createdAt: z.date(),
});

export const ConversationSchema = z.object({
  id: z.string(),
  type: ConversationTypeSchema,
  participants: z.array(z.string()).min(1),
  tenantId: z.string().nullable(),
  title: z.string().nullable(),
  lastMessage: LastMessageSchema.nullable().optional(),
  updatedAt: z.date(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export type Conversation = z.infer<typeof ConversationSchema>;

// Input for creating — `id` and `updatedAt` are assigned server-side
export const CreateConversationInputSchema = ConversationSchema.omit({ id: true, updatedAt: true }).extend({
  participants: z.array(z.string()).min(2),
});

export type CreateConversationInput = z.infer<typeof CreateConversationInputSchema>;

// ─── Message ─────────────────────────────────────────────────────────────────

export const MessageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  text: z.string().min(1),
  createdAt: z.date(),
  readBy: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export type Message = z.infer<typeof MessageSchema>;

// Input for sending — `id` and `createdAt` are assigned server-side
export const SendMessageInputSchema = MessageSchema.omit({ id: true, createdAt: true });

export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;
