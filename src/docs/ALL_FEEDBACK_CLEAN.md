# ALL_FEEDBACK — Consolidated & Curated

Last updated: 2026-02-18

Purpose
- Single, de-duplicated, organized source of owner feedback supplied to AI agents.
- Top: curated, grouped, actionable guidance for engineers.
- Bottom: an appendable "Raw Feedback Log" where new raw entries can be pasted verbatim each time new feedback is issued.

How to use
- Read the curated sections for priorities and intent.
- Append new raw feedback to the bottom under "Raw Feedback Log" using the provided template.
- Keep raw entries chronological (oldest first), newest at the bottom.

Agent Integration
- Read `src/docs/ai/AGENT_GUIDE.md` for workflow and sources of truth.
- For data flow and game rules: `ARCHITECTURE.md`, `GAME_RULES.md`.
- Workflow:
	1. Human sends feedback (or appends raw feedback to this file using the Raw Entry Template).
	2. AI agent **always** appends that raw feedback to this file under "Raw Feedback Log" (date, context, priority, feedback text)—whether the agent will create a task or implement it directly.
	3. Agent runs extraction/cross-reference; creates tasks in `AI_TASK_QUEUE.md` for items that need future work; implements directly when appropriate.
	4. For tasks: implement, create PRs with `ai/` branch prefix, append to `src/docs/ai/AI_CHANGELOG.md`. On merge, mark task `done` in `AI_TASK_QUEUE.md` with PR link and summary.
	5. For direct implementation (no new task): still append raw feedback per step 2; optionally add a curated note or "Implemented YYYY-MM-DD" in the raw entry.

Notes:
- Do NOT place secrets or service account keys in these docs. Use `src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md` for deployment env vars.

---

## Core Principles
- Primary role: act as a senior front-end architect for a React / Next.js / Tailwind codebase.
- Secondary goal: unify components, styles, and logic while preserving behavior and UX.
- Favor a single source of truth, shared components, and centralized styling.
- Use the vanilla site for functional references only.

---

## Curated, Actionable Sections (Deduplicated)

### 1) Architecture & Unification
- Consolidate duplicate components and logic across the project (character sheet, creators, library, codex).
- Create and enforce shared list/header/modal patterns (sortable headers, consistent spacing, rounded modal edges).
- Find and remove true dead code.

### 2) Creators (Power / Technique / Armament / Creature)
- Ensure parts/properties load their TP/IP/C values from RTDB and are used to compute EN/TP/C when rendering lists or summaries.
- Wire option levels and part selections to update calculated costs (EN/TP/C) in UI immediately.
- Consistent layout: fixed compact summary + scrolling inputs/values.

### 3) Character Sheet & Library
- Library tab order: Feats, Powers, Techniques, Inventory, Proficiencies, Notes (default open to Feats).
- Use shared components for list headers and items (remove counts, make headers sortable).
- Equip toggles (SelectionToggle) must work outside edit mode and persist state.
- Display computed weapon attack bonus, damage, crit range, armor DR/requirements consistently.

### 4) Skills
- Replace three separate implementations (character sheet, character creator, creature creator) with a unified `SkillRow`/`SkillList` component with variants.
- Keep business logic in parents; rendering/controls in shared components.

### 5) UI / Visual Standards
- Standardize interactive elements (add/select, steppers, roll buttons) with consistent visuals and hit areas.
- Palette: primarily blues/grays; use green for health, blue for energy, and lighter purple for powers.
- Remove extraneous expand/collapse chevrons when they cause layout issues.
- Implement modern thin scrollbars sitewide.
- **Buttons:** Use solid colors with clear white font (btn-solid, btn-outline-clean) — no gradients. Match about page styles site-wide.
- **Roll Log:** Single-row layout (1d20 X + Bonus = Total in boxes); roll=light grey, bonus=green, total=blue; smaller timestamp.

### 6) Modals & Lists
- Shared modal/list components should include: rounded headers, header spacing, sortable columns, and right-aligned add/select controls.
- Remove "# items" counts and ensure list header spacing equals item spacing.
- All modals: uniform rounded corners (overflow-hidden on modal container). Remove "Add" column header; ListHeader with hasSelectionColumn provides empty slot. Header bar: shorter than modal width, rounded edges, ascending/descending sort.

### 6b) Creator Contrast & Accessibility
- Technique and Armament creators: description and option boxes must use semantic tokens (text-text-primary) and dark mode variants — match Power Creator. Dropdown menus across all 3 creators must have explicit text-text-primary bg-surface. ✅ TASK-254
- Full accessibility audit: Elements must meet WCAG 2.1 AA contrast (4.5:1 small text, 3:1 large text). Use axe DevTools to identify and fix violations. ✅ TASK-255 (not-started; handled by other agent)

### 7) Bugs / Behavior to Prioritize
- Login redirect: return user to the page that initiated login.
- Character creator: persist skill allocations automatically when switching tabs.
- Creature creator: hide unarmed prowess options > level 1 for new characters; fix dropdown alignment; make summary scroll behavior consistent.
- Powers/Techniques/Armaments: ensure RTDB enrichment computes and displays EN/TP/C in all list views.

### 8) RTDB & Data Guidance
- Enrich saved items by resolving saved IDs against RTDB entries to obtain base_en/base_tp/op_* values.
- Parts and properties must have their costs applied during display and item calculations.

### 9) Naming & Terminology
- Use "Abilities" not "Ability Scores" (Realms uses bonuses/values, not scores).
- Health/Energy Allocation section should be titled "Health/Energy Allocation" consistently.
- "Next: 2 Points" label for abilities costing 2 at 4+ (not 3).
- Auto-capitalize archetype power/martial ability display (e.g., "Charisma" not "charisma").
- **Roll Log terminology:** Realms uses "Rolls" only — no "Saves" or "Checks". Titles: "Acuity", "Discernment", "Athletics (STR)", weapon name. Skill format: "Skill Name (ABR)".

### 10) Page Layout & Sizing
- Page content width should be consistent across non-unique pages (codex, library, creators, character sheet).
- Character sheet could use a slightly wider working width to avoid cramped sections.
- Character library section heights should match adjacent archetype section height.

### 11) Health Bar Colors
- Half-health color should be yellower/more orange (currently too red).
- Terminal/critical red should be deepened for clearer distinction from half-health.

### 12) Selection & Add Buttons
- Unify +/check selection buttons site-wide: backgroundless "+" icon, turns to green check when selected.
- "Add X" buttons and "select" buttons should share consistent visual style (no border, sleek, modern).
- Ancestry step trait selection buttons should be larger and vertically centered.

### 13) Vitality Box Height
- Character creator vitality ability box renders taller than others; all ability boxes should match height.

### 14) Section Height Consistency
- Character library, skills section, and archetype section should match min-heights when adjacent.
- Even when empty, sections should appear uniform.

### 15) Creature Creator Basic Info Layout
- Level dropdown is too wide; Level/Type/Size dropdowns not aligned horizontally with Name input.
- Fix alignment and constrain dropdown widths.

### 16) Character Sheet Archetype Section — Proficiency Slider
- Archetype prof slider: Hide unless in edit mode for archetype proficiency editing. Only show when pencil is clicked.
- In non-edit mode, display Power and/or Martial proficiency as simple values (e.g., "Power: 2, Martial: 1") instead of the slider.
- The slider is for editing only.

### 17) Admin Codex Editor
- Navbar: Campaigns link should appear after RM Tools, before About. ✅ TASK-153
- Feat level 0: Display "-" instead of "0" in list views. ✅ TASK-154
- Delete: List must refresh immediately after delete (no page reload). ✅ TASK-155
- UI consistency: Admin tabs should match Codex tabs (same filters, search, sort, layout); only pencil/trash differ for edit/delete. ✅ TASK-155 (Admin Feats unified; other tabs can follow)
- Feat ability: Use dropdown of 6 Abilities + 6 Defenses; allow multi-select. ✅ TASK-156
- Feat fields: All feat fields must be editable (req_desc, ability_req/abil_req_val pairs, skill_req/skill_req_val, feat_cat_req, pow_abil_req, mart_abil_req, pow_prof_req, mart_prof_req, speed_req, feat_lvl, lvl_req, uses_per_rec, rec_period, category, ability, tags, char_feat, state_feat). ✅ TASK-157
- Array fields: Use dropdowns to select by name (e.g. species skills, feat skill_req), not "ids separated by commas". ✅ TASK-160
- Input lag: Typing in edit mode should feel responsive. ✅ TASK-159 (done: useTransition in Admin Feats)
- Centralized schema doc: Create reference for all codex entity fields (name, type, description) for AI/engineer use. ✅ TASK-158
 - Feat prerequisites: `prereq_text` is not a real feat attribute and should not appear in schema docs, types, or Admin editors. Use `req_desc` only. ✅ TASK-169
 - Other Admin tabs: Admin Skills, Parts, Properties, and Equipment tabs should use the same search, filters, sort headers, and GridListRow layout as their Codex counterparts, with only edit/delete controls added. ✅ TASK-170
 - Skill base skill selector: Admin Skills edit modal should use a dropdown of base skill names for the `base_skill` relationship instead of requesting a numeric ID; the UI selects by name and the code resolves/stores the corresponding `base_skill_id` internally. ✅ TASK-171
 - Skill additional descriptions: Admin Skills edit modal must expose all skill narrative fields for editing — `success_desc`, `failure_desc`, `ds_calc`, `craft_success_desc`, `craft_failure_desc` — matching the codex schema. ✅ TASK-172
 - Skill chips: Extra skill descriptions (success/failure outcomes, DS guidance, craft success/failure details) should render as expandable chips on skill item cards across the site (Codex, add skill modals, add sub-skill modals, etc.), appended after the main description. ✅ TASK-173
 - Species height/weight/lifespan: Codex API maps ave_hgt_cm/ave_wgt_kg to ave_height/ave_weight; adulthood_lifespan as number or [adult, max]. Ancestry tab and Codex species cards show Avg Height, Avg Weight, Adulthood, Lifespan (max). ✅ TASK-256
 - Skill governing ability: Admin Skills edit uses only the six abilities (not defenses); placeholder "Choose governing ability". ✅ TASK-257

