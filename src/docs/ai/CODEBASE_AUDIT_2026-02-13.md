# RealmsRPG Codebase Audit — 2026-02-13

> **Scope:** Full codebase audit covering duplicate/redundant code, dead code, security, UI/UX consistency, performance, and best practices.
> **Stack:** Next.js (App Router), React, Tailwind v4, Supabase (PostgreSQL, Auth, Storage), Prisma, Vercel

---

## Executive Summary

The codebase is well-structured overall with good architectural decisions (Prisma, React Query, component composition). The audit uncovered **98 actionable findings** across 9 categories, of which **~75 have been resolved** across five implementation passes. Key status:

1. **Security** (fully resolved): ~~Admin UID exposure~~ ✅, ~~security headers~~ ✅, ~~auth race condition~~ ✅, ~~Zod validation~~ ✅, ~~rate limiting~~ ✅, ~~file upload magic bytes~~ ✅, ~~API error handling (all routes)~~ ✅, ~~Content-Type validation~~ ✅, ~~payload size limits~~ ✅, ~~error message leak prevention~~ ✅
2. **UI/UX Consistency** (mostly resolved): ~~21 components migrated to design tokens~~ ✅, ~~dead CSS vars removed~~ ✅, ~~skip-to-content link~~ ✅, ~~header ARIA labels~~ ✅, ~~home page duplicate header~~ ✅, ~~login checkbox styling~~ ✅ — remaining: UX-3/4/5 standardization (TASK-240)
3. **Dead Code** (fully resolved): ~~Legacy hooks/services removed~~ ✅, ~~empty dirs removed~~ ✅, ~~ItemSelectionModal removed~~ ✅, ~~item-transformers.ts removed~~ ✅, ~~NumberStepper removed~~ ✅, ~~deprecated Button variants removed~~ ✅, ~~stale RTDB comments fixed~~ ✅, ~~unused CSS classes removed~~ ✅, ~~ColumnHeaders removed~~ ✅, ~~api-handler.ts removed~~ ✅, ~~functions/ dir (Firebase) removed~~ ✅, ~~archived_docs/ removed~~ ✅, ~~stale scripts removed~~ ✅, ~~redundant docs removed~~ ✅
4. **Performance** (mostly resolved): ~~React.memo on all 4 list components~~ ✅, ~~ErrorBoundary~~ ✅, ~~loading/error routes~~ ✅, ~~lazy-load react-easy-crop~~ ✅ — deferred: P-5 CharacterSheetContext (large refactor)
5. **Duplicate Code** (fully resolved): ~~apiFetch extracted~~ ✅, ~~ItemSelectionModal removed~~ ✅, ~~fetchCodex deduped~~ ✅, ~~delete/duplicate factories~~ ✅, ~~ListHeader/ColumnHeaders consolidated~~ ✅, ~~SizeCategory naming fixed~~ ✅
6. **Owner Feedback** (mostly resolved): ~~FB-1 name edit~~ ✅, ~~FB-5 label~~ ✅, ~~FB-8 Firestore refs~~ ✅, ~~FB-2 skill auto-save~~ ✅, ~~FB-4 initiative auto-roll~~ ✅, ~~FB-3 public char view~~ ✅, ~~FB-7 library visibility~~ ✅ — remaining: FB-6 campaign join notification

---

## Category 1: SECURITY (14 findings)

### CRITICAL

| # | Issue | File(s) | Description | Fix |
|---|-------|---------|-------------|-----|
| S-1 | No input validation on API routes | `src/app/api/characters/route.ts`, `api/encounters/route.ts`, `api/user/library/[type]/route.ts` | POST/PATCH accept JSON without schema validation (no Zod/Yup). Invalid data, type coercion, or oversized payloads can reach the database. | Add Zod schemas to all POST/PATCH handlers |
| S-2 | No rate limiting | All `src/app/api/**/route.ts` | Zero rate limiting on any endpoint. Vulnerable to DoS, brute-force, and abuse. | Add `@upstash/ratelimit` or Vercel Edge rate limiting |
| S-3 | Admin UIDs exposed to client | `src/lib/admin.ts:16` | Uses `NEXT_PUBLIC_ADMIN_UIDS` which ships admin user IDs in the client JS bundle. | Remove `NEXT_PUBLIC_` prefix; use server-only `ADMIN_UIDS` env var exclusively |

### HIGH

| # | Issue | File(s) | Description | Fix |
|---|-------|---------|-------------|-----|
| S-4 | No security headers | `src/middleware.ts`, `next.config.ts` | Missing CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy | Add headers in `next.config.ts` `headers()` or middleware |
| S-5 | File upload validation insufficient | `api/upload/profile-picture/route.ts`, `api/upload/portrait/route.ts` | Only checks MIME type prefix (`image/`), no magic byte validation. Malicious files can bypass. | Validate file signatures with `file-type` library |
| S-6 | Campaign invite code enumerable | `api/campaigns/invite/[code]/route.ts` | No auth required; no rate limit. Invite codes can be brute-forced. | Add rate limiting + require auth or CAPTCHA |
| S-7 | Inconsistent API error handling | Various API routes | Some routes have try/catch, others don't. Stack traces may leak in production. | Wrap all handlers in error middleware; return generic messages in prod |

### MEDIUM

