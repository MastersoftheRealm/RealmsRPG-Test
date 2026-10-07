import { describe, expect, it } from 'vitest';
import type { LibraryPower } from '@/types/library';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import { loadRepoCodexParts } from '@/lib/calculators/power-composition.fixture';
import { libraryItemToPowerDocument } from '@/lib/library-selectable-builders';
import type { CreatureData } from './creature-stat-block-types';
import { buildPowersForDisplay } from './creature-stat-block-display-data';

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
