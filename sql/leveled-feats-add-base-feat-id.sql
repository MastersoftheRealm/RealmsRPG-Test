-- Leveled Feats: add base_feat_id to codex_feats
-- Status: Applied on RealmsRPG-Test (column exists; 202/203 feat_lvl>=2 rows have base_feat_id).
-- Run BEFORE leveled-feats-migrate-roman-to-base-id.sql. See src/docs/LEVELED_FEATS_DESIGN.md.

ALTER TABLE public.codex_feats
  ADD COLUMN IF NOT EXISTS base_feat_id TEXT;

COMMENT ON COLUMN public.codex_feats.base_feat_id IS
  'Id of the level-1 feat. NULL for level-1; set for feat_lvl >= 2. Used to group leveled feats and validate prerequisites.';