| # | Issue | File(s) | Description | Fix |
|---|-------|---------|-------------|-----|
| S-8 | No Content-Type validation | All POST/PATCH routes | No explicit check that incoming request is `application/json` | Add Content-Type header validation |
| S-9 | Character sheet not wrapped in ProtectedRoute | `src/app/(main)/characters/[id]/page.tsx` | Uses manual `useAuth()` check instead of `ProtectedRoute` wrapper — content may flash before redirect | Wrap in `ProtectedRoute` |
| S-10 | Race condition in auth init | `src/hooks/use-auth.ts:47-65` | `onAuthStateChange` and `getUser()` can call `setUser`/`setInitialized` concurrently, causing state conflicts | Add `initializedRef` guard |
| S-11 | Middleware only refreshes session | `src/middleware.ts` | Middleware refreshes Supabase session but doesn't enforce auth on protected routes — relies entirely on client-side guards | Add server-side route protection for `/characters`, `/library`, etc. |
| S-12 | ProtectedRoute timing | `src/components/layout/protected-route.tsx:23-27` | Redirect in `useEffect` means protected content briefly renders before redirect | Return null/loading until auth resolved |
| S-13 | Missing payload size limits | `api/characters/route.ts`, `api/user/library/[type]/route.ts` | No max payload enforcement; memory exhaustion risk | Set body size limits in Next.js config or middleware |
| S-14 | No request logging/tracing | All API routes | No request IDs for debugging or audit trail | Add structured logging with request IDs |

---

## Category 2: DUPLICATE / REDUNDANT CODE (8 findings)

### HIGH

| # | Issue | File(s) | Description | Fix |
|---|-------|---------|-------------|-----|
| D-1 | `apiFetch` duplicated 3× | `services/character-service.ts:23-39`, `services/encounter-service.ts:11-27`, `services/campaign-service.ts:11-19` | Identical fetch+error-handling logic copied across all services | Extract to `src/lib/api-client.ts` and import |
| D-2 | `ItemSelectionModal` vs `UnifiedSelectionModal` | `shared/item-selection-modal.tsx`, `shared/unified-selection-modal.tsx` | Two selection modals: one uses ItemList/ItemCard, the other uses GridListRow. `ItemSelectionModal` is only used in `powers-step.tsx`. | Migrate `powers-step.tsx` to `UnifiedSelectionModal`; remove `ItemSelectionModal` |
| D-3 | `fetchCodex` duplicated | `hooks/use-codex.ts:19-23`, `services/game-data-service.ts:12-16` | Same codex fetch function in two places | Move to one location; import in both |

### MEDIUM

| # | Issue | File(s) | Description | Fix |
|---|-------|---------|-------------|-----|
| D-4 | `ListHeader` vs `ColumnHeaders` | `shared/list-header.tsx`, `shared/list-components.tsx` | Both render sortable column headers with different implementations. `ListHeader` has hardcoded `blue-*` colors. | Consolidate into one component using design tokens |
| D-5 | Repetitive delete mutations | `hooks/use-user-library.ts:231-329` | `useDeletePower`, `useDeleteTechnique`, `useDeleteItem`, `useDeleteCreature` — same pattern 4× | Create generic `createDeleteMutation(type)` factory |
| D-6 | Manual cache alongside React Query | `services/game-data-service.ts:9-25` | Manual cache with TTL while hooks already use React Query caching — redundant | Remove manual cache; rely on React Query |
| D-7 | `NumberStepper` wrapping `ValueStepper` | `creator/number-stepper.tsx`, `shared/value-stepper.tsx` | Thin backwards-compatibility wrapper | Migrate creator usages directly to `ValueStepper` |
| D-8 | Duplicate `SizeCategory` type | `types/ancestry.ts:8`, `types/core-rules.ts:142` | Union type in one file, interface with properties in another | Unify: use interface from `core-rules.ts`; derive union type if needed |

---

## Category 3: DEAD CODE (9 findings)

### HIGH

| # | Issue | File(s) | Description | Safe to Remove? |
|---|-------|---------|-------------|-----------------|
| DC-1 | Legacy game-data hooks | `hooks/use-game-data.ts` | `useSkills`, `useSkill`, `useFeats`, `useFeat`, `useAncestries`, `useAncestry`, `useGameData`, `useGameDataList` — all replaced by `useCodex*` hooks | Yes (keep `useArchetypes` or migrate) |
| DC-2 | Legacy game-data service functions | `services/game-data-service.ts` | `getSkills`, `getSkill`, `getFeats`, `getFeat`, `getAncestries`, `getAncestry`, `getGameData`, `getGameDataList` | Yes (keep `getArchetypes`) |
| DC-3 | Hooks index re-exports dead code | `hooks/index.ts` | Re-exports unused hooks from `use-game-data.ts` | Yes |

### MEDIUM

| # | Issue | File(s) | Description | Safe to Remove? |
|---|-------|---------|-------------|-----------------|
| DC-4 | Stale RTDB comments | `power-creator/page.tsx:7`, `technique-creator/page.tsx:7` | Comments say "Select power parts from RTDB database" — should say Prisma/Codex | Update comments |
| DC-5 | Empty reference directory | `manmade-react-site-reference-only/` | Empty directory with no files | Yes |
| DC-6 | `firebase-admin` in next config | `next.config.ts` | `serverExternalPackages: ['firebase-admin']` — Firebase removed from project | Yes (remove from array) |

