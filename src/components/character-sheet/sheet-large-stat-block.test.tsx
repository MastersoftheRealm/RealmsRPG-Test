import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LargeStatBlock } from './sheet-large-stat-block';

describe('LargeStatBlock (86e3k0h3u)', () => {
  it('gives each Temp Modifier toggle an accessible name that includes the stat label', () => {
    const html = renderToStaticMarkup(
      <LargeStatBlock
        label="Evasion"
        value={12}
        isTempModifierMode
        tempDelta={0}
        onTempDeltaChange={() => {}}
      />,
    );
    expect(html).toContain('aria-label="Evasion Temp Modifier"');
    expect(html).toContain('aria-pressed="false"');
  });
});
