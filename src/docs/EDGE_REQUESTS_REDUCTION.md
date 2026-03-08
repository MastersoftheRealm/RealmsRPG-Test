# Reducing Vercel Edge Request Spikes

This doc explains **codebase changes** on the `fix/edge-requests-spike` branch and **step-by-step Vercel Dashboard** actions to reduce edge request volume and protect against bots/DDoS.

---

## Why Edge Requests Spike

Common causes:

- **Bot / crawler traffic** â€” Bots hitting many routes (including non-existent ones â†' 404s) or health checks.
- **Next.js Link prefetch** â€” Each visible `<Link>` can prefetch its route; many links on one page (e.g. About, footer, header) = many edge requests on load.
- **Proxy (middleware) on every request** â€” If the proxy runs on static assets or high-volume APIs, every such request counts as an edge request.
- **Uptime / monitoring** â€” External services pinging the site frequently.

Edge requests = **all requests that hit the CDN/edge**. Optimizing means: **run the proxy on fewer paths**, **block bad traffic**, and **reduce unnecessary prefetches**.

---

## Changes in This Branch (Codebase)

### 1. Proxy matcher (`src/proxy.ts`)

The Next.js proxy runs on every *matching* request (each = 1 edge request). We **exclude** more paths so the proxy does **not** run for:

- **Bot/crawler paths:** `robots.txt`, `sitemap.xml` â€” crawlers no longer trigger session refresh.
- **Fonts and favicon:** `.ico`, `.woff`, `.woff2`, `.ttf`, `.eot` â€” static file requests don't run the proxy.

- **`/images/`** — e.g. `placeholder-portrait.png` (used on every character card/sheet). Very high request volume; proxy excluded so session refresh never runs for these.

Already excluded (unchanged): `_next/static`, `_next/image`, `favicon.ico`, auth callbacks, `api/codex`, `api/public`, `api/official`, and image extensions (svg, png, jpg, etc.).

**Result:** Fewer edge requests from crawlers, static assets, and `/images/`.

**Cache for `/images/`:** `next.config.ts` sets `Cache-Control: public, max-age=31536000, immutable` for `/images/:path*` so the CDN and browser cache placeholder and other static images for 1 year. Repeat views and multiple components using the same image get cache hits instead of new edge requests.

### 2. Prefetch on About page (`src/app/(main)/about/page.tsx`)

The About page has many `<Link>`s. With default prefetch, loading About could trigger a burst of GETs to `/codex`, `/library`, `/rules`, creators, etc. All such links on the About page now use **`prefetch={false}`** so those routes are only requested when the user actually navigates.

**Result:** Loading the About page no longer triggers a large prefetch burst.

### 3. Already in place (from earlier work)

- **Footer and header dropdown links** â€” Already use `prefetch={false}` (see `footer.tsx`, `header.tsx`).
- **High-volume APIs** â€” `api/codex`, `api/public`, `api/official` are excluded from the proxy; they also use cache headers to reduce re-downloads (see `CDN_QUERY_AUDIT_2026-02-24.md` and `DEPLOYMENT_AND_SECRETS_SUPABASE.md`).
- **Encounter polling** â€” 90s interval and paused when tab is hidden (Page Visibility API).

---

## Vercel Dashboard: Step-by-Step

Do these in order. You can do **1â€“2** first to understand traffic, then **3â€“5** to protect and limit.

### Step 1: See whatâ€™s using edge (Usage & Analytics)

1. Go to [Vercel Dashboard](https://vercel.com) â†' your **project** (e.g. RealmsRPG-Test).
2. Open **Usage** (or **Analytics** â†' **Usage**).
3. Check **Edge Requests** (and optionally **Edge Execution Time**).
4. In **Logs** or **Analytics**, filter by path or status:
   - Look for many requests to the same path (e.g. `/`, `/api/...`, `/robots.txt`).
   - Look for many **404** or **5xx** â€” often bots or broken health checks.

**Goal:** Identify which paths or IPs are driving the spike (bots, prefetch, health checks, or real users).

---

### Step 2: Enable Vercel Firewall and Attack Mode

1. In the project, go to **Settings** â†' **Firewall** (or **Security** â†' **Firewall** depending on plan).
2. If available, turn on **Vercel Firewall** and **Bot Protection**.
3. **Attack Mode (Danger Zone):** Turn it **on**. It challenges suspicious traffic with JavaScript verification. Real users in normal browsers pass; many bots and scrapers fail. If almost all your edge traffic is 404s, that traffic is almost certainly bots â€” Attack Mode will stop most of it from reaching your app (and from counting as edge requests once blocked).
4. **AI Bots (Bot Management):** Leave **"Block requests from known AI bots and scrapers"** **off** if you want AI (e.g. ChatGPT, Perplexity, search engines) to be able to discover and index Realms. Block AI Bots only if you have a specific abuse or scraping problem from AI crawlers.

**Note:** Firewall options depend on your plan (e.g. Pro/Enterprise). If you don't see Firewall, skip to Step 3 and 4.

---

### Step 3: Block known bad paths with Custom Rules (step-by-step)

When most edge requests are **404s**, bots are often requesting paths that don't exist on your app (e.g. WordPress paths, `.php`, `.env`). Blocking those paths in the Firewall **denies them before they hit your app**, so they don't consume edge or return 404 from Next.js.

**3.1 - Open Firewall rules**

1. In the project, go to **Firewall** in the sidebar.
2. Click **Configure** (top right on the Firewall overview page).
3. Click **Add New...** → **Rule** to create a new rule.

**3.2 - Add a rule to block common bot paths**

1. **Name:** e.g. `Block common bot 404 paths`.
2. In **Configure**, add **If** conditions. You can add multiple conditions and combine with **OR** (any match) so one rule blocks several path patterns:
   - **If** → **Request Path** → **Contains** → `.php` (blocks requests for `.php` files; your app doesn't use PHP.)
   - Click **Add condition** → **OR** → **Request Path** → **Contains** → `wp-admin` (WordPress admin; you don't use WordPress.)
   - **OR** → **Request Path** → **Contains** → `wp-login`
   - **OR** → **Request Path** → **Contains** → `.env` (blocks probes for env files.)
   - **OR** → **Request Path** → **Contains** → `phpMyAdmin` (or `phpmyadmin` if the UI is case-insensitive.)
   - **OR** → **Request Path** → **Contains** → `.git` (blocks probes for git metadata.)
3. **Then** action: choose **Deny** (block the request).
4. (Optional) Under **for**, you can set a **time-based block** (e.g. 1 minute) so the same client is blocked for a short period - reduces repeated probes from the same IP.
5. Click **Review Changes** → **Save Rule** (or **Publish**), then apply the configuration so the rule goes live.

**3.3 - Optional: block more patterns**

If in **Logs** you see other path patterns that always 404 (e.g. `/api/v1/`, `/adminer`, `/backup`), add another rule or add more **OR** conditions to the same rule with **Request Path** **Contains** that string, then **Deny**.

**3.4 - Test first (optional)**

If you prefer to be cautious: create the rule with **Then** = **Log** only, check the Firewall overview/live traffic for a few minutes to see that the right requests are matched, then edit the rule and change **Then** to **Deny** and save.

---

### Step 4: Set spend / usage limits

1. Go to **Settings** â†' **Usage** or **Billing** (or your **Team/Account** settings).
2. Set a **soft limit** (e.g. email when edge requests exceed X) so you get warned before overages.
3. If your plan allows, set a **hard cap** so usage stops at a ceiling (avoids surprise bills).

---

### Step 5: Confirm caching (already in place)

- **Codex / public APIs:** `GET /api/codex` and `GET /api/public/[type]` already send  
  `Cache-Control: public, max-age=300, s-maxage=600, stale-while-revalidate=300`  
  so repeat requests are served from CDN/browser and use fewer edge executions.
- No extra Vercel config needed for this; itâ€™s set in the API route handlers. See `DEPLOYMENT_AND_SECRETS_SUPABASE.md` and `CDN_QUERY_AUDIT_2026-02-24.md`.

---

## Checklist Summary

| Action | Where | Purpose |
|--------|--------|--------|
| Narrow proxy matcher | `src/proxy.ts` | Fewer requests run proxy â†' fewer edge requests |
| Prefetch off on About (and footer/header) | About page, footer, header | Fewer prefetch GETs on load |
| Check Usage / Logs | Vercel â†' Usage / Logs | Find whatâ€™s driving the spike |
| Enable Firewall / Attack Challenge | Vercel â†' Settings â†' Firewall | Block or challenge bad traffic |
| Set usage limits | Vercel â†' Billing / Usage | Avoid overages |

---

## If you add new public APIs

- **Exclude them from the proxy** in `src/proxy.ts` if they don't need session refresh (same pattern as `api/codex`, `api/public`, `api/official`).
- **Set cache headers** on GET responses if the data is cacheable (see `DEPLOYMENT_AND_SECRETS_SUPABASE.md`).

This keeps edge usage under control as the app grows.
