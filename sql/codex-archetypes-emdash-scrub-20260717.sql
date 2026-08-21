-- APPLIED RealmsRPG-Test 2026-07-17 (TASK-530 /cleanup).
-- Replace em/en dashes in user-facing path copy with ASCII " - ".
-- Idempotent.

UPDATE codex_archetypes
SET
  description = replace(replace(description, E'\u2014', ' - '), E'\u2013', ' - '),
  level1_notes = CASE
    WHEN level1_notes IS NULL THEN NULL
    ELSE replace(replace(level1_notes, E'\u2014', ' - '), E'\u2013', ' - ')
  END,
  level1_guidance_groups = replace(
    replace(level1_guidance_groups::text, E'\u2014', ' - '),
    E'\u2013',
    ' - '
  )::jsonb
WHERE description ~ E'[\u2014\u2013]'
   OR coalesce(level1_notes, '') ~ E'[\u2014\u2013]'
   OR level1_guidance_groups::text ~ E'[\u2014\u2013]';
