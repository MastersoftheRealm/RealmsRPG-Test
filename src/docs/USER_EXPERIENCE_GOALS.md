# User Experience Goals & Implementation

**Purpose:** Single reference for Realms UX goals, how we implement them, what’s done, what’s left, and what AI/developers should consider when making UX changes. Based on the Realms UX, Retention & Onboarding Plan and session implementation (Feb 2026).

**Audience:** Product, engineers, and AI agents working on UI, copy, onboarding, or retention.

---

## 1. Our UX Goals

### 1.1 Core principles (from the plan)

- **Fun first, flavor second, rules third** — Align with the core rulebook: freedom in creativity, engaging gameplay, and “create exactly what you envision.”
- **Official content first-class** — Codex and Realms Library are the game’s reference and playable content (species, feats, skills, powers, techniques, armaments, creatures). They should feel like “what’s in the game,” not “pre-made” or “public” (which implies community-made).
- **Account at value, not at door** — Let users see value before sign-in: browse Codex, try the character creator as a guest, and see Realms Library (or a read-only browse). Require account only when saving a character, adding from Realms Library to My Library, or opening My Library/Campaigns.
- **Progressive disclosure** — Show simple paths first (browse Codex, Realms Library, pick from lists); “Create your own” / “Build custom” is secondary for customizers.
- **Light progression feel** — Step progress, small confirmations, and brief positive moments (e.g. “Your character is ready!” on save, “Added to My Library” toast) without heavy gamification or childish tone.
- **Community and belonging** — Discord and “Run a campaign” / “Find a group” as clear CTAs so users see there are people to play with.

### 1.2 Terminology (non-negotiable)

**Site motto:** Realms uses the tagline **"Your new favorite roleplaying game"** across the site (home hero, footer, about page, metadata). It positions Realms as a confident choice for TTRPG players (cf. D&D’s “The world’s greatest roleplaying game”). Defined in `src/lib/constants/site-copy.ts` as `REALMS_MOTTO`.

**Content naming:**

| Use | Avoid |
|-----|--------|
| **Realms Codex** (or Official Codex) | “Public Codex” |
| **Realms Library** (or Official Library) | “Public Library” |
| **My Library** (user’s personal collection) | — |
| “From the Codex” / “From Realms Library” | “Pre-made,” “use pre-made content” |
| “Create your own” / “Build custom” | Implying official content is “lesser” |
| “Add to My Library to use as-is or customize” | — |

Future **Archetypes** (ready-to-play character builds) will live in Realms Library.

### 1.3 User segments we serve

- **New to TTRPG / low effort** — Play quickly; default to “from Codex” / “from Realms Library” in creator; optional quick-start/Archetypes and guided hints.
- **New to Realms, experienced TTRPG** — Clear Codex + Realms Library entry points; optional “how Realms differs” (customization + flavor first).
- **Customizers / min-maxers** — “Create your own” path, no forced tutorial; keep creators, Parts, filters, duplicate/edit; optional “Pro tips” or shortcuts.
- **RMs / group play** — Campaigns + Discord + “Find a group” as visible CTAs after login.

---

## 2. How We Implement Those Goals

### 2.1 Landing and first touch

- **Home:** Hero tagline (“Create your character your way — use what’s in the game or build your own”), two primary paths (Browse Codex, Browse Realms Library, Create a character), “Join the Community” (Discord) in hero/features and footer.
- **No login required** for: Home, About, Rules, Codex, character creator (guest), public character sheet, **and** read-only Browse Realms Library (`/browse`).
- **Gated:** Characters list, Library (My Library + Realms Library), Campaigns, Encounters, My Account — use `ProtectedRoute`; redirect to `/login` only when user tries to open these.

### 2.2 Character creator

- **Guest flow:** Full wizard with localStorage; login only when saving.
- **Defaults:** In steps that use official content (Species, Feats, Powers, Techniques, Equipment), source filter defaults to **Realms Library** / Codex so “From Realms Library” / “From Codex” is first; “Create your own” is secondary. No “pre-made” label.
- **Finalize step:** When not logged in, show “Create an account to save your character. Your progress is stored locally until you sign in.”
- **Step progress:** Subtitle shows “Step X of 9”; tab bar shows checkmarks for completed steps.
- **On save:** Success toast “Your character is ready!” then redirect to character sheet (or `returnTo`).

### 2.3 Realms Library and Codex

