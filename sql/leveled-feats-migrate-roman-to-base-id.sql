-- Leveled Feats: strip roman numerals from names and set base_feat_id
-- Run AFTER leveled-feats-add-base-feat-id.sql. Run in Supabase SQL Editor.
-- See src/docs/LEVELED_FEATS_DESIGN.md.

-- 1) Strip roman numeral suffix (II, III, IV, V, VI, VII, VIII, IX, X, XI) from name
UPDATE public.codex_feats
SET name = trim(regexp_replace(name, '\s+(II|III|IV|V|VI|VII|VIII|IX|X|XI)$', '', 'i'))
WHERE name ~ '\s+(II|III|IV|V|VI|VII|VIII|IX|X|XI)$';

-- 2) Set base_feat_id for feats with feat_lvl >= 2: point to the level-1 feat with same name
UPDATE public.codex_feats AS f
SET base_feat_id = (
  SELECT b.id
  FROM public.codex_feats AS b
  WHERE b.name = f.name
    AND (b.feat_lvl = 1 OR b.feat_lvl IS NULL)
  ORDER BY COALESCE(b.feat_lvl, 1) ASC
  LIMIT 1
)
WHERE f.feat_lvl IS NOT NULL AND f.feat_lvl >= 2;
