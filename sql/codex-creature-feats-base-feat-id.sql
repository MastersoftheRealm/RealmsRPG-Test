-- 86e3nwaru — codex_creature_feats.base_feat_id (one-shot; do not re-run after admin edits)
-- Apply only after a named Supabase backup. DROP COLUMN does not undo feat_lvl/feat_points edits.

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
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 1 (feat_lvl = 3 WHERE id = '151' AND name = 'Create Thrall III'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET feat_lvl = 2 WHERE id = '23'  AND name = 'Regional Revival II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 2 (feat_lvl = 2 WHERE id = '23'  AND name = 'Regional Revival I...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET feat_lvl = 2 WHERE id = '137' AND name = 'Spectral Movement II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 3 (feat_lvl = 2 WHERE id = '137' AND name = 'Spectral Movement ...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET feat_lvl = 1 WHERE id = '121' AND name = 'Ambusher';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 4 (feat_lvl = 1 WHERE id = '121' AND name = 'Ambusher'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET feat_lvl = 1 WHERE id = '109' AND name = 'Shapeshifter';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 5 (feat_lvl = 1 WHERE id = '109' AND name = 'Shapeshifter'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET feat_lvl = 1 WHERE id = '116' AND name = 'Spectral Movement';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 6 (feat_lvl = 1 WHERE id = '116' AND name = 'Spectral Movement'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET feat_points = 1 WHERE id = '120' AND name = 'Tunneller';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 7 (feat_points = 1 WHERE id = '120' AND name = 'Tunneller'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '121' AND name = 'Ambusher';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 8 (base_feat_id = NULL WHERE id = '121' AND name = 'Ambusher'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '13'  AND name = 'Blindsense';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 9 (base_feat_id = NULL WHERE id = '13'  AND name = 'Blindsense'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '87'  AND name = 'Blood Rage';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 10 (base_feat_id = NULL WHERE id = '87'  AND name = 'Blood Rage'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '8'   AND name = 'Burrow';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 11 (base_feat_id = NULL WHERE id = '8'   AND name = 'Burrow'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '69'  AND name = 'Champion';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 12 (base_feat_id = NULL WHERE id = '69'  AND name = 'Champion'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '92'  AND name = 'Constrictor';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 13 (base_feat_id = NULL WHERE id = '92'  AND name = 'Constrictor...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '149' AND name = 'Create Thrall';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 14 (base_feat_id = NULL WHERE id = '149' AND name = 'Create Thra...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '10'  AND name = 'Darkvision';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 15 (base_feat_id = NULL WHERE id = '10'  AND name = 'Darkvision'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '154' AND name = 'Dimensional Effect';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 16 (base_feat_id = NULL WHERE id = '154' AND name = 'Dimensional...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '58'  AND name = 'Elemental Affinity';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 17 (base_feat_id = NULL WHERE id = '58'  AND name = 'Elemental A...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '6'   AND name = 'Flying';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 18 (base_feat_id = NULL WHERE id = '6'   AND name = 'Flying'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '61'  AND name = 'Instinct';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 19 (base_feat_id = NULL WHERE id = '61'  AND name = 'Instinct'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '19'  AND name = 'Jump';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 20 (base_feat_id = NULL WHERE id = '19'  AND name = 'Jump'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '64'  AND name = 'Lycanthrope';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 21 (base_feat_id = NULL WHERE id = '64'  AND name = 'Lycanthrope...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '77'  AND name = 'Power Resistant';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 22 (base_feat_id = NULL WHERE id = '77'  AND name = 'Power Resis...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '54'  AND name = 'Regenerative';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 23 (base_feat_id = NULL WHERE id = '54'  AND name = 'Regenerativ...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '164' AND name = 'Regional Revival';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 24 (base_feat_id = NULL WHERE id = '164' AND name = 'Regional Re...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '42'  AND name = 'Resources';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 25 (base_feat_id = NULL WHERE id = '42'  AND name = 'Resources'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '109' AND name = 'Shapeshifter';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 26 (base_feat_id = NULL WHERE id = '109' AND name = 'Shapeshifte...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '39'  AND name = 'Slow';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 27 (base_feat_id = NULL WHERE id = '39'  AND name = 'Slow'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '116' AND name = 'Spectral Movement';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 28 (base_feat_id = NULL WHERE id = '116' AND name = 'Spectral Mo...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '36'  AND name = 'Speedy';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 29 (base_feat_id = NULL WHERE id = '36'  AND name = 'Speedy'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '25'  AND name = 'Sun Sickness';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 30 (base_feat_id = NULL WHERE id = '25'  AND name = 'Sun Sicknes...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '27'  AND name = 'Telepathy';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 31 (base_feat_id = NULL WHERE id = '27'  AND name = 'Telepathy'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '82'  AND name = 'Teleport';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 32 (base_feat_id = NULL WHERE id = '82'  AND name = 'Teleport'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '96'  AND name = 'Tight Grapple';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 33 (base_feat_id = NULL WHERE id = '96'  AND name = 'Tight Grapp...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '121' WHERE id = '122' AND name = 'Ambusher II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 34 (base_feat_id = '121' WHERE id = '122' AND name = 'Ambusher I...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '121' WHERE id = '123' AND name = 'Ambusher III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 35 (base_feat_id = '121' WHERE id = '123' AND name = 'Ambusher I...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '13'  WHERE id = '14'  AND name = 'Blindsense II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 36 (base_feat_id = '13'  WHERE id = '14'  AND name = 'Blindsense...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '13'  WHERE id = '15'  AND name = 'Blindsense III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 37 (base_feat_id = '13'  WHERE id = '15'  AND name = 'Blindsense...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '13'  WHERE id = '16'  AND name = 'Blindsense IV';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 38 (base_feat_id = '13'  WHERE id = '16'  AND name = 'Blindsense...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '87'  WHERE id = '88'  AND name = 'Blood Rage II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 39 (base_feat_id = '87'  WHERE id = '88'  AND name = 'Blood Rage...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '87'  WHERE id = '89'  AND name = 'Blood Rage III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 40 (base_feat_id = '87'  WHERE id = '89'  AND name = 'Blood Rage...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '87'  WHERE id = '90'  AND name = 'Blood Rage IV';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 41 (base_feat_id = '87'  WHERE id = '90'  AND name = 'Blood Rage...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '8'   WHERE id = '9'   AND name = 'Burrow II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 42 (base_feat_id = '8'   WHERE id = '9'   AND name = 'Burrow II'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '69'  WHERE id = '70'  AND name = 'Champion II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 43 (base_feat_id = '69'  WHERE id = '70'  AND name = 'Champion I...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '69'  WHERE id = '71'  AND name = 'Champion III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 44 (base_feat_id = '69'  WHERE id = '71'  AND name = 'Champion I...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '69'  WHERE id = '72'  AND name = 'Champion IV';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 45 (base_feat_id = '69'  WHERE id = '72'  AND name = 'Champion I...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '69'  WHERE id = '73'  AND name = 'Champion V';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 46 (base_feat_id = '69'  WHERE id = '73'  AND name = 'Champion V...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '69'  WHERE id = '74'  AND name = 'Champion VI';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 47 (base_feat_id = '69'  WHERE id = '74'  AND name = 'Champion V...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '92'  WHERE id = '93'  AND name = 'Constrictor II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 48 (base_feat_id = '92'  WHERE id = '93'  AND name = 'Constricto...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '92'  WHERE id = '94'  AND name = 'Constrictor III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 49 (base_feat_id = '92'  WHERE id = '94'  AND name = 'Constricto...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '92'  WHERE id = '95'  AND name = 'Constrictor IV';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 50 (base_feat_id = '92'  WHERE id = '95'  AND name = 'Constricto...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '149' WHERE id = '150' AND name = 'Create Thrall II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 51 (base_feat_id = '149' WHERE id = '150' AND name = 'Create Thr...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '149' WHERE id = '151' AND name = 'Create Thrall III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 52 (base_feat_id = '149' WHERE id = '151' AND name = 'Create Thr...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '10'  WHERE id = '11'  AND name = 'Darkvision II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 53 (base_feat_id = '10'  WHERE id = '11'  AND name = 'Darkvision...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '10'  WHERE id = '12'  AND name = 'Darkvision III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 54 (base_feat_id = '10'  WHERE id = '12'  AND name = 'Darkvision...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '154' WHERE id = '155' AND name = 'Dimensional Effect II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 55 (base_feat_id = '154' WHERE id = '155' AND name = 'Dimensiona...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '58'  WHERE id = '59'  AND name = 'Elemental Affinity II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 56 (base_feat_id = '58'  WHERE id = '59'  AND name = 'Elemental ...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '58'  WHERE id = '60'  AND name = 'Elemental Affinity III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 57 (base_feat_id = '58'  WHERE id = '60'  AND name = 'Elemental ...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '6'   WHERE id = '7'   AND name = 'Flying II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 58 (base_feat_id = '6'   WHERE id = '7'   AND name = 'Flying II'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '61'  WHERE id = '62'  AND name = 'Instinct II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 59 (base_feat_id = '61'  WHERE id = '62'  AND name = 'Instinct I...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '19'  WHERE id = '20'  AND name = 'Jump II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 60 (base_feat_id = '19'  WHERE id = '20'  AND name = 'Jump II'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '19'  WHERE id = '21'  AND name = 'Jump III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 61 (base_feat_id = '19'  WHERE id = '21'  AND name = 'Jump III'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '64'  WHERE id = '65'  AND name = 'Lycanthrope II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 62 (base_feat_id = '64'  WHERE id = '65'  AND name = 'Lycanthrop...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '64'  WHERE id = '66'  AND name = 'Lycanthrope III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 63 (base_feat_id = '64'  WHERE id = '66'  AND name = 'Lycanthrop...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '77'  WHERE id = '78'  AND name = 'Power Resistant II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 64 (base_feat_id = '77'  WHERE id = '78'  AND name = 'Power Resi...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '77'  WHERE id = '79'  AND name = 'Power Resistant III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 65 (base_feat_id = '77'  WHERE id = '79'  AND name = 'Power Resi...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '54'  WHERE id = '55'  AND name = 'Regenerative II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 66 (base_feat_id = '54'  WHERE id = '55'  AND name = 'Regenerati...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '54'  WHERE id = '56'  AND name = 'Regenerative III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 67 (base_feat_id = '54'  WHERE id = '56'  AND name = 'Regenerati...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '54'  WHERE id = '57'  AND name = 'Regenerative IV';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 68 (base_feat_id = '54'  WHERE id = '57'  AND name = 'Regenerati...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '164' WHERE id = '23'  AND name = 'Regional Revival II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 69 (base_feat_id = '164' WHERE id = '23'  AND name = 'Regional R...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '42'  WHERE id = '43'  AND name = 'Resources II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 70 (base_feat_id = '42'  WHERE id = '43'  AND name = 'Resources ...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '109' WHERE id = '110' AND name = 'Shapeshifter II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 71 (base_feat_id = '109' WHERE id = '110' AND name = 'Shapeshift...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '109' WHERE id = '111' AND name = 'Shapeshifter III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 72 (base_feat_id = '109' WHERE id = '111' AND name = 'Shapeshift...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '39'  WHERE id = '40'  AND name = 'Slow II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 73 (base_feat_id = '39'  WHERE id = '40'  AND name = 'Slow II'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '39'  WHERE id = '41'  AND name = 'Slow III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 74 (base_feat_id = '39'  WHERE id = '41'  AND name = 'Slow III'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '116' WHERE id = '137' AND name = 'Spectral Movement II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 75 (base_feat_id = '116' WHERE id = '137' AND name = 'Spectral M...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '36'  WHERE id = '37'  AND name = 'Speedy II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 76 (base_feat_id = '36'  WHERE id = '37'  AND name = 'Speedy II'...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '36'  WHERE id = '38'  AND name = 'Speedy III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 77 (base_feat_id = '36'  WHERE id = '38'  AND name = 'Speedy III...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '25'  WHERE id = '26'  AND name = 'Sun Sickness II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 78 (base_feat_id = '25'  WHERE id = '26'  AND name = 'Sun Sickne...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '27'  WHERE id = '28'  AND name = 'Telepathy II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 79 (base_feat_id = '27'  WHERE id = '28'  AND name = 'Telepathy ...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '82'  WHERE id = '83'  AND name = 'Teleport II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 80 (base_feat_id = '82'  WHERE id = '83'  AND name = 'Teleport I...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '82'  WHERE id = '84'  AND name = 'Teleport III';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 81 (base_feat_id = '82'  WHERE id = '84'  AND name = 'Teleport I...), got %', v_n; END IF;

  UPDATE public.codex_creature_feats SET base_feat_id = '96'  WHERE id = '97'  AND name = 'Tight Grapple II';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'Expected ROW_COUNT 1 for update 82 (base_feat_id = '96'  WHERE id = '97'  AND name = 'Tight Grap...), got %', v_n; END IF;
END $$;

COMMIT;
