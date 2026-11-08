import { describe, expect, it } from 'vitest';
import type { SaveArchetypeWithPathInput } from '@/app/(main)/admin/codex/codex-archetype-write';
import {
  normalizeCodexCommaListColumn,
  normalizeSaveArchetypeWithPathInput,
  saveArchetypeWithPathInputError,
} from '@/lib/codex-archetype-path-save-validation';

const validBase: SaveArchetypeWithPathInput = {
  id: '5',
  name: 'Blade',
  type: 'martial',
  levels: [{ level: 2, feats: '1' }],
};

describe('saveArchetypeWithPathInputError', () => {
  it('accepts a well-formed workspace payload', () => {
    expect(saveArchetypeWithPathInputError(validBase)).toBeNull();
  });

  it('rejects unsupported top-level fields', () => {
    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        archetype_id: '9',
      } as SaveArchetypeWithPathInput),
    ).toMatch(/unsupported fields/i);
  });

  it('rejects ids that would be sanitized or non-numeric', () => {
    expect(saveArchetypeWithPathInputError({ ...validBase, id: '5;drop' })).toMatch(
      /numeric codex id/i,
    );
    expect(saveArchetypeWithPathInputError({ ...validBase, id: '05' })).toMatch(
      /canonical numeric/i,
    );
  });

  it('rejects malformed archetype JSON before coercion', () => {
    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        level1_recommended_abilities: { strength: [] },
      }),
    ).toMatch(/finite number/i);
    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        level1_loadouts: '""',
      }),
    ).toMatch(/JSON object or array/i);
  });

  it('rejects int4 overflow progression levels', () => {
    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        levels: [{ level: 2_147_483_648 }],
      }),
    ).toMatch(/database storage/i);
    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        levels: [{ level: 201 }],
      }),
    ).toBeNull();
  });

  it('rejects progression rows that would be silently dropped', () => {
    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        levels: [{ level: 1, feats: '1' }],
      }),
    ).toMatch(/level 1 is stored on the archetype row/i);

    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        levels: [{ level: Number.NaN }],
      }),
    ).toMatch(/integer/i);
  });

  it('rejects nested progression list fields with invalid element types', () => {
    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        levels: [{ level: 2, feats: { bad: true } as unknown as string }],
      }),
    ).toMatch(/string or array of strings/i);
  });

  it('rejects oversized progression arrays', () => {
    const levels = Array.from({ length: 201 }, (_, i) => ({ level: i + 2 }));
    expect(
      saveArchetypeWithPathInputError({
        ...validBase,
        levels,
      }),
    ).toMatch(/maximum of 200/i);
  });
});

describe('normalizeCodexCommaListColumn', () => {
  it.each([
    ['native array', ['1', '2'], '1, 2'],
    ['comma string', '1,2', '1, 2'],
    ['empty', '', null],
  ] as const)('normalizes %s to canonical TEXT storage', (_label, input, expected) => {
    expect(normalizeCodexCommaListColumn(input)).toBe(expected);
  });
});

describe('normalizeSaveArchetypeWithPathInput', () => {
  const guidance = [{ id: 'g1', title: 'Starter', feats: ['1'] }];
  const abilities = { strength: 3 };
  const loadouts = { armorStep: 'optional', sharedEquipment: [{ id: '3', quantity: 2 }] };

  it('parses validated JSON strings into objects for persistence', () => {
    const normalized = normalizeSaveArchetypeWithPathInput({
      ...validBase,
      level1_guidance_groups: JSON.stringify(guidance),
      level1_recommended_abilities: JSON.stringify(abilities),
      level1_loadouts: JSON.stringify(loadouts),
    });
    expect(normalized.level1_guidance_groups).toEqual(guidance);
    expect(normalized.level1_recommended_abilities).toEqual(abilities);
    expect(normalized.level1_loadouts).toEqual(loadouts);
  });

  it('maps empty JSON inputs to null', () => {
    const normalized = normalizeSaveArchetypeWithPathInput({
      ...validBase,
      level1_guidance_groups: '',
      level1_recommended_abilities: '   ',
      level1_loadouts: null,
    });
    expect(normalized.level1_guidance_groups).toBeNull();
    expect(normalized.level1_recommended_abilities).toBeNull();
    expect(normalized.level1_loadouts).toBeNull();
  });
});
