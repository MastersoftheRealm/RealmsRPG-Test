import { mapSelectedToCharacterItems } from '@/components/character-sheet/add-library-item/map-selection';
import type { Character, CharacterPower, CharacterTechnique, Item } from '@/types';
import type { LibraryItem, LibraryPower, LibraryTechnique } from '@/types/library';
import type { CodexDbRefs } from './types';

export type LibraryToCharacterKind = 'power' | 'technique' | 'weapon' | 'armor' | 'shield';

export type LibraryToCharacterRaw = LibraryPower | LibraryTechnique | LibraryItem;

export function libraryItemRowId(raw: { id?: string; docId?: string }): string {
  return String(raw.docId ?? raw.id ?? '');
}

function equipmentListForKind(
  character: Character,
  kind: 'weapon' | 'armor' | 'shield'
): Item[] {
  if (kind === 'weapon') return (character.equipment?.weapons as Item[]) || [];
  if (kind === 'armor') return (character.equipment?.armor as Item[]) || [];
  return (character.equipment?.shields as Item[]) || [];
}

export function characterOwnsLibraryItem(
  character: Character,
  kind: LibraryToCharacterKind,
  itemId: string
): boolean {
  const id = itemId.trim();
  if (!id) return false;
  if (kind === 'power') {
    return (character.powers ?? []).some((entry) => String(entry.id) === id);
  }
  if (kind === 'technique') {
    return (character.techniques ?? []).some((entry) => String(entry.id) === id);
  }
  return equipmentListForKind(character, kind).some((entry) => String(entry.id) === id);
}

export function mapLibraryPowerToCharacter(
  power: LibraryPower,
  dbs: CodexDbRefs
): CharacterPower {
  const items = mapSelectedToCharacterItems(
    'power',
    [{ id: libraryItemRowId(power), name: power.name, data: power }],
    'powers',
    dbs
  );
  return items[0] as CharacterPower;
}

export function mapLibraryTechniqueToCharacter(
  technique: LibraryTechnique,
  dbs: CodexDbRefs
): CharacterTechnique {
  const items = mapSelectedToCharacterItems(
    'technique',
    [{ id: libraryItemRowId(technique), name: technique.name, data: technique }],
    'powers',
    dbs
  );
  return items[0] as CharacterTechnique;
}

export function mapLibraryArmamentToCharacter(
  item: LibraryItem,
  kind: 'weapon' | 'armor' | 'shield',
  dbs: CodexDbRefs
): Item {
  const id = libraryItemRowId(item);
  const items = mapSelectedToCharacterItems(
    kind,
    [{ id, name: item.name, data: { ...item, id, type: kind } }],
    'powers',
    dbs
  );
  return items[0] as Item;
}

export function appendLibraryItemToCharacter(
  character: Character,
  kind: LibraryToCharacterKind,
  raw: LibraryToCharacterRaw,
  dbs: CodexDbRefs
): Character {
  if (kind === 'power') {
    const next = mapLibraryPowerToCharacter(raw as LibraryPower, dbs);
    return { ...character, powers: [...(character.powers || []), next] };
  }
  if (kind === 'technique') {
    const next = mapLibraryTechniqueToCharacter(raw as LibraryTechnique, dbs);
    return { ...character, techniques: [...(character.techniques || []), next] };
  }
  const next = mapLibraryArmamentToCharacter(raw as LibraryItem, kind, dbs);
  const equipment = { ...character.equipment };
  if (kind === 'weapon') {
    equipment.weapons = [...((equipment.weapons as Item[]) || []), next];
  } else if (kind === 'armor') {
    equipment.armor = [...((equipment.armor as Item[]) || []), next];
  } else {
    equipment.shields = [...((equipment.shields as Item[]) || []), next];
  }
  return { ...character, equipment };
}

export function entityBucketLabel(kind: LibraryToCharacterKind, possessive = false): string {
  if (kind === 'power') return possessive ? "character's powers" : 'powers';
  if (kind === 'technique') return possessive ? "character's techniques" : 'techniques';
  if (kind === 'weapon') return possessive ? "character's weapons" : 'weapons';
  if (kind === 'armor') return possessive ? "character's armor" : 'armor';
  return possessive ? "character's shields" : 'shields';
}

export function isArmamentKind(
  kind: LibraryToCharacterKind
): kind is 'weapon' | 'armor' | 'shield' {
  return kind === 'weapon' || kind === 'armor' || kind === 'shield';
}
