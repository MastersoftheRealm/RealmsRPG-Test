import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(path.join(import.meta.dirname, 'quick-armaments-sections.tsx'), 'utf8');

describe('QuickShieldsTable display (86e1vtdht / 86e3jwaw3)', () => {
  it('resolves block and damage from saved shield fields', () => {
    expect(source).toContain('resolveShieldBlockDisplay');
    expect(source).toContain('resolveShieldDamageDisplay');
    expect(source).toContain('getAttackBonus(shield, abilities, martialProf)');
  });
});
