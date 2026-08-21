# Audit 00 — Database, RLS, Storage & Infrastructure

Independent audit, 2026-08-13. Live Supabase project `lbqhiwudvifmkjtkccdg` (RealmsRPG-Test,
Postgres 17.6, us-east-1) + Vercel project `realms-rpg-test` (live on `realmsrpg.com`).
All findings verified by querying the live database catalog — not from docs or SQL files.

## Scorecard

| Area | Verdict |
|---|---|
| RLS coverage | **Strong** — 40/40 public tables have RLS enabled, all have ≥1 policy |
| RLS policy craft | **Strong** — `(SELECT auth.uid())` subselect pattern used throughout (avoids per-row re-eval); recursion solved with `private.*` SECURITY DEFINER helpers with pinned `search_path` |
| Privilege model | **BROKEN** — self-serve privilege escalation to `admin` (P0-1) |
| Column constraints | **Mixed** — unique indexes on usernames are correct, but the core entity is a schemaless JSONB blob and there are no CHECK constraints enforcing game-rule invariants |
| Storage | Adequate — 3 public image buckets with mime+size limits, per-user folder policies |
| Secrets hygiene | **Good** — no `.env` tracked in git, no secrets in client bundle |
| Backup/DR | **Unverified/manual** — scripts exist but are operator-triggered |
| Rate limiting | **Degraded** — fails open to per-instance memory; Upstash not configured (P1-4) |

---

## P0-1 — Any registered user can make themselves `admin`

**This is the single most serious finding in the audit. It is remotely exploitable from a browser
console with only the public anon key.**

Verified facts from the live catalog:

| # | Fact | Source |
|---|---|---|
| 1 | `authenticated` holds `INSERT` **and** `UPDATE` privilege on `user_profiles.role` | `information_schema.column_privileges` |
| 2 | INSERT policy `Users can insert own profile` = `WITH CHECK (id = auth.uid()::text)` — no constraint on `role` | `pg_policies` |
| 3 | The guard trigger is `BEFORE UPDATE **OF role**` — it does **not** fire on INSERT | `pg_get_triggerdef` |
| 4 | Enum `UserRole` contains `admin`; `user_profiles` has **no** CHECK constraint (only `user_profiles_pkey`) | `pg_constraint` |
| 5 | DELETE policy `Users can delete own profile` lets a user remove their own row, and every FK into `user_profiles` is `ON DELETE CASCADE`, so the delete succeeds | `pg_policies`, `pg_constraint` |
| 6 | No trigger on `auth.users` creates the profile; it is created lazily by `createUserProfileAction` using the **user's own** session | `pg_trigger`, `src/app/(auth)/actions.ts:97` |

The guard function only covers the UPDATE path:

```sql
-- public.prevent_unauthorized_role_change()
IF NEW.role IS DISTINCT FROM OLD.role
   AND COALESCE(auth.role(), '') <> 'service_role' THEN
  RAISE EXCEPTION 'Changing user role is not permitted' USING ERRCODE = '42501';
END IF;
```

### Exploit paths

**Path A — brand-new account (no profile row yet).** Register, then before the app inserts the
profile row, insert it yourself:

```js
await supabase.from('user_profiles').insert({ id: myUid, role: 'admin' });
```

There is currently **1 auth user with no `user_profiles` row** in production, so this state
occurs in practice.

**Path B — existing account.** `DELETE` your own profile row (cascades away your own content,
which an attacker on a throwaway account does not care about), then re-`INSERT` it with
`role: 'admin'`.

### Blast radius

`role = 'admin'` is the *only* gate for:

- Direct DB `INSERT`/`UPDATE`/`DELETE` on all six `official_*` tables (official game content) via RLS admin policies.
- `SELECT` on `admin_role_audit` and `codex_change_logs`; full write on `role_policies`.
- Every application admin check — `isAdmin()` (`src/lib/admin.ts:21`) and `requireAdminSession()`
  (`src/lib/admin.ts:42`) read `user_profiles.role` and nothing else. So escalation also unlocks
  the admin codex editors and user management, which run under the **service role** and therefore
  bypass RLS entirely.

