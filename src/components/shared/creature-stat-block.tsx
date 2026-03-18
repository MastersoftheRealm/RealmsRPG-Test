'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { GridListRow } from './grid-list-row';
import type { ColumnValue } from '@/components/shared/grid-list-row';
import {
  PowersListSection,
  TechniquesListSection,
  FeatsTraitsListSection,
  WeaponsListSection,
  ShieldsListSection,
  ArmorListSection,
  type EntityFeatRow,
  type EntityPowerRow,
  type EntityTechniqueRow,
} from './entity-library-sections';
import { SectionHeader } from './section-header';
import { ListHeader, type ListColumn } from './list-header';
import { QuickArmorTable, QuickShieldsTable, QuickWeaponsTable } from './quick-armaments-sections';
import { RollButton } from './roll-button';
import { useRollsOptional } from '@/components/character-sheet/roll-context';
import { useCodexSkills } from '@/hooks';
import { calculateSkillBonusWithProficiency } from '@/lib/game/formulas';
import { formatDamageDisplay, normalizeRangeDisplay } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface CreatureAbilities {
  strength?: number;
  vitality?: number;
  agility?: number;
  acuity?: number;
  intelligence?: number;
  charisma?: number;
  /** @deprecated Use intelligence - legacy D&D-style */
  intellect?: number;
  /** @deprecated Use acuity - legacy D&D-style */
  perception?: number;
  /** @deprecated Use charisma - legacy D&D-style */
  willpower?: number;
  [key: string]: number | undefined;
}

export interface CreatureDefenses {
  might?: number;
  fortitude?: number;
  reflex?: number;
  discernment?: number;
  mentalFortitude?: number;
  resolve?: number;
  [key: string]: number | undefined;
}

export interface CreatureData {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  level?: number;
  type?: string;
  size?: string;
  hp?: number;
  hitPoints?: number;
  energyPoints?: number;
  abilities?: CreatureAbilities;
  defenses?: CreatureDefenses;
  powerProficiency?: number;
  martialProficiency?: number;
  resistances?: string[];
  weaknesses?: string[];
  immunities?: string[];
  conditionImmunities?: string[];
  senses?: string[];
  movementTypes?: string[];
  languages?: string[];
  skills?: Array<{ id?: string; name: string; value: number; proficient?: boolean; baseSkillId?: string; isSubSkill?: boolean }> | Record<string, number>;
  powers?: Array<{ name: string; description?: string; energy?: number; action?: string; area?: string; duration?: string; damage?: string; innate?: boolean }>;
  techniques?: Array<{ name: string; description?: string }>;
  feats?: Array<{ name: string; description?: string }>;
  armaments?: Array<{
    name: string;
    description?: string;
    type?: string;
    damage?: string;
    range?: string;
    armorValue?: number;
    damageReduction?: number;
    properties?: Array<{ id?: number; name?: string; op_1_lvl?: number }>;
  }>;
}

export interface CreatureStatBlockProps {
  creature: CreatureData;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  showActions?: boolean;
  expanded?: boolean;
  compact?: boolean;
  className?: string;
}

function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

const REALMS_ABILITY_ORDER = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'] as const;
const REALMS_ABILITY_ABBR: Record<(typeof REALMS_ABILITY_ORDER)[number], string> = {
  strength: 'STR',
  vitality: 'VIT',
  agility: 'AGI',
  acuity: 'ACU',
  intelligence: 'INT',
  charisma: 'CHA',
};

