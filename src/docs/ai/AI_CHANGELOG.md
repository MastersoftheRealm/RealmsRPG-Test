# AI Change Log

Append-only log. Agents must add an entry for each PR/merge.

- 2026-02-13 | agent | Session: Creator feats filter, add modals, feats tab uses/columns | files: src/components/character-creator/steps/feats-step.tsx, src/components/character-sheet/add-library-item-modal.tsx, src/components/character-sheet/feats-tab.tsx, src/components/shared/grid-list-row.tsx | Summary:
  - Character Creator feats: Either/or filter (Archetype feats | Character feats), no "All Feats". Qualification button label "Showing all feats" (not "Show all feats"). Ability column added as sort option. Selected feat chips (archetype/character) expandable to show description.
  - Add Power/Technique (Add Library Item) modal: Aligned with add-feat/character sheet — primary header bar, contentGrid + rowGrid for header/row alignment, ListHeader with gridColumns, expandable rows.
  - Feats tab: Uses column shows steppers (DecrementButton/IncrementButton + current/max) for traits and feats; hideUsesInName on GridListRow removes redundant (X/X) after name. Name column widened (minmax(140px, 1.6fr)), Uses column 5rem.
  - build passes

- 2026-02-13 | agent | Session: Feat restrictions, species skill Any, creator skills UX, defense bonuses | files: src/lib/game/formulas.ts, src/components/character-sheet/add-feat-modal.tsx, src/components/character-creator/steps/feats-step.tsx, src/hooks/use-rtdb.ts, src/components/character-creator/species-modal.tsx, src/components/character-creator/steps/skills-step.tsx, src/components/shared/skills-allocation-page.tsx, src/app/(main)/characters/[id]/page.tsx | Summary:
  - Feat restrictions: skill_req_val is required SKILL BONUS (not value). Added getSkillBonusForFeatRequirement() in formulas.ts; add-feat-modal and feats-step now require proficiency and compare character/draft skill bonus to feat.skill_req_val. Supports character.skills as array or record and draft allocations.
  - Species skill id "0": Display as "Any" in species-modal and ancestry-step (resolveSkillIdsToNames). Id 0 = extra skill point: skills-step passes extraSkillPoints to SkillsAllocationPage; character sheet totalSkillPoints adds 1 when species has 0; allocations never set allocations['0'].
  - Character creator skills: Removed ability-grouped tabs. Single flat table (Prof, Skill, Ability, Bonus, Value) matching character sheet; SkillRow variant="table". Add Skill/Add Sub-Skill disabled when no points; adding a skill sets value to 1 (auto proficient).
  - Skill points display: PointStatus wrapped in flex-shrink-0 whitespace-nowrap so current/max stays on one row.
  - Defense bonuses in creator: Defense allocation section shows total bonus (ability + points), formatBonus styling, and +N (2sp) indicator like character sheet edit mode.
  - build passes

- 2026-02-11 | agent:cursor | Session: TASK-235, TASK-236, TASK-237 — About dice carousel, Skill encounter Successes/RM bonus, Combat tracker UX | files: about/page.tsx, encounters/[id]/skill/page.tsx, encounters/[id]/combat/page.tsx, CombatantCard.tsx, types/encounter.ts, AI_TASK_QUEUE.md, ALL_FEEDBACK_CLEAN.md | TASKs: TASK-235, TASK-236, TASK-237 | Summary:
  - TASK-235: About page dice carousel — 7 dice (d10 d12 d20 d4 d6 d8 d10), no brackets on selected (coloration/centering), centered below content, wrap-around cycling; added "Join the Community" slide with Discord link (second d10, scale-x-[-1]).
  - TASK-236: Skill encounter — Renamed Progress to Successes; net dots only (failures cancel successes); Additional Success / Additional Failure buttons; DS change recomputes all participant results; RM Bonus per participant; skill dropdown from codex; ParticipantCard shows effective roll when bonus set.
  - TASK-237: Combat — Surprised checkbox on CombatantCard; initiative input select-all on focus; removeCombatant does not advance turn (currentTurnIndex adjusted); re-sort initiative at start of each round when Auto Sort Initiative on; Sort Initiative kept in bar when combat active; Encounter.autoSortInitiative optional field.
  - build passes

- 2026-02-11 | agent:cursor | Session: TASK-201, TASK-202 — Centralize calculations + unify defense fields | files: src/lib/game/calculations.ts, src/lib/game/formulas.ts, src/lib/game/progression.ts, src/app/(main)/characters/[id]/character-sheet-utils.ts, src/stores/character-creator-store.ts, src/components/character-creator/steps/finalize-step.tsx, src/components/character-creator/steps/skills-step.tsx, src/components/character-sheet/level-up-modal.tsx, src/app/(main)/creature-creator/page.tsx, src/app/api/campaigns/[id]/characters/[userId]/[characterId]/route.ts, src/types/character.ts, src/lib/data-enrichment.ts, src/app/(main)/characters/[id]/page.tsx, src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx | TASKs: TASK-201, TASK-202 | Summary:
  - TASK-201: Added calculateTerminal(), calculateAllStats(), computeMaxHealthEnergy() to calculations.ts as SINGLE SOURCE OF TRUTH. character-sheet-utils.ts is now a thin wrapper. Replaced inline health/energy formulas in creator store and finalize step. Deprecated getBaseHealth/getBaseEnergy/getCharacterMaxHealthEnergy/calculateSkillPoints in formulas.ts. Updated 8+ callers to use centralized functions.
  - TASK-202: defenseVals is now the canonical field (defenseSkills deprecated). All writes save defenseVals only. All reads use defenseVals || defenseSkills for backward compat. cleanForSave() auto-migrates. Removed defenseSkills from SAVEABLE_FIELDS.
  - build compiles (no new TS errors)

- 2026-02-11 | agent:cursor | Session: TASK-200, TASK-221, TASK-222, TASK-223, TASK-224 — CharacterSaveData type + Core Rules DB foundation | files: src/types/character.ts, src/types/core-rules.ts, src/types/index.ts, prisma/schema.prisma, prisma/supabase-rls-policies.sql, src/app/api/codex/route.ts, src/app/(main)/admin/codex/actions.ts, src/hooks/use-game-rules.ts, scripts/seed-core-rules.js, scripts/create-core-rules-table.sql | TASKs: TASK-200, TASK-221, TASK-222, TASK-223, TASK-224 | Summary:
  - TASK-200: Added CharacterSaveData interface to character.ts — lean persistence-only type (IDs, user choices, runtime state). Coexists with existing Character type.
  - TASK-221: Designed 13 core rules categories (PROGRESSION_PLAYER, PROGRESSION_CREATURE, ABILITY_RULES, ARCHETYPES, ARMAMENT_PROFICIENCY, COMBAT, SKILLS_AND_DEFENSES, CONDITIONS, SIZES, RARITIES, DAMAGE_TYPES, RECOVERY, EXPERIENCE). Full TypeScript types in core-rules.ts.
  - TASK-222: Added CoreRules Prisma model (codex.core_rules table). Created via SQL, RLS policy added, admin actions extended.
  - TASK-223: Created seed-core-rules.js — idempotent upsert of all 13 categories. Successfully seeded to Supabase.
  - TASK-224: Created useGameRules() hook — React Query with 10min staleTime, fetches from /api/codex coreRules field, falls back to hardcoded constants. getGameRulesFallback() for server use.
  - build compiles (no new TS errors introduced)

- 2026-02-09 | agent:cursor | Session: Queue cleanup, modal button consistency | files: AI_TASK_QUEUE.md, add-feat-modal.tsx, species-modal.tsx | Summary:
  - Queue: Marked stale TASK-161, TASK-162, TASK-164 as done (were already implemented).
  - Modal button consistency: add-feat-modal (Cancel, Add Selected) and species-modal (inline ✕) now use shared Button component instead of raw &lt;button&gt; with custom classes.
  - build passes

- 2026-02-09 | agent:cursor | Session: TASK-165, TASK-166 — Roll log Realtime, HP/EN sync | files: use-campaign-rolls.ts, supabase-rls-policies.sql, encounter types, combat/page.tsx, add-combatant-modal.tsx, AI_TASK_QUEUE.md | TASKs: TASK-165, TASK-166 | Summary:
  - TASK-165: Roll log real-time — use-campaign-rolls subscribes to postgres_changes on campaigns.campaign_rolls with filter campaign_id=eq.; invalidates query on any change (no more 5s polling). supabase-rls-policies.sql: ALTER PUBLICATION supabase_realtime ADD TABLE campaigns.campaign_rolls; GRANT SELECT to authenticated.
  - TASK-166: HP/EN real-time — TrackedCombatant/SkillParticipant have sourceUserId. Encounter→character: updateCombatant calls syncCharacterHealthEnergy (debounced 400ms) when owner edits HP/EN; PATCH /api/characters/[id]. Character→encounter: Realtime subscription on users.characters for campaign-character combatant ids; on UPDATE merge health/energy into combatants. Publication + GRANT for users.characters.
  - build passes

- 2026-02-09 | agent:cursor | Session: TASK-167, TASK-168 — Character visibility, character-derived content | files: api/characters/[id]/route.ts, api/campaigns/.../characters/.../route.ts, owner-library-for-view.ts, character-service.ts, characters/[id]/page.tsx, campaigns/.../view/.../page.tsx, AI_TASK_QUEUE.md | TASKs: TASK-167, TASK-168 | Summary:
  - TASK-167: Character visibility — GET /api/characters/[id] allows unauthenticated for public; campaign visibility via campaign membership; view-only toolbar when !isOwner; add/join campaign set visibility to campaign when private with toasts.
  - TASK-168: Character-derived content — getOwnerLibraryForView(ownerUserId) fetches owner's powers/techniques/items; character API and campaign character API return libraryForView when non-owner; character page and campaign view page use libraryForView for enrichment so viewers see owner's library items read-only.
  - build passes

- 2026-02-09 | agent:cursor | Session: TASK-153–160 — Navbar, Admin Codex, Feat editing, Schema doc | files: header.tsx, AdminFeatsTab, AdminSpeciesTab, admin/codex tabs, constants.ts, CODEX_SCHEMA_REFERENCE.md, AI_TASK_QUEUE.md | TASKs: TASK-153, TASK-154, TASK-155, TASK-156, TASK-157, TASK-158, TASK-160 | Summary:
  - TASK-153: Navbar — moved Campaigns to right of RM Tools, left of About
  - TASK-154: Admin Feats — display "-" for feat level 0 (lvl_req)
  - TASK-155: Admin Codex — fixed invalidateQueries keys (use ['codex']); unified Admin Feats with Codex Feats (FilterSection, SortHeader, filters)
  - TASK-156: Feat editing — ability dropdown (6 abilities + 6 defenses), multi-select for ability; ability_req rows with dropdown + min value
  - TASK-157: Feat editing — added req_desc, prereq_text, feat_cat_req, pow_abil_req, mart_abil_req, pow_prof_req, mart_prof_req, speed_req, feat_lvl, rec_period select; skill_req dropdown with min value
  - TASK-158: Created CODEX_SCHEMA_REFERENCE.md — field tables for all codex entities
  - TASK-159: Deferred (input lag — requires profiling)
  - TASK-160: Species skills — ChipSelect dropdown; feat skill_req — skill dropdown with add/remove rows
  - build passes