- **Codex:** Labeled “Realms Codex” in UI; no “Public Codex.” Reference for species, feats, skills, equipment, parts, traits.
- **Realms Library:** Labeled “Realms Library” in Library page and everywhere; “My Library” is the user’s collection. Copy: “Add to My Library to use as-is or customize.” On add: toast “Added to My Library. You can use it as-is or edit a copy.”
- **Browse without login:** Route `/browse` shows Realms Library content read-only (no “Add to my library” until login); CTA “Log in to add to My Library” or “Open My Library” when logged in.

### 2.4 Post-signup and onboarding

- **Welcome banner:** For logged-in users on home, dismissible banner (once per session): “Welcome! Finish your character, browse Realms Library, or join the community” with links to Create character, Realms Library, Join Discord. Includes “Take a quick tour” to open the guided tour.
- **Guided tour:** Optional 4-step modal (Welcome → Codex → Library → Character creator & save) with **Skip** and “Don’t show again” (localStorage). Triggered from welcome banner only (no auto-pop). Component: `OnboardingTour` in `@/components/shared`.

### 2.5 Community and campaigns

- **Discord:** “Join the Community” link in header nav, footer, About page, and home CTAs. Single invite URL (e.g. `https://discord.com/invite/WW7uVEEdpk`) used everywhere.
- **Campaigns:** Gated; after login, Campaigns page is the hub for “Run a campaign” / “Join campaign.” Optional future “Find a group” linking to Discord or LFG.

### 2.6 Progression and tone

- **Character creator:** Step X of 9, checkmarks on completed steps; on finalize/save, positive message (“Your character is ready!”) instead of bare “Saved.”
- **Library:** Toast on add from Realms Library reinforces ownership: “Added to My Library. You can use it as-is or edit a copy.”
- **Tone:** Epic but not over the top — “ready,” “set,” “your character,” “your library.” No generic “Achievement unlocked!” or juvenile copy.

---

## 3. What We Have Done (Implemented)

- [x] **Terminology:** “Public Codex” → “Realms Codex,” “Public Library” → “Realms Library” across UI, nav, Library page, Codex tabs, creators, filters, toasts, and admin. “My Library” clear; copy “Add to My Library to use as-is or customize.”
- [x] **Landing and CTAs:** Hero tagline; feature cards for Create a character, Browse Codex, Browse Realms Library (→ `/codex`, `/browse`); “Join the Community” (Discord) on home and in nav/footer/About.
- [x] **Character creator defaults:** Source filter default “Realms Library” in powers, equipment, species steps; modal copy “Choose from Realms Library or your library” and “Create your own” secondary; guest flow intact; “Create account to save” on finalize when not logged in.
- [x] **Realms Library without login:** Read-only route `/browse` with tabs Powers, Techniques, Armaments, Creatures; `LibraryPublicContent` with `readOnly={true}`; no Add button until login.
- [x] **Post-signup welcome:** Dismissible welcome banner on home for logged-in users (sessionStorage); links to Create character, Realms Library, Join Discord, and “Take a quick tour.”
- [x] **Progression/dopamine:** “Step X of 9” on character creator page; success toast “Your character is ready!” on save; Library add-toast “Added to My Library. You can use it as-is or edit a copy.”
- [x] **Quick start placeholder:** Character creator shows a short callout that ready-to-play Archetypes (e.g. Martial striker, Power caster) will be available soon in Realms Library; for now, choose from Codex and Realms Library in each step.
- [x] **Discord and community links:** “Join the Community” in header nav (external), footer, About, and home CTAs; single Discord invite URL used everywhere.
- [x] **Guided tutorial:** `OnboardingTour` component (4 steps, Skip, “Don’t show again”); triggered from welcome banner “Take a quick tour”; localStorage key `realms_tour_completed`.

---

## 4. What Still Needs to Be Done (Backlog)

- [ ] **Archetypes in Realms Library:** Ready-to-play character builds (species, archetype, sample feats/skills/powers/techniques) in Realms Library; “Quick start” in character creator would load one and let user name/tweak. Requires data model and UI for Archetype entities and “Start from Archetype” flow.
- [ ] **Optional auto-show tour:** Currently tour is trigger-only from “Take a quick tour.” Plan suggested optional one-time auto-show after first login; could be added later with same “Don’t show again” and skip.
- [ ] **Dismissible first-visit hints:** Optional short line on first visit to Codex/Library/Creator (“New here? The Codex has all species, feats, skills…” or “Use as-is or add to My Library to customize”) with dismiss and localStorage.
- [ ] **“Find a group” / “Run a campaign” prominence:** Campaigns page could highlight these CTAs more for RMs; optional link to Discord or future LFG page.
- [ ] **First-time milestone toasts (optional):** E.g. “You added your first power from Realms Library,” “Character saved—you can edit anytime,” only once per user, dismissible. Low priority; keep light.

