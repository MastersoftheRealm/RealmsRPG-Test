'use client';

import type { ReactNode } from 'react';
import { GridListRow, type ColumnValue, type ChipData } from '@/components/shared/grid-list-row';
import { ListHeader, type ListColumn, type SortState } from '@/components/shared/list-header';
import type { ListHeaderRowChrome } from '@/components/shared/grid-list-row-chrome';
import type { ListRowThumbnailProps } from '@/components/shared/list-row-thumbnail';
import { SectionHeader } from '@/components/shared/section-header';
import { QuantitySelector } from '@/components/shared/quantity-selector';
import { RollButton } from '@/components/shared/roll-button';
import { deriveShieldAmountFromProperties } from '@/lib/calculators/item-calc';
import { TP_COST_LABEL } from '@/lib/detail-option/compact-facts';
import { formatListCellLabel, splitDamageDiceAndType } from '@/lib/utils';
import { useRollsOptional } from '@/components/character-sheet/roll-context';
import { useLibrarySectionCollapse } from '@/hooks/use-library-section-collapse';

// =============================================================================
// Shared list sections (character sheet + creatures + elsewhere)
// =============================================================================

/** Optional per-row chrome passed through to GridListRow (character sheet edit/use flows). */
export type EntityRowExtras = {
  columns?: ColumnValue[];
  gridColumns?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  onDelete?: () => void;
  badges?: Array<{ label: string; color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' }>;
  equipped?: boolean;
  innate?: boolean;
  hideInnateBadge?: boolean;
  requirements?: ReactNode;
  partsChips?: ChipData[];
  chips?: ChipData[];
  chipsLabel?: string;
  totalTp?: number;
  columnSpans?: (number | undefined)[];
  detailSections?: Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }>;
  uses?: { current: number; max: number };
  hideUsesInName?: boolean;
  nameContent?: ReactNode;
  supplementalExpandedContent?: ReactNode;
  /** Art-capable rows: pair with ListHeader `hasThumbnailColumn`. */
  thumbnail?: ListRowThumbnailProps;
};

export type EntityListControls = {
  sortState?: SortState;
  onSort?: (columnKey: string) => void;
  rowChrome?: ListHeaderRowChrome;
  onAdd?: () => void;
  addLabel?: string;
  emptyMessage?: string;
  /** Multi-section character sheet library tabs: session collapse (empty → closed). */
  collapsible?: boolean;
};

/** Collapsible block for library tabs that are not entity list sections (notes, proficiencies). */
export function LibraryCollapsibleSection({
  title,
  itemCount,
  onAdd,
  addLabel,
  rightContent,
  addButtonClassName,
  children,
  className,
}: {
  title: string;
  itemCount: number;
  onAdd?: () => void;
  addLabel?: string;
  rightContent?: ReactNode;
  addButtonClassName?: string;
  children: ReactNode;
  className?: string;
}) {
  const { isContentVisible, onAdd: onAddWrapped, headerCollapseProps } = useLibrarySectionCollapse(
    true,
    itemCount,
    onAdd
  );
  return (
    <div className={className}>
      <SectionHeader
        title={title}
        size="lg"
        onAdd={onAddWrapped}
        addLabel={addLabel}
        rightContent={rightContent}
        addButtonClassName={addButtonClassName}
        {...headerCollapseProps}
      />
      {isContentVisible ? children : null}
    </div>
  );
}

function useEntityListSectionCollapse(
  collapsible: boolean | undefined,
  itemCount: number,
  onAdd?: () => void
) {
  return useLibrarySectionCollapse(collapsible ?? false, itemCount, onAdd);
}

// Powers (character sheet-like; creature stat block can include Energy)
const POWER_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.4fr' },
  { key: 'action', label: 'Action', width: '1fr', align: 'center' },
  { key: 'damage', label: 'Damage', width: '1fr', align: 'center' },
  { key: 'area', label: 'Area', width: '0.7fr', align: 'center' },
  { key: 'duration', label: 'Duration', width: '0.7fr', align: 'center' },
];
const POWER_GRID = '1.4fr 1fr 1fr 0.7fr 0.7fr';

export { POWER_COLUMNS, POWER_GRID };

