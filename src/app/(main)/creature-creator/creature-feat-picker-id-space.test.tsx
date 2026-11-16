// @vitest-environment happy-dom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { initialState } from './creature-creator-constants';
import { AddCreatureFeatModal } from './AddCreatureFeatModal';
import { mergeCreatureFeatsOnAdd } from './creature-feat-utils';
import type { CreatureFeat } from './transformers';

const { creatureFeats, codexFeats, creatureDefs, characterDefs } = vi.hoisted(() => {
  const creatureFeats = [
    {
      id: '64',
      name: 'Lycanthrope',
      description: '',
      points: 1,
      feat_lvl: 1,
      mechanic: false,
      category: 'Creature',
    },
    {
      id: '65',
      name: 'Lycanthrope II',
      description: '',
      points: 2,
      feat_lvl: 2,
      base_feat_id: '64',
      mechanic: false,
      category: 'Creature',
    },
    {
      id: '66',
      name: 'Lycanthrope III',
      description: '',
      points: 3,
      feat_lvl: 3,
      base_feat_id: '64',
      mechanic: false,
      category: 'Creature',
    },
  ];
  const codexFeats = [
    {
      id: '66',
      name: 'Blessed Healer',
      description: '',
      char_feat: true,
      feat_lvl: 1,
      category: 'Divine',
    },
  ];
  const creatureDefs = new Map(creatureFeats.map((feat) => [feat.id, feat]));
  const characterDefs = new Map(codexFeats.map((feat) => [String(feat.id), feat]));
  return { creatureFeats, codexFeats, creatureDefs, characterDefs };
});

vi.mock('@/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks')>();
  return {
    ...actual,
    useCreatureFeats: () => ({ data: creatureFeats, isLoading: false }),
    useCodexFeats: () => ({ data: codexFeats, isLoading: false, error: null }),
    useCodexSkills: () => ({ data: [], isLoading: false }),
    useTraits: () => ({ data: [], isLoading: false }),
  };
});

const blessedHealer: CreatureFeat = {
  id: '66',
  name: 'Blessed Healer',
  points: 0.5,
  featSourceType: 'character',
};

const lycanthropeIII: CreatureFeat = {
  id: '66',
  name: 'Lycanthrope III',
  points: 3,
  featSourceType: 'creature',
};

const lycanthropeII: CreatureFeat = {
  id: '65',
  name: 'Lycanthrope II',
  points: 2,
  featSourceType: 'creature',
};

describe('creature feat picker id spaces', () => {
  it('offers Lycanthrope III when Blessed Healer (id 66) is already on the creature', () => {
    const added: CreatureFeat[][] = [];
    render(
      <AddCreatureFeatModal
        isOpen
        onClose={() => {}}
        creature={{ ...initialState, feats: [blessedHealer] }}
        onAdd={(feats) => {
          added.push(mergeCreatureFeatsOnAdd([blessedHealer], feats, characterDefs, creatureDefs));
        }}
      />,
    );

    expect(screen.getByText('Lycanthrope III')).toBeTruthy();
    expect(screen.queryByText('Lycanthrope II')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Select Lycanthrope III' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Selected (1)' }));

    const merged = added[0] ?? [];
    expect(merged.map((feat) => `${feat.featSourceType}:${feat.id}:${feat.name}`)).toEqual([
      'character:66:Blessed Healer',
      'creature:66:Lycanthrope III',
    ]);
  });

  it('does not offer another Lycanthrope row once Lycanthrope III is owned', () => {
    render(
      <AddCreatureFeatModal
        isOpen
        onClose={() => {}}
        creature={{ ...initialState, feats: [blessedHealer, lycanthropeIII] }}
        onAdd={() => {}}
      />,
    );

    expect(screen.getByText('No creature feats match (or all are already added).')).toBeTruthy();
    expect(screen.queryByText('Lycanthrope II')).toBeNull();
    expect(screen.queryByText('Lycanthrope III')).toBeNull();
  });

  it('keeps one Lycanthrope row when a lower rank is merged onto Lycanthrope III', () => {
    const merged = mergeCreatureFeatsOnAdd(
      [blessedHealer, lycanthropeIII],
      [lycanthropeII],
      characterDefs,
      creatureDefs,
    );
    expect(merged.filter((feat) => feat.name.startsWith('Lycanthrope'))).toEqual([lycanthropeIII]);
    expect(merged).toContainEqual(blessedHealer);
  });
});
