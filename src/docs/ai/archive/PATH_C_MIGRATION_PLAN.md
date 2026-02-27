# Path C: Full Migration Plan — Prisma to Supabase + Raw SQL

**Purpose:** Single, detailed plan for migrating RealmsRPG from Prisma to Supabase client + raw SQL, with a single `public` schema, Realtime best practices, and alignment with columnar/JSONB database layout (gold standard). Use this for execution and for AI agents; do not get lost in the original assessment plan.

**Source:** Derived from the Prisma long-term assessment plan (sections 6.5, 6.6) and current codebase (ARCHITECTURE.md, DATABASE_SCALABILITY_AUDIT.md, realtime usage, RLS, migrations).

**Status:** Phases 0–6 and 6b complete. All app data uses Supabase; Prisma removed; seed scripts and docs updated. AI/agent docs aligned with Path C (Supabase-only, SQL migrations, no Prisma).

---

## 1. Overview

| Item | Decision |
|------|----------|
| **Data access** | Supabase server client only. CRUD via `supabase.from('table_name')` (all tables in `public`). Complex/transactional logic via `supabase.rpc('function_name', args)`. |
| **Schema** | Single **`public`** schema for all app tables. No `users`, `campaigns`, `codex`, `encounters` schemas after migration. |
| **Migrations** | SQL-only. Supabase migrations (e.g. `supabase db push`) or run SQL files in CI. No Prisma Migrate. |
| **Types** | Hand-written or `supabase gen types typescript` → `src/types/database.ts`. No `@prisma/client`. |
| **Realtime** | Supabase Realtime (postgres_changes). Tables that need live updates added to `supabase_realtime` publication; RLS on all; best-practice channel/subscribe/unsubscribe and fallback refetch. |
| **Database layout** | Columnar where recommended (codex ✅, official library, user library ✅); JSONB where recommended (characters, encounters, campaign_rolls, core_rules). See section 4. |

**Out of scope for this plan:** Feature work (e.g. new Realm master messaging UX). The plan prepares the schema and Realtime so that future messaging/prompting tables can be added in `public` with the same patterns.

---

## 2. Current state (snapshot)

### 2.1 Stack

- **Runtime:** Next.js 16 (App Router), React 19, Vercel.
- **Database:** Supabase PostgreSQL. **Auth + Storage** and **all table access** via Supabase client (Phases 1–6 complete). No Prisma.
- **Schemas:** Single **`public`** schema (Phase 0 SQL complete). All app tables live in `public`.

### 2.2 Table layout

**Single source of truth:** [SUPABASE_SCHEMA.md](../SUPABASE_SCHEMA.md). All tables live in `public`; codex tables are columnar; public library is `public_*` (id+data JSONB); user library is columnar (scalars + payload) except user_species (id+data). Do not duplicate the table list elsewhere.

### 2.3 Realtime usage today

- **Campaign roll log:** [use-campaign-rolls.ts](../../hooks/use-campaign-rolls.ts) — `postgres_changes` on `public.campaign_rolls` filter `campaign_id=eq.{id}`; refetches query on event. Roll data from API `/api/campaigns/[id]/rolls` (Supabase).
- **Character HP/EN/AP sync:** [characters/[id]/page.tsx](../../app/(main)/characters/[id]/page.tsx) — `postgres_changes` on `public.characters` filter `id=eq.{characterId}`; merges payload into local state. [CombatEncounterView.tsx](../../app/(main)/encounters/[id]/_components/CombatEncounterView.tsx) — same table, filter `id=in.(id1,id2,...)` for combatants; updates encounter combatant HP/EN/AP from payload.
- **RLS:** Realtime needs SELECT on table; all tables are in `public`; RLS policies reference `public` (see path-c-phase0 Part 2 and [sql/supabase-rls-policies.sql](../../../sql/supabase-rls-policies.sql) for historical multi-schema version).

### 2.4 Prisma touchpoints (to remove)