const POWER_COLUMNS_WITH_ENERGY: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.2fr' },
  { key: 'energy', label: 'Energy', width: '0.7fr', align: 'center' },
  { key: 'action', label: 'Action', width: '1fr', align: 'center' },
  { key: 'damage', label: 'Damage', width: '1fr', align: 'center' },
  { key: 'area', label: 'Area', width: '0.7fr', align: 'center' },
  { key: 'duration', label: 'Duration', width: '0.7fr', align: 'center' },
];
const POWER_GRID_WITH_ENERGY = '1.2fr 0.7fr 1fr 1fr 0.7fr 0.7fr';

// Techniques (matches Character Sheet -> Library -> Techniques columns)
const TECHNIQUE_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.4fr' },
  { key: 'energy', label: 'Energy', width: '0.7fr', align: 'center' },
  { key: 'weapon', label: 'Attack', width: '1fr', align: 'center' },
  { key: 'tp', label: 'TP', width: '0.8fr', align: 'center' },
];
const TECHNIQUE_GRID = '1.4fr 0.7fr 1fr 0.8fr';

/**
 * Character sheet techniques tab: Action + Attack (weapon).
 * Energy cost lives only in the row rightSlot spend button (not a static value column).
 * ListHeader shows Energy via `CHARACTER_SHEET_ENERGY_SPEND_ROW_CHROME` over that control.
 * TP stays on expanded part chips / proficiency budget — not a collapsed GLR column.
 */
export const CHARACTER_SHEET_TECHNIQUE_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.4fr' },
  { key: 'action', label: 'Action', width: '1fr', align: 'center' },
  { key: 'weapon', label: 'Attack', width: '1fr', align: 'center' },
];
export const CHARACTER_SHEET_TECHNIQUE_GRID = '1.4fr 1fr 1fr';

// Weapons / Shields / Armor / Equipment (matches Character Sheet -> Library -> Inventory)
const WEAPON_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'damage', label: 'Damage', width: '0.8fr', align: 'center' },
  { key: 'range', label: 'Range', width: '0.6fr', align: 'center' },
];
const WEAPON_GRID = '1fr 0.8fr 0.6fr';

/** Character sheet weapons: range, attack roll, damage roll */
export const CHARACTER_SHEET_WEAPON_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: 'minmax(180px, 0.9fr)' },
  { key: 'range', label: 'Range', width: 'minmax(88px, 7rem)', align: 'center' },
  { key: 'attack', label: 'Attack', width: 'minmax(60px, 4rem)', align: 'center' },
  { key: 'damage', label: 'Damage', width: 'minmax(110px, 8rem)', align: 'center' },
];
export const CHARACTER_SHEET_WEAPON_GRID = 'minmax(180px, 0.9fr) minmax(88px, 7rem) minmax(60px, 4rem) minmax(110px, 8rem)';

const SHIELD_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'attack', label: 'Attack', width: '0.6fr', align: 'center' },
  { key: 'damage', label: 'Damage', width: '0.7fr', align: 'center' },
  { key: 'block', label: 'Block', width: '0.7fr', align: 'center' },
];
const SHIELD_GRID = '1fr 0.6fr 0.7fr 0.7fr';

export const CHARACTER_SHEET_SHIELD_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: 'minmax(160px, 1fr)' },
  { key: 'range', label: 'Range', width: 'minmax(64px, 0.6fr)', align: 'center' },
  { key: 'attack', label: 'Attack', width: 'minmax(64px, 4.5rem)', align: 'center' },
  { key: 'damage', label: 'Damage', width: 'minmax(64px, 4.5rem)', align: 'center' },
  { key: 'block', label: 'Block', width: 'minmax(64px, 0.7fr)', align: 'center' },
];
export const CHARACTER_SHEET_SHIELD_GRID =
  'minmax(160px, 1fr) minmax(64px, 0.6fr) minmax(64px, 4.5rem) minmax(64px, 4.5rem) minmax(64px, 0.7fr)';

const ARMOR_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'dr', label: 'Dmg. Red.', width: '0.6fr', align: 'center' },
  { key: 'crit', label: 'Crit Range', width: '0.6fr', align: 'center' },
];
const ARMOR_GRID = '1fr 0.6fr 0.6fr';

const EQUIPMENT_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'type', label: 'Type', width: '0.6fr', align: 'center' },
  { key: 'quantity', label: 'Qty', width: '4rem', align: 'center' },
];
const EQUIPMENT_GRID = '1fr 0.6fr 4rem';

