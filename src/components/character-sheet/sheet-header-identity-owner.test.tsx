// @vitest-environment happy-dom

import type { ImgHTMLAttributes } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { Character } from '@/types';
import { CharacterSheetProvider, type CharacterSheetContextValue } from './character-sheet-context';
import { buildReadOnlySheetContextValue } from './read-only-sheet';
import { SheetHeaderIdentity } from './sheet-header-identity';

const character: Character = {
  id: 'viewer-sheet',
  userId: 'owner-user',
  name: 'Aster',
  level: 3,
  experience: 8,
  abilities: {
    strength: 0,
    vitality: 0,
    agility: 0,
    acuity: 0,
    intelligence: 0,
    charisma: 0,
  },
  skills: [],
  healthPoints: 0,
  energyPoints: 0,
  mart_prof: 0,
  pow_prof: 0,
  archetypeFeats: [],
  feats: [],
};

vi.mock('next/image', () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ''} src={typeof props.src === 'string' ? props.src : ''} />
  ),
}));

function sheetContext(isOwner: boolean): CharacterSheetContextValue {
  const base = buildReadOnlySheetContextValue({
    character,
    skills: [],
    pointBudgets: null,
    enrichedData: null,
    libraryModel: null,
    characterSpeciesSkills: [],
    libraryActiveTab: 'powers',
    setLibraryActiveTab: vi.fn(),
  });
  return { ...base, isOwner };
}

function renderHeader(isOwner: boolean) {
  return render(
    <CharacterSheetProvider value={sheetContext(isOwner)}>
      <SheetHeaderIdentity
        character={character}
        isEditMode
        healthColor="green"
        onNameChange={vi.fn()}
        onExperienceChange={vi.fn()}
        onEditSpecies={vi.fn()}
        onEditArchetype={vi.fn()}
        onPortraitChange={vi.fn()}
      />
    </CharacterSheetProvider>,
  );
}

describe('SheetHeaderIdentity ownership (COMP1-048)', () => {
  afterEach(() => {
    cleanup();
  });

  it('hides owner-only header pencils for a viewer when parent passes handlers', () => {
    renderHeader(false);

    expect(screen.queryByRole('button', { name: 'Edit name' })).toBeNull();
    expect(screen.queryByTitle('Edit XP')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit species and ancestry' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit archetype and ability' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Change portrait/i })).toBeNull();
  });

  it('shows owner-only header pencils when the viewer is the sheet owner', () => {
    renderHeader(true);

    expect(screen.getByRole('button', { name: 'Edit name' })).toBeTruthy();
    expect(screen.getByTitle('Edit XP')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit species and ancestry' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit archetype and ability' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Change portrait for Aster/i })).toBeTruthy();
  });
});