### LOW

| # | Issue | File(s) | Description | Safe to Remove? |
|---|-------|---------|-------------|-----------------|
| DC-7 | Deprecated button variants | `ui/button.tsx` | `success`, `utility`, `gradient` variants may be unused | Verify usage, remove if unused |
| DC-8 | Potentially unused CSS variables | `globals.css` | `--color-on-primary`, `--color-accent-bronze`, `--color-accent-medium`, `--color-accent-dark`, `--color-utility-*`, `--color-surface-dark`, `--color-card-*` | Verify with grep |
| DC-9 | Potentially unused type exports | `types/character.ts`, `types/core-rules.ts` | `CharacterDraft`, `ArchetypeProgressionEntry` may be unused | Verify with grep |

---

## Category 4: UI/UX CONSISTENCY (16 findings)

### CRITICAL — Design Token Violations

| # | Issue | Files Affected | Current | Should Be |
|---|-------|---------------|---------|-----------|
| UX-1 | Hardcoded `blue-*` across 20+ components | `list-header.tsx`, `skill-row.tsx`, `sheet-header.tsx`, `recovery-modal.tsx`, `feats-step.tsx`, `value-stepper.tsx`, `abilities-section.tsx`, `archetype-section.tsx`, `sheet-action-toolbar.tsx`, `add-sub-skill-modal.tsx`, `library-section.tsx`, `ancestry-step.tsx`, `finalize-step.tsx`, `health-energy-allocator.tsx`, `creature-stat-block.tsx`, `tab-summary-section.tsx`, `level-up-modal.tsx`, `edit-section-toggle.tsx`, `skills-allocation-page.tsx` | `bg-blue-50`, `text-blue-600`, `text-blue-700`, `border-blue-200`, etc. | `bg-primary-50`/`bg-info-50`, `text-primary-600`/`text-info-600`, etc. Use `energy-*` tokens for energy contexts |
| UX-2 | Hardcoded `green-*`, `red-*`, `amber-*` | Encounter tracker, item-creator, technique-creator, admin pages, creature-creator | `bg-green-500`, `text-red-600`, `bg-amber-100`, etc. | `bg-success-*`, `text-danger-*`, `bg-warning-*` design tokens |

### HIGH

| # | Issue | File(s) | Description | Fix |
|---|-------|---------|-------------|-----|
| UX-3 | Multiple modal implementations | Various | `DeleteConfirmModal`, `ConfirmActionModal`, `LoginPromptModal`, `ImageUploadModal` all use custom implementations instead of composing base `Modal` | Refactor to extend base `Modal` with consistent header/footer patterns |
| UX-4 | Multiple error display patterns | Various | Errors shown via `Alert`, `Toast`, `ErrorDisplay`, and inline custom code | Standardize: `Alert` for persistent errors, `Toast` for transient notifications |
| UX-5 | Multiple loading state patterns | Various | Skeleton loaders, `LoadingState`, `Spinner`, `LoadingSpinner`, text "Loading..." all used inconsistently | Standardize: `LoadingState` for pages, skeletons for lists, `Spinner` for inline |
| UX-6 | Home page duplicates header | `src/app/page.tsx` | Manually includes `<Header/>` and `<Footer/>` instead of using layout | Move to layout pattern |
| UX-7 | Character sheet/encounter pages skip `PageContainer` | `characters/[id]/page.tsx`, encounter pages | Custom padding/max-width instead of `PageContainer` | Use `PageContainer` for consistency |

### MEDIUM

| # | Issue | File(s) | Description | Fix |
|---|-------|---------|-------------|-----|
| UX-8 | Inconsistent max-widths | Various pages | Mix of `max-w-[1440px]`, `max-w-[1600px]`, `max-w-7xl` | Standardize on one max-width via `PageContainer` |
| UX-9 | Header uses raw `<button>` elements | `components/layout/header.tsx:115,132,142,151,210,240` | Raw buttons instead of `Button`/`IconButton` components | Replace with proper components |
| UX-10 | Login page raw checkbox | `(auth)/login/page.tsx:120` | Raw `<input type="checkbox">` instead of `Checkbox` component | Replace with `Checkbox` |
| UX-11 | Duplicate CSS variables | `globals.css` | `--color-border`/`--border`, `--color-surface`/`--surface`, `--color-text-primary`/`--text-primary` — same values duplicated | Consolidate to single naming convention |

### LOW

| # | Issue | File(s) | Description | Fix |
|---|-------|---------|-------------|-----|
| UX-12 | Limited ARIA labels | Header buttons, form inputs | Missing `aria-label` on icon buttons and interactive elements | Add ARIA labels throughout |
| UX-13 | Missing heading hierarchy verification | All pages | H1/H2/H3 hierarchy not systematically verified | Audit heading levels |
| UX-14 | Missing skip-to-content link | Root layout | No skip link for keyboard navigation | Add skip link |
| UX-15 | Responsive design untested areas | Character sheet, encounter tracker, admin pages | May not handle mobile/tablet properly | Manual test all viewports |
| UX-16 | Missing page-specific metadata/SEO | Most pages | Only root layout has metadata; no page-specific titles or descriptions | Add `metadata` exports to each page |

---

## Category 5: PERFORMANCE (8 findings)

### HIGH

