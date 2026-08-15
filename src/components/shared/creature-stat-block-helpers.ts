import type { ChipData } from '@/components/shared/grid-list-row';
import type { ListColumn } from './list-header';
import type { CreatureAbilities, CreatureDefenses } from './creature-stat-block-types';

export function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

export const REALMS_ABILITY_ORDER = [
  'strength',
  'vitality',
  'agility',
  'acuity',
  'intelligence',
  'charisma',
] as const;
export const REALMS_ABILITY_ABBR: Record<(typeof REALMS_ABILITY_ORDER)[number], string> = {
  strength: 'STR',
  vitality: 'VIT',
  agility: 'AGI',
  acuity: 'ACU',
  intelligence: 'INT',
  charisma: 'CHA',
};

export const DEFENSES_BY_ABILITY: Array<{
  ability: (typeof REALMS_ABILITY_ORDER)[number];
  defenseKey: keyof CreatureDefenses;
  abbr: string;
  label: string;
}> = [
  { ability: 'strength', defenseKey: 'might', abbr: 'MGT', label: 'Might' },
  { ability: 'vitality', defenseKey: 'fortitude', abbr: 'FRT', label: 'Fortitude' },
  { ability: 'agility', defenseKey: 'reflex', abbr: 'RFL', label: 'Reflex' },
  { ability: 'acuity', defenseKey: 'discernment', abbr: 'DSC', label: 'Discernment' },
  {
    ability: 'intelligence',
    defenseKey: 'mentalFortitude',
    abbr: 'MFO',
    label: 'Mental Fortitude',
  },
  { ability: 'charisma', defenseKey: 'resolve', abbr: 'RSV', label: 'Resolve' },
];
const LEGACY_ABILITY_MAP: Record<string, string> = {
  intellect: 'intelligence',
  perception: 'acuity',
  willpower: 'charisma',
};

export const SENSE_DESCRIPTIONS: Record<string, string> = {
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
  'Unrestrained Movement':
    'Movement is unaffected by difficult terrain and restraining movement effects.',
};

export const MOVEMENT_DESCRIPTIONS: Record<string, string> = {
  Walk: 'Uses normal speed on the ground.',
  Climb: 'Can move along vertical surfaces using movement speed.',
  Swim: 'Can move through water without penalties using movement speed.',
  Fly: 'Can move through the air using movement speed (see Flight rules for altitude and fall).',
  Burrow:
    'Can move through loose earth using movement speed (may leave a tunnel at GM discretion).',
};

export const SIMPLE_LIST_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: 'minmax(160px, 1fr)' },
  { key: 'description', label: 'Description', width: '2fr' },
];
export const SIMPLE_LIST_GRID = 'minmax(160px, 1fr) 2fr';

export function formatArchetype(power = 0, martial = 0): string {
  if (power > 0 && martial > 0) return 'Powered-Martial';
  if (power > 0) return 'Power';
  if (martial > 0) return 'Martial';
  return 'None';
}

export function getAbilityValue(
  abilities: CreatureAbilities,
  key: (typeof REALMS_ABILITY_ORDER)[number],
): number {
  const direct = abilities[key];
  if (typeof direct === 'number') return direct;
  const legacy = Object.entries(LEGACY_ABILITY_MAP).find(([, mapped]) => mapped === key)?.[0];
  return typeof legacy === 'string' && typeof abilities[legacy] === 'number'
    ? (abilities[legacy] as number)
    : 0;
}

export function compactLine(label: string, items?: string[]): string | null {
  if (!items || items.length === 0) return null;
  return `${label} ${items.join(', ')}`;
}

export type CodexPart = {
  id: string | number;
  name?: string;
  description?: string;
  base_tp?: number;
  op_1_tp?: number;
  op_2_tp?: number;
  op_3_tp?: number;
  op_1_desc?: string;
  op_2_desc?: string;
  op_3_desc?: string;
};

export type CodexProperty = {
  id: string | number;
  name?: string;
  description?: string;
  base_tp?: number;
  tp_cost?: number;
};

export function partsToChips(
  parts:
    | Array<
        | string
        | {
            id?: string | number;
            name?: string;
            op_1_lvl?: number;
            op_2_lvl?: number;
            op_3_lvl?: number;
          }
      >
    | undefined,
  codexParts: CodexPart[],
): ChipData[] {
  if (!parts || parts.length === 0) return [];
  return parts.map((part) => {
    const partName = typeof part === 'string' ? part : part.name || String(part.id ?? 'Part');
    const codexPart = codexParts.find(
      (p) =>
        (typeof part === 'object' && part.id != null && String(p.id) === String(part.id)) ||
        String(p.name ?? '').toLowerCase() === String(partName).toLowerCase(),
    );
    const opt1 = typeof part === 'object' ? Number(part.op_1_lvl ?? 0) : 0;
    const opt2 = typeof part === 'object' ? Number(part.op_2_lvl ?? 0) : 0;
    const opt3 = typeof part === 'object' ? Number(part.op_3_lvl ?? 0) : 0;
    const tp =
      (codexPart?.base_tp ?? 0) +
      (codexPart?.op_1_tp ?? 0) * opt1 +
      (codexPart?.op_2_tp ?? 0) * opt2 +
      (codexPart?.op_3_tp ?? 0) * opt3;
    const options: Array<{ label: string; description?: string; level: number }> = [];
    if (opt1 > 0)
      options.push({ label: 'Option 1', description: codexPart?.op_1_desc, level: opt1 });
    if (opt2 > 0)
      options.push({ label: 'Option 2', description: codexPart?.op_2_desc, level: opt2 });
    if (opt3 > 0)
      options.push({ label: 'Option 3', description: codexPart?.op_3_desc, level: opt3 });
    return {
      name: codexPart?.name || partName,
      description: codexPart?.description,
      cost: tp > 0 ? tp : undefined,
      costLabel: 'Training Points',
      category: tp > 0 ? ('cost' as const) : ('default' as const),
      options: options.length > 0 ? options : undefined,
    };
  });
}

export function resolveArmamentProperties(item: {
  properties?: Array<{ id?: number; name?: string; op_1_lvl?: number }>;
  libraryItem?: { properties?: Array<{ id?: number; name?: string; op_1_lvl?: number }> };
}): Array<{ id?: number; name?: string; op_1_lvl?: number }> {
  const fromLib = item.libraryItem?.properties;
  if (fromLib && fromLib.length > 0) return fromLib;
  return item.properties || [];
}

export function propertiesToChips(
  properties: Array<{ id?: number; name?: string; op_1_lvl?: number }> | undefined,
  codexProperties: CodexProperty[],
): ChipData[] {
  if (!properties || properties.length === 0) return [];
  return properties.map((p) => {
    const codexProp = codexProperties.find(
      (cp) =>
        (p.id != null && String(cp.id) === String(p.id)) ||
        String(cp.name ?? '').toLowerCase() === String(p.name ?? '').toLowerCase(),
    );
    const level = Number(p.op_1_lvl ?? 1);
    const baseTp = codexProp?.base_tp ?? codexProp?.tp_cost ?? 0;
    const tp = baseTp * level;
    return {
      name: codexProp?.name || p.name || 'Property',
      description: codexProp?.description,
      cost: tp > 0 ? tp : undefined,
      costLabel: 'Training Points',
      category: tp > 0 ? ('cost' as const) : ('default' as const),
      level: level > 1 ? level : undefined,
    };
  });
}
