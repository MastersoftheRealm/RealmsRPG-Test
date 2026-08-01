/**
 * Expandable Chip — unified expand-in-place chip for parts, properties, and GridListRow chips.
 * Expanded chips keep their row, move left, and take the full chip-group width.
 */

'use client';

import * as React from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { formatCostDisplay } from '@/lib/game/creator-constants';
import { DescriptorChip, type chipVariants } from '@/components/ui/chip';
import { ChipOptionsPanel } from '@/lib/chip/chip-options-panel';
import { partChipVariant } from '@/lib/chip/part-chip-variant';
import { expandableChipShellClass } from '@/lib/chip/expandable-chip-shell';
import {
  applyFullRowExpandLayout,
  captureFullRowExpandLayout,
  type FullRowExpandSnapshot,
} from '@/lib/chip/full-row-expand-layout';

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
  /**
   * When expanded, keep the collapsed row but move to the group’s left edge at full width.
   * Default true. When false, expand height-only at the header’s intrinsic width.
   */
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
  return level != null && level > 0 ? ` (Lv.${level})` : '';
}

export function ExpandableChip({
  label,
  description,
  sublabel,
  category = 'default',
  variant,
  size = 'md',
  className,
  fullWidthWhenExpanded = true,
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
  const shellRef = useRef<HTMLDivElement>(null);
  const capturedLayoutRef = useRef<FullRowExpandSnapshot | null>(null);
  const restoreLayoutRef = useRef<(() => void) | null>(null);
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const [internalOptionsOpen, setInternalOptionsOpen] = useState(false);

  const styleVariant = variant ?? partChipVariant(category);
  const isExpanded = expanded !== undefined ? expanded : internalExpanded;
  const optionsPanelOpen = optionsOpen !== undefined ? optionsOpen : internalOptionsOpen;

  const hasOptions = (options?.length ?? 0) > 0;
  // Legacy parens suffix only for non-zero / non-empty values — never render `(0)`.
  const legacyParensCost =
    !expandOnCost &&
    !tpCost &&
    cost !== undefined &&
    cost !== '' &&
    !(typeof cost === 'number' && cost <= 0)
      ? cost
      : undefined;
  const parensCost = costSuffix ?? legacyParensCost;
  const headerCost = expandOnCost ? cost : undefined;
  const hasHeaderCost =
    typeof headerCost === 'number' ? headerCost > 0 : typeof headerCost === 'string' && headerCost.length > 0;
  const hasDescription = !!description?.trim() || !!sublabel?.trim();
  const canExpandByContent = hasDescription || hasOptions || (expandOnCost && hasHeaderCost);
  const canExpand = !descriptor && expandable !== false && canExpandByContent;

  const captureCollapsedLayout = (el: HTMLElement) => {
    capturedLayoutRef.current = captureFullRowExpandLayout(el);
  };

  const restoreFullRowLayout = () => {
    restoreLayoutRef.current?.();
    restoreLayoutRef.current = null;
    capturedLayoutRef.current = null;
  };

  useLayoutEffect(() => {
    if (!isExpanded || !canExpand || !fullWidthWhenExpanded) {
      restoreFullRowLayout();
      return;
    }

    const el = shellRef.current;
    if (!el) return;

    restoreLayoutRef.current?.();
    restoreLayoutRef.current = applyFullRowExpandLayout(el, capturedLayoutRef.current);
    capturedLayoutRef.current = null;

    return () => {
      restoreLayoutRef.current?.();
      restoreLayoutRef.current = null;
    };
  }, [isExpanded, canExpand, fullWidthWhenExpanded, label, description, sublabel]);

  if (descriptor) {
    return (
      <DescriptorChip variant={descriptorVariant ?? styleVariant} size="sm">
        {label}
        {formatLevelSuffix(level)}
      </DescriptorChip>
    );
  }

  const toggleExpanded = (e: React.MouseEvent) => {
    if (!canExpand) return;
    // Stop so parent GridListRow body/header handlers don't also toggle the row,
    // and so shell + header don't double-toggle.
    e.stopPropagation();
    const next = !isExpanded;
    if (next && fullWidthWhenExpanded && shellRef.current) {
      captureCollapsedLayout(shellRef.current);
    } else if (!next) {
      restoreFullRowLayout();
    }
    if (onToggle) {
      onToggle(e);
      return;
    }
    setInternalExpanded(next);
    onExpandedChange?.(next);
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    // Header <button> fires click on Enter/Space natively. This path is for the
    // non-button shell (role=button) when uncontrolled.
    if ((e.key === 'Enter' || e.key === ' ') && canExpand && !onToggle) {
      e.preventDefault();
      e.stopPropagation();
      const next = !isExpanded;
      if (next && fullWidthWhenExpanded && shellRef.current) {
        captureCollapsedLayout(shellRef.current);
      } else if (!next) {
        restoreFullRowLayout();
      }
      setInternalExpanded(next);
      onExpandedChange?.(next);
    }
  };

  /**
   * Body (description / padding) also toggles — not only the header button.
   * Skip nested controls (header button, Options accordion, links).
   */
  const handleShellClick = (e: React.MouseEvent) => {
    if (!canExpand) return;
    const target = e.target as HTMLElement;
    const interactive = target.closest?.(
      'button, [role="button"], a, input, select, textarea, [data-expand-ignore]'
    );
    if (interactive && interactive !== e.currentTarget) return;
    toggleExpanded(e);
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
      ref={shellRef}
      className={expandableChipShellClass({
        variant: styleVariant,
        expanded: isExpanded,
        size,
        className: cn(
          interactiveHover && canExpand && 'hover:shadow-md',
          isExpanded && interactiveHover && 'shadow-md',
          canExpand && 'cursor-pointer',
          !useButtonHeader && canExpand && !isExpanded && 'touch-target-md-compact',
          className
        ),
      })}
      onClick={canExpand ? handleShellClick : undefined}
      onKeyDown={!useButtonHeader && canExpand ? handleHeaderKeyDown : undefined}
      tabIndex={!useButtonHeader && canExpand ? 0 : undefined}
      role={!useButtonHeader && canExpand ? 'button' : undefined}
      // When header is a real <button>, that button owns aria-expanded (avoid dual widgets).
      aria-expanded={!useButtonHeader && canExpand ? isExpanded : undefined}
    >
      {useButtonHeader ? (
        <button
          type="button"
          onClick={canExpand ? toggleExpanded : (e) => e.stopPropagation()}
          disabled={!canExpand && !onToggle}
          className={cn(
            'flex items-center gap-1.5 text-left w-full touch-target-md-compact',
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
    <span className="inline-flex items-center gap-1.5 min-w-0 flex-1 flex-nowrap overflow-hidden">
      <span className={cn('truncate', labelClassName)}>{label}</span>
      {level != null && level > 0 && (
        <span className="text-xs text-text-secondary shrink-0">(Lv.{level})</span>
      )}
      {costSuffix !== undefined &&
        costSuffix !== '' &&
        !(typeof costSuffix === 'number' && costSuffix <= 0) && (
        <span className="text-xs text-text-muted dark:text-text-secondary shrink-0">
          ({costSuffix})
        </span>
      )}
      {hasTp && (
        <>
          <span className="opacity-40 shrink-0">|</span>
          <span className="text-xs font-semibold shrink-0">TP: {tpCost}</span>
        </>
      )}
      {hasEnergy && (
        <>
          <span className="opacity-40 shrink-0">|</span>
          <span className="text-xs font-semibold text-energy shrink-0">{energyCost} EP</span>
        </>
      )}
      {hasNumericCost && cost !== undefined && !hasTp && (
        <>
          <span className="opacity-40 shrink-0">|</span>
          <span className="text-xs font-semibold text-text-secondary dark:text-text-primary shrink-0">
            {costLabel}: {typeof cost === 'number' ? formatCostDisplay(cost) : cost}
          </span>
        </>
      )}
    </span>
  );
}

export interface ChipGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/** Flex-wrap host for ExpandableChip — marks the full-row expansion boundary. */
export function ChipGroup({ children, className, ...rest }: ChipGroupProps) {
  return (
    <div
      {...rest}
      data-chip-group
      className={cn('flex flex-wrap gap-2 items-start', className)}
    >
      {children}
    </div>
  );
}
