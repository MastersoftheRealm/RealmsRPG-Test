-- TASK-876 — Unify feat categories Offense → Offensive (preview only; owner approve before apply)
-- Codex-data policy: audit → propose → owner "apply" → run once (DEV-Q06).
--
-- Live audit 2026-08-22 (project lbqhiwudvifmkjtkccdg):
--   Offensive=187, Offense=8, Utility=304, Defensive=87, Support=54, Movement=39, …
-- Seed CSV (scripts/seed-data/feats.csv): Offense=0, Offensive=183 — seed already unified.
-- Power/technique *part* categories still use "Offense" — do NOT touch codex_parts.
--
-- Offense rows still live:
--   35 Assassin's Blade
--   203 Empowered State
--   204 Empowered Teacher
--   797 Graceful Stance
--   804 Graceful Stance
--   801 Groundwork
--   321 Impasta
--   800 Probing Strike

-- Preview live counts (run in Supabase SQL editor before apply):
-- SELECT category, count(*) AS n
-- FROM public.codex_feats
-- WHERE category IN ('Offense', 'Offensive')
-- GROUP BY category
-- ORDER BY category;

-- SELECT id, name, category
-- FROM public.codex_feats
-- WHERE category = 'Offense'
-- ORDER BY name;

-- Proposed apply (idempotent) — uncomment only after owner "apply":
-- UPDATE public.codex_feats
-- SET category = 'Offensive'
-- WHERE category = 'Offense';

-- Post-apply verification:
-- SELECT count(*) AS offense_remaining FROM public.codex_feats WHERE category = 'Offense';
-- Expected: 0