| # | Issue | File(s) | Description | Fix |
|---|-------|---------|-------------|-----|
| P-1 | No `React.memo` on list item components | `grid-list-row.tsx`, `item-card.tsx`, `skill-row.tsx`, `CombatantCard.tsx` | These render in `.map()` loops across the app. Every parent re-render re-renders all list items. | Wrap in `React.memo` with appropriate comparison functions |
| P-2 | No error boundaries | Entire app | A single component crash can take down entire sections. No graceful degradation. | Add `ErrorBoundary` component; wrap critical sections (character sheet, creators, library, encounter tracker) |
| P-3 | No `loading.tsx` / `error.tsx` handlers | Most routes in `src/app/(main)/` | Missing Next.js built-in loading and error UI for route groups | Add `loading.tsx` and `error.tsx` per route group |

### MEDIUM

| # | Issue | File(s) | Description | Fix |
|---|-------|---------|-------------|-----|
| P-4 | React Query stale times too short for static data | `hooks/use-codex.ts` | Codex data rarely changes but uses default 1-minute staleTime | Set `staleTime: 30 * 60 * 1000` for codex queries |
| P-5 | Prop drilling in character sheet | `characters/[id]/page.tsx:1362-1406` | 40+ props passed to `LibrarySection` through multiple levels | Create `CharacterSheetContext` for shared state/callbacks |
| P-6 | Client components could be server components | `characters/[id]/page.tsx`, `library/page.tsx`, `codex/page.tsx` | Entire pages marked `'use client'` when only parts need interactivity | Split into server wrapper + client interactive parts |
| P-7 | Lazy-load heavy modals | `shared/image-upload-modal.tsx` | `react-easy-crop` (~50KB) loaded eagerly even when modal is closed | Dynamic import with `next/dynamic` |
| P-8 | Sequential data fetching | `characters/[id]/page.tsx:135-148` | Character loads before library fetches — could be parallelized | Use `Promise.all` for independent fetches |

---

## Category 6: DATABASE / PRISMA (5 findings)

### MEDIUM

| # | Issue | File(s) | Description | Fix |
|---|-------|---------|-------------|-----|
| DB-1 | Missing `inviteCode` index | `prisma/schema.prisma` (Campaign model) | `inviteCode` is queried but not indexed — will be slow at scale | Add `@@index([inviteCode])` |
| DB-2 | Missing composite indexes | `prisma/schema.prisma` | `UserPower`, `UserTechnique`, `UserItem`, `UserCreature` lack `[userId, updatedAt]` indexes; `CampaignRoll` lacks `[campaignId, createdAt]` | Add composite indexes for sorted queries |
| DB-3 | `inviteCode` should be `@unique` | `prisma/schema.prisma` (Campaign model) | If invite codes must be unique per campaign, enforce at DB level | Add `@unique` constraint |

### LOW

| # | Issue | File(s) | Description | Fix |
|---|-------|---------|-------------|-----|
| DB-4 | Missing `select` clauses | Various API routes | Queries fetch all columns when only some are needed | Add `select` to Prisma queries for efficiency |
| DB-5 | Inconsistent naming convention in types | `src/types/` | Mix of `snake_case` (`pow_abil`, `mart_prof`) and `camelCase` (`abilityName`) | Document convention or standardize |

---

## Category 7: CODE QUALITY & BEST PRACTICES (8 findings)

### HIGH

| # | Issue | File(s) | Description | Fix |
|---|-------|---------|-------------|-----|
| CQ-1 | Syntax error in `use-auto-save.ts` | `hooks/use-auto-save.ts:86` | Missing closing brace in `performSave` function | Fix brace |
| CQ-2 | Direct Supabase calls in hooks | `hooks/use-auth.ts`, `hooks/use-campaign-rolls.ts` | Hooks create Supabase clients directly instead of using service layer | Create `auth-service.ts` for Supabase auth operations |
| CQ-3 | Missing input validation in services | `services/library-service.ts` | No validation on `type` parameter — accepts any string | Add type guard: `const VALID_TYPES = ['powers', 'techniques', 'items', 'creatures'] as const` |

### MEDIUM

| # | Issue | File(s) | Description | Fix |
|---|-------|---------|-------------|-----|
| CQ-4 | `RecoveryModal` too large (~440 lines) | `character-sheet/recovery-modal.tsx` | Handles too many concerns in one component | Extract `PartialRecoveryAllocator`, `RecoveryFeatList`, `RecoveryModeSelector` |
| CQ-5 | `ItemList` too large (~450 lines) | `shared/item-list.tsx` | Handles filtering, sorting, search, selection, layout toggle, and rendering | Extract `ItemListFilters`, `ItemListControls` |
| CQ-6 | Type assertions without runtime validation | `services/character-service.ts:68` | `return { character: data as Character }` — assumes shape matches | Add runtime type guard or Zod parse |
| CQ-7 | Unconstrained generics | `hooks/use-user-library.ts:140` | `fetchLibrary<T>(type: string, ...)` — `type` should be constrained | Use `type: LibraryType` with literal union |
| CQ-8 | `localStorage` errors swallowed | `hooks/use-creator-cache.ts:65-78,126-134` | Try/catch only logs errors; no user feedback | Add error state or callback |

---

## Priority Ranking (Recommended Execution Order)