Net: any registered user can gain total control of official game content and read all users'
emails via `GET /api/admin/users`.

### Fix (apply all four; 1–3 are one migration)

1. **Cover INSERT in the guard trigger** and force the default role on any non-service-role insert:

```sql
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := 'new_player';                    -- ignore client-supplied role
    ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Changing user role is not permitted' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_prevent_unauthorized_role_change ON public.user_profiles;
CREATE TRIGGER trg_prevent_unauthorized_role_change
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_unauthorized_role_change();
```

2. **Defense in depth — revoke the column privilege** so the client can never name the column:

```sql
REVOKE INSERT (role), UPDATE (role) ON public.user_profiles FROM authenticated, anon;
```

3. **Remove the self-DELETE policy.** Account deletion already runs through
   `deleteAccountAction`, which holds the service role. A client-callable cascade delete of all
   of a user's content is a footgun independent of this bug.

4. **Structural fix (do this next quarter):** move `role` out of a user-writable table — either a
   `private.user_roles` table with zero grants to `authenticated`, or `auth.users.app_metadata`
   surfaced as a JWT claim. As long as authorization data lives in a row the user can write, this
   class of bug will keep coming back.

### Verification after fix

Run as a normal (non-admin) user, expect both to fail:
`insert into user_profiles(id, role) values (auth.uid()::text,'admin')` and
`update user_profiles set role='admin' where id = auth.uid()::text`.
Add an API-level regression test alongside `src/app/api/admin/users/route.test.ts`.

---

## P0-2 (cross-reference) — a service-role query deliberately bypasses RLS and over-returns

Detailed in `01-api-auth-security.md`; recorded here because it is an RLS-bypass issue and it
compounds P1-2 below. `getOwnerLibraryForView` (`src/lib/owner-library-for-view.ts:29-35`) uses
`createServiceRoleClient()` to run `select('*')` against `user_powers`, `user_techniques`,
`user_items`, and `user_creatures`, filtered only by `user_id`. It is invoked from
`src/app/api/characters/[id]/route.ts:66` for any character whose blob says
`visibility: 'public'` — on a code path that requires **no authentication at all**.

The helper's own header comment states that callers must verify authorization first and treats
"the character is public" as sufficient. The flaw is scope, not the auth check: publishing one
character hands an anonymous caller the owner's **entire** private homebrew library, including
powers, techniques, items, and creatures that character never references and the owner never
published.

Live blast radius is currently one character (see the visibility table below), so treat this as
urgent-but-not-yet-exploited. Fix: pass the set of entity IDs the character actually references and
constrain with `.in('id', ids)`, and select explicit columns rather than `*`.

## P1-2 — `characters.visibility` has two sources of truth, and RLS trusts the stale one

`characters` has a real `visibility` column **and** a `data->>'visibility'` copy inside the JSONB
blob. Access control reads the **JSONB**; list/filter UI reads the **column**. Nothing keeps them
in sync — no trigger, no generated column, no CHECK.

Both RLS policies key off the blob:

- `characters_select_public_anon` (role `anon`): `USING (COALESCE(data->>'visibility','') = 'public')`
- `characters_select_authenticated`: same expression plus the campaign-participant branch
- `GET /api/characters/[id]` agrees with RLS — `src/app/api/characters/[id]/route.ts:64` reads `data.visibility`

Live data already shows the two diverging:

| `visibility` column | `data->>'visibility'` | rows |
|---|---|---|
| campaign | campaign | 37 |
| private | **NULL** | 14 |
| private | private | 1 |
| public | public | 1 |

