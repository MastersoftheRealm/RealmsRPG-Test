-- Creature feat category. Same kind of column as public.codex_feats.category.
-- Not applied. Run only after a named Supabase backup and Kadin's OK to apply.
-- Rollback: ALTER TABLE public.codex_creature_feats DROP COLUMN IF EXISTS category;

ALTER TABLE public.codex_creature_feats
  ADD COLUMN IF NOT EXISTS category text;

COMMENT ON COLUMN public.codex_creature_feats.category IS
  'Stored group label, same kind of field as codex_feats.category. Empty means no group.';
