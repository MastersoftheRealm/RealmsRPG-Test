# Audit (session / task)

**Read-only.** Score this chat / TASK-### against the three pillars below. Do **not** edit files, run formatters that write, or “fix” anything — report only.

Authority: `PR_CHECKLIST.md` § Owner commands + `ARCHITECTURE_CONSTITUTION.md`.

Optional args: `/audit TASK-502` = primary task; else infer from this chat + recent `ACTIVE_TASKS` / archive.

## Three pillars (score all three)

1. **Clutter & honesty** — Dead code, unused exports, duplicate helpers, unneeded lines/compat shims, docs that claim more than the code does (or lag the code). Prefer delete over documenting forever.
2. **Feedback / AC fidelity** — Did we actually do what the owner feedback and task acceptance criteria asked for? Diff the AC + `ALL_FEEDBACK_CLEAN` disposition against behavior in code (not against changelog prose).
3. **Necessary + constitutional additions** — Anything this session *added*: was it required for the AC? Did it extend `FEATURE_INDEX` + barrels (`shared` / `ui` / hooks / lib) instead of forking a parallel component/helper/modal/parser/upload path? Architect gates honored?

## Scope (strict)

1. Files touched in this conversation (`git status` / diff).
2. Task `related_files` / `related_tasks`.
3. Docs that claim DoD (`ACTIVE_TASKS`, archive, `AI_CHANGELOG`, `BUILD_VALIDATION`, `FEATURE_INDEX` as relevant).

**Out of scope:** repo-wide deep dive (`/global-audit`), `/debt` apply, unrelated dirty files, live DB/codex mutation.

## Procedure

1. Identify target task(s) and in-scope file set.
2. Score **pillars 1–3** with evidence (paths, AC quotes, greps).
3. Walk **PR Checklist** 1–18 as a checklist under those pillars (tokens, mobile, a11y, uploads, barrels, verification_status, etc.).
4. Call out AI failure modes: parallel shells, premature `done`, docs-only “honesty” that adds lines without removing clutter, new files that should have been props on shared components.
5. End with whether the owner should run `/cleanup` next.

## Report format

```markdown
## Audit — TASK-### (or session)

**Verdict:** ready for done | gaps remain | not ready (partial)

### Pillar scores
| Pillar | Score | Notes |
|--------|-------|-------|
| 1 Clutter & honesty | pass / gaps | … |
| 2 Feedback / AC fidelity | pass / gaps | … |
| 3 Necessary + constitutional additions | pass / gaps | … |

### Scope
- Files / tasks reviewed

### Pass
- Short bullets

### Gaps (fix before done)
| Severity | Pillar | Finding | Evidence | Suggested fix |
|----------|--------|---------|----------|---------------|
| blocker / major / minor | 1/2/3 | … | path or AC | … |

### Cleanup candidates
- Removals / wire-to-canonical safe for `/cleanup` (even if not DoD blockers)

### Follow-ups (out of scope)
- Items for `/global-audit`, `/debt`, or a new TASK-### — do not expand blast radius

### Next
- Say `/cleanup` to apply in-scope fixes, or address blockers manually.
```

## Hard rules

- **Zero edits.**
- Evidence over vibes.
- If AC or owner feedback is unmet, verdict must not be “ready for done.”
- “Docs honesty” alone is not a pass on pillar 1 if dead forks remain in scope.
