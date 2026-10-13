import type { EnrichedCharacterData } from '@/lib/data-enrichment';
import type { Character, Item } from '@/types';

export type AddModalEntityType =
  | 'power'
  | 'innate-power'
  | 'technique'
  | 'weapon'
  | 'armor'
  | 'shield'
  | 'equipment'
  | null;

/**
 * IDs to hide in the sheet Add-from-Library modal for the active entity type.
 * Character rows store a play id that can differ from the library row id/docId
 * (name fallback enrichment). Include enriched library ids so Realms + My rows
 * for powers already on the sheet do not show a second EN column.
 */
export function existingIdsForAddModal(
  character: Character | null,
  addModalType: AddModalEntityType,
  enriched?: EnrichedCharacterData | null,
): Set<string> {
  const ids = new Set<string>();
  if (!character || !addModalType) return ids;
  const add = (id: string | number | undefined) => {
    const s = String(id ?? '').trim();
    if (s) ids.add(s);
  };

  switch (addModalType) {
    case 'power':
    case 'innate-power':
      character.powers?.forEach((p) => add(p.id));
      enriched?.powers?.forEach((p) => {
        add(p.id);
        add(p.libraryItem?.id);
        add(p.libraryItem?.docId);
      });
      break;
    case 'technique':
      character.techniques?.forEach((t) => add(t.id));
      enriched?.techniques?.forEach((t) => {
        add(t.id);
        add(t.libraryItem?.id);
        add(t.libraryItem?.docId);
      });
      break;
    case 'weapon':
      ((character.equipment?.weapons as Item[]) || []).forEach((w) => add(w.id));
      enriched?.weapons?.forEach((w) => {
        add(w.id);
        add(w.libraryItem?.id);
        add(w.libraryItem?.docId);
      });
      break;
    case 'armor':
      ((character.equipment?.armor as Item[]) || []).forEach((a) => add(a.id));
      enriched?.armor?.forEach((a) => {
        add(a.id);
        add(a.libraryItem?.id);
        add(a.libraryItem?.docId);
      });
      break;
    case 'shield':
      ((character.equipment?.shields as Item[]) || []).forEach((s) => add(s.id));
      enriched?.shields?.forEach((s) => {
        add(s.id);
        add(s.libraryItem?.id);
        add(s.libraryItem?.docId);
      });
      break;
    case 'equipment':
      // Stackable — do not exclude owned Equipment (quantity merges on add).
      break;
  }
  return ids;
}

/** True when a library row id or docId is already on the character for this add modal. */
export function addModalRowIsExcluded(
  row: { id?: string | number | null | undefined; docId?: string | number | null | undefined },
  existingIds: Set<string>,
): boolean {
  const id = String(row.id ?? '').trim();
  const docId = String(row.docId ?? '').trim();
  if (id && existingIds.has(id)) return true;
  if (docId && existingIds.has(docId)) return true;
  return false;
}