// Feats/Traits (matches Character Sheet -> FeatsTab columns)
const FEAT_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: 'minmax(140px, 1.6fr)' },
  { key: 'description', label: 'Description', width: '2.5fr' },
  { key: 'uses', label: 'Uses', width: '5rem', align: 'center' },
  { key: 'recovery', label: 'Recovery', width: '4rem', align: 'center' },
];
const FEAT_GRID = 'minmax(140px, 1.6fr) 2.5fr 5rem 4rem';

const FEAT_COLUMNS_WITH_LEVEL: ListColumn[] = [
  { key: 'name', label: 'Name', width: 'minmax(140px, 1.6fr)' },
  { key: 'description', label: 'Description', width: '2fr' },
  { key: 'level', label: 'Lvl', width: '3.5rem', align: 'center' },
  { key: 'uses', label: 'Uses', width: '5rem', align: 'center' },
  { key: 'recovery', label: 'Recovery', width: '4rem', align: 'center' },
];
const FEAT_GRID_WITH_LEVEL = 'minmax(140px, 1.6fr) 2fr 3.5rem 5rem 4rem';

export { FEAT_COLUMNS, FEAT_GRID, FEAT_COLUMNS_WITH_LEVEL, FEAT_GRID_WITH_LEVEL };

function truncateText(text: string | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

function formatRecoveryAbbrev(recovery: string | undefined): string {
  if (!recovery) return '-';
  const lower = recovery.toLowerCase();
  if (lower.includes('partial')) return 'PR';
  if (lower.includes('full')) return 'FR';
  if (lower.includes('short')) return 'SR';
  if (lower.includes('long')) return 'LR';
  return '-';
}

export type EntityPowerRow = {
  id?: string | number;
  name: string;
  description?: string;
  actionType?: string;
  damage?: string | ReactNode;
  area?: string;
  duration?: string;
  energyCost?: number;
  innate?: boolean;
  partsChips?: ChipData[];
  totalTp?: number;
  requirements?: ReactNode;
} & EntityRowExtras;

type InteractiveRow = EntityRowExtras & {
  id?: string | number;
  name: string;
  description?: string;
};

function renderInteractiveGridRows(
  items: InteractiveRow[],
  defaultGrid: string,
  buildDefaultColumns: (item: InteractiveRow, idx: number) => ColumnValue[],
  compactRows: boolean
) {
  return items.map((item, idx) => (
    <GridListRow
      key={String(item.id ?? `${item.name}-${idx}`)}
      id={String(item.id ?? idx)}
      name={item.name}
      nameContent={item.nameContent}
      description={item.description}
      thumbnail={item.thumbnail}
      columns={item.columns ?? buildDefaultColumns(item, idx)}
      gridColumns={item.gridColumns ?? defaultGrid}
      expandedContent={
        item.requirements ? (
          <div className="space-y-2">
            {item.description && (
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{item.description}</p>
            )}
            {item.requirements}
          </div>
        ) : undefined
      }
      chips={item.partsChips ?? item.chips}
      chipsLabel={
        item.chipsLabel ??
        (item.partsChips?.length || item.chips?.length ? 'Parts & Proficiencies' : undefined)
      }
      totalCost={item.totalTp && item.totalTp > 0 ? item.totalTp : undefined}
      costLabel={item.totalTp && item.totalTp > 0 ? TP_COST_LABEL : undefined}
      requirements={!item.columns ? item.requirements : undefined}
      innate={item.innate === true}
      hideInnateBadge={item.hideInnateBadge}
      leftSlot={item.leftSlot}
      rightSlot={item.rightSlot}
      onDelete={item.onDelete}
      badges={item.badges}
      equipped={item.equipped}
      columnSpans={item.columnSpans}
      detailSections={item.detailSections}
      supplementalExpandedContent={item.supplementalExpandedContent}
      uses={item.uses}
      hideUsesInName={item.hideUsesInName}
      compact={compactRows}
    />
  ));
}

export function PowersListSection({
  title = 'Powers',
  items,
  showListHeader = true,
  compactRows = true,
  /**
   * When true, show a static Energy column (browse/stat-block).
   * Character sheet play lists must leave this false — energy cost is the row `rightSlot` spend button only.
   */
  includeEnergyColumn = false,
  showTitle = true,
  sortState,
  onSort,
  rowChrome,
  onAdd,
  addLabel,
  emptyMessage = 'No powers',
  collapsible,
}: {
  title?: string;
  items: EntityPowerRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  includeEnergyColumn?: boolean;
  /** When false, omit the internal SectionHeader title (for callers that provide their own header) */
  showTitle?: boolean;
} & EntityListControls) {
  const hasAny = items.length > 0;
  const { isContentVisible, onAdd: onAddWrapped, headerCollapseProps } = useEntityListSectionCollapse(
    collapsible,
    items.length,
    onAdd
  );
  const cols = includeEnergyColumn ? POWER_COLUMNS_WITH_ENERGY : POWER_COLUMNS;
  const grid = includeEnergyColumn ? POWER_GRID_WITH_ENERGY : POWER_GRID;
  return (
    <div>
      {showTitle && (
        <SectionHeader
          title={title}
          size="lg"
          onAdd={onAddWrapped}
          addLabel={addLabel}
          {...headerCollapseProps}
        />
      )}
      {isContentVisible && (
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
        <div className="space-y-1">
          {renderInteractiveGridRows(
            items,
            grid,
            (power) => {
              const row = power as EntityPowerRow;
              const damageVal =
                typeof row.damage === 'string' || row.damage == null ? (row.damage ?? '-') : row.damage;
              return includeEnergyColumn
                ? [
                    { key: 'energy', value: row.energyCost ?? '-', align: 'center' as const },
                    { key: 'action', value: row.actionType ?? '-', align: 'center' as const },
                    { key: 'damage', value: damageVal, align: 'center' as const },
                    { key: 'area', value: row.area ?? '-', align: 'center' as const },
                    { key: 'duration', value: row.duration ?? '-', align: 'center' as const },
                  ]
                : [
                    { key: 'action', value: row.actionType ?? '-', align: 'center' as const },
                    { key: 'damage', value: damageVal, align: 'center' as const },
                    { key: 'area', value: row.area ?? '-', align: 'center' as const },
                    { key: 'duration', value: row.duration ?? '-', align: 'center' as const },
                  ];
            },
            compactRows
          )}
        </div>
      ) : (
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">{emptyMessage}</p>
      )}
        </>
      )}
    </div>
  );
}

