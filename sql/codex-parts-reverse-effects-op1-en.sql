-- TASK-929 / ADR-0029: Reverse Effects (codex_parts id 388) op_1_en −1.5 → −0.5
-- The part description and op_1_desc both say "-0.5 EN per 1 EN of the reversed part"
-- (50% of the drawback's energy). The stored coefficient disagreed.
-- Owner approved in the "Power composition model" plan (the only codex write in this epic).
-- Applied 2026-09-24 via Supabase MCP.

-- Preview: no saved power references part 388 (official 0, user 0 on 2026-09-24).
-- select count(*) from official_powers where payload::text ilike '%Reverse Effects%';
-- select count(*) from user_powers where payload::text ilike '%Reverse Effects%';

update codex_parts
set op_1_en = -0.5
where id = '388'
  and name = 'Reverse Effects'
  and op_1_en = -1.5;

-- Verify
-- select id, name, op_1_en, op_1_desc from codex_parts where id = '388';
