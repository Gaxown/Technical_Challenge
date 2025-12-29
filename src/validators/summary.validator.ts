import { z } from 'zod';

export const createSummarySchema = z.object({
  voiceNoteId: z.string().uuid('Invalid voice note ID'),
  content: z.string().min(10, 'Summary must be at least 10 characters').max(5000),
  keywords: z.array(z.string()).optional(),
});

export const updateSummarySchema = z.object({
  content: z.string().min(10).max(5000).optional(),
  keywords: z.array(z.string()).optional(),
});

export type CreateSummaryInput = z.infer<typeof createSummarySchema>;
export type UpdateSummaryInput = z.infer<typeof updateSummarySchema>;
