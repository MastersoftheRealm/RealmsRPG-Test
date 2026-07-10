import type { VttGridConfig, VttPoint } from '@/types/tabletop';

export const DEFAULT_VTT_GRID: VttGridConfig = {
  enabled: true,
  cellSize: 70,
  offsetX: 0,
  offsetY: 0,
  color: '#94a3b8',
  opacity: 0.45,
  snap: true,
};

export function normalizeGridConfig(grid?: Partial<VttGridConfig> | null): VttGridConfig {
  const cellSize = Number(grid?.cellSize);
  const opacity = Number(grid?.opacity);
  return {
    ...DEFAULT_VTT_GRID,
    ...(grid ?? {}),
    cellSize: Number.isFinite(cellSize) ? Math.max(8, Math.min(400, cellSize)) : DEFAULT_VTT_GRID.cellSize,
    offsetX: Number.isFinite(Number(grid?.offsetX)) ? Number(grid?.offsetX) : DEFAULT_VTT_GRID.offsetX,
    offsetY: Number.isFinite(Number(grid?.offsetY)) ? Number(grid?.offsetY) : DEFAULT_VTT_GRID.offsetY,
    opacity: Number.isFinite(opacity) ? Math.max(0.05, Math.min(1, opacity)) : DEFAULT_VTT_GRID.opacity,
  };
}

export function snapPointToGrid(point: VttPoint, grid: VttGridConfig): VttPoint {
  if (!grid.enabled || !grid.snap) return point;
  const cell = Math.max(1, grid.cellSize);
  return {
    x: Math.round((point.x - grid.offsetX) / cell) * cell + grid.offsetX,
    y: Math.round((point.y - grid.offsetY) / cell) * cell + grid.offsetY,
  };
}

export function measureGridDistance(from: VttPoint, to: VttPoint, grid: VttGridConfig): number {
  const cell = Math.max(1, grid.cellSize);
  const dx = (to.x - from.x) / cell;
  const dy = (to.y - from.y) / cell;
  return Math.round(Math.hypot(dx, dy) * 10) / 10;
}

export function clampPointToMap(point: VttPoint, mapWidth?: number, mapHeight?: number): VttPoint {
  if (!mapWidth || !mapHeight) return point;
  return {
    x: Math.max(0, Math.min(mapWidth, point.x)),
    y: Math.max(0, Math.min(mapHeight, point.y)),
  };
}

