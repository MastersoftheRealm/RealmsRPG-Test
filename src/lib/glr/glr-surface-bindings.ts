/**
 * GLR surface bindings — CI pointers from list chrome to entity + density (ADR-0016).
 *
 * New GridListRow lists register a row here instead of a custom fact table.
 */

import type { GlrEntityType } from './glr-fact-catalog';
import type { GlrDensityMode, GlrLayoutFlags } from './glr-density';
import { resolveGlrFactLayout, type GlrResolvedLayout } from './resolve-glr-fact-layout';

export interface GlrSurfaceBinding {
  entityType: GlrEntityType;
  mode: GlrDensityMode;
  flags?: GlrLayoutFlags;
}

export const GLR_SURFACE_BINDINGS = {
  'library-official-power': { entityType: 'power', mode: 'browse' },
  'library-official-technique': { entityType: 'technique', mode: 'browse' },
  'library-official-weapon': { entityType: 'weapon', mode: 'browse' },
  'library-official-armor': { entityType: 'armor', mode: 'browse' },
  'library-official-shield': { entityType: 'shield', mode: 'browse' },
  'character-sheet-power-play': { entityType: 'power', mode: 'play' },
  'character-sheet-technique-play': { entityType: 'technique', mode: 'play' },
  'character-sheet-armor': { entityType: 'armor', mode: 'play' },
  'character-sheet-weapon-play': { entityType: 'weapon', mode: 'play' },
  'character-sheet-shield-play': { entityType: 'shield', mode: 'play' },
  'character-sheet-feat': { entityType: 'feat', mode: 'play' },
  'character-sheet-gear': { entityType: 'gear', mode: 'play' },
  'add-modal-power': { entityType: 'power', mode: 'select' },
  'add-modal-technique': { entityType: 'technique', mode: 'select' },
  'add-modal-weapon': { entityType: 'weapon', mode: 'select' },
  'add-modal-armor': { entityType: 'armor', mode: 'select' },
  'add-modal-shield': { entityType: 'shield', mode: 'select' },
  'add-modal-feat': { entityType: 'feat', mode: 'select' },
  'add-modal-gear': { entityType: 'gear', mode: 'select' },
  'empowered-power': { entityType: 'power', mode: 'select' },
  'creature-stat-block-power': { entityType: 'power', mode: 'select' },
  'creature-stat-block-technique': { entityType: 'technique', mode: 'select' },
  'creature-feat-picker': { entityType: 'feat', mode: 'detail' },
  'codex-feat': { entityType: 'feat', mode: 'browse' },
  'codex-equipment': { entityType: 'gear', mode: 'browse' },
  'guided-powers-l3': {
    entityType: 'power',
    mode: 'browse',
    flags: { creatorBudget: true },
  },
  'guided-techniques-l3': { entityType: 'technique', mode: 'browse' },
  'guided-feats-l3': {
    entityType: 'feat',
    mode: 'browse',
    flags: { characterCreate: true },
  },
  'guided-equipment-weapon-l3': { entityType: 'weapon', mode: 'browse' },
  'guided-equipment-armor-l3': { entityType: 'armor', mode: 'browse' },
  'guided-equipment-shield-l3': {
    entityType: 'shield',
    mode: 'browse',
    flags: { mixedArmamentPhase: true },
  },
  'guided-equipment-gear-l3': { entityType: 'gear', mode: 'browse' },
  'detail-option-power': { entityType: 'power', mode: 'detail' },
} as const satisfies Record<string, GlrSurfaceBinding>;

export type GlrSurfaceId = keyof typeof GLR_SURFACE_BINDINGS;

export function getGlrSurfaceBinding(surfaceId: GlrSurfaceId): GlrSurfaceBinding {
  return GLR_SURFACE_BINDINGS[surfaceId] as GlrSurfaceBinding;
}

export function resolveSurfaceLayout(surfaceId: GlrSurfaceId): GlrResolvedLayout {
  const binding = getGlrSurfaceBinding(surfaceId);
  return resolveGlrFactLayout({
    entityType: binding.entityType,
    mode: binding.mode,
    flags: binding.flags,
  });
}
