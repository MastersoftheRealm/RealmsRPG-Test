# Systematic Per-Area Audit — 2026-06

> **Companion to** [`FULL_AUDIT_2026-06.md`](FULL_AUDIT_2026-06.md). That report covers cross-cutting AI-pathology + codebase findings. **This document** is the exhaustive, page-by-page / area-by-area walkthrough of the *actual running website* — every page, modal, component, data path, and API route — leaving no leaf unturned.
>
> **Bigger-picture goal (why this exists):** RealmsRPG is a D&D-Beyond-style TTRPG app. The product promise is **"learn once, use forever"** — consistent UI, unified components, and a frictionless creator→library→character-sheet→play loop. This audit verifies every surface upholds that promise and is correct, secure, accessible, mobile-ready, and free of accreted AI debt.

## How this audit works

Each **area** below is reviewed against a fixed **10-lens rubric**. Findings are recorded inline with an ID (`SA-<area>-<n>`) and a disposition:

- **[SAFE-FIX]** — low-risk, applied during the pass (gated by `tsc` + `lint` + `build`).
- **[QUEUED → TASK-###]** — riskier/larger; added to `AI_TASK_QUEUE.md`.
- **[NOTE]** — informational / accepted as-is.

### The 10-lens rubric (applied to every area)

1. **Purpose & fit** — What does this area do, and does it serve the product loop (creator → library → sheet → play)?
2. **UI / visual consistency** — Semantic design tokens (no stray `gray-*` outside auth); shared components (`GridListRow`, `SectionHeader`, `SegmentedControl`, etc.) instead of bespoke copies.
3. **UX / QOL** — Flow friction, empty/loading/error states, feedback (toasts/confirms), discoverability, sensible defaults, keyboard/escape behavior.
4. **Mobile** — Breakpoints, `fullScreenOnMobile` modals, ≥44px touch targets, dense-layout strategy (side-scroll vs collapse), verified ~360px.
5. **Accessibility** — Labels/`aria-label` on controls & icon buttons, no heading-level skips, modal titles/`titleA11y`, contrast-safe status tokens, meaningful/empty `alt`.
6. **Code health** — Dead code, duplication, god files, overcomplication, prop-drilling, narration comments, leftover `console.*`.
7. **Data / fetch** — `apiFetch` vs raw `fetch`, React Query keys/caching/invalidation, enrichment correctness, no redundant refetches.
8. **Security** — Authz/ownership checks, RLS reliance, input validation (zod), admin gating, upload validation, no secret/PII leakage.
9. **Performance** — Edge/data-transfer usage, over-fetching, unnecessary client components, bundle/large-list virtualization.
10. **Consistency with siblings** — Does this area match its parallel pages (e.g. all creators, all library tabs, all admin tabs)?

### Outputs
- Inline findings here (per area), cross-referenced to `FULL_AUDIT_2026-06.md` where they overlap.
- New `TASK-###` entries in `AI_TASK_QUEUE.md` for actionable improvements.
- Safe fixes applied in-pass and logged in `AI_CHANGELOG.md`.

---

## Area inventory & status

Site surface: **43 pages · 28 API routes · ~140 components · 17 layouts.** Reviewed in the units below. **All 20 areas reviewed (2026-06-12); findings + consolidated tasks below.**

| # | Area | Primary paths | Status |
|---|------|---------------|--------|
| 1 | App shell & global | `app/layout.tsx`, `app/(main)/layout.tsx`, `app/page.tsx`, `components/layout/*`, `components/providers/*`, `lib/supabase/middleware.ts`, error/loading/not-found | not-started |
| 2 | Auth | `(auth)/login\|register\|forgot-password\|forgot-username`, `app/auth/confirm/route.ts`, `components/auth/*` | not-started |
| 3 | Characters list & cards | `(main)/characters/page.tsx`, `characters/new`, `components/character/*` | not-started |
| 4 | Character sheet | `(main)/characters/[id]/page.tsx`, `components/character-sheet/*` | not-started |
| 5 | Character creator | `components/character-creator/*` (+ steps), creation flow | not-started |
| 6 | Library | `(main)/library/*` (page + `Library*Tab`) | not-started |
| 7 | Codex | `(main)/codex/*` (page + `Codex*Tab`), `components/codex/*` | not-started |
| 8 | Browse | `(main)/browse/page.tsx` | not-started |
| 9 | Creators: Power / Technique / Empowered | `(main)/power-creator`, `technique-creator`, `empowered-technique-creator`, `components/creator/*` | not-started |
| 10 | Creators: Item / Species / Creature | `(main)/item-creator`, `species-creator`, `creature-creator` | not-started |
| 11 | Crafting | `(main)/crafting/*`, `components/crafting/*` | not-started |
| 12 | Encounters & tracker | `(main)/encounters/*`, `encounter-tracker`, `lib/game/encounter-utils.ts` | not-started |
| 13 | Campaigns | `(main)/campaigns/*`, `api/campaigns/**`, `lib/campaign-*` | not-started |
| 14 | Admin | `(main)/admin/*` (page + codex/changelogs/users/roles/tooltips/public-library/core-rules + `Admin*Tab`) | not-started |
| 15 | Account | `(main)/my-account/page.tsx`, upload routes | not-started |
| 16 | Static / content | `(main)/rules\|resources\|about\|privacy\|terms` | not-started |
| 17 | Shared & UI primitives | `components/shared/*`, `components/ui/*` | not-started |
| 18 | Data layer & API | `hooks/*`, `services/*`, `api/**`, `lib/api-*`, `lib/validation/*`, `lib/rate-limit.ts` | not-started |
| 19 | Security & infra | RLS/authz per route, uploads, admin gating (ties to TASK-326/327) | not-started |
| 20 | Cross-cutting QOL/UX/mobile/a11y/perf sweep | repo-wide | not-started |

---

## Findings by area

*(Populated as each area is reviewed. Each finding: `SA-<area>-<n> [disposition] — description (evidence).`)*

<!-- AREA-FINDINGS-START -->

### Area 1 — App shell & global

- SA-1-1 [QUEUED] — Root `/` is outside the `(main)` route group, so `(main)/error.tsx` and `(main)/loading.tsx` never wrap the home page (`src/app/page.tsx:6`, `src/app/(main)/error.tsx`).
- SA-1-2 [QUEUED] — `ProtectedRoute` redirects to `/login` without writing `loginRedirect` to sessionStorage, unlike the header login flow (`src/components/layout/protected-route.tsx:23`).
- SA-1-3 [QUEUED] — `ProtectedRoute` is only used on 3 routes; most `(main)` pages have no layout-level auth gate (`src/components/layout/protected-route.tsx:19`).
- SA-1-4 [QUEUED] — Theme toggle exists only inside the logged-in account dropdown; logged-out users can't change theme (`src/components/layout/header.tsx:253`).
- SA-1-5 [SAFE-FIX] — Mobile menu button ~40px tall, below 44px touch minimum (`src/components/layout/header.tsx:166`).
- SA-1-6 [SAFE-FIX] — Header "Login" control lacks `min-h-[44px]` used on mobile nav links (`src/components/layout/header.tsx:156`).
- SA-1-7 [SAFE-FIX] — Review carousel arrow images use non-empty `alt` while parent buttons already have `aria-label` (redundant SR output) (`src/app/(main)/home-page.tsx:216`).
- SA-1-8 [QUEUED] — Home landing has no page-level `h1`; feature cards render `h3` before the `h2` Reviews section (heading-order violation) (`src/app/(main)/home-page.tsx:344`).
- SA-1-9 [QUEUED] — `not-found.tsx` has no header/footer and no `#main-content`, so the root skip-link target is missing on 404 (`src/app/not-found.tsx:9`).
- SA-1-10 [QUEUED] — No root `app/error.tsx` or `global-error.tsx`; only `(main)/error.tsx` exists (auth/root failures lack branded fallback).
- SA-1-11 [SAFE-FIX] — Stale comment says session refresh is handled by "Supabase middleware"; actual entry is `src/proxy.ts` (`src/components/providers/auth-provider.tsx:5`).
- SA-1-12 [SAFE-FIX] — Main footer uses raw `neutral-*` colors instead of semantic tokens (`src/components/layout/footer.tsx:13`).
- SA-1-13 [SAFE-FIX] — Header desktop and mobile `<nav>` elements lack `aria-label` (`src/components/layout/header.tsx:89`,`186`).
- SA-1-14 [SAFE-FIX] — Mobile menu button has no `aria-controls`/panel `id` linking toggle to the drawer (`src/components/layout/header.tsx:166`).
- SA-1-15 [QUEUED] — Mobile nav drawer has no Escape handler, focus trap, or body scroll lock (`src/components/layout/header.tsx:166`).
- SA-1-16 [QUEUED] — Root home manually composes `MainLayout` while other pages rely on `(main)/layout.tsx` (dual wiring/drift risk) (`src/app/page.tsx:6`).
- SA-1-17 [SAFE-FIX] — Auth layout footer links lack `min-h-[44px]` touch targets present in main Footer (`src/app/(auth)/layout.tsx:75`).
- SA-1-18 [QUEUED] — Admin server layout redirects to bare `/login` with no return-path preservation (`src/app/(main)/admin/layout.tsx:20`).
- SA-1-19 [SAFE-FIX→TASK-322] — Account dropdown tooltip PATCH uses raw `fetch` instead of `apiFetch` (`src/components/layout/header.tsx:283`). (Folds into INC-1.)
- SA-1-20 [SAFE-FIX] — `(main)/error.tsx` icon uses `text-danger-600`; standard prefers `text-danger-700` in light mode (`src/app/(main)/error.tsx:27`).
- SA-1-21 [SAFE-FIX] — `NavDropdown` button duplicates `items-center` in `className` (`src/components/layout/header.tsx:339`).
- SA-1-22 [NOTE] — No repo-root `middleware.ts`; session refresh lives in `src/proxy.ts` with a matcher excluding high-volume public API paths.
- SA-1-23 [NOTE] — `SelectionGuard` in root layout is an accepted mitigation for a dependency `Range.selectNode` error.
- SA-1-24 [NOTE] — Root layout loads Nova Flat via external Google Fonts `<link>` in addition to `next/font` (extra third-party request).

### Area 2 — Authentication

- SA-2-1 [QUEUED] — Open-redirect: paths starting with `//` pass the `startsWith('/')` check (confirm/callback/login) (`src/app/auth/confirm/route.ts:30`, `src/app/auth/callback/route.ts:41`, `src/app/(auth)/login/page.tsx:34`).
- SA-2-2 [QUEUED] — Password-reset flow ends at `/login` after OTP verify; no dedicated "set new password" step despite an active recovery session (`src/app/(auth)/forgot-password/page.tsx:38`).
- SA-2-3 [SAFE-FIX] — `resetPasswordForEmail` `{ error }` ignored; success UI shown even when Supabase rejects (`src/app/(auth)/forgot-password/page.tsx:37`).
- SA-2-4 [QUEUED] — Chosen username lost when email confirmation required: `/auth/confirm` creates profile with `username: undefined` (`src/app/(auth)/register/page.tsx:60`, `src/app/auth/confirm/route.ts:43`).
- SA-2-5 [QUEUED] — Forgot-username is a stub: server action never sends email (`TODO`) but UI promises delivery (`src/app/(auth)/forgot-username/action.ts:23`).
- SA-2-6 [QUEUED] — Forgot-username breaks auth consistency: custom light full-page layout nested in dark `(auth)` layout instead of `AuthCard` (`src/app/(auth)/forgot-username/page.tsx:39`).
- SA-2-7 [SAFE-FIX] — Forgot-username success/footer copy uses `text-gray-300` on light bg (contrast fail) (`src/app/(auth)/forgot-username/page.tsx:94`,`108`).
- SA-2-8 [QUEUED] — No server-side rate limiting on auth-adjacent actions (login, resend, forgot-username lookup) (`src/app/(auth)/forgot-username/action.ts:12`).
- SA-2-9 [SAFE-FIX] — Login/register `resend({type:'signup'})` omits `emailRedirectTo`, so resent links may skip the confirm flow (`src/app/(auth)/login/page.tsx:87`, `src/app/(auth)/register/page.tsx:105`).
- SA-2-10 [NOTE] — "Remember me" checkbox wired in form/schema but never affects session persistence (`src/app/(auth)/login/page.tsx:156`).
- SA-2-11 [SAFE-FIX] — Google OAuth can hang loading if Supabase returns no `data.url` (no `setIsLoading(false)`) (`src/app/(auth)/login/page.tsx:108`).
- SA-2-12 [QUEUED] — `signOutAction` redirects to `/login` without calling `supabase.auth.signOut()` (`src/app/(auth)/actions.ts:20`).
- SA-2-13 [SAFE-FIX] — Register bottom "Sign in" link drops `redirect`/`returnTo`/`loginRedirect` context (`src/app/(auth)/register/page.tsx:277`).
- SA-2-14 [QUEUED] — Register-time username not validated against the blocklist/rules enforced in `changeUsernameAction` (`src/app/(auth)/register/page.tsx:77`, `src/app/(auth)/actions.ts:165`).
- SA-2-15 [NOTE] — `getRedirectPath`/`getAuthErrorMessage`/success `CheckIcon` duplicated across login/register/forgot-password (extract shared helpers).
- SA-2-16 [NOTE] — `useAuth.resetPassword` omits `/auth/confirm` `redirectTo`, diverging from forgot-password page (`src/hooks/use-auth.ts:143`).
- SA-2-17 [NOTE] — `emailVerified` semantics differ: `useAuth` reads `user_metadata.email_verified`, `getSession()` uses `email_confirmed_at`.
- SA-2-18 [SAFE-FIX] — `SocialButton` provider logos use meaningful `alt` alongside visible labels (redundant) (`src/components/auth/social-button.tsx:49`).
- SA-2-19 [NOTE] — Password policy only Zod `min(6)` client-side; ties to TASK-326 (leaked-password) — consider strength rules.
- SA-2-20 [QUEUED] — Apple sign-in is a live button that only surfaces "coming soon" instead of being disabled/hidden (`src/app/(auth)/login/page.tsx:118`).

### Area 3 — Characters list & cards

- SA-3-1 [QUEUED] — List doesn't wait for auth `initialized`/`loading`; signed-in users flash guest `EmptyState` before the grid (`src/app/(main)/characters/page.tsx:26`).
- SA-3-2 [QUEUED] — Delete control is hover-only (`opacity-0 group-hover:opacity-100`); not usable on touch (`src/components/character/character-card.tsx:53`).
- SA-3-3 [QUEUED] — Nested interactive: `IconButton` inside navigational `Link` — invalid HTML, poor keyboard/SR behavior (`src/components/character/character-card.tsx:31`).
- SA-3-4 [SAFE-FIX] — Delete `IconButton` default `md` (32px), below 44px touch min (`src/components/character/character-card.tsx:51`).
- SA-3-5 [QUEUED] — `useDuplicateCharacter` exists but no duplicate action on cards (Library uses `onDuplicate`) (`src/hooks/use-characters.ts:105`).
- SA-3-6 [QUEUED] — No client sort/search despite Library/Codex `useSort`/`ListHeader` pattern; API sorts by `updated_at` only (`src/app/(main)/characters/page.tsx:102`).
- SA-3-7 [SAFE-FIX] — Load error is a static `Alert` with no retry/`refetch` (`src/app/(main)/characters/page.tsx:73`).
- SA-3-8 [SAFE-FIX] — `DeleteConfirmModal` passes no `title`/`titleA11y`; dialog announced as generic (`src/components/shared/delete-confirm-modal.tsx:41`).
- SA-3-9 [SAFE-FIX] — Heading skip: page `h1` then card `h3` with no `h2` (`src/components/character/character-card.tsx:64`).
- SA-3-10 [SAFE-FIX] — Guest empty state asks users to sign in but offers no Sign in / `LoginPromptModal` action (`src/app/(main)/characters/page.tsx:118`).
- SA-3-11 [QUEUED] — Shared `characters/layout.tsx` title "Characters" applies to `/new` and `/[id]` (`src/app/(main)/characters/layout.tsx:3`).
- SA-3-12 [SAFE-FIX] — `console.error` left in delete handler (`src/app/(main)/characters/page.tsx:49`).
- SA-3-13 [QUEUED] — `duplicateCharacter` does a redundant client GET before POST with `duplicateOf` (`src/services/character-service.ts:104`).
- SA-3-14 [NOTE→TASK-322] — `getCharacter` raw `fetch` vs list `getCharacters` `apiFetch` (`src/services/character-service.ts:28`).
- SA-3-15 [NOTE] — `status`/`visibility`/`updatedAt` returned by API but not surfaced on cards.
- SA-3-16 [NOTE] — `AddCharacterCard` `min-h-[280px]` may not align with `aspect-[3/4]` neighbors.
- SA-3-17 [NOTE] — Characters list lacks `ContextHelpTooltip` present on Library and `/new`.
- SA-3-18 [NOTE] — Portrait `Image` uses `unoptimized` on every card (list perf).
- SA-3-19 [NOTE] — Redundant `CharactersPage` wrapper rendering only `CharactersContent`.

### Area 4 — Character sheet

- SA-4-1 [QUEUED → TASK-317] — Page-as-controller (~2,197 L): fetch, enrichment, 40+ handlers, autosave, realtime, modals, tab layout; `CharacterSheetModals` is route-local, not in barrel (`src/app/(main)/characters/[id]/page.tsx:70`).
- SA-4-2 [QUEUED → TASK-317] — `CharacterSheetProvider` exists but `useCharacterSheet()` has zero consumers; only `SheetHeader` uses optional variant while sections still get massive prop lists (`src/components/character-sheet/character-sheet-context.tsx:27`).
- SA-4-3 [QUEUED → TASK-317] — Context API incomplete vs page usage: `setSkillModalType` typed `'skill'|null` but page uses `'subskill'`; modal openers not in context (`src/components/character-sheet/character-sheet-context.tsx:22`).
- SA-4-4 [QUEUED] — `LibrarySection` is a second god component (~1,749 L, 136-line props) aggregating inventory+feats+proficiencies+notes (`src/components/character-sheet/library-section.tsx:312`).
- SA-4-5 [QUEUED] — Desktop/mobile each mount full section trees (`hidden md:block`/`md:hidden`); two `LibrarySection` instances with independent state (`src/app/(main)/characters/[id]/page.tsx:1829`).
- SA-4-6 [QUEUED] — ~120 lines of identical `LibrarySection` props duplicated desktop vs mobile (drift risk) (`src/app/(main)/characters/[id]/page.tsx:1880`).
- SA-4-7 [QUEUED] — **Autosave fires on initial load**: `markSaved()` never called; `initialDataRef` null until first save → debounced PATCH ~2s after open (`src/hooks/use-auto-save.ts:56`).
- SA-4-8 [QUEUED] — Concurrent saves dropped: `performSave` returns early when in-flight; no queue/retry (`src/hooks/use-auto-save.ts:67`).
- SA-4-9 [QUEUED] — Dirty detection uses `JSON.stringify` on full character blob (cost + fragile) (`src/hooks/use-auto-save.ts:93`).
- SA-4-10 [SAFE-FIX] — Portrait upload failure calls page-level `setError`, triggering the fatal branch that unmounts the whole sheet (`src/app/(main)/characters/[id]/page.tsx:550`).
- SA-4-11 [SAFE-FIX] — `handleUsePower`/`handleUseTechnique` deduct from closure state, not `prev`; rapid clicks under-deduct (`src/app/(main)/characters/[id]/page.tsx:901`).
- SA-4-12 [QUEUED] — Realtime HP/EN/AP merge re-triggers full-character PATCH; risk of clobbering concurrent remote edits (`src/app/(main)/characters/[id]/page.tsx:269`).
- SA-4-13 [SAFE-FIX] — Save status not surfaced (`isSaving`/`lastSaved` destructured but unused) (`src/components/character-sheet/sheet-action-toolbar.tsx:31`).
- SA-4-14 [QUEUED] — Settings confirm double-writes: immediate `saveCharacter`+`setCharacter` then autosave PATCH ~2s later (`src/app/(main)/characters/[id]/page.tsx:1771`).
- SA-4-15 [NOTE] — Viewing another user's character skips merging `userEmpoweredTechniques` when `libraryForView` set.
- SA-4-16 [NOTE] — Public-library normalization duplicated in page memo and `AddLibraryItemModal`.
- SA-4-17 [NOTE] — `partsToPartData` in `library-section.tsx` re-implements `data-enrichment.ts` enrichment.
- SA-4-18 [QUEUED] — Skill/feat budget math duplicated in `pointBudgets` and `hasUnappliedPoints` (~80 L parallel) (`src/app/(main)/characters/[id]/page.tsx:323`).
- SA-4-19 [QUEUED] — `useCampaignsFull()` lacks `enabled:!!user`; runs for public/view-only loads (`src/hooks/use-campaigns.ts:33`).
- SA-4-20 [SAFE-FIX→TASK-322] — `getCharacter` raw `fetch` vs `saveCharacter` `apiFetch` (`src/services/character-service.ts:41`).
- SA-4-21 [SAFE-FIX→TASK-322] — Portrait upload uses raw `fetch('/api/upload/portrait')` (`src/app/(main)/characters/[id]/page.tsx:567`).
- SA-4-22 [SAFE-FIX] — Status text uses `text-danger-600` where standard prefers `-700` (`feats-tab.tsx:461`, `abilities-section.tsx:279`, `dice-roller.tsx:223`).
- SA-4-23 [SAFE-FIX] — Roll-log modifier steppers 28px, below 44px (`src/components/character-sheet/roll-log.tsx:357`).
- SA-4-24 [SAFE-FIX] — Roll-log dice-pool buttons ~32px, no min touch target (`src/components/character-sheet/roll-log.tsx:325`).
- SA-4-25 [SAFE-FIX] — Roll-log FAB redundant SR: `aria-label` + meaningful `alt` on decorative image (`src/components/character-sheet/roll-log.tsx:409`).
- SA-4-26 [SAFE-FIX] — Settings modal uses raw hex `dark:bg-[#21262d]` instead of surface tokens (`src/components/character-sheet/character-sheet-settings-modal.tsx:108`).
- SA-4-27 [NOTE] — Dead props: `visibility`/`onVisibilityChange` threaded through `LibrarySection`→`NotesTab` but UI moved to settings (`src/components/character-sheet/notes-tab.tsx:154`).
- SA-4-28 [NOTE] — Mobile side-scroll panels lack a dot/progress indicator at ~360px.
- SA-4-29 [QUEUED] — Feats/traits/powers lists render all rows via `.map()` with no virtualization (`src/components/character-sheet/feats-tab.tsx:396`).
- SA-4-30 [NOTE] — FULL_AUDIT D-1 cited ~4,200 L; today ~2,197 L (already partly reduced) but TASK-317 scope unchanged.

### Area 5 — Character creator

- SA-5-1 [QUEUED] — Tab bar lets users skip Ancestry: after Species, `ancestry.id` is set so `canNavigateToStep('skills')` passes (`src/stores/character-creator-store.ts:131`).
- SA-5-2 [QUEUED] — Step guards check `draft.ancestry?.id` (set immediately by Species), not `completedSteps`/trait completion (`src/stores/character-creator-store.ts:123`).
- SA-5-3 [QUEUED] — Mixed-species ancestry under-validated: skips choice-trait checks when `mixed`, never validates size/two species-skills/one trait per parent (`src/lib/character-creator-validation.ts:92`).
- SA-5-4 [QUEUED] — **Currency mismatch**: equipment allocates from 200c but saved `currency` defaults to 500 when unset (`src/components/character-creator/steps/equipment-step.tsx:108`, `src/stores/character-creator-store.ts:369`).
- SA-5-5 [QUEUED] — Changing archetype clears only archetype fields; downstream species/skills/feats/equipment/powers left intact (`src/components/character-creator/steps/archetype-step.tsx:182`).
- SA-5-6 [SAFE-FIX] — Species/mixed cards are clickable `<div>`s without `role="button"`/`tabIndex`/keyboard (`src/components/character-creator/steps/species-step.tsx:116`).
- SA-5-7 [SAFE-FIX] — `SpeciesModal` duplicates species name: Modal `title` + inner `<h2>` (`src/components/character-creator/species-modal.tsx:210`,`226`).
- SA-5-8 [SAFE-FIX] — Creator tab buttons `py-2` (~40px) and lack `aria-current="step"` (`src/components/character-creator/creator-tab-bar.tsx:83`).
- SA-5-9 [SAFE-FIX] — Archetype ability picks and mixed-species skill pills below 44px (`archetype-step.tsx:58`, `ancestry-step.tsx:550`).
- SA-5-10 [SAFE-FIX] — Portrait remove control 24px, icon-only, `title` but no `aria-label` (`finalize-step.tsx:320`).
- SA-5-11 [SAFE-FIX] — Species modal skill-dismiss "✕" without `aria-label` (`species-modal.tsx:295`).
- SA-5-12 [SAFE-FIX] — `LoginPromptModal` hardcodes `returnPath="/characters/new"`, dropping `?returnTo=` (`finalize-step.tsx:959`).
- SA-5-13 [SAFE-FIX] — Sticky 44px footers only on Species/Ancestry; other steps omit `min-h-[44px]` nav (`abilities-step.tsx:100`, `feats-step.tsx:765`).
- SA-5-14 [SAFE-FIX] — Feats step selected cards use raw `bg-white` instead of `bg-surface` (`feats-step.tsx:506`).
- SA-5-15 [SAFE-FIX→TASK-322] — Finalize portrait upload uses raw `fetch` (`finalize-step.tsx:557`).
- SA-5-16 [QUEUED] — Persisted archetype "locked" view has no Back/Continue footer (`archetype-step.tsx:154`).
- SA-5-17 [QUEUED] — Step Continue buttons don't enforce requirements (Feats/Powers always enabled; Abilities allows unspent) (`feats-step.tsx:772`, `abilities-step.tsx:39`).
- SA-5-18 [NOTE] — TASK-307 acceptance **met** in code (expandable choice traits) — normalize to done (`species-modal.tsx:106`).
- SA-5-19 [NOTE] — TASK-308 acceptance **met** in code (`ChoiceTraitOptionListPicker` wired) — normalize to done (`ancestry-step.tsx:1040`).
- SA-5-20 [NOTE] — Good reuse: `AbilityScoreEditor`, `SkillsAllocationPage`, `fullScreenOnMobile` modals.
- SA-5-21 [NOTE] — Guest vs authed intentional: Zustand `persist`; login required only on save.
- SA-5-22 [NOTE] — No persist schema version/migration; stale drafts may survive codex/draft-shape changes (`character-creator-store.ts:399`).
- SA-5-23 [NOTE] — `resetCreator()` reuses same `initialDraft` reference rather than cloning.
- SA-5-24 [NOTE] — Creator mounted at `characters/new`; no separate `/character-creator` route.
- SA-5-25 [NOTE] — HE overspend not flagged (only under-spend warns) (`character-creator-validation.ts:308`).

### Area 6 — Library

- SA-6-1 [SAFE-FIX] — **Tab count badges never render**: `page.tsx` passes `badge` but `TabNavigation` reads `count` (`src/app/(main)/library/page.tsx:155`, `src/components/ui/tab-navigation.tsx:75`).
- SA-6-2 [QUEUED] — **Blank content bug**: switching My→Realms while on Enhanced leaves `activeTab='enhanced'`, filtered out → `LibraryPublicContent` returns null (`src/app/(main)/library/page.tsx:155`).
- SA-6-3 [QUEUED] — Logged-in users briefly see Realms Library: `libraryMode` defaults `'public'` then effect flips to `'my'` (flash + extra fetches) (`src/app/(main)/library/page.tsx:70`).
- SA-6-4 [QUEUED → TASK-314] — Duplication is `LibraryPublicContent.tsx` (~682 L, 4 inline `Public*List`) vs `AdminPublic*Tab`. **FULL_AUDIT A-3 line counts are stale** (Library tabs now ~260 L). (`src/app/(main)/library/LibraryPublicContent.tsx:77`).
- SA-6-5 [QUEUED → TASK-315] — Library imports deprecated `usePublicLibrary`/`useAddPublicToLibrary`; internal `LibraryMode='public'` while UI says "Realms"; admin already uses `useOfficialLibrary` (`src/app/(main)/library/page.tsx:28`).
- SA-6-6 [QUEUED] — `page.tsx` eagerly subscribes to all 5 user + 5 official queries for badges regardless of active tab/mode (`src/app/(main)/library/page.tsx:79`).
- SA-6-7 [QUEUED] — `LibraryTechniquesTab` always runs user + empowered queries even when one mode mounted (`src/app/(main)/library/LibraryTechniquesTab.tsx:58`).
- SA-6-8 [QUEUED] — Duplicate is one-click with no confirmation on My Library grids (`src/components/shared/grid-list-row.tsx:889`).
- SA-6-9 [QUEUED] — Global "Sync with current patch" batch-updates with no confirm; can drop missing refs (`src/app/(main)/library/LibraryPowersTab.tsx:123`).
- SA-6-10 [QUEUED] — Creatures diverge by mode: My uses full `CreatureStatBlock`; Realms uses minimal `GridListRow` (`src/app/(main)/library/LibraryCreaturesTab.tsx:206`).
- SA-6-11 [QUEUED] — `LibraryEnhancedTab` inconsistent: `EmptyState` vs `ListEmptyState`, hand-rolled sort, no edit/duplicate, Title-case headers (`src/app/(main)/library/LibraryEnhancedTab.tsx:13`).
- SA-6-12 [NOTE] — `LibraryCreaturesTab` wraps list in `RollProvider`+`RollLog` (encounter/sheet UI inside library) (`src/app/(main)/library/LibraryCreaturesTab.tsx:179`).
- SA-6-13 [SAFE-FIX] — Error states static `ErrorDisplay` with no retry though `refetch` exists (`src/app/(main)/library/LibraryPowersTab.tsx:164`).
- SA-6-14 [QUEUED → TASK-322] — User-library fetch/mutations use raw `fetch` not `apiFetch` (`src/hooks/use-user-library.ts:169`).
- SA-6-15 [NOTE] — `fetchOfficialLibrary` uses `cache:'no-store'`, bypassing documented CDN caching (`src/services/library-service.ts:58`).
- SA-6-16 [SAFE-FIX] — Tab a11y incomplete: `role="tab"` without `aria-controls`/tabpanel `id`; content lacks `role="tabpanel"` (`src/components/ui/tab-navigation.tsx:130`).
- SA-6-17 [NOTE] — `/browse` omits the Empowered tab that Library Realms mode includes (`src/app/(main)/browse/page.tsx:17`).
- SA-6-18 [SAFE-FIX] — Guest banner "Sign in" `Button size="sm"` likely under 44px (`src/app/(main)/library/page.tsx:170`).
- SA-6-19 [NOTE] — TASK-310 in-progress for powers/techniques/armaments, but creature drift/sync UI already implemented (`src/app/(main)/library/LibraryCreaturesTab.tsx:93`).
- SA-6-20 [SAFE-FIX] — Armament TP differs My vs Realms: My sums chip costs; Realms uses `calculateItemCosts().totalTP` (`src/app/(main)/library/LibraryItemsTab.tsx:89`).
- SA-6-21 [SAFE-FIX] — Delete failure `console.error` in page handler (`src/app/(main)/library/page.tsx:149`).
- SA-6-22 [NOTE] — `layout.tsx` metadata describes only personal library, not dual modes.
- SA-6-23 [QUEUED] — My Library powers/techniques/items tabs are near-duplicate ~260–290 L shells — shared extractor candidate (separate from TASK-314).
- SA-6-24 [SAFE-FIX] — Techniques and Empowered tabs share the same `Swords` icon (`src/app/(main)/library/page.tsx:53`).
- SA-6-25 [SAFE-FIX] — `ErrorDisplay` uses `text-danger` not contrast-safe `text-danger-700` (`src/components/shared/list-components.tsx:172`).

### Area 7 — Codex

- SA-7-1 [QUEUED → TASK-314] — Seven My Codex tabs hand-roll "use Realms Codex" empty copy instead of reusing existing `CodexMyCodexEmpty` (A-4) (`CodexFeatsTab.tsx:275`, `CodexSkillsTab.tsx:162`, +5).
- SA-7-2 [QUEUED → TASK-314] — User `CodexFeatsTab` (~436 L) vs admin `AdminFeatsTab` (~1,379 L) share patterns but are separate; **FULL_AUDIT ~3,534 L counts are stale**.
- SA-7-3 [QUEUED] — `page.tsx` duplicates two near-identical tab-mount blocks for Realms vs My (only `codexMode` differs) (`codex/page.tsx:163`).
- SA-7-4 [QUEUED] — My Codex tabs run full codex queries before early-return empty states (wasted work) (`CodexFeatsTab.tsx:140`).
- SA-7-5 [QUEUED] — `CodexCharacterFilter`+`useCharacters` render for all tabs/modes but only Feats consumes `characterId` (`codex/page.tsx:131`).
- SA-7-6 [SAFE-FIX] — All tabs show static `ErrorDisplay` with no retry (same as SA-6-13) (`CodexFeatsTab.tsx:284`).
- SA-7-7 [SAFE-FIX] — Codex `TabNavigation` inherits incomplete tab a11y (SA-6-16) (`codex/page.tsx:140`).
- SA-7-8 [SAFE-FIX] — Zero-result states use ad-hoc `<div>` text instead of shared `ListEmptyState` (`CodexFeatsTab.tsx:422`).
- SA-7-9 [QUEUED] — My Codex Equipment empty copy diverges ("use Library" vs "use Realms Codex") (`CodexEquipmentTab.tsx:157`).
- SA-7-10 [QUEUED] — Admin-only `CodexSpreadsheetView` ~797 L; save/validation uses blocking `alert()` (`CodexSpreadsheetView.tsx:412`).
- SA-7-11 [SAFE-FIX] — Spreadsheet error uses raw `text-red-600` (`CodexSpreadsheetView.tsx:466`).
- SA-7-12 [SAFE-FIX] — Spreadsheet find/replace inputs `min-h-[32px]`, below 44px (`CodexSpreadsheetView.tsx:503`).
- SA-7-13 [NOTE] — Spreadsheet cells have `aria-label` but table lacks caption/`scope`.
- SA-7-14 [NOTE] — Public Codex has no spreadsheet view or Archetypes tab (admin-only).
- SA-7-15 [QUEUED] — `codexMode` defaults `'public'`; logged-in users not auto-switched to My (unlike Library) (`codex/page.tsx:49`).
- SA-7-16 [QUEUED] — My Codex Species subscribes to full codex species query even in `'my'` mode (`CodexSpeciesTab.tsx:182`).
- SA-7-17 [SAFE-FIX] — Only Feats/Species expose `sr-only` section `h2`; others lack accessible section names (`CodexSkillsTab.tsx:172`).
- SA-7-18 [SAFE-FIX] — `CodexSpeciesTab` has a mid-file `import` after consts (`CodexSpeciesTab.tsx:27`).
- SA-7-19 [SAFE-FIX] — `CodexCreatureFeatsTab` memo lists unused `sortState` in deps (`CodexCreatureFeatsTab.tsx:37`).
- SA-7-20 [NOTE] — TASK-311 done (character filter + `checkFeatRequirements`).
- SA-7-21 [NOTE] — Shared codex fetch well-factored (`['codex']` + `apiFetch`, 30min stale).
- SA-7-22 [NOTE] — `components/codex/filters/index.ts` is a deprecated re-export shim (indirection).

### Area 8 — Browse

- SA-8-1 [QUEUED] — Browse largely duplicates Library Realms mode (same `LibraryPublicContent`, fewer tabs, no differentiation) (`browse/page.tsx:55`).
- SA-8-2 [QUEUED] — **`/browse` is orphaned in nav**: header/footer/home/onboarding all route to `/library`, not `/browse` (`header.tsx:21`, `footer.tsx:22`, `home-page.tsx:150`, `onboarding-tour.tsx:50`).
- SA-8-3 [SAFE-FIX] — Missing Empowered tab (4 vs 5); empowered official content unreachable from Browse (`browse/page.tsx:17`).
- SA-8-4 [QUEUED] — Browse hardcodes `readOnly={true}` even for signed-in users, hiding Add-to-library (Library uses `readOnly={isGuest}`) (`browse/page.tsx:58`).
- SA-8-5 [SAFE-FIX] — Login CTA uses `?redirect=` while Library uses `?returnTo=` (inconsistent) (`browse/page.tsx:36`).
- SA-8-6 [SAFE-FIX] — No `layout.tsx`/metadata for `/browse` (weak title/SEO).
- SA-8-7 [SAFE-FIX] — No guest context banner on Browse (Library has one).
- SA-8-8 [SAFE-FIX] — Inherited static `ErrorDisplay` with no retry (`LibraryPublicContent.tsx:155`).
- SA-8-9 [SAFE-FIX] — Tab a11y incomplete (SA-6-16).
- SA-8-10 [SAFE-FIX] — Header CTA `Button` ~40px, below 44px (`browse/page.tsx:35`).
- SA-8-11 [NOTE] — `FEATURE_INDEX.md` mislabels Browse as "public creators' content"; it's official Realms read-only. **Fix the index entry.**
- SA-8-12 [NOTE] — `onLoginRequired={()=>{}}` dead no-op with `readOnly` (`browse/page.tsx:57`).
- SA-8-13 [QUEUED] — Browse defines a local 4-tab subset instead of sharing Library's Realms tab constant (drift) (`browse/page.tsx:17`).
- SA-8-14 [SAFE-FIX] — Underline tab triggers use raw `neutral-*` hover, not semantic tokens (`globals.css:836`).
- SA-8-15 [NOTE] — Browse omits `ContextHelpTooltip` present on Library.
- **Decision needed:** consolidate `/browse` into `/library` public mode, or make it a real distinct guest landing and wire nav to it. (Queued as a decision task.)

### Area 9 — Power / Technique / Empowered creators

- SA-9-1 [QUEUED] — Technique embeds a ~240-line inline `PartCard` instead of reusing shared `PowerPartCard` (`technique-creator/page.tsx:100`).
- SA-9-2 [QUEUED] — Three sibling pages ~1.1–1.4k L each with duplicated cache/reset/load/edit-URL/section-cost logic; no shared hook (`power-creator/page.tsx:106`).
- SA-9-3 [QUEUED] — Technique still uses legacy `buildMechanicPartPayload` while power/empowered use unified `buildMechanicParts` (`technique-calc.ts:180`).
- SA-9-4 [SAFE-FIX] — **Bug:** technique load reads `technique.reaction` but save persists `isReaction` → reaction state lost on load (`technique-creator/page.tsx:659`).
- SA-9-5 [SAFE-FIX] — **Bug:** technique load treats `damage` as object but save writes array → additional damage fails to restore (`technique-creator/page.tsx:649`).
- SA-9-6 [SAFE-FIX] — Technique `onSaveSuccess` doesn't reset `actionType`/`isReaction` (power resets all) (`technique-creator/page.tsx:675`).
- SA-9-7 [SAFE-FIX] — Technique `addPart` seeds from `techniqueParts[0]` (includes mechanic parts); power filters first (`technique-creator/page.tsx:608`).
- SA-9-8 [QUEUED] — `PowerPartCard` lives under power-creator route but imported by empowered; should be in `components/creator/` (`PowerPartCard.tsx:1`).
- SA-9-9 [QUEUED] — Section-cost part-name arrays copy-pasted between power and empowered (~30 L) (`power-creator/page.tsx:447`).
- SA-9-10 [QUEUED] — `useLoadModalLibrary` subscribes to all user+public queries regardless of creator `type` (over-fetch) (`use-load-modal-library.ts:107`).
- SA-9-11 [SAFE-FIX] — `useLoadModalLibrary` always returns `error:null` despite tracking `isPublicError` (`use-load-modal-library.ts:241`).
- SA-9-12 [SAFE-FIX] — `LoginPromptModal` `returnPath` drops `?edit=` on all 3 creators (`power-creator/page.tsx:937`).
- SA-9-13 [SAFE-FIX] — `LoginPromptModal` renders `Modal` without `title`/`titleA11y` (`login-prompt-modal.tsx:48`).
- SA-9-14 [SAFE-FIX] — Toolbar/"Add Part" buttons `size="sm"` (32px), below 44px (`CreatorSaveToolbar.tsx:62`).
- SA-9-15 [SAFE-FIX] — `PowerPartCard` remove `IconButton size="sm"` (28px) (`PowerPartCard.tsx:104`).
- SA-9-16 [SAFE-FIX] — Power range hint shows `steps*3` but summary uses `3+3*(steps-1)` (inconsistent) (`power-creator/page.tsx:1057`).
- SA-9-17 [SAFE-FIX] — Codex parts fetch errors render static `Alert` with no retry on all 3 (`power-creator/page.tsx:855`).
- SA-9-18 [SAFE-FIX] — Cache restore sets `isInitialized` before `allWeaponOptions` populated → cached weapon skipped (`power-creator/page.tsx:191`).
- SA-9-19 [QUEUED] — Empowered `addPowerMechanicPart` lacks duplicate guard (power blocks dupes) (`empowered-technique-creator/page.tsx:854`).
- SA-9-20 [QUEUED] — Empowered duration UI lacks power's short-duration guard (`empowered-technique-creator/page.tsx:1116`).
- SA-9-21 [SAFE-FIX] — Empowered `?edit=` not-found is silent (no warn) (`empowered-technique-creator/page.tsx:830`).
- SA-9-22 [SAFE-FIX] — Name/description labels lack `htmlFor`/`id` on all 3 (`power-creator/page.tsx:968`).
- SA-9-23 [SAFE-FIX] — Page wrappers add `py-8 px-4` on top of `PageContainer` (double spacing) (`power-creator/page.tsx:1420`).
- SA-9-24 [NOTE] — Shared shell solid: `CreatorLayout`/`CreatorSaveToolbar`/`useCreatorSave`/`LoadFromLibraryModal`/`ConfirmActionModal`.
- SA-9-25 [NOTE] — Guest-first UX intentional & coherent.

### Area 10 — Item / Species / Creature creators

- SA-10-1 [QUEUED] — Creature creator ~1,966-line page-as-controller (no step/shared modules) (`creature-creator/page.tsx:1`).
- SA-10-2 [QUEUED] — Creature skills/defenses duplicate character-creator logic inline instead of shared `SkillsAllocationPage` (`creature-creator/page.tsx:1508`).
- SA-10-3 [QUEUED] — Creature eagerly subscribes to 5× public + 4× user library hooks on mount (over-fetch) (`creature-creator/page.tsx:156`).
- SA-10-4 [QUEUED] — `LoadCreatureModal` loads My Library only; no `SourceFilter`/Realms (`LoadCreatureModal.tsx:26`).
- SA-10-5 [QUEUED] — Species load is bespoke list modal, not `LoadFromLibraryModal`/unified rows (`species-creator/page.tsx:564`).
- SA-10-6 [QUEUED] — No save-time guard when creature budgets overspent; `saveDisabled` only checks name (`creature-creator/page.tsx:1022`).
- SA-10-7 [QUEUED] — **Bug:** `transformUserItemToDisplayItem` strips `op_1_lvl` and omits `shield` in `typeMap` → wrong TP/cost/range for leveled/shield items (`creature-creator/transformers.ts:282`).
- SA-10-8 [QUEUED] — Item/creature/power wrap `CreatorLayout` in extra `min-h-screen py-8 px-4`; species doesn't (drift) (`item-creator/page.tsx:1618`).
- SA-10-9 [SAFE-FIX] — Species Load opens without login gate (item/creature prompt first) (`species-creator/page.tsx:518`).
- SA-10-10 [SAFE-FIX] — `LoginPromptModal` `returnPath` drops `?edit=` (`item-creator/page.tsx:1149`).
- SA-10-11 [SAFE-FIX] — `?edit=` failures silent (item warns; creature falls through) (`creature-creator/page.tsx:859`).
- SA-10-12 [SAFE-FIX] — **Bug:** species third-trait confirm discards `pendingBatch` remainder → batch add loses traits (`species-creator/page.tsx:388`).
- SA-10-13 [SAFE-FIX] — Species `TraitBlock` remove icon-only `×` no `aria-label` (`species-creator/page.tsx:853`).
- SA-10-14 [SAFE-FIX] — Item type pills `py-2` (~40px), below 44px (`item-creator/page.tsx:1191`).
- SA-10-15 [SAFE-FIX] — Item `PropertyCard` remove `IconButton size="sm"` (28px) (`item-creator/page.tsx:172`).
- SA-10-16 [SAFE-FIX] — Item name field label lacks `htmlFor`/`id` (`item-creator/page.tsx:1169`).
- SA-10-17 [SAFE-FIX] — **Bug:** creature powers `ListHeader` includes innate column but `gridColumns` omits it → misalignment (`creature-creator/page.tsx:1696`).
- SA-10-18 [SAFE-FIX] — Item default damage inconsistent: cache `1d4`, reset `1d6` (`item-creator/page.tsx:372`).
- SA-10-19 [SAFE-FIX] — Item summary uses `text-red-600` instead of `text-danger-700` (`item-creator/page.tsx:1098`).
- SA-10-20 [SAFE-FIX] — Item armament grid `grid-cols-4` for 3 types (empty column at 360px) (`item-creator/page.tsx:1185`).
- SA-10-21 [QUEUED] — Species `saveDisabled` requires height/weight/lifespan but not type/both base skills despite copy (`species-creator/page.tsx:521`).
- SA-10-22 [NOTE] — Item sets `isEditMode` but never reads it (no edit banner).
- SA-10-23 [NOTE] — Creature uses `useSearchParams` without `Suspense` (item/power wrap it) (`creature-creator/page.tsx:1957`).
- SA-10-24 [NOTE] — Species lacks `ContextHelpTooltip` (item/creature have it).
- SA-10-25 [NOTE] — Species imports `ChipList` from `creature-creator/CreatureCreatorHelpers` (cross-coupling).

### Area 11 — Crafting

- SA-11-1 [QUEUED] — Autosave PATCH fires ~2s after open with no dirty check; init/migration/sync effects mutate `session.data` and retrigger saves on load (`crafting/[id]/page.tsx:183`).
- SA-11-2 [QUEUED] — Autosave uses `mutate` with no `onError`/toast; failed PATCHes silent (`crafting/[id]/page.tsx:199`).
- SA-11-3 [QUEUED] — Requirements-sync rebuilds `sessions` from `labels.length` and drops extra roll rows when count shrinks (`crafting/[id]/page.tsx:488`).
- SA-11-4 [QUEUED] — `getUpgradePotencyRequirements` implemented but never wired; completion UI exists with no entry point (`crafting-utils.ts:312`).
- SA-11-5 [QUEUED] — Guests can click Start Crafting; `useCraftingSessions` lacks `enabled:!!user`, create returns 401 (`crafting/page.tsx:101`).
- SA-11-6 [SAFE-FIX] — Hub load error static `Alert` no retry (`crafting/page.tsx:194`).
- SA-11-7 [SAFE-FIX] — Hub subtitle labels `currencyCost` but API denormalizes from `materialCost` (`crafting/page.tsx:232`).
- SA-11-8 [SAFE-FIX] — `DeleteConfirmModal` omits `title`/`titleA11y` (`crafting/page.tsx:253`).
- SA-11-9 [SAFE-FIX] — Hub delete hover-only, not touch-usable (`hub-list-row.tsx:123`).
- SA-11-10 [SAFE-FIX] — Session heading skip h1→h3 (`crafting/[id]/page.tsx:1095`).
- SA-11-11 [SAFE-FIX] — Craft subskill `<select>` `min-h-[36px]`, below 44px (`crafting/[id]/page.tsx:1684`).
- SA-11-12 [SAFE-FIX] — "Back to Crafting" `size="sm"` (~32px) (`crafting/[id]/page.tsx:835`).
- SA-11-13 [SAFE-FIX] — Status badges use raw `green-*`/`red-*` not semantic tokens (`crafting/page.tsx:41`).
- SA-11-14 [QUEUED] — "Save to Library" after craft has no duplicate guard/confirm; repeated clicks create dupes (`crafting/[id]/page.tsx:1946`).
- SA-11-15 [QUEUED] — `useEnhancedItems()` subscribed on session page but never read (dead over-fetch) (`crafting/[id]/page.tsx:173`).
- SA-11-16 [SAFE-FIX→TASK-322] — `getCraftingSession` raw `fetch` vs others `apiFetch` (`crafting-service.ts:21`).
- SA-11-17 [QUEUED] — `toCraftingItemRef` maps Realms/public selections to `source:'codex'`, losing fidelity (`crafting/[id]/page.tsx:74`).
- SA-11-18 [NOTE] — Item modal uses deprecated `usePublicLibrary`; codex rows tagged `source:'public'` (conflates Realms/Codex) (`CraftingItemSelectModal.tsx:56`).
- SA-11-19 [QUEUED] — Session editor ~2,037-line page-as-controller, eager loads codex skills/parts/powers (`crafting/[id]/page.tsx:141`).
- SA-11-20 [SAFE-FIX] — `LibraryEnhancedTab` error static, no retry (`LibraryEnhancedTab.tsx:88`).

### Area 12 — Encounters & tracker

- SA-12-1 [QUEUED] — `encounter-tracker/page.tsx` has ~760 lines of dead tracker UI never rendered (export mounts redirect) (`encounter-tracker/page.tsx:767`).
- SA-12-2 [QUEUED] — New encounters depend on legacy `encounter-tracker/` modules; folder can't be removed (drift) (`CombatEncounterView.tsx:16`).
- SA-12-3 [QUEUED] — HP/EN/AP sync is one-way (sheet→encounter); no path to push encounter damage back to sheets (`CombatEncounterView.tsx:465`).
- SA-12-4 [QUEUED] — `useAutoSave` never calls `markSaved()` after load → spurious PATCH (same as SA-4-7) (`encounters/[id]/combat/page.tsx:50`).
- SA-12-5 [QUEUED] — Hub "Completed" tab filters `status==='completed'` but nothing sets it; "End Combat" sets `paused` (`encounters/page.tsx:109`).
- SA-12-6 [QUEUED] — **Bug:** turn highlight indexes `sortedCombatants` but drag-reorder doesn't remap `currentTurnIndex` (`CombatEncounterView.tsx:255`).
- SA-12-7 [QUEUED] — `previousTurn` reads length from render closure inside `setEncounter` (wrong index risk) (`CombatEncounterView.tsx:590`).
- SA-12-8 [QUEUED] — Guest encounters not migrated on sign-in; data orphaned (`use-encounters.ts:41`).
- SA-12-9 [QUEUED] — Signed-out `useEncounter` hits 401 API for non-`local-*` IDs instead of failing fast (`use-encounters.ts:52`).
- SA-12-10 [QUEUED] — Route pages don't validate `encounter.type` vs URL segment (skill encounter at `/combat` loads combat UI) (`encounters/[id]/combat/page.tsx:74`).
- SA-12-11 [SAFE-FIX] — Hub type-filter pills `py-1.5` (~30px) (`encounters/page.tsx:236`).
- SA-12-12 [QUEUED] — `HubListRow` delete hover-only (SA-3-2) (`hub-list-row.tsx:123`).
- SA-12-13 [SAFE-FIX] — Hub uses raw `red-*`/`blue-*`/`violet-*` tokens (`encounters/page.tsx:53`).
- SA-12-14 [SAFE-FIX] — Skill save indicator `text-green-600` vs combat `text-success-700` (`encounters/[id]/skill/page.tsx:199`).
- SA-12-15 [QUEUED] — Mixed encounter page lacks inline name editing present on combat/skill (`encounters/[id]/mixed/page.tsx:123`).
- SA-12-16 [SAFE-FIX] — `CombatantCard` duplicate/remove emoji buttons have `title` but no `aria-label` (`encounter-tracker/CombatantCard.tsx:529`).
- SA-12-17 [SAFE-FIX] — Hub load error `Alert` no retry (`encounters/page.tsx:251`).
- SA-12-18 [SAFE-FIX] — About page links to `/encounter-tracker` instead of `/encounters` (`about/page.tsx:44`).
- SA-12-19 [QUEUED→TASK-322] — Campaign character loads use raw `fetch` (`CombatEncounterView.tsx:80`).
- SA-12-20 [QUEUED] — Skill "Add all Characters" adds names only; combat fetches full stats (inconsistent) (`SkillEncounterView.tsx:147`).
- SA-12-21 [NOTE] — `AddCombatantModal` sets `fullScreenOnMobile`; some rows still tight at 360px.
- SA-12-22 [NOTE] — Realtime uses 90s polling + `postgres_changes`; encounter edits don't propagate outward (by design).

### Area 13 — Campaigns (SECURITY-sensitive, multi-user)

- **SA-13-1 [QUEUED][SECURITY]** — RLS "Members can update campaigns they belong to" lets any member UPDATE `campaigns` (name/desc/`characters`/`invite_code`) directly; server actions gate owner-only but DB policy doesn't (`sql/path-c-phase0-consolidate-to-public-part2.sql:25`).
- **SA-13-2 [QUEUED][SECURITY]** — `POST /api/campaigns/[id]/rolls` accepts arbitrary `characterId`/`characterName` without verifying roster membership/ownership; members can spoof others' rolls (`api/campaigns/[id]/rolls/route.ts:166`).
- **SA-13-3 [QUEUED][SECURITY]** — RLS on `campaign_rolls` grants INSERT/UPDATE/DELETE to any participant with no caller-match check; roll tampering possible outside API (`sql/path-c-phase0-consolidate-to-public-part2.sql:73`).
- **SA-13-4 [SAFE-FIX][SECURITY]** — Member character view labeled "View-only" but `RollProvider` omits `canRoll={false}` (defaults true); RM can roll as viewed player (`campaigns/[id]/view/[userId]/[characterId]/page.tsx:245`).
- **SA-13-5 [QUEUED][SECURITY]** — `GET /api/campaigns/invite/[code]` unauthenticated (IP rate-limit only); enables invite-code enumeration (`api/campaigns/invite/[code]/route.ts:12`).
- SA-13-6 [QUEUED] — `joinCampaignAction` trusts client roster metadata instead of deriving from verified `charRow.data` (`campaigns/actions.ts:152`).
- SA-13-7 [QUEUED] — Invite code shown to all members, not just RM (`campaigns/[id]/page.tsx:390`).
- SA-13-8 [SAFE-FIX] — Remove-character confirm `Modal` lacks `fullScreenOnMobile` (`campaigns/[id]/page.tsx:540`).
- SA-13-9 [SAFE-FIX] — Create/join form labels not wired `htmlFor`/`id` (`campaigns/page.tsx:313`).
- SA-13-10 [SAFE-FIX] — Inline name/desc edit controls lack accessible name (`campaigns/[id]/page.tsx:285`).
- SA-13-11 [SAFE-FIX] — RM edit pencil buttons ~16px, no 44px target (`campaigns/[id]/page.tsx:310`).
- SA-13-12 [SAFE-FIX] — Add-character modal rows lack `min-h-[44px]` (`campaigns/[id]/page.tsx:669`).
- SA-13-13 [QUEUED] — Campaign detail `ProtectedRoute` redirects to bare `/login` without `returnTo` (`protected-route.tsx:25`).
- SA-13-14 [SAFE-FIX→TASK-322] — `getCampaign`/roll service/member view use raw `fetch` (`campaign-service.ts:31`).
- SA-13-15 [QUEUED] — `useCampaignsFull()` omits `enabled:!!user` (`use-campaigns.ts:33`).
- SA-13-16 [QUEUED] — `GET /api/campaigns` ignores Supabase `{error}`; can silently return partial lists (`api/campaigns/route.ts:53`).
- SA-13-17 [QUEUED] — `getOwnerLibraryForView` uses session-scoped client, no service-role fallback; RM view may get incomplete owner library (`owner-library-for-view.ts:24`).
- SA-13-18 [NOTE] — Still writes deprecated `memberIds` JSONB alongside `campaign_members` (dual source drift) (`campaigns/actions.ts:229`).
- SA-13-19 [QUEUED] — Member character view (~380 L) duplicates character-sheet assembly instead of a shared read-only module (`campaigns/[id]/view/.../page.tsx:54`).
- SA-13-20 [NOTE] — Dead no-op prop `onViewSheet={isRealmMaster ? undefined : undefined}` (`campaigns/[id]/page.tsx:434`).
- SA-13-21 [NOTE] — `rowToCampaign`/roster normalization duplicated across list and detail API routes.
- SA-13-22 [NOTE] — `?scope=encounter` skips private-visibility checks for any member (intentional for encounters; exposes minimal combat stats).

### Area 14 — Admin (SECURITY-sensitive)

- **SA-14-1 [QUEUED][SECURITY]** — `PATCH /api/admin/users/update-role` ignores `.update()` error and always returns `{success:true}` (silent failure) (`api/admin/users/update-role/route.ts:59`).
- **SA-14-2 [QUEUED][SECURITY]** — Any admin can grant/revoke `admin` with no audit log, no "last admin" guard, no elevated confirm (`api/admin/users/update-role/route.ts:12`).
- **SA-14-3 [QUEUED][SECURITY]** — User Mgmt fires role mutation immediately on `<select>` onChange (incl. admin); one mis-click changes admin (`admin/users/page.tsx:190`).
- **SA-14-4 [QUEUED][SECURITY]** — `PATCH /api/admin/role-policies` shallow-merges arbitrary `permissions` keys; only normalizes one (`api/admin/role-policies/route.ts:94`).
- SA-14-5 [NOTE] — `/api/official/enhanced-items` reimplements inline `requireAdmin()` instead of shared `isAdmin()` (drift-prone) (`api/official/enhanced-items/route.ts:57`).
- SA-14-6 [NOTE] — Admin layout is the only page gate; non-admins redirect to `/` without return-path (SA-1-18). APIs still protected.
- SA-14-7 [QUEUED] — No rate limiting on admin APIs; `GET /api/admin/users` returns full roster incl. emails (`api/admin/users/route.ts:36`).
- SA-14-8 [QUEUED → TASK-314] — `AdminPublic*Tab` duplicates `LibraryPublicContent` lists; A-3 vector is Admin↔LibraryPublicContent (`AdminPublicPowersTab.tsx:41`).
- SA-14-9 [QUEUED → TASK-314] — `AdminFeatsTab` ~1,380 L god component; chrome overlaps `CodexFeatsTab` (`AdminFeatsTab.tsx:1177`).
- SA-14-10 [QUEUED → TASK-322] — Admin sub-pages mix raw `fetch` (users/roles/changelogs/library deletes) with `apiFetch` (`admin/users/page.tsx:57`).
- SA-14-11 [QUEUED] — Codex admin tabs + spreadsheet use blocking `alert()` for errors (30+ sites) (`AdminFeatsTab.tsx:1155`, `CodexSpreadsheetView.tsx:379`).
- SA-14-12 [QUEUED] — Tooltip Editor deletes on click with no confirm (`admin/tooltips/page.tsx:257`).
- SA-14-13 [SAFE-FIX] — `DeleteConfirmModal` hardcodes `isDeleting={false}` during official delete (no loading) (`AdminPublicPowersTab.tsx:175`).
- SA-14-14 [QUEUED] — Users/roles/changelogs show static error `Alert` no retry (`admin/users/page.tsx:162`).
- SA-14-15 [SAFE-FIX] — Core Rules back control icon-only `Link` no `aria-label` (`admin/core-rules/page.tsx:935`).
- SA-14-16 [QUEUED] — Codex/Library/Tooltips editors lack "← Back to Admin" present on other sub-pages (`admin/codex/page.tsx:59`).
- SA-14-17 [SAFE-FIX] — Role `<select>` `py-1`, below 44px (`admin/users/page.tsx:194`).
- SA-14-18 [SAFE-FIX] — Codex inline delete confirm buttons `h-6` (~24px) (`AdminFeatsTab.tsx:1319`).
- SA-14-19 [SAFE-FIX] — Delete confirm copy raw `text-red-600` not `text-danger-700` (`AdminFeatsTab.tsx:1318`).
- SA-14-20 [QUEUED] — Core Rules damage-type remove hover-only, not touch (`admin/core-rules/page.tsx:178`).
- SA-14-21 [QUEUED] — Spreadsheet bulk save surfaces validation only via `alert()`, no row-level error/undo (`CodexSpreadsheetView.tsx:379`).
- SA-14-22 [NOTE] — All five `/api/admin/*` routes consistently enforce session + `isAdmin()`. **Good baseline.**
- SA-14-23 [NOTE] — Codex/core-rules mutations via `'use server'` + `requireAdmin()` + service-role, gated server-side.
- SA-14-24 [NOTE] — Official/public library POST/DELETE + tooltip mutations enforce `isAdmin()` server-side.
- SA-14-25 [NOTE] — `/api/admin/check` intentionally callable by any signed-in user, returns only `{isAdmin}`.

### Area 15 — Account / profile + uploads (SECURITY-sensitive)

- **SA-15-1 [QUEUED][SECURITY]** — Public buckets `portraits`/`profile-pictures` broadly listable via `SELECT TO public` (enumerates all keys/URLs; TASK-326) (`sql/supabase-storage-policies.sql:18`).
- **SA-15-2 [QUEUED][SECURITY]** — Portrait upload never verifies `characterId` belongs to the session user before writing (`api/upload/portrait/route.ts:34`).
- **SA-15-3 [QUEUED][SECURITY]** — `characterId` not validated (no UUID whitelist); embedded unsanitized in storage path (traversal risk) (`api/upload/portrait/route.ts:55`).
- SA-15-4 [QUEUED] — Profile-picture extension from client `file.name`, not magic bytes (allows `uuid.exe`) (`api/upload/profile-picture/route.ts:59`).
- **SA-15-5 [QUEUED][SECURITY]** — Email change UI requires "Current Password" but never uses it; `updateUser({email})` with no re-auth (`my-account/page.tsx:549`).
- **SA-15-6 [QUEUED][SECURITY]** — Password change requires "Current Password" but never verifies it; `updateUser({password})` only (`my-account/page.tsx:585`).
- SA-15-7 [QUEUED] — Account deletion always demands password; OAuth-only users have no working delete path (`my-account/page.tsx:668`).
- SA-15-8 [SAFE-FIX] — `new_player` can't upload but "Change Picture" stays enabled (403 only on click) (`role-limits.ts:30`, `my-account/page.tsx:445`).
- SA-15-9 [QUEUED] — Profile-picture cleanup lists bucket root `limit:100`; old objects may survive (`api/upload/profile-picture/route.ts:63`).
- SA-15-10 [QUEUED] — Profile upsert sets `created_at` on every upload, overwriting real creation timestamp (`api/upload/profile-picture/route.ts:85`).
- SA-15-11 [SAFE-FIX] — Profile load errors swallowed (`console.error` only), no retry (`my-account/page.tsx:122`).
- SA-15-12 [SAFE-FIX] — Email change shows immediate success though Supabase needs confirmation (misleading) (`my-account/page.tsx:225`).
- SA-15-13 [SAFE-FIX→TASK-322] — Profile-pic upload + tooltip PATCH use raw `fetch` (`my-account/page.tsx:140`,`169`).
- SA-15-14 [SAFE-FIX] — Tooltip PATCH no schema/upsert; can return success with zero rows updated (`api/user/settings/tooltips/route.ts:36`).
- SA-15-15 [SAFE-FIX] — "Change Picture" `Button size="sm"` (32px) (`my-account/page.tsx:444`).
- SA-15-16 [SAFE-FIX] — `ImageUploadModal` zoom controls ~32px despite `fullScreenOnMobile` (`image-upload-modal.tsx:304`).
- SA-15-17 [SAFE-FIX] — Upload drop zone click-only `<div>`, no `role="button"`/`tabIndex`/keyboard (`image-upload-modal.tsx:239`).
- SA-15-18 [SAFE-FIX] — Account form labels lack `htmlFor`/`id` (username/email/password) (`my-account/page.tsx:496`).

### Area 16 — Static / content

- SA-16-1 [NOTE] — TASK-269 (Character Sheet PDF 404) **resolved in repo**: `public/Realms Character Sheet Alpha.pdf` tracked and path matches — close after confirming prod (`resources/page.tsx:33`).
- SA-16-2 [SAFE-FIX] — Resources PDF CTA `py-2.5` (~40px), below 44px (`resources/page.tsx:35`).
- SA-16-3 [SAFE-FIX] — Resources card icon raw `amber-100`/`amber-600`, no dark variants (`resources/page.tsx:23`).
- SA-16-4 [QUEUED] — `about`/`privacy`/`terms` have no `metadata` (unlike rules/resources).
- SA-16-5 [SAFE-FIX] — Privacy/Terms use `prose prose-gray` (gray typography outside token convention) (`privacy/page.tsx:13`).
- SA-16-6 [SAFE-FIX] — Privacy links `text-primary-600` without `dark:text-primary-400` (`privacy/page.tsx:17`).
- SA-16-7 [SAFE-FIX] — About carousel prev/next ~40px tap area (`about/page.tsx:441`).
- SA-16-8 [SAFE-FIX] — About carousel CTAs omit `min-h-[44px]` (`about/page.tsx:50`).
- SA-16-9 [SAFE-FIX] — About dice-selector buttons have `aria-label` but child images use non-empty `alt` (redundant) (`about/page.tsx:473`).
- SA-16-10 [QUEUED] — About is full `'use client'` (~530 L) just for carousel state (unnecessary hydration) (`about/page.tsx:8`).
- SA-16-11 [QUEUED] — Rules embeds Google Docs with no "Open in new tab" fallback (`rules/page.tsx:18`).
- SA-16-12 [NOTE] — Rules content fully third-party (Google Docs iframe).
- SA-16-13 [NOTE] — Privacy policy is generic boilerplate ("transactions/orders") not matching a free TTRPG app (`privacy/page.tsx:42`).
- SA-16-14 [NOTE] — Terms "Use License" describes one-time download, not accounts/library/community (`terms/page.tsx:29`).
- SA-16-15 [NOTE] — Footer nav omits `/resources` while header Rules dropdown includes it.

### Area 17 — Shared & UI primitives (foundational — fixes propagate)

- SA-17-1 [QUEUED → TASK-332] — `Modal` has Escape + scroll lock but **no focus trap / initial focus / focus restore** (every modal) (`ui/modal.tsx:135`).
- SA-17-2 [QUEUED → TASK-332] — `IconButton` default md=32px, sm=28px — below 44px; propagates to GridListRow, SectionHeader, Modal close, Alert/toast dismiss (`ui/icon-button.tsx:25`).
- SA-17-3 [QUEUED → TASK-332] — `Button size="sm"` h-8 (~32px), no mobile touch override (`ui/button.tsx:40`).
- SA-17-4 [QUEUED → TASK-332] — `TabNavigation` sets `role="tab"`/`aria-selected` but no `aria-controls`/tabpanel `id`; panels lack `role="tabpanel"` (Library/Codex/Browse) (`ui/tab-navigation.tsx:130`).
- SA-17-5 [SAFE-FIX] — **Tab count badges never render**: pages pass `badge`, `TabNavigation` reads `count` (SA-6-1) (`ui/tab-navigation.tsx:75`).
- SA-17-6 [SAFE-FIX] — Tab CSS uses raw `neutral-*` hover, not semantic tokens (`globals.css:838`).
- SA-17-7 [QUEUED → TASK-332] — Modals omitting `title`/`titleA11y` fall back to generic `aria-label="Dialog"` (Delete/Login/UnifiedSelection) (`ui/modal.tsx:154`).
- SA-17-8 [QUEUED → TASK-332] — Custom-header `Modal` injects sr-only "Dialog" instead of honoring `titleA11y` (`ui/modal.tsx:159`).
- SA-17-9 [SAFE-FIX] — `SearchInput` no default `aria-label`; depends on each caller (`ui/search-input.tsx:71`).
- SA-17-10 [SAFE-FIX] — `Input`/`Select`/`Textarea` error text `text-danger` not `text-danger-700` (`ui/input.tsx:54`).
- SA-17-11 [QUEUED] — `Tooltip` click mode `preventDefault()` can block wrapped button/link activation (`ui/tooltip.tsx:114`).
- SA-17-12 [SAFE-FIX] — `Tooltip` no keyboard toggle for click/mobile mode (`ui/tooltip.tsx:114`).
- SA-17-13 [SAFE-FIX] — `TabNavigation` pill `size="sm"` py-1.5 (~30px) (`ui/tab-navigation.tsx:65`).
- SA-17-14 [SAFE-FIX] — `Collapsible` `aria-expanded` but no `aria-controls`/panel `id` (`ui/collapsible.tsx:85`).
- SA-17-15 [NOTE] — `Collapsible` declares `count` prop never rendered (dead API).
- SA-17-16..21 [QUEUED → TASK-319] — Verified dead exports (E-9): `SortHeader`/`SortHeaderRow`, `ItemList`, `EquipmentListSection`, `ChoiceTraitOptionSelect`, `LoadFromLibraryModalLegacy` branch, `prefetchFunctions`.
- SA-17-22 [QUEUED] — Two divergent `FilterSection` impls (`list-components` vs `filters/filter-section`); inconsistent API (`unified-selection-modal.tsx:26`).
- SA-17-23 [SAFE-FIX] — `list-components` `FilterSection` toggle raw `<button>` without `type="button"`/`aria-expanded` (`list-components.tsx:128`).
- SA-17-24 [SAFE-FIX] — `SkillRow` edit mode uses bespoke 24px ± buttons instead of `ValueStepper`; proficiency dot icon-only no `aria-label` (`skill-row.tsx:165`).
- SA-17-25 [SAFE-FIX] — `RollButton` `unproficient` variant raw `neutral-*` tokens (`roll-button.tsx:48`).

### Area 18 — Data layer & API

- SA-18-1 [QUEUED → TASK-315] — `/api/public/[type]` and `/api/official/[type]` both live with divergent cache + `_source` tags; public lacks `species`; no runtime `/api/public` callers (`api/public/[type]/route.ts:61`).
- SA-18-2/3/21 [QUEUED → TASK-322] — Services + hooks + page code bypass `apiFetch` (character/library/crafting/encounter/campaign services; user-library hooks; codex prefetch; uploads; admin deletes).
- SA-18-4 [QUEUED] — Rate-limit drift: some routes use raw `x-forwarded-for` not `buildRateLimitKey`; admin mutation routes have none (`api/characters/route.ts:92`).
- SA-18-5 [QUEUED] — `/api/tooltips` POST/PATCH skip Content-Type/size/Zod/rate-limit; DELETE returns `{success}` vs `{ok}` elsewhere (`api/tooltips/route.ts:150`).
- SA-18-6 [QUEUED] — `/api/public/[type]` mutations ignore Supabase `{error}` and always return success (`api/public/[type]/route.ts:134`).
- SA-18-7 [SAFE-FIX] — GET handlers destructure only `{data}`, never `{error}` → failures return empty/404 not 500 (`api/characters/route.ts:47`).
- SA-18-8 [QUEUED] — Inconsistent error/404 shapes: character GET 404 returns bare `null` vs `{error}` elsewhere (`api/characters/[id]/route.ts:67`).
- SA-18-9 [QUEUED] — Two validation libs diverge: API name max 100 `.passthrough()` vs UI max 50 regex (`api-validation.ts:86` vs `validation/schemas.ts:60`).
- SA-18-10 [QUEUED] — `.passthrough()` on character/library/public schemas validates only name; blobs unvalidated (`api-validation.ts:86`).
- SA-18-11 [QUEUED] — Conflicting cache layers for codex/official (server no-store vs client no-store vs hook 5min TTL) → stale admin edits possible (`api/codex/route.ts:406`).
- SA-18-12 [NOTE] — Legacy `/api/public` CDN caching still documented while routes moved to no-store (`DEPLOYMENT_AND_SECRETS_SUPABASE.md:120`).
- SA-18-13 [QUEUED] — `prepareForSave` duplicated identically in both character route files.
- SA-18-14 [QUEUED] — `/api/codex` ~400-line inline normalization separate from `library-columnar`/`use-user-library` (drift; hardcodes `speed:6`) (`api/codex/route.ts:178`).
- SA-18-15 [QUEUED] — `useAddOfficialToLibrary` invalidates `['user-powers']` without `userId` prefix (convention break) (`use-public-library.ts:53`).
- SA-18-16 [NOTE] — React Query `staleTime` inconsistent + undocumented (codex 30m, official 5m, user 2m, tooltips 10m, characters 0).
- SA-18-17 [QUEUED] — `duplicateCharacter` redundant full GET before POST (`character-service.ts:105`).
- SA-18-18 [QUEUED → TASK-331] — Portrait upload skips ownership/ID validation (SA-15-2) (`api/upload/portrait/route.ts:34`).
- SA-18-19 [QUEUED → TASK-315] — Deprecated `usePublicLibrary`/`useAddPublicToLibrary` aliases still exported.
- SA-18-20 [NOTE] — `apiFetch` always sets JSON Content-Type → can't be used for FormData (explains upload raw fetch).
- SA-18-22 [SAFE-FIX] — `/api/user/settings/tooltips` PATCH lacks shared validation (`api/user/settings/tooltips/route.ts:35`).
- SA-18-23 [QUEUED] — `findLibraryItemByName` over-fetches whole library to find one name (`library-service.ts:47`).
- SA-18-24 [SAFE-FIX] — Species height/weight normalization duplicated across official route + codex.
- SA-18-25 [NOTE] — **Good baseline**: character + user-library routes consistently use `getSession`, `validateJson`, quotas, `standardLimiter`.

### Area 19 — Security & infrastructure (most severe first)

- **SA-19-1 [FIXED → TASK-328 done][CRITICAL]** — `user_profiles` UPDATE policy only checked `id = auth.uid()` with no column guard on `role` and no trigger; any authenticated user could self-grant `admin` from the browser. **FIXED 2026-06-12**: `trg_prevent_unauthorized_role_change` (`BEFORE UPDATE OF role`) applied to production — blocks role changes unless `auth.role()='service_role'`. Verified: authenticated=BLOCKED, service_role=ALLOWED.
- **SA-19-2..5,17 [QUEUED → TASK-329][SECURITY]** — Campaign/roll authz gaps: permissive `campaigns` UPDATE RLS (any member edits whole row incl. `invite_code`/`owner_id`), `campaign_rolls` INSERT/UPDATE/DELETE to any participant (tampering), roll identity spoofing via API, unauthenticated invite-code oracle, invite code exposed to all members.
- **SA-19-6,7,20 [QUEUED → TASK-330][SECURITY]** — Admin role-mgmt: silent `update-role` failure, no audit/last-admin guard, `role-policies` arbitrary-key injection, full email roster export.
- **SA-19-9 [QUEUED → TASK-331][SECURITY]** — Portrait upload lacks ownership gate (SA-15-2/3).
- SA-19-10,11 [QUEUED → TASK-340] — Rate limiting covers ~13/28 routes; `strictLimiter` unused; admin/campaigns/tooltips unprotected; in-memory limiter is per-instance.
- SA-19-12,13 [QUEUED → TASK-340] — Admin/sensitive routes lack Zod; `.passthrough()` on core mutation schemas.
- SA-19-14,15 [QUEUED → TASK-340] — Service role used for all public codex reads + self-scoped tooltip prefs (over-broad RLS bypass).
- SA-19-16 [QUEUED → TASK-345] — `signOutAction` doesn't call `auth.signOut()` (SA-2-12).
- SA-19-18 [QUEUED → TASK-345] — Auth open-redirect (`//`-prefixed) (SA-2-1).
- SA-19-19 [NOTE] — CSP allows `'unsafe-inline'`/`'unsafe-eval'` (weakens XSS containment) (`next.config.ts:23`).
- SA-19-21 [NOTE] — Username enumeration via `usernames` table (any signed-in user can SELECT all).
- SA-19-22 [NOTE] — **Service-role key handling sound**: server-only; browser uses anon key; no `NEXT_PUBLIC_` secret misuse.

### Area 20 — Cross-cutting systemic patterns (counts repo-wide)

- SA-20-1 [QUEUED → TASK-332] — `Button size="sm"` (32px) — **~318 across ~85 files**. Fix primitive default.
- SA-20-2 [QUEUED → TASK-332] — `IconButton` sm=28px/md=32px — **~150+ in ~35 files**.
- SA-20-3 [QUEUED → TASK-332] — Explicit sub-44px controls (`h-6`, `py-0.5`) — ~25+.
- SA-20-5 [SAFE-FIX→batch] — Status contrast `-600`/`text-red-600` in light mode (should be `-700`) — **~58 across ~40 files**.
- SA-20-6 [SAFE-FIX→batch] — Raw `gray-*`/`neutral-*` outside auth — ~28.
- SA-20-7 [QUEUED] — Hover-only actionable controls — 4 (`character-card.tsx:53`, `hub-list-row.tsx:123`, `core-rules/page.tsx:178`, `sheet-header.tsx:576`).
- SA-20-8 [QUEUED] — Icon-only buttons missing `aria-label` — ~10+.
- SA-20-9 [QUEUED → TASK-339] — Static error states with no retry — **~27 branches** (only campaigns wires retry).
- SA-20-10 [QUEUED → TASK-322] — Raw `fetch(` in client — **~33 calls in ~23 files**.
- SA-20-11 [QUEUED → TASK-338] — Blocking `alert()`/`confirm()` — **~42 across 16 files**.
- SA-20-12 [SAFE-FIX→batch] — Leftover `console.*` in client — **~38 across 23 files**.
- SA-20-13 [NOTE] — `cache:'no-store'` on codex/official/character — 5 sites (intentional freshness, blocks HTTP caching).
- SA-20-14 [QUEUED] — Heading hierarchy skips — ~15+.
- SA-20-15 [QUEUED → TASK-332] — Modals missing `title`/`titleA11y` → "Dialog" — ~8+.
- SA-20-17 [QUEUED → TASK-338] — Admin codex inline delete micro-buttons (`size="sm"`+`h-6`) — ~18 across 6 tabs.

<!-- AREA-FINDINGS-END -->

---

## Consolidated remediation tasks (queued)

The systematic findings roll up into these tracked tasks (added to `AI_TASK_QUEUE.md`), in priority order:

| Task | Theme | Key findings |
|------|-------|--------------|
| **TASK-328** | **CRITICAL: `user_profiles.role` self-escalation RLS** | SA-19-1 |
| **TASK-329** | Campaign/roll authz hardening (RLS + API) | SA-13-1/2/3/5/6/7, SA-19-2..5/17 |
| **TASK-330** | Admin role-management hardening (confirm, audit, last-admin guard, silent-failure, key whitelist) | SA-14-1/2/3/4/7, SA-19-6/7/20 |
| **TASK-331** | Upload + account auth hardening (portrait ownership/sanitize, profile-pic ext, password re-auth, OAuth delete) | SA-15-2..7, SA-18-18, SA-19-9 |
| **TASK-332** | Primitive a11y/touch (Button/IconButton 44px, Modal focus-trap + title fallback, TabNavigation aria + badge/count, ErrorDisplay onRetry) | SA-17-1..8, SA-20-1/2/3/15 |
| **TASK-333** | Autosave correctness (markSaved-on-load, dirty-check, concurrent queue, failure toasts) — sheet/encounter/crafting | SA-4-7/8/9, SA-11-1/2, SA-12-4 |
| **TASK-334** | Technique-creator load/save bugs + share PartCard + unify mechanic builder | SA-9-1/3/4/5/6/7 |
| **TASK-335** | Library tab UX bugs (badge count, Enhanced→Realms blank, mode flash, dup/sync confirms, Enhanced parity) | SA-6-1/2/3/8/9/11 |
| **TASK-336** | Browse consolidation decision (merge into Library public mode or make distinct + wire nav) | SA-8-1/2/3/4/13 |
| **TASK-337** | Creature/species creator unification + bugs (transformer item mapping, SkillsAllocationPage reuse, budget guard, species batch-trait bug, load parity) | SA-10-1/2/4/5/6/7/12/21 |
| **TASK-338** | Replace blocking `alert()`/`confirm()` with toasts/modals (admin/codex/sheet) | SA-7-10, SA-14-11/12, SA-20-11/17 |
| **TASK-339** | Standardize loading/error/empty states with retry (folds INC-2/TASK-323) | SA-20-9, SA-6-13, SA-7-6 |
| **TASK-340** | API hardening (tighten `.passthrough()`, error shape, GET error handling, rate-limit coverage, service-role scope) | SA-18-5/6/7/8/10, SA-19-10/12/13/14/15 |
| **TASK-341** | Characters list parity (auth-init flash, touch/duplicate actions, sort/search, button-in-link) | SA-3-1/2/3/5/6 |
| **TASK-342** | App-shell hardening (route-protection + returnTo consistency, error/not-found coverage, home h1/heading order, mobile drawer focus/escape, logged-out theme) | SA-1-1/2/3/8/9/10/15 |
| **TASK-343** | Auth UX/security (open-redirect normalize, username persistence on confirm, forgot-username impl, signOut, resend emailRedirectTo, reset-password completion) | SA-2-1/4/5/8/9/12, SA-19-16/18 |
| **TASK-344** | Encounters cleanup (remove dead tracker UI, completed-status lifecycle, turn-reorder bug, guest migration, two-way resource sync) | SA-12-1/2/3/5/6/7/8 |
| **TASK-345** | Static content (metadata for about/privacy/terms, rewrite legal copy, carousel a11y/touch, rules iframe fallback) | SA-16-2..11 |
| **TASK-346** | Systemic token/console batch (status `-600`→`-700`, stray `gray-*`/`neutral-*`, remove client `console.*`) | SA-20-5/6/12 |

**Status normalization:** TASK-307 and TASK-308 are implemented in code (SA-5-18/19) — verify and mark `done`.

---

*Started 2026-06. Living document — update status + findings as areas are completed.*
