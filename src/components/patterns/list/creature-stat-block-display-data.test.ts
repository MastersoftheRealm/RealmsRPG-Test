import { describe, expect, it } from 'vitest';
import type { LibraryPower } from '@/types/library';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import { loadRepoCodexParts } from '@/lib/calculators/power-composition.fixture';
import { libraryItemToPowerDocument } from '@/lib/library-selectable-builders';
import type { CreatureData } from './creature-stat-block-types';
import { isListedSavedCreatureSkill } from './creature-stat-block-helpers';
import {
  buildPowersForDisplay,
  buildSkillRows,
  buildTechniquesForDisplay,
} from './creature-stat-block-display-data';
import type { LibraryTechnique } from '@/types/library';

describe('buildPowersForDisplay energy', () => {
  it('prices Shared apply-to-duration through the same document as the library', () => {
    const partsDb = loadRepoCodexParts();
    const power = {
      id: 'sphere-daze',
      docId: 'sphere-daze',
      name: 'Sphere Daze',
      description: '',
      parts: [{ id: 339, name: 'Daze', applyDuration: true }],
      actionType: 'basic',
      area: { type: 'sphere', level: 1 },
      duration: { type: 'minutes', value: 1 },
      composition: {
        structure: 'modify' as const,
        variants: [{ id: 'extra', label: 'Extra' }],
      },
    } satisfies LibraryPower;

    const priced = derivePowerDisplay(libraryItemToPowerDocument(power), partsDb);
    const stripped = derivePowerDisplay(
      libraryItemToPowerDocument({
        ...power,
        parts: power.parts.map((part) => ({ ...part, applyDuration: false })),
      }),
      partsDb,
    );
    expect(priced.energy).not.toBe(stripped.energy);

    const creature = {
      id: 'c1',
      name: 'Caster',
      powers: [{ id: 'sphere-daze', name: 'Sphere Daze' }],
    } satisfies CreatureData;
    const row = buildPowersForDisplay(creature, [power], [], partsDb)[0];
    expect(row?.energyCost).toBe(priced.energy);
  });

  it('prices an unmatched snapshot with apply-to-duration, action, range, area, duration, and composition', () => {
    const partsDb = loadRepoCodexParts();
    const power = {
      name: 'Snapshot Daze',
      description: '',
      parts: [{ id: 339, name: 'Daze', applyDuration: true }],
      actionType: 'quick',
      range: { steps: 2 },
      area: { type: 'sphere' as const, level: 1 },
      duration: { type: 'minutes' as const, value: 1 },
      composition: {
        structure: 'modify' as const,
        variants: [{ id: 'extra', label: 'Extra' }],
      },
    };
    const priced = derivePowerDisplay(libraryItemToPowerDocument(power), partsDb);
    const stripped = derivePowerDisplay(
      libraryItemToPowerDocument({
        ...power,
        parts: power.parts.map((part) => ({ ...part, applyDuration: false })),
      }),
      partsDb,
    );
    expect(priced.energy).not.toBe(stripped.energy);

    const creature = {
      id: 'c2',
      name: 'Snapshot',
      powers: [
        {
          id: 'not-in-library',
          name: power.name,
          parts: power.parts,
          actionType: power.actionType,
          range: power.range,
          area: power.area,
          duration: power.duration,
          composition: power.composition,
        },
      ],
    } satisfies CreatureData;
    const row = buildPowersForDisplay(creature, [], [], partsDb)[0];
    expect(row?.energyCost).toBe(priced.energy);
    expect(row?.actionType).toBe(priced.actionType);
    expect(row?.duration).toBe(priced.duration);
    expect(row?.area).toBe(priced.area);
  });

  it('keeps a matched power’s energy, action, and duration after the library row is gone', () => {
    const partsDb = loadRepoCodexParts();
    const power = {
      id: 'saved-daze',
      docId: 'saved-daze',
      name: 'Saved Daze',
      description: '',
      parts: [{ id: 339, name: 'Daze', applyDuration: true }],
      actionType: 'quick',
      range: { steps: 2 },
      duration: { type: 'rounds' as const, value: 2 },
      composition: {
        structure: 'modify' as const,
        variants: [{ id: 'extra', label: 'Extra', parts: [{ id: 329, name: 'Slow' }] }],
      },
    } satisfies LibraryPower;

    const creature = {
      id: 'c3',
      name: 'Matched',
      powers: [
        {
          id: 'saved-daze',
          name: 'Saved Daze',
          parts: power.parts,
          actionType: power.actionType,
          rangeValue: power.range,
          durationValue: power.duration,
          composition: power.composition,
          energy: 1,
          action: 'Basic Action',
          duration: 'Instant',
        },
      ],
    } satisfies CreatureData;

    const matched = buildPowersForDisplay(creature, [power], [], partsDb)[0];
    const unmatched = buildPowersForDisplay(creature, [], [], partsDb)[0];
    expect(matched?.energyCost).toBeGreaterThan(0);
    expect(unmatched?.energyCost).toBe(matched?.energyCost);
    expect(unmatched?.actionType).toBe(matched?.actionType);
    expect(unmatched?.duration).toBe(matched?.duration);
    expect(unmatched?.actionType).not.toBe('Basic Action');
    expect(unmatched?.duration).not.toBe('Instant');
  });

  it('shows live Codex Training Points for a matched official power, not a stale snapshot', () => {
    const partsDb = loadRepoCodexParts();
    const official = {
      id: 'ice-bolt',
      docId: 'ice-bolt',
      name: 'Ice Bolt',
      description: '',
      parts: [],
      range: { steps: 2 },
      damage: [{ amount: 1, size: 6, type: 'ice' }],
      actionType: 'basic',
    } satisfies LibraryPower;
    const live = derivePowerDisplay(libraryItemToPowerDocument(official), partsDb).tp;
    expect(live).toBeGreaterThan(1);

    const creature = {
      id: 'c-stale',
      name: 'Caster',
      powers: [{ id: 'ice-bolt', name: 'Ice Bolt' }],
    } satisfies CreatureData;
    const row = buildPowersForDisplay(creature, [], [official], partsDb)[0];
    const chipNames = (row?.detailSections ?? []).flatMap((section) =>
      section.chips.map((chip) => chip.name),
    );
    expect(chipNames).toContain(`Training Points ${live}`);
    expect(chipNames).not.toContain('Training Points 1');
  });

  it('shows a legacy partless snapshot’s saved energy, action, and duration', () => {
    const creature = {
      id: 'c4',
      name: 'Legacy',
      powers: [{ name: 'Old Bolt', energy: 9, action: 'Quick', duration: '2 Rounds' }],
    } satisfies CreatureData;
    const row = buildPowersForDisplay(creature, [], [], [])[0];
    expect(row?.energyCost).toBe(9);
    expect(row?.actionType).toBe('Quick');
    expect(row?.duration).toBe('2 Rounds');
  });
});

