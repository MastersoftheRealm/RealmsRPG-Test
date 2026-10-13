# ADR-0021: First-party MDX rulebook + Codex detail metadata

- **Status:** Accepted (TASK-796; owner ack 2026-08-18)
- **Date:** 2026-08-18
- **Deciders:** owner (chat: next Architect leftover, excluding creator-route deletion) / agent (Architect)
- **Task:** TASK-796

## Context

Report 07 P1-2 / win #8: `/rules` is a Google Docs iframe (no crawlable rules text) and `/codex`
is a client browse list with no per-entry URLs. Owner supplied `Core Rulebook Test.docx` as the
rulebook source. Codex rows have no `slug` column.

## Decision

1. **Rulebook is in-repo MDX** under `src/content/rules/`, compiled with `@next/mdx` + `remark-gfm`.
   `/rules` opens at Welcome with nested chapter/subchapter nav and in-chrome search (TASK-905).
   `/rules/[slug]` renders one chapter as an RSC with `generateStaticParams` + `generateMetadata`.
   Keep the Google Doc as a view-source link. Do **not** store the manuscript in `core_rules`
   (that table is formula overrides, not prose).
2. **Codex detail URLs** are `/codex/{collection}/{slug}` where `slug` is
   `{slugified-name}--{id}` so lookup is by id without a new DB column. Pages are RSC with
   `generateMetadata` + `notFound()`. Browse rows link the name (expand click still ignores `<a>`).
3. **Public reads** for SSG/sitemap use a cookie-less anon `createPublicClient` in
   `lib/supabase/public-client.ts` (publishable key + existing read-all RLS). Do not use the
   service role. Do not add a new `/api/codex/[id]` tree.
4. No new `patterns/` or `ui/` file. Rulebook chrome lives in `components/rules/`.

## Consequences

- Positive: `/rules` and Codex entries are indexable; mobile reading is page scroll, not an iframe.
  Nested outline matches the Google Doc (Encounters → Combat/Skill; Character Creation →
  Roll-Tables; Equipment, Crafting & Downtime → Crafting & Harvesting / Downtime). Rulebook search
  covers all MDX chapters without a mega-page.
- Negative / follow-ups: glossary / The Realms chapters are unfinished in the source manuscript;
  Codex detail pages are name+description articles (browse still owns GLR chips). Sitemap Codex
  URLs need the public Supabase env at generate time. TASK-799 is done (confirm/toggle/admin delete).
- Rejected: keep the iframe; one mega `/rules` page; `/codex/[id]` without collection; putting
  rulebook prose in `core_rules`.