export type EntityTechniqueRow = {
  id?: string | number;
  name: string;
  description?: string;
  actionType?: string;
  energyCost?: number;
  weaponName?: string;
  tp?: number | string;
  partsChips?: ChipData[];
  totalTp?: number;
} & EntityRowExtras;

export function TechniquesListSection({
  title = 'Techniques',
  items,
  showListHeader = true,
  compactRows = true,
  showTitle = true,
  /**
   * Character-sheet play mode: Action + Attack columns (no Energy or TP columns).
   * Energy cost must live only on the row `rightSlot` spend button.
   * Omit (false) for browse/stat-block lists that show a static Energy column and have no spend button.
   * Do not combine browse Energy columns with spend `rightSlot` — that recreates the duplicate UX.
   */
  includeActionColumn = false,
  sortState,
  onSort,
  rowChrome,
  onAdd,
  addLabel,
  emptyMessage = 'No techniques',
  collapsible,
}: {
  title?: string;
  items: EntityTechniqueRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  showTitle?: boolean;
  includeActionColumn?: boolean;
} & EntityListControls) {
  const hasAny = items.length > 0;
  const { isContentVisible, onAdd: onAddWrapped, headerCollapseProps } = useEntityListSectionCollapse(
    collapsible,
    items.length,
    onAdd
  );
  const cols = includeActionColumn ? CHARACTER_SHEET_TECHNIQUE_COLUMNS : TECHNIQUE_COLUMNS;
  const grid = includeActionColumn ? CHARACTER_SHEET_TECHNIQUE_GRID : TECHNIQUE_GRID;
  return (
    <div>
      {showTitle && (
        <SectionHeader
          title={title}
          size="lg"
          onAdd={onAddWrapped}
          addLabel={addLabel}
          {...headerCollapseProps}
        />
      )}
      {isContentVisible && (
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
        <div className="space-y-1">
          {renderInteractiveGridRows(
            items,
            grid,
            (tech) => {
              const row = tech as EntityTechniqueRow;
              // Character sheet (includeActionColumn): energy is rightSlot only — no Energy column.
              if (includeActionColumn) {
                return [
                  { key: 'action', value: row.actionType ?? '-', align: 'center' as const },
                  { key: 'weapon', value: row.weaponName ?? '-', align: 'center' as const },
                ];
              }
              return [
                { key: 'energy', value: row.energyCost ?? '-', align: 'center' as const },
                { key: 'weapon', value: row.weaponName ?? '-', align: 'center' as const },
                { key: 'tp', value: row.tp ?? '-', align: 'center' as const },
              ];
            },
            compactRows
          )}
        </div>
      ) : (
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">{emptyMessage}</p>
      )}
        </>
      )}
    </div>
  );
}

