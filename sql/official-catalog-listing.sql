-- TASK-927 / ADR-0027: catalog_listing on official created items + codex_species.
-- listed = Public library catalogs; unlisted = Admin library (resolve by id, not player catalogs).
-- Idempotent. RLS unchanged (unlisted is not secret).

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'official_powers',
    'official_techniques',
    'official_empowered_techniques',
    'official_items',
    'official_creatures',
    'official_enhanced_items',
    'codex_species'
  ]
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS catalog_listing text NOT NULL DEFAULT ''listed''',
      t
    );
    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
      t,
      t || '_catalog_listing_check'
    );
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (catalog_listing = ANY (ARRAY[''listed''::text, ''unlisted''::text]))',
      t,
      t || '_catalog_listing_check'
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (catalog_listing)',
      'idx_' || t || '_catalog_listing',
      t
    );
    EXECUTE format(
      'COMMENT ON COLUMN public.%I.catalog_listing IS %L',
      t,
      'listed = Public library catalogs; unlisted = Admin library (not in player catalogs; still readable by id).'
    );
  END LOOP;
END $$;
