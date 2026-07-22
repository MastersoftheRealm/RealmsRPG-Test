'use client';

import { InfoTippy, LoadoutBudgetBar } from '@/components/shared';
import { equipmentCurrencyHelp } from '../../../../../public/tooltip-text';

export interface EquipmentStepHeaderProps {
  remainingCurrency: number;
  startingCurrency: number;
  proficiencyTpSpent: number;
  proficiencyTpLimit: number;
}

export function EquipmentStepHeader({
  remainingCurrency,
  startingCurrency,
  proficiencyTpSpent,
  proficiencyTpLimit,
}: EquipmentStepHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
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

      <LoadoutBudgetBar
        align="end"
        className="mb-0 shrink-0"
        currencyTotal={startingCurrency}
        currencySpent={startingCurrency - remainingCurrency}
        tpTotal={proficiencyTpLimit}
        tpSpent={proficiencyTpSpent}
      />
    </div>
  );
}