const SAVED_TECHNIQUE_ROWS = [
  { creature: 'Goblin', name: 'Power Shot', energy: 6, weapon: 'Weapon', tp: 1 },
  { creature: 'Lvl. 1 Human Melee Martial', name: 'Clash', energy: 8, weapon: 'Weapon', tp: 3 },
  {
    creature: 'Lvl. 1 Human Melee Martial',
    name: 'saved snapshot',
    energy: 6,
    weapon: 'Weapon',
    tp: 1,
  },
  { creature: 'Rat', name: 'Expose', energy: 3, weapon: 'Unarmed', tp: 3 },
  { creature: 'Shambling Thorn', name: 'Block', energy: 4, weapon: 'Unarmed', tp: 3 },
  { creature: 'Shambling Thorn', name: 'Thorn Prick', energy: 4, weapon: 'Unarmed', tp: 2 },
] as const;

function creatureWithTechnique(
  creatureName: string,
  technique: {
    name: string;
    energy: number;
    weapon: string;
    tp: number;
    parts?: NonNullable<CreatureData['techniques']>[number]['parts'];
  },
): CreatureData {
  return {
    id: 'creature',
    name: creatureName,
    techniques: [
      {
        id: technique.name,
        name: technique.name,
        energy: technique.energy,
        weapon: technique.weapon,
        tp: technique.tp,
        action: 'Action',
        ...(technique.parts ? { parts: technique.parts } : {}),
      },
    ],
  };
}

describe('buildTechniquesForDisplay saved snapshots', () => {
  it('uses saved Energy, Attack, and Training Pts when the viewer has no matching technique and the row has no parts', () => {
    for (const row of SAVED_TECHNIQUE_ROWS) {
      const displayed = buildTechniquesForDisplay(
        creatureWithTechnique(row.creature, row),
        [],
        [],
        [],
      )[0];
      expect(displayed?.energyCost, row.name).toBe(row.energy);
      expect(displayed?.weaponName, row.name).toBe(row.weapon);
      expect(displayed?.tp, row.name).toBe(row.tp);
    }
  });

  it('still prices a technique that matches an official library row', () => {
    const official = {
      id: 'disarm',
      docId: 'disarm',
      name: 'Disarm',
      parts: [],
    } satisfies LibraryTechnique;
    const displayed = buildTechniquesForDisplay(
      creatureWithTechnique('Goblin', {
        name: 'Disarm',
        energy: 6,
        weapon: 'Weapon',
        tp: 1,
      }),
      [],
      [{ ...official, id: 'disarm' }],
      [],
    )[0];
    expect(displayed?.energyCost).toBe(0);
    expect(displayed?.weaponName).toBe('Unarmed');
    expect(displayed?.tp).toBe(0);
  });

  it('prices a snapshot that has parts instead of keeping a stale stored total', () => {
    const displayed = buildTechniquesForDisplay(
      creatureWithTechnique('Rat', {
        name: 'Expose',
        energy: 99,
        weapon: 'Weapon',
        tp: 9,
        parts: [{ id: 1, name: 'Missing Part', op_1_lvl: 1 }],
      }),
      [],
      [],
      [],
    )[0];
    expect(displayed?.energyCost).toBe(0);
    expect(displayed?.tp).toBe(0);
    expect(displayed?.weaponName).toBe('Unarmed');
  });
});

