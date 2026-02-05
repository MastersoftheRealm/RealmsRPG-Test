# ALL_FEEDBACK — Consolidated & Curated

Last updated: 2026-02-05

Purpose
- Single, de-duplicated, organized source of owner feedback supplied to AI agents.
- Top: curated, grouped, actionable guidance for engineers.
- Bottom: an appendable "Raw Feedback Log" where new raw entries can be pasted verbatim each time new feedback is issued.

How to use
- Read the curated sections for priorities and intent.
- Append new raw feedback to the bottom under "Raw Feedback Log" using the provided template.
- Keep raw entries chronological (oldest first), newest at the bottom.

Agent Integration (NEW)
- Primary coordination files for AI agents live under `src/docs/ai/`.
- Workflow:
	1. Human appends raw feedback to this file (bottom) using the Raw Entry Template.
	2. AI agent runs the extractor and creates a task in `src/docs/ai/AI_TASK_QUEUE.md` using `AI_REQUEST_TEMPLATE.md`.
	3. Agents implement, create PRs with `ai/` branch prefix, and append changelog entries to `src/docs/ai/AI_CHANGELOG.md`.
	4. On merge, agents mark task `done` in `AI_TASK_QUEUE.md` and leave a short verification note.

Notes:
- Do NOT place secrets or service account keys in these docs. Use `SECRETS_SETUP.md` and cloud secret manager for deployments.

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

### 6) Modals & Lists
- Shared modal/list components should include: rounded headers, header spacing, sortable columns, and right-aligned add/select controls.
- Remove "# items" counts and ensure list header spacing equals item spacing.

### 7) Bugs / Behavior to Prioritize
- Login redirect: return user to the page that initiated login.
- Character creator: persist skill allocations automatically when switching tabs.
- Creature creator: hide unarmed prowess options > level 1 for new characters; fix dropdown alignment; make summary scroll behavior consistent.
- Powers/Techniques/Armaments: ensure RTDB enrichment computes and displays EN/TP/C in all list views.

### 8) RTDB & Data Guidance
- Enrich saved items by resolving saved IDs against RTDB entries to obtain base_en/base_tp/op_* values.
- Parts and properties must have their costs applied during display and item calculations.

---

## High-Level Action Items
- [ ] Audit lists/modals to use shared `ListHeader`/`GridListRow` components.
- [ ] Unify skills into `SkillRow` and replace inline implementations.
- [ ] Ensure RTDB enrichment pipeline correctly computes EN/TP/C for powers/techniques/armaments.
- [ ] Standardize SelectionToggle and equip persistence outside edit mode.
- [ ] Replace chevrons causing layout shifts; ensure expanders do not break grid flow.

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