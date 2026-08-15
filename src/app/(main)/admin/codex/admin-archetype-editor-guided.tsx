'use client';

import { ValueStepper, ChipSelect } from '@/components/shared';
import type { Level1ArmorStep } from '@/lib/game/archetype-path';
import {
  ABILITY_OPTIONS,
  RECOMMENDED_ABILITY_MAX,
  labelForAbility,
} from './admin-archetype-path-form';
import { PathQuantityRow } from './admin-archetype-path-rows';
import type { AdminArchetypeEditorProps } from './admin-archetype-editor-config';

export type AdminArchetypeEditorGuidedProps = Pick<
  AdminArchetypeEditorProps,
  'form' | 'setForm' | 'equipmentOptions'
>;

export function AdminArchetypeEditorGuided({
  form,
  setForm,
  equipmentOptions,
}: AdminArchetypeEditorGuidedProps) {
  return (
    <div className="space-y-3 rounded-md border border-border-light p-3">
      <h4 className="text-sm font-medium text-text-primary">Guided creator (Simple)</h4>
      <p className="text-xs text-text-muted">
        Powers the guided character creator: recommended abilities and phased equipment picks.
      </p>
      <div>
        <label
          htmlFor="guided-armor-step"
          className="mb-1 block text-sm font-medium text-text-secondary"
        >
          Armor step (guided loadout)
        </label>
        <select
          id="guided-armor-step"
          value={form.guidedArmorStep}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              guidedArmorStep: e.target.value as Level1ArmorStep | '',
            }))
          }
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
          aria-describedby="guided-armor-step-desc"
        >
          <option value="">Default (power → none; martial → required)</option>
          <option value="required">Required: armor phase mandatory</option>
          <option value="optional">Optional: player may skip armor</option>
          <option value="none">None: skip armor phase</option>
        </select>
        <p id="guided-armor-step-desc" className="mt-1 text-xs text-text-muted">
          Controls whether the guided loadout step includes an armor sub-phase.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">
          Recommended adventuring gear
        </label>
        <ChipSelect
          label="Add recommended gear item"
          placeholder="Select recommended equipment"
          options={equipmentOptions}
          selectedValues={[]}
          onSelect={(value) =>
            setForm((prev) => ({
              ...prev,
              guidedSharedEquipmentEntries: [
                ...prev.guidedSharedEquipmentEntries,
                { id: value, quantity: 1 },
              ],
            }))
          }
        />
        <div className="mt-1 space-y-2">
          {form.guidedSharedEquipmentEntries.map((entry, idx) => {
            const label = equipmentOptions.find((o) => o.value === entry.id)?.label ?? entry.id;
            return (
              <PathQuantityRow
                key={`${entry.id}-${idx}`}
                label={label}
                quantity={entry.quantity}
                onQuantityChange={(q) =>
                  setForm((prev) => ({
                    ...prev,
                    guidedSharedEquipmentEntries: prev.guidedSharedEquipmentEntries.map(
                      (item, i) => (i === idx ? { ...item, quantity: q } : item),
                    ),
                  }))
                }
                onRemove={() =>
                  setForm((prev) => ({
                    ...prev,
                    guidedSharedEquipmentEntries: prev.guidedSharedEquipmentEntries.filter(
                      (_, i) => i !== idx,
                    ),
                  }))
                }
                removeLabel={`Remove recommended gear ${label}`}
              />
            );
          })}
        </div>
      </div>
      <div
        role="group"
        aria-labelledby="guided-recommended-abilities-label"
        aria-describedby="guided-recommended-abilities-desc"
      >
        <span
          id="guided-recommended-abilities-label"
          className="mb-1 block text-sm font-medium text-text-secondary"
        >
          Recommended abilities
        </span>
        <p id="guided-recommended-abilities-desc" className="mb-2 text-xs text-text-muted">
          Suggested level 1 ability spread applied in one click during guided creation. Leave all at
          0 to skip the recommendation.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ABILITY_OPTIONS.map((ability) => {
            const value = form.guidedRecommendedAbilities[ability] ?? 0;
            const abilityLabel = labelForAbility(ability);
            return (
              <div
                key={`rec-ability-${ability}`}
                className="flex items-center justify-between gap-2 rounded-md border border-border-light bg-surface px-3 py-2"
              >
                <span className="text-sm font-medium text-text-primary">{abilityLabel}</span>
                <ValueStepper
                  value={value}
                  min={0}
                  max={RECOMMENDED_ABILITY_MAX}
                  formatValue={(v) => `+${v}`}
                  decrementTitle={`Decrease recommended ${abilityLabel}`}
                  incrementTitle={`Increase recommended ${abilityLabel}`}
                  onChange={(next) =>
                    setForm((f) => ({
                      ...f,
                      guidedRecommendedAbilities: {
                        ...f.guidedRecommendedAbilities,
                        [ability]: next,
                      },
                    }))
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
