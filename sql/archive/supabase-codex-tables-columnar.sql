-- =============================================================================
-- Codex schema: tables with proper columns (CSV drag-and-drop ready)
-- =============================================================================
-- Aligns with src/docs/CODEX_SCHEMA_REFERENCE.md and codex_csv/ CSV headers.
-- Array-like fields are TEXT (comma-separated); app parses in API.
--
-- BEFORE RUNNING THE CREATES BELOW you must remove the old id+data tables.
-- Uncomment ONE of the two blocks below.
-- =============================================================================

-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS codex;

-- ----- Option A: Drop old codex tables (use if you will re-import from CSV) -----
DROP TABLE IF EXISTS codex.codex_creature_feats;
DROP TABLE IF EXISTS codex.codex_archetypes;
DROP TABLE IF EXISTS codex.codex_equipment;
DROP TABLE IF EXISTS codex.codex_properties;
DROP TABLE IF EXISTS codex.codex_parts;
DROP TABLE IF EXISTS codex.codex_traits;
DROP TABLE IF EXISTS codex.codex_species;
DROP TABLE IF EXISTS codex.codex_skills;
DROP TABLE IF EXISTS codex.codex_feats;
-- -----------------------------------------------------------------------------
-- 1. codex_feats (Codex - Feats.csv)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codex.codex_feats (
  id             TEXT PRIMARY KEY,
  name           TEXT,
  description    TEXT,
  req_desc       TEXT,
  ability_req     TEXT,
  abil_req_val    TEXT,
  skill_req       TEXT,
  skill_req_val   TEXT,
  feat_cat_req   TEXT,
  pow_abil_req   INTEGER,
  mart_abil_req   INTEGER,
  pow_prof_req   INTEGER,
  mart_prof_req   INTEGER,
  speed_req      INTEGER,
  feat_lvl       INTEGER,
  lvl_req        INTEGER,
  uses_per_rec   INTEGER,
  rec_period     TEXT,
  category       TEXT,
  ability        TEXT,
  tags           TEXT,
  char_feat      BOOLEAN,
  state_feat     BOOLEAN
);

-- -----------------------------------------------------------------------------
-- 2. codex_skills (Codex - Skills.csv) — CSV uses "base_skill"
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codex.codex_skills (
  id                  TEXT PRIMARY KEY,
  name                TEXT,
  description         TEXT,
  ability             TEXT,
  base_skill          TEXT,
  success_desc        TEXT,
  failure_desc        TEXT,
  ds_calc             TEXT,
  craft_failure_desc  TEXT,
  craft_success_desc  TEXT
);

-- -----------------------------------------------------------------------------
-- 3. codex_species (Codex - Species.csv)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codex.codex_species (
  id                TEXT PRIMARY KEY,
  name              TEXT,
  description       TEXT,
  type              TEXT,
  sizes             TEXT,
  skills            TEXT,
  species_traits     TEXT,
  ancestry_traits    TEXT,
  flaws             TEXT,
  characteristics   TEXT,
  ave_hgt_cm         NUMERIC,
  ave_wgt_kg         NUMERIC,
  adulthood_lifespan TEXT,
  languages         TEXT
);

-- -----------------------------------------------------------------------------
-- 4. codex_traits (Codex - Traits.csv)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codex.codex_traits (
  id                TEXT PRIMARY KEY,
  name              TEXT,
  description       TEXT,
  uses_per_rec      INTEGER,
  rec_period        TEXT,
  flaw              BOOLEAN,
  characteristic    BOOLEAN,
  option_trait_ids  TEXT
);

