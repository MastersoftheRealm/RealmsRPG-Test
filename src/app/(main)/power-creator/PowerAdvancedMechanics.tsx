/**
 * Power Advanced Mechanics - Advanced part chips and section
 */

'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCost, CATEGORY_COLORS } from '@/lib/game/creator-constants';
import { Checkbox } from '@/components/ui';
import { NumberStepper } from '@/components/creator/number-stepper';
import type { PowerPart } from '@/hooks';
import type { AdvancedPart } from './power-creator-types';
import { ADVANCED_CATEGORIES, EXCLUDED_PARTS } from './power-creator-constants';

function AdvancedChip({
  part,
  onAdd,
}: {
  part: PowerPart;
  onAdd: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const colors = CATEGORY_COLORS[part.category] || CATEGORY_COLORS['Special'];

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 cursor-pointer transition-all min-w-0',
        colors.bg,
        colors.border,
        colors.hoverBg
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn('text-sm font-medium truncate', colors.text)}>
          {part.name}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className={cn(
            'w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm',
            colors.buttonBg,
            colors.buttonHover
          )}
        >
          +
        </button>
      </div>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-current/20 text-sm space-y-1">
          <p className={colors.text}>{part.description || 'No description available.'}</p>
          {part.op_1_desc && (
            <p className="text-text-secondary">
              <span className="font-medium">Option 1:</span> {part.op_1_desc}
            </p>
          )}
          {part.op_2_desc && (
            <p className="text-text-secondary">
              <span className="font-medium">Option 2:</span> {part.op_2_desc}
            </p>
          )}
          {part.op_3_desc && (
            <p className="text-text-secondary">
              <span className="font-medium">Option 3:</span> {part.op_3_desc}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AddedAdvancedChip({
  advPart,
  onRemove,
  onUpdate,
}: {
  advPart: AdvancedPart;
  _index: number;
  onRemove: () => void;
  onUpdate: (updates: Partial<AdvancedPart>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { part } = advPart;
  const colors = CATEGORY_COLORS[part.category] || CATEGORY_COLORS['Special'];

  const hasOption = (n: 1 | 2 | 3) => {
    const desc = part[`op_${n}_desc` as keyof PowerPart] as string | undefined;
    return desc && desc.trim() !== '';
  };

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 transition-all cursor-pointer',
        colors.bg,
        colors.border
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn('text-sm font-medium', colors.text)}>
          {part.name}
          {(advPart.op_1_lvl > 0 || advPart.op_2_lvl > 0 || advPart.op_3_lvl > 0) && (
            <span className="ml-2 text-xs opacity-75">
              ({advPart.op_1_lvl}/{advPart.op_2_lvl}/{advPart.op_3_lvl})
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm bg-red-500 hover:bg-red-600"
        >
          ×
        </button>
      </div>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-current/20 text-sm space-y-2" onClick={(e) => e.stopPropagation()}>
          <p className={cn(colors.text, 'text-base leading-relaxed')}>{part.description}</p>

          {hasOption(1) && (
            <div className="bg-white/70 border border-current/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">Option 1</span>
                  <span className="text-sm font-medium text-energy">
                    EN {(part.op_1_en || 0) >= 0 ? '+' : ''}{formatCost(part.op_1_en || 0)}
                  </span>
                  <span className="text-sm font-medium text-tp">
                    TP {(part.op_1_tp || 0) >= 0 ? '+' : ''}{formatCost(part.op_1_tp || 0)}
                  </span>
                </div>
                <NumberStepper
                  value={advPart.op_1_lvl}
                  onChange={(v) => onUpdate({ op_1_lvl: v })}
                  label=""
                />
              </div>
              <p className="text-sm text-text-primary">{part.op_1_desc}</p>
            </div>
          )}

          {hasOption(2) && (
            <div className="bg-white/70 border border-current/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">Option 2</span>
                  <span className="text-sm font-medium text-energy">
                    EN {(part.op_2_en || 0) >= 0 ? '+' : ''}{formatCost(part.op_2_en || 0)}
                  </span>
                  <span className="text-sm font-medium text-tp">
                    TP {(part.op_2_tp || 0) >= 0 ? '+' : ''}{formatCost(part.op_2_tp || 0)}
                  </span>
                </div>
                <NumberStepper
                  value={advPart.op_2_lvl}
                  onChange={(v) => onUpdate({ op_2_lvl: v })}
                  label=""
                />
              </div>
              <p className="text-sm text-text-primary">{part.op_2_desc}</p>
            </div>
          )}

          {hasOption(3) && (
            <div className="bg-white/70 border border-current/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">Option 3</span>
                  <span className="text-sm font-medium text-energy">
                    EN {(part.op_3_en || 0) >= 0 ? '+' : ''}{formatCost(part.op_3_en || 0)}
                  </span>
                  <span className="text-sm font-medium text-tp">
                    TP {(part.op_3_tp || 0) >= 0 ? '+' : ''}{formatCost(part.op_3_tp || 0)}
                  </span>
                </div>
                <NumberStepper
                  value={advPart.op_3_lvl}
                  onChange={(v) => onUpdate({ op_3_lvl: v })}
                  label=""
                />
              </div>
              <p className="text-sm text-text-primary">{part.op_3_desc}</p>
            </div>
          )}

          <Checkbox
            checked={advPart.applyDuration}
            onChange={(e) => onUpdate({ applyDuration: e.target.checked })}
            label="Apply Duration"
          />
        </div>
      )}
    </div>
  );
}

interface PowerAdvancedMechanicsSectionProps {
  powerParts: PowerPart[];
  selectedAdvancedParts: AdvancedPart[];
  onAdd: (part: PowerPart) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<AdvancedPart>) => void;
}

export function PowerAdvancedMechanicsSection({
  powerParts,
  selectedAdvancedParts,
  onAdd,
  onRemove,
  onUpdate,
}: PowerAdvancedMechanicsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const getPartsForCategory = useCallback(
    (category: string) => {
      return powerParts.filter(
        (p) => p.mechanic && p.category === category && !EXCLUDED_PARTS.has(p.name)
      );
    },
    [powerParts]
  );

  return (
    <div className="bg-surface rounded-xl shadow-md overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-surface-alt hover:bg-surface-alt transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-text-muted" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-muted" />
          )}
          <span className="font-bold text-text-primary">Advanced Power Mechanics</span>
        </div>
        {!expanded && selectedAdvancedParts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedAdvancedParts.slice(0, 5).map((ap, i) => {
              const colors = CATEGORY_COLORS[ap.part.category] || CATEGORY_COLORS['Special'];
              return (
                <span
                  key={i}
                  className={cn('px-2 py-0.5 rounded text-xs font-medium', colors.bg, colors.text)}
                >
                  {ap.part.name}
                </span>
              );
            })}
            {selectedAdvancedParts.length > 5 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-surface-alt text-text-secondary">
                +{selectedAdvancedParts.length - 5} more
              </span>
            )}
          </div>
        )}
      </button>

      {expanded && (
        <div className="p-6 space-y-6">
          {selectedAdvancedParts.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-text-secondary mb-3">Added Advanced Mechanics</h4>
              <div className="flex flex-wrap gap-2">
                {selectedAdvancedParts.map((ap, idx) => (
                  <AddedAdvancedChip
                    key={idx}
                    advPart={ap}
                    _index={idx}
                    onRemove={() => onRemove(idx)}
                    onUpdate={(updates) => onUpdate(idx, updates)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {ADVANCED_CATEGORIES.map((category) => {
              const parts = getPartsForCategory(category);
              if (parts.length === 0) return null;
              return (
                <div key={category}>
                  <h4 className="text-sm font-bold text-text-secondary mb-2">{category}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {parts.map((part) => (
                      <AdvancedChip
                        key={part.id}
                        part={part}
                        onAdd={() => onAdd(part)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
