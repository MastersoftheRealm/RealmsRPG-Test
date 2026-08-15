'use client';

/**
 * SkillRow - Unified Skill Display Component
 * ==========================================
 * A shared component for displaying skills consistently across:
 * - Character Sheet (skills-section.tsx)
 * - Character Creator (skills-step.tsx)
 * - Creature Creator (page.tsx)
 *
 * This component handles the visual presentation of a single skill row,
 * while the parent components handle state management and data fetching.
 *
 * Design Patterns:
 * - Consistent proficiency dot styling (blue=proficient, orange=not)
 * - Sub-skill indentation with "└" or "↳" prefix (table: same text color as base + italic)
 * - Ability badge/abbreviation display
 * - Bonus display with +/- coloring
 * - Edit controls (+/- steppers) when in edit mode
 * - Roll button integration (optional)
 * - Source markers ("(species)", path sourceLabel) and locked/species affordances: table play view hides them; edit/creator keep them
 */

import { memo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ABILITY_ABBR, ABILITY_OPTIONS } from '@/lib/constants/skills';
import { formatBonus } from '@/lib/utils';
import { IconButton } from '@/components/ui';
import { ValueStepper, RollButton } from '@/components/shared';

// =============================================================================
// Types
// =============================================================================

export interface SkillRowProps {
  /** Unique skill ID */
  id: string;
  /** Skill name */
  name: string;
  /** Is this a sub-skill? */
  isSubSkill?: boolean;
  /** Base skill name (for sub-skills) */
  baseSkillName?: string;

  // ----- Proficiency -----
  /** Is the skill proficient? */
  proficient?: boolean;
  /** Can proficiency be toggled? (not for species skills) */
  canToggleProficiency?: boolean;
  /** Callback to toggle proficiency */
  onToggleProficiency?: () => void;

  // ----- Skill Values -----
  /** Skill training value (allocated points) */
  value: number;
  /** The calculated bonus (ability + skill value) */
  bonus: number;
  /** Optional class for the bonus text (e.g. Temp Modifier tint). Not applied to RollButton. */
  bonusClassName?: string;

  // ----- Ability -----
  /** Primary ability for this skill */
  ability?: string;
  /** Available abilities to choose from (for multi-ability skills) */
  availableAbilities?: string[];
  /** Callback when ability selection changes */
  onAbilityChange?: (ability: string) => void;

  // ----- Edit Mode -----
  /** Is edit mode active? */
  isEditing?: boolean;
  /** Callback when skill value changes */
  onValueChange?: (delta: number) => void;
  /** Minimum value (usually 0) */
  minValue?: number;
  /** Can the value be increased? (check for available points) */
  canIncrease?: boolean;

  // ----- Remove -----
  /** Callback to remove this skill */
  onRemove?: () => void;

  // ----- Roll -----
  /** Show roll button? */
  showRollButton?: boolean;
  /** Callback when roll button clicked */
  onRoll?: () => void;

  // ----- Special States -----
  /** Species-granted skill. Table: lock + "(species)" / dimmed prof only when isEditing; play view matches other proficient rows. */
  isSpeciesSkill?: boolean;
  /** Optional source label (e.g. archetype path name). Table: shown only when isEditing (creator/allocation); hidden on sheet play view. */
  sourceLabel?: string;
  /** Is this skill locked (can't be edited)? */
  isLocked?: boolean;
  /** Is the skill unlocked/available? (for sub-skills that require base proficiency) */
  isUnlocked?: boolean;
  /** Lock message (e.g., "Requires base skill") */
  lockMessage?: string;

  // ----- Styling -----
  /** Display variant */
  variant?: 'table' | 'card' | 'compact';
  /** Additional className */
  className?: string;
}

// Constants imported from @/lib/constants/skills

// =============================================================================
// Component
// =============================================================================