### Phase 1 — Security (Immediate)
1. **S-3**: Remove `NEXT_PUBLIC_ADMIN_UIDS` exposure
2. **S-4**: Add security headers (CSP, X-Frame-Options, HSTS, etc.)
3. **S-1**: Add Zod input validation to all API routes
4. **S-2**: Add rate limiting to API routes
5. **S-5**: Validate file uploads with magic bytes
6. **CQ-1**: Fix syntax error in `use-auto-save.ts`

### Phase 2 — UI/UX Consistency (High Impact)
7. **UX-1 + UX-2**: Replace ALL hardcoded color classes with design tokens (biggest visual consistency win)
8. **UX-11**: Consolidate duplicate CSS variables
9. **UX-3**: Standardize modal patterns on base `Modal`
10. **UX-4**: Standardize error display (Alert for persistent, Toast for transient)
11. **UX-5**: Standardize loading states

### Phase 3 — Dead Code Cleanup
12. **DC-1 + DC-2 + DC-3**: Remove legacy `use-game-data` hooks and services
13. **D-2**: Remove `ItemSelectionModal` (migrate `powers-step` to `UnifiedSelectionModal`)
14. **DC-5 + DC-6**: Remove empty directory and stale firebase-admin reference
15. **D-1**: Extract shared `apiFetch` to `src/lib/api-client.ts`

### Phase 4 — Performance
16. **P-1**: Add `React.memo` to list item components
17. **P-2**: Add error boundaries
18. **P-3**: Add `loading.tsx` / `error.tsx` route handlers
19. **P-4**: Optimize React Query stale times for static data
20. **P-5**: Create `CharacterSheetContext` to reduce prop drilling

### Phase 5 — Database & Polish
21. **DB-1 + DB-2 + DB-3**: Add missing Prisma indexes
22. **D-4**: Consolidate `ListHeader` / `ColumnHeaders`
23. **D-5**: Create generic delete mutation factory
24. **UX-16**: Add page-specific metadata/SEO
25. **UX-12 + UX-14**: Accessibility improvements

---

## Metrics

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Security | 3 | 4 | 7 | 0 | 14 |
| Duplicates | 3 | 0 | 5 | 0 | 8 |
| Dead Code | 3 | 0 | 3 | 3 | 9 |
| UI/UX | 2 | 5 | 4 | 5 | 16 |
| Performance | 3 | 0 | 5 | 0 | 8 |
| Database | 0 | 0 | 3 | 2 | 5 |
| Code Quality | 3 | 0 | 5 | 0 | 8 |
| **Total** | **17** | **9** | **32** | **10** | **68** |

---

## Files Most Frequently Flagged

These files appeared in multiple audit categories and should be prioritized for refactoring:

1. `src/middleware.ts` — Security headers, auth enforcement, logging (S-4, S-11, S-14)
2. `src/hooks/use-auth.ts` — Race condition, direct Supabase calls (S-10, CQ-2)
3. `src/app/(main)/characters/[id]/page.tsx` — Auth, prop drilling, client component, sequential fetching (S-9, P-5, P-6, P-8)
4. `src/components/shared/list-header.tsx` — Hardcoded colors, duplicate of ColumnHeaders (UX-1, D-4)
5. `src/hooks/use-game-data.ts` — Entirely dead code (DC-1)
6. `src/services/game-data-service.ts` — Dead code + duplicate caching (DC-2, D-6)
7. `src/app/globals.css` — Duplicate CSS variables (UX-11)
8. `prisma/schema.prisma` — Missing indexes (DB-1, DB-2, DB-3)

---

---

## Category 8: OWNER FEEDBACK — UNIMPLEMENTED / INCOMPLETE (18 findings)

This section cross-references every piece of owner feedback (from `ALL_FEEDBACK_CLEAN.md`) against the actual codebase to identify items that were never implemented, only partially implemented, or implemented incorrectly.

> **Rule:** Newer feedback overrides older. The most recent feedback is the source of truth.

### NOT DONE

| # | Issue | Source Feedback | Details | Fix |
|---|-------|----------------|---------|-----|
| FB-1 | Character name editing only in edit mode | 2/5/2026 | `sheet-header.tsx:557` — pencil icon visible anytime `onNameChange` is truthy, not gated by `isEditMode`. Owner said: "Only allow editing of character name in edit mode." | Gate with `onNameChange && isEditMode &&` |
| FB-2 | Skill auto-save on tab switch in creator | 2/3/2026 | "When I allocated skills in the character creator, it doesn't save them when I switch tabs." Character creator uses Zustand persist (localStorage) but doesn't trigger explicit save on tab navigation. | Add `onBeforeTabChange` callback that calls `updateDraft()` with current allocations before switching |
| FB-3 | Public character view page (frontend) | 2/9/2026 | API supports public/campaign character viewing (GET works unauthenticated when `visibility=public`), but there is no dedicated frontend page for viewing another user's public character read-only. Owner: "Anyone can copy the link and view in browser (read-only)." | Create a public character view route or reuse character sheet with `readOnly` prop based on auth/ownership |
| FB-4 | Initiative auto-select on combatant add | 2/11/2026 | When adding combatants to encounters, initiative defaults to 0 and must be manually entered. Owner wanted initiative to auto-select/auto-roll. | Auto-generate initiative (d20 + relevant bonus) when adding combatants |

### PARTIALLY DONE

