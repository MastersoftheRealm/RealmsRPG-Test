import { describe, expect, it } from 'vitest';
import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { bootstrapCreatureState } from './creature-creator-bootstrap';
import { readDarkvisionLevel } from './creature-senses';

const catalog = [
  {
    id: String(CREATURE_FEAT_IDS.DARKVISION),
    name: 'Darkvision',
    description: 'Sees in darkness out to 6 spaces.',
    points: 1,
    feat_lvl: 1,
    mechanic: true,
    category: 'Senses',
  },
];

describe('creature creator bootstrap sense migration', () => {
  it('runs sense migration when loading a library creature', () => {
    const rawItems = [
      {
        id: 'creature-1',
        name: 'Gloom Watcher',
        senses: ['Darkvision', 'Unsettled note'],
        feats: [],
      },
    ];
    const state = bootstrapCreatureState({
      editCreatureId: 'creature-1',
      rawItems,
      creatureFeatsCatalog: catalog,
    });
    expect(readDarkvisionLevel(state.senses)).toBe(1);
    expect(state.senses).toContain('Unsettled note');
    expect(state.feats.map((feat) => feat.id)).toContain(String(CREATURE_FEAT_IDS.DARKVISION));
  });
});
