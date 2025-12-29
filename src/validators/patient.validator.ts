import { z } from 'zod';

export const createPatientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.email('Invalid email address'),
  phone: z.string().optional(),
  dateOfBirth: z.string().date('Date must be valid and in YYYY-MM-DD format').optional(),
});

export const updatePatientSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().date('Date must be valid and in YYYY-MM-DD format').optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
