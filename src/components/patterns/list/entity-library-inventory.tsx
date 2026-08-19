'use client';

import { GridListRow, type ColumnValue } from '@/components/patterns/list/grid-list-row';
import { ListHeader } from '@/components/patterns/list/list-header';
import { SectionHeader } from '@/components/patterns/chrome/section-header';
import { QuantitySelector } from '@/components/patterns/select/quantity-selector';
import { RollButton } from '@/components/patterns/chrome/roll-button';
import { deriveShieldAmountFromProperties } from '@/lib/calculators/item-calc';
import { formatListCellLabel, splitDamageDiceAndType } from '@/lib/utils';
import { useRollsOptional } from '@/components/rolls';
import {
  WEAPON_COLUMNS,
  WEAPON_GRID,
  CHARACTER_SHEET_WEAPON_COLUMNS,
  CHARACTER_SHEET_WEAPON_GRID,
  SHIELD_COLUMNS,
  SHIELD_GRID,
  CHARACTER_SHEET_SHIELD_COLUMNS,
  CHARACTER_SHEET_SHIELD_GRID,
  ARMOR_COLUMNS,
  ARMOR_GRID,
  EQUIPMENT_COLUMNS,
  EQUIPMENT_GRID,
} from './entity-library-sections-columns';
import {
  renderInteractiveGridRows,
  useEntityListSectionCollapse,
} from './entity-library-sections-rows';
import type {
  EntityListControls,
  EntityWeaponRow,
  EntityShieldRow,
  EntityArmorRow,
  EntityEquipmentRow,
} from './entity-library-sections-types';

export function WeaponsListSection({
  title = 'Weapons',
  items,
  showListHeader = true,
  compactRows = true,
  showTitle = true,
  rollTitlePrefix,
  layout = 'creature',
  sortState,
  onSort,
  rowChrome,
  onAdd,
  addLabel,
  emptyMessage = 'No weapons',
  collapsible,
  headingLevel,
}: {
  title?: string | undefined;
  items: EntityWeaponRow[];
  showListHeader?: boolean | undefined;
  compactRows?: boolean | undefined;
  showTitle?: boolean | undefined;
  rollTitlePrefix?: string | undefined;
  layout?: 'creature' | 'characterSheet' | undefined;
} & EntityListControls) {
  const rollContext = useRollsOptional();
  const hasAny = items.length > 0;
  const {
    isContentVisible,
    onAdd: onAddWrapped,
    headerCollapseProps,
  } = useEntityListSectionCollapse(collapsible, items.length, onAdd);
  const cols = layout === 'characterSheet' ? CHARACTER_SHEET_WEAPON_COLUMNS : WEAPON_COLUMNS;
  const grid = layout === 'characterSheet' ? CHARACTER_SHEET_WEAPON_GRID : WEAPON_GRID;

  const listBody = (
    <>
      {showListHeader && hasAny && (
        <ListHeader
          columns={cols}
          gridColumns={grid}
          sortState={sortState}
          onSort={onSort}
          rowChrome={rowChrome}
          hasThumbnailColumn
        />
      )}
      {hasAny ? (
        layout === 'characterSheet' ? (
          <div className="space-y-1">
            {renderInteractiveGridRows(items, grid, () => [], compactRows)}
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((w, idx) => {
              const attack = typeof w.attackBonus === 'number' ? w.attackBonus : 0;
              const { dice, rollStr } = splitDamageDiceAndType(w.damage);
              const rightSlot =
                rollContext?.canRoll !== false && rollContext ? (
                  <div className="flex items-center gap-1">
                    <RollButton
                      value={attack}
                      onClick={() =>
                        rollContext.rollAttack(
                          rollTitlePrefix ? `${rollTitlePrefix}: ${w.name}` : w.name,
                          attack,
                        )
                      }
                      size="sm"
                      title={`Roll attack with ${w.name}`}
                    />
                    {rollStr !== '-' && (
                      <RollButton
                        value={0}
                        displayValue={dice}
                        variant="danger"
                        onClick={() =>
                          rollContext.rollDamage(
                            rollStr,
                            attack,
                            rollTitlePrefix
                              ? `${rollTitlePrefix}: ${w.name} damage`
                              : `${w.name} damage`,
                          )
                        }
                        size="sm"
                        title={`Roll ${rollStr} damage`}
                      />
                    )}
                  </div>
                ) : null;

              return (
                <GridListRow
                  key={String(w.id ?? `${w.name}-${idx}`)}
                  id={String(w.id ?? idx)}
                  name={w.name}
                  description={w.description}
                  thumbnail={w.thumbnail}
                  columns={
                    w.columns ?? [
                      { key: 'damage', value: w.damage ?? '-', align: 'center' },
                      { key: 'range', value: w.range ?? 'Melee', align: 'center' },
                    ]
                  }
                  gridColumns={w.gridColumns ?? grid}
                  chips={w.chips}
                  chipsLabel={w.chips?.length ? 'Properties & Proficiencies' : undefined}
                  rightSlot={w.rightSlot ?? rightSlot}
                  leftSlot={w.leftSlot}
                  onDelete={w.onDelete}
                  badges={w.badges}
                  equipped={w.equipped}
                  compact={compactRows}
                />
              );
            })}
          </div>
        )
      ) : (
        <p className="py-4 text-center text-sm text-text-muted italic">{emptyMessage}</p>
      )}
    </>
  );

  return (
    <div>
      {showTitle && (
        <SectionHeader
          title={title}
          size="lg"
          headingLevel={headingLevel}
          onAdd={onAddWrapped}
          addLabel={addLabel}
          {...headerCollapseProps}
        />
      )}
      {isContentVisible ? listBody : null}
    </div>
  );
}