export const SkillRow = memo(function SkillRow({
  name,
  isSubSkill = false,
  baseSkillName,
  proficient = false,
  canToggleProficiency = false,
  onToggleProficiency,
  value,
  bonus,
  bonusClassName,
  ability,
  availableAbilities,
  onAbilityChange,
  isEditing = false,
  onValueChange,
  minValue = 0,
  canIncrease = true,
  onRemove,
  showRollButton = false,
  onRoll,
  isSpeciesSkill = false,
  sourceLabel,
  isLocked = false,
  isUnlocked = true,
  lockMessage,
  variant = 'table',
  className,
}: SkillRowProps) {
  const abilityAbbr = ABILITY_ABBR[(ability || 'strength').toLowerCase()] || 'STR';

  // Filter available abilities for dropdown
  const abilityOptions =
    availableAbilities && availableAbilities.length > 0
      ? ABILITY_OPTIONS.filter((opt) =>
          availableAbilities.some((a) => a.toLowerCase() === opt.value),
        )
      : ABILITY_OPTIONS;

  // Render table row variant
  if (variant === 'table') {
    return (
      <tr
        className={cn(
          'border-b border-border-subtle transition-colors',
          isSubSkill ? 'bg-surface-alt' : 'bg-surface',
          !isEditing && !isLocked && 'hover:bg-primary-subtle-bg',
          !isUnlocked && 'opacity-50',
          className,
        )}
      >
        {/* Proficiency Dot — play view: identical styling for species vs other proficient skills */}
        <td className="py-2 text-center">
          {!isSubSkill && (
            <button
              onClick={() => canToggleProficiency && onToggleProficiency?.()}
              disabled={!canToggleProficiency || isLocked || isSpeciesSkill}
              className={cn(
                'inline-block h-4 w-4 rounded-full transition-all',
                proficient
                  ? 'border-2 border-primary-outline-border bg-primary-button'
                  : 'border-2 border-warning-400 bg-warning-400',
                canToggleProficiency &&
                  !isLocked &&
                  !isSpeciesSkill &&
                  'cursor-pointer hover:scale-110',
                isEditing && (isLocked || isSpeciesSkill) && 'opacity-70',
              )}
              title={
                isEditing && isSpeciesSkill
                  ? 'Species Skill (locked)'
                  : proficient
                    ? canToggleProficiency
                      ? 'Proficient (click to toggle)'
                      : 'Proficient'
                    : canToggleProficiency
                      ? 'Not proficient (click to toggle)'
                      : 'Not proficient'
              }
            />
          )}
        </td>

        {/* DESIGN_INTENT: sheet play view = uniform skill list; source/lock chrome only while editing */}
        <td
          className={cn(
            'py-2 pl-2 font-medium text-text-primary',
            isSubSkill && 'italic',
            !isUnlocked && 'text-text-muted',
          )}
        >
          {isSubSkill && (
            <span className="mr-1 text-text-muted" aria-hidden="true">
              └
            </span>
          )}
          {name}
          {isEditing && isSpeciesSkill && (
            <span className="ml-1 text-xs text-text-muted">(species)</span>
          )}
          {isEditing && sourceLabel && !isSpeciesSkill && (
            <span className="ml-1 text-xs text-text-muted">({sourceLabel})</span>
          )}
        </td>

        {/* Ability */}
        <td className="py-2 text-center">
          {isEditing && onAbilityChange && abilityOptions.length > 1 ? (
            <select
              value={ability || abilityOptions[0]?.value || 'strength'}
              onChange={(e) => onAbilityChange(e.target.value)}
              aria-label="Ability for Skill"
              className="cursor-pointer rounded border border-border-light bg-surface-alt px-1 py-0.5 text-xs text-text-secondary"
              onClick={(e) => e.stopPropagation()}
            >
              {abilityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-semibold text-text-muted">{abilityAbbr}</span>
          )}
        </td>

        {/* Bonus / Roll Button — tint value only, never RollButton (ADR-0006) */}
        <td className="py-2 text-center">
          {isEditing || !showRollButton ? (
            <span
              className={cn(
                'inline-block min-w-[40px] font-bold',
                bonusClassName ||
                  (bonus > 0
                    ? 'text-success-fg'
                    : bonus < 0
                      ? 'text-danger-fg'
                      : 'text-text-secondary'),
              )}
            >
              {formatBonus(bonus)}
            </span>
          ) : (
            <RollButton value={bonus} onClick={() => onRoll?.()} size="sm" title={`Roll ${name}`} />
          )}
        </td>

        {/* DESIGN_INTENT: compact + nowrap ValueStepper so + stays in-column on narrow sheet panels (TASK-543) */}
        {isEditing && onValueChange && (
          <td className="px-1 py-2 text-center whitespace-nowrap">
            <ValueStepper
              value={value}
              onChange={(newValue) => onValueChange(newValue - value)}
              min={proficient ? -Infinity : minValue}
              max={canIncrease ? undefined : value}
              size="sm"
              variant="compact"
              decrementTitle={`Decrease ${name}`}
              incrementTitle={`Increase ${name}`}
              className="inline-flex justify-center"
            />
          </td>
        )}

        {/* Remove button (edit mode) — omit column when onRemove unset (sheet uses − path, TASK-584) */}
        {isEditing && onRemove && (
          <td className="px-0.5 py-2 text-center whitespace-nowrap">
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => !isSpeciesSkill && !isLocked && onRemove()}
              label={isSpeciesSkill ? 'Species Skill (cannot remove)' : 'Remove skill'}
              disabled={isSpeciesSkill || isLocked}
              className={cn(
                isSpeciesSkill || isLocked
                  ? 'cursor-not-allowed text-text-muted opacity-50'
                  : 'text-danger-fg hover:bg-transparent hover:opacity-80',
              )}
            >
              <X className="h-4 w-4" />
            </IconButton>
          </td>
        )}
      </tr>
    );
  }

  // Render card variant (used in creator step)
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded-lg border p-3 transition-colors',
          isSpeciesSkill
            ? 'border-primary-subtle-border bg-primary-subtle-bg'
            : value > 0
              ? 'border-primary-subtle-border bg-primary-subtle-bg'
              : 'border-border-light bg-surface-alt',
          !isUnlocked && 'opacity-50',
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Remove button - greyed out for species skills (can't remove) */}
            {(onRemove || isSpeciesSkill) && (
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => !isSpeciesSkill && onRemove?.()}
                label={
                  isSpeciesSkill
                    ? 'Species Skill (cannot remove)'
                    : sourceLabel
                      ? `Remove ${sourceLabel} Skill`
                      : 'Remove Skill'
                }
                disabled={isSpeciesSkill}
                className={cn(
                  isSpeciesSkill
                    ? 'cursor-not-allowed text-text-muted opacity-50'
                    : 'text-danger-fg hover:bg-transparent hover:opacity-80',
                )}
              >
                <X className="h-4 w-4" />
              </IconButton>
            )}

            {/* Proficiency dot */}
            <div
              className={cn(
                'h-4 w-4 rounded-full border-2',
                proficient
                  ? 'border-primary-outline-border bg-primary-button'
                  : 'border-warning-400 bg-warning-400',
              )}
              title={proficient ? 'Proficient' : 'Not proficient'}
            />

            {/* Name and ability */}
            <div className="flex flex-col">
              <span className="font-medium text-text-primary">{name}</span>
              {ability && <span className="text-xs text-text-muted capitalize">{ability}</span>}
            </div>

            {isSpeciesSkill && (
              <span className="text-xs font-medium text-primary-link-fg">(species)</span>
            )}
            {sourceLabel && !isSpeciesSkill && (
              <span className="text-xs font-medium text-primary-link-fg">({sourceLabel})</span>
            )}
          </div>

          {/* Controls on the right */}
          <div className="flex items-center gap-2">
            {isUnlocked ? (
              <>
                {onValueChange && (
                  <ValueStepper
                    value={value}
                    onChange={(newValue) => onValueChange(newValue - value)}
                    min={isSpeciesSkill ? 1 : minValue}
                    max={canIncrease ? undefined : value}
                    size="sm"
                  />
                )}
                {/* Bonus display */}
                <span
                  className={cn(
                    'w-12 text-right font-bold',
                    bonusClassName ||
                      (bonus > 0
                        ? 'text-success-fg'
                        : bonus < 0
                          ? 'text-danger-fg'
                          : 'text-text-muted'),
                  )}
                >
                  {formatBonus(bonus)}
                </span>
              </>
            ) : (
              <span className="text-xs text-text-muted italic">
                {lockMessage || `Requires ${baseSkillName || 'base skill'}`}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render compact variant (for sub-skills in creator)
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'rounded-lg border p-2 text-sm transition-colors',
          isSpeciesSkill
            ? 'border-primary-subtle-border bg-primary-subtle-bg'
            : !isUnlocked && 'border-border-light bg-surface opacity-50',
          isUnlocked && value > 0 && 'border-primary-subtle-border bg-primary-subtle-bg',
          isUnlocked && value === 0 && 'border-border-light bg-surface-alt',
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">↳</span>
            <span
              className={cn(
                'font-medium',
                isSpeciesSkill
                  ? 'text-primary-subtle-fg'
                  : isUnlocked
                    ? 'text-text-primary'
                    : 'text-text-muted',
              )}
            >
              {name}
            </span>
            {isSpeciesSkill && (
              <span className="text-xs font-medium text-primary-link-fg">(species)</span>
            )}
            {sourceLabel && !isSpeciesSkill && (
              <span className="text-xs font-medium text-primary-link-fg">({sourceLabel})</span>
            )}
          </div>

          {isUnlocked || isSpeciesSkill ? (
            <div className="flex items-center gap-2">
              {onValueChange && (
                <ValueStepper
                  value={isSpeciesSkill ? Math.max(1, value) : value}
                  onChange={(newValue) =>
                    onValueChange(newValue - (isSpeciesSkill ? Math.max(1, value) : value))
                  }
                  min={isSpeciesSkill ? 1 : minValue}
                  max={canIncrease ? undefined : value}
                  size="xs"
                />
              )}
            </div>
          ) : (
            <span className="text-xs text-text-muted italic">
              {lockMessage || `Requires ${baseSkillName || 'base skill'}`}
            </span>
          )}
        </div>
      </div>
    );
  }

  return null;
});

SkillRow.displayName = 'SkillRow';
