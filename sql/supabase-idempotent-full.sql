-- =============================================================================
-- RealmsRPG — Idempotent full setup for Supabase (schemas, tables, RLS, Realtime)
-- =============================================================================
-- Paste this entire file into Supabase Dashboard → SQL Editor → Run.
--
-- Safe to run multiple times: uses IF NOT EXISTS / DROP IF EXISTS / ADD IF NOT EXISTS.
-- Does NOT drop existing data. You do not need to track what is already applied.
--
-- This script:
--   • Creates schemas: users, campaigns, codex, encounters
--   • Creates all tables in the correct schema (if not present)
--   • Adds missing columns (e.g. user_profiles.role) if not present
--   • Recreates RLS policies (drops then creates so re-run is safe)
--   • Grants Realtime publication and USAGE on schemas
--
-- After this, run sql/supabase-storage-policies.sql once for Storage RLS
-- (portraits and profile-pictures buckets).
--
-- If your DB previously had tables in the "public" schema only, this creates
-- the correct structure in users/campaigns/codex/encounters; it does not move
-- or copy data from public. Use a one-off migration to
-- move data if needed.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SCHEMAS
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS campaigns;
CREATE SCHEMA IF NOT EXISTS codex;
CREATE SCHEMA IF NOT EXISTS encounters;

-- -----------------------------------------------------------------------------
-- 2. ENUMS (users schema)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'users' AND t.typname = 'UserRole') THEN
    CREATE TYPE users."UserRole" AS ENUM ('new_player', 'playtester', 'developer', 'admin');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. USERS SCHEMA TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users.user_profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  username TEXT UNIQUE,
  photo_url TEXT,
  role users."UserRole" NOT NULL DEFAULT 'new_player',
  last_username_change TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL
);
ALTER TABLE users.user_profiles ADD COLUMN IF NOT EXISTS role users."UserRole" NOT NULL DEFAULT 'new_player';

