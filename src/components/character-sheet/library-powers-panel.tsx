/**
 * Powers tab body for LibrarySection (innate summary + power list sections).
 */

'use client';

import {
  TabSummarySection,
  SummaryItem,
  SummaryRow,
  PowersListSection,
  type SortState,
  type ListHeaderRowChrome,
} from '@/components/shared';
import type { EntityPowerRow } from '@/components/shared/entity-library-sections';

export type LibraryPowersPanelProps = {
  innateEnergy: number;
  innateThreshold: number;
  innatePools: number;
  displayedCurrentInnateEnergy: number;
  innateEnergyOverBudget: boolean;
  innatePowerRows: EntityPowerRow[];
  regularPowerRows: EntityPowerRow[];
  powerSort: SortState;
  onPowerSort: (col: string) => void;
  powerRowChrome: ListHeaderRowChrome;
  onAddInnatePower?: () => void;
  onAddPower?: () => void;
};

export function LibraryPowersPanel({
  innateEnergy,
  innateThreshold,
  innatePools,
  displayedCurrentInnateEnergy,
  innateEnergyOverBudget,
  innatePowerRows,
  regularPowerRows,
  powerSort,
  onPowerSort,
  powerRowChrome,
  onAddInnatePower,
  onAddPower,
}: LibraryPowersPanelProps) {
  return (
    <>
      {innateEnergy > 0 && (
        <TabSummarySection variant="power">
          <SummaryRow>
            <SummaryItem
              icon="✨"
              label="Innate Energy"
              value={`${displayedCurrentInnateEnergy} / ${innateEnergy}`}
              highlight
              highlightColor={innateEnergyOverBudget ? 'danger' : 'power'}
            />
            <SummaryItem label="Threshold" value={innateThreshold} />
            <SummaryItem label="Pools" value={innatePools} />
          </SummaryRow>
          <p className="text-xs text-text-muted dark:text-text-secondary mt-1 text-center">
            Innate powers have no cost to use. You may have powers with energy costs up to your innate energy.
          </p>
        </TabSummarySection>
      )}

      <div className="space-y-2">
        <PowersListSection
          title="Innate Powers"
          items={innatePowerRows}
          onAdd={onAddInnatePower}
          addLabel="Add innate power"
          sortState={powerSort}
          onSort={onPowerSort}
          rowChrome={powerRowChrome}
          emptyMessage="No innate powers. Enter edit mode (click the pencil) to mark powers as innate."
          collapsible={innateEnergy > 0}
        />

        <PowersListSection
          title="Powers"
          items={regularPowerRows}
          onAdd={onAddPower}
          addLabel="Add power"
          sortState={powerSort}
          onSort={onPowerSort}
          rowChrome={powerRowChrome}
          emptyMessage="No powers learned"
          collapsible={innateEnergy > 0}
        />
      </div>
    </>
  );
}
