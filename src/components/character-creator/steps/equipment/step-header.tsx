'use client';

import { InfoTippy, LoadoutBudgetBar } from '@/components/patterns';
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
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-1">
          <h2 className="text-2xl font-bold text-text-primary">Choose Equipment</h2>
          <InfoTippy content={equipmentCurrencyHelp} label="Starting equipment budget help" />
        </div>
        <p className="text-text-secondary">
          Select your starting weapons, armor, and Equipment. Use + and - to adjust quantities.
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
