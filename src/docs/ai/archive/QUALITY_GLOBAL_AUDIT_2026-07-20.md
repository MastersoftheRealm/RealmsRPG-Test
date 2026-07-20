# Pseudo `/global-audit` — Codebase quality (2026-07-20)

**Date:** 2026-07-20  
**Focus:** structural quality follow-up to owner website audit + agent quality review  
**Mode:** inventory + task filing (owner asked to file tasks). No code deletes in this pass.

Companion context: owner recently ran a website audit; this report adds structural/process findings from a fresh repo inventory (LOC hotspots, docs corpus, test shape) and files `TASK-607`–`TASK-613` (originally drafted as 601–607; **renumbered** after master `/debt` claimed TASK-601–606).

---

## Global audit

### Executive verdict

Process maturity (constitution, barrels, token ESLint, visual/a11y ratchets, almost-empty ACTIVE queue after TASK-593–600) is strong. Remaining systemic debt is **file size / local complexity** in play-loop and admin surfaces, **hot-path changelog bloat**, and a **coverage shape** that favors pure `lib/` + Playwright visuals over API route automation. Biggest wins: continue the TASK-598-style facade splits on the largest god files, rotate `AI_CHANGELOG.md`, then add a thin API smoke layer.

### Pillar 1 — Clutter (dead / unused / stale)

| Finding | Evidence | Disposition |
|---------|----------|-------------|
| Live `AI_CHANGELOG.md` is very large (~240KB / ~770 lines of dense entries) | `wc -c src/docs/ai/AI_CHANGELOG.md` | **TASK-612** (debt-safe rotation slice OK under `/debt docs-only`) |
| Docs corpus is heavy (~89 markdown files; archive alone ~25k lines) | `find src/docs` / `archive/*.md` | **TASK-612** — inventory honesty + prune live-sounding superseded claims; do not delete history dumps without ack |
| Styleguide page is a large living catalog (~828 LOC) | `src/app/dev/styleguide/page.tsx` | **ack / defer** — intentional; not a product god-file |

### Pillar 2 — Fidelity (docs & tasks vs code)

| Finding | Evidence | Disposition |
|---------|----------|-------------|
| Hot-path ACTIVE is healthy after recent debt | `ACTIVE_TASKS.md` | Clean — keep lean; quality tasks renumbered to 607–613 |
| FEATURE_INDEX + barrels still advertise canonical shared patterns | `FEATURE_INDEX.md`, `shared/index.ts` | Clean — splits must update index when facades move |
| Prior June audits remain archive-only (correct) | `HISTORY_INDEX.md` | Clean — this report joins that index |

### Pillar 3 — Constitution / parallel systems

| Finding | Canonical | Fork(s) / hotspot | Disposition |
|---------|-----------|-------------------|-------------|
| God files (>800 LOC) concentrate coupling risk | TASK-598 facade pattern (~500 LOC target) | See LOC table below | **TASK-607–611** |
| Shared hot modules still oversized | Extend shared; no parallel chrome | `creature-stat-block`, `entity-library-sections`, `grid-list-row` | **TASK-611** — co-located extract only; new shared public API → Architect pause; prefer TASK-604 weapon-attack wire first |
| Creators / admin / encounters still hold most complexity | Unification barrels + feature libs | Creature/species/empowered/guided steps; admin codex tabs; encounter views | **TASK-608–610** (slices); species/empowered also under debt **TASK-601** workspace extract |
| Automated coverage skewed to `lib/` + visual | Vitest (~63) beside domain helpers; Playwright visual/a11y | `src/app/api/**` has **0** co-located `*.test.ts`; 29 route files | **TASK-613** |

### LOC hotspots (≥800) — evidence for TASK-607–611

| LOC | Path | Slice task |
|-----|------|------------|
| 2009 | `src/app/(main)/crafting/[id]/page.tsx` | TASK-607 |
| 1435 | `src/app/(main)/encounters/[id]/_components/SkillEncounterView.tsx` | TASK-608 |
| 1246 | `src/app/(main)/encounters/[id]/_components/CombatEncounterView.tsx` | TASK-608 |
| 1235 | `src/app/(main)/admin/codex/AdminFeatsTab.tsx` | TASK-609 |
| 1179 | `src/components/shared/creature-stat-block.tsx` | TASK-611 |
| 1101 | `src/app/(main)/admin/codex/admin-archetype-editor.tsx` | TASK-609 |
| 1071 | `src/app/(main)/creature-creator/use-creature-creator-workspace.ts` | TASK-610 |
| 1067 | `src/components/shared/entity-library-sections.tsx` | TASK-611 |
| 1038 | `src/components/shared/grid-list-row.tsx` | TASK-611 |
| 993 | `src/app/(main)/species-creator/page.tsx` | TASK-610 |
| 987 | `src/lib/data-enrichment.ts` | TASK-611 |
| 981 | `src/app/(main)/admin/core-rules/page.tsx` | TASK-609 |
| 973 | `src/app/(main)/empowered-technique-creator/page.tsx` | TASK-610 |
| 930 | `src/app/(main)/admin/codex/use-admin-archetype-workspace.ts` | TASK-609 |
| 892 | `src/components/guided-creator/steps/powers-techniques-step.tsx` | TASK-610 |
| 884 | `src/components/character-creator/steps/ancestry-step.tsx` | TASK-610 |
| 882 | `src/app/(main)/admin/codex/AdminPartsTab.tsx` | TASK-609 |
| 836 | `src/app/(main)/creature-creator/creature-creator-editor.tsx` | TASK-610 |

### Recommended `/debt` slice (if owner says proceed)

1. Rotate `AI_CHANGELOG.md` entries older than ~60 days → `archive/AI_CHANGELOG_ARCHIVE.md` (TASK-612 first slice).
2. Do **not** fold god-file splits into `/debt` — those are dedicated TASK-607–611.
3. Do **not** invent parallel selection shells or new shared exports while splitting.

**Do-not-fold:** live codex SQL, deleting archive audit dumps, new shared barrel symbols without allowlist/ADR.

### Follow-ups filed

- **TASK-607** — Split crafting `[id]` page under ~500 LOC facade  
- **TASK-608** — Split combat + skill encounter views under ~500 LOC  
- **TASK-609** — Split admin codex / core-rules hot files under ~500 LOC  
- **TASK-610** — Split remaining creator hot files under ~500 LOC  
- **TASK-611** — Split shared + `data-enrichment` hot modules (co-located; Architect if new public API)  
- **TASK-612** — Docs corpus hygiene (changelog rotation + archive index honesty)  
- **TASK-613** — API route automated smoke + one critical-path non-visual e2e slice  

### Clean areas

- Stack coherence (Next App Router, Supabase, React Query, thin Zustand).  
- Design-token + upload ESLint gates; contrast/visual/a11y verify scripts.  
- Sheet + Advanced creator god-file wave already landed (TASK-598).  
- Anti-reimplementation culture (`FEATURE_INDEX`, shared-ui allowlist, task reconcile CI).
