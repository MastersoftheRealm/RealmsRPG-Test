import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const globals = readFileSync(new URL('../../../../globals.css', import.meta.url), 'utf8');
const encounterConstants = readFileSync(
  new URL('../../../../../components/encounters/encounter-constants.ts', import.meta.url),
  'utf8',
);
const combatView = readFileSync(new URL('./CombatEncounterView.tsx', import.meta.url), 'utf8');
const skillView = readFileSync(new URL('./SkillEncounterView.tsx', import.meta.url), 'utf8');

describe('encounter tracker Roll Log dock clearance (86e3k915w)', () => {
  it('registers a dock-frame class with C4 fab gutter tokens', () => {
    expect(encounterConstants).toContain('ENCOUNTER_TRACKER_DOCK_FRAME_CLASS');
    expect(encounterConstants).toContain("'encounter-tracker-dock-frame'");
    expect(globals).toContain('.encounter-tracker-dock-frame');
    expect(globals).toMatch(/padding-inline-end: var\(--sheet-mobile-fab-gutter\)/);
    expect(globals).toMatch(
      /\.encounter-tracker-dock-frame[\s\S]*padding-bottom: var\(--dock-reserved-end\)/,
    );
  });

  it('applies the dock frame when RollLog is shown on combat and skill play surfaces', () => {
    expect(combatView).toContain('ENCOUNTER_TRACKER_DOCK_FRAME_CLASS');
    expect(combatView).toMatch(/showRollLog && ENCOUNTER_TRACKER_DOCK_FRAME_CLASS/);
    expect(skillView).toContain('ENCOUNTER_TRACKER_DOCK_FRAME_CLASS');
    expect(skillView).toMatch(/showRollLog && ENCOUNTER_TRACKER_DOCK_FRAME_CLASS/);
  });
});