- ~~[src/lib/prisma.ts](../../lib/prisma.ts)~~ — deleted (Phase 5).
- [src/app/api/codex/route.ts](../../app/api/codex/route.ts), [src/lib/codex-server.ts](../../lib/codex-server.ts) — codex read.
- [src/app/(main)/admin/codex/actions.ts](../../app/(main)/admin/codex/actions.ts) — codex admin CRUD.
- [src/app/api/characters/](../../app/api/characters/), [src/app/(main)/characters/actions.ts](../../app/(main)/characters/actions.ts), [src/lib/character-server.ts](../../lib/character-server.ts) — characters.
- [src/app/(main)/library/actions.ts](../../app/(main)/library/actions.ts), [src/app/api/user/library/[type]/route.ts](../../app/api/user/library/[type]/route.ts), [src/lib/owner-library-for-view.ts](../../lib/owner-library-for-view.ts) — user library.
- [src/app/api/campaigns/](../../app/api/campaigns/), [src/app/(main)/campaigns/actions.ts](../../app/(main)/campaigns/actions.ts) — campaigns.
- [src/app/api/encounters/](../../app/api/encounters/) — encounters.
- [src/app/api/public/[type]/route.ts](../../app/api/public/[type]/route.ts) — public library.
- [src/app/api/upload/profile-picture/route.ts](../../app/api/upload/profile-picture/route.ts), [src/app/api/admin/users/](../../app/api/admin/users/), [src/app/(auth)/actions.ts](../../app/(auth)/actions.ts) — profile, admin, delete-account.
- [src/app/(auth)/forgot-username/action.ts](../../app/(auth)/forgot-username/action.ts), [src/app/api/campaigns/route.ts](../../app/api/campaigns/route.ts) (includes $queryRaw).
- Package.json: remove `prisma`, `@prisma/client`; remove `prisma generate` from postinstall/build; replace `db:migrate` with Supabase migration run.

---

## 3. Target state

### 3.1 Architecture

- **One schema:** `public`. All app tables live in `public` with clear names: `user_profiles`, `usernames`, `characters`, `user_powers`, `user_techniques`, `user_items`, `user_creatures`, `user_species`, `campaigns`, `campaign_rolls`, `campaign_members` (if used), `encounters`, `codex_feats`, … `codex_creature_feats`, `core_rules`, `official_powers`, … (or keep `public_*` names until rename), etc.
- **Data access:** Server-only Supabase client ([createClient from server](../../lib/supabase/server.ts)). Reads/writes: `supabase.from('user_profiles')`, `supabase.from('characters')`, etc. Complex: `supabase.rpc('get_campaigns_for_user', { p_user_id: userId })`, `supabase.rpc('delete_user_data', { p_user_id: userId })`.
- **Types:** `src/types/database.ts` (and existing [src/types/](../../types/) for domain types). No Prisma imports.
- **Realtime:** Same behavior; tables are now in `public`, so no cross-schema USAGE. Publication: `ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_rolls;` and `ADD TABLE public.characters;` (and any future tables, e.g. `public.encounters` for messaging). Clients subscribe with `schema: 'public'`, `table: 'campaign_rolls'` or `'characters'`.

### 3.2 Realtime best practices (target)

- **RLS:** Every table in the Realtime publication must have RLS enabled. Policies must allow SELECT for the roles that need to see changes (e.g. authenticated users for their rows).
- **Publication:** Only add tables that need live push. Today: `campaign_rolls`, `characters`. Future: e.g. `encounters` or a dedicated `campaign_messages` / `realm_prompts` table for Realm master → players.
- **Schema:** With everything in `public`, use `schema: 'public'` in all `postgres_changes` subscriptions. No GRANT USAGE ON SCHEMA for custom schemas.
- **Client pattern:** One channel per logical subscription (e.g. one channel per campaign for rolls, one per encounter for character list). Subscribe on mount; `supabase.removeChannel(channel)` on unmount. Use `refetchQueries` or merge payload into state as today; keep a short refetch fallback (e.g. on window focus or every 30s) for resilience.
- **Documentation:** In this doc and in [DEPLOYMENT_AND_SECRETS_SUPABASE.md](../DEPLOYMENT_AND_SECRETS_SUPABASE.md): list tables in `supabase_realtime`, and that RLS + SELECT grants are required for Realtime to broadcast.

