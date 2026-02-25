-- =============================================================================
-- Official Library (columnar) — admin-curated, browsable by all users
-- Replaces public_* with same schema as planned for user library (scalars + payload JSONB).
-- Run after public_* exist if migrating; or run standalone for fresh install.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS codex;

-- -----------------------------------------------------------------------------
-- official_powers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codex.official_powers (
  id          TEXT PRIMARY KEY,
  name        TEXT,
  description TEXT,
  action_type TEXT,
  is_reaction BOOLEAN DEFAULT false,
  innate      BOOLEAN DEFAULT false,
  created_at  TIMESTAMP(3),
  updated_at  TIMESTAMP(3),
  payload     JSONB DEFAULT '{}'
);

-- -----------------------------------------------------------------------------
-- official_techniques
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codex.official_techniques (
  id           TEXT PRIMARY KEY,
  name         TEXT,
  description  TEXT,
  action_type  TEXT,
  weapon_name  TEXT,
  created_at   TIMESTAMP(3),
  updated_at   TIMESTAMP(3),
  payload      JSONB DEFAULT '{}'
);

-- -----------------------------------------------------------------------------
-- official_items
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codex.official_items (
  id               TEXT PRIMARY KEY,
  name             TEXT,
  description      TEXT,
  type             TEXT,
  rarity           TEXT,
  armor_value      INTEGER,
  damage_reduction INTEGER,
  created_at       TIMESTAMP(3),
  updated_at       TIMESTAMP(3),
  payload          JSONB DEFAULT '{}'
);

-- -----------------------------------------------------------------------------
-- official_creatures
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codex.official_creatures (
  id            TEXT PRIMARY KEY,
  name          TEXT,
  description   TEXT,
  level         INTEGER,
  type          TEXT,
  size          TEXT,
  hit_points    INTEGER,
  energy_points INTEGER,
  created_at    TIMESTAMP(3),
  updated_at    TIMESTAMP(3),
  payload       JSONB DEFAULT '{}'
);

-- -----------------------------------------------------------------------------
-- RLS: anyone can read official library
-- -----------------------------------------------------------------------------
ALTER TABLE codex.official_powers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read official powers" ON codex.official_powers;
CREATE POLICY "Anyone can read official powers" ON codex.official_powers FOR SELECT TO public USING (true);

ALTER TABLE codex.official_techniques ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read official techniques" ON codex.official_techniques;
CREATE POLICY "Anyone can read official techniques" ON codex.official_techniques FOR SELECT TO public USING (true);

ALTER TABLE codex.official_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read official items" ON codex.official_items;
CREATE POLICY "Anyone can read official items" ON codex.official_items FOR SELECT TO public USING (true);

ALTER TABLE codex.official_creatures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read official creatures" ON codex.official_creatures;
CREATE POLICY "Anyone can read official creatures" ON codex.official_creatures FOR SELECT TO public USING (true);

-- Note: INSERT/UPDATE/DELETE on official_* should be restricted to admin (e.g. via app using service role or admin check in API).
