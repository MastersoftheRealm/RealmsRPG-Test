import { describe, expect, it } from 'vitest';
import {
  creatorEmptyOverwriteDescription,
  creatorPayloadWouldHollowExistingRow,
} from './creator-empty-overwrite';

describe('creator empty overwrite guard', () => {
  it('flags techniques with no description or no parts', () => {
    expect(
      creatorPayloadWouldHollowExistingRow('techniques', {
        description: '',
        parts: [],
      }),
    ).toBe(true);
    expect(
      creatorPayloadWouldHollowExistingRow('techniques', {
        description: '',
        parts: [{ id: 1 }],
      }),
    ).toBe(true);
    expect(
      creatorPayloadWouldHollowExistingRow('techniques', {
        description: 'Strike',
        parts: [],
      }),
    ).toBe(true);
    expect(
      creatorPayloadWouldHollowExistingRow('techniques', {
        description: 'Strike',
        parts: [{ id: 1 }],
      }),
    ).toBe(false);
  });

  it('flags powers with no description and no parts', () => {
    expect(
      creatorPayloadWouldHollowExistingRow('powers', {
        description: '',
        parts: [],
      }),
    ).toBe(true);
    expect(
      creatorPayloadWouldHollowExistingRow('powers', {
        description: 'Renamed',
      }),
    ).toBe(false);
  });

  it('flags items with no description and no properties', () => {
    expect(
      creatorPayloadWouldHollowExistingRow('items', {
        description: '',
        properties: [],
      }),
    ).toBe(true);
  });

  it('flags empowered techniques with no authored parts on either side', () => {
    expect(
      creatorPayloadWouldHollowExistingRow('empowered-techniques', {
        description: '',
        power: { parts: [], mechanics: [] },
        technique: { parts: [] },
      }),
    ).toBe(true);
    expect(
      creatorPayloadWouldHollowExistingRow('empowered-techniques', {
        description: 'Empowered',
        power: { parts: [], mechanics: [] },
        technique: { parts: [] },
      }),
    ).toBe(true);
    expect(
      creatorPayloadWouldHollowExistingRow('empowered-techniques', {
        description: 'Empowered',
        power: { parts: [{ id: 1 }] },
        technique: { parts: [] },
      }),
    ).toBe(false);
  });

  it('flags creatures with no description and no loadout content', () => {
    expect(
      creatorPayloadWouldHollowExistingRow('creatures', {
        description: '',
        powers: [],
        techniques: [],
        feats: [],
        weapons: [],
        armor: [],
        shields: [],
        equipment: [],
      }),
    ).toBe(true);
  });

  it('does not flag a weapons-only creature with an empty description', () => {
    expect(
      creatorPayloadWouldHollowExistingRow('creatures', {
        description: '',
        powers: [],
        techniques: [],
        feats: [],
        weapons: [{ id: 'w1' }],
        armor: [],
        shields: [],
        equipment: [],
      }),
    ).toBe(false);
  });

  it('uses approved confirm copy', () => {
    expect(creatorEmptyOverwriteDescription('technique')).toContain('overwrite');
  });

  it('flags species when description is empty on an existing row save', () => {
    expect(
      creatorPayloadWouldHollowExistingRow('species', {
        description: '',
      }),
    ).toBe(true);
    expect(
      creatorPayloadWouldHollowExistingRow('species', {
        description: 'Forest elves',
      }),
    ).toBe(false);
  });
});