---

## 5. AI & Developer Reference: UX Considerations

When implementing or reviewing **any** UI, copy, or flow that touches onboarding, retention, terminology, or creator/library experience:

### 5.1 Documents to read

| Topic | Document |
|-------|----------|
| **UX goals, terminology, done/backlog** | This file: `src/docs/USER_EXPERIENCE_GOALS.md` |
| **Full UX plan (source)** | Plan doc (e.g. `realms_ux_retention_onboarding_*.plan.md`) — goals, personas, journey, priorities |
| **Mobile and touch** | `src/docs/MOBILE_UX.md` — breakpoints, 44px touch targets, fullScreenOnMobile, side-scroll/collapse |
| **Accessibility and contrast** | `src/docs/ACCESSIBILITY.md`, `.cursor/rules/realms-accessibility.mdc` — WCAG 2.1 AA, labels, headings, modals |
| **Game rules and terminology** | `src/docs/GAME_RULES.md` — ability names, formulas, display conventions |
| **Owner feedback and tasks** | `src/docs/ALL_FEEDBACK_CLEAN.md` (curated + raw log), `src/docs/ai/AI_TASK_QUEUE.md` |

### 5.2 Checklist for UX-sensitive changes

- **Terminology:** Use “Realms Codex” and “Realms Library” (never “Public Codex/Library”). Use “My Library” for user content. Prefer “from the Codex,” “from Realms Library,” “Create your own” over “pre-made.”
- **Account friction:** Don’t add new gates that block unauthenticated users from seeing Codex, `/browse`, or guest character creator. Require login only for save, “Add to My Library,” or gated routes (Library list, Campaigns, etc.).
- **Character creator:** Keep guest flow; default to Realms Library/Codex in selection steps; show “Create account to save” when not logged in; keep step progress and success message on save.
- **CTAs:** Any new landing or nav should consider “Create a character,” “Browse Codex,” “Browse Realms Library,” and “Join the Community” (Discord) where relevant.
- **Tone:** Epic but not childish; avoid heavy gamification or “Achievement unlocked!” style copy.
- **Mobile:** New pages/modals follow MOBILE_UX.md (fullScreenOnMobile for large modals, 44px touch targets, side-scroll or collapse for dense sections).
- **Accessibility:** New controls have labels or aria-label; status/copy use contrast-safe tokens (see ACCESSIBILITY.md).

### 5.3 Where to record UX feedback and work

- **Raw owner feedback:** Append to `src/docs/ALL_FEEDBACK_CLEAN.md` under “Raw Feedback Log” (date, context, priority, feedback text, expected behavior). See `.cursor/rules/realms-tasks.mdc` Feedback Processing Protocol.
- **New tasks:** Add to `src/docs/ai/AI_TASK_QUEUE.md` with next TASK-### ID; reference this doc in description if the task is UX/onboarding/retention.
- **Done work:** Update task status; add notes and PR link; append to `src/docs/ai/AI_CHANGELOG.md`. If a backlog item in this doc is completed, update Section 4 and Section 3 accordingly.

### 5.4 Key files (implementation)

| Area | Files |
|------|--------|
| Home and CTAs | `src/app/(main)/home-page.tsx` |
| Browse (read-only Realms Library) | `src/app/(main)/browse/page.tsx`, `src/app/(main)/library/LibraryPublicContent.tsx` |
| Character creator | `src/app/(main)/characters/new/page.tsx`, `src/components/character-creator/steps/*.tsx`, `src/stores/character-creator-store.ts` |
| Welcome banner & tour | `src/app/(main)/home-page.tsx`, `src/components/shared/onboarding-tour.tsx` |
| Header / footer / Discord | `src/components/layout/header.tsx`, `src/components/layout/footer.tsx` |
| Library and Codex labels | `src/app/(main)/library/page.tsx`, `src/app/(main)/codex/page.tsx`, `src/components/shared/filters/source-filter.tsx` |

---

*Last updated: 2026-02-24. Aligned with Realms UX, Retention & Onboarding Plan and implementation session.*
