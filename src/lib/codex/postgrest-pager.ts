/**
 * Range-based reads for whole-table PostgREST selects.
 * Keeps requesting while a page is full so the default 1000-row cap cannot truncate.
 */

export const POSTGREST_DEFAULT_PAGE_SIZE = 1000;

export type PostgrestRangePageResult<T> = {
  data: T[] | null;
  error: { message?: string } | null;
};

export async function fetchAllPostgrestPages<T>(
  fetchPage: (from: number, to: number) => Promise<PostgrestRangePageResult<T>>,
  pageSize = POSTGREST_DEFAULT_PAGE_SIZE,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await fetchPage(from, to);
    if (error) throw error;
    const page = data ?? [];
    all.push(...page);
    if (page.length < pageSize) break;
    from += pageSize;
  }
  return all;
}
