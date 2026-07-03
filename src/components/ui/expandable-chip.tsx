/**
 * Expandable Chip — unified expand-in-place chip for parts, properties, and GridListRow chips.
 */

'use client';

import * as React from 'react';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { formatCostDisplay } from '@/lib/game/creator-constants';
import { DescriptorChip, type chipVariants } from '@/components/ui/chip';
import { ChipOptionsPanel } from '@/lib/chip/chip-options-panel';
import { partChipVariant } from '@/lib/chip/part-chip-variant';
import { expandableChipShellClass } from '@/lib/chip/expandable-chip-shell';

export interface ExpandableChipOption {
  label: string;
  description?: string;
  level: number;
}

type ChipVariant = NonNullable<VariantProps<typeof chipVariants>['variant']>;

export interface ExpandableChipProps {
  label: string;
  description?: string;
  sublabel?: string;
  category?: string;
  variant?: ChipVariant;
  size?: 'sm' | 'md';
  className?: string;
  fullWidthWhenExpanded?: boolean;

  /** TP cost — renders `TP: N` in header */
  tpCost?: number;
  /** Energy cost — renders `N EP` in header */
  energyCost?: number;
  /** Generic cost with label (GridListRow) — renders `| {costLabel}: N` */
  cost?: number | string;
  costLabel?: string;
  /** When true, chip with cost but no description can still expand (GridListRow) */
  expandOnCost?: boolean;
  /** Legacy creator chips — renders `(value)` after label */
  costSuffix?: string | number;

  level?: number;
  options?: ExpandableChipOption[];

  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onToggle?: (e: React.MouseEvent) => void;

  optionsOpen?: boolean;
  onOptionsOpenChange?: (open: boolean) => void;

  expandable?: boolean;
  descriptor?: boolean;
  descriptorVariant?: ChipVariant;

  /** Extra hover shadow (creator simple chips) */
  interactiveHover?: boolean;
}

function formatLevelSuffix(level?: number): string {
  return level && level > 1 ? ` (Lv.${level})` : '';
}