---

## 4. Database layout: columnar vs JSONB (gold standard)

Align with [DATABASE_SCALABILITY_AUDIT.md](../DATABASE_SCALABILITY_AUDIT.md). After migration, target layout:

| Area | Target shape | Rationale |
|------|--------------|------------|
| **Codex** | Columnar (already) | Query/filter by column; CSV-friendly. |
| **Core rules** | id + data (JSONB) | Category-specific; keep as blob. |
| **Official library** | Columnar: scalar columns + one `payload` JSONB (same as user library) | Same shape as user_* for “add to my library” copy; filter by name/type. |
| **User library** | Columnar (already) | Same as official + user_id. |
| **User species** | id + data or columnar | Audit allows either; columnar aligns with codex_species if desired. |
| **Characters** | id, user_id, data (JSONB) | Large variable document; load by id. No change. |
| **Campaigns** | Scalar columns + characters (JSONB) or normalized campaign_characters; memberIds → campaign_members | Use campaign_members for membership; keep or normalize campaign character list per audit. |
| **Campaign rolls** | data (JSONB) | Roll metadata; no query by column needed. |
| **Encounters** | id, user_id, data (JSONB); optional name, type, status columns | Keep blob; optional columns for list/filter. |

Implement official rename + columnar (audit Phase 1) either before or as part of Path C Phase 5 (public/official library). User library and campaign_members are already done per audit.

---

## 5. Phased migration

### Phase 0: Schema consolidation and Realtime prep

**Goal:** All app tables and enums in `public`; Realtime publication and RLS reference `public` only.

**Steps:**

1. Create a single SQL migration (e.g. in a new `supabase/migrations/` or `sql/migrations/` folder, or one-off in Supabase SQL Editor):
   - Move every table from `users`, `campaigns`, `codex`, `encounters` into `public`: `ALTER TABLE users.user_profiles SET SCHEMA public;` (repeat for all tables). Move enums similarly if any (e.g. `UserRole`).
   - Drop empty schemas: `DROP SCHEMA IF EXISTS users;` (and campaigns, codex, encounters) after moving all objects.
2. Update RLS policies: all policies currently reference `users.*`, `campaigns.*`, etc. Recreate or alter policies so they apply to `public.user_profiles`, `public.characters`, `public.campaign_rolls`, etc. (Policy names can stay; table names become public.)
3. Realtime: remove tables from publication (they will be re-added under public). Then:
   - `ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_rolls;`
   - `ALTER PUBLICATION supabase_realtime ADD TABLE public.characters;`
   - Grant SELECT to authenticated on these tables if not already.
   - Remove any `GRANT USAGE ON SCHEMA users/campaigns` that was only for Realtime.
4. Update Prisma schema (temporarily) so it still works: set all models to `@@schema("public")` and point datasource to one schema, or run this phase only after you are ready to stop using Prisma for reads (see below).

**Alternative:** If you prefer to consolidate “as you go,” do Phase 0 after Phase 1 (codex): migrate codex to Supabase + RPC in `public`, then run consolidation migration to move remaining tables to public, then continue with Phase 2–5. Realtime subscription code must then switch from `schema: 'users'`/`schema: 'campaigns'` to `schema: 'public'` in the same PR that does consolidation.

**Deliverables:** All tables in `public`; RLS and Realtime publication use `public`; no custom app schemas left.

---

### Phase 1: Codex read + admin

**Goal:** Codex API and admin codex CRUD use Supabase only; no Prisma for codex.

**Steps:**

1. Ensure codex tables are in `public` (Phase 0 done) or still in `codex` (if Phase 0 is later). If still in codex, use RPC for all codex access; if in public, use `supabase.from('codex_feats')`, etc.
2. Implement RPCs (if needed) or direct `.from()`:
   - Read: e.g. `get_codex_feats()` returning rows, or simple `supabase.from('codex_feats').select('*')` and map to current API shape in route.
   - Admin: `upsert_codex_doc(collection, id, payload)`, `delete_codex_doc(collection, id)` or direct `.from().upsert/.delete` with server-side admin check.
