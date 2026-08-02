# RealmsRPG Codebase Audit — 2026-08-01

**Scope:** Full codebase review ignoring project docs as source of truth. Verified against live code, git history, Supabase project `RealmsRPG-Test`, and automated checks (`build`, `lint`, `tsc`, `npm audit`, `vitest`).

**Repo scale:** ~1,448 tracked files · ~693 commits (Jan–Aug 2026) · Next.js 16.1.6 · React 19 · Supabase · Vercel

---

## Executive verdict: did you get $400k of value?

**Short answer:** You got a **large, functional, professionally styled** TTRPG web app with real domain complexity (character creators, sheet, campaigns, encounters, codex, crafting, admin). It **builds and deploys**, has **meaningful unit tests in core logic**, and **security was iterated on** (dedicated hardening migrations in June 2026).

**But:** Evidence strongly suggests **heavy AI-assisted development** (~38% of commits attributed to Cursor Agent/bot accounts) with **parallel feature builds instead of consolidation** (two full character-creator systems), **thin automated coverage outside `src/lib`**, and **no hard typecheck/lint/pre-commit gates**. Several **real correctness bugs** exist in game math (creature feat points, armor DR resolution). Security is **mostly solid at the app layer** but has **gaps** (profile email spoofing, rate-limit bypass on serverless, DB error leakage).

**Honest valuation framing:** This is **not** abandoned slop or a shell — it's a **substantial product codebase** with **expensive duplication debt** and **process theater** (extensive agent/task docs + validators that don't check product correctness). A senior team would likely charge less for the same feature surface if they unified architectures upfront; you may have paid for **two passes** at several features.

---

## 1. Authorship & process signals (from git, not docs)

| Signal | Finding |
|--------|---------|
| Commits | 693 total |
| Date range | 2026-01 → 2026-08 (heavy July spike: 326 commits) |
| Authors | **Cursor Agent** 199 · **cursor[bot]** 63 · **unknown** 220 · **MastersOTRealm** 168 · **Collin Morrison** 21 |
| Fix/revert commits | ~130 (~19% of history) |
| Security-themed commits | At least 5 explicit security/hardening commits |

**Interpretation:** Human + AI pair-programming is visible in history. Not inherently bad, but correlates with parallel implementations and inconsistent enforcement.

---

## 2. Build & dependency health

| Check | Result |
|-------|--------|
| `npm run build` (clean `.next`) | **PASS** — 42 static + many dynamic routes |
| `npm run lint` | **PASS** — 0 errors, ~28 warnings (unused vars, hook deps) |
| `npx tsc --noEmit` | **FAIL** — 37–39 errors in **7–8 test files only** (production `src/` typechecks clean) |
| `npm run test` (vitest) | **PASS** — 79 files, 435 tests |
| `npm audit` (prod) | **3 high** — stale Next.js 16.1.6 (SSRF, CSRF bypass, cache poisoning, DoS, etc.) |

### Action items
1. Add `"typecheck": "tsc --noEmit"` to `package.json` and run in CI.
2. Fix the 7–8 broken test files (mocks drifted from types).
3. Upgrade Next.js to **≥16.2.12** (or latest 16.x patch).

---

## 3. Testing & CI — partially real, partially theater

**Coverage by area:**

| Area | Files | Test files | Coverage |
|------|-------|------------|----------|
| `src/lib` | ~260 | 65 | **Good** (domain logic) |
| `src/components` | 338 | 6 | **~1.8%** |
| `src/app/api` | 29 routes | 1 | **~3%** |
| `src/hooks` | 36 | 0 | **0%** |
| `src/stores` | 4 | 0 | **0%** |
| `src/services` | 9 | 0 | **0%** |

**CI (`.github/workflows/`):**
- `ui-verify.yml`: lint + contrast + build + Playwright screenshots/a11y on **marketing/styleguide routes only**
- `ai-task-verifier.yml`: build + full vitest + **task/doc validators** (not product correctness)
- **Missing:** `tsc`, API route tests, creator flow E2E in default CI
- **No pre-commit hooks** (husky/lint-staged)

**Playwright:** 10 configs; richer creator audits exist but are **not in default CI** (manual/optional).

### Action items
1. Add typecheck to CI.
2. Add API route tests for auth/IDOR on critical paths (characters, campaigns, admin).
3. Wire at least one creator audit suite into CI (guided loadout or shell-creators).
4. Consider `--max-warnings 0` for lint in CI.

---

## 4. Security — application layer

