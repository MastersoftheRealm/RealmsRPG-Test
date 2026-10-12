import { describe, expect, it } from 'vitest';
import type { EnrichedCharacterData } from '@/lib/data-enrichment';
import type { Character } from '@/types';
import { addModalRowIsExcluded, existingIdsForAddModal } from './add-modal-existing-ids';

describe('existingIdsForAddModal (86e3jw5r2)', () => {
  it('includes enriched library id and docId when the sheet row id differs', () => {
    const character = {
      id: 'c1',
      powers: [{ id: 'sheet-row-uuid', name: 'Animosity' }],
    } as Character;
    const enriched = {
      powers: [
        {
          id: 'sheet-row-uuid',
          name: 'Animosity',
          libraryItem: { id: 'official-animosity', docId: 'official-animosity', name: 'Animosity' },
        },
      ],
    } as EnrichedCharacterData;

    const ids = existingIdsForAddModal(character, 'power', enriched);
    expect(ids.has('sheet-row-uuid')).toBe(true);
    expect(ids.has('official-animosity')).toBe(true);
    expect(
      addModalRowIsExcluded({ id: 'official-animosity', docId: 'official-animosity' }, ids),
    ).toBe(true);
    expect(addModalRowIsExcluded({ id: 'other-power', docId: 'other-power' }, ids)).toBe(false);
  });

  it('matches a public row by docId when only docId is in the exclusion set', () => {
    const ids = new Set(['lib-doc']);
    expect(addModalRowIsExcluded({ id: 'user-copy-id', docId: 'lib-doc' }, ids)).toBe(true);
  });

  it('does not exclude equipment ids (stackable)', () => {
    const character = {
      id: 'c1',
      equipment: { items: [{ id: 'rope-1', name: 'Rope' }] },
    } as Character;
    const enriched = {
      equipment: [{ id: 'rope-1', name: 'Rope', type: 'equipment' }],
    } as EnrichedCharacterData;
    expect(existingIdsForAddModal(character, 'equipment', enriched).size).toBe(0);
  });
});
