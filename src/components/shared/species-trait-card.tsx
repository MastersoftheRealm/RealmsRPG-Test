'use client';

/**
 * SpeciesTraitCard - Unified Trait Display Component
 * ===================================================
 * Consistent trait display for species modal, codex, and character creator.
 * Supports all trait categories with appropriate color coding.
 * Supports limited uses tracking with +/- controls.
 */

import { Heart, Star, Sparkles, AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DecrementButton, IncrementButton } from './value-stepper';

// =============================================================================
// Types
// =============================================================================

export type TraitCategory = 'species' | 'ancestry' | 'flaw' | 'characteristic';

export interface TraitData {
  id?: string;
  name: string;
  description?: string;
  /** Max uses per recovery period (0 = unlimited) */
  maxUses?: number;
  /** Recovery period text (e.g., "Full Recovery", "Short Rest") */
  recoveryPeriod?: string;
}

export interface SpeciesTraitCardProps {
  trait: TraitData;
  category: TraitCategory;
  /** Whether this trait can be selected */
  selectable?: boolean;
  /** Current selection state */
  selected?: boolean;
  /** Callback when trait is clicked (for selectable traits) */
  onToggle?: () => void;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Compact mode (smaller padding, no icon) */
  compact?: boolean;
  /** Custom class name */
  className?: string;
  /** Current uses remaining (for limited use traits) */
  currentUses?: number;
  /** Callback to change uses (+1 or -1) */
  onUsesChange?: (delta: number) => void;
  /** Use neutral styling with text subtype (for character sheet display) */
  neutralStyle?: boolean;
}

// =============================================================================
// Category Configuration (using design tokens)
// =============================================================================

const CATEGORY_CONFIG: Record<TraitCategory, {
  icon: typeof Heart;
  label: string;
  colors: {
    bg: string;
    border: string;
    text: string;
    iconColor: string;
    selectedBg: string;
    selectedBorder: string;
  };
}> = {
  species: {
    icon: Heart,
    label: 'Species Trait',
    colors: {
      bg: 'bg-info-50',
      border: 'border-info-200',
      text: 'text-info-800',
      iconColor: 'text-info-500',
      selectedBg: 'bg-info-100',
      selectedBorder: 'border-info-400',
    },
  },
  ancestry: {
    icon: Star,
    label: 'Ancestry Trait',
    colors: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      text: 'text-success-800',
      iconColor: 'text-success-500',
      selectedBg: 'bg-success-100',
      selectedBorder: 'border-success-400',
    },
  },
  flaw: {
    icon: AlertTriangle,
    label: 'Flaw',
    colors: {
      bg: 'bg-danger-50',
      border: 'border-danger-200',
      text: 'text-danger-800',
      iconColor: 'text-danger-500',
      selectedBg: 'bg-danger-100',
      selectedBorder: 'border-danger-400',
    },
  },
  characteristic: {
    icon: Sparkles,
    label: 'Characteristic',
    colors: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      iconColor: 'text-purple-500',
      selectedBg: 'bg-purple-100',
      selectedBorder: 'border-purple-400',
    },
  },
};

// Neutral styling for character sheet display
const NEUTRAL_COLORS = {
  bg: 'bg-surface-alt',
  border: 'border-border-light',
  text: 'text-text-primary',
  iconColor: 'text-text-muted',
  selectedBg: 'bg-primary-50',
  selectedBorder: 'border-primary-400',
};

// =============================================================================
// Main Component
// =============================================================================