- 2026-02-11 | agent:cursor | Session: TASK-169–170 — Admin Feats prereq_text removal, Admin Codex tab unification | files: AdminFeatsTab, AdminSkillsTab, AdminPartsTab, AdminPropertiesTab, AdminEquipmentTab, use-rtdb.ts, api/codex/route.ts, migrate_rtdb_to_firestore.js, CODEX_SCHEMA_REFERENCE.md, AI_TASK_QUEUE.md, ALL_FEEDBACK_CLEAN.md | TASKs: TASK-169, TASK-170 | Summary:
  - TASK-169: Removed non-canonical `prereq_text` from feats schema docs, feat types, codex API mapping, migration script, and Admin Feats editor; rely on `req_desc` for human-readable requirements
  - TASK-170: Updated Admin Skills, Parts, Properties, and Equipment tabs to share Codex-style search, filters, sort headers, and GridListRow layouts, with edit/delete controls layered on top
  - build pending

- 2026-02-11 | agent:cursor | Session: TASK-171 — Admin Skills base skill dropdown | files: AdminSkillsTab.tsx, AI_TASK_QUEUE.md, ALL_FEEDBACK_CLEAN.md | TASKs: TASK-171 | Summary:
  - Replaced numeric `base_skill_id` input in Admin Skills modal with a dropdown of base skill names (plus an "Any" option mapped to id 0)
  - On save, the selected name is resolved to `base_skill_id` and stored internally; editing a sub-skill pre-selects the correct base skill
  - `npm run build` passes

- 2026-02-07 | agent:cursor | Session: TASK-137–141 — Public library, add-to-library, source filter, badges | files: library-service, use-public-library, CodexPublicLibraryTab, grid-list-row, SourceFilter, Library tabs, power/technique/item/creature creators | TASKs: TASK-137, TASK-138, TASK-139, TASK-140, TASK-141 | Summary:
  - TASK-137: Admin My library / Public library toggle in all four creators (done earlier)
  - TASK-138: fetchPublicLibrary, addPublicItemToLibrary, usePublicLibrary, useAddPublicToLibrary; Add to my library in Codex Public tab
  - TASK-139: SourceFilter component (All | Public | My library); Library page filter; Powers tab full source support
  - TASK-140: Public (blue) and Mine (green) badges on GridListRow
  - TASK-141: Codex Public Library tab with Powers/Techniques/Armaments/Creatures sub-tabs
  - build passes

- 2026-02-07 | agent:cursor | Session: TASK-137 — Admin public/private save toggle | files: power-creator, technique-creator, item-creator, creature-creator | TASKs: TASK-137 | Summary:
  - All four creators now have My library / Public library toggle (admin-only)
  - Uses saveToPublicLibrary for public, saveToLibrary for private
  - Consistent UI with cn() and design tokens; build passes

- 2026-02-07 | agent:cursor | Session: TASK-152 — Audit skill encounter page | files: encounters/[id]/skill/page.tsx, AI_TASK_QUEUE.md | TASKs: TASK-152 | Summary:
  - Audited skill encounter against GAME_RULES and feedback
  - Verified campaign chars (scope=encounter) and creature library both work for adding participants
  - Added Required Successes display (participants + 1) per GAME_RULES
  - computeSkillRollResult confirmed correct; build passes

- 2026-02-07 | agent:cursor | Session: Roll log dark mode, campaign chars, duplicate X, species skills | files: roll-log.tsx, unified-selection-modal.tsx, add-combatant-modal.tsx, api/campaigns/.../characters/.../route.ts, characters/[id]/page.tsx, AI_TASK_QUEUE.md, ALL_FEEDBACK_CLEAN.md | Summary:
  - Roll log: Added dark: variants for title, character name, dice boxes, timestamp (fix invisible text in dark mode)
  - UnifiedSelectionModal: Pass showCloseButton={false} to Modal to remove duplicate X (modal had its own + header had its own)
  - Campaign chars: API now supports ?scope=encounter — any campaign member can fetch minimal char data for encounter add; add-combatant-modal uses scope=encounter
  - Species skills: Character sheet skills useMemo now merges species skills into display list when missing from character.skills
  - Added TASK-152: Audit skill encounter page; appended raw feedback to ALL_FEEDBACK_CLEAN

- 2026-02-07 | agent:cursor | Session: Migration task audit — TASK-150, TASK-151, stale refs | files: auth/confirm/route.ts, auth/callback/route.ts, AI_TASK_QUEUE.md, DEPLOYMENT_AND_SECRETS_SUPABASE.md | TASKs: TASK-150, TASK-151 | Summary:
  - TASK-150: Created auth/confirm route for Supabase email magic links/OTP (verifyOtp, createUserProfileAction)
  - TASK-151: Added x-forwarded-host handling to auth callback and confirm for Vercel/proxy
  - Updated deployment doc: auth redirect URLs (auth/callback, auth/confirm)
  - Fixed stale related_files in task queue (firebase→supabase, firestore.rules→prisma)

- 2026-02-07 | agent:cursor | Session: Migration completion — Phase 5, audit, comment cleanup | files: functions/ (removed), .env.example, middleware, migration plan, creators, equipment-step, finalize-step, data-enrichment, encounter pages, types, lib/utils/object | Summary:
  - Phase 5: Removed `functions/` directory, cleaned `.env.example` (Firebase/App Check refs)
  - Fixed ~25 stale Firebase/Firestore comments across src (→ Prisma/Codex/Supabase)
  - Updated migration plan: Phase Completion Audit (all phases ✅), Security Checklist (all ✅), Final Phase-by-Phase Audit table
  - Migration marked complete; npm run build passes

- 2026-02-07 | agent:cursor | Session: Phase 7 + 7b — Vercel deployment docs, Admin/Public Library workflow | files: DEPLOYMENT_AND_SECRETS_SUPABASE.md, ADMIN_SETUP.md, AI_TASK_QUEUE.md, MIGRATION_PLAN | TASKs: TASK-143 | Summary:
  - Added copy-paste ready SQL block for Storage RLS (Supabase SQL Editor)
  - Phase 7: Step-by-step Vercel deployment (connect repo, env vars, deploy, auth redirect)
  - Phase 7b: ADMIN_SETUP.md — migration/deploy steps, public library (planned) note
  - TASK-143 done; Phase 7 and 7b marked complete in migration plan

- 2026-02-07 | agent:cursor | Session: Migration follow-up — Prisma migration, patch-package cleanup, Storage docs | files: package.json, DEPLOYMENT_AND_SECRETS_SUPABASE.md, MIGRATION_PLAN | Summary:
  - Ran `npx prisma migrate dev` — add_encounters migration applied (encounters table)
  - Removed patch-package and postinstall; deleted empty patches directory (Firebase cleanup)
  - Added Supabase Storage bucket setup to DEPLOYMENT_AND_SECRETS_SUPABASE.md: profile-pictures, portraits with RLS policies
  - Phase 3 (Storage) marked done in migration plan
  - npm run build passes

- 2026-02-07 | agent:cursor | Session: Docs audit — Supabase stack alignment, archive redundant docs | files: ARCHITECTURE.md, ADMIN_SETUP.md, .cursor/rules/realms-project.mdc, realms-tasks.mdc, DEPLOYMENT_AND_SECRETS_SUPABASE.md, UNIFICATION_STATUS.md, src/docs/README.md, archived_docs/ | Summary:
  - ARCHITECTURE: removed Firestore references; full Supabase/Prisma
  - ADMIN_SETUP: env vars only (ADMIN_UIDS); removed Firestore config/admins
  - realms-project.mdc: Vercel only (removed Firebase deploy note)
  - realms-tasks.mdc: feedback protocol references ALL_FEEDBACK_CLEAN (not RAW)
  - DEPLOYMENT_AND_SECRETS: removed Firebase App Check optional line
  - UNIFICATION_STATUS: ARCHITECTURE ref → Supabase/Prisma
  - Archived: MIGRATION_PLAN, DOCUMENTATION_MIGRATION_AUDIT, UNIFICATION_PLAN, UI_UNIFICATION_PLAN, COMPREHENSIVE_AUDIT, DOCS_AUDIT_REPORT → archived_docs/
  - Updated src/docs/README.md index

- 2026-02-07 | agent:cursor | Session: Complete Firebase removal — Supabase/Prisma/Vercel only | files: admin/codex/actions, campaigns/actions, characters/actions, library/actions, api/session, api/campaigns/.../characters/..., api/upload/profile-picture, api/encounters, api/campaigns/[id]/rolls, my-account, forgot-username, encounter-service, campaign-roll-service, use-campaign-rolls, prisma/schema (Encounter model), package.json, AGENTS.md | Summary:
  - Switched admin codex, campaigns, characters, library actions to Prisma + Supabase session
  - Replaced /api/session with compatibility stub (Supabase handles sessions)
  - Migrated campaign character view API to Prisma
  - Added profile-picture upload API (Supabase Storage), my-account page fully Supabase
  - Forgot-username: server action + Prisma UserProfile lookup
  - Added Encounter model, /api/encounters, migrated encounter-service to API
  - Added /api/campaigns/[id]/rolls, migrated campaign-roll-service to API; useCampaignRolls polls instead of Firestore
  - Deleted src/lib/firebase/, use-firestore-codex.ts, use-session-sync.ts
  - Removed firebase, firebase-admin, firebase-tools from package.json
  - npm run build passes

- 2026-02-07 | agent:cursor | Session: TASK-148 — Phase 4 migration (character, library, campaign → Prisma) | files: character-service, use-user-library, campaign-service, library-service, api/characters, api/user/library, api/campaigns, characters/[id]/page, finalize-step, power/technique/item/creature creators | TASKs: TASK-148 | Summary:
  - Created /api/characters, /api/user/library/[type], /api/campaigns routes (Prisma, Supabase session)
  - Migrated character-service, use-user-library, campaign-service to fetch from API
  - Updated character sheet, finalize-step, creators to use new services/library-service
  - No Firestore imports in character-service, use-user-library, campaign-service
  - npm run build passes

