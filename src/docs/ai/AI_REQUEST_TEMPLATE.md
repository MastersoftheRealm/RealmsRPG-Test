# AI Request Template

Use this template when converting raw feedback into an actionable request to be added to `AI_TASK_QUEUE.md`.

---
- id: TASK-###
  title: Short descriptive title
  created_at: YYYY-MM-DD
  created_by: owner|agent
  priority: critical|high|medium|low
  status: not-started|in-progress|blocked|done
  related_files:
    - path/to/file.tsx
  implemented_by: |
    # Optional: agent or human who implemented changes
  pr_link: |
    # Optional: URL of PR that implements this task (required before marking done)
  merged_at: |
    # Optional: YYYY-MM-DD when PR was merged
  evidence: |
    # Optional: Reviewer notes, test screenshots, or verification commands output
  verification_status: |
    # Optional: verified|failed|unverified
  automated_check: |
    # Optional: command to run for automated acceptance (e.g., "npm run build && node scripts/smoke_check.js")
  description: |
    One-paragraph summary of the requested change.
  acceptance_criteria:
    - Behavior: short bullet
    - Tests: what to run / how to verify
    - Deployment: notes (secrets, build step)
  notes: |
    Any extra context, links to vanilla site, screenshots, or previous PRs.

---
Example:
- id: TASK-001
  title: Unify skill rows across creators
  created_at: 2026-02-05
  created_by: owner
  priority: high
  status: not-started
  related_files:
    - src/components/character-sheet/skills-section.tsx
    - src/components/shared/skill-row.tsx
  description: |
    Replace inline skill implementations in character creator and creature creator with the shared `SkillRow` component. Keep business logic in parents and ensure variant styling for creator vs sheet.
  acceptance_criteria:
    - All three skill UIs use `SkillRow` with `variant` prop
    - Run `npm run build` successfully
    - Manual verification: create character, add skill, save, reload
  notes: |
    Reference UNIFICATION_STATUS.md and DESIGN_SYSTEM.md for component patterns.