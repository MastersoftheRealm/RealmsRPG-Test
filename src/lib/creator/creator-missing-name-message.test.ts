import { describe, expect, it } from 'vitest';
import {
  creatorMissingNameMessage,
  creatorMissingNameSaveDisabledReason,
} from './creator-missing-name-message';

describe('creatorMissingNameMessage (86e3jp7eb)', () => {
  it('uses entity-specific copy for library types', () => {
    expect(creatorMissingNameMessage('powers')).toBe('Please enter a power name');
    expect(creatorMissingNameMessage('techniques')).toBe('Please enter a technique name');
    expect(creatorMissingNameMessage('empowered-techniques')).toBe(
      'Please enter a empowered-technique name',
    );
    expect(creatorMissingNameMessage('species')).toBe('Please enter a species name');
  });

  it('returns a save-disabled reason only when the name is blank', () => {
    expect(creatorMissingNameSaveDisabledReason('  ', 'powers')).toBe('Please enter a power name');
    expect(creatorMissingNameSaveDisabledReason('Bolt', 'powers')).toBeNull();
  });
});