export function ExpandableChip({
  label,
  description,
  sublabel,
  category = 'default',
  variant,
  size = 'md',
  className,
  fullWidthWhenExpanded = false,
  tpCost,
  energyCost,
  cost,
  costLabel = 'TP',
  expandOnCost = false,
  costSuffix,
  level,
  options,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  onToggle,
  optionsOpen,
  onOptionsOpenChange,
  expandable,
  descriptor = false,
  descriptorVariant,
  interactiveHover = false,
}: ExpandableChipProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const [internalOptionsOpen, setInternalOptionsOpen] = useState(false);

  const styleVariant = variant ?? partChipVariant(category);
  const isExpanded = expanded !== undefined ? expanded : internalExpanded;
  const optionsPanelOpen = optionsOpen !== undefined ? optionsOpen : internalOptionsOpen;

  const hasOptions = (options?.length ?? 0) > 0;
  const parensCost =
    costSuffix ?? (!expandOnCost && !tpCost && cost !== undefined ? cost : undefined);
  const headerCost = expandOnCost ? cost : undefined;
  const hasHeaderCost =
    typeof headerCost === 'number' ? headerCost > 0 : typeof headerCost === 'string' && headerCost.length > 0;
  const hasDescription = !!description?.trim() || !!sublabel?.trim();
  const canExpandByContent = hasDescription || hasOptions || (expandOnCost && hasHeaderCost);
  const canExpand = !descriptor && expandable !== false && canExpandByContent;

  if (descriptor) {
    return (
      <DescriptorChip variant={descriptorVariant ?? styleVariant} size="sm">
        {label}
        {formatLevelSuffix(level)}
      </DescriptorChip>
    );
  }

  const handleHeaderClick = (e: React.MouseEvent) => {
    if (!canExpand) return;
    if (onToggle) {
      onToggle(e);
      return;
    }
    const next = !isExpanded;
    setInternalExpanded(next);
    onExpandedChange?.(next);
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && canExpand && !onToggle) {
      e.preventDefault();
      const next = !isExpanded;
      setInternalExpanded(next);
      onExpandedChange?.(next);
    }
  };

  const handleOptionsToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOptionsOpenChange) {
      onOptionsOpenChange(!optionsPanelOpen);
      return;
    }
    setInternalOptionsOpen((open) => !open);
  };

  const showOptions = isExpanded && hasOptions;
  const useButtonHeader = !!onToggle || canExpand;

  return (
    <div
      className={expandableChipShellClass({
        variant: styleVariant,
        expanded: isExpanded,
        size,
        className: cn(
          fullWidthWhenExpanded && isExpanded && 'w-full min-w-0',
          interactiveHover && canExpand && 'hover:shadow-md',
          isExpanded && interactiveHover && 'shadow-md',
          !useButtonHeader && canExpand && 'cursor-pointer',
          className
        ),
      })}
      onClick={!useButtonHeader && canExpand ? handleHeaderClick : undefined}
      onKeyDown={!useButtonHeader && canExpand ? handleHeaderKeyDown : undefined}
      tabIndex={!useButtonHeader && canExpand ? 0 : undefined}
      role={!useButtonHeader && canExpand ? 'button' : undefined}
      aria-expanded={canExpand ? isExpanded : undefined}
    >
      {useButtonHeader ? (
        <button
          type="button"
          onClick={canExpand ? handleHeaderClick : (e) => e.stopPropagation()}
          disabled={!canExpand && !onToggle}
          className={cn(
            'flex items-center gap-1.5 text-left w-full',
            canExpand ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
          )}
          aria-expanded={canExpand ? isExpanded : undefined}
        >
          <ChipHeaderContent
            label={label}
            level={level}
            tpCost={tpCost}
            energyCost={energyCost}
            cost={headerCost}
            costLabel={costLabel}
            costSuffix={parensCost}
            hasNumericCost={hasHeaderCost}
          />
          {canExpand && (
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 ml-auto shrink-0 transition-transform duration-base ease-standard',
                isExpanded && 'rotate-180'
              )}
            />
          )}
        </button>
      ) : (
        <div className="flex items-center gap-2 w-full">
          <ChipHeaderContent
            label={label}
            level={level}
            tpCost={tpCost}
            energyCost={energyCost}
            cost={headerCost}
            costLabel={costLabel}
            costSuffix={parensCost}
            hasNumericCost={hasHeaderCost}
            labelClassName="font-medium"
          />
          {canExpand && (
            <ChevronDown
              className={cn(
                'w-4 h-4 ml-auto shrink-0 transition-transform duration-base ease-standard',
                isExpanded && 'rotate-180'
              )}
            />
          )}
        </div>
      )}

      {isExpanded && hasDescription && (
        <div
          className={cn(
            'w-full pt-1.5 mt-1.5 text-text-secondary border-t border-current/15 leading-relaxed',
            size === 'md' ? 'text-sm' : 'text-xs'
          )}
        >
          {sublabel && <div className="font-medium text-text-primary">{sublabel}</div>}
          {description && (
            <p className={cn('whitespace-pre-line', sublabel && 'mt-1')}>{description}</p>
          )}
        </div>
      )}

      {showOptions && options && (
        <ChipOptionsPanel
          options={options}
          optionsOpen={optionsPanelOpen}
          onToggle={handleOptionsToggle}
          size={size}
        />
      )}
    </div>
  );
}

function ChipHeaderContent({
  label,
  level,
  tpCost,
  energyCost,
  cost,
  costLabel,
  costSuffix,
  hasNumericCost,
  labelClassName,
}: {
  label: string;
  level?: number;
  tpCost?: number;
  energyCost?: number;
  cost?: number | string;
  costLabel?: string;
  costSuffix?: string | number;
  hasNumericCost?: boolean;
  labelClassName?: string;
}) {
  const hasTp = (tpCost ?? 0) > 0;
  const hasEnergy = (energyCost ?? 0) > 0;

  return (
    <span className="inline-flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
      <span className={labelClassName}>{label}</span>
      {level && level > 1 && (
        <span className="text-xs text-text-secondary">(Lv.{level})</span>
      )}
      {costSuffix !== undefined && (
        <span className="text-xs text-text-muted dark:text-text-secondary">({costSuffix})</span>
      )}
      {hasTp && (
        <>
          <span className="opacity-40">|</span>
          <span className="text-xs font-semibold">TP: {tpCost}</span>
        </>
      )}
      {hasEnergy && (
        <>
          <span className="opacity-40">|</span>
          <span className="text-xs font-semibold text-energy">{energyCost} EP</span>
        </>
      )}
      {hasNumericCost && cost !== undefined && !hasTp && (
        <>
          <span className="opacity-40">|</span>
          <span className="text-xs font-semibold text-text-secondary dark:text-text-primary">
            {costLabel}: {typeof cost === 'number' ? formatCostDisplay(cost) : cost}
          </span>
        </>
      )}
    </span>
  );
}

export interface ChipGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ChipGroup({ children, className }: ChipGroupProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {children}
    </div>
  );
}
