import { describe, expect, it } from 'vitest';
import { stripRedundantPathHelpLead } from './path-help-card';

describe('stripRedundantPathHelpLead (86e1vtb4d)', () => {
  it('removes a duplicate leading "As a {pathName}," prefix from codex notes', () => {
    const notes =
      'As a Necromancer, some recommended techniques have been added to your list. Look through them and keep the ones you would like.';
    expect(stripRedundantPathHelpLead(notes, 'Necromancer')).toBe(
      'some recommended techniques have been added to your list. Look through them and keep the ones you would like.',
    );
  });

  it('leaves notes unchanged when the prefix is absent', () => {
    const notes = 'Some recommended techniques have been added to your list.';
    expect(stripRedundantPathHelpLead(notes, 'Necromancer')).toBe(notes);
  });
});
