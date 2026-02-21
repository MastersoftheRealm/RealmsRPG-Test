/**
 * API Validation Helpers
 * =======================
 * Shared validation utilities for API route handlers.
 * Uses Zod for schema validation.
 *
 * Usage:
 *   import { validateJson, characterCreateSchema } from '@/lib/api-validation';
 *   const result = await validateJson(request, characterCreateSchema);
 *   if (!result.success) return result.error; // NextResponse with 400
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';

// =============================================================================
// Helpers
// =============================================================================

const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Validate Content-Type header and parse + validate JSON body.
 * Returns { success: true, data } or { success: false, error: NextResponse }.
 */
export async function validateJson<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  // Content-Type check
  const ct = request.headers.get('content-type') ?? '';
  if (!ct.includes('application/json') && !ct.includes('text/plain')) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415 }
      ),
    };
  }

  // Size check (if Content-Length available)
  const cl = request.headers.get('content-length');
  if (cl && parseInt(cl, 10) > MAX_PAYLOAD_BYTES) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Payload too large (max 2 MB)' },
        { status: 413 }
      ),
    };
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  // Validate against schema
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Validation failed', details: issues },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: result.data };
}

// =============================================================================
// Character Schemas
// =============================================================================

/** Minimal required fields for character creation. Data blob validated at top level. */
export const characterCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  level: z.number().int().min(1).max(20).optional().default(1),
  duplicateOf: z.string().uuid().optional(),
}).passthrough(); // Allow additional character data fields

/** Character update — partial, all fields optional */
export const characterUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  level: z.number().int().min(1).max(20).optional(),
  visibility: z.enum(['private', 'campaign', 'public']).optional(),
}).passthrough();

// =============================================================================
// Encounter Schemas
// =============================================================================

export const encounterCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  type: z.enum(['combat', 'skill', 'mixed']).optional().default('combat'),
  description: z.string().max(5000).optional(),
}).passthrough();

const combatantSchema = z.record(z.string(), z.unknown());
export const encounterUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(['combat', 'skill', 'mixed']).optional(),
  description: z.string().max(5000).optional(),
  combatants: z.array(combatantSchema).optional(),
  round: z.number().int().min(0).optional(),
  currentTurnIndex: z.number().int().optional(),
  status: z.enum(['preparing', 'active', 'completed']).optional(),
  isActive: z.boolean().optional(),
  campaignId: z.string().uuid().optional().nullable(),
  applySurprise: z.boolean().optional(),
  skillEncounter: z.record(z.string(), z.unknown()).optional().nullable(),
  updatedAt: z.string().optional(),
}).passthrough();

// =============================================================================
// Library Item Schemas
// =============================================================================

export const libraryItemCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  duplicateOf: z.string().uuid().optional(),
}).passthrough();

export const libraryItemUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
}).passthrough();

// =============================================================================
// Campaign Roll Schemas
// =============================================================================

export const campaignRollCreateSchema = z.object({
  characterId: z.string().min(1, 'characterId required'),
  characterName: z.string().min(1, 'characterName required'),
  roll: z.object({
    type: z.string().min(1),
    title: z.string().min(1),
    dice: z.array(z.unknown()).optional().default([]),
    modifier: z.number().optional().default(0),
    total: z.number().optional().default(0),
    isCrit: z.boolean().optional().default(false),
    isCritFail: z.boolean().optional().default(false),
    critMessage: z.string().nullable().optional(),
  }),
});

// =============================================================================
// Public Library Schemas (admin-only)
// =============================================================================

/** Permissive schema for admin public item creation/update — validates shape, not content. */
export const publicItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(200).optional(),
}).passthrough();
