# Feat Tags (Codex)

Authority for feat tag **taxonomy rules** and migration status. Stored in `codex_feats.tags` as comma-separated TEXT (trailing comma when non-empty).

## Purpose

Tags help players filter feats by **mechanic**, **playstyle**, or **skill linkage** — not to duplicate schema fields (`category`, `state_feat`, `char_feat`, `ability`).

## Rules

1. **Do not tag** redundant metadata: no `State` tag (use `state_feat`), no bare `Combat`/`Buff`/`Defensive` (use `category` or specific mechanics).
2. **Prefer canonical merges** from `sql/feat-tags-unification-phase1.sql` and `phase2.sql` (e.g. `Attack Bonus` not `Attack Roll Increase`).
3. **Skill-specific tags** are allowed when the feat is primarily about that skill (`Motivate`, `Appraise`, `Investigate`) — match [GAME_RULES.md](./GAME_RULES.md) terminology (**Skill Roll**, not Skill Check).
4. **Normalize on save** — admin feat edits run `normalize_feat_tags()` via server action (see `lib/codex/feat-tags.ts`).

## Migration status (RealmsRPG-Test)

| Phase | Status | Unique tags | Notes |
|-------|--------|-------------|-------|
| 1 | Applied | 349 → 296 | Spelling, synonyms, ability/skill bonus merges |
| 2 | Applied | 296 → 277 | Critical/recovery families, physical damage, social merges |
| 3 | Applied (2026-07-03) | 291 | 50 previously untagged feats tagged |
| 4 | Applied (2026-07-03) | **172** | Singleton merges + phase 1–2 fixes (Focus/Movement kept); 14 intentional singletons remain |

## Phase 4 singletons kept intentionally

`Motivate`, `Deceive`, `Analyze`, `Interchangeable`, skill-centric tags (`Acrobatics`, `Forgery`, `Haggle`, `History`, `Arcana`, …), and mechanic-specific tags (`Focus`, `Physical Damage`, `Blinded`, etc.).

`normalize_feat_tags()` chains **phase 3 → phase 2 → phase 1** (`sql/feat-tags-unification-phase4.sql`).

## Code

- Parse: `parseFeatTagsFromDb()` in `src/lib/codex/feat-tags.ts`
- Display chips: `buildFeatDetailSections()` → `tagDescriptorChip()` — **Tags** section is last (after ability/skill requirements and feat levels) and always shows its section label, even for a single tag.
- Filter UI: `buildFeatFilterOptions()` / `filterFeats()` in `src/lib/codex/feat-list.ts`
