-- =============================================================================
-- RLS for codex and core_rules in PUBLIC schema
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor if GET /api/codex returns 500
-- (permission denied). Enables RLS and allows SELECT for everyone (anon + authenticated).
-- =============================================================================

-- codex_feats
ALTER TABLE public.codex_feats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex feats" ON public.codex_feats;
CREATE POLICY "Anyone can read codex feats" ON public.codex_feats FOR SELECT TO public USING (true);

-- codex_skills
ALTER TABLE public.codex_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex skills" ON public.codex_skills;
CREATE POLICY "Anyone can read codex skills" ON public.codex_skills FOR SELECT TO public USING (true);

-- codex_species
ALTER TABLE public.codex_species ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex species" ON public.codex_species;
CREATE POLICY "Anyone can read codex species" ON public.codex_species FOR SELECT TO public USING (true);

-- codex_traits
ALTER TABLE public.codex_traits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex traits" ON public.codex_traits;
CREATE POLICY "Anyone can read codex traits" ON public.codex_traits FOR SELECT TO public USING (true);

-- codex_parts
ALTER TABLE public.codex_parts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex parts" ON public.codex_parts;
CREATE POLICY "Anyone can read codex parts" ON public.codex_parts FOR SELECT TO public USING (true);

-- codex_properties
ALTER TABLE public.codex_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex properties" ON public.codex_properties;
CREATE POLICY "Anyone can read codex properties" ON public.codex_properties FOR SELECT TO public USING (true);

-- codex_equipment
ALTER TABLE public.codex_equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex equipment" ON public.codex_equipment;
CREATE POLICY "Anyone can read codex equipment" ON public.codex_equipment FOR SELECT TO public USING (true);

-- codex_archetypes
ALTER TABLE public.codex_archetypes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex archetypes" ON public.codex_archetypes;
CREATE POLICY "Anyone can read codex archetypes" ON public.codex_archetypes FOR SELECT TO public USING (true);

-- codex_creature_feats
ALTER TABLE public.codex_creature_feats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex creature feats" ON public.codex_creature_feats;
CREATE POLICY "Anyone can read codex creature feats" ON public.codex_creature_feats FOR SELECT TO public USING (true);

-- core_rules
ALTER TABLE public.core_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read core rules" ON public.core_rules;
CREATE POLICY "Anyone can read core rules" ON public.core_rules FOR SELECT TO public USING (true);
