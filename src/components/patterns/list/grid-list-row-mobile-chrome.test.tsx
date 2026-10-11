import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GridListRow } from './grid-list-row';
import {
  GRID_LIST_ROW_ICON_COLUMN_WIDTH,
  GRID_LIST_ROW_RIGHT_SLOT_FLEX_WIDTH,
  collapsedNameTrackWidthPx,
  externalChromeFootprintWidth,
  mobileCollapsedNameInlineEndReserve,
} from './grid-list-row-chrome';

/**
 * 375px page, `px-4`, 1px card border each side. Content box the auditor measured.
 * Nunito 500 16px glyph widths at that size (86e3jxbrc).
 */
const CARD_CONTENT_PX = 375 - 32 - 2;
const ROW_PADDING_INLINE_PX = 32;
const COLUMN_GAP_PX = 8;
const THUMB_PX = 44;
const QA_NAME_GLYPH_PX = {
  'QA CR Power 1': 113.97,
  'QA CR Power 2': 113.97,
  'QA CR Power 5': 113.97,
  'QA CR Power 10': 123.57,
} as const;

function cssLengthToPx(value: string, remPx = 16): number {
  const terms = value.match(/-?\d*\.?\d+(?:px|rem)/g);
  if (!terms || terms.length === 0) throw new Error(`No lengths in ${value}`);
  return terms.reduce((sum, term) => {
    if (term.endsWith('rem')) return sum + Number.parseFloat(term) * remPx;
    return sum + Number.parseFloat(term);
  }, 0);
}

function openTag(html: string, marker: string): string {
  const tag = html.match(new RegExp(`<div[^>]*${marker}[^>]*>`));
  if (!tag) throw new Error(`Missing ${marker}`);
  return tag[0];
}

function styleValue(tag: string, prop: string): string | undefined {
  const style = tag.match(/style="([^"]*)"/)?.[1];
  if (!style) return undefined;
  const part = style.split(';').find((entry) => entry.trim().startsWith(`${prop}:`));
  return part?.slice(part.indexOf(':') + 1).trim();
}

function libraryRow(name: string, expanded = false) {
  return renderToStaticMarkup(
    <GridListRow
      id="qa-cr-power"
      name={name}
      description="Test power."
      // Name + one data column, no leftover track, so edit/delete/+ stay external
      // the way My Library powers do (chrome band ~148px, not an inline slot).
      gridColumns="1.4fr 1fr"
      columns={[{ key: 'energy', value: '7', highlight: true }]}
      rowChrome={{ edit: true, delete: true, rightSlot: true }}
      onEdit={() => {}}
      onDelete={() => {}}
      defaultExpanded={expanded}
      thumbnail={{ src: '/placeholder.png', alt: '' }}
    />,
  );
}

/** Library My Powers row chrome (edit/delete/+ reserve) at narrow widths (86e3jxbrc). */
describe('GridListRow mobile external chrome overlay', () => {
  it('keeps a name box wider than the four QA powers at a 375px card', () => {
    const widths = (Object.keys(QA_NAME_GLYPH_PX) as Array<keyof typeof QA_NAME_GLYPH_PX>).map(
      (name) => {
        const html = libraryRow(name, name === 'QA CR Power 1');
        const header = openTag(html, 'data-glr-collapsed-header');
        const chrome = openTag(html, 'data-glr-external-chrome');
        const summary = openTag(html, 'data-glr-mobile-summary');
        const reserve = styleValue(header, '--glr-mobile-chrome-reserve');
        expect(reserve).toBeDefined();
        const nameBoxPx = collapsedNameTrackWidthPx({
          cardContentPx: CARD_CONTENT_PX,
          paddingInlineEndPx: cssLengthToPx(reserve!),
          rowPaddingInlinePx: ROW_PADDING_INLINE_PX,
          columnGapPx: COLUMN_GAP_PX,
          leadingTrackPx: THUMB_PX,
        });
        return { name, html, header, chrome, summary, nameBoxPx, reserve: reserve! };
      },
    );

    const nameBoxes = widths.map((row) => row.nameBoxPx);
    expect(new Set(nameBoxes).size).toBe(1);
    const nameBoxPx = nameBoxes[0]!;
    expect(nameBoxPx).toBe(185);
    expect(nameBoxPx).toBeGreaterThan(124);
    for (const row of widths) {
      expect(nameBoxPx).toBeGreaterThan(QA_NAME_GLYPH_PX[row.name]);
      expect(row.header).toContain('max-lg:[grid-column:1/-1]');
      expect(row.header).toContain('max-lg:[padding-inline-end:var(--glr-mobile-chrome-reserve)]');
      const headerStyle = styleValue(row.header, 'grid-row');
      expect(headerStyle).toBe('1');
      expect(row.header).not.toMatch(/style="[^"]*grid-column:/);
      expect(row.chrome).toMatch(/grid-column:\s*2\b/);
      expect(row.chrome).not.toContain('grid-column:1/-1');
      expect(row.chrome).not.toContain('grid-column:1 / -1');
      expect(row.summary).toMatch(/grid-column:\s*1\b/);
      expect(row.html).toContain('minmax(0, 1fr) auto');
      expect(row.html).not.toContain('max-lg:[grid-template-columns:minmax(0,1fr)]');
      const chromeBlock = row.html.slice(
        row.html.indexOf('data-glr-external-chrome'),
        row.html.indexOf('data-glr-mobile-summary'),
      );
      expect(chromeBlock).toContain('calc(4rem + 0.5rem)');
      expect(row.reserve).toBe(
        `calc(${GRID_LIST_ROW_ICON_COLUMN_WIDTH} + ${GRID_LIST_ROW_ICON_COLUMN_WIDTH})`,
      );
      expect(row.reserve).not.toContain('4rem');
      expect(row.html).toContain('class="block min-w-0 truncate"');
      expect(row.html).toContain(`title="${row.name}"`);
    }

    const expanded = openTag(widths[0]!.html, 'data-glr-expanded-body');
    expect(expanded).toMatch(/grid-column:\s*1\b/);
    expect(expanded).not.toContain('1/-1');
  });

  it('still reserves an occupied right slot so the name does not run under that control', () => {
    expect(
      mobileCollapsedNameInlineEndReserve({
        showRightSlot: true,
        rightSlotOccupied: true,
        onEdit: true,
        onDelete: true,
      }),
    ).toBe(
      externalChromeFootprintWidth({
        showRightSlot: true,
        onEdit: true,
        onDelete: true,
      }),
    );
    expect(
      mobileCollapsedNameInlineEndReserve({
        showRightSlot: true,
        rightSlotOccupied: false,
        onEdit: true,
        onDelete: true,
      }),
    ).toBe(`calc(${GRID_LIST_ROW_ICON_COLUMN_WIDTH} + ${GRID_LIST_ROW_ICON_COLUMN_WIDTH})`);
    expect(GRID_LIST_ROW_RIGHT_SLOT_FLEX_WIDTH).toContain('4rem');
  });
});
