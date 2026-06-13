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

## Phase 2 — Techniques (implemented)

Implemented promoted columns for `official_techniques` + `user_techniques`:

- From payload: **damage** (JSONB), **range_steps**, **duration_type**, **duration_value**.
- Empowered parity: same promoted columns on `official_empowered_techniques` + `user_empowered_techniques` (with trigger fallback from nested `payload.power.*`).

## Phase 3 — Items (armaments) (implemented)

Implemented promoted columns for `official_items` + `user_items`:

- **range_steps**, **is_two_handed**, **ability_requirement** (JSONB), **costs** (JSONB), **damage** (JSONB), **properties** (JSONB), **agility_reduction**, **critical_range_increase**, **shield_dr** (JSONB), **shield_damage** (JSONB).
- Existing top-level scalars remain unchanged (`type`, `rarity`, `armor_value`, `damage_reduction`).

## Phase 4 — Creatures

Already fairly columnar (level, type, size, hit_points, energy_points). Could add columns for common nested fields if they exist in payload.

## Implementation notes

- **Transition-safe sync:** `sql/supabase-library-columnar-parity-expansion.sql` adds DB triggers that populate promoted columns from payload during insert/update. This keeps current API write behavior working while reducing JSONB dependence.
- **Official/user parity:** The same promoted columns are added to both official and user tables so official→user copy is a shape-compatible row transfer.
- **Run order:** Run `supabase-official-library-public-schema.sql`, then `supabase-library-columnar-parity-expansion.sql`. `supabase-official-library-columnar-expansion.sql` remains valid for older environments but is superseded by the parity migration for powers.