3. Replace [src/app/api/codex/route.ts](../../app/api/codex/route.ts) and [src/lib/codex-server.ts](../../lib/codex-server.ts) to use Supabase; keep response shape identical so hooks and UI unchanged.
4. Replace [src/app/(main)/admin/codex/actions.ts](../../app/(main)/admin/codex/actions.ts) with Supabase client calls or RPC.
5. Remove Prisma from these code paths; do not remove Prisma package yet.

**Deliverables:** Codex GET and admin CRUD work via Supabase; Prisma no longer used for codex.

---

### Phase 2: Characters

**Goal:** Character API, character-server, and character actions use Supabase; Realtime for characters remains (now on `public.characters` if Phase 0 done).

**Steps:**

1. Replace [src/app/api/characters/](../../app/api/characters/) and [src/app/(main)/characters/actions.ts](../../app/(main)/characters/actions.ts) with Supabase: `supabase.from('characters')` (or RPC for complex flows). Use [getSession](../../lib/supabase/session.ts) for auth; enforce user_id in RLS.
2. Replace [src/lib/character-server.ts](../../lib/character-server.ts) with Supabase server client.
3. If Phase 0 is done: update [characters/[id]/page.tsx](../../app/(main)/characters/[id]/page.tsx) and [CombatEncounterView.tsx](../../app/(main)/encounters/[id]/_components/CombatEncounterView.tsx) Realtime subscriptions to `schema: 'public'`, `table: 'characters'`. If Phase 0 is later, do this in Phase 0.
4. Ensure PATCH character (for HP/EN/AP from encounter) goes through Supabase so Realtime fires.

**Deliverables:** Character CRUD and realtime HP/EN/AP sync work via Supabase; Prisma not used for characters.

---

### Phase 3: User library

**Goal:** Library actions, user library API, and owner-library-for-view use Supabase.

**Steps:**

1. Replace [src/app/(main)/library/actions.ts](../../app/(main)/library/actions.ts) with `supabase.from('user_powers')`, etc. (all in `public` after Phase 0).
2. Replace [src/app/api/user/library/[type]/route.ts](../../app/api/user/library/[type]/route.ts) with Supabase.
3. Replace [src/lib/owner-library-for-view.ts](../../lib/owner-library-for-view.ts) with Supabase.
4. Types: use `src/types/database.ts` or existing types; remove Prisma type imports from these files.

**Deliverables:** User library and “library for view” work via Supabase; Prisma not used for library.

---

### Phase 4: Campaigns and encounters

**Goal:** Campaign and encounter APIs and actions use Supabase; campaign roll log and roll write use Supabase; Realtime for campaign_rolls remains (on `public.campaign_rolls`).

**Steps:**

1. Replace [src/app/api/campaigns/route.ts](../../app/api/campaigns/route.ts): use RPC `get_campaigns_for_user(p_user_id)` that implements current JSONB member filter, or use `campaign_members` table if migrated.
2. Replace [src/app/api/campaigns/[id]/route.ts](../../app/api/campaigns/[id]/route.ts), invites, characters sub-routes, and [src/app/(main)/campaigns/actions.ts](../../app/(main)/campaigns/actions.ts) with Supabase.
3. Replace [src/app/api/campaigns/[id]/rolls/route.ts](../../app/api/campaigns/[id]/rolls/route.ts) with Supabase (insert/select/delete on `campaign_rolls`).
4. Replace [src/app/api/encounters/](../../app/api/encounters/) with Supabase (`encounters` table).
5. Update [use-campaign-rolls.ts](../../hooks/use-campaign-rolls.ts) to `schema: 'public'`, `table: 'campaign_rolls'` if Phase 0 done.
6. [campaign-roll-service.ts](../../services/campaign-roll-service.ts) stays client-side; it calls API routes; no change except API routes now use Supabase.

