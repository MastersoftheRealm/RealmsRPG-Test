'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, X, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// =============================================================================
// Types
// =============================================================================

/**
 * Base part/property data shape - works for PowerPart, TechniquePart, ArmamentProperty
 */
export interface BasePartData {
  id: string | number;
  name: string;
  description?: string;
  category?: string;
  
  // Base costs (optional - items may not have energy)
  base_tp?: number;
  base_en?: number;
  base_stam?: number; // Technique uses stamina
  
  // Option 1 (all creators support at least one option)
  op_1_desc?: string;
  op_1_en?: number;
  op_1_tp?: number;
  
  // Options 2-3 (Power/Technique only)
  op_2_desc?: string;
  op_2_en?: number;
  op_2_tp?: number;
  op_3_desc?: string;
  op_3_en?: number;
  op_3_tp?: number;
  
  // Type filters (for properties)
  type?: string | string[];
}

/**
 * Selected part state shape
 */
export interface SelectedPartState {
  op_1_lvl: number;
  op_2_lvl?: number;
  op_3_lvl?: number;
  selectedCategory?: string;
  applyDuration?: boolean;
}

export type CreatorType = 'power' | 'technique' | 'armament';

export interface PartCardProps<T extends BasePartData> {
  /** The part/property definition */
  part: T;
  
  /** Current option levels and settings */
  selected: SelectedPartState;
  
  /** Called when removing the part */
  onRemove: () => void;
  
  /** Called when updating selection */
  onUpdate: (updates: Partial<SelectedPartState & { part: T }>) => void;
  
  /** All available parts for selection dropdown */
  allParts: T[];
  
  /** Creator type - affects available features */
  creatorType: CreatorType;
  
  /** Optional category filter for the dropdown */
  categoryFilter?: string;
  
  /** Whether to show the category selector (default: true for power/technique) */
  showCategorySelector?: boolean;
  
  /** Number of options to show (default: 3 for power/technique, 1 for armament) */
  maxOptions?: 1 | 2 | 3;
  
  /** Whether to show "Apply Duration" checkbox (default: true for power) */
  showApplyDuration?: boolean;
  
  /** Label for energy/stamina column (default: "EN" for power, "Stam" for technique) */
  energyLabel?: string;
  
  /** Custom class name for the card */
  className?: string;
}

// =============================================================================
// Helper Components
// =============================================================================

