import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ArchetypeSelector } from './archetype-selector';

describe('ArchetypeSelector powered-martial display (86e3jx4dn)', () => {
  it('keeps split labels aligned with stored proficiency when max proficiency increases', () => {
    const onTypeChange = vi.fn();
    const onProficiencyChange = vi.fn();

    const markupAtLevel1 = renderToStaticMarkup(
      <ArchetypeSelector
        value="powered-martial"
        powerProficiency={1}
        martialProficiency={1}
        maxProficiency={2}
        onTypeChange={onTypeChange}
        onProficiencyChange={onProficiencyChange}
      />,
    );

    expect(markupAtLevel1).toContain('>1<');
    expect(markupAtLevel1).not.toContain(
      '>2</span>\n          </div>\n          <div class="text-center">\n            <span',
    );

    const markupAtLevel5 = renderToStaticMarkup(
      <ArchetypeSelector
        value="powered-martial"
        powerProficiency={1}
        martialProficiency={1}
        maxProficiency={3}
        onTypeChange={onTypeChange}
        onProficiencyChange={onProficiencyChange}
      />,
    );

    const martialMatches = markupAtLevel5.match(/text-martial-fg[^>]*>(\d+)</g) ?? [];
    const martialValues = martialMatches.map((m) => m.match(/>(\d+)</)?.[1]);
    expect(martialValues).toContain('1');
    expect(martialValues).not.toContain('2');
    expect(markupAtLevel5).toContain('Total: 3 points');
  });

  it('matches slider thumb to Power 2 / Martial 0 when allowZeroEnds (86e3jywd3)', () => {
    const markup = renderToStaticMarkup(
      <ArchetypeSelector
        value="powered-martial"
        powerProficiency={2}
        martialProficiency={0}
        maxProficiency={2}
        onTypeChange={vi.fn()}
        onProficiencyChange={vi.fn()}
        allowZeroEnds
      />,
    );

    expect(markup).toMatch(/value="0"/);
    expect(markup).toContain('>2<');
    expect(markup).toContain('>0<');
  });
});
