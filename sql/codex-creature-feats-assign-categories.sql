-- Assign category on existing creature feats. Not applied.
-- Run only after a named Supabase backup and Kadin's OK.
--
-- Movement uses the stored codex_feats word "Movement" (not a new lowercase spelling).
-- Senses uses "Senses", title case like every other feat category. No feat row
-- has a senses category yet. This does not add any other new category word.
--
-- Rows not listed here stay null.
-- Updates only rows whose category is still null, so a later edit is not overwritten.
--
-- Rollback (do not run with the updates):
-- UPDATE public.codex_creature_feats
-- SET category = NULL
-- WHERE id IN (
--   '6','7','8','9','10','11','12','13','14','15','16','18','19','20','21',
--   '22','24','29','33','35','36','37','38','39','40','41','44'
-- );

UPDATE public.codex_creature_feats
SET category = CASE
  WHEN id IN (
    '6',  -- Flying
    '7',  -- Flying II
    '8',  -- Burrow
    '9',  -- Burrow II
    '18', -- Bounding
    '19', -- Jump
    '20', -- Jump II
    '21', -- Jump III
    '22', -- Slow Walker
    '24', -- All-Surface Climber
    '29', -- Compression
    '33', -- Water Movement
    '35', -- Unrestrained Movement
    '36', -- Speedy
    '37', -- Speedy II
    '38', -- Speedy III
    '39', -- Slow
    '40', -- Slow II
    '41', -- Slow III
    '44'  -- Hover
  ) THEN 'Movement'
  WHEN id IN (
    '10', -- Darkvision
    '11', -- Darkvision II
    '12', -- Darkvision III
    '13', -- Blindsense
    '14', -- Blindsense II
    '15', -- Blindsense III
    '16'  -- Blindsense IV
  ) THEN 'Senses'
  ELSE category
END
WHERE category IS NULL
  AND id IN (
    '6','7','8','9','10','11','12','13','14','15','16','18','19','20','21',
    '22','24','29','33','35','36','37','38','39','40','41','44'
  );