describe('library ref resolution (powers)', () => {
  const creatureBase = { id: 'c-match', name: 'Matcher', powers: [] } satisfies CreatureData;

  it('prefers user library over official when both share the same id', () => {
    const user = {
      id: 'bolt-1',
      docId: 'bolt-1',
      name: 'User Bolt',
      description: 'from user library',
      parts: [],
    } satisfies LibraryPower;
    const official = {
      id: 'bolt-1',
      docId: 'bolt-1',
      name: 'Official Bolt',
      description: 'from codex',
      parts: [],
    } satisfies LibraryPower;
    const creature = {
      ...creatureBase,
      powers: [{ id: 'bolt-1', name: 'User Bolt' }],
    } satisfies CreatureData;
    const row = buildPowersForDisplay(creature, [user], [official], [])[0];
    expect(row?.description).toBe('from user library');
  });

  it('resolves user rows by docId when the creature ref names that docId', () => {
    const user = {
      id: 'internal-9',
      docId: 'doc-facing-9',
      name: 'Doc Bolt',
      description: 'docId hit',
      parts: [],
    } satisfies LibraryPower;
    const creature = {
      ...creatureBase,
      powers: [{ id: 'doc-facing-9', name: 'Doc Bolt' }],
    } satisfies CreatureData;
    const row = buildPowersForDisplay(creature, [user], [], [])[0];
    expect(row?.description).toBe('docId hit');
  });

  it('falls back to a case-insensitive trimmed name match', () => {
    const user = {
      id: 'n1',
      docId: 'n1',
      name: 'Fire Bolt',
      description: 'name match',
      parts: [],
    } satisfies LibraryPower;
    const creature = {
      ...creatureBase,
      powers: [{ name: '  fire bolt  ' }],
    } satisfies CreatureData;
    const row = buildPowersForDisplay(creature, [user], [], [])[0];
    expect(row?.description).toBe('name match');
  });

  it('indexes official numeric id 0 and matches a creature ref id "0"', () => {
    const official = {
      id: 0,
      name: 'Zero Id Power',
      description: 'official zero',
      parts: [],
    } as LibraryPower;
    const creature = {
      ...creatureBase,
      powers: [{ id: '0', name: 'Zero Id Power' }],
    } satisfies CreatureData;
    const row = buildPowersForDisplay(creature, [], [official], [])[0];
    expect(row?.description).toBe('official zero');
  });

  it('uses library image_url ahead of the creature snapshot ref', () => {
    const user = {
      id: 'img-1',
      docId: 'img-1',
      name: 'Imaged',
      description: '',
      parts: [],
      image_url: 'https://library/cover.png',
    } satisfies LibraryPower;
    const creature = {
      ...creatureBase,
      powers: [{ id: 'img-1', name: 'Imaged', image_url: 'https://snapshot/old.png' }],
    } satisfies CreatureData;
    const row = buildPowersForDisplay(creature, [user], [], [])[0];
    expect(row?.thumbnail?.src).toContain('library/cover.png');
  });

  it('does not look up by ref id zero (master truthy refId)', () => {
    const official = {
      id: '0',
      docId: '0',
      name: 'Zero Id Power',
      description: 'should not match via ref 0',
      parts: [],
    } satisfies LibraryPower;
    const creature = {
      ...creatureBase,
      powers: [{ id: 0 as unknown as string, name: 'Other' }],
    } satisfies CreatureData;
    const row = buildPowersForDisplay(creature, [], [official], [])[0];
    expect(row?.description).not.toBe('should not match via ref 0');
  });
});

describe('buildSkillRows saved proficiency', () => {
  it('omits a saved skill with proficient false from the stat block and summary lists', () => {
    const skills = [
      { name: 'Athletics', value: 2, proficient: true },
      { name: 'Stealth', value: 0, proficient: false },
      { id: 'smith', name: 'Smithing', value: 0, proficient: false, isSubSkill: true },
    ];
    const rows = buildSkillRows({ id: 'c-skills', name: 'Wolf', abilities: {} }, skills, []);
    expect(rows.map((row) => row.name)).toEqual(['Athletics']);

    const summary = skills.filter(isListedSavedCreatureSkill).map((skill) => skill.name);
    expect(summary).toEqual(['Athletics']);
    expect(isListedSavedCreatureSkill({})).toBe(true);
  });
});
