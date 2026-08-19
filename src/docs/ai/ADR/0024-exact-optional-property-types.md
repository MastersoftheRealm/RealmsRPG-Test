# ADR-0024: Enable `exactOptionalPropertyTypes`

- **Status:** Accepted (TASK-824; owner ack 2026-08-18: next Architect leftover, excluding Legacy route deletion and TASK-799)
- **Date:** 2026-08-18
- **Deciders:** owner / agent (Architect role)
- **Task:** TASK-824
- **Parent:** ADR-0022 / report 11

## Context

`{ x?: string }` still accepts `x: undefined`, so optional chaining and `|| undefined`
can put explicit `undefined` on objects that later reach Supabase JSON/payloads.
ADR-0022 left this flag off. A first attempt rewrote ~529 implementation files with
an AST pass and recovered with `git checkout -- src` — do not repeat that.

## Decision

1. Burn down `npm run typecheck:strictest` by widening **destination** types
   (`foo?: T | undefined` or `AllowUndefinedOptionals<T>` in
   `lib/utils/exact-optional.ts`) and omitting unset keys at persistence /
   third-party call sites. No repo-wide implementation rewrite.
2. Move `exactOptionalPropertyTypes: true` into the main `tsconfig.json`.
3. Keep `tsconfig.strictest.json` as an extension point for future stricter flags
   (it extends main; do not re-list `exactOptionalPropertyTypes` there).
4. Persistence / generated `Database`: keep `database.types.ts` strict. Omit the
   key (`removeUndefined` or conditional spread). Do not add `| undefined` to
   generated optional columns.
5. Do **not** delete `/characters/new/advanced`. Do not fold TASK-799 clusters
   or other strict flags.

## Consequences

- Positive: optional-vs-undefined is explicit; Supabase insert/update stays gated
  by generated types.
- Negative / follow-ups: TASK-834 stays owner content recovery. Helper params
  that still take unparameterized `SupabaseClient` remain TASK-822.
- Rejected: 529-file AST rewrite of implementations; `git checkout -- src` on a
  dirty tree; widening generated DB types; leave the flag preview-only.
