import { describe, expect, it, vi } from 'vitest';
import { fetchAllPostgrestPages } from './postgrest-pager';

describe('fetchAllPostgrestPages', () => {
  it('keeps requesting while a page is full', async () => {
    const fetchPage = vi.fn(async (from: number, to: number) => {
      const pageSize = to - from + 1;
      if (from === 0) {
        return { data: Array.from({ length: pageSize }, (_, i) => i), error: null };
      }
      if (from === pageSize) {
        return { data: [pageSize, pageSize + 1], error: null };
      }
      return { data: [], error: null };
    });

    const rows = await fetchAllPostgrestPages(fetchPage, 3);
    expect(rows).toEqual([0, 1, 2, 3, 4]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage.mock.calls[0]).toEqual([0, 2]);
    expect(fetchPage.mock.calls[1]).toEqual([3, 5]);
  });

  it('stops when the first page is short', async () => {
    const fetchPage = vi.fn(async () => ({ data: [1], error: null }));
    const rows = await fetchAllPostgrestPages(fetchPage, 3);
    expect(rows).toEqual([1]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage.mock.calls[0]).toEqual([0, 2]);
  });

  it('throws when a page returns an error', async () => {
    const fetchPage = vi.fn(async () => ({
      data: null,
      error: { message: 'boom' },
    }));
    await expect(fetchAllPostgrestPages(fetchPage, 10)).rejects.toEqual({ message: 'boom' });
  });
});
