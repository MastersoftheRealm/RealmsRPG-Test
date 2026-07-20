# AI Request Template

Use this template when converting raw feedback into an actionable request to be added to `ACTIVE_TASKS.md`.

---
- id: TASK-###
  title: Short descriptive title
  created_at: YYYY-MM-DD
  created_by: owner|agent
  priority: critical|high|medium|low
  status: not-started|in-progress|blocked|partial|done
  completed_work: |
    # Required when status is partial: what was actually finished (bullets).
  remaining_work: |
    # Required when status is partial: acceptance criteria still open (bullets).
  follow_up_tasks:
    - TASK-###
  build_validation: |
    # Required for user-facing UI/API/security when marking done/partial.
    suite: DEV-V-###   # category in BUILD_VALIDATION.md
    tests:
      - DEV-V-###-T001
      - DEV-V-###-T002
    # Add full step-by-step entries in src/docs/ai/BUILD_VALIDATION.md (one behavior per test).
    # Index suite in DEVELOPER_TASK_QUEUE.md → Build validation index.
  developer_test_plan: |
    # Short pointer for the task queue, e.g. "Suite DEV-V-001 T001–T015 — see BUILD_VALIDATION.md"
  related_files:
    # Real repo paths only (files or dirs that exist). CI validate-related-files fails on typos.
    # Prefer concrete modules (e.g. src/hooks/use-codex.ts), not guessed filenames.
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
    # Required when archiving user-facing work: pending-qa | verified | failed | skipped | n/a
    # pending-qa = implementation done, owner manual QA not run yet (default for BUILD_VALIDATION tasks)
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
    Reference ARCHITECTURE_CONSTITUTION.md + AGENT_GUIDE.md (on demand) and DESIGN_SYSTEM.md for component patterns.