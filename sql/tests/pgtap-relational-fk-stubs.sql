-- Empty FK targets so canonical characters-relational-expand.sql can apply in local pgTAP only.
CREATE TABLE IF NOT EXISTS public.codex_archetypes (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.codex_species (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.user_species (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.codex_feats (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.codex_skills (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.codex_traits (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.official_powers (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.user_powers (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.official_techniques (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.user_techniques (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.official_empowered_techniques (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.user_empowered_techniques (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.official_items (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.user_items (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.codex_equipment (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.codex_parts (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.codex_properties (id text PRIMARY KEY);