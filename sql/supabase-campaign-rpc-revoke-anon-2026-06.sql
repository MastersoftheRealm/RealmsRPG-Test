-- BE-04: Restrict campaign auth helper RPCs
-- =========================================
-- public.auth_is_campaign_owner(text) and public.auth_is_campaign_participant(text)
-- are SECURITY DEFINER helpers used inside Row-Level Security policies. With
-- EXECUTE granted to `anon`, they were also reachable as PostgREST /rpc endpoints.
--
-- IMPORTANT: These functions are referenced by RLS policies for the AUTHENTICATED
-- role (campaign_members_select_participants / _insert_owner_or_self /
-- _delete_owner_or_self, characters_select_authenticated). PostgreSQL enforces the
-- EXECUTE privilege of the *calling* role even when a policy invokes a SECURITY
-- DEFINER function, so EXECUTE for `authenticated` MUST be kept or those policies
-- will fail with "permission denied for function". No policy references these
-- helpers for `anon`, so revoking `anon` is safe and removes the /rpc surface.
--
-- Idempotent: REVOKE is a no-op if the grant is already absent.

REVOKE EXECUTE ON FUNCTION public.auth_is_campaign_owner(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.auth_is_campaign_participant(text) FROM anon;
