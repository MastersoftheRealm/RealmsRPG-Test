-- =============================================================================
-- User Library (columnar) — same column set as official_* + user_id
-- Run once when migrating from existing users.user_* tables (id, user_id, data).
-- Adds scalar columns + payload, backfills from data, drops data column.
-- user_species unchanged (still id, user_id, data).
-- If tables are already columnar (no "data" column), skip or run only ADD COLUMN IF NOT EXISTS.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- user_powers: add columns, backfill (if data exists), drop data
-- -----------------------------------------------------------------------------
ALTER TABLE users.user_powers
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS action_type TEXT,
  ADD COLUMN IF NOT EXISTS is_reaction BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS innate BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'users' AND table_name = 'user_powers' AND column_name = 'data') THEN
    UPDATE users.user_powers SET name = data->>'name', description = data->>'description', action_type = data->>'actionType', is_reaction = COALESCE((data->>'isReaction')::boolean, false), innate = COALESCE((data->>'innate')::boolean, false), payload = COALESCE(data - 'name' - 'description' - 'actionType' - 'isReaction' - 'innate' - 'createdAt' - 'updatedAt', '{}'::jsonb) WHERE data IS NOT NULL;
    ALTER TABLE users.user_powers DROP COLUMN data;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- user_techniques: add columns, backfill (if data exists), drop data
-- -----------------------------------------------------------------------------
ALTER TABLE users.user_techniques
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS action_type TEXT,
  ADD COLUMN IF NOT EXISTS weapon_name TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'users' AND table_name = 'user_techniques' AND column_name = 'data') THEN
    UPDATE users.user_techniques SET name = data->>'name', description = data->>'description', action_type = data->>'actionType', weapon_name = data->>'weaponName', payload = COALESCE(data - 'name' - 'description' - 'actionType' - 'weaponName' - 'createdAt' - 'updatedAt', '{}'::jsonb) WHERE data IS NOT NULL;
    ALTER TABLE users.user_techniques DROP COLUMN data;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- user_items: add columns, backfill (if data exists), drop data
-- -----------------------------------------------------------------------------
ALTER TABLE users.user_items
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS rarity TEXT,
  ADD COLUMN IF NOT EXISTS armor_value INTEGER,
  ADD COLUMN IF NOT EXISTS damage_reduction INTEGER,
  ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'users' AND table_name = 'user_items' AND column_name = 'data') THEN
    UPDATE users.user_items SET name = data->>'name', description = data->>'description', type = data->>'type', rarity = data->>'rarity', armor_value = (data->>'armorValue')::integer, damage_reduction = (data->>'damageReduction')::integer, payload = COALESCE(data - 'name' - 'description' - 'type' - 'rarity' - 'armorValue' - 'damageReduction' - 'createdAt' - 'updatedAt', '{}'::jsonb) WHERE data IS NOT NULL;
    ALTER TABLE users.user_items DROP COLUMN data;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- user_creatures: add columns, backfill (if data exists), drop data
-- -----------------------------------------------------------------------------
ALTER TABLE users.user_creatures
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS level INTEGER,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS size TEXT,
  ADD COLUMN IF NOT EXISTS hit_points INTEGER,
  ADD COLUMN IF NOT EXISTS energy_points INTEGER,
  ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'users' AND table_name = 'user_creatures' AND column_name = 'data') THEN
    UPDATE users.user_creatures SET name = data->>'name', description = data->>'description', level = (data->>'level')::integer, type = data->>'type', size = data->>'size', hit_points = (data->>'hitPoints')::integer, energy_points = (data->>'energyPoints')::integer, payload = COALESCE(data - 'name' - 'description' - 'level' - 'type' - 'size' - 'hitPoints' - 'energyPoints' - 'createdAt' - 'updatedAt', '{}'::jsonb) WHERE data IS NOT NULL;
    ALTER TABLE users.user_creatures DROP COLUMN data;
  END IF;
END $$;