The 14 divergent rows are currently safe only because the policy's `COALESCE(...,'')` makes a
missing key non-public. The dangerous direction is not yet present but is one code path away: if
any save updates the column to `private` without rewriting the blob, the row stays **world-readable
by `anon` forever** while the owner's UI displays "Private". That is a silent privacy breach on a
TTRPG product where characters contain personal creative writing.

**Fix:** make the column authoritative — `ALTER TABLE characters ALTER COLUMN visibility SET NOT NULL,
SET DEFAULT 'private'`, add `CHECK (visibility IN ('private','campaign','public'))`, backfill from the
blob, rewrite both policies and `route.ts:64` to read the column, then stop writing `visibility`
into `data`. Add an index on `visibility` for the public-browse query.

---

## P1-3 — Username uniqueness is enforced by the DB but invisible to the app, so renames fail silently and destroy the old mapping

Correction to an earlier draft of this report: `user_profiles.username` **is** uniquely indexed —
`user_profiles_username_key`, a standalone `CREATE UNIQUE INDEX` (which is why it does not appear
in `pg_constraint`; only `pg_indexes` shows it). Duplicate usernames are therefore not possible.
The actual defect is the opposite shape, and worse.

Every application-level uniqueness check queries `user_profiles`, whose only SELECT policy is
`Users can read own profile` = `USING (id = auth.uid()::text)`. Under RLS a caller can see exactly
one row: their own. So these checks can never observe another user's username:

- `generateDefaultUsername` — `src/app/(auth)/actions.ts:36` — always accepts the first random `Player######`.
- `checkUsernameAvailableAction` — `:188` — always returns `available: true`.
- `changeUsernameAction`'s taken-check — `:227-233` — `.neq('id', user.uid)` can never match a visible row, so `taken` is always null.

The failure sequence for a rename to an already-taken name:

1. `:236` **deletes** the user's existing `usernames` row.
2. `:238` upserts the new `usernames` row — blocked by that table's own owner-only UPDATE policy when the name belongs to someone else.
3. `:239-246` updates `user_profiles.username` — rejected by `user_profiles_username_key` with SQLSTATE `23505`.
4. The result of every one of those statements is discarded, and `:249` returns `{ success: true }`.

The user is told the rename succeeded. In reality their old `usernames` mapping is gone, their
profile still holds the old name, and the two tables now disagree. The same unchecked-write pattern
at `:97` (profile INSERT) plausibly explains the one auth user with no profile row noted in P2-10,
and the 6 profiles with `username IS NULL`.

**Fix:** stop pre-checking and start reading write results. Attempt the write, catch `23505`, and
return "that username is taken" from the error. Perform the `usernames` delete + insert + profile
update in a single service-role RPC so the steps cannot partially apply. Longer term, drop the
duplicated `username` column and treat the `usernames` table — already correctly keyed and
world-unreadable — as the single source of truth, or add a narrow SELECT policy that exposes only
`username` for existence checks.

---

## P1-4 — Rate limiting silently fails open in production

`src/lib/rate-limit.ts` uses Upstash/Vercel KV when configured and otherwise falls back to a
**per-instance in-memory** sliding window (`:140-176`), including on any Redis error (`:169-172`).
Neither `UPSTASH_REDIS_REST_URL`/`_TOKEN` nor `KV_REST_API_URL`/`_TOKEN` appears in `.env.local`
or `.env.example`, so the durable backend is almost certainly not enabled.

On Vercel, in-memory buckets are per-lambda-instance and die on cold start, so the effective
limit is roughly "limit × number of live instances", unbounded under load. The limits this
weakens are the ones that matter most:

- `inviteCodeLimiter` 5/min — campaign invite-code brute force (`campaigns/invite/[code]`)
- `strictLimiter` 10/min — the username-existence oracle (`actions.ts:182`)
- `authActionLimiter` 5/min — auth-adjacent actions
- `uploadLimiter` 12/min — storage abuse / bill amplification

