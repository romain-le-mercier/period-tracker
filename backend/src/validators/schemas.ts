import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// Period schemas
export const createPeriodSchema = z.object({
  body: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    flowIntensity: z.enum(['LIGHT', 'MEDIUM', 'HEAVY', 'SPOTTING', 'NO_PERIOD']).optional(),
    symptoms: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
});

export const updatePeriodSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    flowIntensity: z.enum(['LIGHT', 'MEDIUM', 'HEAVY', 'SPOTTING', 'NO_PERIOD']).optional(),
    symptoms: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
});

// Settings schemas
export const updateSettingsSchema = z.object({
  body: z.object({
    cycleLength: z.number().int().min(15).max(50).optional(),
    periodLength: z.number().int().min(1).max(15).optional(),
    lutealPhaseLength: z.number().int().min(7).max(21).optional(),
    reminderDays: z.array(z.number().int().min(0).max(7)).optional(),
    enableReminders: z.boolean().optional(),
    enablePredictions: z.boolean().optional(),
    theme: z.enum(['LIGHT', 'DARK', 'AUTO']).optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    privacyMode: z.boolean().optional(),
  }),
});

// Query schemas
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const dateRangeSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});