-- TASK-498 — Catalog legacy entity-tied codex-art files into Realms Image Library
-- Status: Applied on RealmsRPG-Test — migration realms_image_catalog_legacy_entity_art
--   (2026-07-17, owner approved). Idempotent — safe to re-run.
--
-- What this does (idempotent):
--   1. Find consumer rows with image_url set and image_id NULL
--   2. Register the existing Storage object in realms_images (same path — no file copy/move)
--   3. Tag with the entity category
--   4. Set consumer.image_id + normalize image_url cache (strip ?v= cache-bust)
--
-- What this does NOT do:
--   - Delete Storage objects
--   - Move paths to library/{id}.ext (replace API will migrate path on next admin replace)
--   - Touch rows that already have image_id
--
-- Post-apply on RealmsRPG-Test (2026-07-17):
--   realms_images: 3 (Erethi, Halfling, Human) at species/{id}.jpg
--   codex_species url-only: 0

-- ---------------------------------------------------------------------------
-- Legacy candidates (official / codex)
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _legacy_art_candidates (
  entity_table TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  category public.realms_image_category NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  PRIMARY KEY (entity_table, entity_id)
) ON COMMIT DROP;

WITH raw AS (
  SELECT
    'codex_species'::text AS entity_table,
    id::text AS entity_id,
    name AS entity_name,
    'species'::public.realms_image_category AS category,
    image_url
  FROM public.codex_species
  WHERE image_id IS NULL
    AND image_url IS NOT NULL
    AND btrim(image_url) <> ''

  UNION ALL
  SELECT
    'codex_equipment',
    id::text,
    name,
    'equipment'::public.realms_image_category,
    image_url
  FROM public.codex_equipment
  WHERE image_id IS NULL
    AND image_url IS NOT NULL
    AND btrim(image_url) <> ''

  UNION ALL
  SELECT
    'official_creatures',
    id::text,
    name,
    'creature'::public.realms_image_category,
    image_url
  FROM public.official_creatures
  WHERE image_id IS NULL
    AND image_url IS NOT NULL
    AND btrim(image_url) <> ''

  UNION ALL
  SELECT
    'official_powers',
    id::text,
    name,
    'power'::public.realms_image_category,
    image_url
  FROM public.official_powers
  WHERE image_id IS NULL
    AND image_url IS NOT NULL
    AND btrim(image_url) <> ''

  UNION ALL
  SELECT
    'official_techniques',
    id::text,
    name,
    'technique'::public.realms_image_category,
    image_url
  FROM public.official_techniques
  WHERE image_id IS NULL
    AND image_url IS NOT NULL
    AND btrim(image_url) <> ''

  UNION ALL
  -- Empowered has no dedicated tag; catalog as both power + technique via second insert below.
  SELECT
    'official_empowered_techniques',
    id::text,
    name,
    'power'::public.realms_image_category,
    image_url
  FROM public.official_empowered_techniques
  WHERE image_id IS NULL
    AND image_url IS NOT NULL
    AND btrim(image_url) <> ''

  UNION ALL
  SELECT
    'official_items',
    id::text,
    name,
    CASE lower(type)
      WHEN 'weapon' THEN 'weapon'::public.realms_image_category
      WHEN 'armor' THEN 'armor'::public.realms_image_category
      WHEN 'shield' THEN 'shield'::public.realms_image_category
      ELSE 'equipment'::public.realms_image_category
    END,
    image_url
  FROM public.official_items
  WHERE image_id IS NULL
    AND image_url IS NOT NULL
    AND btrim(image_url) <> ''
),
parsed AS (
  SELECT
    entity_table,
    entity_id,
    entity_name,
    category,
    -- Path inside codex-art bucket (strip query + leading slash)
    nullif(
      trim(both '/' FROM split_part(split_part(image_url, '/codex-art/', 2), '?', 1)),
      ''
    ) AS storage_path,
    split_part(image_url, '?', 1) AS public_url
  FROM raw
)
INSERT INTO _legacy_art_candidates (entity_table, entity_id, entity_name, category, storage_path, public_url)
SELECT entity_table, entity_id, entity_name, category, storage_path, public_url
FROM parsed
WHERE storage_path IS NOT NULL
  AND public_url LIKE '%/storage/v1/object/public/codex-art/%';