Compounding it, two handlers bypass the provided helper and key the limiter on the raw,
client-spoofable header instead of `resolveClientIp()`:
`src/app/api/characters/[id]/route.ts:113` and `:171` use
`request.headers.get('x-forwarded-for') ?? 'unknown'`, so an attacker rotates one header value to
get unlimited attempts.

**Fix:** provision Upstash (free tier is sufficient at this scale), add the two vars to Vercel and
to `.env.example`, and make the limiter **fail closed** for auth/invite/upload paths when the
durable backend was expected but errored. Replace the raw header reads with `resolveClientIp()` and
`buildRateLimitKey()`, which already exist and are used correctly in `src/app/(auth)/actions.ts:181`.

---

## P1-5 — The core domain entity has no schema

`characters` is 11 columns: `id`, `user_id`, `data` (JSONB, NOT NULL), timestamps, plus six
denormalized list columns (`name`, `level`, `archetype_name`, `ancestry_name`, `status`,
`visibility`). Every stat, choice, and rule outcome lives in `data`.

`PATCH /api/characters/[id]` blind-merges client JSON into it:

```ts
const mergedData = { ...currentData, ...cleanedData };   // route.ts:147
```

and `characterUpdateSchema` is built with `.catchall(z.unknown())`
(`src/lib/api-validation.ts:98`), with `.passthrough()` on seven more schemas
(`:174, :181, :230, :276, :292, :304, :309`). So arbitrary keys reach the blob and there is **no
server-side validation that a character is legal** under the game rules — no cap enforcement, no
point-budget check, nothing. The client is fully trusted for all game math.

For single-player use this is merely a cheating vector. It becomes a real product problem in
campaigns, where a GM and other players read the sheet, and it blocks any future
tournament/organized-play or "verified build" feature. It also means malformed blobs (from a
half-finished migration or an old creator version) are indistinguishable from valid ones at the
DB layer.

**Fix (incremental, no big-bang migration):**
1. Version the blob (`data.schemaVersion`) and reject unknown versions on write.
2. Replace `catchall`/`passthrough` on the character schemas with an explicit closed schema; log
   rejected keys for a week first so you learn what the client actually sends.
3. Re-run the authoritative calculators (`src/lib/game/**`) server-side on save and reject or
   flag characters whose derived totals disagree with the client's.
4. Promote the fields you filter/sort on into real columns with constraints (`level` already is —
   add `CHECK (level BETWEEN 1 AND <max>)`).

---

## ~~P0-3~~ → RETRACTED, see `13-codex-data-loss-determination.md`

> **This finding is withdrawn.** Follow-up forensics using the `codex_change_logs.changed_fields`
> column — which records what the application believed it was changing — proved the 22 parts were
> **deliberately edited**, not silently corrupted. Two of the cleared options literally read
> "If you're seeing this option, it needs to be deleted", four held `#ERROR!` spreadsheet artifacts,
> and the dominant pattern is an intentional duration-system refactor that made "per additional
> round/minute" options redundant. The single feat case was a delete followed by id reuse, not a
> nulled column.
>
> **The recovery SQL at the end of this section must NOT be run** — it would undo months of
> deliberate game-balance work.
>
> Two real defects survive from this investigation and are tracked instead:
> 1. **P1 — `mart_prof_req` cannot round-trip** through the admin feat editor. The `/api/codex`
>    projection at `src/app/api/codex/route.ts:118-145` omits the column while the write path
>    includes it, so the form always reads blank and writes `null`. 30 feats hold a value today;
>    editing any of them clears it. Real, live, not yet triggered.
> 2. **P1 — codex ids are recycled after delete.** Feat id 248 was `Flawless Fighter`, was deleted,
>    and 26 minutes later became `Elemental Adaptation`. Characters that took the old feat now
>    silently resolve to a different one.
>
> The drift-detection query at the end of this section is still worth adding — but it must compare
> against `changed_fields` to distinguish intent from collateral loss, or it will page on every
> legitimate content edit.

The original analysis is preserved below for traceability.

