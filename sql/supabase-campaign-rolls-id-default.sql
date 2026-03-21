-- =============================================================================
-- campaign_rolls: default for id (optional)
-- =============================================================================
-- Legacy `campaign_rolls` rows require a non-null `id` with no DEFAULT, so
-- inserts without `id` fail with: null value in column "id" violates not-null constraint.
--
-- The app POST /api/campaigns/[id]/rolls now always sends `id` (crypto.randomUUID()).
-- Run this in Supabase SQL Editor only if you want a DB default for other clients
-- or historical consistency.
-- =============================================================================

DO $$
DECLARE
  dt text;
  udt text;
BEGIN
  SELECT c.data_type, c.udt_name INTO dt, udt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'campaign_rolls'
    AND c.column_name = 'id';

  -- Postgres reports uuid as udt_name = 'uuid' (often data_type = 'USER-DEFINED').
  IF udt = 'uuid' OR dt = 'uuid' THEN
    EXECUTE 'ALTER TABLE public.campaign_rolls ALTER COLUMN id SET DEFAULT gen_random_uuid()';
  ELSIF dt IN ('text', 'character varying') THEN
    EXECUTE 'ALTER TABLE public.campaign_rolls ALTER COLUMN id SET DEFAULT (gen_random_uuid()::text)';
  END IF;
END $$;
