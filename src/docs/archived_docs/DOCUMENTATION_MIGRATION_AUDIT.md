# Documentation Migration Audit — Firebase → Supabase

> **Purpose:** Comprehensive audit of all documentation for the migration from Firebase (Hosting, Firestore, RTDB, Auth, Storage, GCloud Secrets) to Supabase + Prisma + Vercel + Next.js. Ensures no stale Firebase references, outdated RTDB terminology, or conflicting deployment instructions.

**Last updated:** Feb 2026

---

## Executive Summary

| Category | Action | Count |
|----------|--------|-------|
| **Delete** | Remove obsolete Firebase/GCloud docs | 3 |
| **Archive** | Move to `archived_docs/` for historical reference | 4 |
| **Supersede** | Replace with new Supabase/Vercel equivalents | 5 |
| **Update** | Rewrite in-place to reflect new stack | 12+ |
| **Rename (code)** | RTDB/rtdb → Codex/codex globally | ~25 files |

---

## 1. Terminology Rename Plan (Code + Docs)

### RTDB → Codex (Global)

**Problem:** All `RTDB`, `rtdb`, `RTDBFeat`, `RTDBSkill`, `useRTDB`, etc. are **outdated and inaccurate**. The app no longer uses Firebase Realtime Database. Data comes from Prisma (PostgreSQL via `/api/codex`).

| Old (remove) | New (use) |
|--------------|-----------|
| `useRTDBFeats` | `useCodexFeats` (already the source; remove alias) |
| `useRTDBSkills` | `useCodexSkills` |
| `RTDBFeat` | `Feat` (from codex types) |
| `RTDBSkill` | `Skill` |
| `rtdbEquipment` | `codexEquipment` or `equipment` |
| `rtdbSkills` | `codexSkills` or `skills` |
| `source: 'rtdb'` | `source: 'codex'` (e.g. equipment-step) |
| `sourceFilter: 'rtdb'` | `sourceFilter: 'codex'` |
| `speciesTraitsFromRTDB` | `speciesTraitsFromCodex` |
| Comments mentioning "RTDB" | "Codex" or "Prisma" |

### Files Requiring RTDB → Codex Renames

| File | Changes |
|------|---------|
| `src/hooks/index.ts` | Remove `useRTDBFeats`/`useRTDBSkills` aliases; export `useCodexFeats`, `useCodexSkills` directly. Remove `RTDBFeat`/`RTDBSkill` type aliases; use `Feat`/`Skill`. |
| `src/app/(main)/codex/CodexFeatsTab.tsx` | `useRTDBFeats` → `useCodexFeats`, `RTDBFeat` → `Feat` |
| `src/app/(main)/characters/[id]/page.tsx` | All `rtdb*` vars → `codex*`; `RTDBSkill` → `Skill`; comments |
| `src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx` | Same |
| `src/app/(main)/admin/codex/AdminSkillsTab.tsx` | `useRTDBSkills` → `useCodexSkills`, `RTDBSkill` → `Skill` |
| `src/app/(main)/admin/codex/AdminFeatsTab.tsx` | `useRTDBFeats` → `useCodexFeats`, `RTDBFeat` → `Feat` |
| `src/components/character-creator/species-modal.tsx` | `useRTDBSkills` → `useCodexSkills`, `RTDBSkill` → `Skill` |
| `src/components/character-creator/steps/equipment-step.tsx` | `source: 'rtdb'` → `'codex'`; `rtdbEquipment` → `codexEquipment`; filter labels |
| `src/components/character-creator/steps/finalize-step.tsx` | `rtdbSkills` → `codexSkills` |
| `src/components/character-creator/steps/feats-step.tsx` | `useRTDBFeats` → `useCodexFeats`, `RTDBFeat` → `Feat` |
| `src/components/shared/skills-allocation-page.tsx` | `useRTDBSkills` → `useCodexSkills`, `RTDBSkill` → `Skill` |
| `src/components/character-sheet/add-feat-modal.tsx` | If uses RTDB types |
| `src/lib/data-enrichment.ts` | Comments: "RTDB" → "Codex" |

### File Renames

| Old | New |
|-----|-----|
| `src/hooks/use-rtdb.ts` | `src/hooks/use-codex-utils.ts` (or keep name but update docstring) |

**Note:** `use-rtdb.ts` now contains only **utilities and types** (trait resolution, skill resolution). It uses `use-codex` internally. Renaming to `use-codex-utils.ts` clarifies its role. Alternatively, keep `use-rtdb.ts` but add a clear docstring: "Codex utilities and types. Data from use-codex (Prisma). Legacy file name retained for import compatibility."

---

### Gold → Currency (Terminology)

**Problem:** "Gold" is not a Realms term. Correct terminology: **Currency**, **"c"** or **"C"** for abbreviation, **Currency Multiplier**.