CREATE TABLE IF NOT EXISTS users.usernames (
  username TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users.user_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users.characters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users.user_profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP(3),
  updated_at TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS users.user_powers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users.user_profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP(3),
  updated_at TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS users.user_techniques (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users.user_profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP(3),
  updated_at TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS users.user_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users.user_profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP(3),
  updated_at TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS users.user_creatures (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users.user_profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP(3),
  updated_at TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS users.user_species (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users.user_profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP(3),
  updated_at TIMESTAMP(3)
);

-- Indexes (users)
CREATE INDEX IF NOT EXISTS user_profiles_username_key ON users.user_profiles(username);
CREATE INDEX IF NOT EXISTS characters_user_id_idx ON users.characters(user_id);
CREATE INDEX IF NOT EXISTS characters_user_id_updated_at_idx ON users.characters(user_id, updated_at);
CREATE INDEX IF NOT EXISTS user_powers_user_id_idx ON users.user_powers(user_id);
CREATE INDEX IF NOT EXISTS user_techniques_user_id_idx ON users.user_techniques(user_id);
CREATE INDEX IF NOT EXISTS user_items_user_id_idx ON users.user_items(user_id);
CREATE INDEX IF NOT EXISTS user_creatures_user_id_idx ON users.user_creatures(user_id);
CREATE INDEX IF NOT EXISTS user_species_user_id_idx ON users.user_species(user_id);

-- -----------------------------------------------------------------------------
-- 4. CAMPAIGNS SCHEMA TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns.campaigns (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT NOT NULL,
  characters JSONB NOT NULL,
  "memberIds" JSONB NOT NULL,
  owner_username TEXT,
  created_at TIMESTAMP(3),
  updated_at TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS campaigns.campaign_members (
  campaign_id TEXT NOT NULL REFERENCES campaigns.campaigns(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  PRIMARY KEY (campaign_id, user_id)
);

CREATE TABLE IF NOT EXISTS campaigns.campaign_rolls (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns.campaigns(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS campaigns_owner_id_idx ON campaigns.campaigns(owner_id);
CREATE INDEX IF NOT EXISTS campaigns_invite_code_idx ON campaigns.campaigns(invite_code);
CREATE INDEX IF NOT EXISTS campaign_members_user_id_idx ON campaigns.campaign_members(user_id);
CREATE INDEX IF NOT EXISTS campaign_members_campaign_id_idx ON campaigns.campaign_members(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_rolls_campaign_id_idx ON campaigns.campaign_rolls(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_rolls_campaign_id_created_at_idx ON campaigns.campaign_rolls(campaign_id, created_at);

-- -----------------------------------------------------------------------------
-- 5. ENCOUNTERS SCHEMA TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS encounters.encounters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP(3),
  updated_at TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS encounters_user_id_idx ON encounters.encounters(user_id);
CREATE INDEX IF NOT EXISTS encounters_user_id_updated_at_idx ON encounters.encounters(user_id, updated_at);

-- -----------------------------------------------------------------------------
-- 6. CODEX SCHEMA TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codex.codex_feats (id TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS codex.codex_skills (id TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS codex.codex_species (id TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS codex.codex_traits (id TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS codex.codex_parts (id TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS codex.codex_properties (id TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS codex.codex_equipment (id TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS codex.codex_archetypes (id TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS codex.codex_creature_feats (id TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS codex.core_rules (id TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMP(3));

CREATE TABLE IF NOT EXISTS codex.public_powers (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP(3),
  updated_at TIMESTAMP(3)
);
CREATE TABLE IF NOT EXISTS codex.public_techniques (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP(3),
  updated_at TIMESTAMP(3)
);
CREATE TABLE IF NOT EXISTS codex.public_items (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP(3),
  updated_at TIMESTAMP(3)
);
CREATE TABLE IF NOT EXISTS codex.public_creatures (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP(3),
  updated_at TIMESTAMP(3)
);

-- -----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (drop existing then create so re-run is safe)
-- -----------------------------------------------------------------------------

-- users.user_profiles
ALTER TABLE users.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON users.user_profiles;
CREATE POLICY "Users can read own profile" ON users.user_profiles FOR SELECT TO authenticated USING (id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can insert own profile" ON users.user_profiles;
CREATE POLICY "Users can insert own profile" ON users.user_profiles FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can update own profile" ON users.user_profiles;
CREATE POLICY "Users can update own profile" ON users.user_profiles FOR UPDATE TO authenticated USING (id = (SELECT auth.uid())::text) WITH CHECK (id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can delete own profile" ON users.user_profiles;
CREATE POLICY "Users can delete own profile" ON users.user_profiles FOR DELETE TO authenticated USING (id = (SELECT auth.uid())::text);

-- users.usernames
ALTER TABLE users.usernames ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read usernames" ON users.usernames;
CREATE POLICY "Authenticated can read usernames" ON users.usernames FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert own username" ON users.usernames;
CREATE POLICY "Users can insert own username" ON users.usernames FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can update own username" ON users.usernames;
CREATE POLICY "Users can update own username" ON users.usernames FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())::text) WITH CHECK (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can delete own username" ON users.usernames;
CREATE POLICY "Users can delete own username" ON users.usernames FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid())::text);

-- users.characters
ALTER TABLE users.characters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own characters" ON users.characters;
CREATE POLICY "Users can read own characters" ON users.characters FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can insert own characters" ON users.characters;
CREATE POLICY "Users can insert own characters" ON users.characters FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can update own characters" ON users.characters;
CREATE POLICY "Users can update own characters" ON users.characters FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())::text) WITH CHECK (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can delete own characters" ON users.characters;
CREATE POLICY "Users can delete own characters" ON users.characters FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid())::text);

-- users.user_powers, user_techniques, user_items, user_creatures (same pattern)
ALTER TABLE users.user_powers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own powers" ON users.user_powers;
CREATE POLICY "Users can read own powers" ON users.user_powers FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can insert own powers" ON users.user_powers;
CREATE POLICY "Users can insert own powers" ON users.user_powers FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can update own powers" ON users.user_powers;
CREATE POLICY "Users can update own powers" ON users.user_powers FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())::text) WITH CHECK (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can delete own powers" ON users.user_powers;
CREATE POLICY "Users can delete own powers" ON users.user_powers FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid())::text);

ALTER TABLE users.user_techniques ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own techniques" ON users.user_techniques;
CREATE POLICY "Users can read own techniques" ON users.user_techniques FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can insert own techniques" ON users.user_techniques;
CREATE POLICY "Users can insert own techniques" ON users.user_techniques FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can update own techniques" ON users.user_techniques;
CREATE POLICY "Users can update own techniques" ON users.user_techniques FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())::text) WITH CHECK (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can delete own techniques" ON users.user_techniques;
CREATE POLICY "Users can delete own techniques" ON users.user_techniques FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid())::text);

ALTER TABLE users.user_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own items" ON users.user_items;
CREATE POLICY "Users can read own items" ON users.user_items FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can insert own items" ON users.user_items;
CREATE POLICY "Users can insert own items" ON users.user_items FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can update own items" ON users.user_items;
CREATE POLICY "Users can update own items" ON users.user_items FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())::text) WITH CHECK (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can delete own items" ON users.user_items;
CREATE POLICY "Users can delete own items" ON users.user_items FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid())::text);

ALTER TABLE users.user_creatures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own creatures" ON users.user_creatures;
CREATE POLICY "Users can read own creatures" ON users.user_creatures FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can insert own creatures" ON users.user_creatures;
CREATE POLICY "Users can insert own creatures" ON users.user_creatures FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can update own creatures" ON users.user_creatures;
CREATE POLICY "Users can update own creatures" ON users.user_creatures FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())::text) WITH CHECK (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can delete own creatures" ON users.user_creatures;
CREATE POLICY "Users can delete own creatures" ON users.user_creatures FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid())::text);

ALTER TABLE users.user_species ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own species" ON users.user_species;
CREATE POLICY "Users can read own species" ON users.user_species FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can insert own species" ON users.user_species;
CREATE POLICY "Users can insert own species" ON users.user_species FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can update own species" ON users.user_species;
CREATE POLICY "Users can update own species" ON users.user_species FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())::text) WITH CHECK (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can delete own species" ON users.user_species;
CREATE POLICY "Users can delete own species" ON users.user_species FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid())::text);

