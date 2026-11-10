import type { Character } from '@/types';

/** Matches `assert_character_document_mapped` array entry allow-lists in Collin's SQL (read-only). */
export const RELATIONAL_SAVE_ENTRY_ALLOWLIST = {
  powers: ['id', 'name', 'innate', 'selectedVariantId'],
  techniques: ['id', 'name'],
  feats: ['id', 'name', 'description', 'currentUses', 'customName', 'note'],
  archetypeFeats: ['id', 'name', 'description', 'currentUses', 'customName', 'note'],
  proficiencies: [
    'kind',
    'id',
    'refId',
    'name',
    'damageType',
    'op1Level',
    'op2Level',
    'op3Level',
    'baseTP',
    'op1TP',
    'op2TP',
    'op3TP',
    'custom',
  ],
} as const;

const POWER_KEYS = new Set<string>(RELATIONAL_SAVE_ENTRY_ALLOWLIST.powers);
const TECHNIQUE_KEYS = new Set<string>(RELATIONAL_SAVE_ENTRY_ALLOWLIST.techniques);
const PROFICIENCY_KEYS = new Set<string>(RELATIONAL_SAVE_ENTRY_ALLOWLIST.proficiencies);

function pickAllowlisted(
  entry: Record<string, unknown>,
  allowed: Set<string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (entry[key] !== undefined) out[key] = entry[key];
  }
  return out;
}

/** Lean inventory row — mirrors `cleanForSave` equipment `cleanItem` (no `properties`). */
function leanInventoryItemForRelationalSave(item: unknown): Record<string, unknown> | null {
  if (typeof item === 'string') return { name: item };
  if (!item || typeof item !== 'object') return null;
  const i = item as Record<string, unknown>;
  const clean: Record<string, unknown> = {};
  if (i.id) clean.id = i.id;
  if (i.name) clean.name = i.name;
  if (i.equipped) clean.equipped = true;
  if (i.quantity === 0 || (i.quantity && i.quantity !== 1)) clean.quantity = i.quantity;
  const idStr = i.id != null ? String(i.id) : '';
  if (idStr.startsWith('custom-')) {
    if (i.type) clean.type = i.type;
    if (typeof i.description === 'string' && i.description.trim()) {
      clean.description = i.description.trim();
    }
  }
  return Object.keys(clean).length > 0 ? clean : null;
}

function leanPowerEntryForRelationalSave(entry: unknown): Record<string, unknown> | null {
  if (typeof entry === 'string') return pickAllowlisted({ name: entry }, POWER_KEYS);
  if (!entry || typeof entry !== 'object') return null;
  const power = entry as Record<string, unknown>;
  const clean = pickAllowlisted(power, POWER_KEYS);
  if (!clean.id && !clean.name) return null;
  clean.innate = !!power.innate;
  return clean;
}

function leanTechniqueEntryForRelationalSave(entry: unknown): Record<string, unknown> | null {
  if (typeof entry === 'string') return pickAllowlisted({ name: entry }, TECHNIQUE_KEYS);
  if (!entry || typeof entry !== 'object') return null;
  const tech = entry as Record<string, unknown>;
  const clean = pickAllowlisted(tech, TECHNIQUE_KEYS);
  return Object.keys(clean).length > 0 ? clean : null;
}

function leanProficiencyEntryForRelationalSave(entry: unknown): Record<string, unknown> | null {
  if (!entry || typeof entry !== 'object') return null;
  const clean = pickAllowlisted(entry as Record<string, unknown>, PROFICIENCY_KEYS);
  return Object.keys(clean).length > 0 ? clean : null;
}

export function leanPowersForRelationalSave(
  powers: Character['powers'] | undefined,
): Character['powers'] | undefined {
  if (!Array.isArray(powers)) return powers;
  return powers
    .map(leanPowerEntryForRelationalSave)
    .filter((row): row is Record<string, unknown> => row !== null) as Character['powers'];
}

export function leanTechniquesForRelationalSave(
  techniques: Character['techniques'] | undefined,
): Character['techniques'] | undefined {
  if (!Array.isArray(techniques)) return techniques;
  return techniques
    .map(leanTechniqueEntryForRelationalSave)
    .filter((row): row is Record<string, unknown> => row !== null) as Character['techniques'];
}

export function leanProficienciesForRelationalSave(
  proficiencies: Character['proficiencies'] | undefined,
): Character['proficiencies'] | undefined {
  if (!Array.isArray(proficiencies)) return proficiencies;
  return proficiencies
    .map(leanProficiencyEntryForRelationalSave)
    .filter((row): row is Record<string, unknown> => row !== null) as Character['proficiencies'];
}

export function leanEquipmentForRelationalSave(
  equipment: Character['equipment'] | undefined,
): Character['equipment'] | undefined {
  if (!equipment || typeof equipment !== 'object') return equipment;
  const equip = equipment as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const key of ['weapons', 'shields', 'items', 'accessories'] as const) {
    const list = equip[key];
    if (Array.isArray(list)) {
      const cleaned = list.map(leanInventoryItemForRelationalSave).filter(Boolean);
      if (cleaned.length) out[key] = cleaned;
    }
  }
  if (Array.isArray(equip.armor)) {
    const cleaned = equip.armor.map(leanInventoryItemForRelationalSave).filter(Boolean);
    if (cleaned.length) out.armor = cleaned;
  } else if (equip.armor && typeof equip.armor === 'object') {
    const lean = leanInventoryItemForRelationalSave(equip.armor);
    if (lean) out.armor = lean;
  }
  for (const slot of ['mainHand', 'offHand'] as const) {
    if (equip[slot] !== undefined) {
      const lean = leanInventoryItemForRelationalSave(equip[slot]);
      if (lean) out[slot] = lean;
    }
  }

  return Object.keys(out).length > 0 ? (out as Character['equipment']) : undefined;
}

/** Trim array fields on a save patch/document before relational RPCs. */
export function leanCharacterArrayFieldsForRelationalSave(cleaned: Record<string, unknown>): void {
  if (cleaned.powers !== undefined) {
    cleaned.powers = leanPowersForRelationalSave(cleaned.powers as Character['powers']);
  }
  if (cleaned.techniques !== undefined) {
    cleaned.techniques = leanTechniquesForRelationalSave(
      cleaned.techniques as Character['techniques'],
    );
  }
  if (cleaned.proficiencies !== undefined) {
    cleaned.proficiencies = leanProficienciesForRelationalSave(
      cleaned.proficiencies as Character['proficiencies'],
    );
  }
  if (cleaned.equipment !== undefined) {
    cleaned.equipment = leanEquipmentForRelationalSave(cleaned.equipment as Character['equipment']);
  }
}
