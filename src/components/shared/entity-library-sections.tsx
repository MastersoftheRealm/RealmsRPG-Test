'use client';

import { useMemo } from 'react';
import { GridListRow, type ColumnValue, type ChipData } from '@/components/shared/grid-list-row';
import { ListHeader, type ListColumn } from '@/components/shared/list-header';
import { SectionHeader } from '@/components/shared/section-header';
import { QuantitySelector } from '@/components/shared/quantity-selector';
import { RollButton } from '@/components/shared/roll-button';
import { deriveShieldAmountFromProperties } from '@/lib/calculators/item-calc';
import { formatDamageDisplay, formatListCellLabel } from '@/lib/utils';
import { useRollsOptional } from '@/components/character-sheet/roll-context';

// =============================================================================
// Shared display-only list sections (character sheet + creatures + elsewhere)
// =============================================================================

// Powers (character sheet-like; creature stat block can include Energy)
const POWER_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.4fr' },
  { key: 'action', label: 'Action', width: '1fr', align: 'center' },
  { key: 'damage', label: 'Damage', width: '1fr', align: 'center' },
  { key: 'area', label: 'Area', width: '0.7fr', align: 'center' },
  { key: 'duration', label: 'Duration', width: '0.7fr', align: 'center' },
];
const POWER_GRID = '1.4fr 1fr 1fr 0.7fr 0.7fr';

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
  { key: 'weapon', label: 'Weapon', width: '1fr', align: 'center' },
  { key: 'tp', label: 'Training Pts', width: '0.8fr', align: 'center' },
];
const TECHNIQUE_GRID = '1.4fr 0.7fr 1fr 0.8fr';

// Weapons / Shields / Armor / Equipment (matches Character Sheet -> Library -> Inventory)
const WEAPON_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'damage', label: 'Damage', width: '0.8fr', align: 'center' },
  { key: 'range', label: 'Range', width: '0.6fr', align: 'center' },
];
const WEAPON_GRID = '1fr 0.8fr 0.6fr';

const SHIELD_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'attack', label: 'Attack', width: '0.6fr', align: 'center' },
  { key: 'damage', label: 'Damage', width: '0.7fr', align: 'center' },
  { key: 'block', label: 'Block', width: '0.7fr', align: 'center' },
];
const SHIELD_GRID = '1fr 0.6fr 0.7fr 0.7fr';

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
  { key: 'description', label: 'Description', width: '2.5fr', sortable: false },
  { key: 'uses', label: 'Uses', width: '5rem', align: 'center' },
  { key: 'recovery', label: 'Recovery', width: '4rem', align: 'center' },
];
const FEAT_GRID = 'minmax(140px, 1.6fr) 2.5fr 5rem 4rem';

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

function splitDamageDiceAndType(damage: unknown): { dice: string; type: string; rollStr: string } {
  if (!damage) return { dice: '-', type: '', rollStr: '-' };
  if (typeof damage === 'string') {
    const str = damage.trim();
    const match = str.match(/^([\dd+\-\s]+)(?:\s+(.+))?$/);
    if (!match) return { dice: str, type: '', rollStr: str };
    return { dice: match[1].trim(), type: (match[2] ?? '').trim(), rollStr: str };
  }
  const formatted = formatDamageDisplay(damage as never);
  const str = formatted ? String(formatted) : '-';
  const match = str.match(/^([\dd+\-\s]+)(?:\s+(.+))?$/);
  if (!match) return { dice: str, type: '', rollStr: str };
  return { dice: match[1].trim(), type: (match[2] ?? '').trim(), rollStr: str };
}

export type EntityPowerRow = {
  id?: string | number;
  name: string;
  description?: string;
  actionType?: string;
  damage?: string;
  area?: string;
  duration?: string;
  energyCost?: number;
  innate?: boolean;
  partsChips?: ChipData[];
  totalTp?: number;
  requirements?: React.ReactNode;
};

