import { describe, expect, it, vi } from 'vitest';
import { fetchOfficialColumnarRows, fetchOfficialSpeciesRows } from './official-library-server';

function listingQuery(rows: Record<string, unknown>[]) {
  let reads = 0;
  const query = {
    eq: vi.fn(function eq() {
      return query;
    }),
    then(
      onFulfilled?: (value: { data: Record<string, unknown>[]; error: null }) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) {
      reads += 1;
      return Promise.resolve({ data: rows, error: null }).then(onFulfilled, onRejected);
    },
  };
  return {
    reads: () => reads,
    client: {
      from: () => ({
        select: () => query,
      }),
    },
  };
}

describe('official library row cache', () => {
  it('does not memoize an empty listed powers catalog', async () => {
    const supabase = listingQuery([]);
    await fetchOfficialColumnarRows(supabase.client as never, 'powers', false);
    await fetchOfficialColumnarRows(supabase.client as never, 'powers', false);
    expect(supabase.reads()).toBe(2);
  });

  it('memoizes a non-empty listed powers catalog', async () => {
    const supabase = listingQuery([{ id: 'p1', name: 'Bolt', catalog_listing: 'listed' }]);
    await fetchOfficialColumnarRows(supabase.client as never, 'powers', false);
    await fetchOfficialColumnarRows(supabase.client as never, 'powers', false);
    expect(supabase.reads()).toBe(1);
  });

  it('does not memoize an empty species catalog', async () => {
    const supabase = listingQuery([]);
    await fetchOfficialSpeciesRows(supabase.client as never, false);
    await fetchOfficialSpeciesRows(supabase.client as never, false);
    expect(supabase.reads()).toBe(2);
  });
});