### Mechanism

`08-admin-surface.md` F-01 identifies the cause: the codex write allowlist includes columns that the
read projection in `src/app/api/codex/route.ts:118-145` omits. The edit form therefore reads
`undefined` for those columns, renders the input blank, and writes `null` back on save. It fires on
completely normal admin usage and produces no error.

### Scope — full drift scan of all codex changelogs

Fields that went from a real value to `null` on an `update`:

| Table | Field | Occurrences | Distinct entities | Last seen |
|---|---|---:|---:|---|
| `codex_parts` | `op_1_desc` / `op_1_en` / `op_1_tp` | 13 each | 13 | 2026-07-17 |
| `codex_parts` | `op_2_desc` / `op_2_en` / `op_2_tp` | 8 each | 8 | 2026-05-22 |
| `codex_parts` | `op_3_desc` / `op_3_en` / `op_3_tp` | 7 each | 7 | 2026-05-27 |
| `codex_feats` | `mart_prof_req` | 1 | 1 | 2026-04-20 |

**22 distinct parts affected. 21 are still `NULL` today.** Only `Damage Reduction` (id 210) was
later repopulated, and with different numbers than were lost (4/2 → 1/1), so even that one needs a
design decision rather than a blind restore.

### What was lost (still NULL in production)

| id | Part | Field | Lost value | Lost on |
|---|---|---|---:|---|
| 363 | Freeze Time | `op_1_en` / `op_1_tp` | 11 / 2 | 2026-05-12 |
| 365 | Terraform | `op_3_en` / `op_3_tp` | 11 / 2 | 2026-05-27 |
| 322 | Manipulate Earth | `op_1_en`,`op_2_en` / `op_1_tp`,`op_2_tp` | 7,7 / 1,1 | 2026-05-21 |
| 362 | Gravity Center | `op_1_en` / `op_1_tp` | 6 / 2 | 2026-05-12 |
| 194 | Communicate | `op_1_en`,`op_2_en` / `op_1_tp`,`op_2_tp` | 2,6 / 1,1 | 2026-05-01 |
| 129 | Ability Decrease | `op_2_en` / `op_2_tp` | 6 / 1 | 2026-05-08 |
| 174 | Read Mind | `op_3_en` / `op_3_tp` | 4 / 1 | 2026-05-22 |
| 125 | Grant Feat | `op_3_en` / `op_3_tp` | 3 / 1 | 2026-05-12 |
| 367 | Empower Plant | `op_1_en` / `op_1_tp` | 3 / 2 | 2026-05-11 |
| 154 | Relocate Power | `op_3_en` / `op_3_tp` | 3 / 0 | 2026-05-22 |
| 344 | Suspend | `op_1_en` / `op_1_tp` | 2.5 / 2 | 2026-05-26 |
| 366 | Growth | `op_1_en`,`op_2_en` / `op_1_tp`,`op_2_tp` | 2.5,2.5 / 1,2 | 2026-05-12 |
| 166 | Massive Outer Illusion | `op_3_en` / `op_3_tp` | 2 / 2 | 2026-05-21 |
| 126 | Ability Increase | `op_2_en` / `op_2_tp` | 1 / 1 | 2026-05-01 |
| 128 | Skill Sharpen | `op_2_en` / `op_2_tp` | 1 / 1 | 2026-05-22 |
| 202 | Immune to Take-Over | `op_1_en` / `op_1_tp` | 1 / 1 | 2026-05-13 |
| 214 | Absorb | `op_1_en` / `op_1_tp` | 1 / 1 | 2026-05-01 |
| 278 | Ping | `op_1_en` / `op_1_tp` | 1 / 0 | 2026-05-22 |
| 324 | Controlling Summon | `op_1_en` / `op_1_tp` | 1 / 1 | 2026-05-05 |
| 369 | Add Weapon to Power | `op_1_en` / `op_1_tp` | 0.5 / 0 | 2026-07-17 |
| 7 | Add Weapon to Technique | `op_1_en` / `op_1_tp` | 0.25 / 0 | 2026-07-17 |
| 371 | Randomize | `op_3_en` / `op_3_tp` | -0.5 / 0 | 2026-05-22 |
| 80 | Personal Power Attack | `op_2_en`,`op_3_en` | -0.5, 0.5 | 2026-05-22 |
| 248 | *(feat)* Flawless Fighter | `mart_prof_req` | 2 | 2026-04-20 |

