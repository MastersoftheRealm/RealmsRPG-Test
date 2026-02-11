-- =============================================================================
-- RealmsRPG — RLS Policies for Supabase
-- =============================================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Assumes tables are in schemas: users, campaigns, codex, encounters
-- auth.uid() = Supabase Auth user ID (matches user_profiles.id)
-- Columns are text; use auth.uid()::text for comparisons
-- =============================================================================

-- -----------------------------------------------------------------------------
-- USERS SCHEMA
-- -----------------------------------------------------------------------------

-- user_profiles: Users can only access their own profile
ALTER TABLE users.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
ON users.user_profiles FOR SELECT
TO authenticated
USING (id = (select auth.uid())::text);

CREATE POLICY "Users can insert own profile"
ON users.user_profiles FOR INSERT
TO authenticated
WITH CHECK (id = (select auth.uid())::text);

CREATE POLICY "Users can update own profile"
ON users.user_profiles FOR UPDATE
TO authenticated
USING (id = (select auth.uid())::text)
WITH CHECK (id = (select auth.uid())::text);

CREATE POLICY "Users can delete own profile"
ON users.user_profiles FOR DELETE
TO authenticated
USING (id = (select auth.uid())::text);

-- usernames: Used for lookup; authenticated users can read (profile display);
-- only owner can insert/update/delete (username changes)
ALTER TABLE users.usernames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read usernames"
ON users.usernames FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own username"
ON users.usernames FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can update own username"
ON users.usernames FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid())::text)
WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can delete own username"
ON users.usernames FOR DELETE
TO authenticated
USING (user_id = (select auth.uid())::text);

-- characters: User owns their characters
ALTER TABLE users.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own characters"
ON users.characters FOR SELECT
TO authenticated
USING (user_id = (select auth.uid())::text);

CREATE POLICY "Users can insert own characters"
ON users.characters FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can update own characters"
ON users.characters FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid())::text)
WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can delete own characters"
ON users.characters FOR DELETE
TO authenticated
USING (user_id = (select auth.uid())::text);

-- user_powers: User library
ALTER TABLE users.user_powers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own powers"
ON users.user_powers FOR SELECT
TO authenticated
USING (user_id = (select auth.uid())::text);

CREATE POLICY "Users can insert own powers"
ON users.user_powers FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can update own powers"
ON users.user_powers FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid())::text)
WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can delete own powers"
ON users.user_powers FOR DELETE
TO authenticated
USING (user_id = (select auth.uid())::text);

-- user_techniques: User library
ALTER TABLE users.user_techniques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own techniques"
ON users.user_techniques FOR SELECT
TO authenticated
USING (user_id = (select auth.uid())::text);

CREATE POLICY "Users can insert own techniques"
ON users.user_techniques FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can update own techniques"
ON users.user_techniques FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid())::text)
WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can delete own techniques"
ON users.user_techniques FOR DELETE
TO authenticated
USING (user_id = (select auth.uid())::text);

-- user_items: User library
ALTER TABLE users.user_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own items"
ON users.user_items FOR SELECT
TO authenticated
USING (user_id = (select auth.uid())::text);

CREATE POLICY "Users can insert own items"
ON users.user_items FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can update own items"
ON users.user_items FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid())::text)
WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can delete own items"
ON users.user_items FOR DELETE
TO authenticated
USING (user_id = (select auth.uid())::text);

-- user_creatures: User library
ALTER TABLE users.user_creatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own creatures"
ON users.user_creatures FOR SELECT
TO authenticated
USING (user_id = (select auth.uid())::text);

CREATE POLICY "Users can insert own creatures"
ON users.user_creatures FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can update own creatures"
ON users.user_creatures FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid())::text)
WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can delete own creatures"
ON users.user_creatures FOR DELETE
TO authenticated
USING (user_id = (select auth.uid())::text);

-- -----------------------------------------------------------------------------
-- CAMPAIGNS SCHEMA
-- -----------------------------------------------------------------------------
-- Campaigns: owner or member (memberIds contains auth.uid()::text)
-- Campaign rolls: only campaign participants can read/insert
-- -----------------------------------------------------------------------------

-- campaigns: Owner has full access; members can read and update (e.g. add chars)
ALTER TABLE campaigns.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can do anything on own campaigns"
ON campaigns.campaigns FOR ALL
TO authenticated
USING (owner_id = (select auth.uid())::text)
WITH CHECK (owner_id = (select auth.uid())::text);

CREATE POLICY "Members can read and update campaigns they belong to"
ON campaigns.campaigns FOR SELECT
TO authenticated
USING ("memberIds"::jsonb @> jsonb_build_array((select auth.uid())::text));

CREATE POLICY "Members can update campaigns they belong to"
ON campaigns.campaigns FOR UPDATE
TO authenticated
USING ("memberIds"::jsonb @> jsonb_build_array((select auth.uid())::text))
WITH CHECK ("memberIds"::jsonb @> jsonb_build_array((select auth.uid())::text));

-- campaign_rolls: Only campaign owner or members can access
-- (Requires subquery to check campaign membership)
ALTER TABLE campaigns.campaign_rolls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign participants can read rolls"
ON campaigns.campaign_rolls FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns.campaigns c
    WHERE c.id = campaign_rolls.campaign_id
    AND (c.owner_id = (select auth.uid())::text OR c."memberIds"::jsonb @> jsonb_build_array((select auth.uid())::text))
  )
);

