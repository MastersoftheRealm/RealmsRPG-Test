import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('sheet allocation reset UI (86e3jvcge)', () => {
  it('wires reset controls in abilities and skills spend panels', () => {
    const abilitiesSection = read('components/character-sheet/abilities-section.tsx');
    expect(abilitiesSection).toContain('SheetAllocationResetButton');
    expect(abilitiesSection).toContain('hasNonDefaultAbilityScores');
    expect(read('components/character-sheet/skills-section.tsx')).toContain(
      'SheetAllocationResetButton',
    );
    expect(read('components/character-sheet/character-sheet-body.tsx')).toContain(
      'onResetAbilityAllocations',
    );
    expect(read('components/character-sheet/character-sheet-body.tsx')).toContain(
      'onResetSkillAllocations',
    );
  });

  it('loads confirm copy from onboarding-copy module', () => {
    const button = read('components/character-sheet/sheet-allocation-reset-button.tsx');
    expect(button).toContain('ONBOARDING_COPY.allocationReset');
    expect(read('lib/constants/copy/onboarding-copy.ts')).toContain('allocationReset');
  });
});
