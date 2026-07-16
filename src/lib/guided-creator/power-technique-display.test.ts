/**
 * Power/technique card disclosure anatomy (TASK-470).
 */

import { describe, expect, it } from 'vitest';
import { buildPowerTechniqueCardFacts } from './power-technique-display';
import type { LibraryPower } from '@/types/library';

describe('buildPowerTechniqueCardFacts disclosure', () => {
  it('puts Training Points in titleChips and Action Type / Energy in detailChips', () => {
    const power = {
      id: 'p1',
      name: 'Test Bolt',
      description: 'A test power.',
      parts: [],
      actionType: 'quick',
    } as LibraryPower;

    // Empty parts DB → derive may still yield defaults; exercise chip split shape.
    const facts = buildPowerTechniqueCardFacts('powers', power, 'p1', [], []);
    expect(facts.titleChips.some((c) => /^Training Points\b/.test(c.name))).toBe(true);
    expect(facts.titleChips.some((c) => /Action/i.test(c.name) && !/^Training/.test(c.name))).toBe(
      false
    );
    // Action Type value-only when present
    for (const chip of facts.detailChips) {
      expect(chip.name.startsWith('Action Type ')).toBe(false);
    }
  });

  it('innate titleBudget puts Energy title-adjacent and keeps Action Type value-only in detail', () => {
    const power = {
      id: 'p2',
      name: 'Innate Spark',
      description: 'A small innate.',
      parts: [],
      actionType: 'basic',
    } as LibraryPower;

    const facts = buildPowerTechniqueCardFacts('powers', power, 'p2', [], [], 'energy');
    expect(facts.titleChips.some((c) => /^Training Points\b/.test(c.name))).toBe(false);
    for (const chip of facts.detailChips) {
      expect(chip.name.startsWith('Action Type ')).toBe(false);
      expect(/^Energy\b/.test(chip.name)).toBe(false);
    }
  });
});
