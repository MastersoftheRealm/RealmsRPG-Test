import { describe, expect, it } from 'vitest';
import { resolveAdminLeveledFeatAddSource } from './use-admin-leveled-feat-session';
import {
  isAdminPendingFeatLevelId,
  newAdminPendingFeatLevelId,
} from './admin-pending-feat-level-id';

describe('admin pending feat level ids', () => {
  it('marks client-only draft ids', () => {
    const id = newAdminPendingFeatLevelId();
    expect(isAdminPendingFeatLevelId(id)).toBe(true);
    expect(isAdminPendingFeatLevelId('42')).toBe(false);
  });
});

describe('resolveAdminLeveledFeatAddSource', () => {
  const base = { name: 'Test', feat_lvl: 1 as number | undefined, base_feat_id: '' };

  it('uses the current form when it is already the family peak', () => {
    const family = [
      { id: '1', lvl: 1, form: { ...base, feat_lvl: 1 } },
      { id: '2', lvl: 2, form: { ...base, feat_lvl: 2, base_feat_id: '1' } },
    ];
    const result = resolveAdminLeveledFeatAddSource({
      form: family[1]!.form,
      selectedEditId: '2',
      fallbackEditId: '1',
      family,
    });
    expect(result).toEqual({ sourceForm: family[1]!.form, sourceDbFeatId: '2' });
  });

  it('uses the family peak when the selected row is below it', () => {
    const family = [
      { id: '1', lvl: 1, form: { ...base, feat_lvl: 1 } },
      { id: '2', lvl: 2, form: { ...base, feat_lvl: 2, base_feat_id: '1' } },
    ];
    const result = resolveAdminLeveledFeatAddSource({
      form: family[0]!.form,
      selectedEditId: '1',
      fallbackEditId: '1',
      family,
    });
    expect(result).toEqual({ sourceForm: family[1]!.form, sourceDbFeatId: '2' });
  });

  it('includes unsaved pending rows when picking the peak', () => {
    const pending = newAdminPendingFeatLevelId();
    const family = [
      { id: '1', lvl: 1, form: { ...base, feat_lvl: 1 } },
      { id: pending, lvl: 3, form: { ...base, feat_lvl: 3, base_feat_id: '1' } },
    ];
    const result = resolveAdminLeveledFeatAddSource({
      form: family[0]!.form,
      selectedEditId: '1',
      fallbackEditId: '1',
      family,
    });
    expect(result?.sourceDbFeatId).toBe(pending);
    expect(result?.sourceForm.feat_lvl).toBe(3);
  });
});
