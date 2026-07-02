-- TASK-330 — Admin role-management hardening: audit log
-- =============================================================================
-- Adds an append-only audit trail for admin role grants/revocations. The
-- update-role API (service-role client) writes a row on every successful role
-- change; admins can read the log. There are no INSERT/UPDATE/DELETE policies,
-- so only the service role (which bypasses RLS) can write it and nobody can
-- tamper with or delete entries via PostgREST.
--
-- Run in Supabase Dashboard -> SQL Editor, or via Supabase MCP apply_migration.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_role_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id text NOT NULL,
  target_id text NOT NULL,
  old_role text,
  new_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_role_audit_target ON public.admin_role_audit (target_id, created_at DESC);

ALTER TABLE public.admin_role_audit ENABLE ROW LEVEL SECURITY;

-- Admins may read the audit log. (Writes are service-role only — no write policy.)
DROP POLICY IF EXISTS "Admins can read role audit" ON public.admin_role_audit;
CREATE POLICY "Admins can read role audit" ON public.admin_role_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = (auth.uid())::text AND up.role = 'admin'
    )
  );