-- -----------------------------------------------------------------------------
-- 5. codex_parts (Codex - Parts.csv) — power & technique parts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codex.codex_parts (
  id          TEXT PRIMARY KEY,
  name        TEXT,
  description TEXT,
  category    TEXT,
  base_en     NUMERIC,
  base_tp     NUMERIC,
  op_1_desc   TEXT,
  op_1_en     NUMERIC,
  op_1_tp     NUMERIC,
  op_2_desc   TEXT,
  op_2_en     NUMERIC,
  op_2_tp     NUMERIC,
  op_3_desc   TEXT,
  op_3_en     NUMERIC,
  op_3_tp     NUMERIC,
  type        TEXT,
  mechanic    BOOLEAN,
  percentage  BOOLEAN,
  duration    BOOLEAN,
  defense     TEXT
);

-- -----------------------------------------------------------------------------
-- 6. codex_properties (Codex - Properties.csv)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codex.codex_properties (
  id          TEXT PRIMARY KEY,
  name        TEXT,
  description TEXT,
  base_ip     NUMERIC,
  base_tp     NUMERIC,
  base_c      NUMERIC,
  op_1_desc   TEXT,
  op_1_ip     NUMERIC,
  op_1_tp     NUMERIC,
  op_1_c      NUMERIC,
  type        TEXT,
  mechanic    BOOLEAN
);

-- -----------------------------------------------------------------------------
-- 7. codex_equipment (Codex - Equipment.csv)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codex.codex_equipment (
  id          TEXT PRIMARY KEY,
  name        TEXT,
  description TEXT,
  category    TEXT,
  currency    NUMERIC,
  rarity      TEXT
);

-- -----------------------------------------------------------------------------
-- 8. codex_archetypes (id, name, type, description per CODEX_SCHEMA_REFERENCE)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codex.codex_archetypes (
  id          TEXT PRIMARY KEY,
  name        TEXT,
  type        TEXT,
  description TEXT
);

-- -----------------------------------------------------------------------------
-- 9. codex_creature_feats (Codex - Creature_Feats.csv)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codex.codex_creature_feats (
  id           TEXT PRIMARY KEY,
  name         TEXT,
  description  TEXT,
  feat_points  NUMERIC,
  feat_lvl     INTEGER,
  lvl_req      INTEGER,
  mechanic     BOOLEAN
);

-- -----------------------------------------------------------------------------
-- RLS (same as current: public read for codex)
-- -----------------------------------------------------------------------------
ALTER TABLE codex.codex_feats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex feats" ON codex.codex_feats;
CREATE POLICY "Anyone can read codex feats" ON codex.codex_feats FOR SELECT TO public USING (true);

ALTER TABLE codex.codex_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex skills" ON codex.codex_skills;
CREATE POLICY "Anyone can read codex skills" ON codex.codex_skills FOR SELECT TO public USING (true);

ALTER TABLE codex.codex_species ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex species" ON codex.codex_species;
CREATE POLICY "Anyone can read codex species" ON codex.codex_species FOR SELECT TO public USING (true);

ALTER TABLE codex.codex_traits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex traits" ON codex.codex_traits;
CREATE POLICY "Anyone can read codex traits" ON codex.codex_traits FOR SELECT TO public USING (true);

ALTER TABLE codex.codex_parts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex parts" ON codex.codex_parts;
CREATE POLICY "Anyone can read codex parts" ON codex.codex_parts FOR SELECT TO public USING (true);

ALTER TABLE codex.codex_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex properties" ON codex.codex_properties;
CREATE POLICY "Anyone can read codex properties" ON codex.codex_properties FOR SELECT TO public USING (true);

ALTER TABLE codex.codex_equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex equipment" ON codex.codex_equipment;
CREATE POLICY "Anyone can read codex equipment" ON codex.codex_equipment FOR SELECT TO public USING (true);

ALTER TABLE codex.codex_archetypes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex archetypes" ON codex.codex_archetypes;
CREATE POLICY "Anyone can read codex archetypes" ON codex.codex_archetypes FOR SELECT TO public USING (true);

ALTER TABLE codex.codex_creature_feats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex creature feats" ON codex.codex_creature_feats;
CREATE POLICY "Anyone can read codex creature feats" ON codex.codex_creature_feats FOR SELECT TO public USING (true);
