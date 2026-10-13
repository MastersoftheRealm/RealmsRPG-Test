import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CREATURE_CONSTANTS, PLAYER_CONSTANTS } from './constants';

const root = path.join(import.meta.dirname, '../../..');

describe('hard-coded progression matches core_rules JSON (86e3jtugd)', () => {
  it('uses the database player base health and creature hit-energy pool', () => {
    const player = JSON.parse(
      readFileSync(path.join(root, 'data/core-rules/PROGRESSION_PLAYER.json'), 'utf8'),
    ) as { baseHealth: number };
    const creature = JSON.parse(
      readFileSync(path.join(root, 'data/core-rules/PROGRESSION_CREATURE.json'), 'utf8'),
    ) as { baseHitEnergyPool: number };
    const seed = readFileSync(path.join(root, 'scripts/seed-core-rules.js'), 'utf8');

    expect(player.baseHealth).toBe(12);
    expect(creature.baseHitEnergyPool).toBe(30);
    expect(PLAYER_CONSTANTS.BASE_HEALTH).toBe(player.baseHealth);
    expect(CREATURE_CONSTANTS.BASE_HIT_ENERGY).toBe(creature.baseHitEnergyPool);
    expect(seed).toContain('baseHealth: 12');
    expect(seed).toContain('baseHitEnergyPool: 30');
  });
});
