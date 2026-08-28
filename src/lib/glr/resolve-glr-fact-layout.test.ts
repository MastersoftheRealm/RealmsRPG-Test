import { describe, expect, it } from 'vitest';
import { resolveSurfaceLayout } from './glr-surface-bindings';
import { resolveGlrFactLayout } from './resolve-glr-fact-layout';

describe('resolveGlrFactLayout (ADR-0016)', () => {
  it('browse power keeps comparison columns and chips TP', () => {
    const layout = resolveGlrFactLayout({ entityType: 'power', mode: 'browse' });
    expect(layout.columnFacts).toEqual([
      'category',
      'energy',
      'actionType',
      'duration',
      'range',
      'area',
      'damage',
    ]);
    expect(layout.chipFacts).toEqual(['trainingPoints']);
    expect(layout.rightSlotFacts).toEqual([]);
  });

  it('guided power browse puts TP on rightSlot', () => {
    const layout = resolveGlrFactLayout({
      entityType: 'power',
      mode: 'browse',
      flags: { creatorBudget: true },
    });
    expect(layout.rightSlotFacts).toEqual(['trainingPoints']);
    expect(layout.columnFacts).not.toContain('trainingPoints');
    expect(layout.chipFacts).not.toContain('trainingPoints');
  });

  it('play power uses Energy rightSlot and combat columns', () => {
    const layout = resolveGlrFactLayout({ entityType: 'power', mode: 'play' });
    expect(layout.rightSlotFacts).toEqual(['energy']);
    expect(layout.columnFacts).toEqual(['actionType', 'damage', 'area', 'duration']);
    expect(layout.chipFacts).toEqual(['category', 'range', 'trainingPoints']);
  });

  it('select power demotes Range to a chip', () => {
    const layout = resolveGlrFactLayout({ entityType: 'power', mode: 'select' });
    expect(layout.columnFacts).toEqual(['energy', 'actionType', 'duration', 'area', 'damage']);
    expect(layout.chipFacts).toEqual(['category', 'range', 'trainingPoints']);
  });

  it('gear browse is Category / Currency / Rarity columns and chips TP', () => {
    const layout = resolveGlrFactLayout({ entityType: 'gear', mode: 'browse' });
    expect(layout.columnFacts).toEqual(['category', 'currency', 'rarity']);
    expect(layout.chipFacts).toEqual(['trainingPoints']);
  });

  it('play gear chips category / currency / rarity / TP (TASK-825)', () => {
    const layout = resolveGlrFactLayout({ entityType: 'gear', mode: 'play' });
    expect(layout.columnFacts).toEqual([]);
    expect(layout.chipFacts).toEqual(['category', 'currency', 'rarity', 'trainingPoints']);
  });

  it('character-sheet gear play uses catalog columns and chips TP only (TASK-873)', () => {
    const layout = resolveSurfaceLayout('character-sheet-gear');
    expect(layout.columnFacts).toEqual(['category', 'currency', 'rarity']);
    expect(layout.chipFacts).toEqual(['trainingPoints']);
  });

  it('select gear keeps Category / Currency / Rarity and chips TP (TASK-825)', () => {
    const layout = resolveGlrFactLayout({ entityType: 'gear', mode: 'select' });
    expect(layout.columnFacts).toEqual(['category', 'currency', 'rarity']);
    expect(layout.chipFacts).toEqual(['trainingPoints']);
  });

  it('characterCreate omits feat reqLevel', () => {
    const layout = resolveGlrFactLayout({
      entityType: 'feat',
      mode: 'browse',
      flags: { characterCreate: true },
    });
    expect(layout.columnFacts).not.toContain('reqLevel');
    expect(layout.columnFacts).toEqual(['category', 'abilityRequirement', 'uses', 'recovery']);
  });

  it('mixed shield phase aliases Block onto weapon Damage', () => {
    const layout = resolveGlrFactLayout({
      entityType: 'shield',
      mode: 'browse',
      flags: { mixedArmamentPhase: true },
    });
    expect(layout.columnFacts).toEqual(['rarity', 'currency', 'trainingPoints', 'range', 'damage']);
    expect(layout.aliasColumnKeys.block).toEqual(['damage', 'block']);
  });

  it('play shield keeps Damage then Block', () => {
    const layout = resolveGlrFactLayout({ entityType: 'shield', mode: 'play' });
    expect(layout.columnFacts).toEqual(['damage', 'block']);
  });

  it('detail mode has no columns', () => {
    const layout = resolveGlrFactLayout({ entityType: 'power', mode: 'detail' });
    expect(layout.columnFacts).toEqual([]);
    expect(layout.chipFacts.length).toBeGreaterThan(0);
  });

  it('detail technique chips every applicable fact (TASK-818)', () => {
    const layout = resolveGlrFactLayout({ entityType: 'technique', mode: 'detail' });
    expect(layout.columnFacts).toEqual([]);
    expect(layout.chipFacts).toEqual([
      'category',
      'energy',
      'trainingPoints',
      'actionType',
      'weapon',
      'damage',
    ]);
  });
});
