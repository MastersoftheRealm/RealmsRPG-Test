import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { itemCreatorFormAfterSave } from './item-creator-save-reset';

describe('item creator save reset (86e3jww8a)', () => {
  it('returns empty defaults while keeping the current armament type', () => {
    const next = itemCreatorFormAfterSave('Shield');
    expect(next.armamentType).toBe('Shield');
    expect(next.name).toBe('');
    expect(next.hasShieldDamage).toBe(false);
    expect(next.shieldDR).toEqual({ amount: 1, size: 4 });
  });

  it('wires full reset into onSaveSuccess', () => {
    const workspace = readFileSync(
      path.join(import.meta.dirname, 'use-item-creator-workspace.ts'),
      'utf8',
    );
    expect(workspace).toContain('itemCreatorFormAfterSave(armamentType)');
    expect(workspace).toContain('resetFormAfterSave');
    expect(workspace).toContain('itemCreatorFormAfterSave(armamentType)');
  });
});
