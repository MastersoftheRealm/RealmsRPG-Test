# ADR-0022: Enable `noUncheckedIndexedAccess`

- **Status:** Accepted (TASK-797; owner ack 2026-08-18: next Architect leftover, excluding Legacy route deletion)
- **Date:** 2026-08-18
- **Deciders:** owner / agent (Architect role)
- **Task:** TASK-797

## Context

Report 11 P1-5 / Wave 3C leftover: `strict` is on but `arr[i]` still types as `T`.
`tsconfig.strictest.json` already previews the flag (~210 errors after later work, not the
audit’s ~1,523 index sites). Tooling was ready; WAITING until owner ack.

## Decision

1. Burn down `npm run typecheck:strictest` with type-narrowing only (`defined()` /
   `isDefined()`, loop guards, regex-group `??`). No behavior changes, no new shared/ui.
2. Move `noUncheckedIndexedAccess: true` into the main `tsconfig.json`.
3. Keep `tsconfig.strictest.json` as an extension point for future stricter flags
   (it extends main; do not re-list `noUncheckedIndexedAccess` there).
4. Do **not** delete `/characters/new/advanced`. Legacy files get the same narrowing only.

## Consequences

- Positive: indexed reads are `T | undefined`; empty-array `[0]` and regex groups are compile-time.
- Negative / follow-ups: TASK-799 list/modal clusters done (pending-qa). `exactOptionalPropertyTypes`
  is TASK-824 / ADR-0024 (Accepted; flag in main `tsconfig.json`).
- Rejected: leave the flag preview-only; blanket `!` on every index; skip Legacy type errors.
