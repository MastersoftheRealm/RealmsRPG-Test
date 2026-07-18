-- APPLIED 2026-07-17 via Supabase MCP execute_sql on RealmsRPG-Test.
-- Spread recommended abilities away from flat 3/2/2/0/0/0.
-- Rule: primary = 3, secondary ≥ 2, Ability Point cost sum = 7.
-- Prefer 3/2/1/1 or 3/2/… with a dump over dumping everything into a third +2.
-- Backup: codex_archetypes_backup_20260717
-- Sorcerer / Wardsmith abilities set with their path enrichments.

UPDATE public.codex_archetypes SET level1_recommended_abilities = '{"strength":3,"vitality":2,"agility":1,"acuity":1,"charisma":1,"intelligence":-1}'::jsonb WHERE name = 'Berserker';
UPDATE public.codex_archetypes SET level1_recommended_abilities = '{"agility":3,"charisma":2,"acuity":1,"vitality":1,"intelligence":0,"strength":0}'::jsonb WHERE name = 'Assassin';
UPDATE public.codex_archetypes SET level1_recommended_abilities = '{"strength":3,"charisma":2,"vitality":1,"agility":1,"acuity":0,"intelligence":0}'::jsonb WHERE name = 'Commander';
UPDATE public.codex_archetypes SET level1_recommended_abilities = '{"agility":3,"acuity":2,"vitality":1,"strength":1,"intelligence":0,"charisma":0}'::jsonb WHERE name = 'Monk';
UPDATE public.codex_archetypes SET level1_recommended_abilities = '{"acuity":3,"agility":2,"vitality":1,"charisma":1,"strength":0,"intelligence":0}'::jsonb WHERE name = 'Sharpshooter';
UPDATE public.codex_archetypes SET level1_recommended_abilities = '{"strength":3,"agility":2,"vitality":1,"acuity":1,"intelligence":0,"charisma":0}'::jsonb WHERE name = 'Warrior';
UPDATE public.codex_archetypes SET level1_recommended_abilities = '{"charisma":3,"acuity":2,"vitality":1,"agility":1,"strength":0,"intelligence":0}'::jsonb WHERE name = 'Beast Tamer';
UPDATE public.codex_archetypes SET level1_recommended_abilities = '{"intelligence":3,"charisma":2,"vitality":1,"acuity":1,"agility":0,"strength":0}'::jsonb WHERE name = 'Elementalist';
UPDATE public.codex_archetypes SET level1_recommended_abilities = '{"charisma":3,"intelligence":2,"vitality":1,"acuity":1,"agility":0,"strength":0}'::jsonb WHERE name = 'Healer';
UPDATE public.codex_archetypes SET level1_recommended_abilities = '{"intelligence":3,"charisma":2,"vitality":1,"acuity":1,"strength":0,"agility":0}'::jsonb WHERE name = 'Necromancer';
