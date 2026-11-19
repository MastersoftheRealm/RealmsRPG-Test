-- Empty FK targets so canonical characters-relational-expand.sql can apply in local pgTAP only.
CREATE TABLE IF NOT EXISTS public.codex_archetypes (id text PRIMARY KEY, name text);
CREATE TABLE IF NOT EXISTS public.codex_species (id text PRIMARY KEY, name text);
CREATE TABLE IF NOT EXISTS public.user_species (id text PRIMARY KEY, user_id text NOT NULL, name text);
CREATE TABLE IF NOT EXISTS public.codex_feats (id text PRIMARY KEY, name text);
CREATE TABLE IF NOT EXISTS public.codex_skills (id text PRIMARY KEY, name text);
CREATE TABLE IF NOT EXISTS public.codex_traits (id text PRIMARY KEY, name text);
CREATE TABLE IF NOT EXISTS public.official_powers (id text PRIMARY KEY, name text);
CREATE TABLE IF NOT EXISTS public.user_powers (id text PRIMARY KEY, user_id text NOT NULL, name text);
CREATE TABLE IF NOT EXISTS public.official_techniques (id text PRIMARY KEY, name text);
CREATE TABLE IF NOT EXISTS public.user_techniques (id text PRIMARY KEY, user_id text NOT NULL, name text);
CREATE TABLE IF NOT EXISTS public.official_empowered_techniques (id text PRIMARY KEY, name text);
CREATE TABLE IF NOT EXISTS public.user_empowered_techniques (id text PRIMARY KEY, user_id text NOT NULL, name text);
CREATE TABLE IF NOT EXISTS public.official_items (id text PRIMARY KEY, name text);
CREATE TABLE IF NOT EXISTS public.user_items (id text PRIMARY KEY, user_id text NOT NULL, name text);
CREATE TABLE IF NOT EXISTS public.codex_equipment (id text PRIMARY KEY, name text);
CREATE TABLE IF NOT EXISTS public.codex_parts (id text PRIMARY KEY, name text);
CREATE TABLE IF NOT EXISTS public.codex_properties (id text PRIMARY KEY, name text);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  name text NOT NULL DEFAULT 'pgtap',
  invite_code text NOT NULL DEFAULT 'pgtap',
  characters jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.campaign_members (
  campaign_id text NOT NULL REFERENCES public.campaigns(id),
  user_id text NOT NULL,
  PRIMARY KEY (campaign_id, user_id)
);