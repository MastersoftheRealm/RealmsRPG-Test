import { describe, expect, it } from 'vitest';
import { buildCreatureDefensesSummaryLine } from './creature-stat-block-helpers';

describe('buildCreatureDefensesSummaryLine', () => {
  it('lists all six defense scores as 10 + ability + defense rank', () => {
    const line = buildCreatureDefensesSummaryLine(
      { strength: 2, vitality: 0, agility: 1, acuity: 0, intelligence: 0, charisma: 0 },
      { might: 1, fortitude: 0, reflex: 0, discernment: 0, mentalFortitude: 0, resolve: 0 },
    );
    expect(line).toContain('Might 13');
    expect(line).toContain('Reflexes 11');
    expect(line.match(/Defenses/)?.[0]).toBe('Defenses');
    expect(line.split(',').length).toBe(6);
  });
});
