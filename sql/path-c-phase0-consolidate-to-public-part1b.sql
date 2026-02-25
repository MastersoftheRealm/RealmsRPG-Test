-- =============================================================================
-- Path C Phase 0 — PART 1b: Move CAMPAIGNS and ENCOUNTERS to public
-- =============================================================================
-- Run AFTER Part 1a succeeds. Then run Part 1c, then Part 2.
-- =============================================================================

-- Ensure campaign_members exists
CREATE TABLE IF NOT EXISTS campaigns.campaign_members (
  campaign_id TEXT NOT NULL REFERENCES campaigns.campaigns(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  PRIMARY KEY (campaign_id, user_id)
);
CREATE INDEX IF NOT EXISTS campaign_members_user_id_idx ON campaigns.campaign_members(user_id);
CREATE INDEX IF NOT EXISTS campaign_members_campaign_id_idx ON campaigns.campaign_members(campaign_id);
ALTER TABLE campaigns.campaign_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE campaigns.campaigns SET SCHEMA public;
ALTER TABLE campaigns.campaign_members SET SCHEMA public;
ALTER TABLE campaigns.campaign_rolls SET SCHEMA public;
ALTER TABLE encounters.encounters SET SCHEMA public;

-- PART 1b DONE. Run Part 1c next: path-c-phase0-consolidate-to-public-part1c.sql
