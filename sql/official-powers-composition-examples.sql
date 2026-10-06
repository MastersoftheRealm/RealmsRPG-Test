-- TASK-933 / ADR-0029: rewrite three official Choice powers onto built-in variants.
-- Before: all damage types stored on one chassis + legacy Choice part (id 401) as a discount knob.
-- After: shared chassis (range / area / action) + one Choice variant per damage type;
--        legacy Choice part removed; `damage` column emptied (variants own the damage).
-- Owner-approved in the "Power composition model" plan (slice 5). Applied 2026-09-24 via Supabase MCP.
-- Only these three rows. Do not bulk-edit user powers.
--
-- Energy preview (live codex part costs, 2026-09-24). Those arrows are that day's preview, not targets.
-- The 2026-10-06 recomputation is in the PR. Do not re-run this file.
-- Energy preview (live codex part costs, 2026-09-24):
--   Elemental Burst  range 9, 1d10 fire|ice|lightning   legacy ≈ 8–9 (3×1d10 + split − Choice 12) → 8 (range 1.5 + 1d10 6)
--   Elemental Bolt   range 12, 1d6 ice|fire|lightning   legacy ≈ 6  (3×1d6 + split − Choice 9)   → 6 (range 2 + 1d6 4)
--   Judgement        sphere 1, 1d6 light|necrotic       legacy ≈ 5  ((4 + 4.5 + split − 5) ×1.25) → 6 (Necrotic 4.5 × 1.25, the pricier portion)
-- TP: Choice part (2 TP) drops; Elemental Damage splits by damage type (fire / ice / lightning).
-- Note: Elemental Burst's description says 1d6 while its stored damage is 1d10 — data kept as stored (1d10).

-- Preview (read-only)
-- select id, name, damage, payload->'parts' as parts, payload->'composition' as composition
-- from official_powers where name in ('Elemental Burst', 'Elemental Bolt', 'Judgement');

update official_powers
set damage = '[]'::jsonb,
    payload = (payload - 'parts') || jsonb_build_object(
      'parts', '[]'::jsonb,
      'composition', '{
        "structure": "choice",
        "variants": [
          {"id": "fire", "label": "Fire", "damage": [{"size": 10, "type": "fire", "amount": 1, "applyDuration": false}]},
          {"id": "ice", "label": "Ice", "damage": [{"size": 10, "type": "ice", "amount": 1, "applyDuration": false}]},
          {"id": "lightning", "label": "Lightning", "damage": [{"size": 10, "type": "lightning", "amount": 1, "applyDuration": false}]}
        ]
      }'::jsonb
    )
where id = '4d21f2fc-538e-4150-958e-ef1abc2fc4ef' and name = 'Elemental Burst';

update official_powers
set damage = '[]'::jsonb,
    payload = (payload - 'parts') || jsonb_build_object(
      'parts', '[]'::jsonb,
      'composition', '{
        "structure": "choice",
        "variants": [
          {"id": "fire", "label": "Fire", "damage": [{"size": 6, "type": "fire", "amount": 1, "applyDuration": false}]},
          {"id": "ice", "label": "Ice", "damage": [{"size": 6, "type": "ice", "amount": 1, "applyDuration": false}]},
          {"id": "lightning", "label": "Lightning", "damage": [{"size": 6, "type": "lightning", "amount": 1, "applyDuration": false}]}
        ]
      }'::jsonb
    )
where id = 'd3502f07-c733-44ec-8ec0-fbe246a3e3e3' and name = 'Elemental Bolt';

update official_powers
set damage = '[]'::jsonb,
    payload = (payload - 'parts') || jsonb_build_object(
      'parts', '[]'::jsonb,
      'composition', '{
        "structure": "choice",
        "variants": [
          {"id": "light", "label": "Light", "damage": [{"size": 6, "type": "light", "amount": 1, "applyDuration": false}]},
          {"id": "necrotic", "label": "Necrotic", "damage": [{"size": 6, "type": "necrotic", "amount": 1, "applyDuration": false}]}
        ]
      }'::jsonb
    )
where id = 'a34a7936-2265-4f59-86a8-f18cd3cde771' and name = 'Judgement';

-- Rollback (restores the 2026-09-24 pre-rewrite rows)
-- update official_powers set
--   damage = '[{"size":10,"type":"lightning","amount":1,"applyDuration":false},{"size":10,"type":"fire","amount":1,"applyDuration":false},{"size":10,"type":"ice","amount":1,"applyDuration":false}]'::jsonb,
--   payload = (payload - 'composition') || '{"parts":[{"id":401,"name":"Choice","op_1_lvl":12,"op_2_lvl":0,"op_3_lvl":0,"isAdvanced":true,"applyDuration":false}]}'::jsonb
-- where id = '4d21f2fc-538e-4150-958e-ef1abc2fc4ef';
-- update official_powers set
--   damage = '[{"size":6,"type":"ice","amount":1,"applyDuration":false},{"size":6,"type":"fire","amount":1,"applyDuration":false},{"size":6,"type":"lightning","amount":1,"applyDuration":false}]'::jsonb,
--   payload = (payload - 'composition') || '{"parts":[{"id":401,"name":"Choice","op_1_lvl":9,"op_2_lvl":0,"op_3_lvl":0,"isAdvanced":true,"applyDuration":false}]}'::jsonb
-- where id = 'd3502f07-c733-44ec-8ec0-fbe246a3e3e3';
-- update official_powers set
--   damage = '[{"size":6,"type":"necrotic","amount":1,"applyDuration":false},{"size":6,"type":"light","amount":1,"applyDuration":false}]'::jsonb,
--   payload = (payload - 'composition') || '{"parts":[{"id":401,"name":"Choice","op_1_lvl":5,"op_2_lvl":0,"op_3_lvl":0,"isAdvanced":true,"applyDuration":false}]}'::jsonb
-- where id = 'a34a7936-2265-4f59-86a8-f18cd3cde771';
