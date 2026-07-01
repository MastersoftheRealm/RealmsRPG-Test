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

/** Reject prototype-pollution keys and bound JSON blob size on mutation payloads (TASK-359). */
const UNSAFE_PAYLOAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_MUTATION_KEYS = 500;

function isSafeMutationPayload(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj);
  if (keys.length > MAX_MUTATION_KEYS) return false;
  return !keys.some((key) => UNSAFE_PAYLOAD_KEYS.has(key));
}

function withSafeJsonBlob<T extends z.ZodRawShape>(shape: T) {
  return z
    .object(shape)
    .catchall(z.unknown())
    .refine(isSafeMutationPayload, { message: 'Payload has too many fields or invalid keys' });
}

/** Minimal required fields for character creation. Additional character fields allowed via catchall. */
export const characterCreateSchema = withSafeJsonBlob({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  level: z.number().int().min(1).max(20).optional().default(1),
  duplicateOf: z.string().uuid().optional(),
});

/** Character update — partial, all fields optional */
export const characterUpdateSchema = withSafeJsonBlob({
  name: z.string().min(1).max(100).optional(),
  level: z.number().int().min(1).max(20).optional(),
  visibility: z.enum(['private', 'campaign', 'public']).optional(),
  /** Storage public URL or external URL after upload */
  portrait: z.string().min(1).max(4000).optional(),
});

// =============================================================================
// Encounter Schemas
// =============================================================================

const combatantSchema = z.record(z.string(), z.unknown());

const skillEncounterCreateSchema = z.object({
  difficultyScore: z.number().optional(),
  participants: z.array(combatantSchema).optional(),
  currentSuccesses: z.number().int().min(0).optional(),
  currentFailures: z.number().int().min(0).optional(),
  additionalSuccesses: z.number().int().min(0).optional(),
  additionalFailures: z.number().int().min(0).optional(),
  requiredSuccesses: z.number().int().min(0).optional(),
  maxFailures: z.number().int().min(0).optional(),
});

export const encounterCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  type: z.enum(['combat', 'skill', 'mixed']).optional().default('combat'),
  description: z.string().max(5000).optional(),
  status: z.enum(['preparing', 'active', 'paused', 'completed']).optional(),
  combatants: z.array(combatantSchema).optional(),
  round: z.number().int().min(0).optional(),
  currentTurnIndex: z.number().int().optional(),
  isActive: z.boolean().optional(),
  applySurprise: z.boolean().optional(),
  skillEncounter: skillEncounterCreateSchema.optional().nullable(),
  campaignId: z.string().uuid().optional().nullable(),
}).strict();

export const encounterUpdateSchema = withSafeJsonBlob({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(['combat', 'skill', 'mixed']).optional(),
  description: z.string().max(5000).optional(),
  combatants: z.array(combatantSchema).optional(),
  round: z.number().int().min(0).optional(),
  currentTurnIndex: z.number().int().optional(),
  status: z.enum(['preparing', 'active', 'paused', 'completed']).optional(),
  isActive: z.boolean().optional(),
  campaignId: z.string().uuid().optional().nullable(),
  applySurprise: z.boolean().optional(),
  skillEncounter: z.record(z.string(), z.unknown()).optional().nullable(),
  updatedAt: z.string().optional(),
});

// =============================================================================
// Crafting Session Schemas
// =============================================================================

const craftingItemRefSchema = z.object({
  source: z.enum(['library', 'codex']),
  id: z.string().min(1),
  name: z.string().min(1),
  marketPrice: z.number().min(0),
  subSkillId: z.string().nullable().optional(),
}).passthrough();

const craftingRollSessionSchema = z.object({
  label: z.string(),
  roll: z.number().int().min(1).max(100).nullable(),
  successes: z.number().int().min(0),
  failures: z.number().int().min(0),
}).passthrough();

