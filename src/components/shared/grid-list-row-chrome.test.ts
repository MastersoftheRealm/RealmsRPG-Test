import { describe, expect, it } from 'vitest';
import {
  GRID_LIST_ROW_THUMBNAIL_COLUMN_WIDTH,
  buildMobileCollapsedGridColumns,
  countGridTemplateTracks,
  expandGridTemplateTokens,
  gridTemplateColumnsWithThumbnail,
} from './grid-list-row-chrome';

describe('grid-list-row-chrome mobile collapse', () => {
  it('counts and expands repeat() tracks', () => {
    expect(countGridTemplateTracks('1fr 2fr 40px')).toBe(3);
    expect(expandGridTemplateTokens('repeat(2, minmax(0, 1fr)) 40px')).toEqual([
      'minmax(0, 1fr)',
      'minmax(0, 1fr)',
      '40px',
    ]);
    expect(countGridTemplateTracks('repeat(2, minmax(0, 1fr)) 40px')).toBe(3);
  });

  it('collapses empty desktop data tracks so name gets minmax(0, 1fr)', () => {
    // Library armaments: name + 6 data cols + 40px action
    const desktop = '1.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 40px';
    const dataTracksUsed = 1 + 6; // name + Type/Rarity/Currency/TP/Range/Damage
    expect(
      buildMobileCollapsedGridColumns({
        resolvedGridColumns: desktop,
        hasThumbnailColumn: false,
        dataTracksUsed,
      })
    ).toBe('minmax(0, 1fr) 40px');
  });

  it('keeps thumbnail + trailing action tracks on mobile', () => {
    const desktop = gridTemplateColumnsWithThumbnail(
      '1.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 40px'
    );
    const dataTracksUsed = 2 + 6; // thumb + name + 6 cols
    expect(countGridTemplateTracks(desktop)).toBe(9);
    expect(
      buildMobileCollapsedGridColumns({
        resolvedGridColumns: desktop,
        hasThumbnailColumn: true,
        dataTracksUsed,
      })
    ).toBe(`${GRID_LIST_ROW_THUMBNAIL_COLUMN_WIDTH} minmax(0, 1fr) 40px`);
  });

  it('reserves auto tracks for columns that stay visible on mobile', () => {
    const desktop = '1.5fr 0.8fr 0.8fr 40px';
    expect(
      buildMobileCollapsedGridColumns({
        resolvedGridColumns: desktop,
        hasThumbnailColumn: false,
        dataTracksUsed: 3,
        mobileVisibleDataTracks: 1,
      })
    ).toBe('minmax(0, 1fr) auto 40px');
  });
});
