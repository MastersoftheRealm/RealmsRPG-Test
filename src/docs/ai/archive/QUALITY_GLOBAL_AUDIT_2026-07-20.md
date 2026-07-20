# Pseudo `/global-audit` — Codebase quality (2026-07-20)

**Date:** 2026-07-20  
**Focus:** structural quality follow-up to owner website audit + agent quality review  
**Mode:** inventory + task filing (owner asked to file tasks). No code deletes in this pass.

Companion context: owner recently ran a website audit; this report adds structural/process findings from a fresh repo inventory (LOC hotspots, docs corpus, test shape) and files `TASK-601`–`TASK-607`.

---

## Global audit

### Executive verdict

Process maturity (constitution, barrels, token ESLint, visual/a11y ratchets, almost-empty ACTIVE queue after TASK-593–600) is strong. Remaining systemic debt is **file size / local complexity** in play-loop and admin surfaces, **hot-path changelog bloat**, and a **coverage shape** that favors pure `lib/` + Playwright visuals over API route automation. Biggest wins: continue the TASK-598-style facade splits on the largest god files, rotate `AI_CHANGELOG.md`, then add a thin API smoke layer.

### Pillar 1 — Clutter (dead / unused / stale)

| Finding | Evidence | Disposition |
|---------|----------|-------------|
| Live `AI_CHANGELOG.md` is very large (~240KB / ~770 lines of dense entries) | `wc -c src/docs/ai/AI_CHANGELOG.md` | **TASK-606** (debt-safe rotation slice OK under `/debt docs-only`) |
| Docs corpus is heavy (~89 markdown files; archive alone ~25k lines) | `find src/docs` / `archive/*.md` | **TASK-606** — inventory honesty + prune live-sounding superseded claims; do not delete history dumps without ack |
| Styleguide page is a large living catalog (~828 LOC) | `src/app/dev/styleguide/page.tsx` | **ack / defer** — intentional; not a product god-file |

### Pillar 2 — Fidelity (docs & tasks vs code)

| Finding | Evidence | Disposition |
|---------|----------|-------------|
| Hot-path ACTIVE is healthy (~3KB, 2 tasks) after recent debt | `ACTIVE_TASKS.md` | Clean — keep lean when filing 601–607 |
| FEATURE_INDEX + barrels still advertise canonical shared patterns | `FEATURE_INDEX.md`, `shared/index.ts` | Clean — splits must update index when facades move |
| Prior June audits remain archive-only (correct) | `HISTORY_INDEX.md` | Clean — this report joins that index |

### Pillar 3 — Constitution / parallel systems

| Finding | Canonical | Fork(s) / hotspot | Disposition |
|---------|-----------|-------------------|-------------|
| God files (>800 LOC) concentrate coupling risk | TASK-598 facade pattern (~500 LOC target) | See LOC table below | **TASK-601–605** |
| Shared hot modules still oversized | Extend shared; no parallel chrome | `creature-stat-block`, `entity-library-sections`, `grid-list-row` | **TASK-605** — co-located extract only; new shared public API → Architect pause |
| Creators / admin / encounters still hold most complexity | Unification barrels + feature libs | Creature/species/empowered/guided steps; admin codex tabs; encounter views | **TASK-602–604** (slices) |
| Automated coverage skewed to `lib/` + visual | Vitest (~63) beside domain helpers; Playwright visual/a11y | `src/app/api/**` has **0** co-located `*.test.ts`; 29 route files | **TASK-607** |

### LOC hotspots (≥800) — evidence for TASK-601–605

| LOC | Path | Slice task |
|-----|------|------------|
| 2009 | `src/app/(main)/crafting/[id]/page.tsx` | TASK-601 |
| 1435 | `src/app/(main)/encounters/[id]/_components/SkillEncounterView.tsx` | TASK-602 |
| 1246 | `src/app/(main)/encounters/[id]/_components/CombatEncounterView.tsx` | TASK-602 |
| 1235 | `src/app/(main)/admin/codex/AdminFeatsTab.tsx` | TASK-603 |
| 1179 | `src/components/shared/creature-stat-block.tsx` | TASK-605 |
| 1101 | `src/app/(main)/admin/codex/admin-archetype-editor.tsx` | TASK-603 |
| 1071 | `src/app/(main)/creature-creator/use-creature-creator-workspace.ts` | TASK-604 |
| 1067 | `src/components/shared/entity-library-sections.tsx` | TASK-605 |
| 1038 | `src/components/shared/grid-list-row.tsx` | TASK-605 |
| 993 | `src/app/(main)/species-creator/page.tsx` | TASK-604 |
| 987 | `src/lib/data-enrichment.ts` | TASK-605 |
| 981 | `src/app/(main)/admin/core-rules/page.tsx` | TASK-603 |
| 973 | `src/app/(main)/empowered-technique-creator/page.tsx` | TASK-604 |
| 930 | `src/app/(main)/admin/codex/use-admin-archetype-workspace.ts` | TASK-603 |
| 892 | `src/components/guided-creator/steps/powers-techniques-step.tsx` | TASK-604 |
| 884 | `src/components/character-creator/steps/ancestry-step.tsx` | TASK-604 |
| 882 | `src/app/(main)/admin/codex/AdminPartsTab.tsx` | TASK-603 |
| 836 | `src/app/(main)/creature-creator/creature-creator-editor.tsx` | TASK-604 |

### Recommended `/debt` slice (if owner says proceed)

1. Rotate `AI_CHANGELOG.md` entries older than ~60 days → `archive/AI_CHANGELOG_ARCHIVE.md` (TASK-606 first slice).
2. Do **not** fold god-file splits into `/debt` — those are dedicated TASK-601–605.
3. Do **not** invent parallel selection shells or new shared exports while splitting.

**Do-not-fold:** live codex SQL, deleting archive audit dumps, new shared barrel symbols without allowlist/ADR.

### Follow-ups filed

- **TASK-601** — Split crafting `[id]` page under ~500 LOC facade  
- **TASK-602** — Split combat + skill encounter views under ~500 LOC  
- **TASK-603** — Split admin codex / core-rules hot files under ~500 LOC  
- **TASK-604** — Split remaining creator hot files under ~500 LOC  
- **TASK-605** — Split shared + `data-enrichment` hot modules (co-located; Architect if new public API)  
- **TASK-606** — Docs corpus hygiene (changelog rotation + archive index honesty)  
- **TASK-607** — API route automated smoke + one critical-path non-visual e2e slice  

### Clean areas

- Stack coherence (Next App Router, Supabase, React Query, thin Zustand).  
- Design-token + upload ESLint gates; contrast/visual/a11y verify scripts.  
- Sheet + Advanced creator god-file wave already landed (TASK-598).  
- Anti-reimplementation culture (`FEATURE_INDEX`, shared-ui allowlist, task reconcile CI).
