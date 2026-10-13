# ADR-0027: Official catalog listing (Public vs Admin library)

- **Status:** Accepted
- **Date:** 2026-09-14
- **Deciders:** owner (chat: implement Admin library publish class)

## Context

Official `official_*` / `codex_species` rows were fully public (`SELECT USING (true)` plus unfiltered list APIs). Creature-specific created items (Giant Bear Claws, Acid Spit) clutter player Libraries and guided pickers. Created items are not SKUs; Codex pieces (parts, feats) may be pack-gated later.

Existing flags mean other things: creator My/Public = save table; character visibility = sheet sharing; `is_starter` = L1 curation.

## Decision

1. Column `catalog_listing text NOT NULL DEFAULT 'listed'` (`listed` | `unlisted`) on `official_powers`, `official_techniques`, `official_empowered_techniques`, `official_items`, `official_creatures`, `official_enhanced_items`, `codex_species`. Not on `user_*`.
2. **Listed** = Public library (player catalogs, counts, guided add-X). **Unlisted** = Admin library: omitted from those catalogs; still publicly readable by id so published creatures/characters resolve attached rows. Staff author via Official Library Editor, Admin Codex species, and creator three-way save.
3. `GET /api/official/[type]` and official counts default to `listed`. `?includeUnlisted=1` is honored only for an admin session. Same for `GET /api/codex` species. Do not auto-include unlisted because the viewer is admin (player `/library` and `/codex` stay clean).
4. Creator save (admin): My library | Public library | Admin library. Writes `catalog_listing` on official/codex rows. Admin lists can PATCH listing without a full overwrite.
5. **Do not** filter a public created item out of catalogs because the viewer lacks a child piece. Piece packs are a later system.

## Consequences

- Positive: one column + one evaluator; no third table; RLS stays public SELECT for unlisted (not secret).
- Negative / follow-ups: staff who are not admin cannot write official rows (unchanged). Piece paywall / expand-unowned-parts is deferred.
- Rejected: `content_packs` on created items; per-row `role = admin`; hiding only in React; `official_creature_items` split.