function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm font-medium text-gray-600">{label}</span>}
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          disabled={value <= min}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="px-3 py-1 min-w-[2.5rem] text-center font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          disabled={value >= max}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function PartCard<T extends BasePartData>({
  part,
  selected,
  onRemove,
  onUpdate,
  allParts,
  creatorType,
  categoryFilter,
  showCategorySelector = creatorType !== 'armament',
  maxOptions = creatorType === 'armament' ? 1 : 3,
  showApplyDuration = creatorType === 'power',
  energyLabel = creatorType === 'technique' ? 'Stam' : 'EN',
  className,
}: PartCardProps<T>) {
  const [expanded, setExpanded] = useState(true);

  // Get unique categories from all parts
  const categories = useMemo(() => {
    const cats = new Set(allParts.map((p) => p.category).filter(Boolean));
    return ['any', ...Array.from(cats).sort()] as string[];
  }, [allParts]);

  // Filter parts by selected category and optional type filter
  const filteredParts = useMemo(() => {
    let filtered = allParts;
    
    // Filter by category if not 'any'
    const cat = selected.selectedCategory || 'any';
    if (cat !== 'any') {
      filtered = filtered.filter((p) => p.category === cat);
    }
    
    // Filter by type (for armaments)
    if (categoryFilter) {
      filtered = filtered.filter((p) => {
        if (!p.type) return true;
        if (Array.isArray(p.type)) return p.type.includes(categoryFilter);
        return p.type === categoryFilter;
      });
    }
    
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [allParts, selected.selectedCategory, categoryFilter]);

  // Check if an option has content
  const hasOption = (n: 1 | 2 | 3): boolean => {
    const desc = part[`op_${n}_desc` as keyof T] as string | undefined;
    const en = part[`op_${n}_en` as keyof T] as number | undefined;
    const tp = part[`op_${n}_tp` as keyof T] as number | undefined;
    return Boolean(desc?.trim()) || (en !== undefined && en !== 0) || (tp !== undefined && tp !== 0);
  };

  // Get energy value (base_en or base_stam)
  const getBaseEnergy = (): number => {
    return (part.base_en ?? part.base_stam ?? 0);
  };

  // Calculate current costs
  const calculateCosts = () => {
    const baseEn = getBaseEnergy();
    const baseTp = part.base_tp ?? 0;
    
    let totalEn = baseEn;
    let totalTp = baseTp;
    
    for (let i = 1; i <= maxOptions; i++) {
      const level = selected[`op_${i}_lvl` as keyof SelectedPartState] as number || 0;
      const en = part[`op_${i}_en` as keyof T] as number || 0;
      const tp = part[`op_${i}_tp` as keyof T] as number || 0;
      totalEn += en * level;
      totalTp += tp * level;
    }
    
    return { totalEn, totalTp };
  };

  const { totalEn, totalTp } = calculateCosts();
  const showEnergy = creatorType !== 'armament';

  return (
    <div className={cn(
      'bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <span className="font-medium text-gray-900">{part.name}</span>
          <span className="text-sm text-gray-500">
            {showEnergy && <>{energyLabel}: {totalEn.toFixed(1)} | </>}
            TP: {Math.floor(totalTp)}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 py-4 space-y-4">
          {/* Category and Part Selection */}
          <div className={cn('grid gap-4', showCategorySelector ? 'md:grid-cols-2' : '')}>
            {showCategorySelector && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={selected.selectedCategory || 'any'}
                  onChange={(e) => onUpdate({ selectedCategory: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'any' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className={showCategorySelector ? '' : 'w-full'}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {creatorType === 'armament' ? 'Property' : 'Part'}
              </label>
              <select
                value={filteredParts.findIndex((p) => p.id === part.id)}
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  const newPart = filteredParts[idx];
                  if (newPart) {
                    onUpdate({
                      part: newPart,
                      op_1_lvl: 0,
                      op_2_lvl: 0,
                      op_3_lvl: 0,
                    } as Partial<SelectedPartState & { part: T }>);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {filteredParts.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          {part.description && (
            <p className="text-sm text-gray-600">{part.description}</p>
          )}

          {/* Base Values (for power/technique) */}
          {showEnergy && (
            <div className="flex gap-4 text-sm">
              <span className="text-gray-600">
                Base {energyLabel}: <strong>{getBaseEnergy()}</strong>
              </span>
              <span className="text-gray-600">
                Base TP: <strong>{part.base_tp ?? 0}</strong>
              </span>
            </div>
          )}

          {/* Options */}
          {([1, 2, 3] as const).slice(0, maxOptions).map((n) => {
            if (!hasOption(n)) return null;
            
            const desc = part[`op_${n}_desc` as keyof T] as string | undefined;
            const en = part[`op_${n}_en` as keyof T] as number ?? 0;
            const tp = part[`op_${n}_tp` as keyof T] as number ?? 0;
            const level = selected[`op_${n}_lvl` as keyof SelectedPartState] as number || 0;
            
            return (
              <div key={n} className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-gray-700">Option {n}</span>
                    {showEnergy && (
                      <span className="text-gray-500">
                        {energyLabel}: {en >= 0 ? '+' : ''}{en}
                      </span>
                    )}
                    <span className="text-gray-500">
                      TP: {tp >= 0 ? '+' : ''}{tp}
                    </span>
                  </div>
                  <NumberStepper
                    value={level}
                    onChange={(v) => onUpdate({ [`op_${n}_lvl`]: v } as Partial<SelectedPartState>)}
                    label="Level:"
                    min={0}
                    max={99}
                  />
                </div>
                {desc && <p className="text-sm text-gray-600">{desc}</p>}
              </div>
            );
          })}

          {/* Apply Duration (Power only) */}
          {showApplyDuration && (
            <label className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <input
                type="checkbox"
                checked={selected.applyDuration || false}
                onChange={(e) => onUpdate({ applyDuration: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Apply Duration</span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}

export default PartCard;