### 4.1 What looks solid
- All 29 API routes reviewed: **no unauthenticated writes** to user/admin data found.
- Admin checks use server-side `isAdmin(uid)` from `user_profiles.role`, not client flags.
- User CRUD generally scopes `user_id` to session.
- Campaign nested routes (`invite/[code]`, `characters/[userId]/[characterId]`) verify membership before service-role use.
- `prevent_unauthorized_role_change` DB trigger blocks non–service-role role self-escalation.
- `.env` files gitignored; no hardcoded secrets in source.

### 4.2 High severity

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| H1 | **Profile email spoofing** — client can pass arbitrary `email` to `createUserProfileAction` | `src/app/(auth)/actions.ts` L57, L84–99 | Always set email from `sessionUser.email` only |
| H2 | **In-memory rate limits ineffective on Vercel** — per-instance `Map`, bypass by spreading across instances | `src/lib/rate-limit.ts` | Use Upstash Redis / `@upstash/ratelimit` for sensitive endpoints |
| H3 | **Invite join has no rate limit** — `joinCampaignAction` uses service-role lookup without throttle; GET preview is limited | `src/app/(main)/campaigns/actions.ts` L101–168 vs `api/campaigns/invite/[code]/route.ts` | Apply `inviteCodeLimiter` in join action |

### 4.3 Medium severity

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| M1 | **Codex `?debug=1` leaks DB errors in production** | `src/app/api/codex/route.ts` L447–478 | Gate debug to dev or admin only |
| M2 | **Raw Supabase/storage errors returned to clients** | Multiple API routes (images, official, crafting, encounters, uploads) | Log server-side; return generic messages |
| M3 | **Public image GET uses service role without auth** | `src/app/api/images/route.ts`, `[id]/route.ts` | Use anon/user client for public reads |
| M4 | **Admin mutations missing rate limits** | role-policies, changelogs, official POST/DELETE, images PATCH/DELETE | Apply `strictLimiter` consistently |
| M5 | **Weak validation on some admin bodies** | `update-role`, `role-policies`, images PATCH; `passthrough()` schemas | Zod with explicit allowlists |
| M6 | **Character 404 vs 403 oracle** | `src/app/api/characters/[id]/route.ts` | Return same 404 for non-visible |
| M7 | **Cross-user library fetch may fail for campaign viewers** | `src/lib/owner-library-for-view.ts` + campaign character route | Controlled server fetch after authz |

### 4.4 Low / notes
- Inconsistent error shapes (`{error}`, `{success}`, `{ok}`, raw 204).
- Rate-limit keys sometimes IP-only vs userId+IP.
- Duplicate admin-check implementations vs `@/lib/admin`.
- Near-duplicate CRUD boilerplate across crafting/encounters/library routes.

---

## 5. Security — database (Supabase live project)

### 5.1 RLS — generally good
- RLS enabled on all 44 public tables.
- Sensitive policies reviewed: `characters`, `campaigns`, `campaign_members`, `user_profiles`, `usernames`, `role_policies`, `admin_role_audit`, storage `objects`.
- `characters_select_authenticated` supports owner / public visibility / campaign participant (complex but intentional).
- `prevent_unauthorized_role_change` trigger on `user_profiles`.

### 5.2 Concerns

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| D1 | **`anon` role has full CRUD+TRUNCATE grants on nearly every table** including `admin_role_audit`, `role_policies` | Medium (RLS blocks today; violates least privilege) | Revoke unnecessary `anon` grants; rely on RLS + authenticated role |
| D2 | **4 backup tables in production** (`codex_archetypes_backup_*`, `codex_archetype_levels_backup_*`) — RLS on, no policies, no PK | Low | Drop or move to non-prod schema |
| D3 | **Leaked password protection disabled** (HaveIBeenPwned) | Medium | Enable in Supabase Auth settings |
| D4 | **`codex-art` bucket allows public listing** | Low | Tighten storage SELECT policy if listing not needed |
| D5 | **4 functions with mutable `search_path`** (`normalize_feat_tags`, `map_feat_tag_phase*`) | Low | Set `search_path` on function definitions |
| D6 | **Multiple permissive RLS policies on `campaigns` SELECT** | Perf | Consolidate policies (migration exists in history; advisor still flags) |
| D7 | **~20 unused indexes** | Low | Review after traffic; don't drop blindly |
| D8 | **Unindexed FKs** on `realms_images.created_by`, `vtt_actions.token_id` | Low | Add indexes if those joins are hot |

### 5.3 Positive
- 34 applied migrations including explicit security hardening (`security_hardening_2026_06`, `prevent_role_self_escalation`, `campaign_authz_hardening`, `storage_select_hardening`, etc.).
- Only one `SECURITY DEFINER` function in public (`rls_auto_enable`) with `search_path` set.

---

## 6. Business logic bugs (highest user impact)

