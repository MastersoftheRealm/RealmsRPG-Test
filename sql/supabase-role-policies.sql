-- Role-based permissions and quotas managed by admins.
CREATE TABLE IF NOT EXISTS public.role_policies (
  role public."UserRole" PRIMARY KEY,
  max_campaigns INTEGER NOT NULL,
  max_players_per_campaign INTEGER NOT NULL,
  max_characters INTEGER NOT NULL,
  max_custom_powers INTEGER NOT NULL,
  max_custom_techniques INTEGER NOT NULL,
  max_custom_armaments INTEGER NOT NULL,
  max_custom_creatures INTEGER NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.role_policies (
  role,
  max_campaigns,
  max_players_per_campaign,
  max_characters,
  max_custom_powers,
  max_custom_techniques,
  max_custom_armaments,
  max_custom_creatures,
  permissions
)
VALUES
  (
    'new_player',
    1,
    5,
    3,
    20,
    20,
    15,
    10,
    '{"can_upload_profile_picture": false}'::jsonb
  ),
  (
    'playtester',
    3,
    7,
    6,
    35,
    35,
    25,
    25,
    '{"can_upload_profile_picture": true}'::jsonb
  ),
  (
    'developer',
    8,
    12,
    15,
    100,
    100,
    80,
    100,
    '{"can_upload_profile_picture": true}'::jsonb
  ),
  (
    'admin',
    9999,
    9999,
    9999,
    9999,
    9999,
    9999,
    9999,
    '{"can_upload_profile_picture": true}'::jsonb
  )
ON CONFLICT (role) DO NOTHING;

ALTER TABLE public.role_policies ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.role_policies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.role_policies TO service_role;

DROP POLICY IF EXISTS role_policies_select_authenticated ON public.role_policies;
CREATE POLICY role_policies_select_authenticated
  ON public.role_policies
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS role_policies_admin_write ON public.role_policies;
CREATE POLICY role_policies_admin_write
  ON public.role_policies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = auth.uid()::text
        AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = auth.uid()::text
        AND up.role = 'admin'
    )
  );
