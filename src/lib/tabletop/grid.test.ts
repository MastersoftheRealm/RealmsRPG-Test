import { describe, expect, it } from 'vitest';
import { DEFAULT_VTT_GRID, measureGridDistance, normalizeGridConfig, snapPointToGrid } from './grid';

describe('tabletop grid utilities', () => {
  it('normalizes unsafe grid values', () => {
    const grid = normalizeGridConfig({ cellSize: -1, opacity: 9, offsetX: 12 });
    expect(grid.cellSize).toBe(8);
    expect(grid.opacity).toBe(1);
    expect(grid.offsetX).toBe(12);
  });

  it('snaps points to the configured grid', () => {
    const grid = { ...DEFAULT_VTT_GRID, cellSize: 50, offsetX: 10, offsetY: 20 };
    expect(snapPointToGrid({ x: 86, y: 96 }, grid)).toEqual({ x: 110, y: 120 });
  });

  it('measures distance in grid cells', () => {
    const grid = { ...DEFAULT_VTT_GRID, cellSize: 50 };
    expect(measureGridDistance({ x: 0, y: 0 }, { x: 150, y: 200 }, grid)).toBe(5);
  });
});

