/**
 * Power Creator — damage section (TASK-616)
 */

'use client';

import { Plus, Trash2 } from 'lucide-react';
import { ValueStepper, SectionCostBadge } from '@/components/patterns';
import { CollapsibleSection } from '@/components/creator';
import { Button, Checkbox, IconButton } from '@/components/ui';
import { POWER_DAMAGE_TYPES as DAMAGE_TYPES, DIE_SIZES } from '@/lib/game/creator-constants';
import { formatDamageTypeCanTargetHint } from '@/lib/game/targeted-defenses';
import type { DamageConfig } from './power-creator-types';
import type { PowerSectionCosts } from './power-creator-cost-derivation';
import { PowerCreatorHelp } from './power-creator-help';
import type { PowerPart } from '@/hooks';

type PowerCreatorEditorPowerDamageProps = {
  damages: DamageConfig[];
  onDamagesChange: (updater: (prev: DamageConfig[]) => DamageConfig[]) => void;
  damageSummary: string;
  sectionCosts: PowerSectionCosts;
  partsDb: PowerPart[];
};

export function PowerCreatorEditorPowerDamage({
  damages,
  onDamagesChange,
  damageSummary,
  sectionCosts,
  partsDb,
}: PowerCreatorEditorPowerDamageProps) {
  return (
    <CollapsibleSection
      title="Damage"
      collapsedSummary={damageSummary}
      titleAddon={<PowerCreatorHelp topic="damage" />}
      rightSlot={
        <SectionCostBadge en={sectionCosts.damage.energyRaw} tp={sectionCosts.damage.totalTP} />
      }
    >
      {damages.map((d, index) => {
        const canTargetHint = formatDamageTypeCanTargetHint(d.type, partsDb);
        return (
          <div
            key={index}
            className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-border-light bg-surface-alt p-3"
          >
            {d.type !== 'none' && d.amount > 0 && (
              <Checkbox
                checked={d.applyDuration ?? false}
                onChange={(e) =>
                  onDamagesChange((prev) =>
                    prev.map((x, i) =>
                      i === index ? { ...x, applyDuration: e.target.checked } : x,
                    ),
                  )
                }
                label="Apply duration"
              />
            )}
            <ValueStepper
              value={d.amount}
              onChange={(v) =>
                onDamagesChange((prev) =>
                  prev.map((x, i) => (i === index ? { ...x, amount: v } : x)),
                )
              }
              label="Dice:"
              min={0}
              max={20}
            />
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold">d</span>
              <select
                aria-label={`Damage die size, row ${index + 1}`}
                value={d.size}
                onChange={(e) =>
                  onDamagesChange((prev) =>
                    prev.map((x, i) =>
                      i === index ? { ...x, size: parseInt(e.target.value) } : x,
                    ),
                  )
                }
                className="touch-tier-standard rounded-lg border border-border-light bg-surface px-3 py-2 text-text-primary"
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
                onDamagesChange((prev) =>
                  prev.map((x, i) => (i === index ? { ...x, type: e.target.value } : x)),
                )
              }
              className="touch-tier-standard rounded-lg border border-border-light bg-surface px-3 py-2 text-text-primary"
            >
              {DAMAGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === 'none' ? 'No damage' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            {canTargetHint ? (
              <span className="text-sm text-text-muted">{canTargetHint}</span>
            ) : null}
            {damages.length > 1 && (
              <IconButton
                variant="danger"
                size="sm"
                onClick={() => onDamagesChange((prev) => prev.filter((_, i) => i !== index))}
                label={`Remove damage type row ${index + 1}`}
              >
                <Trash2 className="h-5 w-5" />
              </IconButton>
            )}
          </div>
        );
      })}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() =>
          onDamagesChange((prev) => [
            ...prev,
            { amount: 0, size: 6, type: 'none', applyDuration: false },
          ])
        }
        className="mt-2"
      >
        <Plus className="mr-1 inline h-4 w-4" aria-hidden />
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
