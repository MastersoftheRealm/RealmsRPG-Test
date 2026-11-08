import { describe, expect, it } from 'vitest';
import type { SaveArchetypeWithPathInput } from '@/app/(main)/admin/codex/codex-archetype-write';
import { saveArchetypeWithPathInputError } from '@/lib/codex-archetype-path-save-validation';

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
