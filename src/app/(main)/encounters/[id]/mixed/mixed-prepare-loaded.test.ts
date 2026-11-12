import { describe, expect, it } from 'vitest';
import { createDefaultEncounter } from '@/types/encounter';
import { prepareMixedEncounter } from './prepare-mixed-encounter';

describe('prepareMixedEncounter', () => {
  it('hydrates missing skillEncounter so mixed skill tab is not stuck initializing', () => {
    const raw = {
      ...createDefaultEncounter('mixed', 'M'),
      id: 'mixed-1',
      skillEncounter: undefined,
    };
    const prepared = prepareMixedEncounter(raw);
    expect(prepared.skillEncounter).toBeDefined();
    expect(prepared.skillEncounter?.useInitiative).toBe(true);
  });
});
