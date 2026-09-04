import { describe, expect, it } from 'vitest';
import { classifyRulebookCallout, rulebookCalloutClassName } from './rulebook-callout';

describe('rulebook callouts (TASK-905)', () => {
  it('classifies boxed-text prefixes from the manuscript', () => {
    expect(classifyRulebookCallout('Write This Down... note this')).toBe('write-down');
    expect(classifyRulebookCallout('Player Tip. Try this.')).toBe('tip');
    expect(classifyRulebookCallout('Four adventurers, Kadin, Isolde')).toBe('example');
    expect(classifyRulebookCallout('Each chapter can be referenced')).toBe('note');
  });

  it('uses theme-aware surfaces, not raw hex', () => {
    const writeDown = rulebookCalloutClassName('write-down');
    const note = rulebookCalloutClassName('note');
    expect(writeDown).toContain('bg-warning-light');
    expect(writeDown).toContain('border-warning-300');
    expect(writeDown).not.toMatch(/\bdark:/);
    expect(note).toContain('bg-primary-subtle-bg');
    expect(writeDown).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(note).not.toMatch(/#[0-9a-f]{3,8}/i);
  });
});
