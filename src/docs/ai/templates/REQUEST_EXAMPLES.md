# Request Examples

Example: Convert raw feedback to task

Raw feedback:
- "Weapons don't show damage in library; edit should open creator with item loaded."

Converted task (use `AI_REQUEST_TEMPLATE.md`):
- id: TASK-003
  title: Show weapon damage in library list and wire edit to creator
  priority: high
  status: not-started
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/creator/item-creator/page.tsx
  description: |
    Ensure library displays computed weapon damage. Update edit action to open item creator with item data loaded for editing.
  acceptance_criteria:
    - Library list shows damage column for weapons
    - Edit button opens item creator with item loaded (no redirect)
    - `npm run build` passes
  notes: |
    See ALL_FEEDBACK_CLEAN.md entries 2/3/2026 for original report.
