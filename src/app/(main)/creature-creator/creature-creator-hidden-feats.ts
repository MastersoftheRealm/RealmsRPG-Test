import type { CreatureFeat as CodexCreatureFeat } from '@/hooks';
import { isCreatureMovementEffectFeat } from './creature-movement';
import { isCreatureSensesEffectFeat } from './creature-senses';

export function isCreatureCreatorHiddenFeat(
  feat: Parameters<typeof isCreatureMovementEffectFeat>[0],
  catalogRow?: Pick<CodexCreatureFeat, 'id' | 'base_feat_id'> | null,
): boolean {
  return (
    isCreatureMovementEffectFeat(feat, catalogRow) || isCreatureSensesEffectFeat(feat, catalogRow)
  );
}
