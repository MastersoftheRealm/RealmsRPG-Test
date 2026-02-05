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