export type EntityWeaponRow = {
  id?: string | number;
  name: string;
  description?: string;
  damage?: string;
  range?: string;
  attackBonus?: number;
  chips?: ChipData[];
} & EntityRowExtras;

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
}: {
  title?: string;
  items: EntityWeaponRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  showTitle?: boolean;
  rollTitlePrefix?: string;
  layout?: 'creature' | 'characterSheet';
} & EntityListControls) {
  const rollContext = useRollsOptional();
  const hasAny = items.length > 0;
  const { isContentVisible, onAdd: onAddWrapped, headerCollapseProps } = useEntityListSectionCollapse(
    collapsible,
    items.length,
    onAdd
  );
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
          <div className="space-y-1">{renderInteractiveGridRows(items, grid, () => [], compactRows)}</div>
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
                        attack
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
                          rollTitlePrefix ? `${rollTitlePrefix}: ${w.name} damage` : `${w.name} damage`
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
                columns={w.columns ?? [
                  { key: 'damage', value: w.damage ?? '-', align: 'center' },
                  { key: 'range', value: w.range ?? 'Melee', align: 'center' },
                ]}
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
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">{emptyMessage}</p>
      )}
    </>
  );

  return (
    <div>
      {showTitle && (
        <SectionHeader
          title={title}
          size="lg"
          onAdd={onAddWrapped}
          addLabel={addLabel}
          {...headerCollapseProps}
        />
      )}
      {isContentVisible ? listBody : null}
    </div>
  );
}

export type EntityShieldRow = {
  id?: string | number;
  name: string;
  description?: string;
  damage?: string;
  properties?: Array<{ id?: number; name?: string; op_1_lvl?: number }>;
  chips?: ChipData[];
} & EntityRowExtras;

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
}: {
  title?: string;
  items: EntityShieldRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  showTitle?: boolean;
  layout?: 'creature' | 'characterSheet';
} & EntityListControls) {
  const hasAny = items.length > 0;
  const { isContentVisible, onAdd: onAddWrapped, headerCollapseProps } = useEntityListSectionCollapse(
    collapsible,
    items.length,
    onAdd
  );
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
          <div className="space-y-1">{renderInteractiveGridRows(items, grid, () => [], compactRows)}</div>
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
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">{emptyMessage}</p>
      )}
    </>
  );

  return (
    <div>
      {showTitle && (
        <SectionHeader
          title={title}
          size="lg"
          onAdd={onAddWrapped}
          addLabel={addLabel}
          {...headerCollapseProps}
        />
      )}
      {isContentVisible ? listBody : null}
    </div>
  );
}

export type EntityArmorRow = {
  id?: string | number;
  name: string;
  description?: string;
  damageReduction?: number;
  armorValue?: number;
  chips?: ChipData[];
} & EntityRowExtras;

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
}: {
  title?: string;
  items: EntityArmorRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  showTitle?: boolean;
  layout?: 'creature' | 'characterSheet';
} & EntityListControls) {
  const hasAny = items.length > 0;
  const { isContentVisible, onAdd: onAddWrapped, headerCollapseProps } = useEntityListSectionCollapse(
    collapsible,
    items.length,
    onAdd
  );
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
          <div className="space-y-1">{renderInteractiveGridRows(items, grid, () => [], compactRows)}</div>
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
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">{emptyMessage}</p>
      )}
    </>
  );

  return (
    <div>
      {showTitle && (
        <SectionHeader
          title={title}
          size="lg"
          onAdd={onAddWrapped}
          addLabel={addLabel}
          {...headerCollapseProps}
        />
      )}
      {isContentVisible ? listBody : null}
    </div>
  );
}