-- campaigns.campaigns
ALTER TABLE campaigns.campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can do anything on own campaigns" ON campaigns.campaigns;
CREATE POLICY "Owner can do anything on own campaigns" ON campaigns.campaigns FOR ALL TO authenticated USING (owner_id = (SELECT auth.uid())::text) WITH CHECK (owner_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Members can read and update campaigns they belong to" ON campaigns.campaigns;
CREATE POLICY "Members can read and update campaigns they belong to" ON campaigns.campaigns FOR SELECT TO authenticated USING ("memberIds"::jsonb @> jsonb_build_array((SELECT auth.uid())::text));
DROP POLICY IF EXISTS "Members can update campaigns they belong to" ON campaigns.campaigns;
CREATE POLICY "Members can update campaigns they belong to" ON campaigns.campaigns FOR UPDATE TO authenticated USING ("memberIds"::jsonb @> jsonb_build_array((SELECT auth.uid())::text)) WITH CHECK ("memberIds"::jsonb @> jsonb_build_array((SELECT auth.uid())::text));

-- campaigns.campaign_rolls
ALTER TABLE campaigns.campaign_rolls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Campaign participants can read rolls" ON campaigns.campaign_rolls;
CREATE POLICY "Campaign participants can read rolls" ON campaigns.campaign_rolls FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM campaigns.campaigns c WHERE c.id = campaign_rolls.campaign_id AND (c.owner_id = (SELECT auth.uid())::text OR c."memberIds"::jsonb @> jsonb_build_array((SELECT auth.uid())::text))));
DROP POLICY IF EXISTS "Campaign participants can insert rolls" ON campaigns.campaign_rolls;
CREATE POLICY "Campaign participants can insert rolls" ON campaigns.campaign_rolls FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM campaigns.campaigns c WHERE c.id = campaign_rolls.campaign_id AND (c.owner_id = (SELECT auth.uid())::text OR c."memberIds"::jsonb @> jsonb_build_array((SELECT auth.uid())::text))));
DROP POLICY IF EXISTS "Campaign participants can update rolls" ON campaigns.campaign_rolls;
CREATE POLICY "Campaign participants can update rolls" ON campaigns.campaign_rolls FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM campaigns.campaigns c WHERE c.id = campaign_rolls.campaign_id AND (c.owner_id = (SELECT auth.uid())::text OR c."memberIds"::jsonb @> jsonb_build_array((SELECT auth.uid())::text)))) WITH CHECK (EXISTS (SELECT 1 FROM campaigns.campaigns c WHERE c.id = campaign_rolls.campaign_id AND (c.owner_id = (SELECT auth.uid())::text OR c."memberIds"::jsonb @> jsonb_build_array((SELECT auth.uid())::text))));
DROP POLICY IF EXISTS "Campaign participants can delete rolls" ON campaigns.campaign_rolls;
CREATE POLICY "Campaign participants can delete rolls" ON campaigns.campaign_rolls FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM campaigns.campaigns c WHERE c.id = campaign_rolls.campaign_id AND (c.owner_id = (SELECT auth.uid())::text OR c."memberIds"::jsonb @> jsonb_build_array((SELECT auth.uid())::text))));

