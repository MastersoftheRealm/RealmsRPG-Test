-- =============================================================================
-- VTT V1 — campaign tabletop scenes, tokens, actions, and private map bucket
-- =============================================================================
-- Run in Supabase SQL Editor before enabling the VTT UI in production.
-- Requires public.campaigns, public.campaign_members, and public.encounters.
-- Creates VTT-scoped private campaign auth helpers for RLS.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.auth_is_vtt_campaign_owner(p_campaign_id text)
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaigns c
    WHERE c.id = p_campaign_id
      AND c.owner_id = (select auth.uid())::text
  );
$function$;

CREATE OR REPLACE FUNCTION private.auth_is_vtt_campaign_participant(p_campaign_id text)
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaigns c
    WHERE c.id = p_campaign_id
      AND (
        c.owner_id = (select auth.uid())::text
        OR EXISTS (
          SELECT 1
          FROM public.campaign_members m
          WHERE m.campaign_id = c.id
            AND m.user_id = (select auth.uid())::text
        )
      )
  );
$function$;

REVOKE ALL ON FUNCTION private.auth_is_vtt_campaign_owner(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_is_vtt_campaign_participant(text) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.auth_is_vtt_campaign_owner(text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.auth_is_vtt_campaign_participant(text) TO authenticated;

CREATE TABLE IF NOT EXISTS public.vtt_scenes (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  encounter_id TEXT REFERENCES public.encounters(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Tabletop Scene',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  map JSONB,
  grid JSONB NOT NULL DEFAULT '{"enabled":true,"cellSize":70,"offsetX":0,"offsetY":0,"color":"#94a3b8","opacity":0.45,"snap":true}'::jsonb,
  fog JSONB NOT NULL DEFAULT '{"enabled":false,"regions":[]}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{"showEnemyResources":false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vtt_scenes_campaign_active_idx ON public.vtt_scenes(campaign_id, is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS vtt_scenes_encounter_idx ON public.vtt_scenes(encounter_id);

CREATE TABLE IF NOT EXISTS public.vtt_tokens (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL REFERENCES public.vtt_scenes(id) ON DELETE CASCADE,
  combatant_id TEXT,
  name TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '?',
  x NUMERIC NOT NULL DEFAULT 0,
  y NUMERIC NOT NULL DEFAULT 0,
  size NUMERIC NOT NULL DEFAULT 56,
  color TEXT NOT NULL DEFAULT '#64748b',
  image_url TEXT,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  combatant_type TEXT NOT NULL DEFAULT 'enemy',
  source_type TEXT,
  source_id TEXT,
  source_user_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vtt_tokens_scene_idx ON public.vtt_tokens(scene_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS vtt_tokens_scene_combatant_unique
  ON public.vtt_tokens(scene_id, combatant_id)
  WHERE combatant_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.vtt_actions (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL REFERENCES public.vtt_scenes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ping', 'move-request')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed')),
  token_id TEXT REFERENCES public.vtt_tokens(id) ON DELETE SET NULL,
  from_x NUMERIC,
  from_y NUMERIC,
  to_x NUMERIC NOT NULL,
  to_y NUMERIC NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vtt_actions_scene_created_idx ON public.vtt_actions(scene_id, created_at DESC);
CREATE INDEX IF NOT EXISTS vtt_actions_scene_status_idx ON public.vtt_actions(scene_id, status);

ALTER TABLE public.vtt_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vtt_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vtt_actions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vtt_scenes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vtt_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vtt_actions TO authenticated;
GRANT ALL ON public.vtt_scenes TO service_role;
GRANT ALL ON public.vtt_tokens TO service_role;
GRANT ALL ON public.vtt_actions TO service_role;

-- Scenes: campaign participants can read; RM owns mutations.
DROP POLICY IF EXISTS vtt_scenes_select_participants ON public.vtt_scenes;
CREATE POLICY vtt_scenes_select_participants ON public.vtt_scenes
  FOR SELECT TO authenticated
  USING (private.auth_is_vtt_campaign_participant(campaign_id));

DROP POLICY IF EXISTS vtt_scenes_insert_owner ON public.vtt_scenes;
CREATE POLICY vtt_scenes_insert_owner ON public.vtt_scenes
  FOR INSERT TO authenticated
  WITH CHECK (private.auth_is_vtt_campaign_owner(campaign_id));

DROP POLICY IF EXISTS vtt_scenes_update_owner ON public.vtt_scenes;
CREATE POLICY vtt_scenes_update_owner ON public.vtt_scenes
  FOR UPDATE TO authenticated
  USING (private.auth_is_vtt_campaign_owner(campaign_id))
  WITH CHECK (private.auth_is_vtt_campaign_owner(campaign_id));

DROP POLICY IF EXISTS vtt_scenes_delete_owner ON public.vtt_scenes;
CREATE POLICY vtt_scenes_delete_owner ON public.vtt_scenes
  FOR DELETE TO authenticated
  USING (private.auth_is_vtt_campaign_owner(campaign_id));

-- Tokens: participant read via scene; RM owns mutations.
DROP POLICY IF EXISTS vtt_tokens_select_participants ON public.vtt_tokens;
CREATE POLICY vtt_tokens_select_participants ON public.vtt_tokens
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vtt_scenes s
      WHERE s.id = vtt_tokens.scene_id
        AND private.auth_is_vtt_campaign_participant(s.campaign_id)
    )
  );

DROP POLICY IF EXISTS vtt_tokens_insert_owner ON public.vtt_tokens;
CREATE POLICY vtt_tokens_insert_owner ON public.vtt_tokens
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vtt_scenes s
      WHERE s.id = vtt_tokens.scene_id
        AND private.auth_is_vtt_campaign_owner(s.campaign_id)
    )
  );

DROP POLICY IF EXISTS vtt_tokens_update_owner ON public.vtt_tokens;
CREATE POLICY vtt_tokens_update_owner ON public.vtt_tokens
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vtt_scenes s
      WHERE s.id = vtt_tokens.scene_id
        AND private.auth_is_vtt_campaign_owner(s.campaign_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vtt_scenes s
      WHERE s.id = vtt_tokens.scene_id
        AND private.auth_is_vtt_campaign_owner(s.campaign_id)
    )
  );