The matching `op_N_desc` text was nulled alongside every one of these.

### Why this matters more than the row count suggests

These are the Energy and Training Point prices of power/technique part **options** — direct inputs to
`power-calc.ts` / `technique-calc.ts`. With the value `NULL`, the cost engine's `?? 0` defaults
(flagged as N5/N8 in `05-rules-engine.md`) price those options at **zero**. Freeze Time's option 1
went from 11 Energy to free. Any power or technique a player built with these options since May is
undercosted, and the character sheet will keep showing the undercosted total because the sheet
recomputes from the same codex rows.

Flawless Fighter has had **no** martial-proficiency requirement for ~4 months, so
`checkFeatRequirements` has been letting any character take it.

### Confidence, stated honestly

I cannot prove from the database alone that every null was unintended rather than a deliberate
rebalance — the owner knows the design intent. But four things point strongly at the bug:
the `desc` + `en` + `tp` triplet is always nulled together (a rebalance would not delete the
descriptive text); it spans 22 unrelated parts across three months; the admin audit independently
identified the exact code mechanism without seeing this data; and `Damage Reduction` was manually
re-entered afterwards, which is what a human does after noticing a value went missing.

### Recovery — generate, review, then apply

Do **not** restore before the read-projection fix ships, or the next edit to any of these parts will
null them again. Rather than hand-copying 60 values, generate the statements from the changelog and
review the output:

```sql
-- Emits one UPDATE per still-missing field, sourced from the newest loss snapshot.
with losses as (
  select l.entity_id, b.key,
         b.value #>> '{}' as lost_value,
         row_number() over (partition by l.entity_id, b.key order by l.changed_at desc) as rn
  from public.codex_change_logs l
  cross join lateral jsonb_each(l.before_data) b
  where l.entity_type = 'codex_parts'
    and l.operation = 'update'
    and (l.after_data ? b.key)
    and jsonb_typeof(l.after_data -> b.key) = 'null'
    and jsonb_typeof(b.value) <> 'null'
)
select format(
         'update public.codex_parts set %I = %L where id = %L;  -- %s',
         ls.key, ls.lost_value, ls.entity_id, p.name
       ) as stmt
from losses ls
join public.codex_parts p on p.id = ls.entity_id
where ls.rn = 1
  and (to_jsonb(p) ->> ls.key) is null      -- only what is still missing
order by ls.entity_id, ls.key;
```

Then the single feat:

```sql
update public.codex_feats set mart_prof_req = 2 where id = '248';  -- Flawless Fighter
```

Per the repo's codex-data policy these are **proposed, not applied**. Two follow-ups the owner should
own: decide the intended values for `Damage Reduction` (lost 4/2, currently 1/1), and audit
user-created powers/techniques built since May that used the affected options, since their stored
costs are wrong.

### The gate that would have caught this in April

The drift scan above is ~20 lines of SQL against data you already keep. Run it in CI or a weekly
cron and alert on any non-null → null transition. Given that both GitHub workflows contain **zero**
security or data-integrity gates (five of nine steps in `ai-task-verifier.yml` are documentation
bookkeeping), this is the single highest-value gate available, and it is nearly free.

## P2 findings

