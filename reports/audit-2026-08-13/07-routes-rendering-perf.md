# Audit 07 — Routing / Rendering / Performance / SEO

**Date:** 2026-08-13
**Scope:** `src/app/**` (excluding `src/app/(main)/admin/**` and `src/app/api/**`), `src/components/{layout,landing,onboarding,about}/**`, `src/app/dev/**`, `next.config.ts`, `vercel.json`, `src/proxy.ts`, root metadata/SEO files.
**Method:** every in-scope file read in full. Row counts pulled live from Supabase (`pg_stat_user_tables`, read-only). Docs under `src/docs/**` were not treated as authority.
**Read-only:** this report is the only file written.

---

## 0. Headline numbers

| Measure | Value |
|---|---|
| Non-admin page routes | **36** |
| `"use client"` at the page root | **31 / 36 (86%)** |
| Server-rendered pages | **5 / 36 (14%)** — `/rules`, `/resources`, `/terms`, `/privacy`, and the `/` wrapper shell |
| Pages that fetch data on the server | **0** |
| `generateMetadata` in the repo | **0** |
| `generateStaticParams` in the repo | **0** |
| `notFound()` calls in the repo | **0** |
| `export const dynamic / revalidate / fetchCache` on any **page or non-admin layout** | **0** |
| `layout.tsx` files whose whole body is `return children`, existing only to carry `metadata` | **13** |
| Routes with **no** metadata at all (fall back to `RealmsRPG` + root description) | **8** — `/crafting`, `/crafting/[id]`, `/my-account`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/forgot-username` |
| `sitemap.ts` / `robots.ts` / `public/robots.txt` / `public/sitemap.xml` | **none exist** |
| `opengraph-image` / `twitter` / `metadataBase` / `alternates.canonical` | **none exist** |
| `next/dynamic` or `React.lazy` in the whole app | **1** (`src/components/shared/image-upload-modal.tsx:19`) |
| Raw `<img>` (not `next/image`) | **12** |
| `console.log` / `TODO` / `FIXME` under `src/app/**` (non-api) | **0** — clean |
| Largest client component trees pulled into single routes | `character-sheet` 13,227 LOC / 61 files; `guided-creator` 8,982 / 51; `character-creator` 8,746 / 55 |

**The single defining fact of this layer:** the app is a Next.js App Router shell wrapped around a client-side SPA. Zero routes do server data fetching, so the RSC/streaming/caching machinery of the framework is entirely unused, and every page — including the two top-of-funnel content pages (`/codex`, `/rules`) — ships an empty HTML shell to crawlers.

---

## 1. Per-route table

Legend — **RSC**: page module is a server component. **Client**: page module starts with `"use client"`. `dynamic?` column: all page routes are statically prerendered (no dynamic APIs anywhere); dynamic segments render on demand and enter the full route cache. `loading`/`error`: which file covers the route.

| Route | File | RSC or client | dynamic? | loading.tsx | error.tsx | auth-gated | metadata | Notable issues |
|---|---|---|---|---|---|---|---|---|
| `/` | `src/app/page.tsx` → `(main)/home-page.tsx` | **shell RSC → client subtree** | static | **✗ none** | root only | public | root default only | Renders `(main)/layout` **as a component**, so `(main)/loading.tsx` + `(main)/error.tsx` do not apply and chrome remounts on every nav off `/`. No OG/Twitter/canonical. |
| `/about` | `(main)/about/page.tsx` | client | static | ✓ (main) | ✓ (main) | public | ✓ layout | `"use client"` pulls 10 server-capable landing modules into the client bundle. Carousel renders 1 of N slides → rest unindexable. |
| `/campaigns` | `(main)/campaigns/page.tsx` | client | static | ✓ | ✓ | guest-soft (inline gate) | ✓ layout | — |
| `/campaigns/[id]` | `.../[id]/page.tsx` | client | static shell | ✓ | ✓ | **edge-gated** (`proxy.ts`) + `ProtectedRoute` | inherits `Campaigns` | Bad ID → inline `Alert`, HTTP 200 (soft 404). |
| `/campaigns/[id]/view/[userId]/[characterId]` | `.../page.tsx` | client | static shell | ✓ | ✓ | **edge-gated** | inherits `Campaigns` | **14 unconditional client queries** on mount (lines 74–97). |
| `/characters` | `(main)/characters/page.tsx` | client | static | ✓ | ✓ | guest-soft | ✓ layout | Unbounded grid (no pagination). |
| `/characters/[id]` | `.../[id]/page.tsx` | client | static shell | ✓ | ✓ | **not gated** (visibility-based, API-enforced) | inherits `Characters` | Every character sheet has the identical title `Characters \| RealmsRPG`. Bad ID → soft 404. |
| `/characters/new` | `.../new/page.tsx` | client | static | ✓ | ✓ | public | inherits `Characters` | Chooser is static content; client only to read `?returnTo`. |
| `/characters/new/guided` | `.../new/guided/page.tsx` | client | static | ✓ | ✓ | public | inherits `Characters` | **Primary conversion funnel.** All 10 step components imported eagerly (`guided-creator-shell.tsx:22-33`). Chrome suppression decided client-side via `usePathname`. |
| `/characters/new/advanced` | `.../new/advanced/page.tsx` | client | static | ✓ | ✓ | public | inherits `Characters` | Legacy creator being phased out; 9 steps eager. Imports `'../../../../../../public/tooltip-text'` (6 levels up, into `public/`). |
| `/codex` | `(main)/codex/page.tsx` | client | static | ✓ | ✓ | public | ✓ layout | **Top-of-funnel page with zero indexable content.** 809 feats / 420 parts / 210 traits rendered unvirtualized. |
| `/crafting` | `(main)/crafting/page.tsx` | client | static | ✓ | ✓ | guest-soft | **✗ none** | No `crafting/layout.tsx` → title `RealmsRPG`. |
| `/crafting/[id]` | `.../[id]/page.tsx` | client | static shell | ✓ | ✓ | not gated | **✗ none** | Soft 404 on bad ID. |
| `/creature-creator` | `(main)/creature-creator/page.tsx` | client | static | ✓ | ✓ | guest-soft | ✓ layout | 4 `UnifiedSelectionModal` instances always mounted in the tree. |
| `/empowered-technique-creator` | `.../page.tsx` | client | static | ✓ | ✓ | guest-soft | ✓ layout | — |
| `/encounters` | `(main)/encounters/page.tsx` | client | static | ✓ | ✓ | guest-soft (localStorage) | ✓ layout | — |
| `/encounters/[id]` | `.../[id]/page.tsx` | client | static shell | ✓ | ✓ | not gated | inherits `Encounters` | Client-side redirect page: fetches the encounter just to read `.type`, then `router.replace`. Should be a server redirect or a rewrite. |
| `/encounters/[id]/combat` | `.../combat/page.tsx` | client | static shell | ✓ | ✓ | not gated | inherits `Encounters` | ~110 lines duplicated 3× (see §6). |
| `/encounters/[id]/skill` | `.../skill/page.tsx` | client | static shell | ✓ | ✓ | not gated | inherits `Encounters` | same |
| `/encounters/[id]/mixed` | `.../mixed/page.tsx` | client | static shell | ✓ | ✓ | not gated | inherits `Encounters` | same |
| `/item-creator` | `(main)/item-creator/page.tsx` | client | static | ✓ | ✓ | guest-soft | ✓ layout | — |
| `/library` | `(main)/library/page.tsx` | client | static | ✓ | ✓ | guest-soft | ✓ layout | **5–6 parallel collection fetches** just to compute tab counts. Metadata describes only "My Library" but the default view for guests is the public Realms Library. |
| `/my-account` | `(main)/my-account/page.tsx` | client | static shell | ✓ | ✓ | **edge-gated** + `ProtectedRoute` | **✗ none** | — |
| `/power-creator` | `(main)/power-creator/page.tsx` | client | static | ✓ | ✓ | guest-soft | ✓ layout | — |
| `/privacy` | `(main)/privacy/page.tsx` | **RSC** | static | ✓ | ✓ | public | ✓ page | Clean. |
| `/resources` | `(main)/resources/page.tsx` | **RSC** | static | ✓ | ✓ | public | ✓ layout | Clean. |
| `/rules` | `(main)/rules/page.tsx` | **RSC** | static | ✓ | ✓ | public | ✓ layout | **The core rulebook is a Google Docs `<iframe>`.** Zero crawlable rules text. |
| `/species-creator` | `(main)/species-creator/page.tsx` | client | static | ✓ | ✓ | guest-soft | ✓ layout | — |
| `/technique-creator` | `(main)/technique-creator/page.tsx` | client | static | ✓ | ✓ | guest-soft | ✓ layout | — |
| `/terms` | `(main)/terms/page.tsx` | **RSC** | static | ✓ | ✓ | public | ✓ page | Clean. |
| `/login` | `(auth)/login/page.tsx` | client | static | **✗** | **✗ (root only)** | public | **✗ none** | Indexable. `(auth)` group has no `loading.tsx`/`error.tsx`; an error falls to root `error.tsx`, which renders the *app* Header/Footer, not the auth shell. |
| `/register` | `(auth)/register/page.tsx` | client | static | **✗** | **✗** | public | **✗ none** | same |
| `/forgot-password` | `(auth)/forgot-password/page.tsx` | client | static | **✗** | **✗** | public | **✗ none** | same |
| `/reset-password` | `(auth)/reset-password/page.tsx` | client | static | **✗** | **✗** | token-in-session | **✗ none** | Indexable; should be `noindex`. |
| `/forgot-username` | `(auth)/forgot-username/page.tsx` | client | static | **✗** | **✗** | public | **✗ none** | **DEAD ROUTE** — nothing in the app links to it. Its server action is also unused. |
| `/dev/styleguide` | `src/app/dev/styleguide/page.tsx` | client (843 lines) | static | ✗ | root only | **public** | ✓ layout (title only) | **Ships to production and is crawlable.** No `robots: noindex`, no env gate. |

### Worst rows

1. `/rules` — the highest-intent SEO page in the product is an iframe. `src/app/(main)/rules/page.tsx:28`.
2. `/codex` — 809 feats, unvirtualized, entirely client-rendered, zero indexable content. `src/app/(main)/codex/page.tsx:10`.
3. `/` — root route bypasses its own route group's `loading.tsx`/`error.tsx` and remounts all chrome on navigation. `src/app/page.tsx:6-14`.
4. `/campaigns/[id]/view/[userId]/[characterId]` — 14 client queries fired on mount. `src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx:74-97`.
5. `/dev/styleguide` — dev surface indexable in production. `src/app/dev/styleguide/layout.tsx:3`.
6. `/crafting` + `/crafting/[id]` + `/my-account` — no metadata whatsoever.

---

## 2. P0 — private data cacheable / crash / broken auth gate

**No P0 findings.** I looked specifically for each P0 class and can rule them out:

- **Private data in cacheable output:** no page performs server data fetching, so every prerendered shell is user-agnostic. `/my-account`, `/characters/[id]`, `/campaigns/*` all hydrate their data client-side after mount. Nothing user-specific is baked into HTML or the RSC payload.
- **Broken auth gate:** `src/proxy.ts:35-49` runs `updateSession` on all page routes, and `src/lib/supabase/middleware.ts:27-32,93-99` hard-redirects unauthenticated requests for `/my-account*` and `/campaigns/*` to `/login?returnTo=…` **at the edge**, before any content is sent. `ProtectedRoute` remains as defense in depth. This is correct.
- **White screen:** the boundary chain is complete for every route — `src/app/global-error.tsx`, `src/app/error.tsx`, `src/app/(main)/error.tsx`, plus a class boundary at `src/components/layout/main-content-boundary.tsx:7`.

---

## 3. P1 findings

### P1-1 — No `sitemap`, no `robots`, no canonical, no `metadataBase`, no Open Graph or Twitter cards
`src/app/layout.tsx:42-61` — root metadata declares `title`, `description`, `keywords`, `authors`, `icons`, `manifest` and stops there.
There is no `src/app/sitemap.ts`, no `src/app/robots.ts`, no `public/robots.txt`, no `public/sitemap.xml`, no `opengraph-image`, and no `metadataBase`. `SITE_URL` already exists at `src/lib/constants/copy/shared-copy.ts:13` (`https://realmsroleplaygame.com`) and is used only by the privacy page.

**Why it matters:** for a startup this is the whole top of the funnel. Without `metadataBase`, every relative OG/canonical URL Next generates is unresolvable, so no OG image and no canonical is emitted at all — every Discord, Reddit, and X share of a Realms link renders as a bare grey box, which is the primary organic-growth channel for a TTRPG product. Without robots/sitemap, crawlers discover only what the nav links and get no crawl priority, and `/dev/styleguide`, `/login`, `/register`, `/reset-password`, and the dead `/forgot-username` are all fair game for indexing.

**Fix:** in `src/app/layout.tsx` add `metadataBase: new URL(SITE_URL)`, an `openGraph` block (`type: 'website'`, `siteName: 'RealmsRPG'`, `url`, `images`), and `twitter: { card: 'summary_large_image' }`. Add `src/app/opengraph-image.tsx` (a static 1200×630 built from `LogoFull.png`). Add `src/app/robots.ts` disallowing `/dev/`, `/my-account`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/api/`, and pointing at the sitemap. Add `src/app/sitemap.ts` listing the public routes.

### P1-2 — `/rules`: the core rulebook is a Google Docs iframe, so the product's most valuable SEO asset has zero crawlable text
`src/app/(main)/rules/page.tsx:27-37`.
The page itself is a clean server component with correct metadata (`rules/layout.tsx:4-7`), but the entire body is `<iframe src={RULES_COPY.embedUrl}>`. Cross-origin iframe content is never attributed to the host page by search engines.

**Why it matters:** "how do <system> skill rolls work", "<system> character creation rules" queries are exactly how a new TTRPG acquires players. Today those queries can never land on `realmsroleplaygame.com`. This is the single highest-leverage SEO gap in the product. It also breaks in-app search, deep links to a specific rule, and mobile reading (the iframe is pinned to `min(900px, calc(100vh - 220px))`, so on a 360×800 viewport the reader gets a ~580px scroll-within-scroll).

**Fix:** migrate the rulebook into MDX or `core_rules` rows (the table already exists, 14 rows) and render it as server components at `/rules/[slug]` with `generateStaticParams` + `generateMetadata` + `Article`/`FAQPage` structured data. Keep the Google Doc link as "view source doc". This is the one change most likely to move organic traffic.

### P1-3 — `/codex` renders 809+ rows client-side with no pagination or virtualization, and is invisible to crawlers
`src/app/(main)/codex/page.tsx:10` (`"use client"`), `src/app/(main)/codex/CodexFeatsTab.tsx:263-270` (`featFamilies.map` — every match rendered).
Live row counts: `codex_feats` **809**, `codex_parts` **420**, `codex_traits` **210**, `codex_creature_feats` **97**, `codex_properties` 53, `codex_skills` 50. Each `CodexFeatRow` carries expandable chips and detail sections, so a default unfiltered Feats tab mounts on the order of ten thousand DOM nodes.

Compounding it: every codex hook shares one query key and one payload. `src/hooks/use-codex.ts:39-64` — `useCodexFeats`, `useCodexSkills`, `useCodexSpecies` (and siblings) all call `fetchCodex` on key `['codex']` and then `select` a slice. `src/lib/api-client.ts:96-98` sets `cache: 'no-store'`. So opening the Feats tab downloads **the entire codex** (feats + skills + species + equipment + parts + properties + traits + archetypes; ~1.3 MB of underlying table data before JSON overhead) with no HTTP caching, on a route with no server rendering.

**Why it matters:** slow first paint and a janky, unusable list on mid-range mobile at exactly the moment a curious visitor is evaluating the system. And because the page is 100% CSR, none of that content is indexable — the same content problem as `/rules`.

**Fix (three separable steps):**
1. Split `/api/codex` per collection and give each hook its own query key so a tab fetches only its own rows; drop `cache: 'no-store'` in favour of `next: { revalidate }` (codex data changes rarely).
2. Paginate or virtualize `CodexBrowseListShell` — feats already exceed 800 rows at 32 users.
3. Add server-rendered detail routes (`/codex/feats/[slug]` etc.) with `generateStaticParams` + `generateMetadata`. That turns 800+ rows of reference content into 800+ indexable pages — the classic wiki/D&D-Beyond long-tail play.

### P1-4 — Root route `/` opts itself out of its route group's error and loading boundaries, and remounts all chrome on every navigation
`src/app/page.tsx:6-14`:
```tsx
import MainLayout from './(main)/layout';
import HomePage from './(main)/home-page';
export default function RootPage() {
  return <MainLayout><HomePage /></MainLayout>;
}
```
`(main)/layout.tsx` is imported as an ordinary component, not used as a route layout. Consequences: (a) `src/app/(main)/loading.tsx` and `src/app/(main)/error.tsx` do not apply to `/` — it falls back to the root `error.tsx`; (b) because `MainAppChrome` is instantiated inside `page.tsx` for `/` but inside `layout.tsx` for every `(main)` route, React unmounts and remounts the entire chrome (Header, Footer, nav state, `MainContentBoundary`) on `/ → /codex`, i.e. on the app's most common navigation; (c) if `(main)/layout.tsx` ever gains a server data read, `/` silently diverges.

The file comment blames "duplicate route / Vercel manifest issues", but a route group adds no URL segment, so `src/app/(main)/page.tsx` **is** `/`. No other group defines a root `page.tsx`, so there is no conflict.

**Fix:** delete `src/app/page.tsx`; rename `src/app/(main)/home-page.tsx` → `src/app/(main)/page.tsx`.

### P1-5 — 86% of routes are client components, so RSC, streaming, and route-level caching are entirely unused
31 of 36 page modules start with `"use client"`. The `"use client"` marker sits at the **top of the tree** on every one of them, not at leaves.

The clearest measurable instance: `src/app/(main)/home-page.tsx:16` declares `"use client"` only to read `?code` from `useSearchParams` for an OAuth fallback. `src/components/landing/` has 12 modules and only **2** carry `"use client"` (`hero-section.tsx`, `creator-funnel-hero.tsx`). The other 10 — `uniqueness-section`, `how-it-works-section`, `secondary-discovery-section`, `community-section`, `landing-art-frame`, `landing-dice-decor`, `landing-gradient-backdrop`, `marketing-button` — are pure markup, and all of them are dragged into the client bundle by that one directive on the landing page.

The OAuth fallback that forces this is already handled server-side and earlier: `src/proxy.ts:21-33` (`redirectOAuthCodeToCallback`) redirects `/?code=…` to `/auth/callback` at the edge before the page renders. The client copy in `home-page.tsx:34-51` is dead weight in practice.

Same pattern on `/about`: `src/app/(main)/about/page.tsx:7` is `"use client"`, but only `AboutCarouselSection` needs interactivity — the hero, the creator note, and all CTAs are static.

**Why it matters:** the landing page is the highest-traffic route. Making it a server component removes the landing bundle from the critical path, lets the H1 and copy render in the first byte, and eliminates the returning-user content swap (see P2-2).

**Fix:** delete the `"use client"` + `useSearchParams` block from `home-page.tsx` and rely on the proxy redirect; keep `HeroSection` as the only client island. Do the same on `/about` (`"use client"` moves to `AboutCarouselSection`, which already has it) and on `/characters/new` (make the chooser a server component and read `returnTo` from `searchParams` props).

### P1-6 — `/dev/styleguide` ships to production, crawlable, with no gate
`src/app/dev/styleguide/page.tsx` (843 lines, `"use client"`), `src/app/dev/styleguide/layout.tsx:3-5`.
No `NODE_ENV` guard, no `robots` metadata, and with no `robots.txt` (P1-1) it is fully crawlable. It is a legitimate visual-regression target (`tests/visual/targets.ts:21`) and Playwright runs against a production build, so deleting it or `notFound()`-ing it in production would break `verify:visual` and `verify:a11y`.

**Fix:** keep the route, add `robots: { index: false, follow: false }` to `src/app/dev/styleguide/layout.tsx` metadata and `Disallow: /dev/` in the new `robots.ts`. Do **not** delete.

### P1-7 — Every dynamic route soft-404s; `notFound()` is never called and params are never validated
`notFound()` appears **zero** times in `src/`. Bad or non-existent IDs render HTTP 200 with an inline message:
- `src/app/(main)/characters/[id]/page.tsx:45-61` — "Character not found"
- `src/app/(main)/campaigns/[id]/page.tsx:47-58` — "Campaign not found"
- `src/app/(main)/encounters/[id]/page.tsx:38-52`, `.../combat/page.tsx:82-96`, `.../skill/page.tsx:125-139`, `.../mixed/page.tsx:115-129`
- `src/app/(main)/crafting/[id]/page.tsx:31-37`

No route validates that `[id]` is a UUID before handing it to the API (`use(params)` / `useParams()` straight through).

**Why it matters:** search engines index these 200s as real pages, uptime monitoring can't distinguish "gone" from "fine", and the shared `src/app/not-found.tsx` is effectively unreachable for the four resource types users actually link to. Unvalidated params also mean arbitrary strings reach the API layer.

**Fix:** validate the param shape in the page and call `notFound()` on a malformed ID; for the "loaded but 404 from API" case, either render `not-found.tsx` via `notFound()` from a small server wrapper or return a real 404 status. At minimum add a Zod/regex UUID guard per dynamic segment.

---

## 4. P2 findings

### P2-1 — 13 layouts exist purely as metadata carriers because the page is a client component
`(main)/{about,campaigns,characters,codex,creature-creator,empowered-technique-creator,encounters,item-creator,library,power-creator,resources,rules,species-creator,technique-creator}/layout.tsx` (14 layout files, 13 of them a literal `return children`). Example, `src/app/(main)/codex/layout.tsx:8-10`:
```tsx
export default function CodexLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```
This is the standard workaround, but it has a real cost: metadata is now decoupled from the page and **inherits down**, which is why `/characters/[id]`, `/characters/new`, `/characters/new/guided`, and `/characters/new/advanced` all share the single title `Characters | RealmsRPG`, and `/encounters/[id]/{combat,skill,mixed}` all share `Encounters`. And where a creator has no layout, metadata is simply absent (`/crafting`, `/crafting/[id]`, `/my-account`).

**Fix:** as pages move to server components (P1-5), fold `metadata` back into `page.tsx` and delete the shim layouts. For routes that stay client, at least add the three missing ones and give the dynamic routes real `generateMetadata` in a thin server wrapper.

### P2-2 — Landing H1 depends on client auth state (content swap above the fold)
`src/components/landing/hero-section.tsx:20-23,76-112` — `HeroSection` calls `useAuth()` and `useCharacters()`, then branches the `<h1>`, subline, and CTA on `isReturning`. Server output is always the guest variant; signed-in users with characters see it replaced after hydration + a `/api/characters` round trip.

**Why it matters:** the H1 and primary CTA are the LCP candidates on the most-visited page; swapping them post-hydration is a direct CLS/LCP regression for the returning-user cohort.

**Fix:** render the guest hero as static server markup and mount the returning-user variant as a small client island below/over it, or read the session in the proxy and pass a hint via header/cookie so the correct variant renders server-side.

### P2-3 — 794 KB + 560 KB logo PNGs, both `priority`, no `sizes`
`public/images/LogoFull.png` = **794.7 KB**, `public/images/LogoFullGrey.png` = **559.6 KB**.
Both are rendered together with `priority` and no `sizes`:
- `src/components/landing/hero-section.tsx:56-73` (light `dark:hidden` + dark `hidden dark:block`)
- `src/app/(auth)/layout.tsx:41-56` (same pair, both `priority`)

`priority` emits `<link rel="preload">`, and `hidden` does not cancel a preload — so both variants are fetched above the fold on `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, and half of that is never painted. With no `sizes`, `next/image` falls back to `100vw`, so a component that renders at ≤520 CSS px on desktop requests a viewport-width candidate.
By contrast `src/components/landing/landing-art-frame.tsx:92,129` gets this right (`sizes="(max-width: 768px) 33vw, 200px"`), which is the pattern to copy. `public/images/Shroom-Shot.png` is **1.53 MB** (`landing-art-frame.tsx:126`) — optimized by `next/image` in transit, but worth re-exporting.

**Fix:** add `sizes="(max-width: 640px) 78vw, 520px"` to both logo `Image`s; keep `priority` on only the variant matching the resolved theme (or drop to a single theme-agnostic asset with a CSS filter); re-export the source PNGs at the size actually used and convert to WebP/AVIF at rest.

### P2-4 — Encounter pages: ~110 lines of identical boilerplate duplicated 3×
`src/app/(main)/encounters/[id]/combat/page.tsx` (152 lines), `.../skill/page.tsx` (195), `.../mixed/page.tsx` (219). All three repeat, verbatim: `use(params)` → `useEncounter` → `useSaveEncounter` → `useCampaignsFull` → the `initializedEncounterId` render-adjust → the identical `useAutoSave({ delay: 1500, onSaveError })` block → the identical loading / "Encounter not found" / "Initializing…" branches → `handleCommitName` / `handleCancelEditName`. Compare `combat/page.tsx:37-119` with `skill/page.tsx:80-162` and `mixed/page.tsx:69-152` — they differ only in the `prepare*` transform and which view is rendered.

**Fix:** extract `useEncounterPage(encounterId, prepare?)` returning `{ encounter, setEncounter, isSaving, hasUnsavedChanges, nameEditing }` plus a shared `<EncounterPageFrame>` for the three status branches. Removes ~250 duplicated lines across the three routes.

### P2-5 — `/library` fetches 5–6 whole collections to render one tab
`src/app/(main)/library/page.tsx:110-129` — six `useUser*` queries plus five `useOfficialLibrary` queries plus `useEnhancedItems`. They're gated by `enabled` per mode, but within a mode all five collections load unconditionally so that `myCounts` / `publicCounts` (lines 131-151) can put a number on every tab. Only one tab's rows are ever displayed.
Same shape at `src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx:74-97` — 14 queries on mount (user powers, techniques, empowered, items, traits, power parts, technique parts, item properties, equipment, 3 official libraries, species, skills, feats, archetypes) before the sheet can render.

**Fix:** expose a counts endpoint (or `select` a count from a single call) and fetch row data lazily per active tab. For the campaign sheet view, have the existing `/api/campaigns/.../characters/...` response carry the enrichment tables it already knows the character needs, instead of the client rebuilding the whole codex.

### P2-6 — 12 raw `<img>` on paths that render user-supplied Supabase Storage URLs
`src/components/shared/list-row-thumbnail.tsx:37`, `src/components/shared/expandable-image.tsx:45`, `src/components/shared/realms-image-picker.tsx:95,370,460`, `src/components/shared/image-upload-modal.tsx:335`, `src/components/shared/creature-stat-block-panels.tsx:131`, `src/components/character-creator/creator-portrait-upload.tsx:155,216`, `src/components/character-creator/steps/finalize-step.tsx:286`, `src/app/(main)/my-account/_components/account-profile-card.tsx:41`, `src/app/(main)/campaigns/[id]/_components/character-chip.tsx:43`.
`next.config.ts:5-13` already whitelists `*.supabase.co/storage/v1/object/public/**`, so the optimizer is configured — these paths just bypass it. `ListRowThumbnail` is the important one: it is the 44×44 thumbnail in *every* codex/library/selection row, so a list of 800 feats can request 800 unresized originals. It does set `loading="lazy"` + `decoding="async"`, which limits the damage but doesn't remove it.

**Fix:** convert `ListRowThumbnail` and `ExpandableImage` to `next/image` with `fill` + `sizes="44px"` (and a real `sizes` for the modal). Blob-preview `<img>`s (upload/crop flows) are legitimately raw — leave those, and add a comment saying why.

### P2-7 — `public/tooltip-text.tsx`: a 510-line / 22 KB TSX source file in `public/`, imported from ~30 files by 3–6-level relative paths
Examples: `src/app/(main)/characters/new/advanced/page.tsx:29` (`'../../../../../../public/tooltip-text'`), `src/components/layout/header.tsx:16`, `src/app/(main)/campaigns/page.tsx:37`, `src/components/character-creator/steps/ancestry/ancestry-mixed-panel.tsx:13`, and ~26 more.
Because it lives in `public/`, Next also serves it verbatim at `https://<site>/tooltip-text.tsx` — the raw TypeScript source of the app's help copy is a downloadable static asset. It's product copy, not a secret, so this is not a security finding; it is wrong on structure, discoverability, and refactor safety (a `public/` move breaks 30 import paths with no `@/` alias to protect them).

**Fix:** move to `src/lib/constants/copy/tooltip-text.tsx`, re-export from `src/lib/constants/site-copy.ts`, and change all imports to `@/lib/constants/site-copy`. The "owner-editable single file" property is preserved. Update `src/docs/ai/guide/04-floating-ui-tooltips.md` after.

### P2-8 — Chrome variation is a client-side pathname branch instead of a route group
`src/components/layout/main-app-chrome.tsx:1,10-23` — `MainAppChrome` is `"use client"` solely so `usePathname()` can feed `isMinimalChromeRoute` (`src/lib/routes/funnel-chrome.ts:5`), which today matches exactly one prefix: `/characters/new/guided`. That single decision forces the entire app shell (Header, Footer, `MainContentBoundary`) to be a client component on every `(main)` route.

**Fix:** move the guided creator into its own route group (e.g. `src/app/(funnel)/characters/new/guided/`) with a minimal-chrome `layout.tsx`, and make `(main)/layout.tsx` a plain server layout. Deletes `funnel-chrome.ts` and takes the shell off the client.

### P2-9 — Only one lazy import in the entire app; heavy modals and creator steps all load eagerly
`src/components/shared/image-upload-modal.tsx:19` is the sole `lazy()`. Meanwhile:
- `src/components/guided-creator/guided-creator-shell.tsx:22-33` imports all 10 guided steps statically; `guided-creator/` is 8,982 LOC across 51 files, all on the critical path of the primary funnel.
- `src/app/(main)/characters/new/advanced/page.tsx:17-41` imports all 9 legacy wizard steps.
- `src/app/(main)/characters/[id]/page.tsx` pulls the whole `character-sheet/` tree (13,227 LOC / 61 files) plus `CharacterSheetModals`, `SheetTour`, `SheetTourOfferModal`, `LevelUpGuideCard`, `RollLog`.
- `src/app/(main)/creature-creator/page.tsx:213-326` keeps 4 `UnifiedSelectionModal` instances mounted in the tree.

**Fix:** `next/dynamic` the step components behind `STEP_COMPONENTS` maps (both creators), the character-sheet modal bundle, and the selection modals. Steps are perfectly shaped for it — one is visible at a time and the map is already keyed.

### P2-10 — `(auth)` route group has no `loading.tsx` and no `error.tsx`
An error in `/login` or `/register` escapes to `src/app/error.tsx`, which renders `<Header />` + `<Footer />` (root `error.tsx:26-57`) — the wrong chrome for the auth gradient shell, and a jarring visual break at the moment a user is trying to sign in.

**Fix:** add `src/app/(auth)/error.tsx` reusing `AuthCard` for the fallback, and `src/app/(auth)/loading.tsx` matching the existing `Spinner` fallbacks already inlined at `login/page.tsx:234-240`.

### P2-11 — `/encounters/[id]` is a client-side data fetch used only to compute a redirect
`src/app/(main)/encounters/[id]/page.tsx:19-58` — loads the full encounter client-side, reads `encounter.type`, then `router.replace(`/encounters/${id}/${type}`)`. That's a full JS boot + API round trip + spinner before the real page even starts loading.

**Fix:** either make it a server component that fetches the type and calls `redirect()`, or drop the type segment from the URL entirely and have one `/encounters/[id]` page switch on `encounter.type` (which is what `mixed` already does internally).

### P2-12 — `MainContentBoundary` is a second, redundant error system
`src/components/layout/main-content-boundary.tsx:7` wraps `(main)` children in the class `ErrorBoundary` (`src/components/shared/error-boundary.tsx:32`). Next inserts the `(main)/error.tsx` boundary *inside* the layout's `children`, so `error.tsx` always catches page errors first and this outer boundary only ever fires for errors in the chrome or in `error.tsx` itself. Two parallel error UIs with different fallbacks (the class one renders `<h3>` and offers no Home link) for one job.

**Fix:** keep `error.tsx` as the route-level boundary; keep `ErrorBoundary` only for genuine intra-page section isolation (sheet panels, etc.) and drop it from the layout, or document explicitly that it exists to catch chrome failures.

---

## 5. P3 findings

- **`not-found.tsx` freezes the copyright year at build time.** `src/app/not-found.tsx` is a server component rendering `<Footer />`, and `src/components/layout/footer.tsx:127` computes `new Date().getFullYear()` at render. Because the 404 page is prerendered, the year is baked in and goes stale after New Year until the next deploy. (On `(main)` routes the Footer is client-rendered via `MainAppChrome`, so they're unaffected.) Fix: pass the year in, or compute it in a tiny client span.
- **Dead route + dead server action:** `src/app/(auth)/forgot-username/page.tsx` is linked from nowhere (only `src/lib/safe-redirect.ts:1` lists the path), and `src/app/(auth)/forgot-username/action.ts:12` (`submitForgotUsernameAction`) has zero callers. Either link it from `/login` next to "Forgot password?" or delete both.
- **create-next-app leftovers still shipping:** `public/{file,globe,next,vercel,window}.svg` are unreferenced.
- **`/library` metadata is wrong for its default view.** `src/app/(main)/library/layout.tsx:5` describes "your personal collection", but guests (and `?view=realms`) land on the public Realms Library.
- **Landing `#how-it-works` anchor with `scroll-mt-20`** (`how-it-works-section.tsx:19`) assumes the 80px header; the header is `h-20` sticky (`header.tsx:94`) so this is currently correct but silently couples two files. Worth a shared token.
- **`build` opts out of Turbopack:** `package.json:14` — `next build --webpack`. Fine if deliberate, but it forgoes Next 16 build-time improvements; worth a comment saying why.
- **CSP allows `'unsafe-inline'` and `'unsafe-eval'` in `script-src`** (`next.config.ts:48`). Flagging only as a cross-reference for the security auditor — `'unsafe-eval'` in particular should not be needed by a production Next build.
- **`ErrorBoundary` fallback uses `<h3>`** (`error-boundary.tsx:57`) with no `h2` above it, so a page using it skips a heading level.

---

## 6. Rendering, caching, and streaming — assessment

Every page route is statically prerendered. That sounds good and is mostly incidental: no page reads `cookies()`, `headers()`, or `searchParams` on the server, so nothing opts into dynamic rendering. `src/proxy.ts` runs on all page routes but returns `NextResponse.next()`, which does not make pages dynamic.

The corollary is that all the caching knobs are moot. `export const dynamic/revalidate/fetchCache` appear only in `src/app/api/**` and `src/app/(main)/admin/layout.tsx:11` — never on a page in scope. There is no ISR, no `revalidateTag`, no `use cache`. All freshness is TanStack Query on the client (`staleTime: 5 min` in `src/hooks/use-codex.ts:13-19`, and `cache: 'no-store'` on the codex fetch at `src/lib/api-client.ts:97`).

**Suspense / streaming:** there are 11 in-page `<Suspense>` boundaries (`home-page.tsx:66`, `campaigns/page.tsx:83`, `encounters/page.tsx:78`, `crafting/page.tsx:56`, `characters/new/guided/page.tsx:69`, `login/page.tsx:233`, `register/page.tsx:281`, `power-creator/page.tsx:259`, `technique-creator/page.tsx:244`, `item-creator/page.tsx:297`, `creature-creator/page.tsx:375`). Every one of them exists to satisfy the `useSearchParams` static-rendering requirement. **None** streams server data. There is no route in the app where a slow server fetch is streamed behind a Suspense fallback, because there are no server fetches.

**`loading.tsx` coverage:** one file, `src/app/(main)/loading.tsx`, covering the `(main)` group — but since no page awaits anything on the server, it only appears briefly during navigation to a non-prefetched route. It does not cover `/` (P1-4), `(auth)`, or `/dev`.

**Error boundary coverage:** complete (see §2), with the caveats in P2-10 and P2-12.

---

## 7. Auth-gated UX

| Route | Enforcement | Result |
|---|---|---|
| `/my-account`, `/my-account/*` | Edge redirect, `src/lib/supabase/middleware.ts:28` | Correct — no protected markup sent |
| `/campaigns/*` (detail + view) | Edge redirect, `middleware.ts:30` | Correct |
| `/characters/[id]` | None at the route; API enforces `visibility` | Intentional (shareable sheets), but see P1-7 |
| `/crafting/[id]`, `/encounters/[id]/*` | None; API enforces ownership | Guest-soft by design (`crafting/page.tsx:143`, `encounters/page.tsx:188` show "sign in to save" banners) |
| `/characters`, `/library`, `/codex`, `/campaigns` (list), all creators | Guest-soft, inline sign-in prompt | Intentional, per `middleware.ts:22-25` |

This is a genuinely good design: hard gates at the edge for the two truly-private surfaces, guest-soft everywhere else so the funnel stays open, `ProtectedRoute` as defense in depth (`src/components/layout/protected-route.tsx:19`).

The cost is a **flash of loading state on every gated or guest-soft page**, because auth resolves client-side after hydration. `characters/page.tsx:80-97` renders a 3-card skeleton until `authInitialized`; `library/page.tsx:208-215` shows "Loading library…"; `campaigns/page.tsx:55-61`, `characters/[id]/page.tsx:37-43`, and every creator do the same. The proxy already resolves the user at the edge (`middleware.ts:74`) — forwarding a boolean hint (header or non-sensitive cookie) into a server component would let these pages render the right shell in the first byte and remove the spinner entirely.

---

## 8. Mobile / a11y at page level

**Good:** skip link present and correct (`src/app/layout.tsx:82-87` → `#main-content` on `main-app-chrome.tsx:18,28`, plus `(auth)/layout.tsx:32`, `error.tsx:28`, `not-found.tsx:14`, `global-error.tsx:28`, `dev/styleguide/page.tsx:244`). Every route has exactly one `h1` (`PageHeader` → `page-header.tsx:66`; landing → `hero-section.tsx:78,101`; creators/guided → `creator-funnel-hero.tsx:77`; auth → `auth-card.tsx:28`; sheet → `sheet-header-identity.tsx:200`). Codex tabs add `<h2 class="sr-only">` per tab (`CodexFeatsTab.tsx:128`), which is the right call for tabbed content. Visual/a11y suites already test 360px (`tests/visual/targets.ts:6`).

**Gaps:**
- **No focus management on route change.** No `template.tsx`, no focus-reset on navigation. After a client-side nav, focus stays on the activated link, so a screen-reader or keyboard user is silently left in the old header context. Fix: a small client `RouteFocusReset` in the root layout that moves focus to `#main-content` on `pathname` change (and announces via a live region).
- **`/rules` iframe on mobile.** `rules/page.tsx:31` — `height: min(900px, calc(100vh - 220px))`; at 360×800 that's a ~580px nested scroll region inside the page scroll. Fixed by P1-2.
- **`/about` carousel content is not addressable.** `about-carousel-section.tsx:105` renders only `slides[activeIndex]`; the `aria-live="polite"` wrapper announces changes, but the other slides are absent from the DOM entirely — no anchor, no deep link, no crawl.
- **`ErrorBoundary` heading skip** (P3).

---

## 9. Top 8 wins, ranked by impact ÷ effort

| # | Win | Effort | Impact | Where |
|---|---|---|---|---|
| 1 | Add `metadataBase` + `openGraph` + `twitter` + `opengraph-image` + `robots.ts` + `sitemap.ts` | ~half a day | Every shared link stops rendering as a grey box; crawl becomes directed; dev/auth routes leave the index | `src/app/layout.tsx:42`; new `robots.ts`/`sitemap.ts`/`opengraph-image.tsx` |
| 2 | Move the rulebook out of the Google Docs iframe into server-rendered `/rules/[slug]` | ~1 week | Unlocks the entire "how do the rules work" search surface — the top organic channel for a new TTRPG | `src/app/(main)/rules/page.tsx:28` |
| 3 | Fix `/` (delete `src/app/page.tsx`, promote `home-page.tsx` → `(main)/page.tsx`) and drop `"use client"` from the landing | ~2 hours | Restores route-group boundaries for `/`, stops chrome remount on the most common navigation, moves 10 landing modules off the client | `src/app/page.tsx:6`; `src/app/(main)/home-page.tsx:16` |
| 4 | Split `/api/codex` per collection + per-collection query keys + drop `cache:'no-store'` | ~1 day | Removes a multi-hundred-KB uncached download from `/codex` and from every creator that touches one codex slice | `src/hooks/use-codex.ts:39-64`; `src/lib/api-client.ts:96` |
| 5 | Paginate or virtualize `CodexBrowseListShell` | ~1 day | 809 feats today, unbounded tomorrow — this is the route that breaks first at scale | `src/app/(main)/codex/CodexFeatsTab.tsx:263` |
| 6 | Add `sizes` to the hero/auth logos, `priority` on one variant only, re-export the 794 KB / 560 KB PNGs | ~2 hours | Direct LCP win on `/` and all 5 auth pages | `hero-section.tsx:56-73`; `(auth)/layout.tsx:41-56` |
| 7 | `next/dynamic` the guided + legacy creator step maps and the character-sheet modal bundle | ~half a day | Cuts the initial JS on the primary funnel (`guided-creator` 8,982 LOC) and the sheet (13,227 LOC) | `guided-creator-shell.tsx:22-33`; `characters/new/advanced/page.tsx:17`; `characters/[id]/page.tsx:13-27` |
| 8 | Add server-rendered codex detail routes `/codex/{feats,skills,species,…}/[slug]` with `generateStaticParams` + `generateMetadata` + structured data | ~1 week | Turns 800+ feats / 420 parts / 210 traits into 1,400+ indexable long-tail pages — the wiki play that built D&D Beyond's organic traffic | new `src/app/(main)/codex/**` |

---

## 10. Dead / dev code to delete

| Item | Path | Action |
|---|---|---|
| `/forgot-username` route | `src/app/(auth)/forgot-username/page.tsx` | Unlinked. Link from `/login` or delete. |
| `submitForgotUsernameAction` | `src/app/(auth)/forgot-username/action.ts:12` | Zero callers. Delete. |
| create-next-app SVGs | `public/{file,globe,next,vercel,window}.svg` | Unreferenced. Delete. |
| Dead OAuth-code client fallback | `src/app/(main)/home-page.tsx:34-51` | Superseded by `src/proxy.ts:21-33`. Delete (unblocks win #3). |
| `/dev/styleguide` | `src/app/dev/styleguide/**` | **Do not delete** — it is a live visual/a11y baseline (`tests/visual/targets.ts:21`). Add `robots: noindex` + `Disallow: /dev/`. |
| Legacy advanced creator | `src/app/(main)/characters/new/advanced/**` | Being phased out per project context. Track a removal date; until then it is 8,746 LOC of eagerly-imported wizard reachable from the `/characters/new` chooser. |
| `MainContentBoundary` in the layout | `src/components/layout/main-content-boundary.tsx` | Effectively unreachable for page errors (P2-12). Remove from the layout or document its actual purpose. |

**Not found (checked):** `console.log`/`console.debug`/`console.info`/`console.warn`, `TODO`, `FIXME`, `HACK`, `XXX`, and commented-out code blocks under `src/app/**` excluding `api/`. This layer is clean on that axis.
