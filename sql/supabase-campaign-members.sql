-- =============================================================================
-- Campaign Members table — replace memberIds JSONB with normalized table
-- Run after campaigns.campaigns exists. Backfills from memberIds; updates RLS
-- to use campaign_members for membership checks.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- campaign_members table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns.campaign_members (
  campaign_id TEXT NOT NULL REFERENCES campaigns.campaigns(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  PRIMARY KEY (campaign_id, user_id)
);

CREATE INDEX IF NOT EXISTS campaign_members_user_id_idx ON campaigns.campaign_members(user_id);
CREATE INDEX IF NOT EXISTS campaign_members_campaign_id_idx ON campaigns.campaign_members(campaign_id);

-- -----------------------------------------------------------------------------
-- Backfill from campaigns.memberIds (idempotent: only insert missing)
-- -----------------------------------------------------------------------------
INSERT INTO campaigns.campaign_members (campaign_id, user_id)
SELECT c.id, elem
FROM campaigns.campaigns c,
     jsonb_array_elements_text(c."memberIds") AS elem
WHERE c."memberIds" IS NOT NULL
  AND jsonb_typeof(c."memberIds") = 'array'
  AND jsonb_array_length(c."memberIds") > 0
ON CONFLICT (campaign_id, user_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- RLS: campaign_members
-- Users can read their own rows; campaign owner can read all members;
-- Owner can insert/delete; user can insert self (join via invite).
-- -----------------------------------------------------------------------------
ALTER TABLE campaigns.campaign_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own membership" ON campaigns.campaign_members;
CREATE POLICY "Users can read own membership" ON campaigns.campaign_members
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Campaign owner can read members" ON campaigns.campaign_members;
CREATE POLICY "Campaign owner can read members" ON campaigns.campaign_members
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM campaigns.campaigns c WHERE c.id = campaign_members.campaign_id AND c.owner_id = (SELECT auth.uid())::text));

DROP POLICY IF EXISTS "Owner or self can insert member" ON campaigns.campaign_members;
CREATE POLICY "Owner or self can insert member" ON campaigns.campaign_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())::text
    OR EXISTS (SELECT 1 FROM campaigns.campaigns c WHERE c.id = campaign_members.campaign_id AND c.owner_id = (SELECT auth.uid())::text)
  );

DROP POLICY IF EXISTS "Campaign owner can delete members" ON campaigns.campaign_members;
CREATE POLICY "Campaign owner can delete members" ON campaigns.campaign_members
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM campaigns.campaigns c WHERE c.id = campaign_members.campaign_id AND c.owner_id = (SELECT auth.uid())::text));

-- Allow member to remove themselves
DROP POLICY IF EXISTS "Member can remove self" ON campaigns.campaign_members;
CREATE POLICY "Member can remove self" ON campaigns.campaign_members
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

-- -----------------------------------------------------------------------------
-- RLS: campaigns — switch from memberIds to campaign_members
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can read and update campaigns they belong to" ON campaigns.campaigns;
DROP POLICY IF EXISTS "Members can update campaigns they belong to" ON campaigns.campaigns;

CREATE POLICY "Members can read campaigns they belong to" ON campaigns.campaigns
  FOR SELECT TO authenticated
  USING (
    owner_id = (SELECT auth.uid())::text
    OR EXISTS (SELECT 1 FROM campaigns.campaign_members m WHERE m.campaign_id = campaigns.id AND m.user_id = (SELECT auth.uid())::text)
  );

CREATE POLICY "Members can update campaigns they belong to" ON campaigns.campaigns
  FOR UPDATE TO authenticated
  USING (
    owner_id = (SELECT auth.uid())::text
    OR EXISTS (SELECT 1 FROM campaigns.campaign_members m WHERE m.campaign_id = campaigns.id AND m.user_id = (SELECT auth.uid())::text)
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid())::text
    OR EXISTS (SELECT 1 FROM campaigns.campaign_members m WHERE m.campaign_id = campaigns.id AND m.user_id = (SELECT auth.uid())::text)
  );

-- -----------------------------------------------------------------------------
-- RLS: campaign_rolls — use campaign_members for participant check
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Campaign participants can read rolls" ON campaigns.campaign_rolls;
DROP POLICY IF EXISTS "Campaign participants can insert rolls" ON campaigns.campaign_rolls;
DROP POLICY IF EXISTS "Campaign participants can update rolls" ON campaigns.campaign_rolls;
DROP POLICY IF EXISTS "Campaign participants can delete rolls" ON campaigns.campaign_rolls;

CREATE POLICY "Campaign participants can read rolls" ON campaigns.campaign_rolls
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns.campaigns c
      WHERE c.id = campaign_rolls.campaign_id
      AND (c.owner_id = (SELECT auth.uid())::text OR EXISTS (SELECT 1 FROM campaigns.campaign_members m WHERE m.campaign_id = c.id AND m.user_id = (SELECT auth.uid())::text))
    )
  );

CREATE POLICY "Campaign participants can insert rolls" ON campaigns.campaign_rolls
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns.campaigns c
      WHERE c.id = campaign_rolls.campaign_id
      AND (c.owner_id = (SELECT auth.uid())::text OR EXISTS (SELECT 1 FROM campaigns.campaign_members m WHERE m.campaign_id = c.id AND m.user_id = (SELECT auth.uid())::text))
    )
  );

CREATE POLICY "Campaign participants can update rolls" ON campaigns.campaign_rolls
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns.campaigns c
      WHERE c.id = campaign_rolls.campaign_id
      AND (c.owner_id = (SELECT auth.uid())::text OR EXISTS (SELECT 1 FROM campaigns.campaign_members m WHERE m.campaign_id = c.id AND m.user_id = (SELECT auth.uid())::text))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns.campaigns c
      WHERE c.id = campaign_rolls.campaign_id
      AND (c.owner_id = (SELECT auth.uid())::text OR EXISTS (SELECT 1 FROM campaigns.campaign_members m WHERE m.campaign_id = c.id AND m.user_id = (SELECT auth.uid())::text))
    )
  );

CREATE POLICY "Campaign participants can delete rolls" ON campaigns.campaign_rolls
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns.campaigns c
      WHERE c.id = campaign_rolls.campaign_id
      AND (c.owner_id = (SELECT auth.uid())::text OR EXISTS (SELECT 1 FROM campaigns.campaign_members m WHERE m.campaign_id = c.id AND m.user_id = (SELECT auth.uid())::text))
    )
  );
