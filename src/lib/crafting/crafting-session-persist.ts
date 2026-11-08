import { z } from 'zod';

const craftingItemRefSchema = z
  .object({
    source: z.enum(['library', 'codex']),
    id: z.string().min(1),
    name: z.string().min(1),
    marketPrice: z.number().min(0),
    subSkillId: z.string().nullable().optional(),
  })
  .strict();

const craftingRollSessionSchema = z
  .object({
    label: z.string(),
    roll: z.number().int().min(1).max(100).nullable(),
    successes: z.number().int().min(0),
    failures: z.number().int().min(0),
  })
  .strict();

const craftingOptionalModifiersSchema = z
  .object({
    reduceTimeByDifficultySteps: z.number().int().min(0).max(5).optional(),
    reduceTimeByCostSteps: z.number().int().min(0).max(5).optional(),
    reduceDifficultyByTime: z.union([z.boolean(), z.number().int().min(0).max(5)]).optional(),
    reduceDifficultyByCostSteps: z.number().int().min(0).max(4).optional(),
  })
  .strict();

const craftingOutcomeSchema = z
  .object({
    finalMaterialCost: z.number(),
    materialsRetained: z.number(),
    itemWorth: z.number(),
    extraItemCount: z.number(),
    choiceExtraOrEnhance: z.boolean(),
    effectText: z.string(),
  })
  .strict();

/** Keys stored in `crafting_sessions.data` — mirror `CraftingSessionData` in types/crafting.ts. */
const craftingSessionPersistShape = {
  name: z.string().max(200).optional(),
  status: z.enum(['planned', 'in_progress', 'completed']).optional(),
  item: craftingItemRefSchema.nullable().optional(),
  customBaseItem: z
    .object({
      name: z.string().min(1),
      marketPrice: z.number().min(0),
    })
    .nullable()
    .optional(),
  powerRef: z
    .object({
      source: z.enum(['library', 'official']),
      id: z.string().min(1),
      name: z.string().min(1),
      energyCost: z.number().min(0),
    })
    .nullable()
    .optional(),
  isConsumable: z.boolean().optional(),
  isBulk: z.boolean().optional(),
  isEnhanced: z.boolean().optional(),
  multipleUseTableIndex: z.number().int().optional(),
  usesType: z.enum(['full', 'partial', 'permanent']).optional(),
  usesCount: z.number().int().min(0).optional(),
  craftBaseItemAlso: z.boolean().optional(),
  potency: z.union([z.number().min(0), z.literal('creator')]).optional(),
  isUpgrade: z.boolean().optional(),
  isUpgradePotency: z.boolean().optional(),
  upgradePotencyEnhancedItemId: z.string().uuid().optional(),
  upgradeOriginalItem: z
    .union([
      craftingItemRefSchema,
      z.object({ name: z.string().min(1), marketPrice: z.number().min(0) }).strict(),
    ])
    .nullable()
    .optional(),
  optionalModifiers: craftingOptionalModifiersSchema.optional(),
  dsModifier: z.number().optional(),
  additionalSuccesses: z.number().int().min(0).optional(),
  additionalFailures: z.number().int().min(0).optional(),
  requiredSuccesses: z.number().int().min(0).optional(),
  difficultyScore: z.number().optional(),
  materialCost: z.number().min(0).optional(),
  enhancementMaterialCost: z.number().min(0).optional(),
  timeValue: z.number().int().min(0).optional(),
  timeUnit: z.enum(['hours', 'days']).optional(),
  sessionCount: z.number().int().min(0).optional(),
  sessions: z.array(craftingRollSessionSchema).optional(),
  netDelta: z.number().int().optional(),
  outcome: craftingOutcomeSchema.nullable().optional(),
  quantity: z.number().int().min(1).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  /** Accepted on PATCH/autosave but stripped before persistence (see projectCraftingSessionPatch). */
  isEditingCustomBaseItem: z.boolean().optional(),
} as const;

const craftingSessionPersistSchema = z.object(craftingSessionPersistShape).strict();

export const craftingSessionCreateSchema = craftingSessionPersistSchema
  .extend({
    status: z.enum(['planned', 'in_progress', 'completed']).optional().default('planned'),
    isConsumable: z.boolean().optional().default(false),
    isBulk: z.boolean().optional().default(false),
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
    quantity: z.number().int().min(1).optional().default(1),
  })
  .strict();

export const craftingSessionUpdateSchema = craftingSessionPersistSchema;

const CRAFTING_UI_ONLY_KEYS = new Set(['isEditingCustomBaseItem']);

/** Remove ephemeral UI state before merging into the stored JSON blob. */
export function projectCraftingSessionPatch(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...body };
  for (const key of CRAFTING_UI_ONLY_KEYS) {
    delete out[key];
  }
  return out;
}
