/**
 * PartCard Component
 * ==================
 * A reusable card for displaying and configuring power/technique parts.
 * Shows part name, description, base costs, and option steppers.
 */

'use client';

import { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberStepper } from './number-stepper';

// =============================================================================
// Types
// =============================================================================

export interface PartDefinition {
  id: number | string;
  name: string;
  description?: string;
  category?: string;
  base_en?: number;
  base_tp?: number;
  op_1_desc?: string;
  op_1_en?: number;
  op_1_tp?: number;
  op_2_desc?: string;
  op_2_en?: number;
  op_2_tp?: number;
  op_3_desc?: string;
  op_3_en?: number;
  op_3_tp?: number;
}

export interface SelectedPartState {
  part: PartDefinition;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  selectedCategory?: string;
  applyDuration?: boolean;
}

interface PartCardProps {
  selectedPart: SelectedPartState;
  onRemove: () => void;
  onUpdate: (updates: Partial<SelectedPartState>) => void;
  allParts: PartDefinition[];
  showCategoryFilter?: boolean;
  showApplyDuration?: boolean;
  accentColor?: 'primary' | 'red' | 'amber' | 'blue';
}

// =============================================================================
// Component
// =============================================================================

export function PartCard({
  selectedPart,
  onRemove,
  onUpdate,
  allParts,
  showCategoryFilter = true,
  showApplyDuration = false,
  accentColor = 'primary',
}: PartCardProps) {
  const [expanded, setExpanded] = useState(true);
  const { part } = selectedPart;

  // Get unique categories from all parts
  const categories = useMemo(() => {
    const cats = new Set(allParts.map((p) => p.category).filter(Boolean));
    return ['any', ...Array.from(cats).sort()];
  }, [allParts]);

  // Filter parts by selected category
  const filteredParts = useMemo(() => {
    const cat = selectedPart.selectedCategory;
    if (!cat || cat === 'any') return allParts.sort((a, b) => a.name.localeCompare(b.name));
    return allParts.filter((p) => p.category === cat).sort((a, b) => a.name.localeCompare(b.name));
  }, [allParts, selectedPart.selectedCategory]);

  // Check which options have content
  const hasOption = (n: 1 | 2 | 3) => {
    const desc = part[`op_${n}_desc` as keyof PartDefinition] as string | undefined;
    const en = part[`op_${n}_en` as keyof PartDefinition] as number | undefined;
    const tp = part[`op_${n}_tp` as keyof PartDefinition] as number | undefined;
    return (desc && desc.trim() !== '') || (en !== undefined && en !== 0) || (tp !== undefined && tp !== 0);
  };

  // Calculate part's individual contribution
  const partEnergy =
    (part.base_en || 0) +
    (part.op_1_en || 0) * selectedPart.op_1_lvl +
    (part.op_2_en || 0) * selectedPart.op_2_lvl +
    (part.op_3_en || 0) * selectedPart.op_3_lvl;

  const partTP =
    (part.base_tp || 0) +
    (part.op_1_tp || 0) * selectedPart.op_1_lvl +
    (part.op_2_tp || 0) * selectedPart.op_2_lvl +
    (part.op_3_tp || 0) * selectedPart.op_3_lvl;

  // Accent color classes
  const accentClasses = {
    primary: 'focus:ring-primary-500 focus:border-primary-500',
    red: 'focus:ring-red-500 focus:border-red-500',
    amber: 'focus:ring-amber-500 focus:border-amber-500',
    blue: 'focus:ring-blue-500 focus:border-blue-500',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <span className="font-medium text-gray-900">{part.name}</span>
          <span className="text-sm text-gray-500">
            EN: {partEnergy.toFixed(1)} | TP: {Math.floor(partTP)}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 py-4 space-y-4">
          {/* Category and Part Selection */}
          {showCategoryFilter && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={selectedPart.selectedCategory || 'any'}
                  onChange={(e) => onUpdate({ selectedCategory: e.target.value })}
                  className={cn("w-full px-3 py-2 border border-gray-300 rounded-lg text-sm", accentClasses[accentColor])}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'any' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Part
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
                      });
                    }
                  }}
                  className={cn("w-full px-3 py-2 border border-gray-300 rounded-lg text-sm", accentClasses[accentColor])}
                >
                  {filteredParts.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Description */}
          {part.description && (
            <p className="text-sm text-gray-600">{part.description}</p>
          )}

          {/* Base Values */}
          <div className="flex gap-4 text-sm">
            <span className="text-gray-600">
              Base Energy: <strong>{part.base_en ?? 0}</strong>
            </span>
            <span className="text-gray-600">
              Base TP: <strong>{part.base_tp ?? 0}</strong>
            </span>
          </div>

          {/* Apply to Duration checkbox */}
          {showApplyDuration && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selectedPart.applyDuration || false}
                onChange={(e) => onUpdate({ applyDuration: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Apply to Duration
            </label>
          )}

          {/* Options */}
          {(hasOption(1) || hasOption(2) || hasOption(3)) && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              {hasOption(1) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Option 1:{' '}
                      <span className="text-gray-500">
                        EN {(part.op_1_en || 0) >= 0 ? '+' : ''}{part.op_1_en || 0}, TP{' '}
                        {(part.op_1_tp || 0) >= 0 ? '+' : ''}{part.op_1_tp || 0}
                      </span>
                    </span>
                    <NumberStepper
                      value={selectedPart.op_1_lvl}
                      onChange={(v) => onUpdate({ op_1_lvl: v })}
                      label="Level:"
                    />
                  </div>
                  {part.op_1_desc && (
                    <p className="text-sm text-gray-600">{part.op_1_desc}</p>
                  )}
                </div>
              )}

              {hasOption(2) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Option 2:{' '}
                      <span className="text-gray-500">
                        EN {(part.op_2_en || 0) >= 0 ? '+' : ''}{part.op_2_en || 0}, TP{' '}
                        {(part.op_2_tp || 0) >= 0 ? '+' : ''}{part.op_2_tp || 0}
                      </span>
                    </span>
                    <NumberStepper
                      value={selectedPart.op_2_lvl}
                      onChange={(v) => onUpdate({ op_2_lvl: v })}
                      label="Level:"
                    />
                  </div>
                  {part.op_2_desc && (
                    <p className="text-sm text-gray-600">{part.op_2_desc}</p>
                  )}
                </div>
              )}

              {hasOption(3) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Option 3:{' '}
                      <span className="text-gray-500">
                        EN {(part.op_3_en || 0) >= 0 ? '+' : ''}{part.op_3_en || 0}, TP{' '}
                        {(part.op_3_tp || 0) >= 0 ? '+' : ''}{part.op_3_tp || 0}
                      </span>
                    </span>
                    <NumberStepper
                      value={selectedPart.op_3_lvl}
                      onChange={(v) => onUpdate({ op_3_lvl: v })}
                      label="Level:"
                    />
                  </div>
                  {part.op_3_desc && (
                    <p className="text-sm text-gray-600">{part.op_3_desc}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PartCard;
