/**
 * Power Creator — damage section (TASK-616)
 */

'use client';

import { Plus, Trash2 } from 'lucide-react';
import { ValueStepper, SectionCostBadge } from '@/components/shared';
import { CollapsibleSection } from '@/components/creator';
import { Button, Checkbox } from '@/components/ui';
import { POWER_DAMAGE_TYPES as DAMAGE_TYPES, DIE_SIZES } from '@/lib/game/creator-constants';
import type { DamageConfig } from './power-creator-types';
import type { PowerSectionCosts } from './power-creator-cost-derivation';
import { PowerCreatorHelp } from './power-creator-help';

type PowerCreatorEditorPowerDamageProps = {
  damages: DamageConfig[];
  onDamagesChange: (updater: (prev: DamageConfig[]) => DamageConfig[]) => void;
  damageSummary: string;
  sectionCosts: PowerSectionCosts;
};

export function PowerCreatorEditorPowerDamage({
  damages,
  onDamagesChange,
  damageSummary,
  sectionCosts,
}: PowerCreatorEditorPowerDamageProps) {
  return (
    <CollapsibleSection
      title="Damage"
      collapsedSummary={damageSummary}
      titleAddon={<PowerCreatorHelp topic="damage" />}
      rightSlot={<SectionCostBadge en={sectionCosts.damage.energyRaw} tp={sectionCosts.damage.totalTP} />}
    >
      {damages.map((d, index) => (
        <div
          key={index}
          className="flex flex-wrap items-center gap-4 mb-4 p-3 rounded-lg bg-surface-alt border border-border-light"
        >
          {d.type !== 'none' && d.amount > 0 && (
            <Checkbox
              checked={d.applyDuration ?? false}
              onChange={(e) =>
                onDamagesChange((prev) =>
                  prev.map((x, i) => (i === index ? { ...x, applyDuration: e.target.checked } : x)),
                )
              }
              label="Apply duration"
            />
          )}
          <ValueStepper
            value={d.amount}
            onChange={(v) => onDamagesChange((prev) => prev.map((x, i) => (i === index ? { ...x, amount: v } : x)))}
            label="Dice:"
            min={0}
            max={20}
          />
          <div className="flex items-center gap-1">
            <span className="font-bold text-lg">d</span>
            <select
              aria-label={`Damage die size, row ${index + 1}`}
              value={d.size}
              onChange={(e) =>
                onDamagesChange((prev) =>
                  prev.map((x, i) => (i === index ? { ...x, size: parseInt(e.target.value) } : x)),
                )
              }
              className="px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
            >
              {DIE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <select
            aria-label={`Damage type, row ${index + 1}`}
            value={d.type}
            onChange={(e) =>
              onDamagesChange((prev) => prev.map((x, i) => (i === index ? { ...x, type: e.target.value } : x)))
            }
            className="px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
          >
            {DAMAGE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === 'none' ? 'No damage' : type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          {damages.length > 1 && (
            <button
              type="button"
              onClick={() => onDamagesChange((prev) => prev.filter((_, i) => i !== index))}
              className="p-2 rounded-lg text-danger-fg hover:bg-danger-100 dark:hover:bg-danger-900/30 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={`Remove damage type row ${index + 1}`}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() =>
          onDamagesChange((prev) => [...prev, { amount: 0, size: 6, type: 'none', applyDuration: false }])
        }
        className="mt-2 min-h-[44px]"
      >
        <Plus className="w-4 h-4 mr-1 inline" aria-hidden />
        Add damage type
      </Button>
      {damages.some((d) => d.type !== 'none' && d.amount > 0) && (
        <p className="mt-2 text-sm text-text-secondary">
          {damages
            .filter((d) => d.type !== 'none' && d.amount > 0)
            .map((d) => `${d.amount}d${d.size} ${d.type}`)
            .join(', ')}
        </p>
      )}
    </CollapsibleSection>
  );
}
