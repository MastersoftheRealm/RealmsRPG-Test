-- Structural prereq for canonical relational SQL (local pgTAP only; never production).
-- Mirrors production `characters` core columns from schema baseline; CAS logic is in canonical sql/.
CREATE EXTENSION IF NOT EXISTS pgtap;

CREATE TABLE IF NOT EXISTS public.characters (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp(3) without time zone,
  updated_at timestamp(3) without time zone NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  name text,
  level integer,
  archetype_name text,
  ancestry_name text,
  status text,
  visibility text DEFAULT 'private'::text NOT NULL,
  CONSTRAINT characters_visibility_check CHECK (
    visibility = ANY (ARRAY['private'::text, 'campaign'::text, 'public'::text])
  )
);