export function PowersListSection({
  title = 'Powers',
  items,
  showListHeader = true,
  compactRows = true,
  includeEnergyColumn = false,
  showTitle = true,
}: {
  title?: string;
  items: EntityPowerRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  includeEnergyColumn?: boolean;
  /** When false, omit the internal SectionHeader title (for callers that provide their own header) */
  showTitle?: boolean;
}) {
  const hasAny = items.length > 0;
  const cols = includeEnergyColumn ? POWER_COLUMNS_WITH_ENERGY : POWER_COLUMNS;
  const grid = includeEnergyColumn ? POWER_GRID_WITH_ENERGY : POWER_GRID;
  return (
    <div>
      {showTitle && <SectionHeader title={title} size="sm" />}
      {showListHeader && hasAny && <ListHeader columns={cols} gridColumns={grid} />}
      {hasAny ? (
        <div className="space-y-1">
          {items.map((power, idx) => {
            const columns: ColumnValue[] = includeEnergyColumn
              ? [
                  { key: 'energy', value: power.energyCost ?? '-', align: 'center' },
                  { key: 'action', value: power.actionType ?? '-', align: 'center' },
                  { key: 'damage', value: power.damage ?? '-', align: 'center' },
                  { key: 'area', value: power.area ?? '-', align: 'center' },
                  { key: 'duration', value: power.duration ?? '-', align: 'center' },
                ]
              : [
                  { key: 'action', value: power.actionType ?? '-', align: 'center' },
                  { key: 'damage', value: power.damage ?? '-', align: 'center' },
                  { key: 'area', value: power.area ?? '-', align: 'center' },
                  { key: 'duration', value: power.duration ?? '-', align: 'center' },
                ];
            return (
              <GridListRow
                key={String(power.id ?? `${power.name}-${idx}`)}
                id={String(power.id ?? idx)}
                name={power.name}
                description={power.description}
                columns={columns}
                gridColumns={grid}
                expandedContent={
                  <div className="space-y-2">
                    {power.description && (
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{power.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
                      {power.energyCost != null && <span><span className="font-medium">Energy:</span> {power.energyCost}</span>}
                      {power.actionType && <span><span className="font-medium">Action:</span> {power.actionType}</span>}
                      {power.damage && <span><span className="font-medium">Damage:</span> {power.damage}</span>}
                      {power.area && <span><span className="font-medium">Area:</span> {power.area}</span>}
                      {power.duration && <span><span className="font-medium">Duration:</span> {power.duration}</span>}
                    </div>
                  </div>
                }
                chips={power.partsChips}
                chipsLabel={power.partsChips?.length ? 'Parts & Proficiencies' : undefined}
                totalCost={power.totalTp && power.totalTp > 0 ? power.totalTp : undefined}
                costLabel={power.totalTp && power.totalTp > 0 ? 'TP' : undefined}
                requirements={power.requirements}
                innate={power.innate === true}
                compact={compactRows}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">No powers</p>
      )}
    </div>
  );
}

export type EntityTechniqueRow = {
  id?: string | number;
  name: string;
  description?: string;
  energyCost?: number;
  weaponName?: string;
  tp?: number | string;
  partsChips?: ChipData[];
  totalTp?: number;
};

export function TechniquesListSection({
  title = 'Techniques',
  items,
  showListHeader = true,
  compactRows = true,
  showTitle = true,
}: {
  title?: string;
  items: EntityTechniqueRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  showTitle?: boolean;
}) {
  const hasAny = items.length > 0;
  return (
    <div>
      {showTitle && <SectionHeader title={title} size="sm" />}
      {showListHeader && hasAny && <ListHeader columns={TECHNIQUE_COLUMNS} gridColumns={TECHNIQUE_GRID} />}
      {hasAny ? (
        <div className="space-y-1">
          {items.map((tech, idx) => {
            const columns: ColumnValue[] = [
              { key: 'energy', value: tech.energyCost ?? '-', align: 'center' },
              { key: 'weapon', value: tech.weaponName ?? '-', align: 'center' },
              { key: 'tp', value: tech.tp ?? '-', align: 'center' },
            ];
            return (
              <GridListRow
                key={String(tech.id ?? `${tech.name}-${idx}`)}
                id={String(tech.id ?? idx)}
                name={tech.name}
                description={tech.description}
                columns={columns}
                gridColumns={TECHNIQUE_GRID}
                expandedContent={
                  tech.description ? (
                    <div className="space-y-2">
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{tech.description}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-text-muted dark:text-text-secondary italic">No description.</div>
                  )
                }
                chips={tech.partsChips}
                chipsLabel={tech.partsChips?.length ? 'Parts & Proficiencies' : undefined}
                totalCost={tech.totalTp && tech.totalTp > 0 ? tech.totalTp : undefined}
                costLabel={tech.totalTp && tech.totalTp > 0 ? 'TP' : undefined}
                compact={compactRows}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">No techniques</p>
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
};

export function WeaponsListSection({
  title = 'Weapons',
  items,
  showListHeader = true,
  compactRows = true,
  showTitle = true,
  rollTitlePrefix,
}: {
  title?: string;
  items: EntityWeaponRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  showTitle?: boolean;
  rollTitlePrefix?: string;
}) {
  const rollContext = useRollsOptional();
  const hasAny = items.length > 0;
  return (
    <div>
      {showTitle && <SectionHeader title={title} size="sm" />}
      {showListHeader && hasAny && <ListHeader columns={WEAPON_COLUMNS} gridColumns={WEAPON_GRID} />}
      {hasAny ? (
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
                columns={[
                  { key: 'damage', value: w.damage ?? '-', align: 'center' },
                  { key: 'range', value: w.range ?? 'Melee', align: 'center' },
                ]}
                gridColumns={WEAPON_GRID}
                chips={w.chips}
                chipsLabel={w.chips?.length ? 'Properties & Proficiencies' : undefined}
                rightSlot={rightSlot}
                compact={compactRows}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">No weapons</p>
      )}
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
};

export function ShieldsListSection({
  title = 'Shields',
  items,
  showListHeader = true,
  compactRows = true,
  showTitle = true,
}: {
  title?: string;
  items: EntityShieldRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  showTitle?: boolean;
}) {
  const hasAny = items.length > 0;
  return (
    <div>
      {showTitle && <SectionHeader title={title} size="sm" />}
      {showListHeader && hasAny && <ListHeader columns={SHIELD_COLUMNS} gridColumns={SHIELD_GRID} />}
      {hasAny ? (
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
                columns={columns}
                gridColumns={SHIELD_GRID}
                chips={s.chips}
                chipsLabel={s.chips?.length ? 'Properties & Proficiencies' : undefined}
                compact={compactRows}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">No shields</p>
      )}
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
};

export function ArmorListSection({
  title = 'Armor',
  items,
  showListHeader = true,
  compactRows = true,
  showTitle = true,
}: {
  title?: string;
  items: EntityArmorRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  showTitle?: boolean;
}) {
  const hasAny = items.length > 0;
  return (
    <div>
      {showTitle && <SectionHeader title={title} size="sm" />}
      {showListHeader && hasAny && <ListHeader columns={ARMOR_COLUMNS} gridColumns={ARMOR_GRID} />}
      {hasAny ? (
        <div className="space-y-1">
          {items.map((a, idx) => (
            <GridListRow
              key={String(a.id ?? `${a.name}-${idx}`)}
              id={String(a.id ?? idx)}
              name={a.name}
              description={a.description}
              columns={[
                { key: 'dr', value: a.damageReduction ?? a.armorValue ?? '-', align: 'center' },
                { key: 'crit', value: '-', align: 'center' },
              ]}
              gridColumns={ARMOR_GRID}
              chips={a.chips}
              chipsLabel={a.chips?.length ? 'Properties & Proficiencies' : undefined}
              compact={compactRows}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">No armor</p>
      )}
    </div>
  );
}

export type EntityEquipmentRow = {
  id?: string | number;
  name: string;
  description?: string;
  type?: string;
  quantity?: number;
};

export function EquipmentListSection({
  title = 'Equipment',
  items,
  showListHeader = true,
  compactRows = true,
}: {
  title?: string;
  items: EntityEquipmentRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
}) {
  const hasAny = items.length > 0;
  return (
    <div>
      <SectionHeader title={title} size="sm" />
      {showListHeader && hasAny && <ListHeader columns={EQUIPMENT_COLUMNS} gridColumns={EQUIPMENT_GRID} />}
      {hasAny ? (
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
                columns={columns}
                gridColumns={EQUIPMENT_GRID}
                compact={compactRows}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">No equipment</p>
      )}
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
};

export function FeatsTraitsListSection({
  title = 'Feats',
  items,
  showListHeader = true,
  compactRows = true,
  showTitle = true,
}: {
  title?: string;
  items: EntityFeatRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  showTitle?: boolean;
}) {
  const hasAny = items.length > 0;

  // Keep row rendering stable and cheap for large lists
  const rows = useMemo(() => items, [items]);

  return (
    <div>
      {showTitle && <SectionHeader title={title} size="sm" />}
      {showListHeader && hasAny && <ListHeader columns={FEAT_COLUMNS} gridColumns={FEAT_GRID} />}
      {hasAny ? (
        <div className="space-y-1">
          {rows.map((feat, index) => {
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
                        { key: 'description', value: truncateText(feat.description, uses ? 60 : 100), hideOnMobile: true },
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
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">No feats</p>
      )}
    </div>
  );
}

