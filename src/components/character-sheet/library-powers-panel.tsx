/**
 * Powers tab body for LibrarySection (innate summary + power list sections).
 */

'use client';

import {
  TabSummarySection,
  SummaryItem,
  SummaryRow,
  PowersListSection,
  InfoTippy,
  type SortState,
  type ListHeaderRowChrome,
} from '@/components/patterns';
import type { EntityPowerRow } from '@/components/patterns/list/entity-library-sections';
import { innateEnergyHelp, innatePowersHelp } from '../../../public/tooltip-text';

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
  onAddInnatePower?: (() => void) | undefined;
  onAddPower?: (() => void) | undefined;
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
              labelAccessory={<InfoTippy content={innateEnergyHelp} label="Innate Energy help" />}
              value={`${displayedCurrentInnateEnergy} / ${innateEnergy}`}
              highlight
              highlightColor={innateEnergyOverBudget ? 'danger' : 'power'}
            />
            <SummaryItem label="Threshold" value={innateThreshold} />
            <SummaryItem label="Pools" value={innatePools} />
          </SummaryRow>
        </TabSummarySection>
      )}

      <div className="space-y-2">
        <PowersListSection
          title="Innate Powers"
          titleAddon={<InfoTippy content={innatePowersHelp} label="Innate Powers help" />}
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
