/**
 * SkillSourceChip — unified skill pill (identical shell for species + path).
 */

'use client';

import { cn } from '@/lib/utils';

export type SkillSourceKind = 'species' | 'path';

export interface SkillSourceChipProps {
  label: string;
  source: SkillSourceKind;
  /** Path skills: included in the character (default true). */
  selected?: boolean;
  onToggle?: () => void;
  className?: string;
}

const chipBase =
  'h-11 px-4 inline-flex items-center justify-center rounded-full border text-sm font-medium font-nunito leading-none transition-colors duration-base ease-standard';

export function SkillSourceChip({
  label,
  source,
  selected = true,
  onToggle,
  className,
}: SkillSourceChipProps) {
  if (source === 'species') {
    return (
      <span
        role="listitem"
        className={cn(
          chipBase,
          'bg-success-light text-success-fg border-success-border',
          className
        )}
      >
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        chipBase,
        selected
          ? 'bg-primary-chip-bg text-primary-chip-fg border-primary-chip-border cursor-pointer hover:opacity-80'
          : 'bg-surface-alt text-text-secondary border-border-light line-through opacity-75 cursor-pointer hover:opacity-80',
        className
      )}
    >
      {label}
    </button>
  );
}
