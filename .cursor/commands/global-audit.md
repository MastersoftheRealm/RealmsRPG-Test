# Global audit (repo-wide, read-only)

Deep **read-only** inventory of parallel systems, dead code, docs drift, and constitution violations across the repo. Report only — do **not** edit, delete, or “fix.”

Authority: `ARCHITECTURE_CONSTITUTION.md` § Anti-debt + `PR_CHECKLIST.md` § Owner commands + `FEATURE_INDEX.md` / barrels.

**Pairing:** `/global-audit` (find) → owner reviews → `/debt` (apply safe slices) and/or new `TASK-###` for gated work.

Optional args narrow focus: `/global-audit selection` · `/global-audit docs` · `/global-audit shared` · default = full dive below.

## Not the same as

| Command | Mode | Scope |
|---------|------|-------|
| `/audit` | Read-only | This session / one TASK-### |
| `/cleanup` | Apply | Same as `/audit` |
| `/global-audit` | Read-only | Whole repo (deep) |
| `/debt` | Apply | Whole repo (gated) — prefer after this report |

## Three pillars (repo scale)

1. **Clutter** — Dead exports, unused shared components, compat shims, stale ACTIVE_TASKS preamble, changelog bloat, docs that advertise removed APIs.
2. **Fidelity** — Stale task `remaining_work` / `status` lagging code (e.g. `not-started` but Phase already shipped), FEATURE_INDEX/DATA_HANDLING claiming forks that no longer exist (or missing canonical paths), BUILD_VALIDATION that cannot pass as written.
3. **Constitution / unification** — Parallel selection shells, filter barrels, parsers, upload paths, formatters, admin↔codex list chrome, local copies of tooltip/auth/damage helpers vs barrels + `realms-unification.mdc`.

## Procedure (be thorough)

1. **Map canonical patterns** — `FEATURE_INDEX.md`, `realms-unification.mdc`, barrels (`shared` / `ui` / hooks / services), `FEATURE_INDEX_BARRELS.generated.md`.
2. **Duplication greps** (evidence required):
   - raw `fetch('/api/upload` vs `apiUpload`
   - domain parsers outside `src/lib/game/`
   - `formatDuration*` / damage-split / auth-error / skill-map forks
   - selection modals not on `UnifiedSelectionModal`
   - deprecated re-export barrels / `@deprecated` shims still imported
   - dead shared exports (barrel symbol with zero TSX/TS consumers outside definition)
3. **Hot-path docs** — `ACTIVE_TASKS.md` size (target &lt;20KB), done blocks still active, superseded IDs, changelog age vs `AI_CHANGELOG_ARCHIVE.md`.
4. **Classify every finding:**
   - **Safe for `/debt`** — obvious dead code, docs lag, single-fork wire-up with clear canonical
   - **Needs TASK-###** — multi-file behavior risk, Architect-class, broad consumers
   - **Needs owner ack** — deleting something that might still be product-intentional
5. **Order the recommended `/debt` slice** — smallest high-value deletes first; explicitly list **do-not-fold** items (separate TASK / ack).
6. **Output the report.** Do not start `/debt` unless the owner explicitly asks in the same message.

## Report format

```markdown
## Global audit

**Date:** YYYY-MM-DD
**Focus:** full | selection | docs | shared | …

### Executive verdict
- 2–4 sentences: how bad is parallelization / clutter; biggest wins if cleaned

### Pillar 1 — Clutter (dead / unused / stale)
| Finding | Evidence | Disposition |
|---------|----------|-------------|
| … | path / grep | debt-safe / TASK / ack |

### Pillar 2 — Fidelity (docs & tasks vs code)
| Finding | Evidence | Disposition |
|---------|----------|-------------|
| … | … | … |

### Pillar 3 — Constitution / parallel systems
| Finding | Canonical | Fork(s) | Disposition |
|---------|-----------|---------|-------------|
| … | FEATURE_INDEX / barrel | paths | debt-safe / TASK / ack |

### Recommended `/debt` slice (if owner says proceed)
- Ordered bullets: smallest high-value deletes first
- Do-not-fold: …

### Follow-ups to file (do not file unless asked, or owner said “file tasks”)
- Proposed TASK titles (one line each)

### Clean areas
- What already looks unified (so agents do not “fix” them)
```

## Hard rules

- **Zero edits** (including no task filing unless the owner asked to file).
- Prefer evidence (paths, counts, barrel greps) over vibes.
- Do not turn the report into a second FEATURE_INDEX — findings must be actionable.
- Session work still uses `/audit` → `/cleanup`; this command is for systemic drift.