### Critical

| # | Bug | Files | Impact |
|---|-----|-------|--------|
| B1 | **Creature feat points wrong fallback** — uses `1.5` when rules missing; constant is `4`; `featPointsPerLevel` admin config **never read** | `src/lib/game/formulas.ts` L160–171, `constants.ts` L35–36 | Wrong feat budgets for creatures |
| B2 | **Armor Damage Reduction resolved 3+ different ways** — sheet equip, library list, enrichment, guided catalog disagree | `equipment-equipped.ts`, `official-item-list.ts`, `enrich-items.ts`, `equipment-catalog-rows.ts` | Same item shows different DR in different UI |

### High

| # | Issue | Files |
|---|-------|-------|
| B3 | Duplicate `deriveAbilityRequirementFromProperties` | `find-in-library.ts`, `equipment-eligibility.ts` |
| B4 | `unproficientBonus` SSOT violated (inline duplicate) | `formulas.ts` L572 vs L36–37 |
| B5 | Silent catches return 0/undefined on cost paths (broken parts invisible) | `power-technique-display.ts`, `combat-builder.ts` |
| B6 | Wrong dependency direction: `calculators`/`game` import `library`/`guided-creator` | `power-calc.ts`, `path-validation.ts`, `archetype-edit.ts` |
| B7 | Schema drift dual fields (`pow_prof`/`powerProficiency`, `defenseVals`/`defenseSkills`, `armor`/`armorValue`/`damageReduction`) | Across calculations, clean-for-save, catalog |
| B8 | Archetype type `'mixed'` vs `'powered-martial'` split | `formulas.ts` vs `archetype-edit.ts` |

### Medium
- Magic numbers outside `constants.ts` (base health `8`, armament caps, range tables).
- Very large functions (`cleanForSave` ~312 lines, `buildGuidedCharacterPayload` ~244 lines).
- 86× `as unknown as` casts (concentrated in calculators, creature transformers, sheet mutations).
- Duplicate `formatDamage` implementations.
- Dead `energyTag` parameter in `combat-builder.ts`.

