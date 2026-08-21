# ADR-0004: PathGuidanceGroup audience (character vs archetype)

- **Status:** Accepted
- **Date:** 2026-07-17
- **Deciders:** owner (chat: proceed on TASK-514 Architect contract)

## Context

Guided creator splits Level 1 feats into character-feat and archetype-feat steps. Admin previously preserved `level1_guidance_groups` without authoring UI; guided filtered character groups by whether `title` contained `"character"`. That heuristic is brittle and wrong for a durable path contract.

## Decision

1. **`PathGuidanceGroup.audience`:** optional `"character" | "archetype"` on each guidance group (feat groups use it; power/technique/armament groups may omit).
2. **Parse/backfill:** `parseArchetypePathData` / `parseGuidanceGroups` accept explicit `audience`; when missing on a feat group, infer once from title (`includes("character")` → `character`, else `archetype`) and attach on the parsed object. New admin authoring always writes the field.
3. **Consumers:** Guided `character-feat-step` / `archetype-feats-step` filter via `filterFeatGuidanceGroups` / `resolvePathGuidanceAudience` — never title string matching for product logic. Advanced creator **archetype** L1 groups use the same audience filter; advanced **character** L1 may still curate from flat `level1.feats` + `char_feat` (transitional — union sync keeps designated character-group feats in that flat list).
4. **Flat feats sync:** `level1_feats` CSV = union of feat ids across all feat guidance groups when any feat groups exist (no silent drift).
5. **UI:** Admin authors character and archetype feat groups in separate sections (not one mixed ChipSelect).

## Consequences

- Positive: admin and guided share one contract; path content portable without naming hacks.
- Negative: legacy rows without `audience` depend on title backfill until next admin save (or SQL backfill).
- Docs: `FEATURE_INDEX` archetype path row; TASK-514/518.
