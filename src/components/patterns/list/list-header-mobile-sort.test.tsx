// @vitest-environment happy-dom
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ListHeader } from './list-header';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'damage', label: 'Damage' },
];
const sortState = { col: 'name', dir: 1 as const };
const onSort = vi.fn();

function mobileSortButton(): HTMLButtonElement {
  const btn = document.querySelector(
    '.lg\\:hidden button[aria-haspopup="listbox"]',
  ) as HTMLButtonElement | null;
  if (!btn) throw new Error('expected mobile Sort by button');
  return btn;
}

describe('ListHeader mobile sort menu', () => {
  it('renders Sort by control on the rightSlotWidth layout branch', () => {
    render(
      <ListHeader columns={columns} sortState={sortState} onSort={onSort} rightSlotWidth="7rem" />,
    );
    expect(mobileSortButton().getAttribute('aria-label')).toMatch(/Sort by\. Current: Name/);
  });

  it('renders Sort by control on the rowChrome layout branch', () => {
    render(
      <ListHeader
        columns={columns}
        gridColumns="1fr 1fr"
        sortState={sortState}
        onSort={onSort}
        hasThumbnailColumn
        rowChrome={{
          rightSlot: true,
          rightSlotLabel: 'Qty',
          rightSlotSortKey: 'qty',
        }}
      />,
    );
    expect(mobileSortButton().getAttribute('aria-label')).toMatch(/Sort by\. Current: Name/);
  });

  it('renders Sort by control on the default grid layout branch', () => {
    render(
      <ListHeader columns={columns} gridColumns="1fr 1fr" sortState={sortState} onSort={onSort} />,
    );
    expect(mobileSortButton().getAttribute('aria-label')).toMatch(/Sort by\. Current: Name/);
  });
});
