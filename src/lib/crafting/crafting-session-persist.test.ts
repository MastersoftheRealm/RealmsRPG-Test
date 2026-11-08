import { describe, expect, it } from 'vitest';
import {
  craftingSessionUpdateSchema,
  projectCraftingSessionPatch,
} from '@/lib/crafting/crafting-session-persist';

describe('crafting-session-persist', () => {
  it('accepts bootstrap-injected usesType and usesCount on autosave', () => {
    const body = {
      status: 'planned',
      item: null,
      usesType: 'full' as const,
      usesCount: 3,
      isConsumable: false,
      isBulk: false,
      dsModifier: 0,
      sessions: [],
    };
    expect(craftingSessionUpdateSchema.safeParse(body).success).toBe(true);
  });

  it('accepts ephemeral UI state then strips it before persistence merge', () => {
    const body = {
      status: 'in_progress',
      isEditingCustomBaseItem: true,
      usesType: 'partial' as const,
      usesCount: 2,
    };
    expect(craftingSessionUpdateSchema.safeParse(body).success).toBe(true);
    const projected = projectCraftingSessionPatch(body);
    expect(projected.isEditingCustomBaseItem).toBeUndefined();
    expect(projected.usesType).toBe('partial');
  });

  it('accepts upgrade potency persisted fields', () => {
    const body = {
      isUpgradePotency: true,
      upgradePotencyEnhancedItemId: '11111111-1111-4111-8111-111111111111',
      enhancementMaterialCost: 50,
      potency: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    expect(craftingSessionUpdateSchema.safeParse(body).success).toBe(true);
  });

  it('rejects unknown persisted keys', () => {
    const result = craftingSessionUpdateSchema.safeParse({ injectedField: true });
    expect(result.success).toBe(false);
  });
});
