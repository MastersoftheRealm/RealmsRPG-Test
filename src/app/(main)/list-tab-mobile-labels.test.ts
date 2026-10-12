import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const crafting = readFileSync(new URL('./crafting/page.tsx', import.meta.url), 'utf8');
const campaigns = readFileSync(new URL('./campaigns/page.tsx', import.meta.url), 'utf8');

describe('list tab labels at phone width (86e3k918a)', () => {
  it('shortens crafting and campaign tabs below md so the last tab is not clipped', () => {
    expect(crafting).toContain("labelMobile: 'Progress'");
    expect(crafting).toContain("labelMobile: 'Done'");
    expect(campaigns).toContain("labelMobile: 'My'");
    expect(campaigns).toContain("labelMobile: 'Create'");
    expect(campaigns).toContain("labelMobile: 'Join'");
  });
});
