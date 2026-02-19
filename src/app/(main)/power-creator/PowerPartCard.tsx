/**
 * Power Part Card - Expandable part selector with option levels
 */

'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { formatCost } from '@/lib/game/creator-constants';
import { IconButton, Checkbox } from '@/components/ui';
import { ValueStepper } from '@/components/shared';
import type { PowerPart } from '@/hooks';
import type { SelectedPart } from './power-creator-types';

interface PowerPartCardProps {
  selectedPart: SelectedPart;
  _index: number;
  onRemove: () => void;
  onUpdate: (updates: Partial<SelectedPart>) => void;
  allParts: PowerPart[];
}

export function PowerPartCard({
  selectedPart,
  onRemove,
  onUpdate,
  allParts,
}: PowerPartCardProps) {
  const [expanded, setExpanded] = useState(true);
  const { part } = selectedPart;

  const categories = useMemo(() => {
    const cats = new Set(allParts.map((p) => p.category));
    return ['any', ...Array.from(cats).sort()];
  }, [allParts]);

  const filteredParts = useMemo(() => {
    const cat = selectedPart.selectedCategory;
    if (!cat || cat === 'any') return allParts.sort((a, b) => a.name.localeCompare(b.name));
    return allParts.filter((p) => p.category === cat).sort((a, b) => a.name.localeCompare(b.name));
  }, [allParts, selectedPart.selectedCategory]);

  const hasOption = (n: 1 | 2 | 3) => {
    const desc = part[`op_${n}_desc` as keyof PowerPart] as string | undefined;
    const en = part[`op_${n}_en` as keyof PowerPart] as number | undefined;
    const tp = part[`op_${n}_tp` as keyof PowerPart] as number | undefined;
    return (desc && desc.trim() !== '') || (en !== undefined && en !== 0) || (tp !== undefined && tp !== 0);
  };

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

  return (
    <div className="bg-surface rounded-lg border border-border-light shadow-sm overflow-hidden">
      <div className="bg-surface-alt px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left hover:bg-surface-alt/80 -ml-2 pl-2 py-1 rounded transition-colors"
        >
          <span className="text-text-muted">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
          <span className="font-medium text-text-primary truncate">{part.name}</span>
          <span className="flex items-center gap-2 text-sm font-semibold flex-shrink-0">
            <span className="text-energy">EN: {formatCost(partEnergy)}</span>
            <span className="text-tp">TP: {formatCost(partTP)}</span>
          </span>
        </button>
        <IconButton onClick={onRemove} label="Remove part" variant="danger" size="sm">
          <X className="w-5 h-5" />
        </IconButton>
      </div>

      {expanded && (
        <div className="px-4 py-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
              <select
                value={selectedPart.selectedCategory}
                onChange={(e) => {
                  const newCategory = e.target.value;
                  const partsInCategory = newCategory === 'any'
                    ? allParts.sort((a, b) => a.name.localeCompare(b.name))
                    : allParts.filter((p) => p.category === newCategory).sort((a, b) => a.name.localeCompare(b.name));
                  const firstPart = partsInCategory[0];
                  if (firstPart) {
                    onUpdate({
                      selectedCategory: newCategory,
                      part: firstPart,
                      op_1_lvl: 0,
                      op_2_lvl: 0,
                      op_3_lvl: 0,
                      applyDuration: false,
                    });
                  } else {
                    onUpdate({ selectedCategory: newCategory });
                  }
                }}
                className="w-full px-3 py-2 border border-border-light rounded-lg text-sm text-text-primary bg-surface"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'any' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Part</label>
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
                className="w-full px-3 py-2 border border-border-light rounded-lg text-sm text-text-primary bg-surface"
              >
                {filteredParts.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-base text-text-primary leading-relaxed">{part.description}</p>

          <div className="flex gap-4 text-sm">
            <span className="text-text-secondary">
              Base Energy: <strong className="text-energy">{formatCost(part.base_en || 0)}</strong>
            </span>
            <span className="text-text-secondary">
              Base TP: <strong className="text-tp">{formatCost(part.base_tp || 0)}</strong>
            </span>
          </div>

          {(hasOption(1) || hasOption(2) || hasOption(3)) && (
            <div className="space-y-3 pt-2 border-t border-border-light">
              {hasOption(1) && (
                <div className="bg-energy-light border border-energy-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-energy-text">Option 1</span>
                      <span className="text-sm font-medium text-energy">
                        EN {(part.op_1_en || 0) >= 0 ? '+' : ''}{formatCost(part.op_1_en || 0)}
                      </span>
                      <span className="text-sm font-medium text-tp">
                        TP {(part.op_1_tp || 0) >= 0 ? '+' : ''}{formatCost(part.op_1_tp || 0)}
                      </span>
                    </div>
                    <ValueStepper
                      value={selectedPart.op_1_lvl}
                      onChange={(v) => onUpdate({ op_1_lvl: v })}
                      label="Level:"
                    />
                  </div>
                  {part.op_1_desc && (
                    <p className="text-sm text-text-primary">{part.op_1_desc}</p>
                  )}
                </div>
              )}

              {hasOption(2) && (
                <div className="bg-energy-light border border-energy-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-energy-text">Option 2</span>
                      <span className="text-sm font-medium text-energy">
                        EN {(part.op_2_en || 0) >= 0 ? '+' : ''}{formatCost(part.op_2_en || 0)}
                      </span>
                      <span className="text-sm font-medium text-tp">
                        TP {(part.op_2_tp || 0) >= 0 ? '+' : ''}{formatCost(part.op_2_tp || 0)}
                      </span>
                    </div>
                    <ValueStepper
                      value={selectedPart.op_2_lvl}
                      onChange={(v) => onUpdate({ op_2_lvl: v })}
                      label="Level:"
                    />
                  </div>
                  {part.op_2_desc && (
                    <p className="text-sm text-text-primary">{part.op_2_desc}</p>
                  )}
                </div>
              )}

              {hasOption(3) && (
                <div className="bg-energy-light border border-energy-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-energy-text">Option 3</span>
                      <span className="text-sm font-medium text-energy">
                        EN {(part.op_3_en || 0) >= 0 ? '+' : ''}{formatCost(part.op_3_en || 0)}
                      </span>
                      <span className="text-sm font-medium text-tp">
                        TP {(part.op_3_tp || 0) >= 0 ? '+' : ''}{formatCost(part.op_3_tp || 0)}
                      </span>
                    </div>
                    <ValueStepper
                      value={selectedPart.op_3_lvl}
                      onChange={(v) => onUpdate({ op_3_lvl: v })}
                      label="Level:"
                    />
                  </div>
                  {part.op_3_desc && (
                    <p className="text-sm text-text-primary">{part.op_3_desc}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <Checkbox
            checked={selectedPart.applyDuration}
            onChange={(e) => onUpdate({ applyDuration: e.target.checked })}
            label="Apply to Duration"
          />
        </div>
      )}
    </div>
  );
}
