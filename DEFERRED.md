# Deferred areas

These trees are out of scope as **pattern sources** for new work elsewhere in the app. Fix bugs inside them; do not copy their helpers, layout, or data flow into active surfaces.

**Rule:** Do not copy patterns from the paths below; use them only for their own bug fixes. Remove a path (or section) from this file when that area is reworked.

## Crafting

- `src/app/(main)/crafting/`
- `src/components/crafting/`
- `src/app/api/crafting/`
- `src/lib/game/crafting-utils.ts` (file)

## Encounter tracker

- `src/app/(main)/encounters/`
- `src/components/encounters/`
- `src/lib/encounter/`

## Empowered technique creator

- `src/app/(main)/empowered-technique-creator/`

## VTT / Konva canvas

There is no Konva dependency and no VTT App Router tree in this repo today. Supabase `vtt_*` tables are documented in `src/docs/SUPABASE_SCHEMA.md` only. When a VTT UI tree lands, add its paths here before copying from it.
