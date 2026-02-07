# AI Change Log

Append-only log. Agents must add an entry for each PR/merge.

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

- YYYY-MM-DD | agent-id | short summary | files: [comma-separated] | PR: <link-or-commit> | TASK: TASK-### | merged_at: YYYY-MM-DD

Policy: `pr_link` and `merged_at` must be present in the changelog entry and the corresponding `AI_TASK_QUEUE.md` task before marking a task `done`.
