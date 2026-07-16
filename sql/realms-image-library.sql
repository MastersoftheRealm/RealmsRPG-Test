-- Realms Image Library — catalog + category tags (TASK-492 / ADR-0003)
-- Status: Applied on RealmsRPG-Test — migration realms_image_library (2026-07-16, owner approved).
--
-- Creates:
--   public.realms_images              — master asset row (one Storage object per row)
--   public.realms_image_categories    — multi category tags (join table)
--   enum public.realms_image_category — locked tag vocabulary
-- Storage: reuses public bucket `codex-art`; bank paths are `library/{id}.{ext}`
--   (entity-tied `{entityType}/{entityId}.jpg` remains until TASK-498).
-- RLS: guest + authenticated SELECT; writes via service role in /api/images* after isAdmin().
-- Entity image_id FKs land in TASK-494 / TASK-497 — not this migration.

-- ---------------------------------------------------------------------------
-- Enum (locked vocabulary — no empowered tag)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'realms_image_category'
  ) THEN
    CREATE TYPE public.realms_image_category AS ENUM (
      'species',
      'creature',
      'weapon',
      'armor',
      'shield',
      'equipment',
      'power',
      'technique'
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Master catalog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.realms_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.realms_images IS
  'Realms Image Library master assets (ADR-0003). One Storage object per row; consumers reference via image_id.';

COMMENT ON COLUMN public.realms_images.storage_path IS
  'Path within codex-art bucket, typically library/{id}.{ext}. Not entity-tied.';

COMMENT ON COLUMN public.realms_images.public_url IS
  'Public CDN URL for the Storage object. Cache-busted on replace by API.';

CREATE INDEX IF NOT EXISTS idx_realms_images_name_ilike
  ON public.realms_images (lower(name));

CREATE INDEX IF NOT EXISTS idx_realms_images_created_at
  ON public.realms_images (created_at DESC);

-- ---------------------------------------------------------------------------
-- Category tags (multi-select)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.realms_image_categories (
  image_id UUID NOT NULL REFERENCES public.realms_images(id) ON DELETE CASCADE,
  category public.realms_image_category NOT NULL,
  PRIMARY KEY (image_id, category)
);

COMMENT ON TABLE public.realms_image_categories IS
  'Multi category tags for Realms Image Library assets. Empowered pickers filter power OR technique.';

CREATE INDEX IF NOT EXISTS idx_realms_image_categories_category
  ON public.realms_image_categories (category);

-- ---------------------------------------------------------------------------
-- Storage bucket (idempotent — already created by codex-art-species-image-url.sql)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'codex-art',
  'codex-art',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read for codex-art (including library/* paths)
DROP POLICY IF EXISTS "Codex art is publicly readable" ON storage.objects;
CREATE POLICY "Codex art is publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'codex-art');

-- No authenticated INSERT/UPDATE/DELETE on storage.objects for this bucket.
-- Admin bank uploads use service role in /api/images after isAdmin().

-- ---------------------------------------------------------------------------
-- RLS + grants
-- ---------------------------------------------------------------------------
ALTER TABLE public.realms_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realms_image_categories ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.realms_images TO anon, authenticated;
GRANT SELECT ON public.realms_image_categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.realms_images TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.realms_image_categories TO service_role;

DROP POLICY IF EXISTS "Anyone can read realms images" ON public.realms_images;
CREATE POLICY "Anyone can read realms images"
  ON public.realms_images
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Anyone can read realms image categories" ON public.realms_image_categories;
CREATE POLICY "Anyone can read realms image categories"
  ON public.realms_image_categories
  FOR SELECT
  TO public
  USING (true);

-- No INSERT/UPDATE/DELETE policies for anon/authenticated — admin writes via service role.
