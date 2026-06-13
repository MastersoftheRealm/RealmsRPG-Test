# CDN & Query Usage Audit — Vercel Metrics

**Date:** 2026-02-24  
**Scope:** Fast Data Transfer, Fast Origin Transfer, Edge Requests, Edge Request CPU Duration (per Vercel “Manage and optimize CDN usage” guidance).

---

## Summary

| Area | Status | Notes |
|------|--------|--------|
| **Proxy matcher** | ✅ Good | High-volume public routes excluded; session refresh only where needed |
| **Cache headers** | ✅ Partial | Codex + public library GET have Cache-Control; other GETs do not |
| **Refetch / polling** | ✅ Mostly good | refetchOnWindowFocus false globally; campaign rolls + encounter already tuned |
| **Images** | ⚠️ Review | Some `unoptimized` (Supabase URLs); local dice use next/image (optimized) |
| **Public library hook** | ✅ Done | staleTime 5 min added; refetchOnMount only refetches when stale. |
| **Encounter polling** | ✅ Tuned | 90s poll when tab visible; paused when tab hidden (Page Visibility API). |

---

## Log analysis (2026-02-24)

A sample of production logs showed two clear contributors:

1. **Encounter character API** — Same campaign, 4 linked characters: `GET /api/campaigns/…/characters/{userId}/{characterId}` every ~60s, 4 requests per tick. Over ~22 minutes that’s ~88 requests from one encounter tab. **Change:** Poll interval increased from 60s to 90s in `CombatEncounterView.tsx` to cut request rate by ~33%; Realtime still pushes character updates.

2. **Burst of page GETs** — Multiple GETs to `/`, `/campaigns`, `/about`, `/codex`, `/library`, `/terms`, `/privacy`, and four creator routes (`/power-creator`, `/technique-creator`, `/item-creator`, `/species-creator`) in the same second. Caused by **Next.js default prefetch**: `<Link>` prefetches when in viewport, so the header + footer (and About page with many links) trigger many prefetches on load. **Change:** `prefetch={false}` added on footer links and on header dropdown sub-links (Creators, Rules, RM Tools) so those routes are not prefetched until the user navigates. Primary nav (Characters, Library, Codex, Campaigns, About) still prefetched for fast navigation.

---

## Inactive tab / left-open pages

When a user leaves a tab open in the background (e.g. encounter page or character sheet), we should avoid ongoing requests until they return.

| Page | Behavior | Status |
|------|----------|--------|
| **Encounter (combat)** | Linked character HP/EN was polled every 90s even when tab was hidden. | **Fixed:** Polling uses the **Page Visibility API** (`document.visibilityState`, `visibilitychange`). When the tab is hidden, the interval is cleared; when the user returns, we refetch once and resume the 90s interval. So an encounter tab left open in the background generates **no** character API requests until the tab is visible again. |
| **Character sheet** | No polling. Initial load + Realtime subscription for character updates (push-based). React Query hooks (codex, library, campaigns) have no refetchInterval and refetchOnWindowFocus is false. | **OK:** Left open, the sheet does not issue repeated GETs. Realtime keeps the connection but does not trigger extra API route invocations. |
| **Campaign list / detail** | useCampaigns / useCampaign have no refetchInterval. | **OK:** No ongoing requests when left open. |
| **Library / Codex** | React Query with staleTime; no refetchInterval. | **OK:** No ongoing requests when left open. |

**Takeaway:** The only place that had a timer was the encounter view. It is now visibility-aware so inactive or background tabs do not contribute to request volume.

---

## 1. Fast Data Transfer (CDN → user)

**What counts:** Full size of each HTTP response to the client (body, headers, URL, compression).

### Already in place

- **`/api/codex`** and **`/api/public/[type]`** GET responses set  
  `Cache-Control: public, max-age=300, s-maxage=600, stale-while-revalidate=300`  
  so repeat hits are served from browser/CDN and don’t re-download full payloads.  
  See `DATA_HANDLING.md`, `DEPLOYMENT_AND_SECRETS_SUPABASE.md`.

### Potential leaks / improvements

