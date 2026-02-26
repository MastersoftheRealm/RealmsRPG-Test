-- =============================================================================
-- Official Library in PUBLIC schema (columnar)
-- Use this for single-schema (public-only) Supabase. Creates official_* tables
-- in public and optionally backfills from public_* (id+data).
-- Run after public_* exist if migrating; or run standalone for fresh install.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- official_powers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.official_powers (
  id          TEXT PRIMARY KEY,
  name        TEXT,
  description TEXT,
  action_type TEXT,
  is_reaction BOOLEAN DEFAULT false,
  innate      BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ,
  payload     JSONB DEFAULT '{}'
);

-- -----------------------------------------------------------------------------
-- official_techniques
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.official_techniques (
  id           TEXT PRIMARY KEY,
  name         TEXT,
  description  TEXT,
  action_type  TEXT,
  weapon_name  TEXT,
  created_at   TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ,
  payload      JSONB DEFAULT '{}'
);

-- -----------------------------------------------------------------------------
-- official_items
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.official_items (
  id               TEXT PRIMARY KEY,
  name             TEXT,
  description      TEXT,
  type             TEXT,
  rarity           TEXT,
  armor_value      INTEGER,
  damage_reduction INTEGER,
  created_at       TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ,
  payload          JSONB DEFAULT '{}'
);

-- -----------------------------------------------------------------------------
-- official_creatures
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.official_creatures (
  id            TEXT PRIMARY KEY,
  name          TEXT,
  description   TEXT,
  level         INTEGER,
  type          TEXT,
  size          TEXT,
  hit_points    INTEGER,
  energy_points INTEGER,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ,
  payload       JSONB DEFAULT '{}'
);

-- -----------------------------------------------------------------------------
-- RLS: anyone can read official library
-- -----------------------------------------------------------------------------
ALTER TABLE public.official_powers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read official powers" ON public.official_powers;
CREATE POLICY "Anyone can read official powers" ON public.official_powers FOR SELECT TO public USING (true);

ALTER TABLE public.official_techniques ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read official techniques" ON public.official_techniques;
CREATE POLICY "Anyone can read official techniques" ON public.official_techniques FOR SELECT TO public USING (true);

ALTER TABLE public.official_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read official items" ON public.official_items;
CREATE POLICY "Anyone can read official items" ON public.official_items FOR SELECT TO public USING (true);

ALTER TABLE public.official_creatures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read official creatures" ON public.official_creatures;
CREATE POLICY "Anyone can read official creatures" ON public.official_creatures FOR SELECT TO public USING (true);

-- -----------------------------------------------------------------------------
-- Backfill from public_* (id+data) into official_* columnar
-- Run once when migrating; safe to run multiple times (upsert by id).
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'public_powers') THEN
    INSERT INTO public.official_powers (id, name, description, action_type, is_reaction, innate, created_at, updated_at, payload)
    SELECT
      p.id,
      p.data->>'name',
      p.data->>'description',
      COALESCE(p.data->>'actionType', p.data->>'action_type'),
      COALESCE((p.data->>'isReaction')::boolean, (p.data->>'is_reaction')::boolean, false),
      COALESCE((p.data->>'innate')::boolean, false),
      p.created_at,
      p.updated_at,
      COALESCE(p.data - 'name' - 'description' - 'actionType' - 'action_type' - 'isReaction' - 'is_reaction' - 'innate' - 'createdAt' - 'updatedAt' - 'id', '{}'::jsonb)
    FROM public.public_powers p
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      action_type = EXCLUDED.action_type,
      is_reaction = EXCLUDED.is_reaction,
      innate = EXCLUDED.innate,
      updated_at = EXCLUDED.updated_at,
      payload = EXCLUDED.payload;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'public_techniques') THEN
    INSERT INTO public.official_techniques (id, name, description, action_type, weapon_name, created_at, updated_at, payload)
    SELECT
      p.id,
      p.data->>'name',
      p.data->>'description',
      COALESCE(p.data->>'actionType', p.data->>'action_type'),
      COALESCE(p.data->>'weaponName', p.data->>'weapon_name'),
      p.created_at,
      p.updated_at,
      COALESCE(p.data - 'name' - 'description' - 'actionType' - 'action_type' - 'weaponName' - 'weapon_name' - 'createdAt' - 'updatedAt' - 'id', '{}'::jsonb)
    FROM public.public_techniques p
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      action_type = EXCLUDED.action_type,
      weapon_name = EXCLUDED.weapon_name,
      updated_at = EXCLUDED.updated_at,
      payload = EXCLUDED.payload;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'public_items') THEN
    INSERT INTO public.official_items (id, name, description, type, rarity, armor_value, damage_reduction, created_at, updated_at, payload)
    SELECT
      p.id,
      p.data->>'name',
      p.data->>'description',
      p.data->>'type',
      p.data->>'rarity',
      (p.data->>'armorValue')::integer,
      (p.data->>'damageReduction')::integer,
      p.created_at,
      p.updated_at,
      COALESCE(p.data - 'name' - 'description' - 'type' - 'rarity' - 'armorValue' - 'damageReduction' - 'createdAt' - 'updatedAt' - 'id', '{}'::jsonb)
    FROM public.public_items p
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      type = EXCLUDED.type,
      rarity = EXCLUDED.rarity,
      armor_value = EXCLUDED.armor_value,
      damage_reduction = EXCLUDED.damage_reduction,
      updated_at = EXCLUDED.updated_at,
      payload = EXCLUDED.payload;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'public_creatures') THEN
    INSERT INTO public.official_creatures (id, name, description, level, type, size, hit_points, energy_points, created_at, updated_at, payload)
    SELECT
      p.id,
      p.data->>'name',
      p.data->>'description',
      (p.data->>'level')::integer,
      p.data->>'type',
      p.data->>'size',
      (p.data->>'hitPoints')::integer,
      (p.data->>'energyPoints')::integer,
      p.created_at,
      p.updated_at,
      COALESCE(p.data - 'name' - 'description' - 'level' - 'type' - 'size' - 'hitPoints' - 'energyPoints' - 'createdAt' - 'updatedAt' - 'id' - 'created_at' - 'updated_at', '{}'::jsonb)
    FROM public.public_creatures p
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      level = EXCLUDED.level,
      type = EXCLUDED.type,
      size = EXCLUDED.size,
      hit_points = EXCLUDED.hit_points,
      energy_points = EXCLUDED.energy_points,
      updated_at = EXCLUDED.updated_at,
      payload = EXCLUDED.payload;
  END IF;
END $$;
