'use client';

/**
 * SelectionToggle — unified add/select control (Plus → Check).
 * EquipToggle and InnateToggle are presets of the same button (report 04 C2).
 */

import type { LucideIcon } from 'lucide-react';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type IconPairToggleSize = 'sm' | 'md' | 'lg';

export type IconPairToggleFloor = 'always' | 'coarse';

export interface IconPairToggleProps {
  pressed: boolean;
  onToggle: () => void;
  disabled?: boolean | undefined;
  size?: IconPairToggleSize | undefined;
  className?: string | undefined;
  label: string;
  title?: string | undefined;
  offIcon: LucideIcon;
  onIcon: LucideIcon;
  offIconClassName?: string | undefined;
  onIconClassName?: string | undefined;
  pressedClassName?: string | undefined;
  idleClassName?: string | undefined;
  /** `always` = 44px min on every pointer. `coarse` = 44px square only on touch (SelectionToggle). */
  touchFloor?: IconPairToggleFloor | undefined;
  paintedSize?: Record<IconPairToggleSize, string> | undefined;
}

const SELECT_PAINTED: Record<IconPairToggleSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const ICON_SIZES: Record<IconPairToggleSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const TOUCH_FLOOR: Record<IconPairToggleFloor, string> = {
  always: 'min-h-[var(--touch-target-min,44px)] min-w-[var(--touch-target-min,44px)]',
  coarse: '[@media(pointer:coarse)]:min-h-[44px] [@media(pointer:coarse)]:min-w-[44px]',
};

export function IconPairToggle({
  pressed,
  onToggle,
  disabled = false,
  size = 'md',
  className,
  label,
  title,
  offIcon: OffIcon,
  onIcon: OnIcon,
  offIconClassName,
  onIconClassName,
  pressedClassName = 'text-success-fg',
  idleClassName = 'text-text-muted hover:text-primary-fg-hover',
  touchFloor = 'always',
  paintedSize = SELECT_PAINTED,
}: IconPairToggleProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onToggle();
      }}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={title}
      className={cn(
        'duration-base flex items-center justify-center transition-all ease-standard',
        TOUCH_FLOOR[touchFloor],
        paintedSize[size],
        pressed ? pressedClassName : idleClassName,
        disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
        className,
      )}
    >
      <span
        className={cn(
          'duration-base transition-all ease-standard',
          pressed ? 'scale-110' : 'scale-100 hover:scale-110',
        )}
      >
        {pressed ? (
          <OnIcon className={cn(ICON_SIZES[size], 'stroke-[2.5]', onIconClassName)} />
        ) : (
          <OffIcon className={cn(ICON_SIZES[size], 'stroke-[2]', offIconClassName)} />
        )}
      </span>
    </button>
  );
}

export interface SelectionToggleProps {
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean | undefined;
  size?: IconPairToggleSize | undefined;
  className?: string | undefined;
  label?: string | undefined;
}

export function SelectionToggle({
  isSelected,
  onToggle,
  disabled = false,
  size = 'md',
  className,
  label,
}: SelectionToggleProps) {
  return (
    <IconPairToggle
      pressed={isSelected}
      onToggle={onToggle}
      disabled={disabled}
      size={size}
      className={className}
      label={label || (isSelected ? 'Remove selection' : 'Add selection')}
      touchFloor="coarse"
      offIcon={Plus}
      onIcon={Check}
    />
  );
}