| Item | Location | Risk | Recommendation |
|------|----------|------|-----------------|
| **Unoptimized images** | `sheet-header.tsx`, `character-card.tsx`, `campaigns/[id]/page.tsx` | Portraits/campaign images bypass Next Image Optimization → larger bytes to user. | Keep as-is if Supabase bucket must stay private or URLs would 400 via `_next/image`. If bucket is **public** and URLs work with `next/image`, try removing `unoptimized` and rely on `next.config` `images.remotePatterns` for Supabase to regain optimization and reduce Fast Data Transfer. |
| **Large GET responses** | `GET /api/characters/[id]` (with `libraryForView`), `GET /api/campaigns/[id]/characters/[userId]/[characterId]` (full view) | Big JSON payloads on every request when viewing shared character/campaign view. | No cache headers today (user-specific). Optional: add `Cache-Control: private, max-age=60` for browser cache only so rapid re-navigation doesn’t re-download; or document as acceptable. |
| **Roll log dice** | `roll-log.tsx` | Uses `next/image` for `/images/D4.png` etc. (local static). Next can optimize these. | No change needed; local assets + proxy excludes `_next/image` from session middleware. |

---

## 2. Fast Origin Transfer (CDN → Vercel Compute)

**What counts:** Input + output bytes for Vercel Functions, Middleware, and Data Cache (ISR).  
Each request that hits the proxy and then a server route incurs: proxy (Edge) + route handler (Compute).

### Already in place

- **Proxy matcher** (`src/proxy.ts`) excludes:
  - `_next/static`, `_next/image`, `favicon.ico`
  - `auth/callback`, `auth/confirm`
  - **`api/codex`** and **`api/public`** (and their subpaths)
  - Static image extensions (svg, png, jpg, jpeg, gif, webp)

  So high-volume codex/public GETs do **not** run the proxy (no Edge + no double run with Compute for session refresh).  
  See `DEPLOYMENT_AND_SECRETS_SUPABASE.md` → “Vercel free tier usage”.

- **Supabase middleware** (`src/lib/supabase/middleware.ts`) only calls `getUser()` for session refresh; no large reads/writes.

### Potential issues

| Item | Location | Risk | Recommendation |
|------|----------|------|-----------------|
| **No cache on other GET APIs** | All other API routes (characters, campaigns, rolls, user library, etc.) | Every GET is a full Compute invocation and full response bytes (in + out). | Private/user-specific data; adding short `Cache-Control: private, max-age=0` or `no-store` is optional and mainly clarifies semantics. For truly cacheable GETs (e.g. public read-only by slug), follow the codex/public pattern (exclude from proxy if no auth, add Cache-Control). |
| **Middleware + Function** | Every non-excluded request | Proxy runs first (Edge), then route handler (Compute). Vercel notes middleware can contribute to Fast Origin Transfer. | Already minimized by excluding codex/public and static assets. No further change unless new high-volume public endpoints are added — then exclude them and add cache. |

---

## 3. Edge Requests

**What counts:** All requests to the deployment (static, `_next/image`, functions).  
Proxy runs only on **matching** requests; excluded paths still count as Edge Requests but do **not** run proxy (so no extra Edge CPU from session refresh).

### Already in place

- **refetchOnWindowFocus: false** in:
  - `query-provider.tsx` (default)
  - `use-codex.ts`, `use-game-rules.ts`, `use-campaign-rolls.ts`
- **refetchInterval: false** in `use-campaign-rolls.ts` (Realtime pushes updates).
- **CombatEncounterView** no longer refetches on window focus; 90s polling only when tab is **visible** (Page Visibility API — polling paused when tab is hidden). When user returns to tab, one refetch then interval resumes.  
  See `AI_CHANGELOG.md` and `ALL_FEEDBACK_CLEAN.md` (2026-02-24).

### Potential leaks / improvements

| Item | Location | Risk | Recommendation |
|------|----------|------|-----------------|
| **Public library refetchOnMount** | `use-public-library.ts` | `refetchOnMount: true` with `staleTime: 5 * 60 * 1000` (5 min). | Done: opening add modal repeatedly within 5 min doesn’t refetch; API has cache headers. |
| **Roll log “Campaign” tab** | `roll-log.tsx` | `useEffect` when `mode === 'campaign' && campaignId` calls `refetchCampaignRolls()`. One extra GET when user switches to Campaign tab. | Acceptable; single request per tab switch. |
| **Encounter character polling** | `CombatEncounterView.tsx` | 90s interval when tab visible; **paused when tab hidden**. On visibility visible: one refetch then resume. Realtime also pushes. | Done: 60s→90s; Page Visibility API to pause when inactive. |

---

## 4. Edge Request CPU Duration

**What counts:** CPU time per Edge Request; billed when >10ms (in 10ms increments).  
Influenced by: number of routes, redirects, and **complex regex in routing**.

### Already in place