export const craftingSessionCreateSchema = z.object({
  name: z.string().max(200).optional(),
  status: z.enum(['planned', 'in_progress', 'completed']).optional().default('planned'),
  item: craftingItemRefSchema.nullable().optional(),
  customBaseItem: z.object({
    name: z.string().min(1),
    marketPrice: z.number().min(0),
  }).nullable().optional(),
  powerRef: z.object({
    source: z.enum(['library', 'official']),
    id: z.string().min(1),
    name: z.string().min(1),
    energyCost: z.number().min(0),
  }).nullable().optional(),
  isConsumable: z.boolean().optional().default(false),
  isBulk: z.boolean().optional().default(false),
  isEnhanced: z.boolean().optional(),
  multipleUseTableIndex: z.number().int().optional(),
  craftBaseItemAlso: z.boolean().optional(),
  dsModifier: z.number().optional().default(0),
  additionalSuccesses: z.number().int().min(0).optional().default(0),
  additionalFailures: z.number().int().min(0).optional().default(0),
  requiredSuccesses: z.number().int().min(0).optional().default(0),
  difficultyScore: z.number().optional().default(0),
  materialCost: z.number().min(0).optional().default(0),
  timeValue: z.number().int().min(0).optional().default(0),
  timeUnit: z.enum(['hours', 'days']).optional().default('days'),
  sessionCount: z.number().int().min(0).optional().default(0),
  sessions: z.array(craftingRollSessionSchema).optional().default([]),
  netDelta: z.number().int().optional(),
  outcome: z.record(z.string(), z.unknown()).optional().nullable(),
  isUpgrade: z.boolean().optional(),
  upgradeOriginalItem: z.union([
    craftingItemRefSchema,
    z.object({ name: z.string().min(1), marketPrice: z.number().min(0) }),
  ]).nullable().optional(),
  isUpgradePotency: z.boolean().optional(),
  upgradePotencyEnhancedItemId: z.string().uuid().optional(),
  optionalModifiers: z.object({
    reduceTimeByDifficultySteps: z.number().int().min(0).max(5).optional(),
    reduceTimeByCostSteps: z.number().int().min(0).max(5).optional(),
    reduceDifficultyByTime: z.union([z.boolean(), z.number().int().min(0).max(5)]).optional(),
    reduceDifficultyByCostSteps: z.number().int().min(0).max(4).optional(),
  }).optional(),
  quantity: z.number().int().min(1).optional().default(1),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

export const craftingSessionUpdateSchema = z.object({
  name: z.string().max(200).optional(),
  status: z.enum(['planned', 'in_progress', 'completed']).optional(),
  item: craftingItemRefSchema.nullable().optional(),
  customBaseItem: z.object({
    name: z.string().min(1),
    marketPrice: z.number().min(0),
  }).nullable().optional(),
  powerRef: z.object({
    source: z.enum(['library', 'official']),
    id: z.string().min(1),
    name: z.string().min(1),
    energyCost: z.number().min(0),
  }).nullable().optional(),
  isConsumable: z.boolean().optional(),
  isBulk: z.boolean().optional(),
  isEnhanced: z.boolean().optional(),
  multipleUseTableIndex: z.number().int().optional(),
  craftBaseItemAlso: z.boolean().optional(),
  dsModifier: z.number().optional(),
  additionalSuccesses: z.number().int().min(0).optional(),
  additionalFailures: z.number().int().min(0).optional(),
  requiredSuccesses: z.number().int().min(0).optional(),
  difficultyScore: z.number().optional(),
  materialCost: z.number().min(0).optional(),
  timeValue: z.number().int().min(0).optional(),
  timeUnit: z.enum(['hours', 'days']).optional(),
  sessionCount: z.number().int().min(0).optional(),
  sessions: z.array(craftingRollSessionSchema).optional(),
  netDelta: z.number().int().optional(),
  outcome: z.record(z.string(), z.unknown()).optional().nullable(),
  isUpgrade: z.boolean().optional(),
  upgradeOriginalItem: z.union([
    craftingItemRefSchema,
    z.object({ name: z.string().min(1), marketPrice: z.number().min(0) }),
  ]).nullable().optional(),
  optionalModifiers: z.object({
    reduceTimeByDifficultySteps: z.number().int().min(0).max(5).optional(),
    reduceTimeByCostSteps: z.number().int().min(0).max(5).optional(),
    reduceDifficultyByTime: z.union([z.boolean(), z.number().int().min(0).max(5)]).optional(),
    reduceDifficultyByCostSteps: z.number().int().min(0).max(4).optional(),
  }).optional(),
  quantity: z.number().int().min(1).optional(),
  updatedAt: z.string().optional(),
}).passthrough();

// =============================================================================
// Enhanced Item (Library) Schemas
// =============================================================================

const enhancedBaseItemSchema = z.union([
  craftingItemRefSchema,
  z.object({ name: z.string().min(1), marketPrice: z.number().min(0) }),
]);

const enhancedPowerRefSchema = z.object({
  source: z.enum(['library', 'official']),
  id: z.string().min(1),
  name: z.string().min(1),
  energyCost: z.number().int().min(0),
}).passthrough();

export const enhancedItemCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  baseItem: enhancedBaseItemSchema,
  powerRef: enhancedPowerRefSchema,
  description: z.string().max(5000).optional(),
  currencyCost: z.number().min(0).optional(),
  rarity: z.string().max(50).optional(),
  usesType: z.string().max(50).optional(),
  usesCount: z.number().int().min(0).optional(),
  potency: z.number().min(0).optional(),
}).passthrough();

export const enhancedItemPatchSchema = z.object({
  potency: z.number().min(0).optional(),
  name: z.string().min(1).max(200).optional(),
}).passthrough();

// =============================================================================
// Library Item Schemas
// =============================================================================

export const libraryItemCreateSchema = withSafeJsonBlob({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  duplicateOf: z.string().uuid().optional(),
});

export const libraryItemUpdateSchema = withSafeJsonBlob({
  name: z.string().min(1).max(200).optional(),
});

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
export const publicItemSchema = withSafeJsonBlob({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(200).optional(),
});