CREATE POLICY "Campaign participants can insert rolls"
ON campaigns.campaign_rolls FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campaigns.campaigns c
    WHERE c.id = campaign_rolls.campaign_id
    AND (c.owner_id = (select auth.uid())::text OR c."memberIds"::jsonb @> jsonb_build_array((select auth.uid())::text))
  )
);

CREATE POLICY "Campaign participants can update rolls"
ON campaigns.campaign_rolls FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns.campaigns c
    WHERE c.id = campaign_rolls.campaign_id
    AND (c.owner_id = (select auth.uid())::text OR c."memberIds"::jsonb @> jsonb_build_array((select auth.uid())::text))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campaigns.campaigns c
    WHERE c.id = campaign_rolls.campaign_id
    AND (c.owner_id = (select auth.uid())::text OR c."memberIds"::jsonb @> jsonb_build_array((select auth.uid())::text))
  )
);

CREATE POLICY "Campaign participants can delete rolls"
ON campaigns.campaign_rolls FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns.campaigns c
    WHERE c.id = campaign_rolls.campaign_id
    AND (c.owner_id = (select auth.uid())::text OR c."memberIds"::jsonb @> jsonb_build_array((select auth.uid())::text))
  )
);

-- -----------------------------------------------------------------------------
-- ENCOUNTERS SCHEMA
-- -----------------------------------------------------------------------------

ALTER TABLE encounters.encounters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own encounters"
ON encounters.encounters FOR SELECT
TO authenticated
USING (user_id = (select auth.uid())::text);

CREATE POLICY "Users can insert own encounters"
ON encounters.encounters FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can update own encounters"
ON encounters.encounters FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid())::text)
WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can delete own encounters"
ON encounters.encounters FOR DELETE
TO authenticated
USING (user_id = (select auth.uid())::text);

-- -----------------------------------------------------------------------------
-- CODEX SCHEMA
-- -----------------------------------------------------------------------------
-- Reference data: public read for all (including anon for Codex browse).
-- Writes (INSERT/UPDATE/DELETE) only via service role or migrations;
-- no policies for write = only bypass (service role) can write.
-- -----------------------------------------------------------------------------

-- codex_feats
ALTER TABLE codex.codex_feats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read codex feats"
ON codex.codex_feats FOR SELECT
TO public
USING (true);

-- codex_skills
ALTER TABLE codex.codex_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read codex skills"
ON codex.codex_skills FOR SELECT
TO public
USING (true);

-- codex_species
ALTER TABLE codex.codex_species ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read codex species"
ON codex.codex_species FOR SELECT
TO public
USING (true);

-- codex_traits
ALTER TABLE codex.codex_traits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read codex traits"
ON codex.codex_traits FOR SELECT
TO public
USING (true);

-- codex_parts
ALTER TABLE codex.codex_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read codex parts"
ON codex.codex_parts FOR SELECT
TO public
USING (true);

-- codex_properties
ALTER TABLE codex.codex_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read codex properties"
ON codex.codex_properties FOR SELECT
TO public
USING (true);

-- codex_equipment
ALTER TABLE codex.codex_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read codex equipment"
ON codex.codex_equipment FOR SELECT
TO public
USING (true);

-- codex_archetypes
ALTER TABLE codex.codex_archetypes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read codex archetypes"
ON codex.codex_archetypes FOR SELECT
TO public
USING (true);

-- codex_creature_feats
ALTER TABLE codex.codex_creature_feats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read codex creature feats"
ON codex.codex_creature_feats FOR SELECT
TO public
USING (true);

-- public_powers, public_techniques, public_items, public_creatures
-- Admin-curated; public read, write via service role only
ALTER TABLE codex.public_powers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public powers"
ON codex.public_powers FOR SELECT
TO public
USING (true);

ALTER TABLE codex.public_techniques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public techniques"
ON codex.public_techniques FOR SELECT
TO public
USING (true);

ALTER TABLE codex.public_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public items"
ON codex.public_items FOR SELECT
TO public
USING (true);

ALTER TABLE codex.public_creatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public creatures"
ON codex.public_creatures FOR SELECT
TO public
USING (true);

-- core_rules: Admin-configured game rules; anyone can read, writes via service role only
ALTER TABLE codex.core_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read core rules"
ON codex.core_rules FOR SELECT
TO public
USING (true);

-- =============================================================================
-- REALTIME PUBLICATION (campaign_rolls)
-- =============================================================================
-- Enable Postgres Changes for campaign_rolls so clients can subscribe via
-- Supabase Realtime. Run once in Supabase SQL Editor.
-- See: https://supabase.com/docs/guides/realtime/postgres-changes
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE campaigns.campaign_rolls;

-- Grant SELECT to authenticated so Realtime can authorize changes (private schemas)
GRANT SELECT ON campaigns.campaign_rolls TO authenticated;

-- characters: for HP/EN real-time sync from character sheet to encounter combatants
ALTER PUBLICATION supabase_realtime ADD TABLE users.characters;
GRANT SELECT ON users.characters TO authenticated;

-- =============================================================================
-- DONE
-- =============================================================================
-- Codex and public_* tables: no INSERT/UPDATE/DELETE policies.
-- Writes go through Prisma with DATABASE_URL (direct Postgres or service role),
-- which bypasses RLS. Only read is exposed via RLS for Supabase client usage.
-- =============================================================================