DROP POLICY IF EXISTS vtt_tokens_delete_owner ON public.vtt_tokens;
CREATE POLICY vtt_tokens_delete_owner ON public.vtt_tokens
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vtt_scenes s
      WHERE s.id = vtt_tokens.scene_id
        AND private.auth_is_vtt_campaign_owner(s.campaign_id)
    )
  );

-- Actions: participants can read. Participants create own pings/move requests.
-- RM can update/delete for moderation and approvals.
DROP POLICY IF EXISTS vtt_actions_select_participants ON public.vtt_actions;
CREATE POLICY vtt_actions_select_participants ON public.vtt_actions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vtt_scenes s
      WHERE s.id = vtt_actions.scene_id
        AND private.auth_is_vtt_campaign_participant(s.campaign_id)
    )
  );

DROP POLICY IF EXISTS vtt_actions_insert_participants ON public.vtt_actions;
CREATE POLICY vtt_actions_insert_participants ON public.vtt_actions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())::text
    AND EXISTS (
      SELECT 1 FROM public.vtt_scenes s
      WHERE s.id = vtt_actions.scene_id
        AND private.auth_is_vtt_campaign_participant(s.campaign_id)
    )
  );

DROP POLICY IF EXISTS vtt_actions_update_owner ON public.vtt_actions;
CREATE POLICY vtt_actions_update_owner ON public.vtt_actions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vtt_scenes s
      WHERE s.id = vtt_actions.scene_id
        AND private.auth_is_vtt_campaign_owner(s.campaign_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vtt_scenes s
      WHERE s.id = vtt_actions.scene_id
        AND private.auth_is_vtt_campaign_owner(s.campaign_id)
    )
  );

DROP POLICY IF EXISTS vtt_actions_delete_owner ON public.vtt_actions;
CREATE POLICY vtt_actions_delete_owner ON public.vtt_actions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vtt_scenes s
      WHERE s.id = vtt_actions.scene_id
        AND private.auth_is_vtt_campaign_owner(s.campaign_id)
    )
  );

-- Private bucket; the app serves maps via short-lived signed URLs from server APIs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('vtt-maps', 'vtt-maps', false)
ON CONFLICT (id) DO NOTHING;

-- Realtime.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'vtt_scenes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vtt_scenes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'vtt_tokens'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vtt_tokens;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'vtt_actions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vtt_actions;
  END IF;
END $$;
