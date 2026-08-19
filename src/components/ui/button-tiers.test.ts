import { describe, expect, it } from 'vitest';
import { buttonVariants } from './button';
import { iconButtonVariants } from './icon-button';

describe('ADR-0023 button touch tiers (TASK-841)', () => {
  it('never applies a global min-w slab', () => {
    const variants = ['primary', 'secondary', 'danger', 'ghost', 'outline', 'link'] as const;
    const sizes = ['sm', 'md', 'lg', 'xl', 'icon'] as const;
    for (const variant of variants) {
      for (const size of sizes) {
        expect(buttonVariants({ variant, size })).not.toMatch(/min-w-\[44px\]/);
      }
    }
    expect(iconButtonVariants({ size: 'md' })).not.toMatch(/min-w-\[44px\]/);
  });

  it('maps md to Standard and lg/xl to Primary', () => {
    expect(buttonVariants({ size: 'md' })).toContain('touch-tier-standard');
    expect(buttonVariants({ size: 'lg' })).toContain('touch-tier-primary');
    expect(buttonVariants({ size: 'xl' })).toContain('touch-tier-primary');
  });

  it('maps size sm and variant link to Dense expanded hit', () => {
    expect(buttonVariants({ size: 'sm' })).toContain('hit-area-dense');
    expect(buttonVariants({ size: 'sm' })).not.toContain('touch-tier-standard');
    expect(buttonVariants({ variant: 'link' })).toContain('hit-area-dense');
  });

  it('sizes IconButton as an explicit square', () => {
    expect(iconButtonVariants({ size: 'sm' })).toContain('hit-area-dense-square');
    expect(iconButtonVariants({ size: 'md' })).toContain('[@media(pointer:coarse)]:h-11');
    expect(iconButtonVariants({ size: 'md' })).toContain('[@media(pointer:coarse)]:w-11');
    expect(iconButtonVariants({ size: 'lg' })).toContain('[@media(pointer:coarse)]:h-12');
  });
});
