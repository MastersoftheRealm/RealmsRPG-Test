# Leveled Feats — Design and Implementation

**Branch:** `leveled-feats-and-fixes`

## Goal

- **Same name, different IDs:** All levels of a feat share the same display name (e.g. "Speedy"); `feat_lvl` (1, 2, 3…) and `id` distinguish them. No roman numerals in names.
- **Explicit link:** Add `base_feat_id` to point to the level-1 feat so we can group and validate without parsing names.
- **UX:** Codex and add-feat modal show "Name (Level 2)" etc.; codex can group leveled feats under one expandable row.

## Schema

### codex_feats

- **base_feat_id** (TEXT, nullable): Id of the level-1 feat. NULL for level-1 feats; set for feat_lvl ≥ 2.
- **feat_lvl** (existing): 1 = first level, 2 = second, etc. Level-1 feats should have feat_lvl = 1 or NULL/0.
- **name** (existing): Same as the level-1 feat for all levels (no " II", " III", etc.).

Linking to the **level-1** feat (not “previous level”) keeps grouping simple: all variants share one base id. “Previous level” is derived: for feat_lvl 2 it’s the feat with id = base_feat_id; for feat_lvl ≥ 3 it’s the feat with base_feat_id = this.base_feat_id and feat_lvl = this.feat_lvl - 1.

## Data Migration (Roman Numerals → Same Name + base_feat_id)

1. **Strip roman numerals** from `name`: remove suffix matching `\s+(II|III|IV|V|VI|VII|VIII|IX|X|XI)$` (case-insensitive). e.g. "Speedy II" → "Speedy", "Speedy III" → "Speedy".
2. **Set base_feat_id for level 2+:** For each row with feat_lvl > 1, find the row with the same (stripped) name and feat_lvl = 1 (or minimal feat_lvl for that name). Set base_feat_id = that row’s id.
3. **Level-1 names:** For rows with feat_lvl = 1 (or unset) that still have roman in the name, set name to the stripped name.

Run migration **after** adding the `base_feat_id` column. See `sql/leveled-feats-add-base-feat-id.sql` and `scripts/migrate-leveled-feats-roman-to-base-id.js` (or equivalent SQL in Supabase).

## API & Types

- **GET /api/codex:** Include `base_feat_id` in each feat (snake_case in response).
- **Feat type:** Add `base_feat_id?: string`.

## UX

### Codex Feats tab

- **Grouping:** Group feats by “family”: level-1 feats (base_feat_id IS NULL) are roots; level-2+ feats are grouped under the level-1 feat by base_feat_id.
- **Display:** One row per family (level-1 feat as header). If the family has multiple levels, show an expandable section listing level 2, 3, … with same name and “Level 2”, “Level 3” in a column or chip.
- **Search/filter:** Apply to all feats; grouping is visual only.

### Add-feat modal (character sheet)

- **Display:** Show `feat.name` + (feat.feat_lvl > 1 ? ` (Level ${feat.feat_lvl})` : ''). No roman parsing.
- **Prerequisite:** For feat_lvl > 1, require that the character has the previous level: if feat_lvl === 2, require id === base_feat_id; if feat_lvl ≥ 3, require the feat with base_feat_id === this.base_feat_id and feat_lvl === this.feat_lvl - 1 (by id). Use base_feat_id + feat_lvl instead of parseFeatLevel(name).
- **Existing check:** Filter by feat id only (not name), since names can repeat.

### Admin Feats tab

- **Form:** Add optional `base_feat_id` (dropdown or id input). When adding a “higher level” of an existing feat, select the level-1 feat; set name = base.name, base_feat_id = base.id, feat_lvl = 2 (or next).
- **List:** Show feat_lvl; optionally group by base_feat_id in the list or keep flat list with level column.

### Replacement and counting (existing rules)

- Higher-level feat **replaces** the lower-level feat when taken.
- A level-N feat **counts as N** feats of its type (e.g. level-2 archetype feat = 2 archetype feats). This remains in character/feat logic; no change to this doc.

## Files to touch

- Schema/docs: `SUPABASE_SCHEMA.md`, this doc.
- SQL: `sql/leveled-feats-add-base-feat-id.sql`, data migration script or SQL.
- API: `src/app/api/codex/route.ts` (map base_feat_id).
- Types: `src/hooks/use-rtdb.ts` (Feat.base_feat_id).
- Admin actions: `src/app/(main)/admin/codex/actions.ts` (COLUMNAR_FIELDS + toDbPayload if needed).
- Codex: `src/app/(main)/codex/CodexFeatsTab.tsx` (grouping + expandable levels).
- Add-feat: `src/components/character-sheet/add-feat-modal.tsx` (remove roman parsing; use base_feat_id + feat_lvl; display "Level N").
- Admin feats: `src/app/(main)/admin/codex/AdminFeatsTab.tsx` (base_feat_id field, “add level” flow).
- Creature creator: Uses codex_creature_feats (separate table); same pattern can be applied later if desired.

## Roman numeral pattern

Suffixes to remove: `II`, `III`, `IV`, `V`, `VI`, `VII`, `VIII`, `IX`, `X`, `XI`. Regex: `\s+(II|III|IV|V|VI|VII|VIII|IX|X|XI)$` (case-insensitive).
