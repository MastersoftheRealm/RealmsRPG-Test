import { describe, expect, it } from 'vitest';
import { mdxToSearchChunks, searchRulebook, stripMdx } from './rulebook-search';

describe('rulebook search', () => {
  it('strips markdown and HTML to plaintext', () => {
    expect(stripMdx('<h2 id="dice">Dice</h2>\n\nRoll **1d20**.')).toContain('Dice');
    expect(stripMdx('<h2 id="dice">Dice</h2>\n\nRoll **1d20**.')).toContain('1d20');
  });

  it('finds combat initiative across chapter MDX', () => {
    const source = `<h2 id="initiative">Initiative</h2>

When combat begins, each participant rolls for initiative order.`;
    const chunks = mdxToSearchChunks('combat-encounters', 'Combat Encounters', source);
    const hits = searchRulebook(chunks, 'initiative');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.href).toContain('/rules/combat-encounters');
    expect(hits[0]?.href).toContain('initiative');
  });

  it('maps Welcome hits to /rules, not /rules/welcome-to-realms', () => {
    const chunks = mdxToSearchChunks(
      'welcome-to-realms',
      'Welcome to Realms',
      '<h2 id="using-this-book">Using This Book</h2>\n\nSearch this book.',
    );
    const hits = searchRulebook(chunks, 'search this');
    expect(hits[0]?.href).toBe('/rules#using-this-book');
    expect(hits[0]?.href).not.toContain('/rules/welcome-to-realms');
  });

  it('requires at least two characters', () => {
    const hits = searchRulebook(
      [{ slug: 'x', chapterTitle: 'X', headingId: '', headingTitle: 'X', text: 'armor' }],
      'a',
    );
    expect(hits).toEqual([]);
  });
});
