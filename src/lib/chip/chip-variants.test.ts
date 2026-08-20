import { describe, expect, expectTypeOf, it } from 'vitest';
import type { VariantProps } from 'class-variance-authority';
import { chipVariants } from '@/components/ui/chip';

type ChipVariant = NonNullable<VariantProps<typeof chipVariants>['variant']>;

describe('chipVariants', () => {
  it('keeps info, power, and technique tokens', () => {
    expect(chipVariants({ variant: 'info' })).toContain('bg-info-light');
    expect(chipVariants({ variant: 'power' })).toContain('bg-power-light');
    expect(chipVariants({ variant: 'technique' })).toContain('bg-martial-light');
  });

  it('drops unused deprecated equipment/content keys', () => {
    expectTypeOf<
      Extract<
        ChipVariant,
        'weapon' | 'armor' | 'shield' | 'feat' | 'proficiency' | 'secondary' | 'outline'
      >
    >().toEqualTypeOf<never>();
  });
});
