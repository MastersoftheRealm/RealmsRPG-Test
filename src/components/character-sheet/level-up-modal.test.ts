import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { calculateMaxCharacterFeats } from '@/lib/game/formulas';

describe('level up Feats card shows archetype and character gains (86e3jv2j9)', () => {
  it('level 2 to 3 gains one character feat', () => {
    expect(calculateMaxCharacterFeats(3) - calculateMaxCharacterFeats(2)).toBe(1);
  });

  it('renders both feat deltas on the Feats card', () => {
    const source = readFileSync(path.join(import.meta.dirname, 'level-up-modal.tsx'), 'utf8');
    const linesStart = source.indexOf('const featGainLines');
    const linesEnd = source.indexOf('];', linesStart);
    const lines = source.slice(linesStart, linesEnd);
    const cardStart = source.indexOf('label="Feats"');
    const cardEnd = source.indexOf('/>', cardStart);
    const card = source.slice(cardStart, cardEnd);

    expect(lines).toContain('gains.archetypeFeats');
    expect(lines).toContain('gains.characterFeats');
    expect(lines).toContain("label: 'Archetype'");
    expect(lines).toContain("label: 'Character'");
    expect(card).toContain('lines={featGainLines}');
    expect(card).not.toContain('value={formatDelta(gains.archetypeFeats)}');
  });
});
