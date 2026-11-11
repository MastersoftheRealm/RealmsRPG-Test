# Deferred areas

These trees are out of scope as **pattern sources** for new work elsewhere in the app. Fix bugs inside them; do not copy their helpers, layout, or data flow into active surfaces.

**Rule:** Do not copy patterns from the paths below; use them only for their own bug fixes. Remove a path (or section) from this file when that area is reworked.

## Crafting

- `src/app/(main)/crafting/`
- `src/components/crafting/`
- `src/app/api/crafting/`

## Empowered technique creator

- `src/app/(main)/empowered-technique-creator/`

## VTT

A first tabletop slice is in the repo, rendered with **Konva** (`konva`, `react-konva`). The renderer choice (Konva as built vs. PixiJS v8 as earlier planned) is an open decision for Collin; do not copy tabletop patterns until it is settled. Supabase `vtt_*` tables: `src/docs/SUPABASE_SCHEMA.md`.

- `src/app/(main)/campaigns/[id]/tabletop/`
- `src/components/tabletop/`
- `src/lib/tabletop/`
- `src/app/api/tabletop/`
- `src/app/api/encounters/[id]/tabletop/`
- `src/app/api/upload/vtt-map/`
- `src/hooks/use-tabletop.ts`
- `src/services/tabletop-service.ts`
- `src/types/tabletop.ts`