### 18) Encounters System (Major Redesign)
- **Rename:** "Encounter Tracker" → "Encounters" (hub page).
- **Encounters hub:** List view of saved encounters; filter, search, sort; create new (combat, skill, or mixed); click to open.
- **Persist:** Save encounters to Supabase/Prisma by ID; replace local storage. Save/return to sessions (turns, AP, HP tracked).
- **Combat Tracker:** Designate current encounter tracker as combat-specific; tied to encounter ID.
- **Skill Encounter page:** Add characters; track skill rolls; successes vs failures; required successes/failures; DS-based resolution; reference GAME_RULES.md (DS = 10 + ½ Party Level, Required Successes = # Characters + 1).
- **Mixed Encounter page:** Combine combat + skill functionality; reuse components from both.
- **Add from library:** Encounter tracker — add creatures from user's creature library; auto-populate max HP/EN; quantity selector; use existing add combatant/creature modal components.
- **Campaign integration:** Add characters from campaigns user is in; pull evasion, acuity, HP, EN for quick reference; easy add without manual entry.

### 19) Campaign–Encounter Linkage & Roll Log & Character Visibility
- **Campaign–Encounter:** Allow attaching a campaign to an encounter (on creation or within). Add "Add all Characters" button to add all campaign characters to the encounter at once.
- **Encounter combatants:** Fix HP/EN loading — when combatant is tied to a user's character, load accurate current/max health and energy.
- **Encounter roll log:** Add roll log to encounters (same UI/functionality/styles as character sheet). RM uses it for private rolls (not to campaign). Include tabs so RM can see rolls in their campaigns.
- **Roll log consistency:** Unify styles across encounter tab (roll log campaign mode), character sheet (campaign mode), and campaign page. Fix roll date display (most show "unavailable").
- **Roll log real-time:** Rolls synced in real time between characters, campaigns, and users. Supabase Realtime or equivalent.
- **Health/Energy real-time:** Current HP/EN synced between encounters and characters.
- **Character visibility:**
  - **Public:** Anyone can copy link and view in browser (read-only, no edit).
  - **Campaign only:** RM and other campaign members can see (not edit).
  - **Private + joins campaign:** Automatically set to campaign only. Show notification when joining campaign with private character that visibility will change.
- **Character-derived content:** Powers, techniques, armaments, items from user's private library used by a character must be visible to viewers (read-only) when viewing that character.

---

## High-Level Action Items
- [x] Audit lists/modals to use shared `ListHeader`/`GridListRow` components.
- [x] Unify skills into `SkillRow` and replace inline implementations.
- [x] Ensure RTDB enrichment pipeline correctly computes EN/TP/C for powers/techniques/armaments.
- [x] Standardize SelectionToggle and equip persistence outside edit mode.
- [x] Replace chevrons causing layout shifts; ensure expanders do not break grid flow.
- [x] Enforce consistent "Abilities" naming (not "Ability Scores") everywhere. (TASK-055)
- [x] Unify page content width across non-unique pages. (TASK-057)
- [x] Fix half-health bar color to yellower orange; deepen terminal red. (TASK-058)
- [x] Unify selection/add button styles site-wide. (TASK-059 — already implemented)
- [x] Fix vitality box height mismatch in character creator. (TASK-060)
- [x] Rename HealthEnergyAllocator title to "Health/Energy Allocation". (TASK-055)
- [x] Auto-capitalize archetype ability display. (TASK-056 — already implemented via CSS)
- [x] Match character library section heights to archetype section height. (TASK-062)
- [x] Fix creature creator basic info dropdown alignment and sizing. (TASK-063)
- [x] Health/Energy edit: bump current with max when at full and increasing. (TASK-072)
- [x] Speed/Evasion: pencil icon, hide base edit by default, red/green validation. (TASK-073)
- [x] Dark mode: soften chip, stepper, health/energy, hover colors. (TASK-074)
- [x] Fix /api/session 500 and Firebase Storage 403 for portraits/profile. (TASK-075, TASK-076)
- [x] Fix username regex invalid character class. (TASK-077)
- [x] Enable hold-to-repeat for creature creator Health/Energy allocation. (TASK-065)
- [x] Remove hold-to-repeat from creature creator defense steppers. (TASK-066)
- [x] Fix senses/movement item card vertical margins (equal padding). (TASK-067)
- [x] Unify creature creator add modals with character sheet/codex list styles. (TASK-068)
- [x] Power/Martial slider: min 1 at each end, not 0. (TASK-069)
- [x] Restructure Creature Summary with resource boxes and line items. (TASK-070)
- [x] Unify stepper styles across site (less stark colors). (TASK-071)
- [x] Archetype prof slider: hide unless pencil clicked; show simple Power/Martial values otherwise. (TASK-101)
- [x] Add creatures from library to encounter tracker (auto HP/EN, quantity). (TASK-102)
- [x] Encounters hub: rename to Encounters, list/create/filter/search/sort. (TASK-103)
- [x] Persist encounters to Supabase/Prisma; save/return to sessions. (TASK-104)
- [x] Designate combat tracker; create skill encounter page; create mixed encounter page. (TASK-105, TASK-106, TASK-107)
- [x] Campaign integration: add characters from campaigns to encounters. (TASK-108)
- [x] Navbar: move Campaigns to right of RM Tools, left of About. (TASK-153)
- [x] Admin Codex: display "-" for feat level 0 in list. (TASK-154)
- [x] Admin Codex: fix list refresh after delete; unify UI with Codex tabs. (TASK-155)
- [x] Feat editing: ability dropdown (6 abilities + 6 defenses, multi-select). (TASK-156)
- [x] Feat editing: add all missing editable fields. (TASK-157)
- [x] Create centralized codex schema reference doc for AI. (TASK-158)
- [x] Admin Codex: reduce input lag in edit mode. (TASK-159 — done: useTransition in Admin Feats; other tabs can follow)
- [x] Admin Codex: array fields use dropdowns (skills, etc.), not raw IDs. (TASK-160)
- [x] Campaign–Encounter: attach campaign to encounter; "Add all Characters" button. (TASK-161)
- [x] Encounter combatants: fix HP/EN loading when combatant tied to user character. (TASK-162)
- [x] Encounter roll log: add RM roll log (personal + campaign tabs), same UI as character sheet. (TASK-163)
- [x] Roll log consistency: styles, date display ("unavailable" fix), tabs across encounter/campaign/sheet. (TASK-164)
- [x] Roll log real-time: Supabase Realtime for campaign rolls sync. (TASK-165)
- [x] Health/Energy real-time: sync current HP/EN between encounters and characters. (TASK-166)
- [x] Character visibility: public (link share, view-only); campaign (RM + members view); private→campaign on join. (TASK-167)
- [x] Character-derived content visibility: powers/techniques/items in private library visible (view-only) when viewing char. (TASK-168)

---

## Feedback not yet implemented

**Last audited:** 2026-02-18. Cross-checked with `AI_TASK_QUEUE.md`. Newer feedback takes priority over older.

Items below are the only feedback/tasks that remain **not implemented** (or explicitly deferred / assigned elsewhere). Everything else in the curated sections and High-Level list above is done unless marked here.

| Item | Source | Status / Notes |
|------|--------|----------------|
| **Full accessibility audit (WCAG 2.1 AA)** | §6b curated; 2/18 raw | **TASK-255** (not-started). Color contrast 4.5:1 small text, 3:1 large text. *Handled by another agent; do not duplicate.* |
| *(None else)* | — | All other curated items and High-Level action items have a corresponding **done** or **cancelled** task, or were implemented directly and noted in the raw log. |

**How to use this section**

- When new raw feedback is added, re-check whether it creates new work; if yes, add a row above and/or create a task in `AI_TASK_QUEUE.md`.
- When a task is completed, remove it from this table (or mark as done in the Notes column) and ensure the curated/High-Level sections reflect completion.
- For deferred or “other agent” work, keep the row with a short note so agents don’t re-open it.

---

## Raw Feedback Log (append below — newest entries at bottom)

**Raw Entry Template** (copy/paste)
- Date: YYYY-MM-DD HH:MM
- Context / Page: (e.g., Character Sheet → Library → Powers)
- Priority: (Critical / High / Medium / Low)
- Feedback (paste raw text)
- Expected behavior (short)
- References (vanilla site, screenshots, notes)

---

### Raw Entries (chronological)

2/3/2026 20:27 — Library / Creators
- "The armaments (weapons/shields with damage) don't display their weapon damage in the library page. Edit should open creator with item loaded. Duplicate should copy item without redirecting."

2/3/2026 21:00 — Creators / UI
- RTDB enrichment: saved powers/techniques store part IDs but not computed EN/TP; list views must resolve parts from RTDB and compute costs when rendering.

2/4/2026 16:00 — Character Sheet
- "Innate star doesn't toggle in the UI (hit area/centering)."

2/4/2026 16:00 — Powers/Techniques
- "Powers/techniques/armaments sometimes display incorrect/missing energy or TP values in lists."

(older raw entries omitted for brevity)

2/5/2026 — Login / Auth
- Context: Login redirect flow
- Priority: High
- "The redirect to previous page login method seems to not work. I was on the realms home page, clicked to login, then it redirected me to the characters page instead of the home page again (signed in with Google). It should take me to the home page again since that's where I came from when I went to login."

2/5/2026 — My Account / Auth
- Context: Account settings, security
- Priority: Medium
- "What if the user signed up with Google, can they still change their email? Can we allow adding a profile picture? Can we allow changing username (check if it already exists, and filter out inappropriate names)? Limit changing usernames, emails, etc to once a week at most for users. Does Apple/Google/email sign-in fully work? Are all settings needed accounted for in My Account? Do we need to add any settings? Any security risks or bad practices currently in place for any login/account management? Follow best practices."

2/5/2026 — Navbar / Theme
- Context: Profile dropdown, theme settings
- Priority: Medium
- "My account icon (profile pic circle in nav bar) — perhaps we can have a settings option other than My Account and Sign Out in the dropdown, for things like theme (dark/light/system modes). Will need to implement dark mode theming somehow across the site with best practice."

2/5/2026 — Navbar / Auth UI
- Context: Placeholder login image
- Priority: Low
- "Placeholder (no login) image: We should have this be replaced with a clean 'Login' button instead. The icon isn't good."

2/5/2026 — Creature Creator / Character Sheet
- Context: Powered Martial slider, component reuse
- Priority: High
- "Creature Creator: Powered Martial slider — can we make this slider a component that can be utilized in the character sheet for powered martial characters instead of clunkily allocating points to each independently? It also improves our goal for uniformity/consistency across the website's UI especially in cases of shared UI/component functionality. We would obviously make a much smaller scale, same styles, for the character sheet powered martial editing in edit mode."

2/5/2026 — Component Consistency
- Context: Ability allocation, defense allocation, steppers
- Priority: High
- "Ability allocation, defense allocation, components: There's seemingly differences between the character sheet, creature creator, and character creator when it comes to some of these components that are meant to be unified, such as the ability allocation and defenses allocation. Why do the styles seem different slightly? What about the buttons? Aren't all/most steppers supposed to have the same/analogous styles?"

2/5/2026 — Creature Creator Batch (Health/Energy, Defenses, Modals, Summary, Steppers)
- Context: Creature Creator, Steppers, Modals
- Priority: High (multiple items)
- Raw feedback: "Health/Energy allocation should have faster/continuous allotment on button hold, it seems this functionality didn't work in the creature creator? maybe everywhere? Defense/ability allocation should NOT have a hold to increase function, as they have little variance. Noticed on creature creator: the senses and movement item cards have inconsistent vertical margins above/below the description box, they should be equal padding. this is likely true globally for like item cards. add feat/power/technique/armament modals in creature creator: uses old modal styles, not updated to work like character sheet modals have been for instance, all add X modals with list views/list items should be uniform and work/be styled to match codex/library like list view styles, like our feat/skill modals do in the character sheet, etc. These should be unified global components that override inline styling wherever possible such as here on the creature creator (which modal might need to be entirely removed, re-written, replaced with our components, etc.) audit/look into best option aligned with our unification goals. Power/Martial scroller in creature creator: shouldn't allow you to scroll fully to one side/the other, since the powered-martial has a division of power/martial proficiencies between both, the furthest end of the slider should be 1 for that end, not 0. Creature Summary: At the top of the summary, to match other creators, should be boxes with spendable resources (ability points, Skill points, feat points, training points, currency) this is more boxes than other creators, so they can be smaller, but should match with the style of the other creators. Below these resources can be the obvious summary points: Abilities, Archetype, level, type, size, etc. then below this can be the more specific stuff, written as basically line items, like how other creators show smaller details that change, for instance with a skill added you would say 'Skills: Stealth +3, Athletics -1, ...' as a sentence of skills, and do similar things with resistances, immunities, weaknesses, etc (if any.) Here's an example of a DND creature stat block for an idea of how simple it can be while still satisfying a TTRPG player: [D&D stat block example]. The stepper buttons across the site seem to all have slightly different styles, sizes, colors, etc. for instance, defenses allocation steppers are smaller, and the - is grey as opposed to red, compared to other steppers. we should go with less stark colors for the stppers, and unify their styles across the site as much as possible."
- Extracted to: TASK-065, TASK-066, TASK-067, TASK-068, TASK-069, TASK-070, TASK-071

---

Notes
- To refresh the curated top section, paste a batch of raw log entries and request: "Consolidate and update curated feedback" — the agent will re-run the summarization and update the curated sections.
- This file is intended to be the canonical owner-feedback source for engineering planning and triage.

2/5/2026 — Character Sheet / Recovery
- Context: Character Sheet, Recovery button
- Priority: High
- "Recovery Modal: When you hit recovery on the character sheet, it should open a clean sleek modal (matching site styles/designs etc) that allows you to choose between full recovery (which restores HP current to the Max value, same with energy current to it's max value, it also restores all uses of all feats/traits to their max values. Partial recovery is different and also has options. First, if you take a partial recovery you choose between 2, 4, and 6 hours of recovery. With 2 hours you get bath 1/4 of your current/max hp, or you can choose to get 1/2 of your hp or energy instead (not both), this stacks for each 2 hours, ie with 4 hours you get half back to both, or 3/4 back to one, 1/4 to the other, or full to one, none to the other, and so on with 6 hours being 3/4 back to both, full to one 1/2 to the other, etc. We could also have an automatic partial recovery option where you select the hours, then it automatically determines the 'best' option for the time recovered and the optimal amount of 1/4ths to spend on hp en or both (ie if you have 10/12 HP but 0/20 EN and took a 4 hour partial recovery, it would choose whatever options grants the most percentage of the resource back overall, so for 4 hours that's 4/4ths of hp/en to divide, so it'd automatically give all to energy since that's 20 total EN gained (100% of energy) over the option of of 1/4 to HP (2 hp = 16.67% of hp) and 3/4 to EN (75% of EN) for a total of 91.6% resources regained. Remember, when it comes to fractions we round up, so if you have 9HP max and recovered half, you'd regain 5 not 4 hp. In cases where it's indifferent, it'd give you a spread between both, ie if you have 5/10 HP and 10/20 EN it'd grant 1/4 to both for a 2 hour partial recovery, granting 3 HP and 5 EN. Use best logic and common sense for this. No matter the type of partial recovery, make the ui sleek, simple, and useable. Also, partial recoveries automatically set all trait/feat uses with a use recovery period of 'Partial' sets the current value to the max value, it doesn't reset feats/traits with uses 'Full' to max though."

2/5/2026 — Character Sheet / Notes / BUG
- Context: Character Notes → Physical Attributes & Movement
- Priority: Medium
- "BUG: Users are able to set Weight and Height to negative values. Minimum Weight and Height can't be set below 1."
- Steps: Go to character sheet → Notes → Physical Attributes & Movement → edit weight/height
- Expected: Weight and Height have a minimum value of 1

2/5/2026 — Character Sheet / Inventory / BUG
- Context: Character Notes → Inventory
- Priority: High
- "BUG: Unable to remove items from inventory. Users are unable to remove items from their 'Inventory'. Items can be removed from the User's 'Inventory'."
- Steps: Go to character sheet → Notes → Inventory → add an item → try to remove it
- Expected: Items can be removed from the inventory

2/5/2026 — Character Sheet / Edit Mode / Character Name & XP
- Context: Character Sheet Header
- Priority: High
- "Only allow editing of character name in edit mode. Allow editing of XP in any mode."

2/5/2026 — Character Sheet / UI / Pencil Edit Icons
- Context: Site-wide edit icon consistency
- Priority: High
- "We use different pen/pencil icons across the page to represent editing. Unify to one style - prefer the ones with no button background, simplistic design (like the ones for character name/XP, skills, etc., not the one over abilities with a circle around it permanently). Pencil edit icon color schemes should all be blue, green, or red, dependent on if things may be spent or not (i.e. name pencil would be blue since the name isn't under or overspent)."

2/5/2026 — Character Sheet / Library / Feat Deletion
- Context: Library tab pencil icon
- Priority: High
- "The pencil icon in the character library is useless, it should allow the deletion of feats on the feats tab."

2/5/2026 — Character Sheet / Custom Notes / BUG
- Context: Custom note name editing
- Priority: Medium
- "BUG: When you hit the name on the custom note to edit or add a name to it, it collapses. It shouldn't collapse since you're editing something, not clicking to collapse it."

2/5/2026 — Character Sheet / Powers & Techniques / Energy Buttons
- Context: Powers/Techniques list items
- Priority: High
- "Technique/powers list item buttons: the energy for these should be in button form with the same styles as roll buttons to show you can spend the resource if you click the button."

2/5/2026 — Character Sheet / Powers / Innate Energy Summary
- Context: Innate power tab summary
- Priority: Medium
- "Innate energy power tab summary: Remove 'Innate powers use this energy pool instead of regular energy'. Instead: 'Innate powers have no cost to use. You may have powers with energy costs up to your innate energy.' Also center the summary content."

2/5/2026 — Character Sheet / Powers / Display Formatting
- Context: Power list items display
- Priority: Medium
- "Power list items: Capitalize the damage types 'Radiant' instead of 'radiant'. For area in power list items, for 1 target have it say 'Target' instead. Capitalize duration 'Rounds' instead of 'rounds'."

2/5/2026 — Power Creator / Data
- Context: Power Creator damage types
- Priority: Medium
- "Power Creator: Remove the damage type 'radiant' - that isn't a Realms damage type. Reference vanilla site for proper damage types and their related part names. (In React site we use IDs for mechanic parts not names)."

2/5/2026 — Character Sheet / Library / List Headers
- Context: All item lists in library
- Priority: High
- "Item list headers, character library: Always have full caps for headers for list items. 'NAME ACTION DAMAGE ENERGY' instead of 'Name Action Damage Energy'."

2/5/2026 — Character Sheet / Library / Column Alignment
- Context: Power item list and other header lists
- Priority: Medium
- "Power item list headers: Ensure the header is centered over the list items (action should be centered over the action type, not right/left aligned). Only exception is name, which is always left centered both header and list items. Duration seems too long - abbreviate where possible and don't include focus/sustain values in overview (include in expanded view instead). Use '4 MIN' instead of '4 minutes (Focus)', '2 RNDS' or '1 RND' etc."

2/5/2026 — Character Sheet / UI / Character Saved Prompt
- Context: Save state UI
- Priority: Low
- "Remove the 'Character Saved' prompt thingy, we only need the 'Unsaved Changes' and 'Saved' UI at the top of the character sheet instead."

2/5/2026 — Character Sheet / UI / Top Bar Relocation
- Context: Character Sheet top bar
- Priority: High
- "Remove the top bar by relocating the options for recovery, level up, edit mode, and save state to icons on the side of the screen (like the dice roller icon but in the top right or somewhere unintrusive). Remove the back to characters arrow/link - the nav bar already has a quick link to the characters tab."

2/5/2026 — Dice Roller / UI Overhaul
- Context: Dice roller/log
- Priority: High
- "Dice roller should work/look more like the original one in the vanilla site, using our custom images from the vanilla site. Keep: ability to add modifier/bonus to custom roll. Don't need to name the roll - just call it 'Custom Roll' in the log. Fix: Show what/how many dice with an image each time you roll, then result plus bonus, then total. Add ability to select dice icons instead of adding numbers, but also implement labeling (1d10 below the 1d10 icon). Dice logs should be saved not cleared on refresh - only last 20 rolls need to be saved."

2/5/2026 — Character Sheet / UI / Chip Expansion
- Context: Chip expanded functionality
- Priority: Medium
- "When you expand a chip, prefer the chip doesn't create a separate bubble for the expanded description - instead expand the chip you clicked on, displacing other chips above/below it, keeping same coloring/styling. Some chips are purely informational and need not expand (tag chips for feats, subtext chips for traits denoting ancestry/flaw/characteristic, codex subtext for character feat/state feat)."

2/5/2026 — Character Sheet / Powers & Techniques / Duplicate Energy Columns
- Context: Powers and techniques list
- Priority: High
- "Duplicate energy columns and energy buttons in powers and techniques. Need only the buttons in the energy row. Energy row can be moved to the most right row. 'Use' button should not say 'Use (X)' - just 'X' where X is the energy. Styles should match roll buttons."

2/5/2026 — Character Sheet / Inventory / Equip Buttons
- Context: Armor/weapons equip functionality
- Priority: High
- "BUG: Armor/weapons still won't become equipped when I hit the equip + button. Better as a circle or other symbol to select/to be filled to show it's equipped."

2/5/2026 — Character Sheet / Inventory / Equipment Tab Issues
- Context: Equipment/Inventory tab
- Priority: Medium
- "Equipment tab issues: needs ability to increase/decrease amount outside edit mode, missing currency/rarity/category tags, could have truncated descriptions after name column like feats/traits. Inventory list items seem taller height-wise than other tabs with larger font or scale - seems off."

2/5/2026 — Character Sheet / Archetype Ability Indicators
- Context: Archetype ability selection
- Priority: Medium
- "For archetype ability (power/martial or both): use the same indicator logic as character creator - selected power ability outlined in power purple, martial ability in martial red, instead of current yellow outlining. Get rid of the 'power' and 'martial' symbols by ability names - they're ugly."

2/5/2026 — Character Sheet / Ability Edit Mode / Centering
- Context: Ability edit mode skill/ability points
- Priority: Medium
- "In ability edit mode in character sheet: center the skill/ability points things in their row so they're more easily visible. Make styles match other instances (ability allocation in character/creature creators, skill point allocation in skill creators). Styles for both resources should be analogous to each other."

2/5/2026 — Steppers / Abilities / Defenses
- Context: ValueStepper hold-to-increase behavior
- Priority: High
- "Exponential speed steppers: we don't need hold to increase functionality on steppers for ability and defense increase, these types of steppers are mostly useful for allocating/adjusting pools like health and energy, not abilities and defenses."
- Expected: Remove enableHoldRepeat from ability/defense steppers; keep only for HP/EN pools

2/5/2026 — Character Sheet / Skills / Caps & Validation
- Context: Skill and defense value caps, game rules
- Priority: High
- "Skill values (not bonuses) cannot exceed 3. Defense bonuses cannot exceed your level based on increases granted by allocating skill points. The bonus could be 3 from an ability of 3 (e.g., mental fort. of 3 from 3 int at level 1), but you couldn't increase defense bonus to 4 using skill points until level 4 or higher, or intelligence increased to 4."
- Expected: Enforce skill value cap of 3, enforce defense bonus cap based on level/ability

2/5/2026 — Character Library / UI Improvements
- Context: Library tabs, currency display, defense buttons
- Priority: Medium
- "Capitalize 'Currency' and separate the currency from the armament proficiency more. Increase font size of tabs, make them more visible. Make defense roll buttons the same style and color as others (they're less saturated)."
- Expected: Capitalize Currency label, bigger tab fonts, defense buttons match primary variant

2/5/2026 — Character/Profile Picture Upload
- Context: Profile and character picture upload
- Priority: High
- "When uploading a character or profile picture, make a modal that lets you upload, choose from device, drag and drop, etc. Show accepted image types/sizes, recommended ratio, and let you manipulate/drag the picture into a translucent frame for cropping. Use best practice, make it sleek, robust, and clean."
- Expected: Full image upload modal with crop/preview for character portrait and profile icon

2/5/2026 — Character Sheet Header / Species Line
- Context: Species name + level display
- Priority: Medium
- "Separate the species name from the level line in the character sheet header."
- Expected: Species name on its own line, not combined with "Level X SpeciesName"

2/5/2026 — Character Sheet / Skills / Point Display
- Context: Skill point current/max visibility
- Priority: Medium
- "In non-edit mode, skill point max/current on the top right of the skill list shouldn't be visible."
- Expected: Hide PointStatus when not in edit mode

2/5/2026 — Character Sheet / Skills / Skill Point Calculation
- Context: Skill points at level 1
- Priority: High
- "All creatures/characters at level 1 have 5 skill points, but species forces 2 into proficiency. Display available skill points as 3/3 instead of 3/5 or 5/5 at level 1, since players only choose where 3 go. +3 each level. Creature creator shows 5/5 since no species selection."
- Expected: Character sheet/creator shows 3/3 (not 5/5), creature creator shows 5/5

2/5/2026 — Character Sheet / Health-Energy Allocation Styles
- Context: HP/EN pool allocation styles
- Priority: High
- "Why is the styles for health pool allocation different than character creator/creature creator? They should all be the same stylistic design, colors, etc."
- Expected: Unify HealthEnergyAllocator styles across character sheet, character creator, creature creator

2/5/2026 — Creature Creator / Health-Energy Hold-to-Repeat
- Context: Health/Energy allocation
- Priority: High
- "Health/Energy allocation should have faster/continuous allotment on button hold, it seems this functionality didn't work in the creature creator? maybe everywhere?"
- Expected: Enable enableHoldRepeat for creature creator HealthEnergyAllocator; verify character creator/sheet (TASK-065)

2/5/2026 — Creature Creator / Defense-Ability No Hold-to-Repeat
- Context: Defense and ability allocation steppers
- Priority: High
- "Defense/ability allocation should NOT have a hold to increase function, as they have little variance."
- Expected: Remove enableHoldRepeat from creature creator DefenseBlock (TASK-066)

2/5/2026 — Creature Creator / Senses & Movement Card Margins
- Context: ExpandableChipList, GridListRow
- Priority: Medium
- "Senses and movement item cards have inconsistent vertical margins above/below the description box, they should be equal padding. This is likely true globally for like item cards."
- Expected: Equal padding above/below description; audit globally (TASK-067)

2/5/2026 — Creature Creator / Add Modals Unification
- Context: Add feat/power/technique/armament modals
- Priority: High
- "Uses old modal styles, not updated to work like character sheet modals. All add X modals with list views should be uniform and match codex/library list view styles. These should be unified global components. Audit best option aligned with unification goals."
- Expected: Replace with GridListRow/UnifiedSelectionModal patterns (TASK-068)

2/5/2026 — Creature Creator / Power-Martial Slider Bounds
- Context: PoweredMartialSlider
- Priority: High
- "Shouldn't allow you to scroll fully to one side/the other. The furthest end of the slider should be 1 for that end, not 0."
- Expected: min power = 1, max power = maxPoints - 1 (TASK-069)

2/5/2026 — Creature Creator / Summary Layout Restructure
- Context: Creature Summary sidebar
- Priority: High
- "At top: boxes with spendable resources (ability, skill, feat, training, currency). Below: summary points (Abilities, Archetype, level, type, size). Below: line items like 'Skills: Stealth +3, Athletics -1, ...' and similar for resistances, immunities, weaknesses. Reference D&D creature stat block."
- Expected: Match other creators' resource box style; D&D stat block format for details (TASK-070)

2/5/2026 — Character Sheet / Health-Energy Edit Mode
- Context: Character sheet edit mode, Health/Energy allocation
- Priority: High
- "When editing health/energy and increasing it, if the current value is at the max, increase the current with the max increase (since that means a character was fully healthy and/or energized when increasing the value, so the current increases with the maximum in those cases.)"
- Extracted to: TASK-072

2/5/2026 — Character Sheet / Speed-Evasion Base Editing
- Context: Character sheet, Speed/Evasion display
- Priority: High
- "Don't show speed/evasion base editing options, instead have a pencil icon by each as with other sections, require that to be clicked to show the option to edit it, and this way it can be red/green if under/over the proper values (in this case, increasing the base is red, and decreasing it is green)."
- Extracted to: TASK-073

2/5/2026 — Dark Mode / Color Contrast
- Context: Dark mode theming
- Priority: Medium
- "Many colors are too contrasting in dark mode and need easier viewing colors to replace them, such as some chip colors, stepper colors, character sheet health/energy backgrounds, power proficiency background, item list headers, some hover-highlight colors (which also white out the hovered white font content of the hovered items) and many many more."
- Extracted to: TASK-074

2/5/2026 — Portrait / Session / Storage Errors
- Context: Character portrait upload, profile picture
- Priority: High
- "/api/session 500 Internal Server Error; Firebase Storage 403 for portraits/ and profile-pictures/ (User does not have permission)."
- Extracted to: TASK-075 (session), TASK-076 (storage rules)

2/5/2026 — My Account / Username Regex
- Context: Username change, Google user
- Priority: High
- "error updating username (google user): Pattern attribute value [a-zA-Z0-9_-]+ is not a valid regular expression: Invalid character in character class. POST my-account 500."
- Extracted to: TASK-077

2/5/2026 — Steppers / Unify Styles Sitewide
- Context: ValueStepper, DecrementButton, IncrementButton
- Priority: Medium
- "Stepper buttons across the site have slightly different styles, sizes, colors. Defenses allocation steppers are smaller, - is grey as opposed to red. Go with less stark colors and unify styles across the site."
- Expected: Consistent sizes, less stark colors, unified btn-stepper styles (TASK-071)

2/6/2026 — Character Sheet Archetype Section / Proficiency Slider
- Context: Character Sheet → Archetype & Attacks
- Priority: High
- "Character Sheet Archetype Section - the archetype prof slider: We don't want this slider visible unless you're in edit mode for archetype proficiency editing, and we only want it visible if you hit the pencil, otherwise we can simply display Power and/or Martial proficiency as a simple value instead of a slider, the slider is designed for editing. (in non edit mode editable)"
- Expected: Slider hidden unless pencil clicked; show "Power: X, Martial: Y" (or similar) when not editing. Extracted to TASK-101.

2/6/2026 — Encounter Tracker / Add Creatures from Library
- Context: Encounter Tracker, Add Combatant
- Priority: High
- "Encounter Tracker: Allow adding creatures from your library (which gets the creatures max health/energy automatically instead of inputting them manually, also allows choosing how many of those creature's you'd like to add, etc. can use the stuff we already have in the add combatant tab, as well as add creature modal using our many components for modals if we want."
- Expected: Add from creature library; auto HP/EN; quantity selector; reuse add combatant/creature modal. Extracted to TASK-102.

2/6/2026 — Encounters System Redesign (Major)
- Context: Encounter Tracker → Encounters
- Priority: Critical
- Raw feedback (abbreviated): Rename to "Encounters"; hub page to create (combat/skill/mixed) or choose saved; click encounter → redirect to that encounter page; save/return to sessions (turns, AP, HP tracked); separate encounters list page (filter, search, sort); designate current as combat tracker; new skill encounter page; new mixed encounter page; skill encounter: add characters, track rolls, successes/failures, required successes/failures, DS-based; mixed = both combined; campaign integration: add characters from campaigns (evasion, acuity, hp, en). Reference core rules. Best practice, shared components, security.
- Extracted to: TASK-103, TASK-104, TASK-105, TASK-106, TASK-107, TASK-108.

2/7/2026 — Batch feedback (roll log, encounters, modals, species skills)
- Context: Multiple areas
- Priority: High
- Raw feedback: "Some roll log fonts are dark in darkmode, thus invisible. non-rm characters aren't being added to combatants in combat or skill encounters from the campaign tab. Neither are simply RM characters in the skill encounters being added. audit skill encounter tasks, it isn't working completely right, check raw/clean feedback to see if theres any issues with skill encounters. duplicate / two X buttons at top right of add feat modal in creature creator, may be an issue elsewhere too (like other add modals in creature creator, these should be using logic/code from other modals but seem to still be different) wont let me hit + to add powers. (may have same issues with techniques and armaments. Species skills aren't automatically loaded/added to the character sheet skill list."
- Extracted/disposition: Roll log dark mode — fixed (dark: variants). Campaign chars — fixed (API ?scope=encounter allows any campaign member). Duplicate X — fixed (UnifiedSelectionModal showCloseButton=false). Species skills — fixed (merge species skills into character sheet skills). Skill encounter audit — TASK-152.

2/9/2026 — Navbar / Structure
- Context: Main navigation header
- Priority: Medium
- Raw feedback: "Navbar: Move campaigns to the right of RM tools and the left of About in the navbar."
- Expected: Campaigns link appears after RM Tools dropdown, before About
- Extracted to: TASK-153 | Done 2026-02-09

2/9/2026 — Admin Codex Editor / Feats tab
- Context: Admin → Codex → Feats list
- Priority: Low
- Raw feedback: "If feat level requirement is 0 display - instead of '0' in the list."
- Expected: feat_lvl 0 → "-" in list display
- Extracted to: TASK-154 | Done 2026-02-09

2/9/2026 — Admin Codex Editor / List delete & UI consistency
- Context: Admin Codex all tabs
- Priority: High
- Raw feedback: "When I delete a list item, the list still shows the item until I refresh the page. Can use the same ui, filter, styles, etc as the codex here to consistency with the exception of the pencil/trash icons for edit and delete. True for all codex tabs. don't need different/repeated styles/ui as they're the same essentially."
- Expected: Delete removes item immediately; Admin tabs match Codex UI/filters/styles; Admin retains edit/delete icons
- Extracted to: TASK-155 | Done 2026-02-09

2/9/2026 — Feat Editing / Ability requirement
- Context: Admin Codex → Feats → Edit modal
- Priority: High
- Raw feedback: "Feat Editing: Should be able to choose ability from a dropdown of the six ability and six defense options, you can pick one or more."
- Expected: ability_req and ability use multi-select dropdown with 12 options (6 abilities + 6 defenses)
- Extracted to: TASK-156 | Done 2026-02-09

2/9/2026 — Feat Editing / Missing fields
- Context: Admin Codex → Feats → Edit modal
- Priority: High
- Raw feedback (abbreviated): All feat fields should be editable: name, description, req_desc, ability_req, abil_req_val, skill_req, skill_req_val, feat_cat_req, pow_abil_req, mart_abil_req, pow_prof_req, mart_prof_req, speed_req, feat_lvl, lvl_req, uses_per_rec, rec_period, category, ability, tags, char_feat, state_feat. Full semantics described in feedback.
- Expected: Edit modal has controls for all listed fields
- Extracted to: TASK-157 | Done 2026-02-09

2/9/2026 — Centralized data schema
- Context: Documentation, AI reference
- Priority: Medium
- Raw feedback: "I'd love if we had a centralized location for all our arrays of data/tables with descriptions of each values that ai can reference to clarify it's utility. For all codex items this is essential as well. Do our best in this area."
- Expected: Doc with all codex entity schemas, field descriptions, valid values
- Extracted to: TASK-158 | Done 2026-02-09

2/9/2026 — Admin Codex / Input lag
- Context: Admin Codex edit modals
- Priority: Medium
- Raw feedback: "lag: when inputting data in edit mode, it seems to have some lag while typing/deleting."
- Expected: Responsive typing in edit inputs
- Extracted to: TASK-159 | Deferred (needs profiling)

2/9/2026 — Admin Codex / Array editing
- Context: Admin Codex edit modals, array fields
- Priority: High
- Raw feedback: "All editing modals: When it comes to arrays, you should be able to select and add from a dropdown for some arrays, or separate by commas if that's the only option when editing. For instance, skills for species should be a dropdown of skills you can add, not a 'ids separated by commas' since admins don't have ids memorized."
- Expected: Array fields (species skills, feat skill_req, etc.) use dropdown of names; store IDs internally
- Extracted to: TASK-160 | Done 2026-02-09

2/11/2026 — Codex Schema / Skills & Feats / Invalid Fields
- Context: Codex data schema (feats, skills, species, traits, items, parts, properties, creature feats)
- Priority: High
- Raw feedback: "Do we have a doc that has all the codex data mapped out with each value, its function, if it's a string array, number, array of numbers, and its exact purpose? We should have something like this that's formatted nicely and cleanly and good for reference. Add to the schema a use column interpreting what I said about it so it's clear exactly what the use of each dataset is for, such as the use for success or failure desc and so on. Also trained only is not a skill field, remove it across the codebase. Remove fields I don't mention, and add fields that are missing, totally refactor across the codebase anything that doesn't align. Feats: name, description, req_desc (requirement description), ability_req (array of ability/defense names out of the twelve), abil_req_val (minimum values for those abilities/defenses), skill_req (names of skills required), skill_req_val (array of minimum bonuses), feat_cat_req (feat category you must already have), pow_abil_req, mart_abil_req, pow_prof_req, mart_prof_req, speed_req, feat_lvl, lvl_req, uses_per_rec, rec_period, category, ability (sorting, can be array), tags, char_feat, state_feat. Skills: id, name, description, ability (array), base_skill (blank for base skills, id of non-sub-skill for sub-skills, id 0 means can be a sub-skill of any skill), success_desc, failure_desc, ds_calc, craft_failure_desc, craft_success_desc. All additional skill descriptions that aren't part of the skill description itself can be expandable chips in skill item cards (codex, add skill modals, add sub skill modals, etc.). Species: id, name, description, type, sizes (allowed sizes), skills (two skill ids where 0 means choose a species skill), species_traits, ancestry_traits, flaws (trait ids with flaw=true, usually 3), characteristics (trait ids with characteristic=true, usually 3), ave_hgt_cm, ave_wgt_kg, adulthood_lifespan ([adult age, max age]), languages (array of language names), part_cont exists currently but will be removed/ignored. Traits: id, name, description, uses_per_rec, rec_period, flaw, characteristic. Items: id, name, description, category, currency, rarity (Common, Uncommon, Rare, Epic, Legendary, Mythic, Ascended). Parts: id, name, description, category, base_en (may be percentage depending on percentage flag), base_tp, op_1/2/3_desc, op_1/2/3_en, op_1/2/3_tp, type (power or technique), mechanic (boolean), percentage (boolean), duration (boolean), defense (what defense(s) are targeted, can be array). Properties: id, name, description, base_ip, base_tp, base_c, op_1_desc, op_1_ip, op_1_tp, op_1_c, type (Armor, Shield, or Weapon). Creature feats: id, name, description, feat_points (relative to character archetype feats), feat_lvl, lvl_req, mechanic (some function as mechanics, not visible in list but still consume feat points)."
- Expected: CODEX_SCHEMA_REFERENCE includes a Use column for all codex entities with accurate types and purposes for each field per this spec; `trained_only` is removed as a skill field across docs, types, API, and admin UIs; deprecated fields like `part_cont` are removed from schema docs and treated as legacy only.

2/11/2026 — Codex Seed & ID-based Cross-Refs
- Context: Codex CSVs, seeding into Supabase, and ID semantics
- Priority: High
- Raw feedback: "I need to completely delete all fields/data within the current website's/supabase database codex and replace them with a new set. This means we need to totally make the seed to supabase script compliant with our refactored codex information and these desires. We also need to audit the codebase for discrepancies between the correct codex schema and what's currently being used. In the codex schema reference update feats so that skill req are ids, never names, same with species traits, flaws, characteristics, and skills, all use ids to tie to the proper thing, not names, ever, only ids. Also I renamed 'items' to 'equipment' so we'll need to update that entirely across the site that was referencing the items database as it's now the equipment database codex_equipment. Also, I added 'mechanic' field to the properties data, its a boolean that if true represents a property that, like other mechanic properties, parts, creature feats, etc, do not show up in the traditional 'add part/property/feat' dropdown lists, since they're integrated with the UI already. This means for the armament creator specific properties (Damage Reduction, Armor/Weapon stat requirements, Agility Reduction, Split Damage Dice, Range, Two-Handed, Shield Base, Armor Base, Weapon Damage, etc.) have been made into mechanics and we can use that code/logic now instead of manually taking them out of the add property lists."
- Expected: (1) `scripts/seed-to-supabase.js` wipes all codex tables and reseeds from the canonical Codex CSVs using the updated schema; (2) CODEX_SCHEMA_REFERENCE documents feat `skill_req` as ID arrays, and species `skills`/`species_traits`/`ancestry_traits`/`flaws`/`characteristics` as ID arrays (never names); (3) all references to codex “items” are updated to use “equipment” / `codex_equipment`; (4) properties gain a `mechanic` boolean field, and a follow-up task wires this into armament creator UIs so mechanic properties no longer appear in normal add-property dropdowns.

2/9/2026 — Encounters / Campaigns / Roll Log / Character Visibility (Batch)
- Context: Multiple areas — Encounters, Roll Log, Campaigns, Character Sharing
- Priority: Critical
- Raw feedback: "Roll logs/Campaigns/Encounters: Allow attaching a campaign to an encounter upon creation or within the encounter, this allows you to click a button 'Add all Characters' or something that lets you add all the characters from the campaign into the encounter automatically. I also see that encounter combatants are not fully loading with their accurate current/max energy and health (when the combatant is tied to a users character). add a roll log (same ui/functionalty/styles as the character sheet) to encounters for RM to use to make rolls (privately, not to the campaign) but which also has the tabs so they can see the rolls in their campaigns. in the encounter tab (roll log campaign mode), character sheet (campaign mode), and campaign page, make the roll log styles consistent, ensure it shows the roll date, most say 'unavailable' for the date. also rolls should be REAL TIME synced between characters and campaigns and other characters/users, so we may need to update the database, supabase settings, and so on to make it real time. The other realtime data would be current health and energy synced between encounters and the characters themselves. Character visibilty: When a user sets a character to public, anyone else should be able to copy the link to that character and use it in their browser to see the character, with the exception that they wouldn't be allowed to edit ANYTHING. is it's set to campaign only, the RM and other users in the campaign should be able to see (not edit) it. If it's set to private and they join a campaign, it should automatically set the character privacy to campaign only (make a notifcation when they join a campaign with a private character that it will set the characters visibility to campaign only. Note: Since characters use powers, techniques, armametns, items, etc which are also from users private library, these also would need to be visible to others, again, without editing privilages."
- Extracted to: TASK-161 through TASK-168

2/11/2026 — Admin Codex UI — Creature Feats, Equipment, Traits, Species, Skills, Feats, Parts, Properties
- Context: Admin Codex → Creature Feats / Equipment / Traits / Species / Skills / Feats / Parts / Properties
- Priority: High
- Raw feedback (abbreviated): Admin Codex edit and list UIs are missing or misrepresenting important schema fields. For creature feats there is no way to set feat level, required creature level, or a mechanic flag; equipment lacks proper inputs for category and currency, uses an incorrect type selector, and loads existing cost as 0 in the edit modal; property edit modals default type to a non-existent \"general\" type and do not reflect mechanic properties accurately; parts editing/filtering mishandles mechanic and duration flags and shows percentage-based EN as raw values instead of percentages; list rows with options (parts/properties) do not show those options as expandable chips; trait edit modals do not show flaw/characteristic checkboxes as checked when true; species editing exposes a \"Primary size\" concept instead of only sizes[] and does not make selected traits expandable for RMs to read descriptions; skills and feats filters show duplicate \"All\" options, skills base-skill columns show \"-\" even when base_skill_id is set, and skill edit modals do not reliably surface the base skill.
- Expected: Admin Codex tabs for creature feats, equipment, traits, species, skills, feats, parts, and properties align with CODEX_SCHEMA_REFERENCE: editors expose all relevant schema fields (including feat_points/feat_lvl/lvl_req/mechanic, equipment category/currency, property type/mechanic, part mechanic/percentage/duration), boolean flags load into checkboxes correctly, size handling uses sizes[] rather than a separate primary size, base skills display and edit correctly, filter dropdowns avoid duplicate \"All\" options, percentage-based EN is formatted as percentages, and any parts/properties with options render those options as expandable chips in both Codex and Admin Codex list expanded views.
- Extracted to: TASK-190, TASK-191, TASK-192, TASK-193, TASK-194

2/11/2026 — Core Rules Corrections (Owner Batch from Core Rulebook)
- Context: Game rules, ability caps, damage types, feat formulas, creature progression, conditions, sizes, recovery, experience, archetype progression
- Priority: Critical
- Raw feedback (aggregated from multiple messages):
  1. Damage Types: No "physical vs magic" split. All damage types are a flat list. Only distinction is armor exceptions (Psychic, Spiritual, Sonic not reduced by armor). Full list: Magic, Fire, Ice, Lightning, Spiritual, Sonic, Poison, Necrotic, Acid, Psychic, Light, Bludgeoning, Piercing, Slashing.
  2. Levels by Rarity: Common 1-4, Uncommon 5-9, Rare 10-14, Epic 15-19, Legendary 20-24, Mythic 25-29, Ascended 30+.
  3. Ability caps: Hard cap 10 for characters, 20 for creatures. NO level cap. Cost 2 per point starting at 4+ (NOT 3+). Code was correct, GAME_RULES.md table was wrong.
  4. Skill soft cap: 3 points per 1 increase past 3 (base), 2 per 1 past 3 (sub-skill). Already correct in docs.
  5. Character feats: 1 per level, always, all archetypes. Total = level.
  6. Archetype feats: 1 per level base + martial bonus (Martial gets +2 at L1, +1 every 3 levels starting at 4). Power = level. Powered-Martial = milestones choose feat or innate.
  7. Full Power Character Progression table provided (innate threshold/energy/pools/power prof by level).
  8. Full Martial Character Progression table provided (bonus feats/total feats/armament prof/martial prof by level).
  9. Full Powered-Martial Progression table provided (innate or feat choice every 3 levels, prof increase every 5).
  10. Armament Proficiency by Martial Prof confirmed: 0→3, 1→8, 2→12, 3→15, 4→18, 5→21, 6→24.
  11. Creature skill points: 5 at level 1, 3 per level (NOT 5 per level as previously documented).
  12. Creature base training points: 22, TP per level: 2 (same as characters, NOT 9/1).
  13. Full conditions list provided from core rulebook (13 standard + 10 leveled) with detailed descriptions.
  14. Full sizes table (8 sizes: Miniscule through Gargantuan) with carrying capacity — already in GAME_RULES.
  15. Full recovery rules from core rulebook — requirements (nutrition, doff armor, etc.), interruption rules.
  16. Full experience/leveling rules: XP threshold = Level × 4, Combat XP = sum enemy levels × 2.
  17. core_rulebook_extracted.txt is the pure source of truth for game rules.
- Expected: GAME_RULES.md corrected with all values. Task queue updated. TASK-195 cancelled (code was correct). TASK-198, TASK-199 resolved with owner-confirmed values. TASK-221 creature values corrected.
- Extracted to: Updates applied to TASK-195 (cancelled), TASK-198 (resolved), TASK-199 (resolved), TASK-221 (corrected), GAME_RULES.md (updated)

### 2/11/2026 — About page, Skill encounter, Combat tracker (batch)
- Raw feedback (abbreviated): About: dice carousel no brackets, center below content, cycle with selected middle (d10 d12 d20 [d4] d6 d8 d10), add second d10 slide (Join Community/Discord). Skill encounter: skill dropdown, success/failure descriptions per roll, allow updating DS post-rolls, fix save/load of rolls, rename Progress to Successes, red failure dots cancel green (net display), Additional Success/Failure buttons, RM Bonus per participant. Combat: surprised checkbox on list items, initiative edit auto-select value, delete combatant don't advance turn, re-sort initiative each round start, keep Sort Initiative in bar when active, Auto Sort Initiative toggle.
- Extracted to: TASK-235 (About dice carousel), TASK-236 (Skill encounter Successes/RM bonus/DS), TASK-237 (Combat surprised/initiative/delete/auto-sort). Implemented 2026-02-11.

### 2/13/2026 — Feat restrictions, species skill Any, creator skills, defense bonuses (batch 1 — implemented)
- Feat requirements: skill_req_val = required skill BONUS (not value); all skill requirements require proficiency. Example: sub skill req 5 = ability + base value + sub value = 5 bonus.
- Species skill id "0": Display as "Any"; represents user picks any skill or extra skill point. Character sheet/creation: id 0 = +1 skill point; don't allocate a fixed skill for 0.
- Character creator skills: Remove ability-grouped sub-tabs; single flat list like character sheet with headers Prof, Skill, Ability, Bonus, Value; reuse SkillRow/table layout; auto proficient when adding; disable Add when no skill points; skill points display one row (no wrap).
- Defense bonuses in creator: Show bonus when increasing defense (same styles as character sheet defense edit section).
- Implemented 2026-02-13 (formulas.ts getSkillBonusForFeatRequirement; add-feat-modal, feats-step; species id 0 in resolveSkillIdsToNames, species-modal, skills-step, SkillsAllocationPage, characters page; skills-allocation-page flat table, PointStatus nowrap, defense bonus display).

### 2/13/2026 — Creator feats filter, add modals, feats tab (batch 2 — implemented)
- Character Creator feats: Either/or filter (Archetype feats | Character feats), not "All Feats". Label "Showing all feats" not "Show all feats". Add ability as sort option. Selected feat chips expandable to show description.
- Add Power / Add Technique modals: Align with add-feat and library — list headers, collapsed/expandable rows, add button on right, shared styles and gridColumns.
- Feats tab: Uses current/max as steppers (increase/decrease); remove redundant (X/X) after feat/trait name; expand name column, move uses column right; reuse quantity-editor-style steppers.
- Implemented 2026-02-13 (feats-step filter/sort/chips; add-library-item-modal layout; feats-tab steppers, hideUsesInName, column widths).

---

**Raw Feedback Log — 2/13/2026 (session batch 1)**  
- Date: 2026-02-13  
- Context: Feat requirements, species skills, character creator skills, defense display  
- Priority: High  
- Feedback: Feat skill_req_val = required BONUS not value; proficiency required. Species skill id 0 = "Any" / extra skill point; display "Any", account for extra point in sheet/creator. Creator skills: flat list, sheet-style table (Prof, Skill, Ability, Bonus, Value), no ability tabs, auto proficient on add, no add if no points; skill points one row. Defense bonuses shown when increasing in creator.  
- Expected: Implemented 2026-02-13.

**Raw Feedback Log — 2/13/2026 (session batch 2)**  
- Date: 2026-02-13  
- Context: Creator feats filter, add modals, feats tab  
- Priority: High  
- Feedback: Creator feats either/or (archetype or character). "Showing all feats" not "Show all feats". Ability sort in creator. Selected feat chips expandable with description. Add power/technique modals align with add-feat and library (headers, collapsed views, add on right, shared styles). Feats tab: uses as steppers; remove redundant X/X after name; widen name column, uses column right.  
- Expected: Implemented 2026-02-13.

**Raw Feedback Log — 2/13/2026 (session batch 3)**  
- Date: 2026-02-13  
- Context: Dark theme, feat creator, sub-skills, species skill, modals, armaments  
- Priority: High  
- Feedback:
  1. Dark theme text: many dark theme font colors are too dark on backgrounds. Example: home page feature cards text on neutral-300.
  2. Archetype feats shown twice in dropdown → change to toggle button "Showing Archetype" / "Showing Character" feats.
  3. Sub-skills (e.g., Tinker) should count as proficient for feat requirements. Proficiency check failing despite sub-skill being added.
  4. Remove Level header from feat list in character creator (unnecessary since filtered to available feats). Make Ability a real filter, not just a sort header.
  5. Add technique/power modals should match character sheet column display (Action, Damage, Area for powers; Action, Weapon for techniques).
  6. Species with 0 species skills: finalize validation using wrong max skill points (missing extra skill point from species skill "0" = Any).
  7. Armor/weapons: critical range showing raw bonus instead of threshold, armor DR fallback from properties needed.
- Expected: All items implemented 2026-02-13.

**Raw Feedback Log — 2/14/2026 (session batch)**  
- Date: 2026-02-14  
- Context: Library, feats, skills, ranged weapons, part chips, roll log, character sheet  
- Priority: High  
- Feedback:
  1. Remove the "mine" tags from items in your personal library — it's implied they're yours because you have them in the "My Library" tab.
  2. Feats have abilities tied to them used to sort them; abilities can be sorted and displayed as a list in codex lists, e.g. "Strength, Intelligence" etc, instead of "StrengthIntelligence" etc. This is how it should be displayed in lists.
  3. Skills discrepancy between character creator and character sheet: character sheet loaded skills as all having +1 to the skill values AND proficiency. Proficiency costs a skill point regardless of a skill value increase. Character creator adds skills as having skill values of 1, instead of 0 — they should be added as proficient but skill value of 0, not 1. Don't remove a skill you add in character creator when you hit - at 0; instead just don't let you decrease skill stepper skill values below 0.
  4. The range for my ranged weapon I made didn't save, and/or doesn't display in my character sheet as having the range that it has — it just loads as melee. It seems to be accounting for the range by using acuity as the attack bonus, but not accounting for it regardless.
  5. The part chips in the powers/techniques should be expandable to show what that part is, what the options are, and what each of their increase levels are. Also all powers and techniques and items etc need to show their descriptions in their expanded views; some are missing these traits.
  6. When viewing a character sheet that's not your own, don't allow rolling for them/as them if it's not your character.
  7. Rolls between different roll log locations don't seem to be updating in realtime; you need to refresh to see the updated rolls.
- Expected: Mine badges removed in My Library; feat abilities as comma-separated list; creator adds skills with value 0 (proficient), stepper doesn't remove at 0; weapon range derived and displayed on sheet; part chips expandable with options/levels; descriptions in expanded views; no rolling when viewing others' characters; roll log realtime across locations.

**Raw Feedback Log — 2/14/2026 (session batch)**  
- Date: 2026-02-14  
- Context: Character/portrait deletion, user management, About page dice, character creator skills  
- Priority: High  
- Feedback: (1) Character/picture Deletion: Delete old portrait from database when character updates one, same with profile picture. Remove portraits from storage when character is deleted. (2) User management: Users who have uids and are admins shown as "Admin" with inability to alter that role instead of dropdown. (3) About page: Selected dice icon should be middle icon, 3 dice on each side; arrows cycle selection (e.g. d10 d12 d20 [d4] d6 d8 d10 → right → d12 d20 d4 [d6] d8 d10 d10). (4) Character creator skills: Add skill as proficient (blue dot) + skill value 0, costs 1 pt. Increase value costs 1 pt each. Decrease to 0 doesn't remove proficiency for base skills. Sub-skills: add as proficient with value 1 (1 pt total); decrease to 0 removes proficiency. Formula: proficient base skills + sum of all skill values = spent skill points.  
- Expected: Implemented 2026-02-14.

**Raw Feedback Log — 2/14/2026 (creator expand + load audit)**  
- Date: 2026-02-14  
- Context: Creature creator, Power/Technique/Item creators  
- Priority: High  
- Feedback: (1) When enabling powers, armaments, techniques in the creature creator, auto-open the list (expanded) instead of collapsed — you enabled it to add something. (2) Audit load option/functionality in creators. Loading must update all UI, option levels, added parts/properties to exactly match the saved item: range, damage dice, action type, armament type, description, properties, option levels, etc. Any existing UI state must be completely cleared/reset before load to avoid corruption. Applies to armaments, powers, techniques, and creatures.  
- Expected: Implemented 2026-02-14. Creature sections expand when enabled. All creators reset before load; technique load restores actionType/isReaction; item load supports armorValue fallback; creature load does full replace (no merge).

**Raw Feedback Log — 2/17/2026 (Species skill description + step check mark)**  
- Date: 2026-02-17  
- Context: Character creator — Species step, step tabs  
- Priority: Low  
- Feedback:  
  (1) Bug — Skill description carrying over: Make a new character → Select "2. Species" → Click a Species → Under "Species Skills" click a skill to show description → Click off that Species and click a different Species. Observed: Skill description from the first Species stays open on the second. Expected: Skill description should close when clicking off of a Species.  
  (2) Bug — Character creation Step missing check mark: Make a new character → Choose and confirm Archetype → Select and pick a Species → Click the "3. Ancestry" tab. Observed: Users can complete but not "confirm" a Step so it doesn't get a check mark. Expected: Step should warn the user if they have made a selection but not confirmed it.  
  (Note: Seeming did not impact character creation. BLOCKED: Users can not view completed Character sheets. 2/17/2026)  
- Expected: (1) Clear skill description when switching species in modal. (2) When navigating to another step via tab with unconfirmed selection, show warning and offer to mark complete and go.  
- Implemented 2026-02-17: (1) species-modal.tsx — clear selectedSkill when isOpen becomes false and when species?.id changes. (2) creator-tab-bar.tsx — handleContinueAnyway now calls markStepComplete(currentStep) so the step gets a check mark when user clicks "Continue anyway". TASK-250, TASK-251.

**Raw Feedback Log — 2/17/2026 (Add power/technique modals + Finalize abilities)**  
- Date: 2026-02-17  
- Context: Character creator, Creature creator, Finalize step  
- Priority: High  
- Feedback: (1) The select/add powers and select/add technique modals in the character creator are not unified in UI/styles/format with other add power/technique modals; they're missing the layout of column headers, collapsed item headers, etc. This is likely an issue in the creature creator too. (2) Finalize Step: Abilities shouldn't ever be abbreviated to less than 3 letters; the current finalize step makes them all one letter. Show 3-letter abbreviations at least, but prefer full text: "Strength", "Vitality", etc.  
- Expected: (1) Character creator and creature creator add power/technique modals match character sheet add-library-item modal: same column headers (e.g. NAME, ACTION, DAMAGE, AREA for powers; NAME, WEAPON, PARTS for techniques), collapsed/expandable row layout, list header bar. (2) Finalize step abilities display as full names (Strength, Vitality, …) or at minimum 3-letter abbreviations, not single letters.
- Implemented 2026-02-17: (1) TASK-252 — Character creator powers-step: columns + gridColumns for power (Action, Damage, Area) and technique (Weapon, Parts); creature creator transformers stats and modal columns/gridColumns aligned; (2) TASK-253 — ABILITY_DISPLAY_NAMES in constants; finalize-step uses full ability names.

**Raw Feedback Log — Creators description/dropdown contrast + accessibility audit**  
- Date: 2026-02-18  
- Context: Creators (Technique, Armament), add Part/Property  
- Priority: Low (contrast), Serious (accessibility)  
- Feedback: Steps: Creators → Techniques or Armaments → Add a Technique Part or Property. Observed: The description can not be easily read as the text is light blue on white. Expected: Description should change for Dark-mode like on the Power Creator. Issue is effecting Dropdown menus as well for all 3 Creators. In addition we need to do an accessibility audit to prevent from lawsuits: Elements must meet minimum color contrast ratio thresholds (WCAG 2.1 AA - 4.5:1 small text, 3:1 large text). Rule ID: color-contrast, User Impact: Serious, Guidelines: WCAG 2.1 (AA), WCAG 2.0 (AA), WCAG 2.2 (AA).  
- Expected: (1) Description text uses semantic tokens (text-text-primary) that adapt to dark mode like Power Creator. (2) Dropdown menus across Power/Technique/Armament creators meet WCAG AA contrast. (3) Full accessibility audit for color contrast across site.  
- Extracted to: TASK-254 (implement), TASK-255 (accessibility audit)

**Raw Feedback Log — Character creator allocate skills tab (species value 0, bonuses, ability choice)**  
- Date: 2026-02-17  
- Context: Character creator — Allocate skills tab  
- Priority: High  
- Feedback: (1) Species skills are added as proficient with skill value 0, not 1 — I've given feedback about this before. (2) Skill bonuses seem inaccurate; reference GAME_RULES for skills/subskill bonus calculations. (3) Skills with multiple ability options (e.g. Craft) should let me choose which ability the skill uses; default should be the highest value ability at that point, but I need to be able to select. (4) Unity between skill calculations in character sheet, creature creator, and character creator.  
- Expected: Species skills = proficient + value 0; bonus formulas per GAME_RULES (proficient base = ability + value, sub-skill = ability + base value + sub value; unproficient = ½ ability round up or ×2 if negative); multi-ability skills have ability selector, default highest; same formulas everywhere.  
- Implemented 2026-02-18: (1) Character sheet merge of species skills now uses skill_val: 0 (was 1). Character creator already set species skills to 0. (2) formulas.ts already matches GAME_RULES. (3) Ability selector for multi-ability skills already present (skillAbilities, onSkillAbilityChange in skills-step and SkillsAllocationPage). (4) Same formulas used in formulas.ts across sheet/creator; creature creator uses calculateSkillBonusWithProficiency. Base skill gaining proficiency in sheet now explicitly set to skill_val: 0.

**Raw Feedback Log — 2/18/2026 (Species height/weight/lifespan, codex unification, skill ability, public codex)**  
- Date: 2026-02-18  
- Context: Character creator Ancestry tab, Codex (admin + public), species editor, skill admin, equipment/property editors  
- Priority: High  
- Feedback: (1) Character creator Ancestry tab: height, weight, lifespan, adulthood should be in the species summary with size, type, skills, languages; they are missing. (2) Age/height/weight numbers are missing in many forms (codex, character creator). (3) Codex editor: ensure average height/weight and sometimes lifespan (max age) and adulthood are present; example species in Supabase uses ave_hgt_cm, ave_wgt_kg, adulthood_lifespan (e.g. 3). (4) Use common styles and load/display logic for species across the site. (5) Skill edit admin: "governing ability/defense" should be abilities only, not defenses, for skills. (6) Sync codex species display with admin style (expandable cards); include languages, age, weight/height. (7) Add "Traits" tab to public codex, mimicking admin codex (no edit/delete). (8) Public codex: hide some tabs by default; "Advanced" reveals power/technique parts, armament properties, creature feats, traits. (9) Audit public vs admin codex: use same layouts/components/styles; options in parts/properties should be expandable chips with IP/TP/c/EN costs and description; parts/properties missing descriptions in public codex. (10) Edit property: option costs need labels for IP/TP/c; description field bigger. (11) Edit equipment: category dropdown with list of existing categories + add new. (12) Column headers aligned with collapsed item cards across codexes/admin/library; remove inline styles in favor of reusable components. (13) Armament properties not always showing descriptions in codex when they have options (shows only options).
- Expected: Species summary everywhere includes height, weight, lifespan, adulthood; API maps ave_hgt_cm/ave_wgt_kg and adulthood_lifespan; skill admin uses abilities-only; public codex has Traits tab and Advanced toggle; unified codex display and chip styles; property/equipment editor improvements; column/component consistency.