**P2-6 — Two competing models for campaign membership.** `campaign_members` is a relational
join table (2 columns), while `campaigns.characters` is a JSONB array of rosters. Both are live:
`deleteAccountAction` (`src/app/(auth)/actions.ts:264-271`) reads memberships from
`campaign_members` and then loops campaigns to splice the JSONB array — an N+1 read-modify-write
with a lost-update race if two players leave at once. The `characters_select_authenticated` RLS
policy also has to `CROSS JOIN LATERAL jsonb_array_elements(campaigns.characters)` per candidate
row, and tolerates **two key spellings** (`characterId`/`character_id`, `userId`/`user_id`),
evidence of an unfinished migration. `src/app/api/characters/[id]/route.ts:89-92` handles all four
spellings too. Fix: finish the migration to a `campaign_characters(campaign_id, user_id, character_id)`
table, then simplify the policy to a plain EXISTS — this also removes the per-row lateral join.

**P2-7 — That lateral-join policy will not scale.** Every authenticated `characters` SELECT
evaluates a lateral unnest of every accessible campaign's roster per candidate row. Fine at 53
characters / 7 campaigns; it degrades superlinearly. The `campaign_characters` table above fixes it.

**P2-8 — Two different authorization models for reference content.** The six `official_*` tables
have real RLS admin write policies. The thirteen `codex_*` tables plus `core_rules`,
`realms_images`, and `realms_image_categories` have **only** a public `SELECT ... USING (true)`
policy and no write policies at all — so every codex write must go through the service role, with
zero database-level defense in depth. Pick one model. Given the admin UI already runs server-side,
the cleaner choice is: keep service-role writes, and add explicit `admin` write policies anyway so
a leaked anon key can never be escalated into content destruction.

**P2-9 — `role_policies` is world-readable to any logged-in user:**
`role_policies_select_authenticated` is `USING (true)`. That publishes your entire authorization
matrix (11 columns × 4 rows) to any account. If the UI needs it to render, expose only the
caller's own row: `USING (role = (SELECT role FROM user_profiles WHERE id = auth.uid()::text))`.

**P2-10 — Referential integrity gaps between `auth.users` and `user_profiles`.** 32 auth users,
32 profiles, but they are not the same 32: one profile (`f4f4961c…`, username `player958773`) has
no auth user, and one auth user (`bobbyday@gmail.com`) has no profile. `user_profiles.id` is
`text` with **no FK to `auth.users(id)`**, so nothing prevents drift. The orphan profile is
consistent with `deleteAccountAction` (`actions.ts:256-293`) partially failing: it performs 15
sequential deletes and then `auth.admin.deleteUser`, with no transaction and no error checking, so
any mid-flight failure leaves exactly this state. Fix: add the FK (`REFERENCES auth.users(id) ON
DELETE CASCADE`) after cleaning the orphan, and replace the 15-step delete with a single
service-role RPC in one transaction — most of those deletes are already redundant because every FK
into `user_profiles` is `ON DELETE CASCADE`.

**P2-11 — Realtime broadcasts the entire character blob.** Publication `supabase_realtime`
includes `characters`, `campaign_rolls`, `vtt_actions`, `vtt_scenes`, `vtt_tokens`. Because the
whole character is one JSONB column, every autosave republishes the full document to every
subscriber that can see the row. Fix: subscribe to the narrow list columns, or emit change events
on a thin table instead of the blob.

**P2-12 — Unindexed FK + 31 never-used indexes.** `vtt_actions.token_id` has no covering index.
Separately, 31 indexes have zero recorded scans — mostly `*_image_id` and
`official_enhanced_items.*`. At this data volume they cost little, but they are write amplification
and noise. Drop the unused ones after confirming against a longer stats window
(`pg_stat_reset` timing), and index `vtt_actions.token_id`.

**P2-13 — Dead or unbuilt VTT subsystem in the database.** `vtt_scenes`, `vtt_tokens`,
`vtt_actions` (43 columns combined), a private `vtt-maps` bucket, four `private.auth_is_vtt_*`
helper functions, realtime publication membership, and full RLS policy sets — all with zero rows.
If a virtual tabletop is on the roadmap, fine; if not, this is schema, policy, and storage surface
you are maintaining and securing for nothing. Decide explicitly.

