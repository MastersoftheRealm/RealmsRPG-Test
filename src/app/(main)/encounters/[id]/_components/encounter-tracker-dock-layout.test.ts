import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const globals = readFileSync(new URL('../../../../globals.css', import.meta.url), 'utf8');
const encounterConstants = readFileSync(
  new URL('../../../../../components/encounters/encounter-constants.ts', import.meta.url),
  'utf8',
);
const combatView = readFileSync(new URL('./CombatEncounterView.tsx', import.meta.url), 'utf8');
const combatLayout = readFileSync(
  new URL('./combat/combat-encounter-layout.ts', import.meta.url),
  'utf8',
);
const skillView = readFileSync(new URL('./SkillEncounterView.tsx', import.meta.url), 'utf8');
const combatList = readFileSync(
  new URL('./combat/combat-combatant-list.tsx', import.meta.url),
  'utf8',
);
const combatSidebar = readFileSync(
  new URL('./combat/combat-add-sidebar.tsx', import.meta.url),
  'utf8',
);
const resources = readFileSync(
  new URL('../../../../../components/encounters/combatant-card-resources.tsx', import.meta.url),
  'utf8',
);
const compactResources = resources.slice(
  resources.indexOf("if (variant === 'compact')"),
  resources.lastIndexOf('return ('),
);

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

  it('lets the gutter move Energy controls instead of painting through the padding', () => {
    expect(compactResources.length).toBeGreaterThan(0);
    expect(combatView).toContain('COMBAT_ENCOUNTER_LAYOUT_CLASS');
    expect(combatLayout).toMatch(/grid min-w-0 grid-cols-1 gap-6/);
    expect(combatView).toMatch(/flex min-h-0 min-w-0 flex-col gap-4/);
    expect(combatList).toMatch(/min-h-\[300px\] min-w-0 flex-1/);
    expect(combatSidebar).toMatch(/flex min-h-0 min-w-0 flex-col space-y-6/);
    expect(compactResources).toContain('mb-2 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2');
    expect(compactResources).not.toContain('mb-2 flex items-center gap-3');
    expect(compactResources).toMatch(/flex min-w-0 flex-wrap items-center gap-1/);
    expect(compactResources).toMatch(/w-10 min-w-0/);
    expect(compactResources).toContain('relative mt-1 h-1.5 min-w-0 overflow-hidden rounded-full');
  });
});
