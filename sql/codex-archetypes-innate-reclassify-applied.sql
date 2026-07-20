-- TASK-535 APPLIED 2026-07-20 (owner approved) — reclassify clear innate powers on Power paths.
-- Applied live on RealmsRPG-Test via Supabase MCP execute_sql.
--
-- Criteria (Appendix G / src/lib/game/innate-eligibility.ts):
--   Basic or Basic Reaction; Energy ≤ Innate Threshold (8 at L1 Power);
--   no healing / energy-gain parts; sum of moved innates ≤ Innate Energy (16).
-- Energy derived via derivePowerDisplay + live codex_parts (2026-07-20 audit).
--
-- Skips:
--   Martial paths (no Innate Energy) — Assassin, Berserker, Commander, Monk, Sharpshooter, Warrior.
--   Elemental Burst (id 4d21f2fc-…) — calculator returns Energy 0 (Choice/advanced meta); ambiguous, leave in level1_powers.
--   Healer healing kit, over-threshold / non-Basic powers — stay in level1_powers.
--
-- Pattern per path: set level1_innate_powers CSV; remove those ids from level1_powers.

-- ========== Beast Tamer ==========
-- Eligible: Beast Armor (8), Empower Beast (6), Evasive Beast (7). Sum of all three = 21 > 16.
-- Proposed innate: Beast Armor + Evasive Beast = 15. Leave Empower Beast as regular.
-- Alt (owner): Beast Armor + Empower Beast = 14.
update public.codex_archetypes
set
  level1_innate_powers = '3f6d092f-0a5b-42c7-888c-49cf2d589d71, 0bb0c4a1-a1d2-4278-8c22-f07044c3c3b6',
  level1_powers = 'd0841448-4918-4fa0-b6a3-4655b9e7d26e, e8d4d6fe-76f0-424f-beed-afc89b82da93, 5478987a-28ce-46f8-bec3-cade73290ea3'
where id = '3' and name = 'Beast Tamer';

-- ========== Healer ==========
-- Eligible non-heal: Necrotize (8), Radiant Bolt (8) = 16.
-- Healing / Free / Quick / Overheal stay regular.
update public.codex_archetypes
set
  level1_innate_powers = 'c7add61f-7b95-454a-ba13-9488604fa10f, 977505f1-d2fe-438e-b499-ef1c5f8679e5',
  level1_powers = '1b66058f-3a3a-4e48-ab33-e26a0175cba8, 458243d4-50af-4ceb-a410-b91d4139909f, cd16bb99-273a-42fa-978b-f48e83d87561, c8652f3a-399f-406f-9c00-16d6e8ba3772, c4f8432d-1182-44e6-828c-927da091201b'
where id = '4' and name = 'Healer';

-- ========== Necromancer ==========
-- Eligible: Necrotize (8), Empower undead (7) = 15.
-- Raise Undead (14), Sap Vitality (11) over threshold → regular.
update public.codex_archetypes
set
  level1_innate_powers = 'c7add61f-7b95-454a-ba13-9488604fa10f, 364633da-1b59-4c8c-b5b2-f7f89659e4c8',
  level1_powers = '5723bd39-86b6-48d1-bcad-ac80f00e26e1, 38bf86bf-f52f-4675-a085-4fe7ca8c2af5'
where id = '5' and name = 'Necromancer';

-- ========== Sorcerer ==========
-- Eligible @8: Icebolt, Fog Cloud, Slicken (pick 2 = 16). Elemental Burst Energy 0 → skip.
-- Proposed innate: Icebolt + Fog Cloud. Leave Slicken + Elemental Burst + Pulse as regular.
-- Alt (owner): Icebolt + Slicken, or Fog Cloud + Slicken.
update public.codex_archetypes
set
  level1_innate_powers = '35817a15-5e6e-42bc-8c72-53bebde3cae9, 73056f44-b0d0-4ec4-a302-818b5837e0c5',
  level1_powers = 'e196532f-4016-4d51-a9dc-ebb75ab3df4d, 4d21f2fc-538e-4150-958e-ef1abc2fc4ef, 26ee226a-975b-48f7-b839-7648744737f0'
where id = '7' and name = 'Sorcerer';

-- ========== Wardsmith ==========
-- Eligible: Warding Aura (8), Protective Ward (8 / Basic Reaction) = 16.
-- Bolster / Stone Ward / Inscribed Sanctum over threshold or heal → regular.
update public.codex_archetypes
set
  level1_innate_powers = 'd7217970-1005-4c8a-8ccd-28621b5bdd3f, 74393725-78bd-4081-877a-ba5a1879349c',
  level1_powers = 'c4f8432d-1182-44e6-828c-927da091201b, 1efe0455-11d2-4283-8d3e-42f0ea9bac18, 8a55df39-6f25-4bcf-ae50-666c71be05df'
where id = '10' and name = 'Wardsmith';

-- ========== Elementalist ==========
-- Only Level-1 power is Elemental Burst (Energy calc 0) — SKIP, no UPDATE.
-- ========== Martial paths ==========
-- No innate budget — no UPDATE.

-- Verify after apply (owner):
-- select name, level1_innate_powers, level1_powers from codex_archetypes
-- where type = 'power' order by name;
