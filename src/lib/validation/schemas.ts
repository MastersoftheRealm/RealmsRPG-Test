/**
 * Validation Schemas
 * ====================
 * Zod schemas for data validation
 */

import { z } from 'zod';
import { validateUsername } from '@/lib/username-rules';

// =============================================================================
// Auth Schemas
// =============================================================================

/** Trim + lowercase so pasted emails with spaces do not fail as "invalid". */
const authEmailSchema = z.string().trim().toLowerCase().email('Please enter a valid email address');

export const loginSchema = z.object({
  email: authEmailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    email: authEmailSchema,
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    username: z.string().max(24).optional().or(z.literal('')),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .superRefine((data, ctx) => {
    const username = data.username?.trim();
    if (!username) return;
    const result = validateUsername(username);
    if (!result.ok) {
      ctx.addIssue({ code: 'custom', message: result.error, path: ['username'] });
    }
  });

export const forgotPasswordSchema = z.object({
  email: authEmailSchema,
});

// Auth form data types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
