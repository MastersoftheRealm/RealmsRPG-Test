/**
 * Power Part Card - Expandable part selector with option levels
 * Shared by Power Creator and Technique Creator.
 */

'use client';

import { useState, useMemo, useId } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { formatCost } from '@/lib/game/creator-constants';
import { partChipVariant } from '@/lib/chip/part-chip-variant';
import { IconButton, Checkbox, DescriptorChip } from '@/components/ui';
import { ValueStepper } from '@/components/patterns';
import type { PowerPart, TechniquePart } from '@/hooks';

type CreatorPart = PowerPart | TechniquePart;

interface SelectedPartLike {
  part: CreatorPart;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  applyDuration?: boolean | undefined;
  selectedCategory: string;
}

export interface PowerPartCardProps {
  selectedPart: SelectedPartLike;
  _index: number;
  onRemove: () => void;
  onUpdate: (updates: Partial<SelectedPartLike>) => void;
  allParts: CreatorPart[];
  showApplyDuration?: boolean | undefined;
}

export function PowerPartCard({
  selectedPart,
  onRemove,
  onUpdate,
  allParts,
  showApplyDuration = true,
}: PowerPartCardProps) {
  const categorySelectId = useId();
  const partSelectId = useId();
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
    const partWithOptions = part as CreatorPart & {
      op_1_desc?: string | undefined;
      op_1_en?: number | undefined;
      op_1_tp?: number | undefined;
      op_2_desc?: string | undefined;
      op_2_en?: number | undefined;
      op_2_tp?: number | undefined;
      op_3_desc?: string | undefined;
      op_3_en?: number | undefined;
      op_3_tp?: number | undefined;
    };
    const desc = partWithOptions[`op_${n}_desc`];
    const en = partWithOptions[`op_${n}_en`];
    const tp = partWithOptions[`op_${n}_tp`];
    return (
      (desc && desc.trim() !== '') ||
      (en !== undefined && en !== 0) ||
      (tp !== undefined && tp !== 0)
    );
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
    <div className="overflow-hidden rounded-lg border border-border-light bg-surface shadow-sm">
      <div className="flex items-center justify-between bg-surface-alt px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="-ml-2 flex min-w-0 flex-1 items-center gap-2 rounded py-1 pl-2 text-left transition-colors hover:bg-surface-alt/80"
        >
          <span className="shrink-0 text-text-muted">
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </span>
          {part.category && (
            <DescriptorChip
              variant={partChipVariant(part.category)}
              size="sm"
              className="max-w-[7.5rem] shrink-0 truncate font-normal"
              title={part.category}
            >
              {part.category}
            </DescriptorChip>
          )}
          <span className="min-w-0 truncate font-medium text-text-primary">{part.name}</span>
          <span className="flex flex-shrink-0 items-center gap-2 text-sm font-semibold">
            <span className="text-energy-text">EN: {formatCost(partEnergy)}</span>
            <span className="text-tp-text">TP: {formatCost(partTP)}</span>
          </span>
        </button>
        <IconButton onClick={onRemove} label="Remove part" variant="danger" size="sm">
          <X className="h-5 w-5" />
        </IconButton>
      </div>

      {expanded && (
        <div className="space-y-4 px-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor={categorySelectId}
                className="mb-1 block text-sm font-medium text-text-secondary"
              >
                Category
              </label>
              <select
                id={categorySelectId}
                value={selectedPart.selectedCategory}
                onChange={(e) => {
                  const newCategory = e.target.value;
                  const partsInCategory =
                    newCategory === 'any'
                      ? allParts.sort((a, b) => a.name.localeCompare(b.name))
                      : allParts
                          .filter((p) => p.category === newCategory)
                          .sort((a, b) => a.name.localeCompare(b.name));
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
                className="touch-tier-standard w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-text-primary"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'any' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor={partSelectId}
                className="mb-1 block text-sm font-medium text-text-secondary"
              >
                Part
              </label>
              <select
                id={partSelectId}
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
                className="touch-tier-standard w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-text-primary"
              >
                {filteredParts.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-base leading-relaxed text-text-primary">{part.description}</p>

          <div className="flex gap-4 text-sm">
            <span className="text-text-secondary">
              Base Energy:{' '}
              <strong className="text-energy-text">{formatCost(part.base_en || 0)}</strong>
            </span>
            <span className="text-text-secondary">
              Base TP: <strong className="text-tp-text">{formatCost(part.base_tp || 0)}</strong>
            </span>
          </div>

          {(hasOption(1) || hasOption(2) || hasOption(3)) && (
            <div className="space-y-3 border-t border-border-light pt-2">
              {hasOption(1) && (
                <div className="rounded-lg border border-energy-border bg-energy-light p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-energy-text">Option 1</span>
                      <span className="text-sm font-medium text-energy-text">
                        EN {(part.op_1_en || 0) >= 0 ? '+' : ''}
                        {formatCost(part.op_1_en || 0)}
                      </span>
                      <span className="text-sm font-medium text-tp-text">
                        TP {(part.op_1_tp || 0) >= 0 ? '+' : ''}
                        {formatCost(part.op_1_tp || 0)}
                      </span>
                    </div>
                    <ValueStepper
                      value={selectedPart.op_1_lvl}
                      onChange={(v) => onUpdate({ op_1_lvl: v })}
                      label="Level:"
                      min={0}
                    />
                  </div>
                  {part.op_1_desc && <p className="text-sm text-text-primary">{part.op_1_desc}</p>}
                </div>
              )}

              {hasOption(2) && (
                <div className="rounded-lg border border-energy-border bg-energy-light p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-energy-text">Option 2</span>
                      <span className="text-sm font-medium text-energy-text">
                        EN {(part.op_2_en || 0) >= 0 ? '+' : ''}
                        {formatCost(part.op_2_en || 0)}
                      </span>
                      <span className="text-sm font-medium text-tp-text">
                        TP {(part.op_2_tp || 0) >= 0 ? '+' : ''}
                        {formatCost(part.op_2_tp || 0)}
                      </span>
                    </div>
                    <ValueStepper
                      value={selectedPart.op_2_lvl}
                      onChange={(v) => onUpdate({ op_2_lvl: v })}
                      label="Level:"
                      min={0}
                    />
                  </div>
                  {part.op_2_desc && <p className="text-sm text-text-primary">{part.op_2_desc}</p>}
                </div>
              )}

              {hasOption(3) && (
                <div className="rounded-lg border border-energy-border bg-energy-light p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-energy-text">Option 3</span>
                      <span className="text-sm font-medium text-energy-text">
                        EN {(part.op_3_en || 0) >= 0 ? '+' : ''}
                        {formatCost(part.op_3_en || 0)}
                      </span>
                      <span className="text-sm font-medium text-tp-text">
                        TP {(part.op_3_tp || 0) >= 0 ? '+' : ''}
                        {formatCost(part.op_3_tp || 0)}
                      </span>
                    </div>
                    <ValueStepper
                      value={selectedPart.op_3_lvl}
                      onChange={(v) => onUpdate({ op_3_lvl: v })}
                      label="Level:"
                      min={0}
                    />
                  </div>
                  {part.op_3_desc && <p className="text-sm text-text-primary">{part.op_3_desc}</p>}
                </div>
              )}
            </div>
          )}

          {showApplyDuration && (
            <Checkbox
              checked={selectedPart.applyDuration ?? false}
              onChange={(e) => onUpdate({ applyDuration: e.target.checked })}
              label="Apply to Duration"
            />
          )}
        </div>
      )}
    </div>
  );
}
