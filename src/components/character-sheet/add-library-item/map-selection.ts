import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { UserPower, UserTechnique } from '@/hooks/use-user-library';
import type { AddLibraryItemType, CodexDbRefs, EqItem, PowerSelectionMode } from '@/hooks/add-library-item/types';
import type { CharacterPower, CharacterTechnique, Item } from '@/types';

interface CodexPartLike {
  id?: string | number;
  name?: string;
  base_tp?: number;
  op_1_tp?: number;
  op_2_tp?: number;
  op_3_tp?: number;
}

interface SavedPartLike {
  id?: string | number;
  name?: string;
  op_1_lvl?: number;
  op_2_lvl?: number;
  op_3_lvl?: number;
  applyDuration?: boolean;
}

function findCodexPart(codexList: CodexPartLike[], part: SavedPartLike): CodexPartLike | undefined {
  const id = part.id != null ? String(part.id).trim().toLowerCase() : '';
  const name = String(part.name ?? '').trim().toLowerCase();
  return codexList.find((c) => {
    const cId = c.id != null ? String(c.id).trim().toLowerCase() : '';
    const cName = String(c.name ?? '').trim().toLowerCase();
    return (id && cId === id) || (name && cName === name);
  });
}

/** Enrich saved part levels with codex TP so proficiency auto-add works reliably. */
function enrichSavedPart(part: SavedPartLike, codexList: CodexPartLike[]) {
  const codex = findCodexPart(codexList, part);
  return {
    id: part.id !== undefined && part.id !== '' ? String(part.id) : codex?.id != null ? String(codex.id) : undefined,
    name: part.name || codex?.name || '',
    base_tp: codex?.base_tp ?? 0,
    op_1_lvl: part.op_1_lvl ?? 0,
    op_1_tp: codex?.op_1_tp ?? 0,
    op_2_lvl: part.op_2_lvl ?? 0,
    op_2_tp: codex?.op_2_tp ?? 0,
    op_3_lvl: part.op_3_lvl ?? 0,
    op_3_tp: codex?.op_3_tp ?? 0,
    ...(part.applyDuration ? { applyDuration: true } : {}),
  };
}

export function mapSelectedToCharacterItems(
  itemType: AddLibraryItemType,
  selected: SelectableItem[],
  powerSelectionMode: PowerSelectionMode,
  dbs?: CodexDbRefs
): CharacterPower[] | CharacterTechnique[] | Item[] {
  const selectedRaw = selected.map((s) => s.data as UserPower | UserTechnique | EqItem);
  const powerPartsDb = (dbs?.powerPartsDb ?? []) as CodexPartLike[];
  const techniquePartsDb = (dbs?.techniquePartsDb ?? []) as CodexPartLike[];
  const quantities = selected.reduce(
    (acc, s) => {
      const q = (s as SelectableItem & { quantity?: number }).quantity;
      if (q != null) acc[s.id] = q;
      return acc;
    },
    {} as Record<string, number>
  );

  if (itemType === 'power') {
    return (selectedRaw as Array<UserPower | UserTechnique>).map((entry) => {
      if (powerSelectionMode === 'empowered') {
        const raw = entry as unknown as Record<string, unknown>;
        const powerData = (raw.power as Record<string, unknown> | undefined) ?? {};
        const savedParts = (Array.isArray(powerData.parts) ? powerData.parts : []) as SavedPartLike[];
        return {
          id: entry.id,
          name: entry.name,
          description: entry.description || '',
          parts: savedParts.map((p) => enrichSavedPart(p, powerPartsDb)),
          cost: 0,
          level: 1,
          damage: powerData.damage as CharacterPower['damage'],
        };
      }
      const power = entry as UserPower;
      return {
        id: power.id,
        name: power.name,
        description: power.description || '',
        parts: (power.parts || []).map((p) => enrichSavedPart(p, powerPartsDb)),
        cost: 0,
        level: 1,
        damage: power.damage as CharacterPower['damage'],
      };
    });
  }

  if (itemType === 'technique') {
    return (selectedRaw as UserTechnique[]).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description || '',
      parts: (t.parts || []).map((p) => enrichSavedPart(p, techniquePartsDb)),
      cost: 0,
      actionType: t.actionType,
      isReaction: t.isReaction,
      damage: (t as { damage?: unknown }).damage as CharacterTechnique['damage'],
    }));
  }

  return (selectedRaw as EqItem[]).map((i) => {
    const props = (i.properties || []) as EqItem['properties'];
    return {
      id: i.id,
      name: String(i.name ?? ''),
      description: String(i.description ?? ''),
      properties: props as unknown as Item['properties'],
      damage: i.damage as Item['damage'],
      armor: i.armorValue ?? 0,
      equipped: false,
      quantity: itemType === 'equipment' ? (quantities[i.id] ?? 1) : 1,
      cost: 0,
    };
  });
}
