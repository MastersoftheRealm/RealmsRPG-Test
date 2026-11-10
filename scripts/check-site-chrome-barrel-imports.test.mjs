import { describe, expect, it } from 'vitest';
import { findForbiddenBarrelImports } from './check-site-chrome-barrel-imports.mjs';

describe('findForbiddenBarrelImports', () => {
  it('flags a patterns root barrel import in site chrome', () => {
    const masterStyle = `import { ThemeToggle, InfoTippy } from '@/components/patterns';`;
    expect(findForbiddenBarrelImports(masterStyle)).toEqual(['patterns-barrel']);
  });

  it('allows direct pattern subpath imports', () => {
    const fixed = `
      import { ThemeToggle } from '@/components/patterns/chrome/theme-toggle';
      import { InfoTippy } from '@/components/patterns/help/info-tippy';
    `;
    expect(findForbiddenBarrelImports(fixed)).toEqual([]);
  });
});
