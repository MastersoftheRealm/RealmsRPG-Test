# ADR-0013: Character dirty-key PATCH + updatedAt 409

- **Status:** Accepted
- **Date:** 2026-08-14
- **Deciders:** owner (audit program: Wave 2 P0 after TASK-740) / agent (Architect role)
- **Task:** TASK-741

## Context

`PATCH /api/characters/[id]` already merged the JSON body into the stored blob, but every sheet
autosave sent `cleanForSave` of the **whole** character (all ~50 allow-listed keys). Two tabs, or a
GM HP write plus a player inventory edit, last-write-wins the entire document. There was no
`updatedAt` precondition. Autosave retry/pagehide already landed (TASK-736).

Codex writes already lock on `updated_at` (`admin/codex/actions.ts`). Reuse that idea; do not add a
separate `version int` column.

## Decision

1. **Dirty-key body.** Clients send only keys that changed (plus optional `updatedAt`). The route
   merges those keys into the stored `data` JSONB. Omitted keys stay as stored. Meta keys
   (`id`, `userId`, `createdAt`, `updatedAt`) are never copied from the client into the blob
   (`prepareCharacterForSave` already strips them from the client body; the route stamps blob
   `updatedAt` via `applyCharacterDirtyPatch(..., { blobUpdatedAt })` to match the column).
2. **Optimistic lock on `characters.updated_at`.** When the client sends `updatedAt` and the row
   has a column value, mismatch → **409** `{ error: string }` and no write. Match → UPDATE also
   `.eq('updated_at', <value just read>)` so a concurrent writer still 409s. Legacy null column or
   omitted `updatedAt` (portrait-after-create, resource-only sync) skips the lock but still stamps
   `updated_at` so later sheet saves can lock.
3. **Success** `{ ok: true, updatedAt }` (column ISO). Client stores that token for the next PATCH.
4. **409 handling.** Caller refetches, keeps local dirty keys, retries once with the remote token.
   Same-key conflicts: local dirty value wins on the retry (last writer of that key).
5. **Character React Query keys** include the signed-in user id (same pattern as user-library).

## Consequences

- Positive: inventory/notes/level in tab A survive HP/resource writes in tab B; stale tabs 409
  instead of silently restoring an old full document.
- Negative / follow-ups: campaign server actions that write `characters.data` should stamp
  `updated_at` (they already merge); resource sync still omits `updatedAt` by design (HP LWW)
  via `saveCharacter(..., { skipLock: true })`. Same-tab races (autosave + resource sync +
  pending resave) are serialized by `lib/character/save-lock.ts` (TASK-786): per-id PATCH
  queue, in-memory newest `updatedAt`, and resource sync only when HP/EN/AP change.
  Library add-to-character lock/retry is TASK-746 (done). Sheet realtime merge for
  non-resource keys is TASK-747 (done): remote wins for untouched keys; HP/EN/AP still
  use `mergeResourceUpdatesIntoCharacter` and the echo suppress window.
  Sheet document SoT is `useCharacter` / `characterKeys.detail` (TASK-750): sheet
  `setCharacter` is `patchCharacterDetailQuery`; `useSaveCharacter` merges the
  applied PATCH body (including a 409 retry) into that cache and invalidates the
  list only (detail invalidate would clobber unsaved sheet edits).
- Rejected alternatives: `version int` column (extra migration; `updated_at` already exists);
  requiring `updatedAt` on every PATCH (breaks portrait-after-create and encounter HP sync);
  putting `updatedAt` in the 409 body (error shape stays `{ error: string }`; client GETs).
