import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const modal = readFileSync(new URL('./mixed-species-modal.tsx', import.meta.url), 'utf8');

describe('MixedSpeciesModal My species empty (86e3jmr0e)', () => {
  it('shows an empty state when My species has no custom entries', () => {
    expect(modal).toContain("source === 'my' && filteredSpecies.length === 0");
    expect(modal).toContain('No custom species yet');
    expect(modal).toContain('Open Species Creator');
  });
});