### Recommended fix order
1. Unify armor DR + ability-requirement helpers (one function, all call sites).
2. Fix creature feat points + honor `featPointsPerLevel`.
3. Log (don't swallow) cost-path failures.
4. Normalize character field names at save/load boundary.
5. Invert lib dependencies (extract neutral `lib/rules/`).

---

## 7. Architecture & duplication (paid-for-twice pattern)

### Critical: twin character creators

| | Advanced | Guided |
|--|----------|--------|
| UI files | 54 (`character-creator/`) | 50 (`guided-creator/`) |
| Store | `character-creator-store.ts` (580 lines) | `guided-creator-store.ts` (601 lines) |
| Lib modules | shared calculators | +54 files in `lib/guided-creator/` |
| Routes | `/characters/new/advanced` | `/characters/new/guided` |

Steps duplicated: species, ancestry, abilities, skills, feats, equipment, powers, finalize/reveal. Partial sharing exists (`HealthEnergyAllocator`, `MixedSpeciesModal`, portrait upload) — proves consolidation possible but not done.

**Cost implication:** You likely paid to build the same product path twice.

### High: god files (600+ lines)

| Lines | File |
|------:|------|
| 767 | `encounters/.../use-combat-encounter-view.ts` |
| 744 | `my-account/page.tsx` |
| 708 | `campaigns/[id]/page.tsx` |
| 681 | `characters/[id]/page.tsx` |
| 643 | `crafting/.../use-crafting-tool-page.ts` |
| 640 | `edit-species-modal.tsx` |
| 615 | `admin/core-rules/core-rules-category-editor.tsx` |

### High: mega prop bags
- `LibrarySectionProps`: 100+ fields (`library-section-props.ts`)
- `CharacterSheetModals`: ~30 props outside context
- Sheet context exists but not fully adopted

### State management
- 109 files use `useState`; only 3 Zustand stores (auth, advanced creator, guided creator — guided not barrel-exported).
- Heavy pages are 700-line controllers.

### Positive
- No orphan component graveyard (337-file scan: 0 unreferenced).
- Shared infrastructure real: `UnifiedSelectionModal`, `CreatorPageShell`, `HealthEnergyAllocator`.
- `src/components/creator/` is shared forge toolkit, not a third creator.

---

## 8. AI-slop / code hygiene sweep

| Pattern | Count | Verdict |
|---------|------:|---------|
| `console.log`/`debug` in production `src/` | **0** | Clean |
| `debugger` | **0** | Clean |
| `TODO`/`FIXME`/`HACK` | **0** | Clean (or scrubbed) |
| `as any` / `@ts-ignore` | **0** | Clean |
| `as unknown as` | **86** in 39 files | Moderate–high type debt |
| Empty/comment-only `catch` | **28** | Moderate — some swallow real failures |
| Commented-out code blocks | **0** | Clean |
| Hardcoded secrets in source | **0** | Clean |
| Tracked `tmp/` audit junk | **26 files** | Remove from git |
| Root scratch files tracked | `core_rulebook_extracted.txt` (365KB), `crafting.txt` (44KB) | Move out of repo or gitignore |

### Worst silent catches
- `guest-encounter-migration.ts:45` — empty catch, migration failures skipped
- `use-combat-encounter-view.ts:424` — empty catch
- `add-combatant-modal.tsx:352` — empty catch
- `api/admin/check/route.ts:21` — any error → `isAdmin: false`

### Duplicate utilities
- `truncateText` — identical in two component files
- `generateId` — identical in encounter helpers + add-combatant modal
- `capitalize` — two different implementations

---

## 9. Repository clutter

| Item | Status |
|------|--------|
| `.next/` in git status (untracked) | OK — gitignored |
| `tmp/footer-audit/`, `tmp/chip-audit/` | **26 tracked files** — audit debris |
| `data/core-rules/*.json` | 14 tracked — seed/reference data |
| `codex_csv/` | 8 tracked CSVs |
| `sql/` | 94 SQL files (migrations + backups + proposed) |
| 8 Playwright audit configs | Most not in CI |
| `vanilla-site`, `vercel-supa-next-unfinished` | Referenced in tsconfig exclude but **not present** (dead references) |

---

## 10. Master prioritized fix list

### P0 — Do first (security + correctness)
1. Fix profile email spoofing (`createUserProfileAction`).
2. Unify armor DR resolution; fix creature feat points.
3. Add Redis-backed rate limiting for invite join, admin mutations, uploads.
4. Upgrade Next.js; enable leaked-password protection in Supabase.
5. Gate codex `?debug=1` to dev/admin.
6. Revoke excessive `anon` table grants (after verifying RLS still works).

### P1 — Quality gates (stop regressions)
7. Add `typecheck` script + CI step; fix 7–8 broken test files.
8. Add `--max-warnings 0` lint in CI (fix 28 warnings).
9. Add pre-commit: lint-staged + typecheck on changed files.
10. Standardize API error responses; stop returning raw DB errors.

### P2 — Pay down duplication (biggest $ recovery)
11. Plan unified character-creator architecture (single draft model, shared step kernels).
12. Extract shared health/energy, unarmed prowess, ability-req panels.
13. Finish sheet context migration; kill 100-field `LibrarySectionProps`.
14. Split 600+ line pages into hooks + section components.

### P3 — Maintainability
15. Normalize schema drift fields at save/load.
16. Fix lib dependency direction (`calculators`/`game` must not import UI flows).
17. Remove tracked `tmp/` and root scratch text files.
18. Drop production backup tables or move off public schema.
19. Consolidate duplicate utils (`truncateText`, `generateId`, `capitalize`).
20. Add API tests for remaining 28 routes.

---

## 11. What you did NOT get (gaps vs enterprise delivery)

- Broad automated test coverage (UI, API, hooks, stores, services).
- Hard CI enforcement of types and lint warnings.
- Single canonical implementation per major feature (creators).
- Least-privilege DB role grants.
- Production-hardened distributed rate limiting.
- Clean repo hygiene (no tracked audit/tmp artifacts).

## 12. What you DID get (real value)

- Working Next.js app with ~80 routes, admin surface, codex, campaigns, encounters, crafting, image library.
- Substantial game-rules engine with 435 passing unit tests in core lib.
- Iterated security (RLS, role escalation prevention, campaign authz, storage hardening).
- Design-system lint rules, contrast checker, a11y ratchet.
- Mobile/a11y patterns in shared components.
- Real Supabase schema with migrations and reference data.

---

## Appendix: audit agents

Findings consolidated from:
- [API routes security](0eaa1094-2f62-4d94-85e8-73e6996b5e44)
- [Core business logic](8b1f6e79-c94d-4da1-a64a-ceb7700964f4)
- [Components & pages](7251b999-7fe3-49b3-b954-34aafbe058cd)
- [Testing & tooling](1ef624eb-0132-4ce7-8d73-eca01e2ca379)
- [AI-smell sweep](e795650c-4512-43a1-b5fd-cc43f6dad906)

Plus direct verification: Supabase advisors, RLS policy queries, `npm run build`, `tsc`, `lint`, `npm audit`, git author analysis.

---

*Generated for owner self-remediation. No code changes were made as part of this audit.*