**Deliverables:** Campaigns, rolls, and encounters fully on Supabase; roll log realtime working with `public`.

---

### Phase 5: Public/official library, profile, admin, auth cleanup

**Goal:** Public library API, profile upload, admin users, and delete-account use Supabase; optionally rename public → official and columnar official_* (audit Phase 1).

**Steps:**

1. Replace [src/app/api/public/[type]/route.ts](../../app/api/public/[type]/route.ts) with Supabase. If renaming to official: new route `/api/official/[type]`, tables `official_powers`, etc., and update admin UI + hooks.
2. Replace [src/app/api/upload/profile-picture/route.ts](../../app/api/upload/profile-picture/route.ts) and [src/app/api/admin/users/](../../app/api/admin/users/) with Supabase.
3. Replace delete-account in [src/app/(auth)/actions.ts](../../app/(auth)/actions.ts) with a single RPC: `delete_user_data(p_user_id)` that deletes in correct order (characters, user_powers, user_techniques, user_items, user_creatures, user_species, usernames, encounters, campaigns, user_profiles) then call Supabase Auth admin delete user.
4. Replace [src/app/(auth)/forgot-username/action.ts](../../app/(auth)/forgot-username/action.ts) with Supabase if it touches Prisma.
5. Remove all remaining Prisma imports; delete [src/lib/prisma.ts](../../lib/prisma.ts).

**Deliverables:** No Prisma left in codebase; all table access via Supabase.

---

### Phase 6: Prisma removal and CI/docs

**Goal:** Package and CI clean; docs and agent instructions updated.

**Steps:**

1. Remove from package.json: `prisma`, `@prisma/client`. Remove scripts: `prisma generate` from postinstall and build; replace `db:migrate` with e.g. `supabase db push` or `node scripts/run-migrations.js` that runs your SQL files.
2. Delete `prisma/` folder or keep only hand-written SQL migrations (e.g. move to `supabase/migrations/` or `sql/migrations/`).
3. Update [ARCHITECTURE.md](../ARCHITECTURE.md), [DEPLOYMENT_AND_SECRETS_SUPABASE.md](../DEPLOYMENT_AND_SECRETS_SUPABASE.md), [AGENT_GUIDE.md](AGENT_GUIDE.md), and [AGENTS.md](../../../AGENTS.md): data flow is Supabase only; migrations are SQL; Realtime section lists tables in publication and best practices.
4. Add a short “Path C” or “Data access” section in AGENTS.md: use Supabase server client and `.from()` / `.rpc()`; types in `src/types/database.ts`; no Prisma.
5. Run full regression (build, critical flows: codex, characters, library, campaigns, encounters, roll log, HP/EN realtime, admin, delete account).

**Deliverables:** Clean build; no Prisma; docs and agents aligned with Path C.

---

### Phase 6b: Update all AI/agent rules and documentation (Path C alignment)

**Goal:** Every doc and rule that mentions the stack or database correctly guides AI on: Supabase-only data access, raw SQL migrations, no Prisma, single `public` schema, Realtime best practices.

**Files to update (checklist):**

