/**
 * Validation Schemas
 * ====================
 * Zod schemas for data validation
 */

import { z } from 'zod';

// =============================================================================
// Auth Schemas
// =============================================================================

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Auth form data types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// =============================================================================
// Ability Schemas
// =============================================================================

export const abilitiesSchema = z.object({
  strength: z.number().int().min(-2).max(6),
  vitality: z.number().int().min(-2).max(6),
  agility: z.number().int().min(-2).max(6),
  acuity: z.number().int().min(-2).max(6),
  intelligence: z.number().int().min(-2).max(6),
  charisma: z.number().int().min(-2).max(6),
});

export type AbilitiesInput = z.infer<typeof abilitiesSchema>;

// =============================================================================
// Character Schemas
// =============================================================================

export const characterNameSchema = z
  .string()
  .min(1, 'Character name is required')
  .max(50, 'Character name must be less than 50 characters')
  .regex(/^[a-zA-Z0-9\s\-']+$/, 'Character name contains invalid characters');

export const characterBasicsSchema = z.object({
  name: characterNameSchema,
  description: z.string().max(1000).optional(),
});

export const characterCreationSchema = z.object({
  name: characterNameSchema,
  level: z.number().int().min(1).max(20).default(1),
  abilities: abilitiesSchema,
  archetypeId: z.string().optional(),
  ancestryId: z.string().optional(),
});

export type CharacterBasicsInput = z.infer<typeof characterBasicsSchema>;
export type CharacterCreationInput = z.infer<typeof characterCreationSchema>;

// =============================================================================
// Defense Skills Schema
// =============================================================================

export const defenseSkillsSchema = z.object({
  might: z.number().int().min(0).max(3).default(0),
  fortitude: z.number().int().min(0).max(3).default(0),
  reflex: z.number().int().min(0).max(3).default(0),
  discernment: z.number().int().min(0).max(3).default(0),
  mentalFortitude: z.number().int().min(0).max(3).default(0),
  resolve: z.number().int().min(0).max(3).default(0),
});

export type DefenseSkillsInput = z.infer<typeof defenseSkillsSchema>;

// =============================================================================
// Resource Pool Schema
// =============================================================================

export const resourcePoolSchema = z.object({
  current: z.number().int().min(0),
  max: z.number().int().min(0),
  temporary: z.number().int().min(0).optional(),
});

export type ResourcePoolInput = z.infer<typeof resourcePoolSchema>;
