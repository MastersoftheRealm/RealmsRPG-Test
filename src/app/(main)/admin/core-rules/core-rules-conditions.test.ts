import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  LEVELED_CONDITION_NAMES,
  readConditionsEditor,
  writeConditionsEditor,
} from './core-rules-conditions';

const STANDARD_NAMES = [
  'Blinded',
  'Charmed',
  'Restrained',
  'Dazed',
  'Deafened',
  'Dying',
  'Faint',
  'Grappled',
  'Hidden',
  'Immobile',
  'Invisible',
  'Prone',
  'Terminal',
];

/** Stored CONDITIONS shape: one flat map, no standard or leveled arrays. */
function flatRow(name: string): { name: string; description: string } {
  return { name, description: `${name} stored` };
}

function storedConditions(): Record<string, { name: string; description: string }> {
  const data: Record<string, { name: string; description: string }> = {};
  for (const name of [...STANDARD_NAMES, ...LEVELED_CONDITION_NAMES]) {
    data[name.toLowerCase()] = flatRow(name);
  }
  return data;
}

describe('Core Rules Conditions editor (86e3juy5z)', () => {
  it('lists the flat stored row instead of showing 0 standard and 0 leveled', () => {
    const stored = storedConditions();
    const model = readConditionsEditor(stored);

    expect(stored).not.toHaveProperty('standard');
    expect(stored).not.toHaveProperty('leveled');
    expect(model.standard).toHaveLength(STANDARD_NAMES.length);
    expect(model.leveled).toHaveLength(LEVELED_CONDITION_NAMES.length);
    expect(model.standard.map((row) => row.name)).toEqual(STANDARD_NAMES);
    expect(model.leveled.map((row) => row.name)).toEqual([...LEVELED_CONDITION_NAMES]);
    expect(model.standard.find((row) => row.name === 'Blinded')?.description).toBe(
      'Blinded stored',
    );
    expect(model.leveled.find((row) => row.name === 'Bleed')?.description).toBe('Bleed stored');
    expect(model.stackingRules).toBe('');
    expect(model.standard.length + model.leveled.length).toBe(23);
  });

  it('keeps the flat map when a stored description changes', () => {
    const stored = {
      blinded: flatRow('Blinded'),
      bleed: flatRow('Bleed'),
      dazed: flatRow('Dazed'),
    };
    const model = readConditionsEditor(stored);
    const blinded = model.standard.find((row) => row.name === 'Blinded');
    if (!blinded) throw new Error('Blinded was not listed');
    blinded.description = 'Updated blinded text';

    const next = writeConditionsEditor(stored, model);

    expect(next).not.toHaveProperty('standard');
    expect(next).not.toHaveProperty('leveled');
    expect(Object.keys(next)).toEqual(['blinded', 'bleed', 'dazed']);
    expect(next.blinded).toEqual({ name: 'Blinded', description: 'Updated blinded text' });
    expect(next.bleed).toEqual(flatRow('Bleed'));
    expect(next.dazed).not.toHaveProperty('leveled');
  });

  it('round-trips the stored flat row without adding leveled or stacking rules', () => {
    const stored = storedConditions();
    expect(writeConditionsEditor(stored, readConditionsEditor(stored))).toEqual(stored);
  });

  it('still lists a stored condition that is not in the written standard or leveled names', () => {
    const stored = {
      petrified: { name: 'Petrified', description: 'Stored extra' },
      marked: { name: 'Marked', description: 'Also stored', leveled: true },
    };
    const model = readConditionsEditor(stored);
    expect(model.standard.map((row) => row.name)).toEqual(['Petrified']);
    expect(model.leveled.map((row) => row.name)).toEqual(['Marked']);
    expect(writeConditionsEditor(stored, model)).toEqual(stored);
  });

  it('adds a new leveled condition on the flat map and drops a removed one', () => {
    const stored = { blinded: flatRow('Blinded'), bleed: flatRow('Bleed') };
    const model = readConditionsEditor(stored);
    const withoutBleed = {
      ...model,
      leveled: model.leveled.filter((row) => row.name !== 'Bleed'),
    };
    withoutBleed.leveled.push({
      key: '',
      name: 'New Condition',
      description: '',
      leveled: true,
    });

    const next = writeConditionsEditor(stored, withoutBleed);
    expect(next).not.toHaveProperty('bleed');
    expect(next).not.toHaveProperty('standard');
    expect(next.blinded).toEqual(flatRow('Blinded'));
    expect(next.newcondition).toEqual({
      name: 'New Condition',
      description: '',
      leveled: true,
    });
  });

  it('keeps the standard and leveled arrays when that is the stored shape', () => {
    const stored = {
      standard: [{ name: 'Blinded', leveled: false, description: 'a' }],
      leveled: [{ name: 'Bleed', leveled: true, description: 'b' }],
      stackingRules: 'Stronger replaces weaker.',
    };
    expect(writeConditionsEditor(stored, readConditionsEditor(stored))).toEqual(stored);
  });

  it('wires the Conditions editor to the stored-row reader', () => {
    const src = readFileSync(
      path.join(import.meta.dirname, 'core-rules-conditions-editor.tsx'),
      'utf8',
    );
    expect(src).toContain('readConditionsEditor');
    expect(src).toContain('writeConditionsEditor');
    expect(src).not.toContain('data.standard');
    expect(src).not.toContain('data.leveled');
  });
});
