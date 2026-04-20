-- Codex edit changelog (short-term history)
-- Keeps the latest 10 changes per entity (entity_type + entity_id).

CREATE TABLE IF NOT EXISTS public.codex_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  before_data JSONB,
  after_data JSONB,
  changed_fields JSONB
);

CREATE INDEX IF NOT EXISTS idx_codex_change_logs_entity_type_changed_at
  ON public.codex_change_logs(entity_type, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_codex_change_logs_entity_changed_at
  ON public.codex_change_logs(entity_type, entity_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_codex_change_logs_changed_by_changed_at
  ON public.codex_change_logs(changed_by_user_id, changed_at DESC);

CREATE OR REPLACE FUNCTION public.prune_codex_change_logs_to_latest_ten()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.codex_change_logs c
  WHERE c.entity_type = NEW.entity_type
    AND c.entity_id = NEW.entity_id
    AND c.id NOT IN (
      SELECT id
      FROM public.codex_change_logs
      WHERE entity_type = NEW.entity_type
        AND entity_id = NEW.entity_id
      ORDER BY changed_at DESC, id DESC
      LIMIT 10
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_codex_change_logs_keep_latest_ten ON public.codex_change_logs;
CREATE TRIGGER trigger_codex_change_logs_keep_latest_ten
AFTER INSERT ON public.codex_change_logs
FOR EACH ROW
EXECUTE FUNCTION public.prune_codex_change_logs_to_latest_ten();

ALTER TABLE public.codex_change_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.codex_change_logs TO authenticated;
GRANT INSERT ON public.codex_change_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.codex_change_logs TO service_role;

DROP POLICY IF EXISTS codex_change_logs_admin_select ON public.codex_change_logs;
CREATE POLICY codex_change_logs_admin_select
  ON public.codex_change_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id::text = auth.uid()::text
        AND up.role = 'admin'
    )
  );