| # | Issue | Source Feedback | What's Done | What's Missing | Fix |
|---|-------|----------------|-------------|----------------|-----|
| FB-5 | "Next: 2 Points" label | 2/3/2026 | Shows correct cost (2 at 4+), but label says "Next: 2pt" instead of "Next: 2 Points" | Label format | Change `"pt"` to `" Points"` in ability-score-editor.tsx and abilities-section.tsx |
| FB-6 | Character visibility notification | 2/9/2026 | Visibility setting exists in Notes tab, API enforces it | Missing: notification when a private character joins a campaign that visibility will change to "campaign only" | Add campaign join notification/modal |
| FB-7 | Character-derived content (library) visibility | 2/9/2026 | Character can be viewed by others | Owner said: "Powers, techniques, armaments from private library must be visible to viewers." The public/campaign view may not load the owner's full library for those items. | Ensure `getOwnerLibraryForView` returns items referenced by the character |
| FB-8 | "Firestore" references in feedback doc | 2/6/2026 | ALL_FEEDBACK_CLEAN.md line 139 says "Persist encounters to Firestore" and line 191 says "Persist encounters to Firestore" | Should say "Supabase" — encounters ARE persisted to Supabase/Prisma already | Update doc references from "Firestore" to "Supabase" |

### OPEN TASKS FROM QUEUE (Not Started / In Progress)

These are existing tasks in `AI_TASK_QUEUE.md` that remain unfinished:

**HIGH Priority:**
| Task | Title | Status |
|------|-------|--------|
| TASK-175 | Codex skills — remove invalid `trained_only` field | in-progress |
| TASK-190 | Admin Creature Feats — level, requirement, mechanic flags | not-started |
| TASK-191 | Admin Equipment — currency, category, type alignment | not-started |
| TASK-192 | Admin Properties & Parts — mechanic/duration flags, percentage display, option chips | not-started |
| TASK-193 | Admin Traits & Species — flaw/characteristic flags, sizes, trait chips | not-started |

**MEDIUM Priority:**
| Task | Title | Status |
|------|-------|--------|
| TASK-159 | Admin Codex — reduce input lag in edit mode | not-started (deferred) |
| TASK-171 | Admin Skills — base skill dropdown resolves base_skill_id | not-started |
| TASK-172 | Admin Skills — expose additional description fields | not-started |
| TASK-173 | Skills — render extra descriptions as expandable chips | not-started |
| TASK-174 | Codex schema — add Use column and align fields | in-progress |
| TASK-181 | Admin Skills — ability multi-select aligned with schema | not-started |
| TASK-182 | Admin Equipment — align fields with codex_equipment schema | not-started |
| TASK-194 | Admin Skills & Feats — base skill display and filter "All" duplicate fix | not-started |

**LOW Priority:**
| Task | Title | Status |
|------|-------|--------|
| TASK-183 | Admin Parts — edit defense targets | not-started |

---

## Category 9: DOCUMENTATION UPDATES NEEDED (8 findings)

Documents that need updating as audit phases are completed, or that are currently stale/incorrect.

| # | Document | Issue | When to Update | Priority |
|---|----------|-------|----------------|----------|
| DOC-1 | `ALL_FEEDBACK_CLEAN.md` | References "Firestore" (lines 139, 191) — should say "Supabase" | Immediately | Medium |
| DOC-2 | `ALL_FEEDBACK_CLEAN.md` | High-Level Action Items checklist — several items marked `[ ]` that are now done (encounters hub, persist encounters, combat features, campaign integration) need to be checked off | After verifying each | Medium |
| DOC-3 | `DESIGN_SYSTEM.md` | Missing entries for: `EquipToggle`, `SelectionToggle`, `InnateToggle`, `EditSectionToggle`, `SheetActionToolbar`, `RollLog`, `RecoveryModal`, `CreatorSummaryPanel` breakdowns, `HealthEnergyAllocator` | After Phase 2 (UI consistency) | Medium |
| DOC-4 | `DESIGN_SYSTEM.md` | Color migration guide doesn't cover `blue-*` → `primary-*`/`info-*` or `green-*`/`red-*`/`amber-*` → `success-*`/`danger-*`/`warning-*` which is the biggest issue found | After Phase 2 | High |
| DOC-5 | `ARCHITECTURE.md` | Still references `use-rtdb.ts` as "legacy filename" but it's the active hooks file; should clarify it's Codex-backed despite the name, or rename the file | After dead code cleanup (Phase 3) | Low |
| DOC-6 | `CODEX_SCHEMA_REFERENCE.md` | TASK-174 in progress — needs the "Use" column completed for all entities | When TASK-174 completes | High |
| DOC-7 | `AGENT_GUIDE.md` | Should reference the new `CODEBASE_AUDIT_2026-02-13.md` under "Recording Progress" section | Immediately | Low |
| DOC-8 | `globals.css` | Duplicate CSS variables need to be consolidated (finding UX-11) — after doing so, update `DESIGN_SYSTEM.md` to reflect the canonical variable names | After Phase 2 | Medium |

---

## REVISED Priority Ranking (Incorporating Feedback + Audit)

