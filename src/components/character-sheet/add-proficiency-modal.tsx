/**
 * Add Proficiency Modal
 * ======================
 * Add a single codex part or item property as a proficiency (edit mode).
 * Supports: Power Part, Technique Part, Weapon/Shield Property, Armor Property.
 * Thin UnifiedSelectionModal wrapper — list shell matches other add-X modals (TASK-567).
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  UnifiedSelectionModal,
  type SelectableItem,
  type ColumnHeader,
} from '@/components/shared/unified-selection-modal';
import { calculateProficiencyTP, generateProficiencyId } from '@/lib/proficiencies';
import type { CharacterProficiency } from '@/types';

// Part-like: power or technique part from codex
interface PartLike {
  id: string | number;
  name?: string;
  base_tp?: number;
  op_1_tp?: number;
  op_2_tp?: number;
  op_3_tp?: number;
  op_1_desc?: string;
  op_2_desc?: string;
  op_3_desc?: string;
  mechanic?: boolean;
}

// Property-like: item property from codex
interface PropertyLike {
  id: string | number;
  name?: string;
  type?: string;
  base_tp?: number;
  op_1_tp?: number;
  op_1_desc?: string;
  mechanic?: boolean;
}

export type AddProficiencyVariant =
  | 'power_part'
  | 'technique_part'
  | 'weapon_shield_property'
  | 'armor_property';

interface AddProficiencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: AddProficiencyVariant;
  /** For power_part / technique_part */
  parts?: PartLike[];
  /** For weapon_shield_property / armor_property (pre-filtered by type) */
  properties?: PropertyLike[];
  onAdd: (prof: CharacterProficiency) => void;
}

const VARIANT_TITLES: Record<AddProficiencyVariant, string> = {
  power_part: 'Add Power Part Proficiency',
  technique_part: 'Add Technique Part Proficiency',
  weapon_shield_property: 'Add Weapon / Shield Property Proficiency',
  armor_property: 'Add Armor Property Proficiency',
};

const PART_COLUMNS: ColumnHeader[] = [
  { key: 'name', label: 'Name', align: 'left' },
  { key: 'base_tp', label: 'Base TP', align: 'center' },
  { key: 'op_1_tp', label: 'Op1 TP', align: 'center' },
  { key: 'op_2_tp', label: 'Op2 TP', align: 'center' },
  { key: 'op_3_tp', label: 'Op3 TP', align: 'center' },
];

const PROPERTY_COLUMNS: ColumnHeader[] = [
  { key: 'name', label: 'Name', align: 'left' },
  { key: 'base_tp', label: 'Base TP', align: 'center' },
  { key: 'op_1_tp', label: 'Op TP', align: 'center' },
];

function partToProf(
  part: PartLike,
  kind: 'power_part' | 'technique_part',
  op1: number,
  op2: number,
  op3: number
): CharacterProficiency {
  const baseTP = part.base_tp ?? 0;
  const op1TP = part.op_1_tp ?? 0;
  const op2TP = part.op_2_tp ?? 0;
  const op3TP = part.op_3_tp ?? 0;
  return {
    id: generateProficiencyId(),
    kind,
    refId: String(part.id),
    name: part.name ?? 'Unnamed',
    baseTP,
    op1TP,
    op2TP,
    op3TP,
    op1Level: op1,
    op2Level: op2,
    op3Level: op3,
  };
}

function propertyToProf(prop: PropertyLike, op1: number): CharacterProficiency {
  const baseTP = prop.base_tp ?? 0;
  const op1TP = prop.op_1_tp ?? 0;
  return {
    id: generateProficiencyId(),
    kind: 'item_property',
    refId: String(prop.id),
    name: prop.name ?? 'Unnamed',
    baseTP,
    op1TP,
    op2TP: 0,
    op3TP: 0,
    op1Level: op1,
    op2Level: 0,
    op3Level: 0,
  };
}

function partToSelectable(part: PartLike): SelectableItem {
  return {
    id: String(part.id),
    name: part.name ?? 'Unnamed',
    columns: [
      { key: 'base_tp', value: part.base_tp ?? 0, align: 'center' },
      { key: 'op_1_tp', value: part.op_1_tp ?? 0, align: 'center' },
      { key: 'op_2_tp', value: part.op_2_tp ?? 0, align: 'center' },
      { key: 'op_3_tp', value: part.op_3_tp ?? 0, align: 'center' },
    ],
    data: part,
  };
}

function propertyToSelectable(prop: PropertyLike): SelectableItem {
  return {
    id: String(prop.id),
    name: prop.name ?? 'Unnamed',
    columns: [
      { key: 'base_tp', value: prop.base_tp ?? 0, align: 'center' },
      { key: 'op_1_tp', value: prop.op_1_tp ?? 0, align: 'center' },
    ],
    data: prop,
  };
}