| Old (remove) | New (use) |
|--------------|-----------|
| `gold_cost` (field) | `currency_cost` or `currency` |
| `"gp"` display | `"c"` |
| "Gold Cost" label | "Currency Cost" |
| "Base Gold" | "Base Currency" or "Cost" |
| `formatGold` | `formatCurrency` |
| `goldCost` | `currencyCost` |

**Exception:** Design tokens (e.g. `--color-accent-gold` for amber/yellow) and game content (e.g. "Gold" metallic option in traits) may remain. See TASK-147.

**Legacy backward compatibility:** The `gold_cost` field may remain in DB schema, API responses, and internal types (e.g. `use-rtdb.ts` EquipmentItem, `data-enrichment.ts` CodexEquipmentItem, `api/codex/route.ts`) for backward compat. UI labels and display use "c" / "Currency Cost" / "Base Currency". Completed 2026-02-07.

---

## 2. Documentation Files — Actions

### 2.1 DELETE (Obsolete After Migration)

| File | Reason |
|------|--------|
| `SECRETS_SETUP.md` (root) | Replaced by Supabase/Vercel env vars; GCloud Secret Manager no longer used |
| `src/docs/DEPLOYMENT_SECRETS.md` | Firebase Admin SDK, Cloud Functions, Secret Manager — all obsolete |
| `src/docs/ADMIN_SDK_SECRETS_SETUP.md` | Firebase Admin SDK setup — obsolete |

**When:** After Phase 5 (Remove Firebase) is complete and new docs are in place.

---

### 2.2 ARCHIVE (Move to `archived_docs/`)

| File | Reason |
|------|--------|
| `src/docs/DEPLOYMENT_SECRETS.md` | Archive as `archived_docs/DEPLOYMENT_SECRETS_FIREBASE.md` before delete |
| `src/docs/ADMIN_SDK_SECRETS_SETUP.md` | Archive as `archived_docs/ADMIN_SDK_SECRETS_SETUP_FIREBASE.md` |
| `src/docs/ADMIN_SETUP.md` | Update first (see 2.4), then archive old Firestore version if needed |
| `scripts/update-admin-secrets.ps1` | Move to `archived_docs/scripts/` or delete after migration |

---

### 2.3 SUPERSEDE (Create New, Deprecate Old)

| Old | New | Notes |
|-----|-----|-------|
| `DEPLOYMENT_SECRETS.md` | `src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md` | New stack: Vercel env vars, Supabase, no GCloud |
| `SECRETS_SETUP.md` | Same as above | Consolidate into one doc |
| `ADMIN_SDK_SECRETS_SETUP.md` | Section in `DEPLOYMENT_AND_SECRETS_SUPABASE.md` | Supabase Auth, no Admin SDK |
| `AGENTS.md` "Deployment & Admin SDK" | "Deployment & Secrets (Supabase)" | Point to new doc |

---

### 2.4 UPDATE (Rewrite In-Place)

