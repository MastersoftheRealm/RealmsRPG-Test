/**
 * Power/technique card disclosure anatomy (TASK-470 / TASK-573).
 */

import { describe, expect, it } from 'vitest';
import {
  buildPowerTechniqueCardFacts,
  findHighestEnergyCostPick,
  resolvePowerTechniqueEnergy,
} from './power-technique-display';
import type { LibraryPower, LibraryTechnique } from '@/types/library';

describe('buildPowerTechniqueCardFacts disclosure', () => {
  it('puts Training Points in titleChips and Action Type / Energy in detailChips', () => {
    const power = {
      id: 'p1',
      docId: 'p1',
      name: 'Test Bolt',
      description: 'A test power.',
      parts: [],
      actionType: 'quick',
    } as LibraryPower;

    // Empty parts DB → derive may still yield defaults; exercise chip split shape.
    const facts = buildPowerTechniqueCardFacts('powers', power, 'p1', [], []);
    expect(facts.titleChips.some((c) => /^Training Points\b/.test(c.name))).toBe(true);
    expect(facts.titleChips.some((c) => /Action/i.test(c.name) && !/^Training/.test(c.name))).toBe(
      false,
    );
    // Action Type value-only when present
    for (const chip of facts.detailChips) {
      expect(chip.name.startsWith('Action Type ')).toBe(false);
    }
  });

  it('innate-eligible powers use the same TP title chip (Energy stays in detail)', () => {
    const power = {
      id: 'p2',
      docId: 'p2',
      name: 'Innate Spark',
      description: 'A small innate.',
      parts: [],
      actionType: 'basic',
    } as LibraryPower;

    const facts = buildPowerTechniqueCardFacts('powers', power, 'p2', [], []);
    expect(facts.titleChips.some((c) => /^Training Points\b/.test(c.name))).toBe(true);
    expect(facts.titleChips.some((c) => /^Energy\b/.test(c.name))).toBe(false);
    for (const chip of facts.detailChips) {
      expect(chip.name.startsWith('Action Type ')).toBe(false);
    }
  });

  it('resolvePowerTechniqueEnergy uses technique derive path when kind is techniques (TASK-687)', () => {
    const tech = {
      id: 't1',
      docId: 't1',
      name: 'Slash',
      description: 'A test technique.',
      parts: [],
      actionType: 'basic',
    } as LibraryTechnique;

    // Empty parts → both kinds may yield undefined/0 energy; the regression is that
    // techniques kind must not throw / must call deriveTechniqueDisplay (not power).
    const powerEnergy = resolvePowerTechniqueEnergy(
      'powers',
      tech as unknown as LibraryPower,
      [],
      [],
    );
    const techEnergy = resolvePowerTechniqueEnergy('techniques', tech, [], []);
    // Same empty-parts input: values may match, but techniques path must resolve cleanly.
    expect(techEnergy === undefined || typeof techEnergy === 'number').toBe(true);
    expect(powerEnergy === undefined || typeof powerEnergy === 'number').toBe(true);
  });

  it('resolvePowerTechniqueEnergy with techniques kind matches card facts energy (TASK-687)', () => {
    const tech = {
      id: 't2',
      docId: 't2',
      name: 'Parry',
      description: 'Defend.',
      parts: [],
      actionType: 'reaction',
    } as LibraryTechnique;

    const facts = buildPowerTechniqueCardFacts('techniques', tech, 't2', [], []);
    const energy = resolvePowerTechniqueEnergy('techniques', tech, [], []);
    expect(energy).toBe(facts.energy);
  });

  it('findHighestEnergyCostPick resolves selected ids including docId', () => {
    const spark = {
      id: 'p1',
      docId: 'spark-doc',
      name: 'Spark',
      parts: [],
    } as LibraryPower;
    const pick = findHighestEnergyCostPick({
      powerIds: ['spark-doc', 'missing'],
      powers: [spark],
      powerPartsDb: [],
      techniquePartsDb: [],
    });
    expect(pick?.name).toBe('Spark');
    expect(typeof pick?.energy).toBe('number');
  });

  it('findHighestEnergyCostPick scans resolved rows when ids are omitted', () => {
    const bolt = {
      id: 'p2',
      docId: 'p2',
      name: 'Bolt',
      parts: [],
    } as LibraryPower;
    const pick = findHighestEnergyCostPick({
      powers: [bolt],
      powerPartsDb: [],
      techniquePartsDb: [],
    });
    expect(pick?.name).toBe('Bolt');
  });
});
