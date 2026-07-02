# Performance & Edge Usage — Vercel CDN

> **Purpose:** How to keep Vercel Fast Data Transfer, Edge Requests, and Edge CPU under control. For AI agents and engineers.

**Last updated:** Jun 2026 (consolidates former `CDN_QUERY_AUDIT_2026-02-24.md` and `EDGE_REQUESTS_REDUCTION.md`).

**Related:** `DATA_HANDLING.md` (query keys, cache), `DEPLOYMENT_AND_SECRETS_SUPABASE.md` (env, deploy).

---

## Summary

| Area | Status | Notes |
|------|--------|--------|
| **Proxy matcher** | Good | High-volume public routes excluded; session refresh only where needed |
| **Cache headers** | Partial | Codex + official library GET have Cache-Control; other GETs do not |
| **Refetch / polling** | Good | `refetchOnWindowFocus: false` globally; encounter polling visibility-aware |
| **Prefetch** | Tuned | Footer, header dropdown, About page use `prefetch={false}` |
| **Official library hook** | Good | `staleTime` 5 min; refetchOnMount only when stale |

---

## Why edge requests spike

- **Bot / crawler traffic** — Many 404s from probes (`.php`, `wp-admin`, `.env`).
- **Next.js Link prefetch** — Each visible `<Link>` can prefetch; dense nav pages trigger bursts.
- **Proxy on every request** — Each matching request runs session refresh at the edge.
- **Polling** — Timers on encounter pages (mitigated with Page Visibility API).

Edge requests = all requests hitting the CDN. Optimize by: **narrow proxy matcher**, **block bad traffic**, **reduce prefetches**, **cache read-heavy GETs**.

---

## Codebase optimizations (in production)

### Proxy matcher (`src/proxy.ts`)

Excluded from proxy (no session refresh):

- `_next/static`, `_next/image`, `favicon.ico`
- `auth/callback`, `auth/confirm`
- **`api/codex`**, **`api/public`**, **`api/official`** and subpaths
- Static extensions: svg, png, jpg, jpeg, gif, webp, ico, woff, woff2, ttf, eot
- **`robots.txt`**, **`sitemap.xml`**
- **`/images/`** — placeholder portraits, dice icons (high volume)

`next.config.ts` sets `Cache-Control: public, max-age=31536000, immutable` for `/images/:path*`.

### Cache headers

- **`GET /api/codex`** and **`GET /api/official/[type]`** (and legacy `/api/public/[type]`):  
  `Cache-Control: public, max-age=300, s-maxage=600, stale-while-revalidate=300`

### React Query

- Global **`refetchOnWindowFocus: false`** (`query-provider.tsx`)
- Codex, game rules, campaign rolls: no refetch on focus
- **`useOfficialLibrary`**: `staleTime: 5 * 60 * 1000`, `refetchOnMount: true` (only refetches when stale)

### Encounter polling (`CombatEncounterView.tsx`)

- 90s interval when tab **visible**; **paused when hidden** (Page Visibility API)
- One refetch on return, then interval resumes
- Supabase Realtime also pushes character updates

### Prefetch

- **About page**, **footer**, **header dropdown** (Creators, Rules, RM Tools): `prefetch={false}`
- Primary nav (Characters, Library, Codex, Campaigns) still prefetched for fast navigation

---

## Vercel Dashboard (operator)

1. **Usage / Logs** — Identify paths or IPs driving spikes (404 bots vs real traffic).
2. **Firewall / Bot Protection** — Enable if available on your plan.
3. **Custom rules** — Deny common bot paths (`.php`, `wp-admin`, `.env`, `.git`, `phpMyAdmin`).
4. **Usage limits** — Set soft/hard caps to avoid surprise bills.
5. **Caching** — Codex/official GET cache headers are set in route handlers; no extra Vercel config needed.

---

## Checklist for new work

When adding or changing:

- **New public GET API** (no auth, read-only):
  - Exclude from proxy in `src/proxy.ts` if session refresh isn't needed.
  - Set `Cache-Control` (e.g. `public, max-age=300, s-maxage=600, stale-while-revalidate=300`).
  - Document in `DATA_HANDLING.md`.

- **New React Query hooks** (reference data, rarely changes):
  - Long `staleTime`, `refetchOnWindowFocus: false`.
  - Avoid `refetchOnMount: true` without reasonable `staleTime` for heavy payloads.

- **Polling** — Prefer Supabase Realtime; if polling, use 90s+ interval and pause when tab hidden.

- **Remote images** — Prefer `next/image` with `remotePatterns` in `next.config.ts`. Use `unoptimized` only when necessary (private Supabase bucket).

---

## Key files

| Purpose | File |
|---------|------|
| Proxy / Edge matcher | `src/proxy.ts` |
| Session refresh | `src/lib/supabase/middleware.ts` |
| Codex API + cache | `src/app/api/codex/route.ts` |
| Official library API + cache | `src/app/api/official/[type]/route.ts` |
| Official library hook | `src/hooks/use-public-library.ts` (`useOfficialLibrary`) |
| Encounter polling | `src/app/(main)/encounters/[id]/_components/CombatEncounterView.tsx` |
| Prefetch | `src/components/layout/footer.tsx`, `header.tsx`, `(main)/about/page.tsx` |
| Query defaults | `src/components/providers/query-provider.tsx` |
| Image config | `next.config.ts` |

---

## Deferred / optional

- **Portraits:** If Supabase buckets are public and `_next/image` works, try removing `unoptimized` from `sheet-header.tsx`, `character-card.tsx`, `campaigns/[id]/page.tsx`.
- **User-specific GETs:** Optional `Cache-Control: private, max-age=60` for large character payloads on rapid re-navigation.
