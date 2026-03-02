# Official Library — Columnar Expansion Plan

**Goal:** As much columnar data as possible, as little JSONB as possible, for all creators (powers, techniques, items, creatures).

## Current state

- **official_powers:** id, name, description, action_type, is_reaction, innate, created_at, updated_at, **payload** (JSONB with parts, range, duration, area, damage, etc.).
- **official_techniques:** scalars + payload (weapon_name, parts, damage, etc. in payload).
- **official_items:** type, rarity, armor_value, damage_reduction + payload (properties, damage, range, etc.).
- **official_creatures:** level, type, size, hit_points, energy_points + payload.

## Phase 1 — Powers (done in migration)

**New columns added** (see `sql/supabase-official-library-columnar-expansion.sql`):

| Column         | Type    | Source in payload      |
|----------------|---------|-------------------------|
| range_steps    | INTEGER | payload.range.steps     |
| duration_type  | TEXT    | payload.duration.type   |
| duration_value | INTEGER | payload.duration.value  |
| area_type      | TEXT    | payload.area.type       |
| area_level     | INTEGER | payload.area.level      |
| damage         | JSONB   | payload.damage (array)   |

After backfill, **payload** holds mainly **parts** (and any extra keys). App reads from columns first, then merges payload; writes populate these columns and put only non-scalar data (e.g. parts) in payload.

## Phase 2 — Techniques

Proposed new columns for `official_techniques`:

- From payload: **damage** (JSONB), **range** if used, **duration_type** / **duration_value**, **parts** could stay in payload (complex array) or become a dedicated **parts** JSONB column for querying.

## Phase 3 — Items (armaments)

Proposed new columns for `official_items`:

- **damage** (JSONB), **range_steps** or **range** JSONB, **properties** (JSONB array) as a column; keep payload for anything else.

## Phase 4 — Creatures

Already fairly columnar (level, type, size, hit_points, energy_points). Could add columns for common nested fields if they exist in payload.

## Implementation notes

- **API:** Official API `bodyToDb` / `rowToItem` (and shared `library-columnar.ts` where used) must treat new columns as scalars: read from columns first, fall back to payload; on write, extract from body into columns and leave only remainder (e.g. parts) in payload.
- **User library:** Same column set can be mirrored on `user_powers`, `user_techniques`, etc., so “add to my library” copies columns + payload consistently.
- **Run order:** Run `supabase-official-library-columnar-expansion.sql` in Supabase SQL Editor after the main official-library schema. Then deploy app changes that read/write the new columns.
