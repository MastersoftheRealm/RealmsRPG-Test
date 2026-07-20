'use client';

/**
 * Section Dual Mode Toggles
 * =========================
 * Pencil (rules spend) + Temp Modifier (SlidersHorizontal) beside each other
 * (ADR-0006 / TASK-585). Modes are mutually exclusive: activating one clears the other.
 * Do not hand-roll parallel icon pairs on sheet sections — use this.
 */

import { cn } from '@/lib/utils/cn';
import { EditSectionToggle, type EditState } from './edit-section-toggle';
import { TempModifierToggle } from './temp-modifier-toggle';

/** Per-section adjust mode for sheet edit chrome. */
export type SectionEditMode = 'none' | 'spend' | 'tempModifier';

export interface SectionDualModeTogglesProps {
  mode: SectionEditMode;
  onModeChange: (mode: SectionEditMode) => void;
  /** Pencil budget state (spend mode only) */
  spendState?: EditState;
  spendTitle?: string;
  tempTitle?: string;
  /** True when section has any non-zero tempModifiers deltas */
  hasTempModifiers?: boolean;
  className?: string;
}

export function SectionDualModeToggles({
  mode,
  onModeChange,
  spendState = 'normal',
  spendTitle = 'Edit (spend points)',
  tempTitle = 'Temp Modifier',
  hasTempModifiers = false,
  className,
}: SectionDualModeTogglesProps) {
  const spendActive = mode === 'spend';
  const tempActive = mode === 'tempModifier';

  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      role="group"
      aria-label="Section edit modes"
    >
      <EditSectionToggle
        state={spendState}
        isActive={spendActive}
        onClick={() => onModeChange(spendActive ? 'none' : 'spend')}
        title={
          spendActive
            ? 'Close point spending'
            : spendTitle
        }
      />
      <TempModifierToggle
        isActive={tempActive}
        hasModifiers={hasTempModifiers}
        onClick={() => onModeChange(tempActive ? 'none' : 'tempModifier')}
        title={
          tempActive
            ? 'Close Temp Modifier'
            : hasTempModifiers
              ? 'Temp Modifier (active adjustments)'
              : tempTitle
        }
      />
    </div>
  );
}
