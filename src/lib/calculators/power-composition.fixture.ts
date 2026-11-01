/**
 * Test-only codex parts catalog for power-composition energy checks.
 * Frozen snapshot (formerly from repo CSV); not a runtime pricing path.
 * Not exported from the calculators barrel.
 */

import type { PowerPart } from '@/hooks/codex-types';
import partsSnapshot from './power-composition-parts.snapshot.json';

type PartsSnapshotFile = {
  parts: PowerPart[];
};

const catalog: PowerPart[] = (partsSnapshot as PartsSnapshotFile).parts;

/** Parts from the frozen test snapshot (2026-10-18 codex parts export). */
export function loadRepoCodexParts(): PowerPart[] {
  return catalog;
}

/** Snapshot rows for real Codex ids. Missing ids throw so a fixture cannot silently invent a cost. */
export function snapshotParts(ids: readonly number[]): PowerPart[] {
  return ids.map((id) => {
    const row = catalog.find((part) => part.id === String(id));
    if (!row) throw new Error(`Codex snapshot is missing part ${id}`);
    return row;
  });
}
