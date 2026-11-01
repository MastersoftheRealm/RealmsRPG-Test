/**
 * Test-only codex parts catalog for power-composition energy checks.
 * Frozen snapshot from codex parts CSV as of 2026-10-18; not a runtime pricing path.
 * Not exported from the calculators barrel.
 */

import type { PowerPart } from '@/hooks/codex-types';
import partsSnapshot from './power-composition-parts.snapshot.json';

type PartsSnapshotFile = {
  parts: PowerPart[];
};

const catalog: PowerPart[] = (partsSnapshot as PartsSnapshotFile).parts;

function clonePart(part: PowerPart): PowerPart {
  return structuredClone(part);
}

/** Parts from the frozen test snapshot (CSV as of 2026-10-18). */
export function loadRepoCodexParts(): PowerPart[] {
  return catalog.map(clonePart);
}

/** Snapshot rows for real Codex ids. Missing ids throw so a fixture cannot silently invent a cost. */
export function snapshotParts(ids: readonly number[]): PowerPart[] {
  return ids.map((id) => {
    const row = catalog.find((part) => part.id === String(id));
    if (!row) throw new Error(`Codex snapshot is missing part ${id}`);
    return clonePart(row);
  });
}
