import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  featUsesAfterFullRecovery,
  featUsesAfterPartialRecovery,
  findCodexFeatRecovery,
  formatRecoveryUseReset,
  recoveryUseNames,
  resolvedFeatUses,
  traitUseResetValue,
} from './recovery-uses';

const partialFeat = {
  name: 'Second Wind',
  currentUses: 0,
  maxUses: 1,
  recovery: 'Partial Recovery',
};
const familiar = {
  name: 'Familiar',
  currentUses: 0,
  maxUses: 1,
  recovery: 'Full Recovery',
};

describe('recovery modal lists the uses that will refresh (86e3jv00w)', () => {
  it('names a spent partial feat and Familiar on full, and only the partial feat on partial', () => {
    const feats = [partialFeat, familiar];

    expect(recoveryUseNames(feats, [], 'full')).toEqual(['Second Wind', 'Familiar']);
    expect(recoveryUseNames(feats, [], 'partial')).toEqual(['Second Wind']);
    expect(formatRecoveryUseReset(recoveryUseNames(feats, [], 'full'), 'full')).toBe(
      'Resets 2 ability uses: Second Wind, Familiar',
    );
    expect(formatRecoveryUseReset(recoveryUseNames(feats, [], 'partial'), 'partial')).toBe(
      'Resets 1 partial-recovery ability use: Second Wind',
    );
  });

  it('still names Familiar when recovery and uses live only on the codex row', () => {
    const sheetFeat = { id: 'feat-familiar', name: 'Familiar', currentUses: 0 };
    const codex = findCodexFeatRecovery(sheetFeat, [
      { id: 'feat-familiar', name: 'Familiar', rec_period: 'Full Recovery', uses_per_rec: 1 },
    ]);
    const resolved = resolvedFeatUses(sheetFeat, codex);
    const feats = [{ name: sheetFeat.name, currentUses: 0, ...resolved }];

    expect(recoveryUseNames(feats, [], 'full')).toEqual(['Familiar']);
    expect(recoveryUseNames(feats, [], 'partial')).toEqual([]);
  });

  it('omits uses that are already full', () => {
    expect(
      recoveryUseNames(
        [{ name: 'Familiar', currentUses: 1, maxUses: 1, recovery: 'Full Recovery' }],
        [{ name: 'Keen Senses', currentUses: 2, maxUses: 2, recovery: 'Partial Recovery' }],
        'full',
      ),
    ).toEqual([]);
    expect(formatRecoveryUseReset([], 'full')).toBeNull();
  });

  it('full recovery names every trait with uses; partial names only a partial period', () => {
    const traits = [
      { name: 'Keen Senses', currentUses: 0, maxUses: 2, recovery: 'Partial Recovery' },
      { name: 'Darkvision', currentUses: 0, maxUses: 1, recovery: 'Full Recovery' },
    ];

    expect(recoveryUseNames([], traits, 'full')).toEqual(['Keen Senses', 'Darkvision']);
    expect(recoveryUseNames([], traits, 'partial')).toEqual(['Keen Senses']);
    expect(traitUseResetValue({ uses_per_rec: 1, rec_period: 'short' }, 'partial')).toBeUndefined();
    expect(traitUseResetValue({ uses_per_rec: 1, rec_period: 'short' }, 'full')).toBe(1);
  });

  it('matches the handler when a feat has no recovery period', () => {
    expect(featUsesAfterFullRecovery(0, undefined, 2)).toBe(0);
    expect(featUsesAfterPartialRecovery(0, 'Partial Recovery', 2, true)).toBe(2);
    expect(featUsesAfterPartialRecovery(0, 'Partial Recovery', 0, true)).toBe(0);
    expect(featUsesAfterFullRecovery(undefined, 'Full Recovery', 1)).toBe(1);
  });

  it('falls back to the codex name when the id does not match', () => {
    const row = findCodexFeatRecovery({ id: 'missing', name: 'Familiar' }, [
      { id: 'feat-familiar', name: 'familiar', rec_period: 'Full', uses_per_rec: 1 },
    ]);
    expect(row?.uses_per_rec).toBe(1);
    expect(resolvedFeatUses({ recovery: 'Partial', maxUses: 3 }, row)).toEqual({
      recovery: 'Partial',
      maxUses: 3,
    });
  });

  it('wires the modal and the save path to the same list', () => {
    const modal = readFileSync(
      path.join(import.meta.dirname, '../../components/character-sheet/recovery-modal.tsx'),
      'utf8',
    );
    const sheetModals = readFileSync(
      path.join(import.meta.dirname, '../../app/(detail)/characters/[id]/CharacterSheetModals.tsx'),
      'utf8',
    );
    const actions = readFileSync(
      path.join(
        import.meta.dirname,
        '../../components/character-sheet/use-sheet-resource-actions.ts',
      ),
      'utf8',
    );

    expect(modal).toContain('recoveryUseNames');
    expect(modal).toContain('formatRecoveryUseReset');
    expect(sheetModals).toContain('resolvedFeatUses');
    expect(sheetModals).toContain('findCodexFeatRecovery');
    expect(actions).toContain('featUsesAfterFullRecovery');
    expect(actions).toContain('featUsesAfterPartialRecovery');
    expect(actions).toContain('traitUseResetValue');
  });
});
