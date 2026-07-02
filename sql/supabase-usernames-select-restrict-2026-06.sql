-- Restrict usernames table SELECT to own row only (SA-19-21).
-- Availability checks use user_profiles via server actions, not broad usernames SELECT.

DROP POLICY IF EXISTS "Authenticated can read usernames" ON public.usernames;
CREATE POLICY "Users can read own username"
  ON public.usernames FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid())::text);
