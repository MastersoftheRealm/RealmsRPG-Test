/**
 * Add Proficiency Modal
 * ======================
 * Add a single codex part or item property as a proficiency (edit mode).
 * Supports: Power Part, Technique Part, Weapon/Shield Property, Armor Property.
 * User selects an item, sets option levels, then adds (overspend allowed).
 */

'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { Modal, Button, SearchInput } from '@/components/ui';
import { GridListRow, ListHeader, ListEmptyState } from '@/components/shared';
import { useModalListState } from '@/hooks/use-modal-list-state';
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

export function AddProficiencyModal({
  isOpen,
  onClose,
  variant,
  parts = [],
  properties = [],
  onAdd,
}: AddProficiencyModalProps) {
  const isPart = variant === 'power_part' || variant === 'technique_part';
  const rawItems = isPart
    ? parts.filter((p) => !p.mechanic)
    : properties.filter((p) => !p.mechanic);

  const { search, setSearch, sortedItems, sortState, handleSort } = useModalListState({
    items: rawItems,
    searchFields: ['name'],
    initialSortKey: 'name',
    getSearchableString: (item) => (item as PartLike | PropertyLike).name ?? '',
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [op1Level, setOp1Level] = useState(0);
  const [op2Level, setOp2Level] = useState(0);
  const [op3Level, setOp3Level] = useState(0);

  const selectedPart = useMemo(() => {
    if (!selectedId || !isPart) return null;
    return rawItems.find((p) => String((p as PartLike).id) === selectedId) as PartLike | undefined;
  }, [selectedId, isPart, rawItems]);

  const selectedProperty = useMemo(() => {
    if (!selectedId || isPart) return null;
    return rawItems.find((p) => String((p as PropertyLike).id) === selectedId) as PropertyLike | undefined;
  }, [selectedId, isPart, rawItems]);

  const resetSelection = useCallback(() => {
    setSelectedId(null);
    setOp1Level(0);
    setOp2Level(0);
    setOp3Level(0);
  }, []);

  useEffect(() => {
    if (!isOpen) resetSelection();
  }, [isOpen, resetSelection]);

  const handleAdd = () => {
    if (isPart && selectedPart) {
      const kind = variant === 'power_part' ? 'power_part' : 'technique_part';
      const prof = partToProf(selectedPart, kind, op1Level, op2Level, op3Level);
      if (calculateProficiencyTP(prof) <= 0) return;
      onAdd(prof);
      onClose();
      return;
    }
    if (!isPart && selectedProperty) {
      const prof = propertyToProf(selectedProperty, op1Level);
      if (calculateProficiencyTP(prof) <= 0) return;
      onAdd(prof);
      onClose();
    }
  };

  const canAdd = isPart
    ? Boolean(selectedPart) && calculateProficiencyTP(
        partToProf(selectedPart!, variant as 'power_part' | 'technique_part', op1Level, op2Level, op3Level)
      ) > 0
    : Boolean(selectedProperty) && calculateProficiencyTP(propertyToProf(selectedProperty!, op1Level)) > 0;

  const gridColumns = isPart ? '1fr 0.5fr 0.5fr 0.5fr 0.5fr' : '1fr 0.5fr 0.5fr';
  const listHeaderColumns = isPart
    ? [
        { key: 'name', label: 'Name', sortable: true, align: 'left' as const },
        { key: 'base_tp', label: 'Base TP', sortable: true, align: 'center' as const },
        { key: 'op_1_tp', label: 'Op1 TP', sortable: true, align: 'center' as const },
        { key: 'op_2_tp', label: 'Op2 TP', sortable: true, align: 'center' as const },
        { key: 'op_3_tp', label: 'Op3 TP', sortable: true, align: 'center' as const },
      ]
    : [
        { key: 'name', label: 'Name', sortable: true, align: 'left' as const },
        { key: 'base_tp', label: 'Base TP', sortable: true, align: 'center' as const },
        { key: 'op_1_tp', label: 'Op TP', sortable: true, align: 'center' as const },
      ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={VARIANT_TITLES[variant]}
      description="Select a part or property, set option levels, then add. Overspend is allowed."
      size="lg"
      fullScreenOnMobile
      flexLayout
      contentClassName="flex flex-col min-h-0"
      footer={
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="text-sm text-text-muted">
            {selectedId
              ? (isPart && selectedPart
                  ? `Selected: ${selectedPart.name} — set option levels below`
                  : !isPart && selectedProperty
                    ? `Selected: ${selectedProperty.name} — set option level below`
                    : null)
              : 'Select an item from the list'}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAdd} disabled={!canAdd}>
              Add Proficiency
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3 min-h-0 flex-1 overflow-hidden">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name..."
          aria-label="Search parts or properties"
        />
        {listHeaderColumns.length > 0 && (
          <ListHeader
            columns={listHeaderColumns}
            sortState={sortState}
            onSort={handleSort}
            gridColumns={gridColumns}
            hasSelectionColumn
            compact
            className="border-0 rounded-none bg-transparent dark:bg-transparent"
          />
        )}
        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
          {sortedItems.length === 0 ? (
            <ListEmptyState
              title="No parts or properties found."
              description={rawItems.length === 0 ? 'Codex may be empty for this type.' : 'Try a different search.'}
              size="sm"
            />
          ) : (
            <div className="space-y-2 min-w-0">
              {sortedItems.map((item) => {
                const id = String((item as PartLike | PropertyLike).id);
                const isSelected = selectedId === id;
                const raw = item as PartLike | PropertyLike;
                const baseTp = raw.base_tp ?? 0;
                const op1Tp = raw.op_1_tp ?? 0;
                const op2Tp = (raw as PartLike).op_2_tp ?? 0;
                const op3Tp = (raw as PartLike).op_3_tp ?? 0;
                const rowColumns = isPart
                  ? [
                      { key: 'base_tp', value: baseTp, align: 'center' as const },
                      { key: 'op_1_tp', value: op1Tp, align: 'center' as const },
                      { key: 'op_2_tp', value: op2Tp, align: 'center' as const },
                      { key: 'op_3_tp', value: op3Tp, align: 'center' as const },
                    ]
                  : [
                      { key: 'base_tp', value: baseTp, align: 'center' as const },
                      { key: 'op_1_tp', value: op1Tp, align: 'center' as const },
                    ];
                return (
                  <div key={id} className="flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <GridListRow
                        id={id}
                        name={raw.name ?? ''}
                        columns={rowColumns}
                        gridColumns={gridColumns}
                        isSelected={isSelected}
                        onSelect={() => setSelectedId(isSelected ? null : id)}
                        selectable
                        compact
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Option level inputs when something is selected */}
        {(selectedPart || selectedProperty) && (
          <div className="border-t border-border pt-3 space-y-3 bg-surface/50 rounded-lg p-3">
            <h3 className="text-sm font-medium text-text-primary">Option levels</h3>
            {isPart && selectedPart && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((n) => {
                  const desc = selectedPart[`op_${n}_desc` as keyof PartLike] as string | undefined;
                  const tp = selectedPart[`op_${n}_tp` as keyof PartLike] as number | undefined;
                  const lvl = n === 1 ? op1Level : n === 2 ? op2Level : op3Level;
                  const setLvl = n === 1 ? setOp1Level : n === 2 ? setOp2Level : setOp3Level;
                  if (tp === undefined || tp === 0) return null;
                  return (
                    <div key={n} className="space-y-1">
                      <label htmlFor={`op${n}-level`} className="text-xs text-text-secondary">
                        Option {n} {desc ? `— ${desc.slice(0, 40)}${desc.length > 40 ? '…' : ''}` : `(+${tp} TP/lvl)`}
                      </label>
                      <input
                        id={`op${n}-level`}
                        type="number"
                        min={0}
                        value={lvl}
                        onChange={(e) => setLvl(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                        className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm"
                        aria-label={`Option ${n} level`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            {!isPart && selectedProperty && (selectedProperty.op_1_tp ?? 0) > 0 && (
              <div className="space-y-1">
                <label htmlFor="prop-op1-level" className="text-xs text-text-secondary">
                  Option level {selectedProperty.op_1_desc ? `— ${selectedProperty.op_1_desc}` : `(+${selectedProperty.op_1_tp} TP/lvl)`}
                </label>
                <input
                  id="prop-op1-level"
                  type="number"
                  min={0}
                  value={op1Level}
                  onChange={(e) => setOp1Level(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                  className="w-full max-w-[120px] rounded border border-border bg-surface px-2 py-1.5 text-sm"
                  aria-label="Option level"
                />
              </div>
            )}
            {(isPart && selectedPart) || (!isPart && selectedProperty) ? (
              <p className="text-xs text-text-muted">
                Total TP for this proficiency:{' '}
                {isPart && selectedPart
                  ? calculateProficiencyTP(
                      partToProf(selectedPart, variant as 'power_part' | 'technique_part', op1Level, op2Level, op3Level)
                    )
                  : selectedProperty
                    ? calculateProficiencyTP(propertyToProf(selectedProperty, op1Level))
                    : 0}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
}
