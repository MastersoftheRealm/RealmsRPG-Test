import { describe, expectTypeOf, it } from 'vitest';
import type { AllowUndefinedOptionals } from './exact-optional';

type Sample = AllowUndefinedOptionals<{
  name: string;
  description?: string | undefined;
}>;

describe('AllowUndefinedOptionals', () => {
  it('keeps required keys required and lets optional keys be undefined', () => {
    expectTypeOf<Sample['name']>().toEqualTypeOf<string>();
    expectTypeOf<Sample['description']>().toEqualTypeOf<string | undefined>();

    const omitted: Sample = { name: 'ok' };
    const explicit: Sample = { name: 'ok', description: undefined };
    expectTypeOf(omitted).toMatchTypeOf<Sample>();
    expectTypeOf(explicit).toMatchTypeOf<Sample>();
  });
});