- 2026-02-07 | agent:cursor | Session: Migration audit + TASK-144 — Documentation migration completion | files: archived_docs/*_FIREBASE.md, AGENTS.md, ARCHITECTURE.md, AGENT_GUIDE.md, README.md, ALL_FEEDBACK_CLEAN.md, update-admin-secrets.ps1 | TASKs: TASK-144 | Summary:
  - Archived DEPLOYMENT_SECRETS.md, ADMIN_SDK_SECRETS_SETUP.md, SECRETS_SETUP.md to src/docs/archived_docs/*_FIREBASE.md
  - Updated AGENTS.md: legacy Firebase path → archived_docs; AGENT_GUIDE.md: removed legacy useRTDB alias; ARCHITECTURE.md: RTDB→Codex, Firebase→Supabase/Prisma
  - README.md: added RealmsRPG stack line; ALL_FEEDBACK_CLEAN.md: SECRETS_SETUP→DEPLOYMENT_AND_SECRETS_SUPABASE
  - npm run build passes

- 2026-02-07 | agent:cursor | Session: TASK-149 — Migrate admin codex actions to Prisma | files: admin/codex/actions.ts | TASKs: TASK-149 | Summary:
  - Replaced getAdminFirestore with prisma; createCodexDoc, updateCodexDoc, deleteCodexDoc now use Prisma delegates
  - Codex CRUD writes to PostgreSQL via Prisma; getSession/isAdmin still use Firebase
  - npm run build passes

- 2026-02-07 | agent:cursor | Session: TASK-147 — Gold → currency terminology | files: AdminEquipmentTab.tsx, item-creator/page.tsx, item-transformers.ts, DOCUMENTATION_MIGRATION_AUDIT.md | TASKs: TASK-147 | Summary:
  - "gp"→"c", "Gold Cost"→"Currency Cost", "Base Gold"→"Base Currency" in UI
  - formatGold deprecated, use formatCurrency; legacy gold_cost documented

- 2026-02-07 | agent:cursor | Session: TASK-145 — RTDB → Codex rename | files: hooks/index.ts, use-rtdb.ts exports, equipment-step, finalize-step, feats-step, powers-step, add-skill-modal, add-sub-skill-modal, skills-allocation-page, species-modal, ancestry-step, characters/[id]/page.tsx, campaigns/.../page.tsx, admin/codex tabs, codex tabs, creature-creator, data-enrichment, feats-tab, library-section | TASKs: TASK-145 | Summary:
  - Removed useRTDBFeats/useRTDBSkills aliases; export useCodexFeats, useCodexSkills, Feat, Skill
  - Renamed rtdb*→codex*, source:'rtdb'→'codex', speciesTraitsFromRTDB→speciesTraitsFromCodex
  - RTDBEquipmentItem→CodexEquipmentItem in data-enrichment
  - npm run build passes

- 2026-02-07 | agent:cursor | Session: TASK-146 — Fix TypeScript build errors | files: finalize-step.tsx, powers-step.tsx, skills-step.tsx, species-step.tsx, add-skill-modal.tsx, add-sub-skill-modal.tsx, skills-allocation-page.tsx, game-data-service.ts | TASKs: TASK-146 | Summary:
  - Fixed implicit any in filter/map/forEach callbacks across character creator steps, skill modals, skills-allocation-page
  - Added RTDBSkill, Species, PowerPart, TechniquePart types; sortItems<T> generics; Set<string> for speciesSkillIds
  - game-data-service: cast arr for Object.fromEntries map
  - npm run build passes

- 2026-02-07 | agent:cursor | Session: Documentation migration audit — Firebase→Supabase | files: DOCUMENTATION_MIGRATION_AUDIT.md, DEPLOYMENT_AND_SECRETS_SUPABASE.md, AGENTS.md, AGENT_GUIDE.md, README.md, .cursor/rules/realms-project.mdc, MIGRATION_PLAN, AI_TASK_QUEUE.md | TASKs: TASK-144, TASK-145 (new) | Summary:
  - Created DOCUMENTATION_MIGRATION_AUDIT.md: full audit of docs to update/archive/delete; RTDB→Codex rename plan; coordination with Phase 4/5
  - Created DEPLOYMENT_AND_SECRETS_SUPABASE.md: new stack secrets/deploy doc (replaces DEPLOYMENT_SECRETS, SECRETS_SETUP, ADMIN_SDK_SECRETS_SETUP)
  - Updated AGENTS.md, AGENT_GUIDE.md, README.md, realms-project.mdc for Supabase/Prisma/Vercel
  - Added TASK-144 (documentation migration audit), TASK-145 (RTDB→Codex global rename)
  - Updated TASK-142, TASK-143 for Supabase scope
  - Added Phase 7b (Documentation Cleanup) to MIGRATION_PLAN

- 2026-02-06 | agent:cursor | Session: TASK-135 — Admin Codex UI polish | files: list-components.tsx, Admin*Tab.tsx (all 9), AI_TASK_QUEUE.md | TASKs: TASK-135 | Summary:
  - ColumnHeaders: dark mode (bg-primary-50 dark:bg-primary-900/30, text dark:text-primary-200)
  - Admin tabs: EmptyState for empty lists with Add action; delete button dark mode (text-red-600 dark:text-red-400, hover variants)
  - Build passes

- 2026-02-06 | agent:cursor | Session: TASK-122 done, Admin Codex fix | files: AdminTraitsTab.tsx, AI_TASK_QUEUE.md | TASKs: TASK-122, TASK-124–134 | Summary:
  - TASK-122: User added UID to config/admins in Firestore; marked done
  - Fixed AdminTraitsTab TypeScript error: editing state species type (species ?? []) when openEdit
  - Marked TASK-124 through TASK-134 done: Admin Codex page shell, CRUD actions, all editor tabs (Feats, Traits, Species, Skills, Parts, Properties, Equipment, Archetypes, Creature Feats)
  - Build passes

- 2026-02-06 | agent:cursor | Session: TASK-120 done, TASK-121, TASK-123 — Admin infrastructure | files: AI_TASK_QUEUE.md, src/lib/admin.ts, src/app/api/admin/check/route.ts, src/hooks/use-admin.ts, admin layout/page/codex, header.tsx, firestore.rules, ADMIN_SETUP.md | TASKs: TASK-120, TASK-121, TASK-123 | Summary:
  - TASK-120: Marked done (user completed migration)
  - TASK-121: isAdmin(uid) from Firestore config/admins or env; /api/admin/check; useAdmin hook; ADMIN_SETUP.md
  - TASK-123: Admin layout redirects non-admins; Admin nav link in header; /admin and /admin/codex placeholder
  - TASK-122 (USER): Add UID to config — see walkthrough below

- 2026-02-06 | agent:cursor | Session: TASK-116 through TASK-119 — RTDB→Firestore codex migration | files: firestore.rules, scripts/migrate_rtdb_to_firestore.js, src/hooks/use-firestore-codex.ts, src/hooks/use-rtdb.ts, src/hooks/index.ts, src/services/game-data-service.ts, src/lib/firebase/server.ts, species-modal.tsx | TASKs: TASK-116, TASK-117, TASK-118, TASK-119 | Summary:
  - TASK-116: Added Firestore rules for codex_* collections (feats, skills, species, traits, parts, properties, equipment, archetypes, creature_feats); public read, no client write
  - TASK-117: Created migration script (scripts/migrate_rtdb_to_firestore.js) with --dry-run; npm run migrate:rtdb-to-firestore
  - TASK-118: Created use-firestore-codex.ts with all codex hooks; hooks index exports from Firestore codex
  - TASK-119: game-data-service and firebase/server.ts read from Firestore; use-rtdb utilities use Firestore data; all consumers switched
  - Build passes. TASK-120 (USER): run migration script with credentials, then deploy rules

- 2026-02-06 | agent:cursor | Session: TASK-110 through TASK-115 — All remaining tasks complete | files: feats-tab.tsx, library-section.tsx, skills-allocation-page.tsx, feats-step.tsx, finalize-step.tsx, equipment-step.tsx, skill-row.tsx, creature-stat-block.tsx, sheet-action-toolbar.tsx, roll-log.tsx, modal.tsx, unified-selection-modal.tsx, health-energy-allocator.tsx, AI_TASK_QUEUE.md | TASKs: TASK-110, TASK-111, TASK-112, TASK-113, TASK-114, TASK-115 | Summary:
  - TASK-110: Feat delete gated on isEditMode (pencil enables); weapon/armor delete gated on isEditMode; equipment delete always visible
  - TASK-111: Equipment remove uses index-based fallback; verified flow
  - TASK-112: Added uppercase to skills-allocation-page section headers; verified ListHeader/SectionHeader/SortHeader
  - TASK-113: Full dark mode pass — feats-step, finalize-step, equipment-step, skill-row, creature-stat-block, sheet-action-toolbar, roll-log, modal, unified-selection-modal
  - TASK-114: HealthEnergyAllocator dark mode (HP/EN labels, status colors); text-text-secondary fix
  - TASK-115: Verified add-X modals use Modal + ListHeader + GridListRow; creature creator uses UnifiedSelectionModal
  - Build passes

- 2026-02-06 | agent:cursor | Session: Comprehensive audit, equip/delete fixes, dark mode pass | files: COMPREHENSIVE_AUDIT_2026-02-06.md, AI_TASK_QUEUE.md, characters/[id]/page.tsx, library-section.tsx, health-energy-allocator.tsx, finalize-step.tsx, feats-step.tsx, ancestry-step.tsx, abilities-section.tsx, creature-stat-block.tsx, archetype-section.tsx | Summary:
  - Audit: Created COMPREHENSIVE_AUDIT_2026-02-06.md with feedback consolidation, equip/delete gaps, header caps, dark mode, style consistency
  - Added TASK-109 through TASK-115 (equip verify, weapon/armor delete, inventory remove, header caps, full dark mode, style consistency, component reuse)
  - Equip/delete: Robust ID matching — pass item.id ?? item.name ?? i; handlers now support index-based fallback when id/name missing
  - Dark mode: Added dark: variants to health-energy-allocator, library-section DR, finalize-step, feats-step, ancestry-step, abilities-section, creature-stat-block, archetype-section
  - Build passes

- 2026-02-06 | agent:cursor | Session: Skill calculation fixes & character creator skills page overhaul | files: lib/game/skill-allocation.ts, lib/game/formulas.ts, skills-allocation-page.tsx, skills-step.tsx, skill-row.tsx, add-skill-modal.tsx, add-sub-skill-modal.tsx, finalize-step.tsx, characters/[id]/page.tsx, campaigns/.../page.tsx, GAME_RULES.md | Summary:
  - Skill points: 3/level for characters, 5/level for creatures
  - Species skills: 2 permanent, always proficient, can't remove; (species) tag; greyed X remove button
  - Skill point costs: 1 pt proficiency (base); 1 pt proficiency + 1 value (sub-skill); 1:1 value increase; 3 pts past cap (base), 2 pts past cap (sub-skill); 2 pts per defense +1
  - Defense: cannot increase if total bonus >= level
  - Shared SkillsAllocationPage: Add Skill/Sub-Skill modals, species skills section, defense allocation, point counter
  - Character creator skills-step: full rewrite using SkillsAllocationPage
  - Skill bonus formula: proficient = ability + skill value; added calculateSubSkillBonusWithProficiency for sub-skills
  - Finalize step: uses calculateSimpleSkillPointsSpent for validation; correct skill→array conversion with baseSkill/ability
  - Build passes

- 2026-02-06 | agent:cursor | Session: Character creator & sheet feedback batch | files: feats-step.tsx, equipment-step.tsx, finalize-step.tsx, sheet-header.tsx, character-sheet-utils.ts, character-creator-store.ts, library-section.tsx, roll-log.tsx | Summary:
  - Feats tab (character creator): Uses header same font size as other headers (text-xs); single unified list (archetype + character feats); feat type filter no duplicate "All Feats"; removed results count
  - Equipment tab: Source filter wired (library/rtdb); QuantitySelector for quantity steppers (shared component); removed duplicate "All Sources"
  - HP/Energy: enableHoldRepeat added to character creator finalize-step, character sheet sheet-header (creature creator already had it)
  - Energy max: character-sheet-utils now uses getArchetypeAbility (power + martial) instead of pow_abil only; fixes martial chars with 0 energy
  - Unarmed prowess: getCharacter now includes unarmedProwess in saved character
  - Roll log: fixed duplicate +/- (d20 + +5 → d20 + 5); negative modifiers show with − and red styling
  - Build passes

- 2026-02-06 | agent:cursor | Session: Encounters System Redesign (TASK-101 through TASK-108) | files: types/encounter.ts, services/encounter-service.ts, hooks/use-encounters.ts, hooks/index.ts, firestore.rules, app/(main)/encounters/page.tsx, app/(main)/encounters/[id]/page.tsx, app/(main)/encounters/[id]/combat/page.tsx, app/(main)/encounters/[id]/skill/page.tsx, app/(main)/encounters/[id]/mixed/page.tsx, app/(main)/encounter-tracker/page.tsx, app/(main)/encounter-tracker/redirect-page.tsx, components/shared/add-combatant-modal.tsx, components/layout/header.tsx, lib/game/encounter-utils.ts, AI_TASK_QUEUE.md | Summary:
  - TASK-101: Archetype slider hidden in non-edit mode; shows simple Power/Martial proficiency badges
  - TASK-102: AddCombatantModal with "From Library" tab; creature HP/EN auto-calculated; quantity selector with A-Z suffixes
  - TASK-103: Encounters hub page at /encounters with list, filter by type/status, search, sort, create modal (combat/skill/mixed)
  - TASK-104: Firestore persistence via encounter-service.ts (CRUD under users/{uid}/encounters); use-encounters.ts React Query hooks; Firestore rules
  - TASK-105: Combat tracker ported to /encounters/[id]/combat with Firestore auto-save via useAutoSave; loads by encounter ID
  - TASK-106: Skill encounter page at /encounters/[id]/skill with DS config, participant roll tracking, success/failure progress bars, game rules reference
  - TASK-107: Mixed encounter page at /encounters/[id]/mixed with tab-based combat/skill views, shared combatant/participant management
  - TASK-108: "From Campaign" tab in AddCombatantModal; fetches character data via API; auto-populates HP/EN/evasion/acuity
  - Nav updated: "Encounter Tracker" → "Encounters"; old /encounter-tracker redirects with optional localStorage import
  - encounter-utils.ts: calculateCreatureMaxHealth, calculateCreatureMaxEnergy helpers
  - Build passes

- 2026-02-06 | agent:cursor | Session: Campaign roll log follow-up | files: campaign-roll.ts, campaign-roll-service.ts, use-campaign-rolls.ts, roll-context.tsx, roll-log.tsx, campaigns/[id]/page.tsx, campaigns/[id]/view/.../page.tsx, characters/[id]/page.tsx, campaign-service.ts, use-campaigns.ts, firestore.rules, hooks/index.ts | Summary:
  - Campaign view page: pass campaignContext to RollProvider, add RollLog with Personal/Campaign toggle
  - Campaign detail page: Campaign Roll Log section for RM (and all members) using useCampaignRolls, RollEntryCard
  - Character sheet: pass campaignContext when character is in a campaign (useCampaignsFull), rolls sync to campaign
  - Firestore rules for campaigns/{id}/rolls: read/create/delete for owner or members
  - useCampaignRolls exported from hooks; RollEntryCard exported for reuse; getMyCampaignsFull + useCampaignsFull for character-in-campaign lookup
  - Build passes

- 2026-02-06 | agent:cursor | Session: Campaigns — 10-char cap, constants, DeleteConfirmModal, tasks | files: campaigns/constants.ts, campaigns/actions.ts, campaigns/[id]/page.tsx, campaigns/page.tsx, AI_TASK_QUEUE.md | Summary:
  - Added MAX_CAMPAIGN_CHARACTERS (10) and OWNER_MAX_CHARACTERS (5) to campaigns/constants.ts
  - joinCampaignAction and addCharacterToCampaignAction enforce 10-char cap
  - Campaign detail: isCampaignFull alert, invite code note when full, canAddOwnCharacters respects cap
  - Replaced delete campaign Modal with DeleteConfirmModal
  - Join tab: router.push for Create Character (in-app nav)
  - TASK-099: return to Join tab after creating character
  - TASK-100: Firestore onSnapshot for real-time campaign updates
  - Build passes

- 2026-02-06 | agent:cursor | Session: Campaigns feature | files: campaigns/page.tsx, campaigns/[id]/page.tsx, campaigns/[id]/view/[userId]/[characterId]/page.tsx, campaigns/actions.ts, campaign-service.ts, use-campaigns.ts, campaign.ts (types), header.tsx, character.ts, notes-tab.tsx, library-section.tsx, data-enrichment.ts, firestore.rules, firestore.indexes.json, api/campaigns/.../route.ts | Summary:
  - Campaigns page in nav: Create Campaign, Join Campaign, My Campaigns tabs
  - Create campaign with name/description; unique 8-char invite code
  - Join via invite code; select character or create new
  - Campaign detail: character roster (portrait, name, level, species, archetype), invite code copy, add/remove characters
  - Owner (Realm Master) can add up to 5 own characters; others add 1 when joining
  - Character visibility: private, campaign, or public (Notes tab)
  - API route for RM to view player character sheets (read-only) when visibility allows
  - Firestore rules for campaigns (read: owner or member; create: auth; update/delete: owner only)
  - Build passes

- 2026-02-06 | agent:cursor | Session: TASK-098 — Dark mode contrast fixes | files: recovery-modal.tsx, innate-toggle.tsx, skill-row.tsx, dice-roller.tsx, CombatantCard.tsx, theme-toggle.tsx, proficiencies-tab.tsx, tab-summary-section.tsx, grid-list-row.tsx, add-sub-skill-modal.tsx, encounter-tracker/page.tsx, AI_TASK_QUEUE.md | TASK: TASK-098 | Summary:
  - Recovery modal: allocation buttons (violet), hours selection hover, manual allocation labels, preview text, automatic caption
  - Innate toggle: active state dark variant, hover text contrast
  - Skill row: bonus colors (green/red/blue) for table/card/compact variants
  - Dice roller: history button, last roll total, modifier, roll total in history
  - CombatantCard: isDead, isDragOver, Current/Down badges, HP/EN labels, condition pills, damage/heal/energy pills, Conditions button, Remove hover
  - Theme toggle: selected state for inline and dropdown
  - Proficiencies tab: unarmed prowess selected state, TP cost chip
  - Tab summary section: SummaryItem highlightColors (primary, success, warning, danger, power, martial)
  - Grid list row: innate badge (★)
  - Add sub skill modal: base skill info box, amber hint text
  - Encounter tracker page: auto-saved text, round badge, Ally/Enemy/Companion radio labels
  - Build passes

- 2026-02-06 | agent:cursor | Session: TASK-096 — Split encounter-tracker page | files: encounter-tracker/page.tsx, CombatantCard.tsx, encounter-tracker-types.ts, encounter-tracker-constants.ts | Summary:
  - Extracted CombatantCard (~380 lines) to separate file
  - Extracted encounter-tracker-types.ts (Combatant, CombatantCondition, ConditionDef, EncounterState, CombatantCardProps)
  - Extracted encounter-tracker-constants.ts (STORAGE_KEY, CONDITION_OPTIONS)
  - Main page reduced from ~1335 to ~855 lines; build passes

- 2026-02-06 | agent:cursor | Session: TASK-096 — Split power-creator page | files: power-creator/page.tsx, PowerPartCard.tsx, PowerAdvancedMechanics.tsx, power-creator-types.ts, power-creator-constants.ts | Summary:
  - Extracted PowerPartCard (~260 lines), PowerAdvancedMechanicsSection (~270 lines)
  - Extracted power-creator-types.ts (SelectedPart, AdvancedPart, DamageConfig, RangeConfig)
  - Extracted power-creator-constants.ts (POWER_CREATOR_CACHE_KEY, ADVANCED_CATEGORIES, EXCLUDED_PARTS)
  - Main page reduced from ~1673 to ~950 lines; build passes

- 2026-02-06 | agent:cursor | Session: TASK-096 — Split codex and library pages | files: codex/page.tsx, CodexFeatsTab.tsx, CodexSkillsTab.tsx, CodexSpeciesTab.tsx, CodexEquipmentTab.tsx, CodexPropertiesTab.tsx, CodexPartsTab.tsx, library/page.tsx, LibraryPowersTab.tsx, LibraryTechniquesTab.tsx, LibraryItemsTab.tsx, LibraryCreaturesTab.tsx, AI_TASK_QUEUE.md | TASK: TASK-096 | Summary:
  - Codex: Extracted 6 tab components (Feats, Skills, Species, Equipment, Properties, Parts); main page ~65 lines
  - Library: Extracted 4 tab components (Powers, Techniques, Items, Creatures); main page ~165 lines
  - All extracted components <400 lines; build passes
  - Remaining large files (power-creator, characters/[id], creature-creator, encounter-tracker) can be split incrementally in future

- 2026-02-06 | agent:cursor | Session: TASK-093, TASK-094, TASK-095, TASK-097 — UI unification | files: item-list.tsx, tag-filter.tsx, select-filter.tsx, chip-select.tsx, checkbox-filter.tsx, ability-requirement-filter.tsx, codex/page.tsx, item-card.tsx, about/page.tsx, notes-tab.tsx, dice-roller.tsx, encounter-tracker/page.tsx, item-creator/page.tsx, power-creator/page.tsx, globals.css, AI_TASK_QUEUE.md | TASKs: TASK-093, TASK-094, TASK-095, TASK-097 | Summary:
  - TASK-093: Template literal → cn() in item-list, 5 filter components, codex chip, item-card req.met, about carousel
  - TASK-094: Replaced 5 inline buttons with Button: notes-tab fall damage, dice-roller roll, encounter-tracker Add/Add Custom, item-creator Add Property, power-creator Add Part
  - TASK-095: item-list search → SearchInput; ability-requirement-filter max value → Input
  - TASK-097: Added .filter-group to globals.css (flex layout); all 5 filters already use cn('filter-group', className)
  - Build passes

- 2026-02-06 | agent:cursor | Session: Reconciliation tasks TASK-078 through TASK-089 | files: dice-roller.tsx, library-section.tsx, unified-selection-modal.tsx, add-skill-modal.tsx, add-sub-skill-modal.tsx, LoadFromLibraryModal.tsx, resources/page.tsx, notes-tab.tsx, button.tsx, globals.css, recovery-modal.tsx, skill-row.tsx, grid-list-row.tsx, archetype-section.tsx, tab-summary-section.tsx, innate-toggle.tsx, ability-score-editor.tsx, ancestry-step.tsx, feats-step.tsx, equipment-step.tsx, codex/page.tsx, power-creator/page.tsx, technique-creator/page.tsx, item-creator/page.tsx, characters/[id]/page.tsx, proficiencies-tab.tsx, filter-section.tsx, creature-stat-block.tsx, list-components.tsx, AI_TASK_QUEUE.md | TASKs: TASK-078, TASK-079, TASK-080, TASK-081, TASK-082, TASK-083, TASK-084, TASK-085, TASK-086, TASK-087, TASK-088, TASK-089 | Summary:
  - TASK-078: Dice roller uses custom PNGs; die type selection with images + labels; DieResultDisplay for roll results
  - TASK-079: Weapon columns include Attack bonus (+N Abbr)
  - TASK-080: Unified Selection Modal "Add" header replaced with empty slot
  - TASK-081: Add Skill/Sub-Skill modals use ListHeader + sort; item count removed from sub-skill
  - TASK-082: LoadFromLibraryModal footer (item count) removed
  - TASK-083: Button gradients removed (resources, notes-tab); deprecated gradient variant removed
  - TASK-084: Dark mode pass — recovery-modal, skill-row, grid-list-row, archetype-section, tab-summary-section, notes-tab, library-section, innate-toggle, ability-score-editor, ancestry/feats/equipment steps, codex
  - TASK-085: Power/technique/item creator summaries sticky (top-24, max-h)
  - TASK-086: Full recovery only resets feats with Full/Partial recovery; one-time-use preserved
  - TASK-087: Unused Chevron imports removed from library-section, proficiencies-tab
  - TASK-088: Chevron layout shift fixed — filter-section, creature-stat-block, list-components use single icon + rotation
  - TASK-089: LoadFromLibraryModal uses GridListRow, ListHeader, sortable columns
  - Build passes

- 2026-02-05 | agent:cursor | Session: TASK-074, TASK-075 — Dark mode + session API | files: globals.css, list-header.tsx, grid-list-row.tsx, value-stepper.tsx, sheet-header.tsx, server.ts, SECRETS_SETUP.md, AI_TASK_QUEUE.md | TASKs: TASK-074, TASK-075 | Summary:
  - TASK-074: Dark mode — softer chip, stepper, ListHeader, GridListRow, health/energy, power/martial colors; CSS vars for status colors
  - TASK-075: Added GOOGLE_APPLICATION_CREDENTIALS_JSON support for full service account JSON from Secret Manager
  - Build passes

- 2026-02-05 | agent:cursor | Session: TASK-072, TASK-073, TASK-076, TASK-077 — Character sheet + storage + username | files: characters/[id]/page.tsx, sheet-header.tsx, storage.rules, my-account/page.tsx, AI_TASK_QUEUE.md, ALL_FEEDBACK_CLEAN.md | TASKs: TASK-072, TASK-073, TASK-076, TASK-077 | Summary:
  - TASK-072: Health/Energy allocation — when increasing max and current===max, bump current by same delta
  - TASK-073: Speed/Evasion — pencil icon toggles base edit; red when base>default, green when base<default
  - TASK-076: Storage rules — added portraits/{userId}/** and profile-pictures/{fileName} for authenticated users
  - TASK-077: Username pattern — changed to [-a-zA-Z0-9_]+ to fix invalid character class error
  - Build passes

- 2026-02-05 | agent:cursor | Session: Roll Log, Modals, Buttons — feedback implementation | files: roll-context.tsx, roll-log.tsx, abilities-section.tsx, skills-section.tsx, add-feat-modal.tsx, add-skill-modal.tsx, modal.tsx, roll-button.tsx, dice-roller.tsx, ALL_FEEDBACK_CLEAN.md | Summary:
  - Roll Log titles: Removed "Save"/"Check"; abilities/defenses use display name only (e.g. "Acuity", "Discernment"); skills use "Athletics (STR)" format
  - Roll Log layout: Single-row boxes (1d20 X + Bonus = Total); roll=light grey, bonus=green, total=blue; smaller timestamp
  - Modals: overflow-hidden for uniform rounded corners; add-feat uses ListHeader, removed Add column title; add-skill header rounded/inset
  - Buttons: RollButton, roll-log, dice-roller use solid colors (no gradients); matching btn-solid/btn-outline-clean style
  - Build passes

- 2026-02-05 | agent:cursor | Session: TASK-068, TASK-070 — Creature creator modals + summary | files: creature-creator/page.tsx, creator-summary-panel.tsx, AI_TASK_QUEUE.md | TASKs: TASK-068, TASK-070 | Summary:
  - TASK-068: Replaced ItemSelectionModal with UnifiedSelectionModal for powers/techniques/feats/armaments; GridListRow list with sortable columns
  - TASK-070: CreatorSummaryPanel resourceBoxes + lineItems; creature summary: resource boxes at top, stat rows, line items (Skills: X +3, Resistances: Y)

- 2026-02-05 | agent:cursor | Session: Creature creator + stepper tasks (TASK-065–071) | files: creature-creator/page.tsx, powered-martial-slider.tsx, grid-list-row.tsx, globals.css, abilities-section.tsx, AI_TASK_QUEUE.md | TASKs: TASK-065, TASK-066, TASK-067, TASK-069, TASK-071 | Summary:
  - TASK-065: Added enableHoldRepeat to creature creator HealthEnergyAllocator
  - TASK-066: Removed enableHoldRepeat from creature creator DefenseBlock
  - TASK-067: GridListRow expanded content — py-3/py-4 equal padding, description mb-3
  - TASK-069: PoweredMartialSlider min=1, max=maxPoints-1 when maxPoints>1; clamps on init
  - TASK-071: Defense steppers xs→sm; btn-stepper colors softened (red-50/green-50)
  - Build passes

- 2026-02-06 | agent:cursor | Session: TASK-064 — Game rules audit fixes | files: creature-stat-block.tsx, item-creator/page.tsx, creature-creator/page.tsx, encounter-tracker/page.tsx, GAME_RULES_AUDIT.md, AI_TASK_QUEUE.md | TASK: TASK-064 | Summary:
  - CreatureStatBlock: Realms ability order (STR, VIT, AGI, ACU, INT, CHA); legacy map for intellect/perception/willpower; grid-cols-6
  - Item creator: "ability score" → "Ability"
  - Creature creator + encounter-tracker: "Reflex" → "Reflexes"
  - Build passes

- 2026-02-06 | agent:cursor | Session: GAME_RULES workflow + audit | files: AGENTS.md, realms-tasks.mdc, AGENT_GUIDE.md, GAME_RULES_AUDIT.md, AI_TASK_QUEUE.md, README.md | Summary:
  - Added GAME_RULES.md to agent workflows: AGENTS.md (reference when needed), realms-tasks.mdc (before implementing + feedback cross-reference), AGENT_GUIDE.md (when to use)
  - Created GAME_RULES_AUDIT.md: audit of code vs Core Rulebook — terminology, descriptions, schema mismatches
  - Created TASK-064: Fix CreatureStatBlock ability schema (intellect/perception/willpower → acuity/intelligence/charisma), "ability score" → "Ability" in copy, Reflex → Reflexes

- 2026-02-05 | agent:cursor | Session: TASK-062, TASK-063 — Section heights and creature creator alignment | files: characters/[id]/page.tsx, creature-creator/page.tsx | TASKs: TASK-062, TASK-063 | Summary:
  - TASK-062: Added min-h-[400px] to Skills, Archetype, and Library section wrappers for uniform height when adjacent
  - TASK-063: Basic Info layout — Name/Level/Type/Size in single responsive row; Level w-20, Type w-36, Size w-28; items-end for alignment

- 2026-02-06 | agent:cursor | Session: Documentation overhaul — architecture, game rules, agent guide | files: ARCHITECTURE.md, GAME_RULES.md, AGENT_GUIDE.md, UI_COMPONENT_REFERENCE.md, DOCS_AUDIT_REPORT.md, README.md, UNIFICATION_STATUS.md, AGENTS.md, ALL_FEEDBACK_CLEAN.md | Summary:
  - Created ARCHITECTURE.md: Firebase structure, data flow, enrichment pipeline, hooks/services
  - Created GAME_RULES.md: Skill caps (3), defense caps, progression, ability costs, recovery rules
  - Updated AGENT_GUIDE: Common file path corrections, component decision tree, hooks table, character creator step order
  - Updated UI_COMPONENT_REFERENCE: Component decision tree (GridListRow vs ItemCard vs ItemList)
  - Updated DOCS_AUDIT_REPORT: Reflected resolved items, added new docs section
  - Updated README, UNIFICATION_STATUS, AGENTS.md, ALL_FEEDBACK_CLEAN with new doc references

- 2026-02-05 | agent:cursor | Session: TASK-049 — Sortable list headers in library-section | files: library-section.tsx | TASK: TASK-049 | Summary:
  - Library-section had clickable ListHeaders but data wasn't sorted
  - Added sortByCol helper and useMemo for all 6 lists (innate/regular powers, techniques, weapons, armor, equipment)
  - Clicking column headers now sorts the displayed data

- 2026-02-05 | agent:cursor | Session: TASK-053 — Feat deletion confirmation | files: characters/[id]/page.tsx, feats-tab.tsx, delete-confirm-modal.tsx | TASK: TASK-053 | Summary:
  - Added DeleteConfirmModal before feat removal on character sheet
  - FeatsTab onRemoveFeat now accepts (featId, featName) for modal display
  - Extended DeleteConfirmModal with deleteContext prop (library/character)
  - Clicking feat delete opens confirmation; Cancel closes, Confirm removes

- 2026-02-05 | agent:cursor | Session: TASK-054 — Agent verification guidelines | files: AGENT_GUIDE.md, AI_TASK_QUEUE.md | TASK: TASK-054 | Summary:
  - Added "Verification Before Marking Done" section to AGENT_GUIDE with 4-step checklist
  - Covers acceptance criteria, related_files paths, build, manual check
  - Marked TASK-054 done

- 2026-02-05 | agent:cursor | Session: Docs & task compliance audit | files: DOCS_AUDIT_REPORT.md, AI_TASK_QUEUE.md, AGENTS.md, AGENT_GUIDE.md, UNIFICATION_STATUS.md | Summary:
  - Created DOCS_AUDIT_REPORT.md with compliance findings
  - TASK-022: Added compliance gap note (missing confirmation dialog); created TASK-053
  - TASK-048: Marked done (already implemented)
  - Fixed stale related_files in TASK-016, TASK-027, TASK-030, TASK-031, TASK-032
  - Added TASK-053 (feat deletion confirmation), TASK-054 (agent verification guidelines)
  - Updated AGENTS.md, AGENT_GUIDE.md with verification steps

- 2026-02-05 | agent:cursor | Session: Cursor workflow optimization | files: .cursor/rules/*.mdc, AGENTS.md, src/docs/ai/AGENT_GUIDE.md, src/docs/UNIFICATION_STATUS.md, src/docs/README.md, equipment-step.tsx | Summary:
  - Created .cursor/rules/ with realms-project, realms-unification, realms-tasks rules
  - Created root AGENTS.md for Cursor agent instructions
  - Replaced AI_AGENT_README + AGENT_SOURCES_OF_TRUTH with single AGENT_GUIDE.md (verified against codebase)
  - Deleted AGENT_SESSION_PROMPT.md, TASK_CREATION_GUIDE.md (consolidated into AGENT_GUIDE)
  - Created UNIFICATION_STATUS.md with verified component usage from codebase audit
  - Fixed equipment-step.tsx: bg-gray-100 → bg-surface-alt for design token consistency
  - Added src/docs/README.md as docs index; updated AI_TASK_QUEUE, ALL_FEEDBACK_CLEAN references

- 2026-02-05 | agent:ai-copilot | Created AI docs skeleton | files: src/docs/ai/* | PR: 

- 2026-02-05 | agent:claude-opus | Session: UI fixes and new components | files: header.tsx, theme-provider.tsx, theme-toggle.tsx, powered-martial-slider.tsx, innate-toggle.tsx, grid-list-row.tsx, library-section.tsx, archetype-selector.tsx, archetype-section.tsx, layout.tsx | TASKs: TASK-005, TASK-009, TASK-011, TASK-013, TASK-014, TASK-015, TASK-016 | Summary:
  - TASK-011: Fixed login redirect (sessionStorage in header.tsx)
  - TASK-014: Replaced login icon with Button component
  - TASK-013: Added theme toggle (next-themes, ThemeProvider, ThemeToggle)
  - TASK-015: Created PoweredMartialSlider shared component
  - TASK-016: Audited stepper styles (already unified via ValueStepper)
  - TASK-005/TASK-009: Created InnateToggle with 44px touch target, updated GridListRow
  - TASK-012: Security audit complete (documented gaps: OAuth email change, username, profile pic)

- 2026-02-05 | agent:claude-opus | Session: Recovery Modal + Bug Fixes | files: recovery-modal.tsx, library-section.tsx, notes-tab.tsx, characters/[id]/page.tsx, use-rtdb.ts | TASKs: TASK-017, TASK-018, TASK-019 | Summary:
  - TASK-017: Created RecoveryModal with full/partial recovery modes, automatic optimization, HP/EN slider, feat/trait reset
  - TASK-018: Fixed negative weight/height by adding min=1 validation
  - TASK-019: Fixed inventory deletion by removing isEditMode requirement from delete buttons

- 2026-02-06 | agent:claude-opus | Session: RTDB Enrichment + Library Edit + Skill Unification + Audit | files: library/page.tsx, item-creator/page.tsx, skills-step.tsx, AI_TASK_QUEUE.md | TASKs: TASK-001, TASK-002, TASK-003, TASK-004, TASK-006, TASK-007, TASK-008, TASK-010 | Summary:
  - TASK-004/TASK-006: Fixed library page early return that blocked display while RTDB loaded (removed !partsDb.length check from PowersTab and TechniquesTab)
  - TASK-003: Added ?edit= URL parameter handling to item-creator with useSearchParams + Suspense wrapper; changed Edit button to use router.push for in-app navigation
  - TASK-001: Unified skill rows in character-creator skills-step.tsx - replaced inline SkillAllocator/SubSkillAllocator with shared SkillRow component (variant='card' for base skills, variant='compact' for sub-skills)
  - TASK-002: Audit complete - all list pages and modals already use unified patterns (GridListRow or ItemCard)
  - TASK-007/TASK-008/TASK-010: Marked as done (duplicates/related to completed tasks)

- 2026-02-05 | agent:claude-opus | Session: UI Polish - Edit Icons, Energy Buttons, Equip Toggle | files: edit-section-toggle.tsx, equip-toggle.tsx, sheet-header.tsx, library-section.tsx, characters/[id]/page.tsx, AI_TASK_QUEUE.md | TASKs: TASK-020, TASK-021, TASK-024, TASK-028, TASK-034 | Summary:
  - TASK-028: Verified ListHeader and SortHeader already use uppercase styling - all list headers display in caps
  - TASK-034: Fixed equip toggle bug - created EquipToggle component with Circle/CheckCircle2 icons; updated handlers to match by ID or name since equipment stored as {name, equipped} without ID
  - TASK-020: Removed circular backgrounds from EditSectionToggle; updated sheet-header name/XP icons to use Pencil with blue color for consistency
  - TASK-021: Character name only editable in edit mode (onNameChange conditionally passed based on isEditMode); XP always editable
  - TASK-024: Energy cost buttons for powers/techniques styled like RollButton - moved energy to rightmost column, displays just the number (not "Use (X)"), powers use blue variant, techniques use green

- 2026-02-05 | agent:claude-opus | Session: New Feedback Triage + TASK-028 | files: list-components.tsx, ALL_FEEDBACK_CLEAN.md, AI_TASK_QUEUE.md | TASKs: TASK-020 to TASK-037 created, TASK-028 partial | Summary:
  - Added 18 new tasks (TASK-020 to TASK-037) from owner feedback covering: edit icon unification, character name/XP editing, feat deletion, custom note collapse bug, energy buttons styling, innate energy text, power/technique display formatting, list header caps, column alignment, character saved prompt, top bar relocation, dice roller overhaul, chip expansion, equip toggle fix, equipment tab fixes, archetype ability indicators, ability edit centering
  - TASK-028: Updated SortHeader component to use uppercase, text-xs, font-semibold styling to match ListHeader

- 2026-02-06 | agent:claude-opus | Session: AI Workflow Enhancement - Dynamic Task Creation | files: AI_AGENT_README.md, AI_TASK_QUEUE.md, AGENT_SOURCES_OF_TRUTH.md, TASK_CREATION_GUIDE.md | Summary:
  - Updated AI workflow documentation to enable dynamic task creation during agent work sessions
  - Added "Create new tasks dynamically" section to AI_AGENT_README.md agent responsibilities
  - Added comprehensive "Creating new tasks dynamically" guidelines to AI_TASK_QUEUE.md with when/how/examples
  - Updated AGENT_SOURCES_OF_TRUTH.md workflow preferences to encourage immediate task creation during audits/investigations
  - Created TASK_CREATION_GUIDE.md - 300+ line comprehensive guide covering: philosophy, when to create tasks, how to create tasks, YAML examples, anti-patterns, workflow integration, benefits
  - Purpose: Prevent audit/review findings from being documented but not acted upon; enable agents to break down complex work, create follow-up tasks during implementation, and act on discoveries immediately

- 2026-02-05 | agent:claude-opus | Session: New Feedback + Quick Wins + Feat Deletion | files: abilities-section.tsx, sheet-header.tsx, skills-section.tsx, library-section.tsx, notes-tab.tsx, feats-tab.tsx, characters/[id]/page.tsx, ALL_FEEDBACK_CLEAN.md, AI_TASK_QUEUE.md | TASKs: TASK-022, TASK-023, TASK-025, TASK-038, TASK-040, TASK-042, TASK-043 + TASK-038-045 created | Summary:
  - Processed 8 new raw feedback entries → created TASK-038 through TASK-045
  - TASK-038: Removed enableHoldRepeat from ability/defense steppers (4 buttons in abilities-section.tsx); HP/EN and dice roller still have it
  - TASK-042: Separated species from level in header with · separator and font-medium
  - TASK-043: Hidden skill point display (PointStatus) when not in edit mode
  - TASK-025: Updated innate energy summary text + centered it
  - TASK-023: Fixed custom note name edit collapsing the note (stopPropagation on name click/input)
  - TASK-040: Capitalized Currency label, separated from armament proficiency with divider, increased tab size sm→md, changed defense roll buttons from 'defense' to 'primary' variant
  - TASK-022: Wired up feat deletion - added onRemoveFeat to LibrarySectionProps, passed through to FeatsTab, created handleRemoveFeat handler in page.tsx, removed isEditMode guard

- 2026-02-06 | agent:claude-opus | Session: High Priority Tasks + Medium Batch | files: skills-section.tsx, abilities-section.tsx, library-section.tsx, health-energy-allocator.tsx, characters/[id]/page.tsx, skills-step.tsx, creator-constants.ts, AI_TASK_QUEUE.md | TASKs: TASK-026, TASK-027, TASK-030, TASK-036, TASK-037, TASK-039, TASK-044, TASK-045 | Summary:
  - TASK-039: Implemented skill value cap (max 3) - added MAX_SKILL_VALUE constant, checks in handleSkillIncrease for both base and sub-skills, disabled increment button at max
  - TASK-044: Fixed skill point display from 5/5 to 3/3 - added characterSpeciesSkills lookup in page.tsx, subtract species count from total, exclude species proficiency from spent calculation in both page.tsx and skills-section.tsx, updated character creator to match
  - TASK-045: Unified HP/EN allocation inline variant to match card variant - replaced gradient bg with state-based borders (green/red/neutral), matching header/status bar structure
  - TASK-026: Added power display formatting - capitalize damage types, abbreviate durations (MIN/RNDS/RND/HR), "Target" for single target, strip parenthetical focus/sustain details from overview
  - TASK-036: Replaced emoji archetype indicators (🔮/⚔️) with colored borders - purple for power ability, red for martial, removed emoji labels from ability names
  - TASK-037: Centered ability/skill point displays in edit mode - switched from flex-wrap with spacer to flex-col items-center layout
  - TASK-030: Removed "Character saved" toast notification, kept only top bar save state indicator
  - TASK-027: Removed 'radiant' from selectable damage types in MAGIC_DAMAGE_TYPES and ALL_DAMAGE_TYPES, replaced with 'light' (proper Realms damage type), kept radiant→light mapping as legacy fallback

- 2026-02-06 | agent:claude-opus | Session: Polish Batch - Toolbar, Dice, Alignment, Equipment, Chips | files: sheet-action-toolbar.tsx, roll-log.tsx, roll-context.tsx, grid-list-row.tsx, library-section.tsx, characters/[id]/page.tsx, character-sheet/index.ts | TASKs: TASK-029, TASK-031, TASK-032, TASK-033, TASK-035 | Summary:
  - TASK-031: Created SheetActionToolbar floating component (fixed top-24 right-4) with Edit/Recovery/LevelUp/Save circular icon buttons; replaced sticky top bar in page.tsx
  - TASK-032: Rewrote roll-log with custom dice PNG images (D4-D20), localStorage persistence (last 20 rolls), grouped dice display with images, simplified to "Custom Roll" only, crit bonuses (+2 nat 20, -2 nat 1)
  - TASK-029: Added align prop to ColumnValue interface, restructured power/technique/weapon grid templates to match row slot layout, centered all data columns across all tabs
  - TASK-035: Added type column and rarity/cost badges to equipment rows, enabled quantity editing outside edit mode, added description prop and compact mode
  - TASK-033: Rewrote chip expansion to expand inline (same chip grows with description below label, maintaining category colors), tag chips non-expandable, removed separate detail bubble

- 2026-02-06 | agent:claude-opus | Session: Codebase Health Audit — Dead Code, Deduplication, Unification, Best Practices | files: lib/utils/*.ts, lib/utils/index.ts, lib/constants/skills.ts, lib/constants/colors.ts (deleted), lib/item-transformers.ts, components/shared/list-components.tsx, components/shared/list-header.tsx, components/shared/index.ts, components/shared/item-card.tsx, components/shared/grid-list-row.tsx, components/shared/roll-button.tsx, components/shared/skill-row.tsx, components/shared/unified-selection-modal.tsx, components/shared/item-list.tsx, components/shared/part-chip.tsx, components/creator/ability-score-editor.tsx, components/creator/LoadFromLibraryModal.tsx, components/character-sheet/abilities-section.tsx, components/character-sheet/roll-log.tsx, components/character-sheet/notes-tab.tsx, components/character-sheet/add-library-item-modal.tsx, components/character-sheet/proficiencies-tab.tsx, components/character-creator/steps/skills-step.tsx, components/character-creator/steps/species-step.tsx, components/character-creator/steps/finalize-step.tsx, app/(main)/codex/page.tsx, app/(main)/library/page.tsx, app/(main)/my-account/page.tsx, app/(auth)/login/page.tsx, app/(auth)/register/page.tsx, types/items.ts, types/index.ts | TASKs: TASK-090 | Summary:
  - Consolidated 6 duplicate formatBonus functions into single canonical export in lib/utils/number.ts
  - Removed ~60 unused utility exports from array.ts, number.ts, string.ts, object.ts (dead code)
  - Consolidated 3 duplicate SortState type definitions into canonical export from list-header.tsx; renamed items.ts version to ItemSortState
  - Removed deprecated/unused list-components exports (SimpleEmptyState, LoadingSpinner, ResultsCount, ListContainer)
  - Deleted entirely unused lib/constants/colors.ts (BADGE_COLORS, ROLL_TYPE_COLORS, getCategoryClasses — never imported)
  - Replaced 8 custom spinner implementations with shared Spinner component
  - Replaced 6 inline textareas with Textarea component
  - Fixed 6 hardcoded neutral-* colors in roll-log.tsx with design tokens
  - Converted 6 template-literal classNames to cn() utility (item-card, recovery-modal, my-account)
  - Fixed index-as-key in proficiencies-tab, grid-list-row, part-chip with stable keys
  - Removed 2 console.debug statements from lib/firebase/client.ts (production cleanup)
  - Created 7 follow-up tasks (TASK-091 through TASK-097) for remaining consolidation opportunities:
    TASK-091: Extract useSort hook (eliminates 20+ duplicate toggleSort/handleSort)
    TASK-092: Import SortState type from shared (11 inline definitions)
    TASK-093: Remaining template literal → cn() conversions (9 instances)
    TASK-094: Inline button → Button component (5 instances)
    TASK-095: Raw inputs → Input/SearchInput (2 instances)
    TASK-096: Split large page components >1000 lines (6 files)
    TASK-097: Unify filter component className patterns (5 files)

- 2026-02-06 | agent:claude-opus | TASK-091: Extract useSort hook | files: src/hooks/use-sort.ts, src/hooks/index.ts, LoadFromLibraryModal.tsx, add-skill-modal.tsx, add-sub-skill-modal.tsx, add-feat-modal.tsx, add-library-item-modal.tsx, unified-selection-modal.tsx, library-section.tsx, feats-tab.tsx, library/page.tsx, codex/page.tsx | TASK: TASK-091 | Summary:
  Created shared useSort hook with toggleSort and sortByColumn utilities. Replaced 20+ duplicate implementations across 12 files. Single source of truth for list sorting logic. (required fields on task completion):

- 2026-02-06 | agent | TASK-096: Split creature-creator page | files: creature-creator/creature-creator-types.ts, creature-creator-constants.ts, CreatureCreatorHelpers.tsx, LoadCreatureModal.tsx, page.tsx | TASK: TASK-096 | Summary:
  Extracted creature-creator (~1580 lines) into: creature-creator-types.ts (CreatureSkill, CreatureState), creature-creator-constants.ts (LEVEL_OPTIONS, SENSES, MOVEMENT_TYPES, SENSE_TO_FEAT_ID, MOVEMENT_TO_FEAT_ID, initialState, CREATURE_CREATOR_CACHE_KEY), CreatureCreatorHelpers.tsx (ChipList, ExpandableChipList, AddItemDropdown, DefenseBlock, displayItemToSelectableItem), LoadCreatureModal.tsx. Main page reduced significantly. Build passes.

- 2026-02-06 | agent | TASK-096: Split characters/[id] page | files: characters/[id]/character-sheet-utils.ts, CharacterSheetModals.tsx, page.tsx | TASK: TASK-096 | Summary:
  Extracted character sheet (~1586 lines) into: character-sheet-utils.ts (calculateStats), CharacterSheetModals.tsx (AddLibraryItemModal, DeleteConfirmModal, AddFeatModal, AddSkillModal, AddSubSkillModal, LevelUpModal, RecoveryModal). Main page reduced by ~200 lines. Build passes.

- 2026-02-11 | agent | TASK-174, TASK-175: Codex schema Use column + remove trained_only | files: src/docs/CODEX_SCHEMA_REFERENCE.md, src/hooks/use-rtdb.ts, src/app/api/codex/route.ts, src/app/(main)/admin/codex/AdminSkillsTab.tsx, scripts/migrate_rtdb_to_firestore.js, src/docs/ALL_FEEDBACK_CLEAN.md, src/docs/ai/AI_TASK_QUEUE.md | TASK: TASK-174,TASK-175 | pr_link: (pending local changes) | merged_at: 2026-02-11 | Summary:
  Extended CODEX_SCHEMA_REFERENCE so each codex field includes a concrete “Use” explanation and aligned the feat/skill/species/trait/item/part/property/creature-feat tables with the RTDB DATA REVIEW and latest owner spec. Removed the invalid `trained_only` field from the skills schema across docs, TypeScript types, the Codex API payload, the Admin Skills editor, and the RTDB→Firestore migration script, so future work no longer relies on it.

- 2026-02-11 | agent | TASK-176–TASK-180: Codex seeding and feat.skill_req IDs | files: scripts/seed-to-supabase.js, src/docs/CODEX_SCHEMA_REFERENCE.md, src/docs/ALL_FEEDBACK_CLEAN.md, src/docs/ai/AI_TASK_QUEUE.md, src/app/(main)/admin/codex/AdminFeatsTab.tsx, src/app/(main)/codex/CodexFeatsTab.tsx, src/components/character-creator/steps/feats-step.tsx, src/components/character-sheet/add-feat-modal.tsx | TASK: TASK-176,TASK-177,TASK-178,TASK-179,TASK-180 | pr_link: (pending local changes) | merged_at: 2026-02-11 | Summary:
  Updated the codex seeding script to always clear all codex_* tables before upserting rows from the canonical Codex CSVs, ensuring a full replacement of codex data on each run. Refined CODEX_SCHEMA_REFERENCE for ID-based cross-references (feat.skill_req as skill IDs, species skills/traits/flaws/characteristics as trait/skill IDs, equipment naming, properties.mechanic), and wired feat.skill_req toward ID semantics in the React app: AdminFeatsTab now saves skill_req as IDs selected from codex skills; CodexFeatsTab, the character-creator feats-step, and the character sheet AddFeatModal all resolve skill_req IDs back to skill names for display and requirement chips.

- 2026-02-11 | agent:claude-opus | TASK-184–TASK-189: Creator publish confirmation, admin codex delete UX, library edit, creator ?edit= loading, save/display pipeline fixes | files: src/components/shared/confirm-action-modal.tsx, src/components/shared/index.ts, src/app/(main)/power-creator/page.tsx, src/app/(main)/technique-creator/page.tsx, src/app/(main)/item-creator/page.tsx, src/app/(main)/creature-creator/page.tsx, src/app/(main)/admin/codex/AdminPartsTab.tsx, src/app/(main)/admin/codex/AdminPropertiesTab.tsx, src/app/(main)/admin/codex/AdminSkillsTab.tsx, src/app/(main)/admin/codex/AdminSpeciesTab.tsx, src/app/(main)/admin/codex/AdminTraitsTab.tsx, src/app/(main)/admin/codex/AdminFeatsTab.tsx, src/app/(main)/admin/codex/AdminCreatureFeatsTab.tsx, src/app/(main)/admin/codex/AdminEquipmentTab.tsx, src/app/(main)/admin/codex/AdminArchetypesTab.tsx, src/components/shared/grid-list-row.tsx, src/lib/calculators/technique-calc.ts | TASK: TASK-184,TASK-185,TASK-186,TASK-187,TASK-188,TASK-189 | pr_link: (pending) | Summary:
  1. Added ConfirmActionModal component and publish confirmation in all 4 creators when saving to public library.
  2. Replaced Trash2 icons with X icons in all 9 admin codex tabs, unified with rest of site's remove button pattern.
  3. Fixed critical bug: admin codex delete buttons called openEdit() instead of delete handler. Now shows inline "Remove? Yes/No" confirmation.
  4. Added inline pencil/edit icon to GridListRow collapsed row for quick editing (visible on library items).
  5. Added ?edit= query param support to power-creator and technique-creator (item-creator already had it). Library edit button now loads the item in the creator.
  6. Fixed item-creator saving only selectedProperties instead of full propertiesPayload (auto-generated properties like Weapon Damage, Two-Handed, Range, etc. were lost).
  7. Fixed technique-creator not saving actionType/isReaction fields.
  8. Updated TechniqueDocument interface and deriveTechniqueDisplay to use saved actionType/isReaction, preventing display mismatches.
  9. Fixed pre-existing build errors in CodexSkillsTab.tsx and item-creator.

- 2026-02-11 | agent:claude-opus | TASK-196,TASK-197,TASK-198,TASK-199,TASK-199b: TIER 1 bug fixes — game constants, feat formulas, health/energy calculations, SAVEABLE_FIELDS | files: src/lib/game/constants.ts, src/lib/game/creator-constants.ts, src/lib/game/formulas.ts, src/lib/game/skill-allocation.ts, src/lib/game/progression.ts, src/types/archetype.ts, src/app/(main)/power-creator/page.tsx, src/app/(main)/characters/[id]/page.tsx, src/app/(main)/characters/[id]/character-sheet-utils.ts, src/app/(main)/encounter-tracker/encounter-tracker-constants.ts, src/components/character-creator/steps/feats-step.tsx, src/components/character-sheet/level-up-modal.tsx, src/stores/character-creator-store.ts, src/lib/data-enrichment.ts, src/lib/calculators/power-calc.ts, src/docs/GAME_RULES.md | TASK: TASK-196,TASK-197,TASK-198,TASK-199,TASK-199b | pr_link: (pending) | Summary:
  TIER 1 bug fixes from character data audit. (1) TASK-198: Fixed ability caps to 10/20 (chars/creatures), removed physical/magic damage type split, renamed cold→ice, added Staggered/acid, added ARMOR_EXCEPTION_TYPES and LEVELS_BY_RARITY, fixed creature skill points (5 at L1, 3/level) and training points (22 base, 2/level), fixed archetype armament max (Power=3, Martial=12), added all 8 size categories, updated encounter-tracker conditions with full rulebook descriptions. (2) TASK-199: Replaced wrong feat formula (floor(level/4)+1) with correct archetype-aware calculations across character sheet, creator, level-up modal, and progression. (3) TASK-196: Fixed maxHealth to use strength when vitality is archetype ability. (4) TASK-197: Replaced hardcoded baseHealth/baseEnergy=10 in creator with getBaseHealth()/getBaseEnergy(). (5) TASK-199b: Added 11 missing fields to SAVEABLE_FIELDS whitelist.

- 2026-02-11 | agent:claude-opus | TASK-205,TASK-206,TASK-207,TASK-210: Phase 4 — Creator lean save (feats, powers, techniques, health/energy) | files: src/lib/data-enrichment.ts, src/stores/character-creator-store.ts, src/app/(main)/characters/[id]/page.tsx, src/components/character-sheet/sheet-header.tsx, src/app/(main)/characters/[id]/CharacterSheetModals.tsx, src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx, src/components/shared/add-combatant-modal.tsx, src/app/(main)/encounters/[id]/combat/page.tsx, src/app/(main)/encounters/[id]/mixed/page.tsx, src/types/character.ts | TASK: TASK-205,TASK-206,TASK-207,TASK-210 | pr_link: (pending) | Summary:
  Phase 4 lean data migration. (1) TASK-210: Removed health_energy_points and health/energy ResourcePool from save. currentHealth/currentEnergy is now canonical. All 10 consumer files updated to read currentHealth first with backward compat fallback to health?.current. All writes (recovery, power use, allocation) now write to currentHealth/currentEnergy directly. (2) TASK-205: cleanForSave strips feat description/maxUses/recovery, saves { id, name, currentUses } only. Recovery handlers and feat uses handler now look up maxUses/rec_period from codex featsDb. (3) TASK-206: Powers saved as { id, name, innate } — description/parts/cost/damage stripped. enrichPowers() already supports ID-based lookup. (4) TASK-207: Techniques saved as { id, name } objects instead of bare name strings. enrichTechniques() handles both formats via findInLibrary().

- 2026-02-11 | agent:claude-opus | TASK-203,TASK-204,TASK-208,TASK-209: Phase 4 — Creator lean save (species, archetype, skills, equipment) | files: src/lib/data-enrichment.ts, src/stores/character-creator-store.ts, src/types/archetype.ts, src/types/character.ts, src/components/character-sheet/sheet-header.tsx, src/lib/character-server.ts, src/app/api/characters/route.ts, src/app/(main)/characters/actions.ts, src/app/(main)/characters/[id]/page.tsx, src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx | TASK: TASK-203,TASK-204,TASK-208,TASK-209 | pr_link: (pending) | Summary:
  Completed Phase 4 lean data migration for all remaining data domains. (1) TASK-204: Archetype stripped to { id, type }. CharacterArchetype.name optional + @deprecated. Display name derived from type. archetypeName/archetypeAbility removed from SAVEABLE_FIELDS. (2) TASK-203: Ancestry stripped to { id, name, selectedTraits, selectedFlaw, selectedCharacteristic }. 'species' string and legacy ancestry fields removed from SAVEABLE_FIELDS. Migration for old species-only characters. (3) TASK-208: Skills stripped to { id, name, skill_val, prof, selectedBaseSkillId? }. ability/baseSkillId/category derived from codex. (4) TASK-209: Equipment items stripped to { id, name, equipped?, quantity? }. Full item data derived from library/codex. Redundant inventory[] array removed. enrichItems() updated for ID-based codex lookup.

- 2026-02-11 | agent:claude-opus | TASK-211,TASK-213: Phase 5 — Feats & equipment enrichment fixes | files: src/components/character-sheet/feats-tab.tsx, src/lib/data-enrichment.ts | TASK: TASK-211,TASK-213 | pr_link: (pending) | Summary:
  Phase 5 enrichment fixes. (1) TASK-211: enrichFeat() now derives name from codex when missing (lean feats have no name). Fixed uses_per_rec field mapping — CodexFeat interface updated to include uses_per_rec alongside legacy max_uses. Feats fully work with lean { id, currentUses }. (2) TASK-213: Fixed toEquipmentArray() to preserve id and quantity (was stripping them, breaking ID-based lookup). enrichItems() now passes quantity through to enriched results.

- 2026-02-11 | agent:claude-opus | TASK-212,TASK-214,TASK-215,TASK-216,TASK-217: Phase 5/6 — Verification & close-out | files: (verification only, no code changes) | TASK: TASK-212,TASK-214,TASK-215,TASK-216,TASK-217 | pr_link: (pending) | Summary:
  Verified Phase 5/6 tasks already satisfied by Phase 4 work. TASK-212: Powers/techniques enrichment via findInLibrary() ID-first lookup already works. TASK-214: Skills already enriched from codexSkills via useMemo in page.tsx. TASK-215: All derived stats already computed by calculateAllStats() from TASK-201. TASK-216: Unified enrichment pipeline already achieved through shared findInLibrary/enrichPowers/enrichTechniques/enrichItems. TASK-217: cleanForSave already produces lean output from Phase 4.

- 2026-02-11 | agent:claude-opus | TASK-218: Phase 6 — Character type @deprecated annotations | files: src/types/character.ts | TASK: TASK-218 | pr_link: (pending) | Summary:
  Annotated all redundant fields in Character type with @deprecated JSDoc: species, health/energy ResourcePool, speed/evasion/armor (derived), martialProficiency/powerProficiency, allTraits/_displayFeats, legacy ancestryTraits/flawTrait/characteristicTrait/speciesTraits, health_energy_points. Added health_energy_points field to type for completeness. Fields kept for backward compat until TASK-220 migration.

- 2026-02-11 | agent:claude-opus | TASK-219: Portrait storage — base64 → Supabase Storage URL | files: src/components/character-creator/steps/finalize-step.tsx | TASK: TASK-219 | pr_link: (pending) | Summary:
  Creator finalize step now uploads portrait to Supabase Storage after character creation instead of saving base64 to the JSON blob. Base64 kept in draft for preview during creation; stripped before initial save; uploaded as file to /api/upload/portrait; URL saved via saveCharacter. Old base64 portraits still display (backward compat). Character sheet upload was already using Storage.

- 2026-02-11 | agent:claude-opus | TASK-220: Lean data migration script | files: scripts/migrate-characters-lean.js | TASK: TASK-220 | pr_link: (pending) | Summary:
  Created idempotent migration script for existing characters. Converts: health/energy ResourcePool → currentHealth/currentEnergy, health_energy_points → healthPoints/energyPoints, species string → ancestry.name, strips archetype/ancestry/feats/powers/techniques/equipment/skills to lean format, removes legacy display-only fields and derived combat stats. Supports --dry-run for preview. Already-lean characters pass through unchanged.

- 2026-02-11 | agent:claude-opus | Audit fixes: enrichment, SAVEABLE_FIELDS, migration, ArchetypeSection | files: src/lib/data-enrichment.ts, src/components/character-sheet/archetype-section.tsx, src/app/(main)/characters/[id]/page.tsx, src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx, scripts/migrate-characters-lean.js | TASK: audit | pr_link: (pending) | Summary:
  Comprehensive audit of all lean schema work found 6 issues, all fixed:
  (1) enrichItems() placeholder now uses charItem.id when name is missing.
  (2) SAVEABLE_FIELDS added missing weight, height, lastPlayedAt.
  (3) cleanForSave now handles skills as Record<id,number> or Array format (was Array-only).
  (4) Migration script: added martialProficiency→mart_prof, powerProficiency→pow_prof, defenseSkills→defenseVals migration before removal. Fixed archetype stripping to return undefined when no lean fields exist. Added skills Record→Array conversion.
  (5) ArchetypeSection now receives enrichedWeapons/enrichedArmor props from page.tsx — no longer uses raw character.equipment (which has lean data missing damage/properties/armor).
  (6) EnrichedItem type added quantity, range, armor fields for full display data.

- 2026-02-11 | agent:claude-opus | TASK-233: Refactor formulas.ts — DB-driven rules | files: src/lib/game/formulas.ts | TASK: TASK-233 | pr_link: (pending) | Summary:
  All ~35 exported functions now accept optional `rules?: Partial<CoreRulesMap>` param.
  DB values used when provided, constants.ts fallbacks otherwise. Zero breaking changes.

- 2026-02-11 | agent:claude-opus | TASK-234: Refactor calculations.ts — DB-driven rules | files: src/lib/game/calculations.ts | TASK: TASK-234 | pr_link: (pending) | Summary:
  All ~11 exported functions now accept optional `rules?: Partial<CoreRulesMap>` param.
  calculateDefenses, Speed, Evasion, MaxHealth, AllStats, computeMaxHealthEnergy all
  accept DB rules. Zero breaking changes.

- 2026-02-11 | agent:claude-opus | TASK-225–232: Admin Core Rules Editor page | files: src/app/(main)/admin/core-rules/page.tsx, src/app/(main)/admin/page.tsx | TASK: TASK-225,226,227,228,229,230,231,232 | pr_link: (pending) | Summary:
  Created /admin/core-rules page with 12 sub-tabs: Progression (TASK-225), Combat (226),
  Archetypes (227), Ability Scores (231), Skills & Defenses (232), Conditions (228),
  Sizes (229), Rarities (230), Damage Types (232), Recovery (232), Experience (232),
  Armament Proficiency (232). Each tab loads data from useGameRules(), provides form
  editors for all fields, and saves via updateCodexDoc('core_rules', categoryId, data).
  Admin dashboard updated with Core Rules Editor card and link.

- 2026-02-11 | agent:claude-opus | Audit & fix: all TS errors + admin core-rules completeness | files: src/app/(main)/admin/codex/AdminSpeciesTab.tsx, src/app/(main)/item-creator/page.tsx, src/components/character-sheet/add-feat-modal.tsx, src/app/(main)/admin/core-rules/page.tsx | TASK: audit | pr_link: (pending) | Summary:
  (1) Fixed all 9 pre-existing TypeScript errors:
    - AdminSpeciesTab: detailSections.chips type was single object instead of array (6 errors).
    - item-creator: removed 2 stale @ts-expect-error directives.
    - add-feat-modal: handled f.ability as string|string[] (1 error).
  (2) Admin Core Rules page audit fixes:
    - TASK-225: Added full creature progression fields (14 editable fields) and live level 1-10 preview table.
    - TASK-228: Added add/remove buttons for standard and leveled conditions (was edit-only).
    - TASK-229: Made size table fully editable (was read-only). Added add/remove rows.
    - TASK-230: Made rarity tiers fully editable with add/remove. All fields editable inline.
    - TASK-231: Added standard arrays editor with per-value editing and add/remove arrays.
    - TASK-232: Damage types now support add/remove. Armor exceptions toggleable by clicking.
    - Armament proficiency table now supports add/remove rows.
  Zero TypeScript errors. npm run build passes cleanly.

- YYYY-MM-DD | agent-id | short summary | files: [comma-separated] | PR: <link-or-commit> | TASK: TASK-### | merged_at: YYYY-MM-DD

Policy: `pr_link` and `merged_at` must be present in the changelog entry and the corresponding `AI_TASK_QUEUE.md` task before marking a task `done`.
