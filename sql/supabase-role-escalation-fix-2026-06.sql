-- TASK-328 — CRITICAL: prevent user_profiles.role self-escalation
-- =============================================================================
-- Problem (verified live on project lbqhiwudvifmkjtkccdg):
--   The "Users can update own profile" RLS policy only checks id = auth.uid()
--   with NO column guard on `role`, and there is NO trigger protecting it.
--   Any authenticated user can run, from the browser:
--       supabase.from('user_profiles').update({ role: 'admin' }).eq('id', uid)
--   and gain full admin DB access, because admin RLS policies (official_*,
--   role_policies, codex, etc.) trust user_profiles.role.
--
-- Why a trigger (not a policy): Postgres RLS WITH CHECK cannot compare OLD vs
--   NEW, so "role must stay unchanged" can't be expressed as a policy. A
--   BEFORE UPDATE trigger is the correct mechanism.
--
-- Why this is safe for the app:
--   * The ONLY legitimate role-change path is /api/admin/users/update-role,
--     which uses the SUPABASE_SERVICE_ROLE_KEY client. Service-role requests
--     report auth.role() = 'service_role', which this trigger allows.
--   * The trigger fires only when `role` actually changes
--     (NEW.role IS DISTINCT FROM OLD.role), so ordinary self-updates
--     (username, prefs, profile picture, etc.) are unaffected.
--   * INSERT is not touched, so signup / ensure-user-profile still works.
--
-- Run in Supabase Dashboard → SQL Editor (or via Supabase MCP apply_migration).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only guard actual role changes; allow the service-role admin API through.
  IF NEW.role IS DISTINCT FROM OLD.role
     AND COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Changing user role is not permitted'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_unauthorized_role_change ON public.user_profiles;
CREATE TRIGGER trg_prevent_unauthorized_role_change
  BEFORE UPDATE OF role ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unauthorized_role_change();

-- -----------------------------------------------------------------------------
-- Verification (run after applying):
--
-- 1) As a normal user this should FAIL with "Changing user role is not permitted":
--      -- (simulate authenticated context, then)
--      -- UPDATE public.user_profiles SET role = 'admin' WHERE id = '<your-uid>';
--
-- 2) Service-role update (this SQL editor runs as service_role) should SUCCEED:
--      -- UPDATE public.user_profiles SET role = role WHERE id = '<some-uid>';
--
-- 3) Confirm the trigger exists:
--      SELECT tgname FROM pg_trigger
--      WHERE tgrelid = 'public.user_profiles'::regclass AND NOT tgisinternal;
-- -----------------------------------------------------------------------------
