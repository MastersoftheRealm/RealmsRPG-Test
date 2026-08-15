/**
 * Forge ability picker button — shared by Advanced ArchetypeStep and sheet Edit Archetype.
 */

'use client';

import { cn } from '@/lib/utils';
import { InfoTippy } from '@/components/shared';
import { formatAbilityLabel } from '@/lib/constants/ability-effect-blurbs';
import { getTooltipTextByPowerAbility } from '../../../public/tooltip-text';
import type { AbilityName } from '@/types';

export interface AbilityPickButtonProps {
  variant: 'power' | 'martial';
  ability: AbilityName;
  selected: boolean;
  disabled: boolean;
  onPick: () => void;
  /** When false, skips InfoTippy (compact sheet forge chrome). Default true. */
  withTooltip?: boolean;
}

export function AbilityPickButton({
  variant,
  ability,
  selected,
  disabled,
  onPick,
  withTooltip = true,
}: AbilityPickButtonProps) {
  const abilityLabel = formatAbilityLabel(ability);

  const button = (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={cn(
        'min-h-11 min-w-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        selected
          ? variant === 'power'
            ? 'bg-power-dark text-text-on-dark'
            : 'bg-martial-dark text-text-on-dark'
          : disabled
            ? 'cursor-not-allowed bg-surface text-text-muted'
            : 'border border-border-light bg-surface hover:border-border',
      )}
    >
      {abilityLabel}
    </button>
  );

  if (!withTooltip) return button;

  return (
    <InfoTippy
      content={getTooltipTextByPowerAbility(ability)}
      label={`${abilityLabel} ability guidance`}
    >
      {button}
    </InfoTippy>
  );
}
