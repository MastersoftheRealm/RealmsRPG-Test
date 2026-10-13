import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const archetypeSelector = readFileSync(
  new URL('./archetype-selector.tsx', import.meta.url),
  'utf8',
);
const alert = readFileSync(new URL('../ui/alert.tsx', import.meta.url), 'utf8');
const coreRulesSections = readFileSync(
  new URL('../../app/(main)/admin/core-rules/core-rules-field-editors.tsx', import.meta.url),
  'utf8',
);

describe('heading order (86e3k0ckq)', () => {
  it('names archetype types as h3 under the creator section h2', () => {
    expect(archetypeSelector).toContain(
      '<h3 className="font-bold text-primary-fg">{info.title}</h3>',
    );
    expect(archetypeSelector).not.toContain('<h4');
  });

  it('keeps alert titles out of the heading outline', () => {
    expect(alert).toContain('<p className="mb-1 font-semibold">{title}</p>');
    expect(alert).not.toContain('<h4');
  });

  it('uses h2 for core-rules section titles under the page h1', () => {
    expect(coreRulesSections).toContain(
      '<h2 className="mt-4 mb-2 border-b border-border pb-1 text-base font-semibold text-text-primary">',
    );
    expect(coreRulesSections).not.toContain('<h3 className="mt-4 mb-2');
  });
});
