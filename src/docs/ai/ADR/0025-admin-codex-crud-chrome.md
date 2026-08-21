# ADR-0025: Admin Codex CRUD chrome stays tab-local

- **Status:** Accepted
- **Date:** 2026-08-19
- **Deciders:** owner (chat ack to start TASK-842) / agent (Architect)
- **Task:** TASK-842 / TASK-845

## Context

Nine Admin Codex entity tabs plus the archetype workspace duplicated add/edit/duplicate/save state, row Edit/Duplicate/Delete chrome, and edit-modal Cancel/Save/Delete footers (audit F-18). TASK-799 already collapsed first-step delete onto `DeleteConfirmModal`. `CodexBrowseListShell` (ADR-0005) owns browse list chrome (search / filters / ListHeader). `OfficialEntityList` (ADR-0001) owns official library grids. Folding admin CRUD into either would mix browse/admin/library contracts.

## Decision

Keep Admin Codex CRUD helpers **co-located** under `src/app/(main)/admin/codex/`:

- `useAdminCodexEntity` — modal/editing/saving/copySourceName, `save` via `createCodexDoc` / `updateCodexDoc`, `askDelete`
- `AdminCodexRowActions` — Dense Edit / Duplicate / Delete icon buttons
- `AdminCodexEditModalFooter` — Delete (when editing) + Cancel + Primary `size="lg"` Save
- `AdminCodexCopySourceBanner` — Duplicate “Creating a copy of {name}” callout (`entityLabel`; TASK-852)
- `AdminCodexDeleteModals` — `DeleteConfirmModal` then still-referenced `ConfirmActionModal`

Do **not** put these in `shared/` / `ui/` / `patterns/`. Do not merge OfficialEntityList with My Library. Do not extend CodexBrowseListShell with save/row-action/footer props. Do not delete `/characters/new/advanced`.

## Consequences

- Positive: one CRUD fork deleted; browse shell and official grids stay single-purpose.
- Follow-up TASK-849 (done): one `COPY_NAME_SUFFIX` in `admin-codex-copy-suffix.ts`; Skills / Equipment / Creature Feat edit chrome extracted. Spreadsheet suffix stays local.
- Rejected alternatives: a third list shell; extending CodexBrowseListShell or OfficialEntityList for admin save/delete.
