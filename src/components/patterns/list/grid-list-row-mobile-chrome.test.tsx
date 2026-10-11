import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GridListRow } from './grid-list-row';

/** Library My Powers row chrome (edit/delete/+ reserve) at narrow widths (86e3jxbrc). */
describe('GridListRow mobile external chrome overlay', () => {
  it('reserves full-width name track below lg when chrome is external', () => {
    const html = renderToStaticMarkup(
      <GridListRow
        id="qa-cr-power-1"
        name="QA CR Power 1"
        description="Test power."
        gridColumns="1.4fr 1fr 0.7fr"
        columns={[{ key: 'energy', value: '7', highlight: true }]}
        rowChrome={{ edit: true, delete: true, rightSlot: true }}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(html).toContain('--glr-mobile-chrome-reserve');
    expect(html).toContain('max-lg:[padding-inline-end:var(--glr-mobile-chrome-reserve)]');
    expect(html).toContain('max-lg:[grid-template-columns:minmax(0,1fr)]');
    expect(html).toContain('class="block min-w-0 truncate"');
  });
});
