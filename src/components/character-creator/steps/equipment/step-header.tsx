'use client';

import { cn } from '@/lib/utils';
import { InfoTippy } from '@/components/shared';
import { CreatorResourceBar } from '@/components/character-creator/CreatorResourceBar';
import { equipmentCurrencyHelp } from '../../../../../public/tooltip-text';

export interface EquipmentStepHeaderProps {
  pathMode: boolean;
  layer: number;
  creationMode: 'path' | 'forge' | undefined;
  remainingCurrency: number;
  startingCurrency: number;
  proficiencyTpSpent: number;
  proficiencyTpLimit: number;
  proficiencyTpRemaining: number;
}

export function EquipmentStepHeader({
  pathMode,
  layer,
  creationMode,
  remainingCurrency,
  startingCurrency,
  proficiencyTpSpent,
  proficiencyTpLimit,
  proficiencyTpRemaining,
}: EquipmentStepHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="flex items-center gap-1 mb-2">
          <h2 className="text-2xl font-bold text-text-primary">Choose Equipment</h2>
          <InfoTippy
            content={equipmentCurrencyHelp}
            allowHTML
            label="Starting equipment budget help"
            size="inline"
          />
        </div>
        <p className="text-text-secondary">
          Select your starting weapons, armor, and gear. Use + and - to adjust quantities.
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        {pathMode && layer === 1 ? (
          <CreatorResourceBar
            layer={layer}
            creationMode={creationMode}
            trainingPoints={{
              spent: proficiencyTpSpent,
              limit: proficiencyTpLimit,
            }}
            currency={{
              spent: startingCurrency - remainingCurrency,
              limit: startingCurrency,
            }}
            className="mb-0"
          />
        ) : (
          <>
            <div
              className={cn(
                'px-4 py-2 rounded-xl font-bold text-lg border',
                remainingCurrency >= 0
                  ? 'bg-tp-light dark:bg-warning-900/30 border-tp-border text-tp-text'
                  : 'bg-danger-50 dark:bg-danger-900/30 border-danger-200 dark:border-danger-600/50 text-danger-fg'
              )}
            >
              {remainingCurrency} / {startingCurrency}c
            </div>
            <div
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-semibold border',
                proficiencyTpRemaining >= 0
                  ? 'bg-tp-light dark:bg-warning-900/30 border-tp-border text-tp-text'
                  : 'bg-danger-50 dark:bg-danger-900/30 border-danger-200 dark:border-danger-600/50 text-danger-fg'
              )}
            >
              Proficiency TP: {proficiencyTpSpent} / {proficiencyTpLimit}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