export function ShieldsListSection({
  title = 'Shields',
  items,
  showListHeader = true,
  compactRows = true,
  showTitle = true,
  layout = 'creature',
  sortState,
  onSort,
  rowChrome,
  onAdd,
  addLabel,
  emptyMessage = 'No shields',
  collapsible,
  headingLevel,
}: {
  title?: string | undefined;
  items: EntityShieldRow[];
  showListHeader?: boolean | undefined;
  compactRows?: boolean | undefined;
  showTitle?: boolean | undefined;
  layout?: 'creature' | 'characterSheet' | undefined;
} & EntityListControls) {
  const hasAny = items.length > 0;
  const {
    isContentVisible,
    onAdd: onAddWrapped,
    headerCollapseProps,
  } = useEntityListSectionCollapse(collapsible, items.length, onAdd);
  const cols = layout === 'characterSheet' ? CHARACTER_SHEET_SHIELD_COLUMNS : SHIELD_COLUMNS;
  const grid = layout === 'characterSheet' ? CHARACTER_SHEET_SHIELD_GRID : SHIELD_GRID;

  const listBody = (
    <>
      {showListHeader && hasAny && (
        <ListHeader
          columns={cols}
          gridColumns={grid}
          sortState={sortState}
          onSort={onSort}
          rowChrome={rowChrome}
          hasThumbnailColumn
        />
      )}
      {hasAny ? (
        layout === 'characterSheet' ? (
          <div className="space-y-1">
            {renderInteractiveGridRows(items, grid, () => [], compactRows)}
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((s, idx) => {
              const block = deriveShieldAmountFromProperties(s.properties || []);
              const columns: ColumnValue[] = [
                { key: 'attack', value: '-', align: 'center' },
                { key: 'damage', value: s.damage ?? '-', align: 'center' },
                { key: 'block', value: block ?? '-', align: 'center' },
              ];
              return (
                <GridListRow
                  key={String(s.id ?? `${s.name}-${idx}`)}
                  id={String(s.id ?? idx)}
                  name={s.name}
                  description={s.description}
                  thumbnail={s.thumbnail}
                  columns={columns}
                  gridColumns={grid}
                  chips={s.chips}
                  chipsLabel={s.chips?.length ? 'Properties & Proficiencies' : undefined}
                  compact={compactRows}
                />
              );
            })}
          </div>
        )
      ) : (
        <p className="py-4 text-center text-sm text-text-muted italic">{emptyMessage}</p>
      )}
    </>
  );

  return (
    <div>
      {showTitle && (
        <SectionHeader
          title={title}
          size="lg"
          headingLevel={headingLevel}
          onAdd={onAddWrapped}
          addLabel={addLabel}
          {...headerCollapseProps}
        />
      )}
      {isContentVisible ? listBody : null}
    </div>
  );
}

