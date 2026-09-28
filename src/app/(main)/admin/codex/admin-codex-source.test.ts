import { describe, expect, it } from 'vitest';
import {
  codexSourceForSave,
  codexSourceSelectValue,
  collectCodexSources,
  nextCodexSourceSelection,
} from './admin-codex-source';

describe('collectCodexSources', () => {
  it('returns trimmed unique sources in locale order', () => {
    expect(
      collectCodexSources([
        { source: ' Crafting Expansion ' },
        { source: 'Core Rules' },
        { source: 'Core Rules' },
        { source: '' },
        { source: null },
        {},
      ]),
    ).toEqual(['Core Rules', 'Crafting Expansion']);
  });
});

describe('codex source select', () => {
  const options = ['Core Rules'];

  it('shows None, a known source, or Add new', () => {
    expect(codexSourceSelectValue('', options, false)).toBe('');
    expect(codexSourceSelectValue('Core Rules', options, false)).toBe('Core Rules');
    expect(codexSourceSelectValue('Crafting Expansion', options, false)).toBe('__new__');
    expect(codexSourceSelectValue('Core Rules', options, true)).toBe('__new__');
  });

  it('clears a known source when Add new is chosen', () => {
    expect(nextCodexSourceSelection('__new__', 'Core Rules', options)).toEqual({
      value: '',
      addingNew: true,
    });
    expect(nextCodexSourceSelection('Core Rules', '', options)).toEqual({
      value: 'Core Rules',
      addingNew: false,
    });
  });

  it('saves a trimmed source and clears blanks', () => {
    expect(codexSourceForSave('  Core Rules  ')).toBe('Core Rules');
    expect(codexSourceForSave('   ')).toBeUndefined();
    expect(codexSourceForSave(null)).toBeUndefined();
  });
});
