-- Feat tag unification — Phase 2
-- Depends on Phase 1 (map_feat_tag_phase1). Run phase 1 first.
--
-- Status (RealmsRPG-Test lbqhiwudvifmkjtkccdg):
--   map_feat_tag_phase2 + normalize_feat_tags + codex_feats.tags data applied ad-hoc 2026-07-03.
--   Live DB normalize_feat_tags chains map_feat_tag_phase2 (verified via pg_get_functiondef).
--   Not recorded in schema_migrations.
--
-- Owner-reviewed exclusions:
--   Light/Dark/Magic damage stay distinct (not Elemental/Arcane).
--   Motivate, Deceive, Analyze, Interchangeable stay as-is (skills/properties).
-- Owner review required before re-applying data UPDATE — see .cursor/rules/realms-codex-data.mdc

CREATE OR REPLACE FUNCTION map_feat_tag_phase2(raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  tag text := map_feat_tag_phase1(raw);
BEGIN
  IF tag IS NULL THEN RETURN NULL; END IF;

  RETURN CASE tag
    -- Critical family
    WHEN 'Critical' THEN 'Critical Hit'
    WHEN 'Major Critical Hit' THEN 'Critical Hit'
    WHEN 'Critical Range Reduction' THEN 'Critical Range'

    -- Drop bare Evasion when specific evasion tags exist on the feat
    WHEN 'Evasion' THEN NULL

    -- Physical damage family only (elemental types stay separate per game rules)
    WHEN 'Bludgeoning Damage' THEN 'Physical Damage'
    WHEN 'Piercing Damage' THEN 'Physical Damage'
    WHEN 'Slashing Damage' THEN 'Physical Damage'
    WHEN 'Fire Damage' THEN 'Elemental Damage'

    -- Recovery family
    WHEN 'Recovery Time' THEN 'Recovery'
    WHEN 'Full Recovery' THEN 'Recovery'
    WHEN 'Partial Recovery' THEN 'Recovery'

    -- Social (generic interaction only — not named skills)
    WHEN 'Convince' THEN 'Social'
    WHEN 'Negotiate' THEN 'Social'

    -- Skill overlap
    WHEN 'Skill' THEN 'Skill Bonus'

    -- Summoning / companions
    WHEN 'Familiar' THEN 'Companion'
    WHEN 'Free Summon' THEN 'Summon'

    -- Drop bare Movement when specific movement tags exist
    WHEN 'Movement' THEN NULL

    -- Low-value generics
    WHEN 'Support' THEN NULL
    WHEN 'Reliability' THEN NULL
    WHEN 'Versatile' THEN NULL

  ELSE tag
  END;
END;
$$;

CREATE OR REPLACE FUNCTION normalize_feat_tags(tag_string text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN mapped IS NULL OR mapped = '' THEN NULL
    ELSE mapped || ','
  END
  FROM (
    SELECT string_agg(DISTINCT t, ',' ORDER BY t) AS mapped
    FROM (
      SELECT map_feat_tag_phase2(unnest(string_to_array(COALESCE(tag_string, ''), ','))) AS t
    ) sub
    WHERE t IS NOT NULL AND t <> ''
  ) agg;
$$;

-- Owner must approve before applying (see .cursor/rules/realms-codex-data.mdc):
-- UPDATE codex_feats
-- SET tags = normalize_feat_tags(tags)
-- WHERE tags IS NOT NULL
--   AND tags IS DISTINCT FROM normalize_feat_tags(tags);