export function ArmorListSection({
  title = 'Armor',
  items,
  showListHeader = true,
  compactRows = true,
  showTitle = true,
  layout = 'creature',
  sortState,
  onSort,
  rowChrome,
  onAdd,
  addLabel,
  emptyMessage = 'No armor',
  collapsible,
  headingLevel,
}: {
  title?: string | undefined;
  items: EntityArmorRow[];
  showListHeader?: boolean | undefined;
  compactRows?: boolean | undefined;
  showTitle?: boolean | undefined;
  layout?: 'creature' | 'characterSheet' | undefined;
} & EntityListControls) {
  const hasAny = items.length > 0;
  const {
    isContentVisible,
    onAdd: onAddWrapped,
    headerCollapseProps,
  } = useEntityListSectionCollapse(collapsible, items.length, onAdd);
  const grid = ARMOR_GRID;

  const listBody = (
    <>
      {showListHeader && hasAny && (
        <ListHeader
          columns={ARMOR_COLUMNS}
          gridColumns={grid}
          sortState={sortState}
          onSort={onSort}
          rowChrome={rowChrome}
          hasThumbnailColumn
        />
      )}
      {hasAny ? (
        layout === 'characterSheet' ? (
          <div className="space-y-1">
            {renderInteractiveGridRows(items, grid, () => [], compactRows)}
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((a, idx) => (
              <GridListRow
                key={String(a.id ?? `${a.name}-${idx}`)}
                id={String(a.id ?? idx)}
                name={a.name}
                description={a.description}
                thumbnail={a.thumbnail}
                columns={[
                  { key: 'dr', value: a.damageReduction ?? a.armorValue ?? '-', align: 'center' },
                  { key: 'crit', value: '-', align: 'center' },
                ]}
                gridColumns={grid}
                chips={a.chips}
                chipsLabel={a.chips?.length ? 'Properties & Proficiencies' : undefined}
                compact={compactRows}
              />
            ))}
          </div>
        )
      ) : (
        <p className="py-4 text-center text-sm text-text-muted italic">{emptyMessage}</p>
      )}
    </>
  );

  return (
    <div>
      {showTitle && (
        <SectionHeader
          title={title}
          size="lg"
          headingLevel={headingLevel}
          onAdd={onAddWrapped}
          addLabel={addLabel}
          {...headerCollapseProps}
        />
      )}
      {isContentVisible ? listBody : null}
    </div>
  );
}

export function EquipmentListSection({
  title = 'Equipment',
  items,
  showListHeader = true,
  compactRows = true,
  showTitle = true,
  layout = 'creature',
  sortState,
  onSort,
  rowChrome,
  onAdd,
  addLabel,
  emptyMessage = 'No equipment',
  collapsible,
  headingLevel,
}: {
  title?: string | undefined;
  items: EntityEquipmentRow[];
  showListHeader?: boolean | undefined;
  compactRows?: boolean | undefined;
  showTitle?: boolean | undefined;
  layout?: 'creature' | 'characterSheet' | undefined;
} & EntityListControls) {
  const hasAny = items.length > 0;
  const {
    isContentVisible,
    onAdd: onAddWrapped,
    headerCollapseProps,
  } = useEntityListSectionCollapse(collapsible, items.length, onAdd);
  const grid = EQUIPMENT_GRID;

  const listBody = (
    <>
      {showListHeader && hasAny && (
        <ListHeader
          columns={EQUIPMENT_COLUMNS}
          gridColumns={grid}
          sortState={sortState}
          onSort={onSort}
          rowChrome={rowChrome}
          hasThumbnailColumn
        />
      )}
      {hasAny ? (
        layout === 'characterSheet' ? (
          <div className="space-y-1">
            {renderInteractiveGridRows(items, grid, () => [], compactRows)}
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((e, idx) => {
              const itemType = formatListCellLabel(e.type);
              const qty = e.quantity ?? 1;
              const qtyCell = (
                <div
                  className="flex items-center justify-center"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <QuantitySelector quantity={qty} min={0} max={99} size="sm" onChange={() => {}} />
                </div>
              );
              const columns: ColumnValue[] = [
                { key: 'type', value: itemType, align: 'center' },
                { key: 'quantity', value: qtyCell, align: 'center' },
              ];
              return (
                <GridListRow
                  key={String(e.id ?? `${e.name}-${idx}`)}
                  id={String(e.id ?? idx)}
                  name={e.name}
                  description={e.description}
                  thumbnail={e.thumbnail}
                  columns={columns}
                  gridColumns={grid}
                  compact={compactRows}
                />
              );
            })}
          </div>
        )
      ) : (
        <p className="py-4 text-center text-sm text-text-muted italic">{emptyMessage}</p>
      )}
    </>
  );

  return (
    <div>
      {(showTitle || layout !== 'characterSheet') && (
        <SectionHeader
          title={title}
          size="lg"
          headingLevel={headingLevel}
          onAdd={onAddWrapped}
          addLabel={addLabel}
          {...headerCollapseProps}
        />
      )}
      {isContentVisible ? listBody : null}
    </div>
  );
}
