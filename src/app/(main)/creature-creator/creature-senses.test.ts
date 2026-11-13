import { describe, expect, it } from 'vitest';
import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { initialState } from './creature-creator-constants';
import {
  isCreatureSensesControlFeatId,
  migrateLegacySenseNames,
  nextBuiltInSenseType,
  readLifesenseLevel,
  senseControlDisplayValue,
  senseFamilyCap,
  sensesAfterBlindsenseLevel,
  sensesAfterDarkvisionLevel,
  sensesAfterLifesenseLevel,
  sensesControlFeatIdsFromNames,
  sensesSectionPointTotal,
  sensesToggleFeats,
} from './creature-senses';

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
  {
    id: String(CREATURE_FEAT_IDS.DARKVISION_II),
    name: 'Darkvision II',
    description: 'Sees in darkness out to 12 spaces.',
    points: 2,
    feat_lvl: 2,
    base_feat_id: String(CREATURE_FEAT_IDS.DARKVISION),
    mechanic: true,
    category: 'Senses',
  },
  {
    id: String(CREATURE_FEAT_IDS.BLINDSENSE),
    name: 'Blindsense',
    description: 'Perceives within 6 spaces.',
    points: 1.5,
    feat_lvl: 1,
    mechanic: true,
    category: 'Senses',
  },
  {
    id: '99',
    name: 'Keen Smell',
    description: 'Tracks by scent.',
    points: 1,
    feat_lvl: 1,
    mechanic: false,
    category: 'Senses',
  },
];

describe('creature senses section helpers', () => {
  it('treats darkvision as a control and lists only mechanic-false Senses feats as toggles', () => {
    expect(isCreatureSensesControlFeatId(CREATURE_FEAT_IDS.DARKVISION)).toBe(true);
    expect(sensesToggleFeats(catalog).map((f) => f.id)).toEqual(['99']);
  });

  it('offers darkvision before blindsense', () => {
    expect(nextBuiltInSenseType([])).toBe('darkvision');
    const withDark = sensesAfterDarkvisionLevel(initialState, 2, catalog);
    expect(nextBuiltInSenseType(withDark.senses)).toBe('blindsense');
    expect(withDark.senses).toContain('Darkvision II');
    expect(withDark.feats.map((f) => f.id)).toContain(String(CREATURE_FEAT_IDS.DARKVISION_II));
  });

  it('migrates legacy sense name chips into Senses toggles', () => {
    const migrated = migrateLegacySenseNames(
      { ...initialState, senses: ['Keen Smell'] },
      catalog,
    );
    expect(migrated.senses).toEqual([]);
    expect(migrated.feats.map((f) => f.name)).toContain('Keen Smell');
  });

  it('keeps unmatched sense names on the creature record', () => {
    const migrated = migrateLegacySenseNames(
      { ...initialState, senses: ['Keen Smell', 'Custom notation'] },
      catalog,
    );
    expect(migrated.senses).toEqual(['Custom notation']);
    expect(migrated.feats.map((f) => f.name)).toContain('Keen Smell');
  });

  it('counts implied control costs from senses names for legacy creatures', () => {
    expect(
      sensesSectionPointTotal({ ...initialState, senses: ['Darkvision'], feats: [] }, catalog),
    ).toBe(1);
  });

  it('offers lifesense after darkvision and blindsense are active', () => {
    const extended = [
      ...catalog,
      {
        id: String(CREATURE_FEAT_IDS.BLINDSENSE_II),
        name: 'Blindsense II',
        description: 'Perceives within 12 spaces.',
        points: 2,
        feat_lvl: 2,
        base_feat_id: String(CREATURE_FEAT_IDS.BLINDSENSE),
        mechanic: true,
        category: 'Senses',
      },
      {
        id: String(CREATURE_FEAT_IDS.LIFESENSE),
        name: 'Lifesense',
        description: 'Perceives the HP and Vitality of things within 3 spaces.',
        points: 0.5,
        feat_lvl: 1,
        mechanic: true,
        category: 'Senses',
      },
      {
        id: String(CREATURE_FEAT_IDS.LIFESENSE_II),
        name: 'Lifesense',
        description: 'Perceives the HP and Vitality of things within 6 spaces.',
        points: 1,
        feat_lvl: 2,
        base_feat_id: String(CREATURE_FEAT_IDS.LIFESENSE),
        mechanic: true,
        category: 'Senses',
      },
    ];
    const withDark = sensesAfterDarkvisionLevel(initialState, 1, extended);
    const withBlind = { ...withDark, ...sensesAfterBlindsenseLevel(withDark, 1, extended) };
    expect(nextBuiltInSenseType(withBlind.senses)).toBe('lifesense');
  });
});

const lifesenseCatalog = [
  {
    id: String(CREATURE_FEAT_IDS.LIFESENSE),
    name: 'Lifesense',
    description: 'Perceives the HP and Vitality of things within 3 spaces.',
    points: 0.5,
    feat_lvl: 1,
    mechanic: true,
    category: 'Senses',
  },
  {
    id: String(CREATURE_FEAT_IDS.LIFESENSE_II),
    name: 'Lifesense',
    description: 'Perceives the HP and Vitality of things within 6 spaces.',
    points: 1,
    feat_lvl: 2,
    base_feat_id: String(CREATURE_FEAT_IDS.LIFESENSE),
    mechanic: true,
    category: 'Senses',
  },
  {
    id: String(CREATURE_FEAT_IDS.LIFESENSE_III),
    name: 'Lifesense',
    description: 'Perceives the HP and Vitality of things within 12 spaces.',
    points: 2,
    feat_lvl: 3,
    base_feat_id: String(CREATURE_FEAT_IDS.LIFESENSE),
    mechanic: true,
    category: 'Senses',
  },
  {
    id: String(CREATURE_FEAT_IDS.LIFESENSE_IV),
    name: 'Lifesense',
    description: 'Perceives the HP and Vitality of things within 24 spaces.',
    points: 3,
    feat_lvl: 4,
    base_feat_id: String(CREATURE_FEAT_IDS.LIFESENSE),
    mechanic: true,
    category: 'Senses',
  },
];

describe('mechanic-true sense families with catalog caps', () => {
  it('stores lifesense levels as tokens and shows catalog descriptions', () => {
    expect(senseFamilyCap(lifesenseCatalog, 'lifesense')).toBe(4);
    const stepped = sensesAfterLifesenseLevel(initialState, 3, lifesenseCatalog);
    expect(readLifesenseLevel(stepped.senses)).toBe(3);
    expect(stepped.senses).toContain('lifesense:3');
    expect(stepped.feats.map((feat) => feat.id)).toEqual([String(CREATURE_FEAT_IDS.LIFESENSE_III)]);
    expect(senseControlDisplayValue(stepped.senses, 'lifesense', lifesenseCatalog)).toBe(
      'Perceives the HP and Vitality of things within 12 spaces.',
    );
  });

  it('does not offer a lifesense level above the last catalog row', () => {
    const capped = sensesAfterLifesenseLevel(initialState, 99, lifesenseCatalog);
    expect(readLifesenseLevel(capped.senses)).toBe(4);
    expect(sensesControlFeatIdsFromNames(capped.senses, lifesenseCatalog)).toEqual([
      String(CREATURE_FEAT_IDS.LIFESENSE_IV),
    ]);
    expect(
      sensesAfterLifesenseLevel(capped, 5, lifesenseCatalog).feats.map((feat) => feat.id),
    ).toEqual([String(CREATURE_FEAT_IDS.LIFESENSE_IV)]);
  });
});
