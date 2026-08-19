# ADR-0020: Generated Supabase Database types

- **Status:** Accepted (TASK-795; owner ack 2026-08-18)
- **Date:** 2026-08-18
- **Deciders:** owner / agent (Architect role)
- **Task:** TASK-795

## Context

Report 12 F9: browser/server/service-role clients were untyped, so every `.from()` was
`any`-ish. Row shapes were re-declared per route (`CampaignRow` ×3, `RolePolicyRow` ×3,
codex `Row = Record<string, unknown>`). Doc↔SQL↔TS drifted on nullability and `user_id`.

Hand-written `Library*` / `Codex*` / `Campaign` types describe **API/domain** shapes, not
Postgres rows. Generating types does not replace those.

## Decision

1. Check in `src/types/database.types.ts` from `npm run db:types`
   (`supabase gen types typescript --project-id <id> --schema public`).
2. Parameterize every app factory with `Database`: browser, cookie server, service-role,
   middleware, and auth callback. Do not add a fifth untyped `createClient` from
   `@supabase/supabase-js` — use `createServiceRoleClient`.
3. Keep `Library*` / `Codex*` / document types. Mapping is
   `Tables<'official_powers'>` → `rowToItem()` → `LibraryPower`.
4. `asLibraryCountsClient` stays: passing the full `SupabaseClient<Database>` into that
   helper overflows TS2589. That is a narrow count-route shim, not a silent `any` on the
   client.
5. JSONB writes go through `asDbJson` / `asDbInsert` / `asDbUpdate`. Variable table names
   go through `fromPublicTable` (`lib/supabase/database.ts`). Production campaign mappers
   alias `Tables<'campaigns'>` — do not re-declare independent `CampaignRow` copies.

## Consequences

- Positive: `.from('missing_table')` and insert/update shape errors are compile-time;
  regenerating the file is the schema-drift report.
- Negative / follow-ups: JSONB columns are `Json`; mappers still parse. `noUncheckedIndexedAccess`
  landed as TASK-797 / ADR-0022. Zod-parse `/api/codex` is still a follow-up (report 10 P1-7).
- Rejected alternatives: keep hand-written row types (they already drifted); generate
  without typing the client (no leverage).