| Location | What to change |
|----------|----------------|
| **AGENTS.md** (repo root) | Stack: remove Prisma; add "Data access: Supabase server client only (`.from()`, `.rpc()`); types in `src/types/database.ts`; migrations = SQL only." |
| **.cursor/rules/realms-project.mdc** | Stack line: "Supabase (PostgreSQL, Auth, Storage)" only; remove Prisma; add one line: "Database: Supabase client + raw SQL; all tables in `public`; no Prisma." |
| **.cursor/rules/realms-tasks.mdc** | If it references Prisma or migrations, switch to "Supabase migrations / SQL files". |
| **src/docs/ai/AGENT_GUIDE.md** | Key Files: remove Prisma row; add "Database types" → `src/types/database.ts`; "Codex API" → "fetches from Supabase". Hooks table: "from Supabase" not "from Prisma". |
| **src/docs/ai/AI_TASK_QUEUE.md** | Header: "Stack: Supabase only (no Prisma)" and note that task text may still mention Prisma for historical context. |
| **src/docs/ARCHITECTURE.md** | Full pass: data flow = Supabase only; remove all Prisma references; document `createClient` (server), `.from()`, `.rpc()`, Realtime tables in `public`. |
| **src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md** | Remove Prisma from stack; DIRECT_URL only for migrations/SQL; deployment steps: run SQL files, not `prisma migrate`; Realtime checklist (tables in publication, RLS). |
| **src/docs/DATABASE_CODEX_AUDIT.md** | Replace "Prisma schema" with "Supabase/public schema"; "Update Prisma + API" → "Update API and types (database.ts)". |
| **src/docs/DATABASE_SCALABILITY_AUDIT.md** | Replace Prisma references with "public schema" / "Supabase"; Phase notes: "tables in public". |
| **src/docs/CODEX_SCHEMA_REFERENCE.md** | Related: "table structure" → `src/types/database.ts` or Supabase; remove prisma/schema.prisma. |
| **src/docs/ADMIN_SETUP.md** | Migrations: "Run SQL files in Supabase SQL Editor" (or `supabase db push`); remove `npx prisma migrate` / `prisma db seed`. |
| **src/docs/README.md** | Stack: Supabase only; no Prisma. |
| **src/docs/UNIFICATION_STATUS.md** | ARCHITECTURE ref: "Supabase (no Prisma)". |
| **src/docs/ALL_FEEDBACK_CLEAN.md** | Any "Prisma" in disposition/notes can stay for history; ensure new entries say "Supabase". |

**Verification:** Grep for `prisma` / `Prisma` in `src/docs/`, `AGENTS.md`, `.cursor/rules/`; only historical or "no Prisma" mentions should remain.

**Deliverables:** All listed files updated; AI/agents are guided by current stack (Supabase + raw SQL, no Prisma).

---

## 6. Realtime checklist (current + future)

- **Tables in publication:** `public.campaign_rolls`, `public.characters`. Future: `public.encounters` or `public.campaign_messages` / `realm_prompts` for Realm master → player messaging.
- **RLS:** Enabled on all published tables; SELECT allowed for roles that should receive changes (authenticated, with row-level restrictions).
- **Client:** One channel per subscription; unsubscribe on unmount; use `schema: 'public'` and `table: '...'`; keep refetch fallback (e.g. refetchOnWindowFocus or 30s interval) for missed events.
- **Docs:** In DEPLOYMENT_AND_SECRETS_SUPABASE.md, note that Realtime requires RLS + publication; list tables added to `supabase_realtime`; if you add new realtime tables, run `ALTER PUBLICATION supabase_realtime ADD TABLE public.new_table;` and grant SELECT.

---

## 7. File touch list (by phase)