**P2-14 — `vtt-maps` bucket has no size or mime restrictions** (`file_size_limit` NULL,
`allowed_mime_types` NULL), unlike the three image buckets which are correctly capped at 5 MB with
an image-only mime allowlist. It is private, so exposure is limited, but an authenticated user
could upload arbitrary large files. Set a limit before the VTT ships.

**P2-15 — Auth: leaked-password protection disabled.** Supabase's HaveIBeenPwned check is off
(the only item the security advisor flags). One toggle; turn it on. Also consider requiring email
confirmation and adding MFA for the 7 admin accounts.

**P2-16 — 7 of 32 users are `admin`** (plus 1 `developer`, 7 `playtester`, 17 `new_player`).
22% of the user base holds full content-destruction rights on a DB whose only backup story is
manual scripts. Reduce to the minimum, and split "can edit codex" from "can manage users".

---

## P3 findings

- **`.env` holds `DATABASE_URL`, `DIRECT_URL`, `CONNECTION_STRING`** — Prisma-era leftovers, and
  `AGENTS.md` explicitly states "No Prisma". `.env.local` still defines `ADMIN_UIDS`, which no
  code reads any more (TASK-284 migrated admin auth to the DB role; the only remaining references
  are in `src/docs/ai/archive/**`). Delete all four to avoid a future reader trusting them.
- **`.env.example` omits `UPSTASH_REDIS_REST_URL`/`_TOKEN`** despite `rate-limit.ts` depending on
  them, and omits `NEXT_PUBLIC_SITE_URL` which is referenced in code. A fresh clone silently gets
  degraded rate limiting.
- **`codex_change_logs` is at 708 rows** (1.6 MB), the largest table in the database, dominated by
  `codex_parts` (437) and `codex_feats` (252). The `prune_codex_change_logs_to_latest_ten` trigger
  prunes per entity, not globally — behaving as designed, but worth confirming the retention
  intent since this table now outweighs all game content combined.
- **Timestamps are `timestamp without time zone` throughout.** With a Vercel/UTC backend this
  works, but it is a latent correctness trap the day anything renders local time or you add a
  second region. `timestamptz` is the correct type.
- **`campaigns.owner_username` denormalizes a mutable value.** Renaming a user leaves stale
  attribution on their campaigns, since only `user_profiles.username` and `usernames` are updated
  in `changeUsernameAction`. Join instead, or update it in the rename path.

---

## Infrastructure — verified good

Worth recording so the next auditor does not re-litigate these:

- **No secrets in git.** Only `.env.example` is tracked; `.env`/`.env.local` are ignored. No build
  artifacts tracked (`.next/`, `test-results/`, `tsconfig.tsbuildinfo`, `node_modules/` all clean).
- **No secrets in the client bundle.** The only `NEXT_PUBLIC_*` vars are the Supabase URL, the
  publishable key, and the site URL. `SUPABASE_SERVICE_ROLE_KEY` appears only in server files,
  scripts, and docs — never in a client component.
- **Deployment protection is configured correctly**: SSO on all deployments except custom domains,
  so previews are private while `realmsrpg.com` is public.
- **Zero production runtime errors in the last 7 days**; latest production deployment READY.
- **RLS policies use the `(SELECT auth.uid())` subselect form throughout**, which is the documented
  Supabase performance pattern (evaluates once per query, not per row). Someone clearly did this
  deliberately.
- **The campaign RLS recursion problem was solved properly** with `private.auth_is_campaign_owner`
  / `auth_is_campaign_participant` SECURITY DEFINER helpers, all four with `search_path` pinned to
  `public`. No SECURITY DEFINER function in the database has an unpinned `search_path`.
- **Storage buckets for user images are correctly constrained** (5 MB, image mimes only) with
  per-user folder ownership policies for read/write/delete.