export function SpeciesTraitCard({
  trait,
  category,
  selectable = false,
  selected = false,
  onToggle,
  disabled = false,
  compact = false,
  className,
  currentUses,
  onUsesChange,
  neutralStyle = false,
}: SpeciesTraitCardProps) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;
  // Use neutral colors if neutralStyle is true, otherwise use category colors
  const colors = neutralStyle ? NEUTRAL_COLORS : config.colors;
  
  // Uses tracking
  const maxUses = trait.maxUses ?? 0;
  const hasLimitedUses = maxUses > 0;
  const usesRemaining = currentUses ?? maxUses;
  
  const handleClick = () => {
    if (selectable && !disabled && onToggle) {
      onToggle();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && selectable && !disabled) {
      e.preventDefault();
      onToggle?.();
    }
  };
  
  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-200',
        compact ? 'p-2' : 'p-3',
        selected ? colors.selectedBg : colors.bg,
        selected ? colors.selectedBorder : colors.border,
        selectable && !disabled && 'cursor-pointer hover:shadow-sm',
        selectable && !disabled && !selected && 'hover:border-border',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={selectable && !disabled ? 0 : undefined}
      role={selectable ? 'button' : undefined}
      aria-pressed={selectable ? selected : undefined}
      aria-disabled={disabled}
    >
      <div className="flex items-start gap-3">
        {/* Selection checkbox (for selectable traits) */}
        {selectable && (
          <div 
            className={cn(
              'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
              selected 
                ? 'bg-primary-600 border-primary-600' 
                : 'border-border-light bg-surface',
              disabled && 'opacity-50'
            )}
          >
            {selected && <Check className="w-3 h-3 text-white" />}
          </div>
        )}
        
        {/* Icon (for non-compact mode) */}
        {!compact && !selectable && (
          <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', colors.iconColor)} />
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4 className={cn(
                'font-medium',
                compact ? 'text-sm' : '',
                colors.text
              )}>
                {trait.name}
              </h4>
              {/* Subtext label for trait type when using neutral style */}
              {neutralStyle && (
                <span className="text-xs text-text-muted italic">
                  {config.label}
                </span>
              )}
            </div>
            
            {/* Uses tracking controls */}
            {hasLimitedUses && (
              <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {onUsesChange && (
                  <DecrementButton
                    onClick={() => onUsesChange(-1)}
                    disabled={usesRemaining <= 0}
                    size="xs"
                    title="Use trait"
                  />
                )}
                <span className={cn(
                  'text-xs font-medium min-w-[36px] text-center',
                  usesRemaining === 0 ? 'text-danger-600' : 'text-text-secondary'
                )}>
                  {usesRemaining}/{maxUses}
                </span>
                {onUsesChange && (
                  <IncrementButton
                    onClick={() => onUsesChange(1)}
                    disabled={usesRemaining >= maxUses}
                    size="xs"
                    title="Restore use"
                  />
                )}
              </div>
            )}
          </div>
          
          {trait.description && (
            <p className={cn(
              'text-text-secondary mt-1',
              compact ? 'text-xs' : 'text-sm'
            )}>
              {trait.description}
            </p>
          )}
          
          {/* Recovery period */}
          {hasLimitedUses && trait.recoveryPeriod && (
            <p className="text-xs text-text-muted mt-1 italic">
              🔄 {trait.recoveryPeriod}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Grouped Display Component
// =============================================================================

export interface TraitGroupProps {
  title: string;
  category: TraitCategory;
  traits: TraitData[];
  /** Selection configuration */
  selection?: {
    selectedIds: Set<string>;
    onToggle: (traitId: string) => void;
    maxSelections?: number;
    disabled?: boolean;
  };
  /** Optional subtitle (e.g., "Select 1-2 traits") */
  subtitle?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Compact mode */
  compact?: boolean;
  className?: string;
}

export function TraitGroup({
  title,
  category,
  traits,
  selection,
  subtitle,
  emptyMessage = 'No traits available',
  compact = false,
  className,
}: TraitGroupProps) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;
  const { colors } = config;
  
  const selectedCount = selection ? 
    traits.filter(t => selection.selectedIds.has(t.id || t.name)).length : 0;
  
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-5 h-5', colors.iconColor)} />
          <h3 className={cn('font-semibold', colors.text)}>{title}</h3>
          <span className="text-sm text-text-muted">({traits.length})</span>
        </div>
        {subtitle && (
          <span className="text-sm text-text-muted">{subtitle}</span>
        )}
        {selection && selection.maxSelections && (
          <span className={cn(
            'text-sm font-medium',
            selectedCount >= (selection.maxSelections || 0) ? 'text-success-600' : 'text-text-muted'
          )}>
            {selectedCount}/{selection.maxSelections} selected
          </span>
        )}
      </div>
      
      {/* Traits */}
      {traits.length === 0 ? (
        <p className="text-sm text-text-muted italic">{emptyMessage}</p>
      ) : (
        <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
          {traits.map((trait, idx) => {
            const traitId = trait.id || trait.name;
            const isSelected = selection?.selectedIds.has(traitId);
            const atMax = Boolean(selection && selection.maxSelections && 
              selectedCount >= selection.maxSelections && !isSelected);
            
            return (
              <SpeciesTraitCard
                key={traitId || idx}
                trait={trait}
                category={category}
                selectable={!!selection}
                selected={isSelected}
                onToggle={() => selection?.onToggle(traitId)}
                disabled={selection?.disabled || atMax}
                compact={compact}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SpeciesTraitCard;
