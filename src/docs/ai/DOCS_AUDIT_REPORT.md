# Documentation & Task Compliance Audit

**Date:** 2026-02-05  
**Purpose:** Verify documentation accuracy and task completion compliance for AI agents.

---

## 1. Task Compliance — Incomplete or Non-Compliant

### TASK-022: Feat deletion — confirmation dialog missing

**Acceptance criteria:** "Confirmation dialog before deletion"  
**Current state:** Feat deletion calls `handleRemoveFeat` directly via GridListRow's onDelete. No confirmation dialog.  
**Status:** ❌ INCOMPLETE — Add DeleteConfirmModal or similar before feat removal.

### TASK-048: Library tab ordering — already implemented

**Acceptance criteria:** Tab order Feats → Powers → Techniques → Inventory → Proficiencies → Notes; default Feats.  
**Current state:** `library-section.tsx` tabs array order matches; `useState<TabType>('feats')` sets default.  
**Status:** ✅ ALREADY DONE — Task can be marked done (was not-started).

---

## 2. Documentation Inaccuracies

### Task Queue (AI_TASK_QUEUE.md)

| Task | Issue |
|------|-------|
| TASK-016 | `related_files` lists `defenses-section.tsx` — file does not exist. Defenses are in `abilities-section.tsx`. |
| TASK-027 | `related_files` lists `src/lib/constants/power-parts.ts` — file does not exist. Actual file: `src/lib/game/creator-constants.ts`. |
| TASK-030, TASK-031 | `related_files` lists `header-section.tsx` — file does not exist. Replaced by SheetActionToolbar. |
| TASK-032 | `related_files` lists `public/images/dice/` — subfolder does not exist. Dice images are in `public/images/` (D4.png, D6.png, etc.). |

### ALL_FEEDBACK_CLEAN.md

- Extract script looks for `## Raw Entries` or `### Raw Entries` — doc uses "### Raw Entries (chronological)". Regex `#{2,} Raw Entries` matches. ✅ OK.

---

## 3. Doc Improvements for AI Agents

### AGENT_GUIDE.md

- Add note: "Verify related_files when implementing — some task queue entries have stale paths."
- Consider adding "Common file path corrections" section.

### AGENTS.md

- Add: "When implementing a task, verify acceptance criteria are fully met before marking done."
- Add: "Check that related_files in task queue match actual codebase paths."

### UNIFICATION_STATUS.md

- Add: "TASK-048 (Library tab order) is already implemented — default Feats, correct order."

### extract_feedback.js

- Script uses "Raw Entries" — doc section is "### Raw Entries (chronological)". Ensure consistency. Human instructions say "Raw Feedback Log" but script parses "Raw Entries". Document this in ALL_FEEDBACK_CLEAN or script header.

---

## 4. Actions Taken (Post-Audit)

- **TASK-022** — Added compliance gap note; created TASK-053 for confirmation dialog.
- **TASK-048** — Marked done (was already implemented).
- **TASK-016, TASK-027, TASK-030, TASK-031, TASK-032** — Fixed stale related_files in AI_TASK_QUEUE.
- **TASK-053** — Created: Add confirmation dialog before feat deletion.
- **TASK-054** — Created: Documentation — add agent verification guidelines.

---

## 5. Summary

| Category | Count |
|----------|-------|
| Tasks with incomplete acceptance criteria | 1 (TASK-022) |
| Tasks already done but not marked | 1 (TASK-048) |
| Task queue related_files inaccuracies | 5 tasks |
| Doc improvement items | 4 |