export type EntityEquipmentRow = {
  id?: string | number;
  name: string;
  description?: string;
  type?: string;
  quantity?: number;
} & EntityRowExtras;

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
}: {
  title?: string;
  items: EntityEquipmentRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  showTitle?: boolean;
  layout?: 'creature' | 'characterSheet';
} & EntityListControls) {
  const hasAny = items.length > 0;
  const { isContentVisible, onAdd: onAddWrapped, headerCollapseProps } = useEntityListSectionCollapse(
    collapsible,
    items.length,
    onAdd
  );
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
          <div className="space-y-1">{renderInteractiveGridRows(items, grid, () => [], compactRows)}</div>
        ) : (
          <div className="space-y-1">
            {items.map((e, idx) => {
              const itemType = formatListCellLabel(e.type);
              const qty = e.quantity ?? 1;
              const qtyCell = (
                <div className="flex items-center justify-center" onClick={(ev) => ev.stopPropagation()}>
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
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">{emptyMessage}</p>
      )}
    </>
  );

  return (
    <div>
      {(showTitle || layout !== 'characterSheet') && (
        <SectionHeader title={title} size="lg" onAdd={onAddWrapped} addLabel={addLabel} {...headerCollapseProps} />
      )}
      {isContentVisible ? listBody : null}
    </div>
  );
}

export type EntityFeatRow = {
  id?: string | number;
  name: string;
  description?: string;
  maxUses?: number;
  currentUses?: number;
  recovery?: string;
} & EntityRowExtras;

export function FeatsTraitsListSection({
  title = 'Feats',
  items,
  showListHeader = true,
  compactRows = true,
  showTitle = true,
  includeLevelColumn = false,
  sortState,
  onSort,
  rowChrome,
  onAdd,
  addLabel,
  headerRightContent,
  addButtonClassName,
  emptyMessage = 'No feats',
  collapsible,
}: {
  title?: string;
  items: EntityFeatRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  showTitle?: boolean;
  /** Show Lvl column header when editing leveled feats */
  includeLevelColumn?: boolean;
  headerRightContent?: ReactNode;
  addButtonClassName?: string;
} & EntityListControls) {
  const hasAny = items.length > 0;
  const useInteractiveRows = items.some((item) => item.columns != null);
  const featColumns = includeLevelColumn ? FEAT_COLUMNS_WITH_LEVEL : FEAT_COLUMNS;
  const featGrid = includeLevelColumn ? FEAT_GRID_WITH_LEVEL : FEAT_GRID;
  const { isContentVisible, onAdd: onAddWrapped, headerCollapseProps } = useEntityListSectionCollapse(
    collapsible,
    items.length,
    onAdd
  );

  const listBody = (
    <>
      {showListHeader && hasAny && (
        <ListHeader
          columns={useInteractiveRows ? featColumns : FEAT_COLUMNS}
          gridColumns={useInteractiveRows ? featGrid : FEAT_GRID}
          sortState={sortState}
          onSort={onSort}
          rowChrome={rowChrome}
        />
      )}
      {hasAny ? (
        <div className="space-y-1">
          {useInteractiveRows
            ? renderInteractiveGridRows(items, featGrid, () => [], compactRows)
            : items.map((feat, index) => {
                const uses =
                  (feat.maxUses ?? 0) > 0
                    ? { current: feat.currentUses ?? feat.maxUses ?? 0, max: feat.maxUses ?? 0 }
                    : undefined;
                const usesDisplay = uses ? `${uses.current}/${uses.max}` : '-';
                const recoveryDisplay = formatRecoveryAbbrev(feat.recovery);
                const noUsesOrRecovery = !uses && recoveryDisplay === '-';
                return (
                  <GridListRow
                    key={String(feat.id ?? `${feat.name}-${index}`)}
                    id={String(feat.id ?? index)}
                    name={feat.name}
                    description={feat.description}
                    gridColumns={FEAT_GRID}
                    columns={
                      noUsesOrRecovery
                        ? [{ key: 'description', value: truncateText(feat.description, 220), hideOnMobile: true }]
                        : [
                            {
                              key: 'description',
                              value: truncateText(feat.description, uses ? 60 : 100),
                              hideOnMobile: true,
                            },
                            { key: 'uses', value: usesDisplay, align: 'center' },
                            { key: 'recovery', value: recoveryDisplay, align: 'center' },
                          ]
                    }
                    columnSpans={noUsesOrRecovery ? [3] : undefined}
                    uses={uses}
                    compact={compactRows}
                  />
                );
              })}
        </div>
      ) : (
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">{emptyMessage}</p>
      )}
    </>
  );

  return (
    <div>
      {showTitle && (
        <SectionHeader
          title={title}
          size="lg"
          onAdd={onAddWrapped}
          addLabel={addLabel}
          rightContent={headerRightContent}
          addButtonClassName={addButtonClassName}
          {...headerCollapseProps}
        />
      )}
      {isContentVisible ? listBody : null}
    </div>
  );
}