-- ---------------------------------------------------------------------------
-- Insert master rows for distinct storage paths not already cataloged
-- ---------------------------------------------------------------------------
INSERT INTO public.realms_images (id, name, storage_path, public_url, created_at, updated_at, created_by)
SELECT
  gen_random_uuid(),
  -- Prefer first entity name for this path (stable enough for 1:1 legacy files)
  (ARRAY_AGG(c.entity_name ORDER BY c.entity_table, c.entity_id))[1],
  c.storage_path,
  (ARRAY_AGG(c.public_url ORDER BY c.entity_table, c.entity_id))[1],
  now(),
  now(),
  NULL
FROM _legacy_art_candidates c
WHERE NOT EXISTS (
  SELECT 1 FROM public.realms_images ri WHERE ri.storage_path = c.storage_path
)
GROUP BY c.storage_path;

-- ---------------------------------------------------------------------------
-- Category tags (primary category from candidate; empowered also gets technique)
-- ---------------------------------------------------------------------------
INSERT INTO public.realms_image_categories (image_id, category)
SELECT DISTINCT ri.id, c.category
FROM _legacy_art_candidates c
JOIN public.realms_images ri ON ri.storage_path = c.storage_path
ON CONFLICT DO NOTHING;

INSERT INTO public.realms_image_categories (image_id, category)
SELECT DISTINCT ri.id, 'technique'::public.realms_image_category
FROM _legacy_art_candidates c
JOIN public.realms_images ri ON ri.storage_path = c.storage_path
WHERE c.entity_table = 'official_empowered_techniques'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Bind consumers (image_id + normalized cache URL)
-- ---------------------------------------------------------------------------
UPDATE public.codex_species s
SET
  image_id = ri.id,
  image_url = ri.public_url
FROM _legacy_art_candidates c
JOIN public.realms_images ri ON ri.storage_path = c.storage_path
WHERE c.entity_table = 'codex_species'
  AND s.id::text = c.entity_id
  AND s.image_id IS NULL;

UPDATE public.codex_equipment e
SET
  image_id = ri.id,
  image_url = ri.public_url
FROM _legacy_art_candidates c
JOIN public.realms_images ri ON ri.storage_path = c.storage_path
WHERE c.entity_table = 'codex_equipment'
  AND e.id::text = c.entity_id
  AND e.image_id IS NULL;

UPDATE public.official_creatures o
SET
  image_id = ri.id,
  image_url = ri.public_url,
  updated_at = now()
FROM _legacy_art_candidates c
JOIN public.realms_images ri ON ri.storage_path = c.storage_path
WHERE c.entity_table = 'official_creatures'
  AND o.id::text = c.entity_id
  AND o.image_id IS NULL;

UPDATE public.official_powers o
SET
  image_id = ri.id,
  image_url = ri.public_url,
  updated_at = now()
FROM _legacy_art_candidates c
JOIN public.realms_images ri ON ri.storage_path = c.storage_path
WHERE c.entity_table = 'official_powers'
  AND o.id::text = c.entity_id
  AND o.image_id IS NULL;

UPDATE public.official_techniques o
SET
  image_id = ri.id,
  image_url = ri.public_url,
  updated_at = now()
FROM _legacy_art_candidates c
JOIN public.realms_images ri ON ri.storage_path = c.storage_path
WHERE c.entity_table = 'official_techniques'
  AND o.id::text = c.entity_id
  AND o.image_id IS NULL;

UPDATE public.official_empowered_techniques o
SET
  image_id = ri.id,
  image_url = ri.public_url,
  updated_at = now()
FROM _legacy_art_candidates c
JOIN public.realms_images ri ON ri.storage_path = c.storage_path
WHERE c.entity_table = 'official_empowered_techniques'
  AND o.id::text = c.entity_id
  AND o.image_id IS NULL;

UPDATE public.official_items o
SET
  image_id = ri.id,
  image_url = ri.public_url,
  updated_at = now()
FROM _legacy_art_candidates c
JOIN public.realms_images ri ON ri.storage_path = c.storage_path
WHERE c.entity_table = 'official_items'
  AND o.id::text = c.entity_id
  AND o.image_id IS NULL;

-- ---------------------------------------------------------------------------
-- Post-apply verification (run separately after apply; expected on Test DB):
--   SELECT count(*) FROM realms_images;                        -- 3
--   SELECT category, count(*) FROM realms_image_categories
--     GROUP BY category;                                       -- species: 3
--   SELECT id, name, image_id IS NOT NULL AS has_id, image_url
--     FROM codex_species WHERE id IN ('1','3','4');            -- all has_id
--   SELECT count(*) FROM codex_species
--     WHERE image_url IS NOT NULL AND image_id IS NULL;        -- 0
-- ---------------------------------------------------------------------------