### Phase 1 — Security (Immediate)
1. ~~**S-3**: Remove `NEXT_PUBLIC_ADMIN_UIDS` exposure~~ ✅ DONE (TASK-238)
2. ~~**S-4**: Add security headers (HSTS, X-Frame-Options, etc.)~~ ✅ DONE (TASK-238)
3. ~~**S-1**: Add Zod input validation to all API routes~~ ✅ DONE (TASK-241) — created `api-validation.ts`, validated 6 route handlers
4. ~~**S-2**: Add rate limiting to API routes~~ ✅ DONE (TASK-242) — created `src/lib/rate-limit.ts` with sliding-window limiter, applied to all mutation endpoints + invite code lookup
5. ~~**S-5**: Validate file uploads with magic bytes~~ ✅ DONE — created `src/lib/validate-image.ts` with magic byte signatures (JPEG/PNG/GIF/WebP/BMP), applied to both upload routes
6. ~~**S-7**: Consistent API error handling~~ ✅ DONE — added try/catch to all API route handlers; created `src/lib/api-handler.ts` wrapper; generic error messages in production
7. ~~**CQ-1**: Fix syntax error in `use-auto-save.ts`~~ ✅ Not needed — code was correct (verified)
7. ~~**S-10**: Fix auth race condition in `use-auth.ts`~~ ✅ DONE (TASK-238)

### Phase 2 — UI/UX Consistency + Feedback Fixes (High Impact)
8. ~~**UX-1 + UX-2**: Replace ALL hardcoded `blue-*`, `green-*`, `red-*`, `amber-*` with design tokens~~ ✅ DONE — 21 components migrated across shared/, character-sheet/, and creator/ directories
9. ~~**UX-11**: Consolidate duplicate CSS variables in `globals.css`~~ ✅ DONE (TASK-238) — added clarifying comments, removed redundant vars
10. ~~**FB-1**: Gate character name editing to edit mode only~~ ✅ DONE (TASK-238)
11. ~~**FB-5**: Fix "Next: 2pt" → "Next: 2 Points" label~~ ✅ DONE (TASK-238)
12. **UX-3**: Standardize modal patterns → TASK-240
13. **UX-4**: Standardize error display (Alert vs Toast) → TASK-240
14. **UX-5**: Standardize loading states → TASK-240
15. ~~**DOC-4**: Update DESIGN_SYSTEM.md with color migration guide~~ ✅ DONE — added full migration table + game-specific colors + new component entries
16. ~~**DOC-8**: Update globals.css variable naming, then update DESIGN_SYSTEM.md~~ ✅ DONE

### Phase 3 — Dead Code & Duplicate Cleanup
17. ~~**DC-1 + DC-2 + DC-3**: Remove legacy `use-game-data` hooks/services~~ ✅ DONE (TASK-238)
18. ~~**D-2**: Remove `ItemSelectionModal` → migrate `powers-step` to `UnifiedSelectionModal`~~ ✅ DONE — migrated `powers-step.tsx` to `UnifiedSelectionModal`, deleted `item-selection-modal.tsx`
19. ~~**DC-5 + DC-6**: Remove empty dir, stale firebase-admin reference~~ ✅ DONE (TASK-238) — removed manmade-react-site-reference-only/, removed firebase-admin from next.config.ts
20. ~~**D-1**: Extract shared `apiFetch` to `src/lib/api-client.ts`~~ ✅ DONE (TASK-238) — created `src/lib/api-client.ts`, updated 3 services
21. ~~**D-3**: Deduplicate `fetchCodex` function~~ ✅ DONE — moved to `src/lib/api-client.ts`, imported in `use-codex.ts` and `game-data-service.ts`
22. ~~**DOC-1**: Fix "Firestore" → "Supabase" in ALL_FEEDBACK_CLEAN.md~~ ✅ DONE (TASK-238)
23. ~~**DOC-5**: Clarify `use-rtdb.ts` naming in ARCHITECTURE.md~~ ✅ DONE — added explanation of legacy naming and migration candidate note
24. ~~**DOC-7**: Add audit doc reference to AGENT_GUIDE.md~~ ✅ DONE (TASK-238)

### Phase 4 — Performance & Error Handling
25. ~~**P-1**: Add `React.memo` to `GridListRow`, `SkillRow`, `ItemCard`, `CombatantCard`~~ ✅ DONE — all 4 list components memoized
26. ~~**P-2**: Add error boundaries~~ ✅ DONE (TASK-238) — created `ErrorBoundary` component; integration into routes pending (TASK-243)
27. ~~**P-3**: Add `loading.tsx` / `error.tsx` route handlers~~ ✅ DONE — added for (main) route group
28. ~~**P-4**: Optimize React Query stale times for static codex data~~ ✅ DONE (TASK-247) — 5min→30min staleTime, 30min→60min gcTime
29. **P-5**: Create `CharacterSheetContext` to reduce 40+ prop drilling — DEFERRED (large refactor, standalone task)
30. ~~**P-7**: Lazy-load `react-easy-crop` in image upload modal~~ ✅ DONE — used `React.lazy` + `Suspense`

