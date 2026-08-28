'use client';

import type { ReactNode } from 'react';
import { GridListRow } from '@/components/patterns';
import type { Feat } from '@/hooks';
import { formatFeatName } from '@/lib/leveled-feats';
import {
  FEAT_GRID_COLUMNS,
  buildFeatDetailSections,
  buildFeatGridColumns,
} from '@/lib/codex/feat-list';

export function CodexFeatRow({
  feat,
  skillIdToName,
  familyLevels = [],
  name,
  variant = 'codex',
  rightSlot,
  nameChipLabels,
}: {
  feat: Feat;
  skillIdToName: Map<string, string>;
  familyLevels?: Feat[] | undefined;
  name?: string | undefined;
  variant?: 'codex' | 'admin' | undefined;
  rightSlot?: ReactNode | undefined;
  /**
   * Labels shown beside the name while a list filter needs them — the archetype paths that
   * recommend this feat (ADR-0014). Empty / omitted renders nothing.
   */
  nameChipLabels?: string[] | undefined;
}) {
  const displayName =
    name ?? formatFeatName({ id: feat.id, name: feat.name, feat_lvl: feat.feat_lvl });
  const detailSections = buildFeatDetailSections(feat, skillIdToName, familyLevels);
  const nameChips = nameChipLabels?.length ? nameChipLabels.map((label) => ({ label })) : undefined;

  return (
    <GridListRow
      id={feat.id}
      name={displayName}
      description={feat.description}
      gridColumns={FEAT_GRID_COLUMNS}
      columns={buildFeatGridColumns(feat, variant)}
      detailSections={detailSections.length > 0 ? detailSections : undefined}
      badges={nameChips}
      showBadgesInName={Boolean(nameChips)}
      rightSlot={rightSlot}
    />
  );
}