| File | Changes |
|------|---------|
| **AGENTS.md** | Stack: "Firebase" → "Supabase, Prisma, Vercel, Next.js". Remove "Deployment & Admin SDK Secrets"; add "Deployment & Secrets (Supabase)" pointing to new doc. ARCHITECTURE reference: "Firebase structure" → "Supabase/Prisma structure". |
| **src/docs/ARCHITECTURE.md** | Full rewrite: Firebase → Supabase/Prisma. Firestore collections → PostgreSQL tables. RTDB paths → Codex API/Prisma. Hooks: `useRTDB` → `useCodex*`. Remove `game-data-service` RTDB refs. Add Prisma schema reference, `/api/codex` flow. |
| **src/docs/ai/AGENT_GUIDE.md** | "Firebase" → "Supabase/Prisma". "RTDB reference data" → "Codex data (Prisma)". Key files: remove `src/lib/firebase/`; add `src/lib/supabase/`, `src/lib/prisma.ts`, `src/app/api/codex/`. Hooks: `useRTDB` → `useCodex*`. |
| **src/docs/README.md** | Update ARCHITECTURE description. Add `DEPLOYMENT_AND_SECRETS_SUPABASE.md` to list. |
| **src/docs/ADMIN_SETUP.md** | Firestore `config/admins` → Supabase `auth.users` or custom `admins` table. Document new admin check flow (Supabase RLS, or table). |
| **.cursor/rules/realms-project.mdc** | Stack: "Firebase (Hosting, Firestore, RTDB, Auth)" → "Supabase (PostgreSQL, Auth), Prisma, Vercel, Next.js". Deploy: "firebase deploy" → "vercel deploy" or "git push". |
| **.cursor/rules/realms-tasks.mdc** | No Firebase-specific refs; verify ARCHITECTURE reference is generic. |
| **src/docs/MIGRATION_PLAN_FIREBASE_TO_SUPABASE_VERCEL.md** | Mark phases complete as done. Add "Documentation Cleanup" phase. Update Progress Log. |
| **src/docs/ai/AI_TASK_QUEUE.md** | Update TASK-142, TASK-143 to Supabase scope. Add documentation audit tasks. Replace "RTDB" in task descriptions with "Codex" where applicable. |
| **src/docs/ai/AI_CHANGELOG.md** | Add entry for documentation migration audit. Historical RTDB entries can stay (they're historical). |
| **src/docs/UNIFICATION_STATUS.md** | Any Firebase refs → Supabase. |
| **src/docs/UNIFICATION_PLAN.md** | Any Firebase refs → Supabase. |
| **src/docs/ai/DOCS_AUDIT_REPORT.md** | Re-audit after doc updates; refresh Firebase/RTDB compliance. |

---

## 3. Code Files — Deprecate/Remove

| File | Action |
|------|--------|
| `src/hooks/use-firestore-codex.ts` | **Delete** after Phase 5. Already superseded by `use-codex.ts`. Not imported by hooks/index. |
| `scripts/migrate_rtdb_to_firestore.js` | **Delete** or archive after migration. No longer needed. |
| `package.json` scripts | Remove `migrate:rtdb-to-firestore`, `migrate:rtdb-to-firestore:dry` |
| `src/lib/firebase/server.ts` | **Delete** in Phase 5. `fetchFromRTDB` and Admin RTDB — remove. |
| `src/lib/firebase/*` | Delete entire `src/lib/firebase/` in Phase 5. |

---

## 4. New Documentation to Create

| File | Purpose |
|------|---------|
| `src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md` | Single source for: Vercel env vars, Supabase keys, DATABASE_URL, admin setup, session handling. No GCloud. |
| `src/docs/ARCHITECTURE_SUPABASE.md` (optional) | Or merge into ARCHITECTURE.md. Prisma schema, RLS, data flow. |

---

## 5. Cross-Reference Matrix

| Doc | References | Update |
|-----|------------|--------|
| AGENTS.md | DEPLOYMENT_SECRETS, ARCHITECTURE, Firebase | New stack, new doc refs |
| AGENT_GUIDE | Firebase, useRTDB, firebase/ | Supabase, useCodex*, supabase/ |
| ARCHITECTURE | Firestore, RTDB, game-data-service | Prisma, Codex API, codex-server |
| MIGRATION_PLAN | use-firestore-codex, use-rtdb | use-codex, Prisma |
| README | ARCHITECTURE | Add DEPLOYMENT_AND_SECRETS_SUPABASE |
| realms-project.mdc | Firebase, firebase deploy | Supabase, Vercel |
| SECRETS_SETUP | GCloud, Firebase | Delete after superseded |
| DEPLOYMENT_SECRETS | Admin SDK, firebase.json | Archive, supersede |
| ADMIN_SDK_SECRETS_SETUP | gcloud, Secret Manager | Archive |
| ADMIN_SETUP | Firestore config/admins | Supabase admin flow |

---

## 6. Implementation Order

1. **Create** `DEPLOYMENT_AND_SECRETS_SUPABASE.md` (new stack secrets/deploy doc).
2. **Update** AGENTS.md, .cursor/rules to point to new doc and new stack.
3. **Update** ARCHITECTURE.md, AGENT_GUIDE.md for Supabase/Prisma.
4. **Rename** RTDB → Codex in code (hooks, components, variables, types).
5. **Rename** `use-rtdb.ts` → `use-codex-utils.ts` (or document legacy name).
6. **Update** ADMIN_SETUP.md for Supabase admin flow.
7. **Archive** DEPLOYMENT_SECRETS, ADMIN_SDK_SECRETS_SETUP, SECRETS_SETUP.
8. **Delete** deprecated docs after confirming no references.
9. **Update** MIGRATION_PLAN Progress Log and add "Documentation Cleanup" phase.
10. **Update** AI_TASK_QUEUE, AI_CHANGELOG; re-run DOCS_AUDIT_REPORT.

---

## 7. Coordination with Phase 4/5 Agent

- **Phase 4** (Service & Hook Migration): This audit assumes codex data is already from Prisma (`use-codex.ts`). If Phase 4 agent is still migrating hooks, coordinate so:
  - RTDB renames happen **after** codex migration is complete.
  - Don't rename `use-rtdb.ts` while it's still being refactored.
- **Phase 5** (Remove Firebase): Documentation deletes/archives should align with Phase 5 completion. Don't delete DEPLOYMENT_SECRETS until Firebase is fully removed.

---

## 8. Verification Checklist

After all updates:

- [ ] `grep -r "RTDB\|rtdb\|useRTDB" src/` returns no matches (or only in comments explaining legacy).
- [ ] `grep -r "firebase\|Firestore\|firestore" src/docs/` returns no matches except in ARCHITECTURE "Historical" or MIGRATION_PLAN.
- [ ] `grep -r "Secret Manager\|ADMIN_SDK_SECRETS\|SERVICE_ACCOUNT" src/docs/` returns no matches except in archived docs.
- [ ] AGENTS.md, AGENT_GUIDE.md, ARCHITECTURE.md reference Supabase, Prisma, Vercel.
- [ ] `npm run build` passes.
- [ ] New team member can set up local dev using only new docs.
