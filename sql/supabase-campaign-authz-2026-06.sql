-- TASK-329 — Campaign & roll authorization hardening
-- =============================================================================
-- Verified live on project lbqhiwudvifmkjtkccdg (pg_policies):
--
--   1) campaigns UPDATE policy "Members can update campaigns they belong to"
--      allows ANY member (owner OR memberIds OR campaign_members) to UPDATE the
--      whole row — including owner_id, invite_code and the memberIds roster.
--      A member could take ownership, rotate the invite code, or kick others
--      directly via PostgREST. The only legitimate member-level write is a
--      player removing their OWN character; that path is being switched to the
--      service role in code (removeCharacterFromCampaignAction), so member
--      UPDATE access can be removed entirely. Owner writes keep working through
--      the existing "Owner can do anything on own campaigns" ALL policy, and
--      server actions that mutate the roster use the service role.
--
--   2) campaign_rolls INSERT/UPDATE/DELETE were granted to any participant with
--      NO caller-match on user_id, so a member could insert rolls attributed to
--      someone else, or edit/delete other players' rolls. Tighten to:
--        * INSERT: participant AND user_id = auth.uid()  (no attribution spoof)
--        * DELETE: participant AND (own roll OR campaign owner/RM clearing log)
--        * UPDATE: removed — rolls are append-only; nothing updates them.
--      The roll-list trim runs server-side via the service role (see code), so
--      it is unaffected by the stricter client DELETE policy.
--
-- Run in Supabase Dashboard -> SQL Editor, or via Supabase MCP apply_migration.
-- =============================================================================

-- --- 1) campaigns: remove member UPDATE (owner ALL policy remains) ----------
DROP POLICY IF EXISTS "Members can update campaigns they belong to" ON public.campaigns;

-- --- 2) campaign_rolls: caller-bound write policies -------------------------
DROP POLICY IF EXISTS "Campaign participants can insert rolls" ON public.campaign_rolls;
DROP POLICY IF EXISTS "Campaign participants can update rolls" ON public.campaign_rolls;
DROP POLICY IF EXISTS "Campaign participants can delete rolls" ON public.campaign_rolls;

-- INSERT: must be a participant AND the row must be attributed to the caller.
CREATE POLICY "Participants insert own rolls" ON public.campaign_rolls
  FOR INSERT
  WITH CHECK (
    user_id = (auth.uid())::text
    AND EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_rolls.campaign_id
        AND (
          c.owner_id = (auth.uid())::text
          OR c."memberIds" @> jsonb_build_array((auth.uid())::text)
          OR EXISTS (
            SELECT 1 FROM public.campaign_members m
            WHERE m.campaign_id = c.id AND m.user_id = (auth.uid())::text
          )
        )
    )
  );

-- DELETE: a player may delete their own rolls; the campaign owner (RM) may
-- delete any roll in their campaign (clearing the log).
CREATE POLICY "Owner or author deletes rolls" ON public.campaign_rolls
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_rolls.campaign_id
        AND (
          c.owner_id = (auth.uid())::text
          OR (
            campaign_rolls.user_id = (auth.uid())::text
            AND (
              c."memberIds" @> jsonb_build_array((auth.uid())::text)
              OR EXISTS (
                SELECT 1 FROM public.campaign_members m
                WHERE m.campaign_id = c.id AND m.user_id = (auth.uid())::text
              )
            )
          )
        )
    )
  );

-- (No UPDATE policy on campaign_rolls: rolls are append-only.)

-- -----------------------------------------------------------------------------
-- Verification (run after applying):
--   SELECT policyname, cmd FROM pg_policies
--   WHERE schemaname='public' AND tablename IN ('campaigns','campaign_rolls')
--   ORDER BY tablename, cmd;
-- Expect: campaigns has no member UPDATE policy; campaign_rolls has
--   "Participants insert own rolls" (INSERT) + "Owner or author deletes rolls"
--   (DELETE) + the existing SELECT policy, and NO UPDATE policy.
-- -----------------------------------------------------------------------------
