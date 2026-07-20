/**
 * Pure bootstrap for crafting tool sessions (TASK-430).
 * Migrates older rows that only stored multipleUseTableIndex into usesType/usesCount.
 */

import type { CraftingSession } from '@/types/crafting';
import type { CraftingRules } from '@/types/core-rules';

type UsesType = 'full' | 'partial' | 'permanent';

function getUsesConfigFromIndex(
  index: number | undefined,
  rules: CraftingRules | undefined
): { usesType: UsesType; usesCount?: number } {
  if (!rules || index == null || index < 0 || index >= (rules.multipleUseTable?.length ?? 0)) {
    return { usesType: 'full', usesCount: 1 };
  }
  const row = rules.multipleUseTable[index];
  if (!row) {
    return { usesType: 'full', usesCount: 1 };
  }
  if (row.partialRecovery === 'permanent' && row.fullRecovery === 'permanent') {
    return { usesType: 'permanent' };
  }
  if (typeof row.fullRecovery === 'number') {
    return { usesType: 'full', usesCount: row.fullRecovery };
  }
  if (typeof row.partialRecovery === 'number') {
    return { usesType: 'partial', usesCount: row.partialRecovery };
  }
  return { usesType: 'full', usesCount: 1 };
}

/** True when bootstrap should wait for CRAFTING rules before seeding local state. */
export function craftingSessionNeedsRules(session: CraftingSession): boolean {
  return !session.data.usesType;
}

export function bootstrapCraftingSession(
  session: CraftingSession,
  rules?: CraftingRules
): CraftingSession {
  if (session.data.usesType) return session;
  if (!rules) return session;
  const { usesType, usesCount } = getUsesConfigFromIndex(
    session.data.multipleUseTableIndex ?? -1,
    rules
  );
  return {
    ...session,
    data: {
      ...session.data,
      usesType,
      usesCount,
    },
  };
}