-- encounters.encounters
ALTER TABLE encounters.encounters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own encounters" ON encounters.encounters;
CREATE POLICY "Users can read own encounters" ON encounters.encounters FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can insert own encounters" ON encounters.encounters;
CREATE POLICY "Users can insert own encounters" ON encounters.encounters FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can update own encounters" ON encounters.encounters;
CREATE POLICY "Users can update own encounters" ON encounters.encounters FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())::text) WITH CHECK (user_id = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Users can delete own encounters" ON encounters.encounters;
CREATE POLICY "Users can delete own encounters" ON encounters.encounters FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid())::text);

-- codex (read-only for all; writes via service role)
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
ALTER TABLE codex.public_powers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read public powers" ON codex.public_powers;
CREATE POLICY "Anyone can read public powers" ON codex.public_powers FOR SELECT TO public USING (true);
ALTER TABLE codex.public_techniques ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read public techniques" ON codex.public_techniques;
CREATE POLICY "Anyone can read public techniques" ON codex.public_techniques FOR SELECT TO public USING (true);
ALTER TABLE codex.public_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read public items" ON codex.public_items;
CREATE POLICY "Anyone can read public items" ON codex.public_items FOR SELECT TO public USING (true);
ALTER TABLE codex.public_creatures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read public creatures" ON codex.public_creatures;
CREATE POLICY "Anyone can read public creatures" ON codex.public_creatures FOR SELECT TO public USING (true);
ALTER TABLE codex.core_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read core rules" ON codex.core_rules;
CREATE POLICY "Anyone can read core rules" ON codex.core_rules FOR SELECT TO public USING (true);

-- -----------------------------------------------------------------------------
-- 8. REALTIME: schema USAGE + publication (idempotent where possible)
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA campaigns TO anon, authenticated, service_role, authenticator;
GRANT USAGE ON SCHEMA users TO anon, authenticated, service_role, authenticator;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'campaigns' AND tablename = 'campaign_rolls') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE campaigns.campaign_rolls;
  END IF;
END $$;
GRANT SELECT ON campaigns.campaign_rolls TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'users' AND tablename = 'characters') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users.characters;
  END IF;
END $$;
GRANT SELECT ON users.characters TO authenticated;

-- -----------------------------------------------------------------------------
-- DONE. Run sql/supabase-storage-policies.sql for Storage RLS (portraits, profile-pictures).
-- -----------------------------------------------------------------------------
