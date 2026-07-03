-- Feat tag unification — Phase 3 (APPLIED 2026-07-03 — owner approved)
-- Tags 50 feats that had no tags. Uses existing canonical tag vocabulary
-- where possible; skill-centric feats may introduce skill-name tags (see FEAT_TAGS.md).
-- After apply, run normalize_feat_tags() is redundant if tags are already canonical.
--
-- Preview:
-- SELECT p.id, f.name, f.tags AS before, p.proposed_tags AS after
-- FROM feat_tag_phase3_proposals p
-- JOIN codex_feats f ON f.id = p.id
-- ORDER BY f.name;

CREATE TEMP TABLE IF NOT EXISTS feat_tag_phase3_proposals (
  id text PRIMARY KEY,
  proposed_tags text NOT NULL
);

TRUNCATE feat_tag_phase3_proposals;

INSERT INTO feat_tag_phase3_proposals (id, proposed_tags) VALUES
  -- Character feats (null category)
  ('1',   'Act,Social,Skill Bonus,'),
  ('6',   'Acrobatics,Movement,'),
  ('19',  'Alchemy,Craft,'),
  ('26',  'Attack Bonus,Potency Bonus,'),
  ('33',  'Craft,'),
  ('44',  'Martial Attack,Melee,Reaction,'),
  ('45',  'Martial Attack,Melee,Reaction,'),
  ('87',  'Survival,'),
  ('103', 'Investigate,'),
  ('111', 'Attack Bonus,Martial Attack,Movement,'),
  ('180', 'Skill Bonus,Social,'),
  ('266', 'Beastcraft,Companion,'),
  ('307', 'History,Skill Bonus,'),
  ('327', 'Forgery,'),
  ('355', 'Insight,Perception,'),
  ('412', 'Haggle,Social,'),
  ('520', 'Appraise,'),
  ('539', 'Health,Recovery,'),
  ('540', 'Health,Health Increase,Recovery,'),
  ('648', 'Skill Bonus,'),
  ('662', 'Insight,Social,'),
  ('803', 'Arcana,Power,'),
  -- Category-assigned but still untagged
  ('798', 'Intimidate,Social,Skill Bonus,'),
  ('209', 'Stealth,'),
  ('332', 'Defense Increase,'),
  ('333', 'Defense Increase,'),
  ('334', 'Defense Increase,'),
  ('430', 'Evasion Increase,'),
  ('721', 'Evasion Increase,'),
  ('802', 'Athletics,Free Action,Speed,'),
  ('203', 'Hybrid,Martial Bonus,Potency Bonus,'),
  ('204', 'Ally,Technique,'),
  ('797', 'Damage Increase,Melee,Skill Bonus,'),
  ('801', 'Martial Attack,Prone,'),
  ('800', 'Appraise,Investigate,Melee,'),
  ('642', 'Martial Attack,Resolve,'),
  ('720', 'Evasion Increase,Martial Attack,'),
  ('270', 'Survival,'),
  ('298', 'Focus,Skill Bonus,'),
  ('358', 'Free Action,Movement,'),
  ('378', 'Duration Increase,'),
  ('390', 'Shapeshift,'),
  ('775', 'Shapeshift,'),
  ('445', 'Re-roll,'),
  ('524', 'Free Action,Movement,Speed,'),
  ('552', 'Duration Increase,'),
  ('553', 'Fortitude,Health,Self Heal,'),
  ('689', 'Defense Increase,Re-roll,'),
  ('690', 'Recovery,Resolve,'),
  ('799', 'Craft,Power,');

-- Preview count:
-- SELECT COUNT(*) FROM codex_feats f
-- JOIN feat_tag_phase3_proposals p ON p.id = f.id
-- WHERE f.tags IS NULL OR TRIM(f.tags) = '';

-- Applied 2026-07-03 (50 feats tagged, 0 untagged remaining):
-- UPDATE codex_feats f
-- SET tags = p.proposed_tags
-- FROM feat_tag_phase3_proposals p
-- WHERE f.id = p.id
--   AND (f.tags IS NULL OR TRIM(f.tags) = '');