const DEFENSES_BY_ABILITY: Array<{
  ability: (typeof REALMS_ABILITY_ORDER)[number];
  defenseKey: keyof CreatureDefenses;
  abbr: string;
  label: string;
}> = [
  { ability: 'strength', defenseKey: 'might', abbr: 'MGT', label: 'Might' },
  { ability: 'vitality', defenseKey: 'fortitude', abbr: 'FRT', label: 'Fortitude' },
  { ability: 'agility', defenseKey: 'reflex', abbr: 'RFL', label: 'Reflex' },
  { ability: 'acuity', defenseKey: 'discernment', abbr: 'DSC', label: 'Discernment' },
  { ability: 'intelligence', defenseKey: 'mentalFortitude', abbr: 'MFO', label: 'Mental Fortitude' },
  { ability: 'charisma', defenseKey: 'resolve', abbr: 'RSV', label: 'Resolve' },
];
const LEGACY_ABILITY_MAP: Record<string, string> = {
  intellect: 'intelligence',
  perception: 'acuity',
  willpower: 'charisma',
};

const SENSE_DESCRIPTIONS: Record<string, string> = {
  Darkvision: 'See in darkness up to 6 spaces as if it were dim light.',
  'Darkvision II': 'See in darkness up to 12 spaces as if it were dim light.',
  'Darkvision III': 'See in darkness up to 24 spaces as if it were dim light.',
  Blindsense: 'Detect creatures within 3 spaces without relying on sight.',
  'Blindsense II': 'Detect creatures within 6 spaces without relying on sight.',
  'Blindsense III': 'Detect creatures within 12 spaces without relying on sight.',
  Amphibious: 'Can breathe air and water.',
  'All-Surface Climber': 'Can climb difficult surfaces, including ceilings, without checks.',
  Telepathy: 'Mentally communicate with creatures within 12 spaces.',
  'Telepathy II': 'Mentally communicate with creatures within 48 spaces.',
  Waterbreathing: 'Can breathe underwater.',
  'Unrestrained Movement': 'Movement is unaffected by difficult terrain and restraining movement effects.',
};

const MOVEMENT_DESCRIPTIONS: Record<string, string> = {
  Walk: 'Uses normal speed on the ground.',
  Climb: 'Can move along vertical surfaces using movement speed.',
  Swim: 'Can move through water without penalties using movement speed.',
  Fly: 'Can move through the air using movement speed (see Flight rules for altitude and fall).',
  Burrow: 'Can move through loose earth using movement speed (may leave a tunnel at GM discretion).',
};

const SIMPLE_LIST_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: 'minmax(160px, 1fr)' },
  { key: 'description', label: 'Description', width: '2fr', sortable: false },
];
const SIMPLE_LIST_GRID = 'minmax(160px, 1fr) 2fr';

function formatArchetype(power = 0, martial = 0): string {
  if (power > 0 && martial > 0) return 'Powered-Martial';
  if (power > 0) return 'Power';
  if (martial > 0) return 'Martial';
  return 'None';
}

function getAbilityValue(abilities: CreatureAbilities, key: (typeof REALMS_ABILITY_ORDER)[number]): number {
  const direct = abilities[key];
  if (typeof direct === 'number') return direct;
  const legacy = Object.entries(LEGACY_ABILITY_MAP).find(([, mapped]) => mapped === key)?.[0];
  return typeof legacy === 'string' && typeof abilities[legacy] === 'number' ? abilities[legacy] as number : 0;
}

function compactLine(label: string, items?: string[]): string | null {
  if (!items || items.length === 0) return null;
  return `${label} ${items.join(', ')}`;
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
  return { dice: formatted ? String(formatted) : '-', type: '', rollStr: formatted ? String(formatted) : '-' };
}

interface StatBlockSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function StatBlockSection({ title, defaultExpanded = true, children }: StatBlockSectionProps) {
  const [open, setOpen] = useState(defaultExpanded);
  return (
    <div>
      <SectionHeader
        title={title}
        size="sm"
        rightContent={
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center justify-center w-7 h-7 rounded-full border border-border-light text-text-muted hover:bg-surface-alt hover:text-text-primary transition-colors"
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          >
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform',
                open ? 'rotate-180' : 'rotate-0'
              )}
            />
          </button>
        }
      />
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}

