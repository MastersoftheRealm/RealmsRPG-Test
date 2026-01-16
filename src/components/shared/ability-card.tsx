'use client';

/**
 * AbilityCard - Unified Display Component for Powers, Techniques, and Armaments
 * ==============================================================================
 * A reusable expandable card component that displays ability details with:
 * - Description
 * - Parts/Properties chips (with TP costs highlighted)
 * - Expandable chip details
 * - Consistent styling across Library, Codex, Character Creator, Character Sheet
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit, Trash2, Copy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

export interface PartChip {
  /** Part/property name */
  name: string;
  /** Full text including option levels (e.g., "Elemental Damage (Opt1 3)") */
  text: string;
  /** Part description */
  description: string;
  /** TP cost of this part (0 if none) */
  tpCost: number;
  /** Option levels if increased */
  optionLevels?: {
    opt1?: number;
    opt2?: number;
    opt3?: number;
  };
}

export interface AbilityStat {
  label: string;
  value: string | number;
  /** Optional: highlight this stat */
  highlight?: boolean;
}

export interface AbilityCardProps {
  /** Item ID for actions */
  id: string;
  /** Display name */
  name: string;
  /** Item description */
  description?: string;
  /** Type: 'power' | 'technique' | 'armament' */
  type: 'power' | 'technique' | 'armament';
  /** Quick stats displayed in header (e.g., Energy, Action, Duration) */
  stats?: AbilityStat[];
  /** Parts/properties as chips */
  parts?: PartChip[];
  /** Label for parts section */
  partsLabel?: string;
  /** Total TP cost */
  totalTP?: number;
  /** Damage string (formatted) */
  damage?: string;
  
  // Actions
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  /** Show action buttons */
  showActions?: boolean;
  
  // UI options
  /** Start expanded */
  defaultExpanded?: boolean;
  /** Compact mode for lists */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function AbilityCard({
  id,
  name,
  description,
  type,
  stats = [],
  parts = [],
  partsLabel,
  totalTP,
  damage,
  onEdit,
  onDelete,
  onDuplicate,
  showActions = false,
  defaultExpanded = false,
  compact = false,
  className,
}: AbilityCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [expandedChipIndex, setExpandedChipIndex] = useState<number | null>(null);

  const hasDetails = description || (parts && parts.length > 0);
  const chipLabel = partsLabel || (type === 'armament' ? 'Properties & Proficiencies' : 'Parts & Proficiencies');

  // Separate parts into regular and proficiency (has TP) parts
  const regularParts = parts.filter(p => p.tpCost === 0);
  const proficiencyParts = parts.filter(p => p.tpCost > 0);

  const handleChipClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChipIndex(expandedChipIndex === index ? null : index);
  };

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-200 bg-white',
        isExpanded ? 'border-primary-300 shadow-sm' : 'border-gray-200 hover:border-primary-200',
        className
      )}
    >
      {/* Header Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between gap-4 text-left transition-colors',
          compact ? 'px-3 py-2' : 'px-4 py-3',
          isExpanded ? 'bg-primary-50' : 'hover:bg-gray-50'
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Name */}
          <h3 className={cn('font-semibold text-gray-900 truncate', compact ? 'text-sm' : 'text-base')}>
            {name}
          </h3>
          
          {/* Quick Stats */}
          {!compact && stats.length > 0 && (
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
              {stats.slice(0, 4).map((stat, i) => (
                <span key={i} className="whitespace-nowrap">
                  <span className="text-gray-400">{stat.label}:</span>{' '}
                  <span className={cn('font-medium', stat.highlight && 'text-primary-600')}>
                    {stat.value}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Total TP Badge */}
          {totalTP !== undefined && totalTP > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              <Zap className="w-3 h-3" />
              {totalTP} TP
            </span>
          )}

          {/* Damage Badge */}
          {damage && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
              {damage}
            </span>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
              )}
              {onDuplicate && (
                <button
                  onClick={onDuplicate}
                  className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded hover:bg-red-100 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>
          )}

          {/* Expand/Collapse */}
          {hasDetails && (
            <span className="text-gray-400">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50">
          {/* Description */}
          {description && (
            <p className="text-gray-700 text-sm mb-4">{description}</p>
          )}

          {/* Stats on Mobile */}
          {stats.length > 0 && (
            <div className="md:hidden grid grid-cols-2 gap-2 mb-4 text-sm">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-gray-500">{stat.label}:</span>
                  <span className={cn('font-medium text-gray-900', stat.highlight && 'text-primary-600')}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Parts/Properties Section */}
          {parts.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {chipLabel}
              </h4>

              {/* Chips */}
              <div className="flex flex-wrap gap-2">
                {parts.map((part, index) => (
                  <PartChipButton
                    key={index}
                    part={part}
                    isExpanded={expandedChipIndex === index}
                    onClick={(e) => handleChipClick(index, e)}
                  />
                ))}
              </div>

              {/* Expanded Chip Details */}
              {expandedChipIndex !== null && parts[expandedChipIndex] && (
                <PartChipDetails part={parts[expandedChipIndex]} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

interface PartChipButtonProps {
  part: PartChip;
  isExpanded: boolean;
  onClick: (e: React.MouseEvent) => void;
}

function PartChipButton({ part, isExpanded, onClick }: PartChipButtonProps) {
  const hasTP = part.tpCost > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
        'border cursor-pointer',
        hasTP
          ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
          : 'bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100',
        isExpanded && 'ring-2 ring-offset-1',
        isExpanded && hasTP ? 'ring-amber-400' : isExpanded && 'ring-primary-400'
      )}
    >
      <span>{part.name}</span>
      {hasTP && (
        <>
          <span className="text-amber-400">|</span>
          <span className="text-xs font-semibold">TP: {part.tpCost}</span>
        </>
      )}
    </button>
  );
}

interface PartChipDetailsProps {
  part: PartChip;
}

function PartChipDetails({ part }: PartChipDetailsProps) {
  const hasOptions = part.optionLevels && (
    (part.optionLevels.opt1 ?? 0) > 0 ||
    (part.optionLevels.opt2 ?? 0) > 0 ||
    (part.optionLevels.opt3 ?? 0) > 0
  );

  return (
    <div className="mt-2 p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h5 className="font-semibold text-gray-900">{part.name}</h5>
        {part.tpCost > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Zap className="w-3 h-3" />
            {part.tpCost} TP
          </span>
        )}
      </div>

      {part.description && (
        <p className="text-sm text-gray-600 mb-2">{part.description}</p>
      )}

      {hasOptions && part.optionLevels && (
        <div className="flex flex-wrap gap-2 text-xs">
          {(part.optionLevels.opt1 ?? 0) > 0 && (
            <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
              Option 1: Level {part.optionLevels.opt1}
            </span>
          )}
          {(part.optionLevels.opt2 ?? 0) > 0 && (
            <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
              Option 2: Level {part.optionLevels.opt2}
            </span>
          )}
          {(part.optionLevels.opt3 ?? 0) > 0 && (
            <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
              Option 3: Level {part.optionLevels.opt3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default AbilityCard;
