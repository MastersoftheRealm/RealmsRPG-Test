-- Structural prereq for canonical relational SQL (local pgTAP only; never production).
CREATE EXTENSION IF NOT EXISTS pgtap;

CREATE TABLE IF NOT EXISTS public.characters (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  updated_at timestamp without time zone NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);