export function CreatureStatBlock({
  creature,
  onEdit,
  onDelete,
  onDuplicate,
  showActions = true,
  expanded: initialExpanded = false,
  compact = false,
  className,
}: CreatureStatBlockProps) {
  const rollContext = useRollsOptional();
  const { data: skillsDb = [] } = useCodexSkills();
  const hp = creature.hitPoints ?? creature.hp ?? 0;
  const ep = creature.energyPoints ?? 0;
  const archetype = formatArchetype(creature.powerProficiency, creature.martialProficiency);
  const subline = `Level ${creature.level ?? 1} ${creature.size ? `${String(creature.size).charAt(0).toUpperCase()}${String(creature.size).slice(1)}` : 'Medium'} ${creature.type ?? 'Creature'}`;

  const highestAbility = useMemo(() => {
    const abilities = creature.abilities ?? {};
    const entries = REALMS_ABILITY_ORDER.map((k) => ({ key: k, val: getAbilityValue(abilities, k) }));
    entries.sort((a, b) => b.val - a.val);
    const top = entries[0] ?? { key: 'strength' as const, val: 0 };
    const keyName = top.key;
    const displayName = keyName.charAt(0).toUpperCase() + keyName.slice(1);
    return { key: keyName, value: top.val, displayName };
  }, [creature.abilities]);

  const defensesSentence = (() => {
    const defs = creature.defenses ?? {};
    const parts = DEFENSES_BY_ABILITY
      .map((d) => ({ ...d, bonus: typeof defs[d.defenseKey] === 'number' ? (defs[d.defenseKey] as number) : 0 }))
      .filter((d) => d.bonus !== 0)
      .map((d) => `${d.label} ${formatModifier(getAbilityValue(creature.abilities ?? {}, d.ability) + d.bonus)}`);
    return parts.length ? `Defenses ${parts.join(', ')}` : null;
  })();

  const agility = getAbilityValue(creature.abilities ?? {}, 'agility');
  const sizeMod = (() => {
    const s = String(creature.size ?? '').toLowerCase();
    if (s === 'small') return 1;
    if (s === 'large') return -1;
    return 0;
  })();
  const speed = 6 + Math.ceil(agility / 2) + sizeMod;
  const evasion = 10 + agility;

  const armaments = Array.isArray(creature.armaments) ? creature.armaments : [];
  const weapons = armaments.filter((a) => String(a.type ?? '').toLowerCase() === 'weapon');
  const shields = armaments.filter((a) => String(a.type ?? '').toLowerCase() === 'shield');
  const armor = armaments.filter((a) => String(a.type ?? '').toLowerCase() === 'armor');
  const equipment = armaments.filter((a) => !['weapon', 'shield', 'armor'].includes(String(a.type ?? '').toLowerCase()));

  const senses = creature.senses ?? [];
  const movement = creature.movementTypes ?? [];
  const hasSensesOrMovement = senses.length > 0 || movement.length > 0;
  const creatureSkills = useMemo(() => {
    if (!creature.skills) return [] as Array<{ id?: string; name: string; value: number; proficient: boolean; baseSkillId?: string; isSubSkill?: boolean }>;
    if (Array.isArray(creature.skills)) {
      return creature.skills.map((s) => ({ ...s, proficient: s.proficient !== false }));
    }
    // Record fallback: treat as proficient base skills with value
    return Object.entries(creature.skills).map(([name, value]) => ({
      id: undefined,
      name,
      value: Number(value) || 0,
      proficient: true,
    }));
  }, [creature.skills]);
  const hasSkills = creatureSkills.length > 0;
  const hasFeats = (creature.feats ?? []).length > 0;
  const hasWeapons = weapons.length > 0;
  const hasShields = shields.length > 0;
  const hasArmor = armor.length > 0;
  const hasPowers = (creature.powers ?? []).length > 0;
  const hasTechniques = (creature.techniques ?? []).length > 0;
  const hasEquipment = equipment.length > 0;

  const damageReduction = useMemo(() => {
    return armaments.reduce((sum, item) => {
      if (typeof item.damageReduction === 'number') return sum + item.damageReduction;
      if (typeof item.armorValue === 'number') return sum + item.armorValue;
      const props = item.properties || [];
      const dr = props.find((p) => p.id === 17 || String(p.name ?? '').toLowerCase() === 'damage reduction');
      return sum + (dr ? 1 + (dr.op_1_lvl ?? 0) : 0);
    }, 0);
  }, [armaments]);

  const summaryLines = [
    compactLine('Resistances', creature.resistances),
    compactLine('Weaknesses', creature.weaknesses),
    compactLine('Immunities', creature.immunities),
    compactLine('Languages', creature.languages),
    defensesSentence,
  ].filter((line): line is string => Boolean(line));

  const headerColumns: ColumnValue[] = [
    { key: 'level', value: creature.level ?? 1, align: 'center' },
    { key: 'size', value: creature.size ?? '-', align: 'center' },
    { key: 'type', value: creature.type ?? '-', align: 'center' },
    {
      key: 'archetype',
      value: archetype,
      align: 'center',
      className:
        archetype === 'Power'
          ? 'text-power-dark'
          : archetype === 'Martial'
            ? 'text-martial-dark'
            : archetype === 'Powered-Martial'
              ? 'text-power-dark'
              : undefined,
    },
    { key: 'hp', value: hp, align: 'center', highlight: true },
    { key: 'en', value: ep, align: 'center' },
  ];

  return (
    <GridListRow
      id={creature.id}
      name={creature.name}
      description={subline}
      columns={headerColumns}
      gridColumns="1.8fr 0.6fr 0.8fr 1fr 1fr 0.6fr 0.6fr"
      onEdit={showActions ? onEdit : undefined}
      onDelete={showActions ? onDelete : undefined}
      onDuplicate={showActions ? onDuplicate : undefined}
      defaultExpanded={initialExpanded}
      className={cn('border-border-light', className)}
      expandedContent={
        <div className="space-y-4">
          {/* Header (character-sheet style, simplified) */}
          <div className="bg-surface rounded-xl shadow-md p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-stretch">
              {creature.imageUrl ? (
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-border-light bg-surface-alt flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={creature.imageUrl} alt={`${creature.name} portrait`} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg border border-border-light bg-surface-alt flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-text-primary truncate">{creature.name}</h3>
                <p className="text-sm text-text-secondary">{subline}</p>
                <p className="text-sm font-semibold text-text-primary">
                  <span className={archetype === 'Power' ? 'text-power-dark' : archetype === 'Martial' ? 'text-martial-dark' : archetype === 'Powered-Martial' ? 'text-power-dark' : undefined}>
                    {archetype}
                  </span>
                  : <span className="text-text-primary">{highestAbility.displayName}</span>
                </p>
              </div>

              {/* Speed/Evasion/HP/EN to the right - single evenly spaced row on desktop */}
              <div className="w-full md:flex-1 md:max-w-xl md:ml-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col p-3 rounded-lg border bg-surface-alt dark:bg-surface border-border-light dark:border-border min-w-[92px]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary dark:text-text-primary">Speed</span>
                  <span className="text-lg font-bold text-text-primary">{speed}</span>
                  </div>
                  <div className="flex flex-col p-3 rounded-lg border bg-surface-alt dark:bg-surface border-border-light dark:border-border min-w-[92px]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary dark:text-text-primary">Evasion</span>
                  <span className="text-lg font-bold text-text-primary">{evasion}</span>
                  </div>
                  <div className="flex flex-col p-3 rounded-lg border bg-success-50 dark:bg-surface border-success-200 dark:border-success-800/50 min-w-[92px]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-success-700 dark:text-success-400">Health</span>
                  <span className="text-lg font-bold text-success-800 dark:text-success-300">{hp}</span>
                  </div>
                  <div className="flex flex-col p-3 rounded-lg border bg-info-50 dark:bg-surface border-info-200 dark:border-info-800/50 min-w-[92px]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-info-700 dark:text-info-400">Energy</span>
                  <span className="text-lg font-bold text-info-800 dark:text-info-300">{ep}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Abilities row (mini boxes with roll buttons) */}
            {creature.abilities && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
                {REALMS_ABILITY_ORDER.map((k) => {
                  const abbr = REALMS_ABILITY_ABBR[k];
                  const val = getAbilityValue(creature.abilities!, k);
                  const defenseMeta = DEFENSES_BY_ABILITY.find((d) => d.ability === k);
                  const defenseBonus = defenseMeta && creature.defenses && typeof creature.defenses[defenseMeta.defenseKey] === 'number'
                    ? (creature.defenses[defenseMeta.defenseKey] as number)
                    : 0;
                  const showDefense = defenseBonus !== 0 && defenseMeta != null;
                  const defenseTotal = val + defenseBonus;
                  return (
                    <div key={k} className="rounded-lg border border-border-light bg-surface-alt px-2 py-2">
                      <div className={cn('grid gap-1', showDefense ? 'grid-cols-2' : 'grid-cols-1')}>
                        <div className="text-[11px] font-semibold text-text-secondary text-center">{abbr}</div>
                        {showDefense && (
                          <div className="text-[11px] font-semibold text-text-secondary text-center">{defenseMeta!.abbr}</div>
                        )}
                      </div>
                      {rollContext?.canRoll !== false && rollContext ? (
                        <div className={cn('mt-1 grid gap-1', showDefense ? 'grid-cols-2' : 'grid-cols-1')}>
                          <div className="flex justify-center">
                            <RollButton
                              value={val}
                              onClick={() => rollContext.rollAbility(`${creature.name}: ${abbr}`, val)}
                              size="sm"
                              title={`Roll ${abbr}`}
                            />
                          </div>
                          {showDefense && (
                            <div className="flex justify-center">
                              <RollButton
                                value={defenseTotal}
                                onClick={() => rollContext.rollDefense(`${creature.name}: ${defenseMeta!.abbr}`, defenseTotal)}
                                size="sm"
                                title={`Roll ${defenseMeta!.label}`}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={cn('mt-1 grid gap-1 text-sm font-bold text-text-primary tabular-nums', showDefense ? 'grid-cols-2' : 'grid-cols-1')}>
                          <div className="text-center">{formatModifier(val)}</div>
                          {showDefense && <div className="text-center">{formatModifier(defenseTotal)}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sentence-style lines (kept compact) */}
            <div className="mt-4 space-y-1">
              {summaryLines.map((line) => (
                <p key={line} className="text-sm text-text-primary">{line}</p>
              ))}
              <p className="text-sm text-text-primary"><strong>Damage Reduction</strong> {damageReduction}</p>
            </div>
          </div>

          {/* Sections start full-width under the header */}
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-4">
              {hasSensesOrMovement && (
                <>
                  {senses.length > 0 && (
                    <StatBlockSection title="Senses" defaultExpanded>
                      <ListHeader columns={SIMPLE_LIST_COLUMNS} gridColumns={SIMPLE_LIST_GRID} />
                      <div className="space-y-1 mt-2">
                        {senses.map((sense) => (
                          <GridListRow
                            key={`${creature.id}-sense-${sense}`}
                            id={`${creature.id}-sense-${sense}`}
                            name={sense}
                            description={SENSE_DESCRIPTIONS[sense] ?? 'No description available.'}
                            columns={[{ key: 'description', value: SENSE_DESCRIPTIONS[sense] ?? 'No description available.' }]}
                            gridColumns={SIMPLE_LIST_GRID}
                            compact
                          />
                        ))}
                      </div>
                    </StatBlockSection>
                  )}

                  {movement.length > 0 && (
                    <StatBlockSection title="Movement" defaultExpanded>
                      <ListHeader columns={SIMPLE_LIST_COLUMNS} gridColumns={SIMPLE_LIST_GRID} />
                      <div className="space-y-1 mt-2">
                        {movement.map((m) => (
                          <GridListRow
                            key={`${creature.id}-move-${m}`}
                            id={`${creature.id}-move-${m}`}
                            name={m}
                            description={MOVEMENT_DESCRIPTIONS[m] ?? 'See movement rules for details.'}
                            columns={[
                              {
                                key: 'description',
                                value: MOVEMENT_DESCRIPTIONS[m] ?? 'See movement rules for details.',
                              },
                            ]}
                            gridColumns={SIMPLE_LIST_GRID}
                            compact
                          />
                        ))}
                      </div>
                    </StatBlockSection>
                  )}
                </>
              )}

              {hasSkills && (
                <StatBlockSection title="Skills" defaultExpanded>
                  <ListHeader
                    columns={[
                      { key: 'name', label: 'Name', width: '1.2fr' },
                      { key: 'ability', label: 'Ability', width: '0.7fr', align: 'center' },
                      { key: 'bonus', label: 'Bonus', width: '0.7fr', align: 'center' },
                    ]}
                    gridColumns="1.2fr 0.7fr 0.7fr"
                  />
                  <div className="space-y-1 mt-2">
                    {creatureSkills.map((s, idx) => {
                      const def = skillsDb.find((d) =>
                        (s.id != null && String(d.id) === String(s.id)) ||
                        (d.name != null && d.name.toLowerCase() === s.name.toLowerCase())
                      );
                      const linked = def?.ability ?? '';
                      // Choose highest ability for multi-ability skills (formula helper already does this)
                      const bonus = calculateSkillBonusWithProficiency(linked, s.value ?? 0, creature.abilities as any, s.proficient !== false);
                      // Derive the chosen ability (for display) — pick highest among linked ability keys
                      const abilityKeys = String(linked)
                        .split(',')
                        .map((a) => a.trim().toLowerCase())
                        .filter(Boolean) as Array<(typeof REALMS_ABILITY_ORDER)[number]>;
                      const chosen =
                        abilityKeys.length > 0
                          ? abilityKeys
                              .map((k) => ({ k, v: getAbilityValue(creature.abilities ?? {}, k) }))
                              .sort((a, b) => b.v - a.v)[0]?.k
                          : undefined;
                      const abilityAbbr = chosen ? REALMS_ABILITY_ABBR[chosen] : '—';
                      const skillDescription = def?.description || undefined;
                      return (
                        <GridListRow
                          key={`${creature.id}-skill-${s.name}-${idx}`}
                          id={`${creature.id}-skill-${idx}`}
                          name={s.name}
                          description={skillDescription}
                          gridColumns="1.2fr 0.7fr 0.7fr"
                          columns={[
                            { key: 'ability', value: abilityAbbr, align: 'center' },
                            {
                              key: 'bonus',
                              value:
                                rollContext?.canRoll !== false && rollContext ? (
                                  <div className="flex justify-center">
                                    <RollButton
                                      value={bonus}
                                      onClick={() => rollContext.rollSkill(`${creature.name}: ${s.name}`, bonus, abilityAbbr)}
                                      size="sm"
                                      title={`Roll ${s.name}`}
                                    />
                                  </div>
                                ) : (
                                  formatModifier(bonus)
                                ),
                              align: 'center',
                            },
                          ]}
                          compact
                        />
                      );
                    })}
                  </div>
                </StatBlockSection>
              )}

              {hasFeats && (
                <StatBlockSection title="Creature Feats" defaultExpanded>
                  <FeatsTraitsListSection
                    title="Creature Feats"
                    showListHeader
                    compactRows
                    items={(creature.feats ?? []).map(
                      (f, idx): EntityFeatRow => ({
                        id: `${creature.id}-feat-${idx}`,
                        name: f.name,
                        description: f.description,
                      })
                    )}
                  />
                </StatBlockSection>
              )}
            </div>

            <div className="space-y-4">

              {hasWeapons && (
                <StatBlockSection title="Weapons" defaultExpanded>
                  <WeaponsListSection
                    title="Weapons"
                    items={weapons.map((w, idx) => ({
                      id: `${creature.id}-w-${idx}`,
                      name: w.name,
                      description: w.description,
                      damage: w.damage,
                      range: normalizeRangeDisplay(w.range) || 'Melee',
                    }))}
                    showListHeader
                    compactRows
                  />
                </StatBlockSection>
              )}

              {hasShields && (
                <StatBlockSection title="Shields" defaultExpanded>
                  <ShieldsListSection
                    title="Shields"
                    items={shields.map((s, idx) => ({
                      id: `${creature.id}-s-${idx}`,
                      name: s.name,
                      description: s.description,
                      damage: s.damage,
                      properties: s.properties,
                    }))}
                    showListHeader
                    compactRows
                  />
                </StatBlockSection>
              )}

              {hasArmor && (
                <StatBlockSection title="Armor" defaultExpanded>
                  <ArmorListSection
                    title="Armor"
                    items={armor.map((a, idx) => ({
                      id: `${creature.id}-a-${idx}`,
                      name: a.name,
                      description: a.description,
                      damageReduction: a.damageReduction,
                      armorValue: a.armorValue,
                    }))}
                    showListHeader
                    compactRows
                  />
                </StatBlockSection>
              )}

              {hasPowers && (
                <StatBlockSection title="Powers" defaultExpanded>
                  <PowersListSection
                    items={(creature.powers ?? []).map(
                      (p, idx): EntityPowerRow => ({
                        id: `${creature.id}-power-${idx}`,
                        name: p.name,
                        description: p.description,
                        actionType: p.action,
                        damage: p.damage,
                        area: p.area,
                        duration: p.duration,
                        energyCost: p.energy,
                        innate: p.innate,
                      })
                    )}
                    showListHeader
                    compactRows
                    includeEnergyColumn
                    showTitle={false}
                  />
                </StatBlockSection>
              )}

              {hasTechniques && (
                <StatBlockSection title="Techniques" defaultExpanded>
                  <TechniquesListSection
                    items={(creature.techniques ?? []).map(
                      (t, idx): EntityTechniqueRow => ({
                        id: `${creature.id}-tech-${idx}`,
                        name: t.name,
                        description: t.description,
                      })
                    )}
                    showListHeader
                    compactRows
                    showTitle={false}
                  />
                </StatBlockSection>
              )}

              {hasEquipment && (
                <StatBlockSection title="Equipment" defaultExpanded>
                  <ListHeader
                    columns={[
                      { key: 'name', label: 'Name', width: '1fr' },
                      { key: 'type', label: 'Type', width: '0.6fr', align: 'center' },
                      { key: 'quantity', label: 'Qty', width: '4rem', align: 'center' },
                    ]}
                    gridColumns="1fr 0.6fr 4rem"
                  />
                  <div className="space-y-1 mt-2">
                    {equipment.map((e, idx) => (
                      <GridListRow
                        key={`${creature.id}-equipment-${idx}`}
                        id={`${creature.id}-equipment-${idx}`}
                        name={e.name}
                        description={e.description}
                        gridColumns="1fr 0.6fr 4rem"
                        columns={[
                          { key: 'type', value: e.type ? e.type.charAt(0).toUpperCase() + e.type.slice(1) : '-', align: 'center' },
                          { key: 'quantity', value: (e as { quantity?: number }).quantity ?? 1, align: 'center' },
                        ]}
                        compact
                      />
                    ))}
                  </div>
                </StatBlockSection>
              )}
            </div>
          </div>

          {/* Full-width Description section below stats + sections */}
          {creature.description && (
            <div className="mt-4">
              <SectionHeader title="Description" size="sm" />
              <div className="mt-1 rounded-lg bg-surface p-3 border border-border-light">
                <p className="text-sm text-text-secondary whitespace-pre-wrap">
                  {creature.description}
                </p>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}

export default CreatureStatBlock;
