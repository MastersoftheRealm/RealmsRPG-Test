import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const metaPath = path.join(import.meta.dirname, 'item-creator-editor-meta.tsx');

describe('Item creator item type toggle (86e3jxgxb)', () => {
  it('uses full-width equal segments so Weapon/Armor/Shield stay on one row at 375px', () => {
    const source = readFileSync(metaPath, 'utf8');
    expect(source).toContain('item-creator-item-type');
    expect(source).toMatch(/<SegmentedControl[\s\S]*equalWidth/);
    expect(source).toMatch(/<SegmentedControl[\s\S]*className="w-full"/);
  });
});