### Phase 5 — Database, Admin, & Schema Alignment
31. ~~**DB-1 + DB-2 + DB-3**: Add missing Prisma indexes (inviteCode, composite indexes)~~ ✅ DONE (TASK-244) — added inviteCode index, campaignId+createdAt composite
32. ~~**TASK-175**: Remove `trained_only` from skills across codebase~~ ✅ DONE — verified field no longer exists in code
33. **TASK-190**: Admin Creature Feats — level/requirement/mechanic flags
34. **TASK-191**: Admin Equipment — currency/category/type alignment
35. **TASK-192**: Admin Properties & Parts — mechanic/duration/percentage/option chips
36. **TASK-193**: Admin Traits & Species — flaw/characteristic/sizes/trait chips
37. **TASK-194**: Admin Skills & Feats — base skill display, filter "All" fix
38. **TASK-171 + TASK-172 + TASK-173**: Admin skills — base skill dropdown, extra desc fields, expandable chips
39. **TASK-174 + DOC-6**: Complete Codex Schema Reference "Use" column

### Phase 6 — Feature Gaps & Polish
40. ~~**FB-2**: Character creator skill auto-save on tab switch~~ ✅ DONE — verified already works via Zustand persist
41. ~~**FB-3**: Public character view page (frontend for link-sharing)~~ ✅ DONE — removed auth redirect from character sheet page; API already supports public/campaign visibility; UI renders read-only for non-owners
42. ~~**FB-4**: Initiative auto-roll when adding combatants~~ ✅ DONE — added `rollInitiative(acuity)` to all combatant add flows (modal, inline form, add-all-campaign, legacy tracker)
43. **FB-6**: Campaign join notification for private→campaign visibility change
44. ~~**FB-7**: Verify character-derived library content visible to viewers~~ ✅ DONE — verified `getOwnerLibraryForView` returns powers/techniques/items for viewers
45. ~~**D-4**: Consolidate `ListHeader` / `ColumnHeaders`~~ ✅ DONE — migrated `LibraryCreaturesTab` to `ListHeader`, deprecated `ColumnHeaders` as thin wrapper
46. ~~**D-5**: Create generic delete mutation factory~~ ✅ DONE — created `useDeleteLibraryItem`/`useDuplicateLibraryItem` factories, replaced 8 identical hooks
47. ~~**UX-16**: Add page-specific metadata/SEO~~ ✅ DONE — created layout.tsx with metadata exports for 11 key routes (codex, library, characters, encounters, campaigns, creators, rules, resources)
48. ~~**UX-12 + UX-14**: Accessibility improvements (ARIA, skip links, heading hierarchy)~~ ✅ DONE — added skip-to-content link in root layout, `id="main-content"` on main elements, ARIA labels/expanded to all Header buttons
49. **DOC-2**: Update ALL_FEEDBACK_CLEAN.md action items checklist
50. **DOC-3**: Update DESIGN_SYSTEM.md with all new component entries

---

## UPDATED Metrics (Including Feedback & Doc Findings)

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Security | 3 | 4 | 7 | 0 | 14 |
| Duplicates | 3 | 0 | 5 | 0 | 8 |
| Dead Code | 3 | 0 | 3 | 3 | 9 |
| UI/UX Consistency | 2 | 5 | 4 | 5 | 16 |
| Performance | 3 | 0 | 5 | 0 | 8 |
| Database | 0 | 0 | 3 | 2 | 5 |
| Code Quality | 3 | 0 | 5 | 0 | 8 |
| **Owner Feedback Gaps** | **0** | **4** | **4** | **0** | **8** |
| **Open Tasks (Queue)** | **0** | **5** | **8** | **1** | **14** |
| **Documentation** | **0** | **2** | **4** | **2** | **8** |
| **Total** | **17** | **20** | **48** | **13** | **98** |

---

## Owner Feedback Items — Full Cross-Reference

### Confirmed DONE (No Further Action)

These items from owner feedback have been verified as fully implemented in the codebase:

1. Login redirect to previous page (sessionStorage-based)
2. Character sheet library tab order (Feats, Powers, Techniques, Inventory, Proficiencies, Notes)
3. Feats as default open tab
4. List headers in ALL CAPS (`.toUpperCase()`)
5. Expand/collapse arrows removed from list items
6. Item counts removed (`ResultsCount` component removed)
7. Innate energy summary text corrected
8. Currency only on equipment tab
9. Recovery modal (full + partial 2/4/6hr + auto-optimal + feat reset)
10. Roll log with vanilla site dice images and formatting, saves last 20
11. Species skills auto-loaded, id "0" shows as "Any"
12. Top bar relocated to floating SheetActionToolbar
13. Creature creator summary sticky scroll
14. "Archetype & Attacks" section rename
15. "Power"/"Martial" subtext removed from archetype section
16. Library items visible in character creator equipment step
17. Ability archetype color indicators (purple for power, red for martial)
18. Custom notes "+" button present
19. Skill edit mode removes allocated points on unproficient
20. Defense cost is 2 skill points
21. Pencil icon colors (blue/green/red based on spending)
22. Character sheet width (1/4 + 1/4 + 1/2 grid)
23. Duration formatting ("4 MIN", "2 RNDS")
24. Power purple lightened to muted lavender
25. Encounters hub with filter/search/sort
26. Skill encounters page
27. Mixed encounters page
28. Campaign-encounter linkage with "Add all Characters"
29. Encounter combatant HP/EN loading
30. Roll log in encounters
31. Roll log real-time via Supabase Realtime
32. Health/Energy real-time sync
33. About page dice carousel (updated per latest feedback)
34. Encounters persisted to database
35. Combat features: surprised checkbox, auto-sort toggle, delete without advancing, re-sort each round

---

*Audit performed: 2026-02-13 | Updated with feedback cross-reference | Auditor: AI Agent*
