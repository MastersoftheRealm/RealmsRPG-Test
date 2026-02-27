# Path C Migration — Plan Fulfillment & Database Audit

**Date:** 2026-02-25  
**Scope:** Plan fulfillment, database/columnar usage, and verification that all pages work with the Supabase-only setup.

---

## 1. Plan Fulfillment Summary

| Phase | Status | Verification |
|-------|--------|--------------|
| **0** | Complete | SQL consolidation to `public` (operator-run). Realtime subscriptions in code use `schema: 'public'`, `table: 'campaign_rolls'` / `table: 'characters'`. |
| **1** | Complete | Codex: `/api/codex`, `codex-server.ts`, admin codex actions use Supabase only. No Prisma in codebase. |
| **2** | Complete | Characters: `/api/characters`, `/api/characters/[id]`, `character-server.ts`, `(main)/characters/actions.ts` use Supabase. |
| **3** | Complete | User library: `library/actions.ts`, `/api/user/library/[type]`, `owner-library-for-view.ts` use Supabase; columnar via `library-columnar.ts` (rowToItem, toDbRow, bodyToColumnar). |
| **4** | Complete | Campaigns: all `/api/campaigns/*` routes and `campaigns/actions.ts` use Supabase. Encounters: `/api/encounters`, `/api/encounters/[id]` use Supabase. |
| **5** | Complete | Auth, profile, admin, public/official API use Supabase; `prisma.ts` deleted. |
| **6** | Complete | `prisma` and `@prisma/client` removed from package.json; build without `prisma generate`; seed scripts use Supabase client. |
| **6b** | Complete | AI/agent docs updated (AGENTS.md, .cursor/rules, AI_TASK_QUEUE, AGENT_GUIDE, README, UNIFICATION_STATUS, ALL_FEEDBACK_CLEAN, DATABASE_*.md). |

**Grep verification:** No `prisma`, `PrismaClient`, or `@/lib/prisma` in `src/**/*.{ts,tsx,js,jsx}`.

---

## 2. Database layout

**For current schema (tables, columns, columnar vs JSONB):** see [SUPABASE_SCHEMA.md](../SUPABASE_SCHEMA.md) — the single source of truth. This audit is a one-time fulfillment snapshot; do not use it as the canonical schema reference.

---

## 3. Realtime

| Subscription | Location | Schema / Table |
|--------------|----------|----------------|
| Campaign rolls | `use-campaign-rolls.ts` | `schema: 'public'`, `table: 'campaign_rolls'` |
| Character (single) | `characters/[id]/page.tsx` | `schema: 'public'`, `table: 'characters'` |
| Characters (combatants) | `CombatEncounterView.tsx` | `schema: 'public'`, `table: 'characters'` |

All three use `public`; no legacy `users` or `campaigns` schema references in Realtime.

---

## 4. Page & Data Flow Verification

| Page / Flow | Data source | Backed by |
|-------------|-------------|-----------|
| Characters list | `useCharacters` → `getCharacters()` → GET /api/characters | Supabase `characters` |
| Character detail | `getCharacter(id)` → GET /api/characters/[id]; LibraryForView from API | Supabase `characters`; `getOwnerLibraryForView` (user_powers, user_techniques, user_items) |
| Character create/save/delete | character-service → POST/PATCH/DELETE /api/characters | Supabase |
| Library (powers/techniques/items/creatures) | useUserPowers, etc. → server actions or GET /api/user/library/[type] | Supabase columnar tables |
| Library species | GET/POST /api/user/library/species | Supabase `user_species` (id+data) |
| Codex (all tabs) | useCodexFeats, useCodexSkills, etc. → fetchCodex() → GET /api/codex | Supabase codex_* + core_rules |
| Admin codex | Admin actions → Supabase service-role | Supabase |
| Campaigns list/detail | useCampaigns, useCampaign → GET /api/campaigns, GET /api/campaigns/[id] | Supabase campaigns, campaign_members |
| Campaign rolls | useCampaignRolls → GET /api/campaigns/[id]/rolls; Realtime | Supabase campaign_rolls |
| Encounters list/detail | GET /api/encounters, GET /api/encounters/[id] | Supabase encounters |
| My account / profile | getUserProfileAction, updateUserProfileAction, etc. | Supabase user_profiles, usernames |
| Admin users | GET /api/admin/users, PATCH update-role | Supabase user_profiles |
| Official / public library (admin) | useOfficialLibrary, usePublicLibrary → GET /api/official/[type], /api/public/[type] | Supabase official_*, public_* |

All pages that depend on characters, library, codex, campaigns, encounters, or profile use APIs or server actions that are implemented with Supabase only. No page calls Prisma directly.

---

## 5. Gaps & Optional Improvements

1. **LibraryForView (owner library for character view)**  
   `getOwnerLibraryForView` returns only powers, techniques, and items — not creatures. If the character sheet or campaign character view should display the owner’s library creatures in the same way, add `user_creatures` to `getOwnerLibraryForView` and extend the `LibraryForView` type and API response. **Status:** Optional; current behavior may be intentional.

2. **Stale comments (fixed in this audit)**  
   - `character-service.ts`: Updated "Prisma" → "Supabase".  
   - `use-codex.ts`: Updated "from Prisma (via API)" → "from Supabase (via /api/codex)".  
   - `PATH_C_MIGRATION_PLAN.md` §2.1 and §2.3: Updated "via Prisma" and schema references to Supabase / public.

3. **Plan doc §2.2 Table layout**  
   Still references "Schema: codex", "Schema: users", etc. For post–Phase 0, all tables are in `public`. Consider updating the table to "Schema: public" for every row for consistency (or add a note that the table describes logical domains; physical schema is `public`).

4. **delete_user_data RPC**  
   Plan suggested an RPC for delete-account to enforce order. Current implementation uses sequential Supabase client deletes in `(auth)/actions.ts`. Acceptable; RPC can be added later for atomicity if desired.

5. **DATABASE_URL / DIRECT_URL**  
   Removed from required env in docs. If you run external migrations or tools that need a Postgres URL, keep them in `.env` locally; they are not required for the app itself.

---

## 6. Checklist: All Pages Use New Setup

- [x] Characters list and detail load from /api/characters (Supabase).
- [x] Character create/update/delete go through API (Supabase).
- [x] Library (all types) and species use actions or /api/user/library (Supabase).
- [x] Codex and admin codex use /api/codex and Supabase (columnar).
- [x] Campaigns and campaign rolls use /api/campaigns and Supabase; Realtime on public.campaign_rolls.
- [x] Encounters use /api/encounters (Supabase).
- [x] Character sheet Realtime uses public.characters.
- [x] Combat encounter view Realtime uses public.characters for combatants.
- [x] Profile and account use auth actions (Supabase user_profiles, usernames).
- [x] Admin users use /api/admin/users (Supabase).
- [x] Official and public library use /api/official/[type] and /api/public/[type] (Supabase).

---

## 7. Conclusion

Path C migration is **fulfilled**: no Prisma in source; all table access is via Supabase; columnar usage is correct for codex and user/official library; Realtime uses `public`; and all audited pages and flows use the new setup. Minor doc and comment updates were applied. Optional follow-ups: ~~extend LibraryForView with creatures~~ (done); optionally add a delete_user_data RPC for atomic account deletion.
