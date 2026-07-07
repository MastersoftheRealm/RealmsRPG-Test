'use client';

import { useMemo } from 'react';
import { SummaryChipList, type SummaryChipItem } from '@/components/shared';
import type { GuidedDraft, GuidedEquipmentPhase } from '@/stores/guided-creator-store';
import type { LibraryItem } from '@/types/library';
import type { CodexEquipmentItem } from '@/types/codex';
import {
  buildEquipmentLookup,
  resolveEquipmentRef,
} from '@/lib/guided-creator/resolve-loadout-items';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const phaseCopy = GUIDED_CREATOR_COPY.steps.loadout.phases;

export interface GuidedEquipmentPhaseSelectionProps {
  phase: GuidedEquipmentPhase;
  draft: GuidedDraft;
  officialItems: LibraryItem[];
  codexEquipment: CodexEquipmentItem[];
}

export function GuidedEquipmentPhaseSelection({
  phase,
  draft,
  officialItems,
  codexEquipment,
}: GuidedEquipmentPhaseSelectionProps) {
  const refs =
    phase === 'weapon'
      ? draft.loadoutWeapons
      : phase === 'armor'
        ? draft.loadoutArmor
        : draft.equipment;

  const lookup = useMemo(
    () => buildEquipmentLookup(officialItems, codexEquipment),
    [officialItems, codexEquipment]
  );

  const chips = useMemo((): SummaryChipItem[] => {
    return refs.map((ref) => {
      const resolved = resolveEquipmentRef(ref, lookup);
      const label =
        ref.quantity > 1 ? `${resolved.name} ×${ref.quantity}` : resolved.name;
      return { key: `${ref.id}-${ref.quantity}`, label };
    });
  }, [refs, lookup]);

  if (chips.length === 0) {
    return (
      <p className="font-nunito text-sm text-text-secondary">{phaseCopy.emptySelection[phase]}</p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-nunito text-sm font-medium text-text-primary">
        {phaseCopy.selectedSummary}
      </p>
      <SummaryChipList items={chips} />
    </div>
  );
}