export function AddProficiencyModal({
  isOpen,
  onClose,
  variant,
  parts = [],
  properties = [],
  onAdd,
}: AddProficiencyModalProps) {
  const isPart = variant === 'power_part' || variant === 'technique_part';

  const items = useMemo((): SelectableItem[] => {
    if (isPart) {
      return parts.filter((p) => !p.mechanic).map(partToSelectable);
    }
    return properties.filter((p) => !p.mechanic).map(propertyToSelectable);
  }, [isPart, parts, properties]);

  const [op1Level, setOp1Level] = useState(0);
  const [op2Level, setOp2Level] = useState(0);
  const [op3Level, setOp3Level] = useState(0);

  // Option levels seed empty; parent remounts via key={variant} while open.

  const buildProf = useCallback(
    (item: SelectableItem): CharacterProficiency | null => {
      if (isPart) {
        const part = item.data as PartLike;
        const kind = variant === 'power_part' ? 'power_part' : 'technique_part';
        return partToProf(part, kind, op1Level, op2Level, op3Level);
      }
      return propertyToProf(item.data as PropertyLike, op1Level);
    },
    [isPart, variant, op1Level, op2Level, op3Level]
  );

  const handleConfirm = useCallback(
    (selectedItems: SelectableItem[]) => {
      const item = selectedItems[0];
      if (!item) return;
      const prof = buildProf(item);
      if (!prof || calculateProficiencyTP(prof) <= 0) return;
      onAdd(prof);
      // UnifiedSelectionModal closes after onConfirm — do not double-call onClose.
    },
    [buildProf, onAdd]
  );

  const confirmDisabled = useCallback(
    (selectedItems: SelectableItem[]) => {
      const item = selectedItems[0];
      if (!item) return true;
      const prof = buildProf(item);
      return !prof || calculateProficiencyTP(prof) <= 0;
    },
    [buildProf]
  );

  const footerExtra = useCallback(
    (selectedItems: SelectableItem[]) => {
      const item = selectedItems[0];
      if (!item) return null;

      if (isPart) {
        const selectedPart = item.data as PartLike;
        return (
          <div className="space-y-3 rounded-lg border border-border-light bg-surface-alt p-3">
            <h3 className="text-sm font-medium text-text-primary">Option levels</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((n) => {
                const desc = selectedPart[`op_${n}_desc` as keyof PartLike] as string | undefined;
                const tp = selectedPart[`op_${n}_tp` as keyof PartLike] as number | undefined;
                const lvl = n === 1 ? op1Level : n === 2 ? op2Level : op3Level;
                const setLvl = n === 1 ? setOp1Level : n === 2 ? setOp2Level : setOp3Level;
                if (tp === undefined || tp === 0) return null;
                const inputId = `add-prof-op${n}-level`;
                return (
                  <div key={n} className="space-y-1">
                    <label htmlFor={inputId} className="text-xs text-text-secondary">
                      Option {n}{' '}
                      {desc
                        ? `: ${desc.slice(0, 40)}${desc.length > 40 ? '…' : ''}`
                        : `(+${tp} TP/lvl)`}
                    </label>
                    <input
                      id={inputId}
                      type="number"
                      min={0}
                      value={lvl}
                      onChange={(e) =>
                        setLvl(Math.max(0, Math.floor(Number(e.target.value) || 0)))
                      }
                      className="min-h-11 w-full rounded border border-border bg-surface px-2 py-1.5 text-sm text-text-primary"
                      aria-label={`Option ${n} level`}
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-text-muted dark:text-text-secondary">
              Total TP for this proficiency:{' '}
              {calculateProficiencyTP(
                partToProf(
                  selectedPart,
                  variant as 'power_part' | 'technique_part',
                  op1Level,
                  op2Level,
                  op3Level
                )
              )}
            </p>
          </div>
        );
      }

      const selectedProperty = item.data as PropertyLike;
      if ((selectedProperty.op_1_tp ?? 0) <= 0) {
        return (
          <p className="text-xs text-text-muted dark:text-text-secondary">
            Total TP for this proficiency:{' '}
            {calculateProficiencyTP(propertyToProf(selectedProperty, op1Level))}
          </p>
        );
      }

      return (
        <div className="space-y-3 rounded-lg border border-border-light bg-surface-alt p-3">
          <h3 className="text-sm font-medium text-text-primary">Option levels</h3>
          <div className="space-y-1">
            <label htmlFor="add-prof-prop-op1-level" className="text-xs text-text-secondary">
              Option level{' '}
              {selectedProperty.op_1_desc
                ? `: ${selectedProperty.op_1_desc}`
                : `(+${selectedProperty.op_1_tp} TP/lvl)`}
            </label>
            <input
              id="add-prof-prop-op1-level"
              type="number"
              min={0}
              value={op1Level}
              onChange={(e) =>
                setOp1Level(Math.max(0, Math.floor(Number(e.target.value) || 0)))
              }
              className="min-h-11 w-full max-w-[120px] rounded border border-border bg-surface px-2 py-1.5 text-sm text-text-primary"
              aria-label="Option level"
            />
          </div>
          <p className="text-xs text-text-muted dark:text-text-secondary">
            Total TP for this proficiency:{' '}
            {calculateProficiencyTP(propertyToProf(selectedProperty, op1Level))}
          </p>
        </div>
      );
    },
    [isPart, variant, op1Level, op2Level, op3Level]
  );

  return (
    <UnifiedSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      title={VARIANT_TITLES[variant]}
      description="Select a part or property, set option levels, then add. Overspend is allowed."
      items={items}
      onConfirm={handleConfirm}
      maxSelections={1}
      columns={isPart ? PART_COLUMNS : PROPERTY_COLUMNS}
      gridColumns={isPart ? '1fr 0.5fr 0.5fr 0.5fr 0.5fr' : '1fr 0.5fr 0.5fr'}
      itemLabel="proficiency"
      emptyMessage="No parts or properties found."
      emptySubMessage={
        items.length === 0
          ? 'Codex may be empty for this type.'
          : 'Try a different search.'
      }
      searchPlaceholder="Search by name..."
      searchFields={['name']}
      footerExtra={footerExtra}
      confirmDisabled={confirmDisabled}
      confirmLabel="Add Proficiency"
      size="lg"
    />
  );
}