| Phase | Files to touch |
|-------|----------------|
| **0** | New SQL migration; [sql/supabase-rls-policies.sql](../../../sql/supabase-rls-policies.sql) (or new RLS file for public); Realtime subscription params in [use-campaign-rolls.ts](../../hooks/use-campaign-rolls.ts), [characters/[id]/page.tsx](../../app/(main)/characters/[id]/page.tsx), [CombatEncounterView.tsx](../../app/(main)/encounters/[id]/_components/CombatEncounterView.tsx). |
| **1** | [api/codex/route.ts](../../app/api/codex/route.ts), [lib/codex-server.ts](../../lib/codex-server.ts), [admin/codex/actions.ts](../../app/(main)/admin/codex/actions.ts). |
| **2** | [api/characters/](../../app/api/characters/), [characters/actions.ts](../../app/(main)/characters/actions.ts), [character-server.ts](../../lib/character-server.ts); Realtime schema/table if not in Phase 0. |
| **3** | [library/actions.ts](../../app/(main)/library/actions.ts), [api/user/library/[type]/route.ts](../../app/api/user/library/[type]/route.ts), [owner-library-for-view.ts](../../lib/owner-library-for-view.ts). |
| **4** | [api/campaigns/](../../app/api/campaigns/), [campaigns/actions.ts](../../app/(main)/campaigns/actions.ts), [api/encounters/](../../app/api/encounters/), [use-campaign-rolls.ts](../../hooks/use-campaign-rolls.ts). |
| **5** | [api/public/[type]/route.ts](../../app/api/public/[type]/route.ts), [api/upload/profile-picture/route.ts](../../app/api/upload/profile-picture/route.ts), [api/admin/users/](../../app/api/admin/users/), [auth/actions.ts](../../app/(auth)/actions.ts), [forgot-username/action.ts](../../app/(auth)/forgot-username/action.ts), [lib/prisma.ts](../../lib/prisma.ts) (delete). |
| **6** | package.json, CI config, [ARCHITECTURE.md](../ARCHITECTURE.md), [DEPLOYMENT_AND_SECRETS_SUPABASE.md](../DEPLOYMENT_AND_SECRETS_SUPABASE.md), [AGENT_GUIDE.md](AGENT_GUIDE.md), [AGENTS.md](../../../AGENTS.md). |
| **6b** | All AI/agent docs: AGENTS.md, .cursor/rules/*.mdc, AGENT_GUIDE.md, AI_TASK_QUEUE.md, ARCHITECTURE.md, DEPLOYMENT_AND_SECRETS_SUPABASE.md, DATABASE_*.md, CODEX_SCHEMA_REFERENCE.md, ADMIN_SETUP.md, README.md, UNIFICATION_STATUS.md, ALL_FEEDBACK_CLEAN.md (see Phase 6b checklist). |

---

## 8. Supabase operator guide (step-by-step)

**Who this is for:** You (the project owner) running SQL in Supabase Dashboard → SQL Editor to align the database with Path C. Data can be deleted where necessary to fix structure (e.g. migrating from JSONB-only to columnar).

### 8.1 Current database state (what you may have today)

- **Schemas:** `users`, `campaigns`, `codex`, `encounters` (and `public`). Tables are split across these.
- **Codex:** May be `id` + `data` (JSONB) only, or already columnar (if you ran `sql/supabase-codex-tables-columnar.sql`).
- **User library:** May be `id`, `user_id`, `data` (JSONB) or already columnar (if you ran `sql/supabase-user-library-columnar.sql`).
- **Public library:** `codex.public_powers`, `public_techniques`, `public_items`, `public_creatures` with `id` + `data` (JSONB).

### 8.2 Order of operations (what to run and when)

| Step | Action | File to run (paste in Supabase SQL Editor) | Notes |
|------|--------|--------------------------------------------|--------|
| **0.1** | Backup | — | Supabase Dashboard → Database → Backups, or export critical tables. |
| **0.2** | Consolidate to `public` | `sql/path-c-phase0-consolidate-to-public.sql` | Moves all tables + enum to `public`; drops old schemas; updates RLS and Realtime. **Run once.** File is in repo at `sql/path-c-phase0-consolidate-to-public.sql`. |
| **Optional A** | Codex columnar (if still id+data) | `sql/supabase-codex-tables-columnar.sql` | **Only if** codex tables are still `id` + `data`. Drops and recreates codex_* in `codex` schema — use **updated version** that creates tables in `public` (see 8.3). |
| **Optional B** | Official library columnar + rename | After Phase 5 in app | Create `official_powers` etc. in `public`; migrate data from `public_powers`; drop `public_*`. Or run a dedicated SQL file when provided. |

**Important:** After step 0.2, **all** app tables live in `public`. The app still uses Prisma until Phases 1–5 are done in code; Prisma schema must be updated to `@@schema("public")` for all models so Prisma can still read/write until you remove it.

### 8.3 SQL files provided in this repo

| File | Purpose |
|------|--------|
| `sql/path-c-phase0-consolidate-to-public.sql` | **Path C Phase 0:** Move every table from `users`, `campaigns`, `codex`, `encounters` into `public`; move `UserRole` enum; recreate RLS for `public`; Realtime on `public.campaign_rolls` and `public.characters`; drop empty schemas. |
| `sql/supabase-rls-policies.sql` | Current RLS (pre–Phase 0) for multi-schema. After Phase 0, RLS is embedded in the consolidation script. |
| `sql/supabase-codex-tables-columnar.sql` | Codex tables with columns (not id+data). Creates in `codex` schema; for Path C you need a variant that creates in `public` or run after Phase 0 and then move codex tables to public (consolidation script does the move). |
| `sql/supabase-user-library-columnar.sql` | Adds columnar columns to user_* (run when tables are still in `users`; if already in `public`, adjust schema to `public`). |
| `sql/supabase-storage-policies.sql` | Storage RLS for `portraits` and `profile-pictures` buckets. Unchanged by Path C. |

### 8.4 What you need to do in Supabase (minimal path)

1. **Back up** the project (Supabase backups or export).
2. Open **Supabase Dashboard → SQL Editor**.
3. Paste and run **`sql/path-c-phase0-consolidate-to-public.sql`** in full (create the file from the plan; see section 10 / repo).
4. Confirm in **Table Editor** that all tables now appear under **public** (no `users`, `campaigns`, `codex`, `encounters` schemas).
5. If codex tables are still `id` + `data` and you want columnar: run an updated codex columnar script that targets `public` (or run the existing one and then run a small script to move those codex tables to `public` if Phase 0 already moved them).
6. Run **`sql/supabase-storage-policies.sql`** if you haven’t already (Storage RLS).

After that, the codebase can proceed with Phases 1–6 (replace Prisma with Supabase client, then update docs/agents).

---

## 9. Risks and rollback

- **Risk:** Consolidation migration (Phase 0) is large; one mistake can affect all tables. **Mitigation:** Run against a staging DB first; back up prod; consider doing consolidation in a maintenance window.
- **Risk:** Realtime stops working if publication or RLS is wrong after move to public. **Mitigation:** Test roll log and character HP/EN/AP sync immediately after Phase 0 (or after the phase that switches schema in subscriptions).
- **Rollback:** Keep Prisma in the repo and in package.json until Phase 6. Per-phase, you can revert to Prisma for that domain by re-adding Prisma calls and feature-flagging Supabase. After Phase 6, rollback is “revert commits” or re-add Prisma and re-run migrations.

---

## 10. Success criteria

- All app table access goes through Supabase server client (`.from()` or `.rpc()`); no Prisma.
- All tables live in `public`; no custom app schemas.
- Realtime: campaign roll log and character HP/EN/AP sync work with `schema: 'public'`; RLS and publication documented.
- Build passes; `prisma` and `@prisma/client` removed; CI runs Supabase migrations (or SQL files) instead of Prisma migrate.
- ARCHITECTURE.md, DEPLOYMENT_AND_SECRETS_SUPABASE.md, and agent docs describe Path C and Realtime.
- Optional: official library renamed and columnar; campaign_members used for membership where applicable (per audit).

---

## 11. References

- Prisma long-term assessment plan (sections 6.5 Option C, 6.6 Schema consolidation) — source for Path C and single public schema.
- [ARCHITECTURE.md](../ARCHITECTURE.md) — data flow and key files.
- [DATABASE_SCALABILITY_AUDIT.md](../DATABASE_SCALABILITY_AUDIT.md) — columnar vs JSONB and phased layout.
- [CODEX_SCHEMA_REFERENCE.md](../CODEX_SCHEMA_REFERENCE.md) — codex field definitions.
- [sql/supabase-rls-policies.sql](../../../sql/supabase-rls-policies.sql) — current RLS and Realtime publication (pre–Phase 0).
- [DEPLOYMENT_AND_SECRETS_SUPABASE.md](../DEPLOYMENT_AND_SECRETS_SUPABASE.md) — env and deployment; extend with Realtime checklist.
- [SUPABASE_PATH_C_OPERATOR_GUIDE.md](../SUPABASE_PATH_C_OPERATOR_GUIDE.md) — **step-by-step operator guide**: what to run in Supabase and in what order (pastable SQL file paths).
