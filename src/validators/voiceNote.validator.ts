import { z } from 'zod';

export const createVoiceNoteSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  title: z.string().min(1, 'Title is required').max(200),
  duration: z.number().min(1, 'Duration must be at least 1 second').max(7200),
  recordedAt: z.string().datetime('Invalid datetime format'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateVoiceNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  duration: z.number().min(1).max(7200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateVoiceNoteInput = z.infer<typeof createVoiceNoteSchema>;
export type UpdateVoiceNoteInput = z.infer<typeof updateVoiceNoteSchema>;
