-- 86e3nwaru — codex_creature_feats.base_feat_id (one-shot; do not re-run after admin edits)
-- Apply only after a named Supabase backup. DROP COLUMN does not undo feat_lvl/feat_points edits.
-- Read-only check against RealmsRPG-Test on 2026-11-12: all 82 id+name predicates match one live row.
-- base_feat_id is not on the table yet. No predicate was changed. Roman-suffix rows in the table are these 49 children.
-- RAISE messages do not embed quotes; an earlier draft failed to parse for that reason.

BEGIN;

DO $$
DECLARE v_n integer;
BEGIN
  ALTER TABLE public.codex_creature_feats
    ADD COLUMN IF NOT EXISTS base_feat_id text;
  COMMENT ON COLUMN public.codex_creature_feats.base_feat_id IS
    'Level-1 creature feat id in this family. NULL on level-1 rows. Mirrors codex_feats.base_feat_id.';

  UPDATE public.codex_creature_feats SET feat_lvl = 3 WHERE id = '151' AND name = 'Create Thrall III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 1 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET feat_lvl = 2 WHERE id = '23'  AND name = 'Regional Revival II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 2 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET feat_lvl = 2 WHERE id = '137' AND name = 'Spectral Movement II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 3 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET feat_lvl = 1 WHERE id = '121' AND name = 'Ambusher';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 4 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET feat_lvl = 1 WHERE id = '109' AND name = 'Shapeshifter';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 5 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET feat_lvl = 1 WHERE id = '116' AND name = 'Spectral Movement';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 6 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET feat_points = 1 WHERE id = '120' AND name = 'Tunneller';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 7 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '121' AND name = 'Ambusher';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 8 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '13'  AND name = 'Blindsense';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 9 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '87'  AND name = 'Blood Rage';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 10 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '8'   AND name = 'Burrow';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 11 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '69'  AND name = 'Champion';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 12 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '92'  AND name = 'Constrictor';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 13 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '149' AND name = 'Create Thrall';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 14 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '10'  AND name = 'Darkvision';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 15 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '154' AND name = 'Dimensional Effect';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 16 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '58'  AND name = 'Elemental Affinity';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 17 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '6'   AND name = 'Flying';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 18 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '61'  AND name = 'Instinct';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 19 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '19'  AND name = 'Jump';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 20 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '64'  AND name = 'Lycanthrope';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 21 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '77'  AND name = 'Power Resistant';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 22 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '54'  AND name = 'Regenerative';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 23 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '164' AND name = 'Regional Revival';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 24 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '42'  AND name = 'Resources';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 25 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '109' AND name = 'Shapeshifter';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 26 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '39'  AND name = 'Slow';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 27 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '116' AND name = 'Spectral Movement';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 28 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '36'  AND name = 'Speedy';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 29 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '25'  AND name = 'Sun Sickness';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 30 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '27'  AND name = 'Telepathy';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 31 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '82'  AND name = 'Teleport';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 32 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '96'  AND name = 'Tight Grapple';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 33 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '121' WHERE id = '122' AND name = 'Ambusher II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 34 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '121' WHERE id = '123' AND name = 'Ambusher III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 35 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '13'  WHERE id = '14'  AND name = 'Blindsense II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 36 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '13'  WHERE id = '15'  AND name = 'Blindsense III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 37 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '13'  WHERE id = '16'  AND name = 'Blindsense IV';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 38 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '87'  WHERE id = '88'  AND name = 'Blood Rage II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 39 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '87'  WHERE id = '89'  AND name = 'Blood Rage III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 40 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '87'  WHERE id = '90'  AND name = 'Blood Rage IV';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 41 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '8'   WHERE id = '9'   AND name = 'Burrow II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 42 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '69'  WHERE id = '70'  AND name = 'Champion II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 43 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '69'  WHERE id = '71'  AND name = 'Champion III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 44 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '69'  WHERE id = '72'  AND name = 'Champion IV';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 45 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '69'  WHERE id = '73'  AND name = 'Champion V';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 46 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '69'  WHERE id = '74'  AND name = 'Champion VI';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 47 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '92'  WHERE id = '93'  AND name = 'Constrictor II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 48 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '92'  WHERE id = '94'  AND name = 'Constrictor III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 49 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '92'  WHERE id = '95'  AND name = 'Constrictor IV';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 50 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '149' WHERE id = '150' AND name = 'Create Thrall II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 51 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '149' WHERE id = '151' AND name = 'Create Thrall III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 52 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '10'  WHERE id = '11'  AND name = 'Darkvision II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 53 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '10'  WHERE id = '12'  AND name = 'Darkvision III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 54 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '154' WHERE id = '155' AND name = 'Dimensional Effect II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 55 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '58'  WHERE id = '59'  AND name = 'Elemental Affinity II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 56 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '58'  WHERE id = '60'  AND name = 'Elemental Affinity III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 57 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '6'   WHERE id = '7'   AND name = 'Flying II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 58 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '61'  WHERE id = '62'  AND name = 'Instinct II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 59 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '19'  WHERE id = '20'  AND name = 'Jump II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 60 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '19'  WHERE id = '21'  AND name = 'Jump III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 61 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '64'  WHERE id = '65'  AND name = 'Lycanthrope II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 62 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '64'  WHERE id = '66'  AND name = 'Lycanthrope III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 63 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '77'  WHERE id = '78'  AND name = 'Power Resistant II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 64 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '77'  WHERE id = '79'  AND name = 'Power Resistant III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 65 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '54'  WHERE id = '55'  AND name = 'Regenerative II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 66 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '54'  WHERE id = '56'  AND name = 'Regenerative III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 67 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '54'  WHERE id = '57'  AND name = 'Regenerative IV';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 68 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '164' WHERE id = '23'  AND name = 'Regional Revival II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 69 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '42'  WHERE id = '43'  AND name = 'Resources II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 70 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '109' WHERE id = '110' AND name = 'Shapeshifter II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 71 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '109' WHERE id = '111' AND name = 'Shapeshifter III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 72 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '39'  WHERE id = '40'  AND name = 'Slow II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 73 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '39'  WHERE id = '41'  AND name = 'Slow III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 74 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '116' WHERE id = '137' AND name = 'Spectral Movement II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 75 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '36'  WHERE id = '37'  AND name = 'Speedy II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 76 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '36'  WHERE id = '38'  AND name = 'Speedy III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 77 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '25'  WHERE id = '26'  AND name = 'Sun Sickness II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 78 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '27'  WHERE id = '28'  AND name = 'Telepathy II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 79 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '82'  WHERE id = '83'  AND name = 'Teleport II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 80 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '82'  WHERE id = '84'  AND name = 'Teleport III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 81 changed % rows, expected 1', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '96'  WHERE id = '97'  AND name = 'Tight Grapple II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'codex_creature_feats update 82 changed % rows, expected 1', v_n; END IF;

END $$;

COMMIT;
