import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const resources = readFileSync(new URL('./sheet-header-resources.tsx', import.meta.url), 'utf8');

describe('sheet header Energy manual entry (86e3pvcm4)', () => {
  it('allows negative current Energy like Health (manual entry and stepper)', () => {
    const energyBlock = resources.slice(resources.indexOf('label="Energy"'));
    expect(energyBlock).toContain('min={Number.NEGATIVE_INFINITY}');
  });
});