- **Single proxy** with one matcher regex; no extra middleware.
- **No redirects/rewrites** in `next.config.ts` that would add routing work.
- High-traffic paths (`api/codex`, `api/public`, `_next/image`, static) excluded from proxy so they don’t run session refresh.

### Potential issues

| Item | Location | Risk | Recommendation |
|------|----------|------|-----------------|
| **Matcher regex** | `src/proxy.ts` | One moderately complex negative lookahead. Unlikely to be a major cost. | Keep as-is; if Vercel ever reports high Edge CPU on this project, consider simplifying or splitting matchers. |

---

## 5. Checklist for new work

When adding or changing:

- **New public GET API** (no auth, read-only):  
  - Exclude from proxy matcher in `proxy.ts` if session refresh isn’t needed.  
  - Set `Cache-Control` (e.g. `public, max-age=300, s-maxage=600, stale-while-revalidate=300`) on the GET response.  
  - Document in `DATA_HANDLING.md` and `DEPLOYMENT_AND_SECRETS_SUPABASE.md`.

- **New image sources** (remote):  
  - Prefer `next/image` with `remotePatterns` in `next.config.ts` so Vercel Image Optimization is used.  
  - Use `unoptimized` only when necessary (e.g. private bucket or 400 from optimizer).

- **New React Query hooks** (codex-like or high-read, low-write):  
  - Use a long `staleTime` and `refetchOnWindowFocus: false` if data is reference/rarely changing.  
  - Avoid `refetchOnMount: true` without a reasonable `staleTime` for heavy payloads.

- **Polling** (e.g. encounter, dashboards):  
  - Prefer Supabase Realtime where possible; if polling, use a reasonable interval (e.g. 90s+) and avoid refetch on every focus.  
  - Pause polling when the tab is hidden (Page Visibility API: `document.visibilityState`, `visibilitychange`) so inactive tabs do not generate requests; resume (with one refetch) when visible again.

---

## 6. Files referenced

| Purpose | File |
|--------|-----|
| Proxy / Edge matcher | `src/proxy.ts` |
| Session refresh | `src/lib/supabase/middleware.ts` |
| Codex API + cache | `src/app/api/codex/route.ts` |
| Public library API + cache | `src/app/api/public/[type]/route.ts` |
| Codex hooks (staleTime, no refetch on focus) | `src/hooks/use-codex.ts` |
| Campaign rolls (no refetch on focus/interval) | `src/hooks/use-campaign-rolls.ts` |
| Public library (refetchOnMount) | `src/hooks/use-public-library.ts` |
| Encounter polling | `src/app/(main)/encounters/[id]/_components/CombatEncounterView.tsx` |
| Prefetch (footer + dropdown links) | `src/components/layout/footer.tsx`, `src/components/layout/header.tsx` |
| Query defaults | `src/components/providers/query-provider.tsx` |
| Image config | `next.config.ts` |
| Unoptimized images | `sheet-header.tsx`, `character-card.tsx`, `campaigns/[id]/page.tsx` |
| Data/cache guidance | `src/docs/DATA_HANDLING.md` |
| Vercel usage notes | `src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md` |

---

## 7. Status: completed vs deferred

### Completed (this audit)

- **Proxy matcher:** High-volume routes (`api/codex`, `api/public`, static, auth callbacks) excluded from proxy.
- **Cache headers:** `/api/codex` and `/api/public/[type]` GET use `Cache-Control: public, max-age=300, s-maxage=600, stale-while-revalidate=300`.
- **Public library hook:** `staleTime: 5 * 60 * 1000` in `usePublicLibrary`; refetchOnMount only refetches when stale.
- **Encounter polling:** Interval 60s→90s; **Page Visibility API** — polling paused when tab hidden, one refetch + resume when visible.
- **Prefetch:** `prefetch={false}` on footer links and header dropdown sub-links (Creators, Rules, RM Tools).
- **Refetch behavior:** refetchOnWindowFocus false globally and for codex, game rules, campaign rolls; no refetch on focus for encounter.

### Deferred / manual (optional)

- **Portraits/images:** If Supabase buckets are public and `_next/image` works (no 400/403), try removing `unoptimized` from `sheet-header.tsx`, `character-card.tsx`, and `campaigns/[id]/page.tsx` to enable image optimization and reduce Fast Data Transfer. Environment-dependent; verify in your deployment.

### Ongoing

- **Documentation:** When adding new public GET APIs, exclude them from the proxy matcher (if no session needed) and set cache headers; keep this audit and the "Vercel free tier usage" section in `DEPLOYMENT_AND_SECRETS_SUPABASE.md` in sync.