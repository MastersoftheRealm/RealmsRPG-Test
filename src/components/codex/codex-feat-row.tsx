'use client';

import type { ReactNode } from 'react';
import { GridListRow } from '@/components/shared';
import type { Feat } from '@/hooks';
import {
  FEAT_GRID_COLUMNS,
  buildFeatDetailSections,
  buildFeatGridColumns,
} from '@/lib/codex/feat-list';

export function CodexFeatRow({
  feat,
  skillIdToName,
  familyLevels = [],
  name = feat.name,
  variant = 'codex',
  rightSlot,
}: {
  feat: Feat;
  skillIdToName: Map<string, string>;
  familyLevels?: Feat[];
  name?: string;
  variant?: 'codex' | 'admin';
  rightSlot?: ReactNode;
}) {
  const detailSections = buildFeatDetailSections(feat, skillIdToName, familyLevels);

  return (
    <GridListRow
      id={feat.id}
      name={name}
      description={feat.description}
      gridColumns={FEAT_GRID_COLUMNS}
      columns={buildFeatGridColumns(feat, variant)}
      detailSections={detailSections.length > 0 ? detailSections : undefined}
      rightSlot={rightSlot}
    />
  );
}
