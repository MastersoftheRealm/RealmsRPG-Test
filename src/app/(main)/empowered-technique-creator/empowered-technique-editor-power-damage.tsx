'use client';

import { Plus } from 'lucide-react';
import { ValueStepper, SectionCostBadge } from '@/components/shared';
import { CollapsibleSection } from '@/components/creator';
import { Button, Checkbox } from '@/components/ui';
import { DIE_SIZES, POWER_DAMAGE_TYPES } from '@/lib/game/creator-constants';
import type { EmpoweredTechniqueCreatorEditorProps } from './empowered-technique-editor-config';

export type EmpoweredTechniqueEditorPowerDamageProps = Pick<
  EmpoweredTechniqueCreatorEditorProps,
  'powerDamages' | 'onPowerDamagesChange' | 'powerDamageSummary' | 'sectionCosts'
>;

export function EmpoweredTechniqueEditorPowerDamage({
  powerDamages,
  onPowerDamagesChange,
  powerDamageSummary,
  sectionCosts,
}: EmpoweredTechniqueEditorPowerDamageProps) {
  return (
    <CollapsibleSection
      title="Power Damage (Add Damage)"
      collapsedSummary={powerDamageSummary}
      rightSlot={
        <SectionCostBadge
          en={sectionCosts.powerDamage.energyRaw}
          tp={sectionCosts.powerDamage.totalTP}
        />
      }
    >
      {powerDamages.map((damage, index) => (
        <div
          key={index}
          className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-border-light bg-surface-alt p-3"
        >
          {damage.type !== 'none' && damage.amount > 0 && (
            <Checkbox
              checked={damage.applyDuration ?? false}
              onChange={(event) =>
                onPowerDamagesChange((previous) =>
                  previous.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, applyDuration: event.target.checked } : row,
                  ),
                )
              }
              label="Apply duration"
            />
          )}
          <ValueStepper
            value={damage.amount}
            onChange={(value) =>
              onPowerDamagesChange((previous) =>
                previous.map((row, rowIndex) =>
                  rowIndex === index ? { ...row, amount: value } : row,
                ),
              )
            }
            label="Dice:"
            min={0}
            max={20}
          />
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold">d</span>
            <select
              value={damage.size}
              onChange={(event) =>
                onPowerDamagesChange((previous) =>
                  previous.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, size: Number(event.target.value) } : row,
                  ),
                )
              }
              className="min-h-[44px] rounded-lg border border-border-light bg-surface px-3 py-2 text-text-primary"
              aria-label={`Power damage die size row ${index + 1}`}
            >
              {DIE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <select
            value={damage.type}
            onChange={(event) =>
              onPowerDamagesChange((previous) =>
                previous.map((row, rowIndex) =>
                  rowIndex === index ? { ...row, type: event.target.value } : row,
                ),
              )
            }
            className="min-h-[44px] rounded-lg border border-border-light bg-surface px-3 py-2 text-text-primary"
            aria-label={`Power damage type row ${index + 1}`}
          >
            {POWER_DAMAGE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === 'none' ? 'No damage' : type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          {powerDamages.length > 1 && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="min-h-[44px]"
              onClick={() =>
                onPowerDamagesChange((previous) =>
                  previous.filter((_, rowIndex) => rowIndex !== index),
                )
              }
            >
              Remove
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() =>
          onPowerDamagesChange((previous) => [
            ...previous,
            { amount: 0, size: 6, type: 'none', applyDuration: false },
          ])
        }
        className="min-h-[44px]"
      >
        <Plus className="mr-1 inline h-4 w-4" aria-hidden />
        Add damage type
      </Button>
    </CollapsibleSection>
  );
}
