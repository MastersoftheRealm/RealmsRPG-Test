# Creator sections — fix plan

Plan only. Checked on master `f57027a`. Dice: Kadin, Nov 20, 2026, 8:04 PM, 8:22 PM, and 8:46 PM ET, and Nov 21, 2026, 8:11 AM ET. Creators keep `{amount, size}`. Faces are d4–d12 (`DIE_SIZES`). No d2 in a creator, no d20, no mixed dice, no stepping, no creator count cap. The database ceiling below is `Number.MAX_SAFE_INTEGER`, the same bound as `Number.isSafeInteger`, not a stepper maximum.

The 10 and 12 in #620 are fixtures. Live parts (`power-composition-parts.snapshot.json`): Magic Damage 3, Additional Damage 2, Quick ×1.25, Minute 0.75, Sphere ×1.25. Quick Action raw energy is 5.75 today and 6.25 after (published 6 then 7). A 1d4 with Apply duration and a minute badges 5.25 on power and 3 on empowered.

## Done when

- Quick, Free, Long, and Reaction scale both halves once. A non-action power percentage does not. The power half is not scaled twice.
- One `PART_IDS` section-cost function feeds damage, area, range, power parts, and power mechanics badges.
- `addMechanicPart` inserts the first mechanic again. `nextMechanicPartToAdd` is deleted.
- Instant or 1 round clears the four duration modifiers from both config components, not from `empowered-technique-part-actions.ts`.
- One face list. The seven steppers have no maximum (removed in PR A).
- The library routes reject a face outside `DIE_SIZES` and a count that is not `typeof number` and `Number.isSafeInteger` and ≥ 1. `shieldDamage` null and an empty damage array pass. This is an app-path check, not a database guarantee: `authenticated` has `GRANT ALL` on the user library tables, and the owner INSERT/UPDATE policies only require `user_id = auth.uid()`.
- PR C is the database constraint. Its SQL is below. It is not applied from this draft.
- The empowered workspace hook warns only when `no-attack-creator-warning.ts` would. A buff does not. New warning wording is `PLACEHOLDER_COPY` (Kadin) and does not say “this power”.
- One payload builder serves the cost hook and the four readers. A missing or empty power-parts list is “not loaded” (`powerPartsDb || []` in `enrich-character.ts` 103–106, `?? []` in `creature-creator-library-selectables.ts` 181–182). That shows a dash, never `totals.energy`.
- Creator rows, empowered `autoMechanics`, `enrich-techniques.ts:66`, and `characterPartsToPartData` keep two rows with the same id. Item properties still collapse.
- `composedPowerSavedParts` stays deduped by part id. It is only the filter, search, and category-tag list: it answers whether a power uses a part.
- `powerVariantChipDescription` (`src/lib/power-variant-chips.ts` line 82, today `[...new Set(partNames)]`) shows each version’s repeats as a count. One copy stays the name. Two copies of that name are `Elemental Damage ×2`. That ` ×N` suffix is the mechanical format from the Nov 21 ruling, not new copy. The helper stays private. The test calls `buildPowerVariantChips`.
- `expandLegacyRandomizeFace` (`power-composition.ts` 475 and 489) keeps its dedupe. It was added in `9232be39` so Shared defaults are not priced twice. Nine live user Randomize powers rely on it.

## Order

PR A, then a plan-only critic pass on the SQL in this file, then Kadin runs the backup, then PR C is applied only with his OK. PR B can land any time after PR A. This draft does not apply SQL.

## Three PRs

REAL FIX together. Critic plan pass here first. PR A and PR C are high-risk. PR B is presentation.

**PR A — behavior.** Section costs by `PART_IDS` (replace the name lists in `power-creator-cost-derivation.ts` ~290–355 and `empowered-technique-cost-derivation.ts` 268–365). Duration-clear function called from the two config components only. One add-part module. Action scaler in `calculateEmpoweredTechniqueCosts`. `empowered-energy-breakdown.ts` (54–76) uses that result. Extract the payload builder from `empowered-technique-cost-derivation.ts` 93–235 for the hook and for `enrich-techniques.ts`, `buildOfficialTechniqueRows`, `build-empowered-selectable-item.ts`, and `creature-creator-library-selectables.ts`. Pass the power-parts list from `enrich-character.ts`, `LibraryTechniquesTab`, the official technique list, and guided L2. Remove `max={20}` and `max={10}` on the seven steppers here. App-path dice check in `persistedLibraryBodyShapeError` just after `library-persisted-contract.ts:364`, used by user POST, user PATCH, and official POST through `validateUserLibraryWriteBody`. Stop `dedupeSavedParts` on empowered `autoMechanics`, at `enrich-techniques.ts:66`, and in `characterPartsToPartData`. Leave it in `composedPowerSavedParts` and in `expandLegacyRandomizeFace`. Replace the `new Set` in `powerVariantChipDescription` with the ` ×N` count. Do not export that helper.

**PR B — presentation.** Three components: dice row, action section, power-config section. From Shared, variants, and the lock are slots. The dice row takes weapon types, the shield’s fixed label, and minimum 0 or 1, and no maximum. Render tests per caller. Retarget `button-tiers.test.ts`, `website-bugs-batch-26.test.ts`, and the text scans in `power-creator-part-actions.test.ts`.

**PR C — data SQL.** Separate PR. The SQL below is the text the critic reviews before anyone applies it. A later change of the rule is a new function and a new constraint, never `CREATE OR REPLACE` of this function. `FEATURE_INDEX.md` notes that any object with both an `amount` key and a `size` key is checked.

Use one `LANGUAGE sql` function, not a trigger. The rule is a predicate. `sync_library_promoted_columns` already copies payload dice into columns; a second trigger can be skipped and can race that copy. A CHECK cannot be skipped. `$.**` is one walk, so a column CHECK does not need its own loop.

`ADD CONSTRAINT` in PostgreSQL 17 takes `ACCESS EXCLUSIVE` until `COMMIT` even with `NOT VALID`, so this file does not use `NOT VALID` or `VALIDATE`. The largest table is `user_powers` (206 rows). The transaction sets `lock_timeout` to 5 seconds and `statement_timeout` to 60 seconds. If the lock is not free, the whole transaction aborts and nothing is left behind.

The predicate is written once, inside `library_dice_document_valid`. The pre-check calls that function. It does not declare a `path` variable, because `path` is also a PostgreSQL type. Both keys are JSON numbers (reject `"4"`, `true`, and `null`); count is a whole number and `1 <= count <= 9007199254740991`; size is 4, 6, 8, 10, or 12. SQL NULL and `[]` pass. An object without both keys is ignored (`user_species` stores size-only creature objects). `&&` is ordered so `.floor()` runs only after `.type() == "number"`. `ADD CONSTRAINT` checks existing rows too. If the pre-check raises or an `ADD` fails, this transaction rolls back and nothing is left behind.

```sql
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE FUNCTION public.library_dice_document_valid(doc jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT doc IS NULL
    OR NOT pg_catalog.jsonb_path_exists(
      doc,
      'strict $.** ? (
        exists(@.amount) && exists(@.size) && !(
          @.amount.type() == "number"
          && @.size.type() == "number"
          && @.amount == @.amount.floor()
          && @.amount >= 1
          && @.amount <= 9007199254740991
          && (@.size == 4 || @.size == 6 || @.size == 8
              || @.size == 10 || @.size == 12)
        )
      )'::pg_catalog.jsonpath
    );
$$;

REVOKE ALL ON FUNCTION public.library_dice_document_valid(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.library_dice_document_valid(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.library_dice_document_valid(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.library_dice_document_valid(jsonb) TO service_role;

DO $precheck$
DECLARE
  bad bigint;
BEGIN
  SELECT count(*) INTO bad FROM public.user_powers
    WHERE NOT public.library_dice_document_valid(damage);
  IF bad > 0 THEN RAISE EXCEPTION 'user_powers.damage has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.official_powers
    WHERE NOT public.library_dice_document_valid(damage);
  IF bad > 0 THEN RAISE EXCEPTION 'official_powers.damage has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.user_techniques
    WHERE NOT public.library_dice_document_valid(damage);
  IF bad > 0 THEN RAISE EXCEPTION 'user_techniques.damage has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.official_techniques
    WHERE NOT public.library_dice_document_valid(damage);
  IF bad > 0 THEN RAISE EXCEPTION 'official_techniques.damage has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.user_empowered_techniques
    WHERE NOT public.library_dice_document_valid(damage);
  IF bad > 0 THEN RAISE EXCEPTION 'user_empowered_techniques.damage has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.official_empowered_techniques
    WHERE NOT public.library_dice_document_valid(damage);
  IF bad > 0 THEN RAISE EXCEPTION 'official_empowered_techniques.damage has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.user_items
    WHERE NOT public.library_dice_document_valid(damage);
  IF bad > 0 THEN RAISE EXCEPTION 'user_items.damage has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.official_items
    WHERE NOT public.library_dice_document_valid(damage);
  IF bad > 0 THEN RAISE EXCEPTION 'official_items.damage has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.user_items
    WHERE NOT public.library_dice_document_valid(shield_dr);
  IF bad > 0 THEN RAISE EXCEPTION 'user_items.shield_dr has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.user_items
    WHERE NOT public.library_dice_document_valid(shield_damage);
  IF bad > 0 THEN RAISE EXCEPTION 'user_items.shield_damage has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.official_items
    WHERE NOT public.library_dice_document_valid(shield_dr);
  IF bad > 0 THEN RAISE EXCEPTION 'official_items.shield_dr has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.official_items
    WHERE NOT public.library_dice_document_valid(shield_damage);
  IF bad > 0 THEN RAISE EXCEPTION 'official_items.shield_damage has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.user_powers
    WHERE NOT public.library_dice_document_valid(payload);
  IF bad > 0 THEN RAISE EXCEPTION 'user_powers.payload has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.official_powers
    WHERE NOT public.library_dice_document_valid(payload);
  IF bad > 0 THEN RAISE EXCEPTION 'official_powers.payload has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.user_techniques
    WHERE NOT public.library_dice_document_valid(payload);
  IF bad > 0 THEN RAISE EXCEPTION 'user_techniques.payload has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.official_techniques
    WHERE NOT public.library_dice_document_valid(payload);
  IF bad > 0 THEN RAISE EXCEPTION 'official_techniques.payload has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.user_empowered_techniques
    WHERE NOT public.library_dice_document_valid(payload);
  IF bad > 0 THEN RAISE EXCEPTION 'user_empowered_techniques.payload has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.official_empowered_techniques
    WHERE NOT public.library_dice_document_valid(payload);
  IF bad > 0 THEN RAISE EXCEPTION 'official_empowered_techniques.payload has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.user_items
    WHERE NOT public.library_dice_document_valid(payload);
  IF bad > 0 THEN RAISE EXCEPTION 'user_items.payload has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.official_items
    WHERE NOT public.library_dice_document_valid(payload);
  IF bad > 0 THEN RAISE EXCEPTION 'official_items.payload has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.user_creatures
    WHERE NOT public.library_dice_document_valid(payload);
  IF bad > 0 THEN RAISE EXCEPTION 'user_creatures.payload has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.official_creatures
    WHERE NOT public.library_dice_document_valid(payload);
  IF bad > 0 THEN RAISE EXCEPTION 'official_creatures.payload has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.official_enhanced_items
    WHERE NOT public.library_dice_document_valid(payload);
  IF bad > 0 THEN RAISE EXCEPTION 'official_enhanced_items.payload has % bad dice', bad; END IF;
  SELECT count(*) INTO bad FROM public.user_enhanced_items
    WHERE NOT public.library_dice_document_valid(data);
  IF bad > 0 THEN RAISE EXCEPTION 'user_enhanced_items.data has % bad dice', bad; END IF;
END
$precheck$;

ALTER TABLE public.user_powers
  ADD CONSTRAINT user_powers_damage_dice_chk
  CHECK (public.library_dice_document_valid(damage));
ALTER TABLE public.user_powers
  ADD CONSTRAINT user_powers_payload_dice_chk
  CHECK (public.library_dice_document_valid(payload));
ALTER TABLE public.official_powers
  ADD CONSTRAINT official_powers_damage_dice_chk
  CHECK (public.library_dice_document_valid(damage));
ALTER TABLE public.official_powers
  ADD CONSTRAINT official_powers_payload_dice_chk
  CHECK (public.library_dice_document_valid(payload));
ALTER TABLE public.user_techniques
  ADD CONSTRAINT user_techniques_damage_dice_chk
  CHECK (public.library_dice_document_valid(damage));
ALTER TABLE public.user_techniques
  ADD CONSTRAINT user_techniques_payload_dice_chk
  CHECK (public.library_dice_document_valid(payload));
ALTER TABLE public.official_techniques
  ADD CONSTRAINT official_techniques_damage_dice_chk
  CHECK (public.library_dice_document_valid(damage));
ALTER TABLE public.official_techniques
  ADD CONSTRAINT official_techniques_payload_dice_chk
  CHECK (public.library_dice_document_valid(payload));
ALTER TABLE public.user_empowered_techniques
  ADD CONSTRAINT user_empowered_techniques_damage_dice_chk
  CHECK (public.library_dice_document_valid(damage));
ALTER TABLE public.user_empowered_techniques
  ADD CONSTRAINT user_empowered_techniques_payload_dice_chk
  CHECK (public.library_dice_document_valid(payload));
ALTER TABLE public.official_empowered_techniques
  ADD CONSTRAINT official_empowered_techniques_damage_dice_chk
  CHECK (public.library_dice_document_valid(damage));
ALTER TABLE public.official_empowered_techniques
  ADD CONSTRAINT official_empowered_techniques_payload_dice_chk
  CHECK (public.library_dice_document_valid(payload));
ALTER TABLE public.user_items
  ADD CONSTRAINT user_items_damage_dice_chk
  CHECK (public.library_dice_document_valid(damage));
ALTER TABLE public.user_items
  ADD CONSTRAINT user_items_shield_dr_dice_chk
  CHECK (public.library_dice_document_valid(shield_dr));
ALTER TABLE public.user_items
  ADD CONSTRAINT user_items_shield_damage_dice_chk
  CHECK (public.library_dice_document_valid(shield_damage));
ALTER TABLE public.user_items
  ADD CONSTRAINT user_items_payload_dice_chk
  CHECK (public.library_dice_document_valid(payload));
ALTER TABLE public.official_items
  ADD CONSTRAINT official_items_damage_dice_chk
  CHECK (public.library_dice_document_valid(damage));
ALTER TABLE public.official_items
  ADD CONSTRAINT official_items_shield_dr_dice_chk
  CHECK (public.library_dice_document_valid(shield_dr));
ALTER TABLE public.official_items
  ADD CONSTRAINT official_items_shield_damage_dice_chk
  CHECK (public.library_dice_document_valid(shield_damage));
ALTER TABLE public.official_items
  ADD CONSTRAINT official_items_payload_dice_chk
  CHECK (public.library_dice_document_valid(payload));
ALTER TABLE public.user_creatures
  ADD CONSTRAINT user_creatures_payload_dice_chk
  CHECK (public.library_dice_document_valid(payload));
ALTER TABLE public.official_creatures
  ADD CONSTRAINT official_creatures_payload_dice_chk
  CHECK (public.library_dice_document_valid(payload));
ALTER TABLE public.official_enhanced_items
  ADD CONSTRAINT official_enhanced_items_payload_dice_chk
  CHECK (public.library_dice_document_valid(payload));
ALTER TABLE public.user_enhanced_items
  ADD CONSTRAINT user_enhanced_items_data_dice_chk
  CHECK (public.library_dice_document_valid(data));

COMMIT;
```

The owner keeps `EXECUTE` because PostgreSQL grants it to the creating role. `PUBLIC` and `anon` do not.

Covered columns are exactly the ones in the `ALTER TABLE` statements: `damage` on user and official powers, techniques, empowered techniques, and items; `shield_dr` and `shield_damage` on user and official items; `payload` on those tables plus `user_creatures`, `official_creatures`, and `official_enhanced_items`; `user_enhanced_items.data`. Creature rows have no dice columns. Copies inside `payload` are covered, including a die nested under a power or a weapon. Left out on purpose: `codex_change_logs` (`changed_fields`, `before_data`, `after_data` are an audit trail). `characters`, `encounters`, `campaigns`, `crafting_sessions`, and `vtt_tokens` store no dice today. Add this same check if one of them later embeds a library copy.

Enhanced-item routes do not call `validateUserLibraryWriteBody`. They save a base-item id and a power id. The CHECK still covers `official_enhanced_items.payload` and `user_enhanced_items.data`.

A read-only scan already found 217 dice objects, all valid, so the pre-check is expected to pass. If it raises, the transaction rolls back and no constraint is added. No row is rewritten.

Kadin runs `npm run db:backup` (`scripts/supabase-backup.ps1`) immediately before apply. The PR records the backup folder and exit 0. After apply, run `npm run db:diff` and update the schema baseline. Agents do not apply this file.

Rollback is a separate `sql/library-dice-document-valid-rollback.sql`. The post-rollback pgTAP test runs this file, not a copy of it. Constraints first, then the function:

```sql
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
ALTER TABLE public.user_powers DROP CONSTRAINT IF EXISTS user_powers_damage_dice_chk;
ALTER TABLE public.user_powers DROP CONSTRAINT IF EXISTS user_powers_payload_dice_chk;
ALTER TABLE public.official_powers DROP CONSTRAINT IF EXISTS official_powers_damage_dice_chk;
ALTER TABLE public.official_powers DROP CONSTRAINT IF EXISTS official_powers_payload_dice_chk;
ALTER TABLE public.user_techniques DROP CONSTRAINT IF EXISTS user_techniques_damage_dice_chk;
ALTER TABLE public.user_techniques DROP CONSTRAINT IF EXISTS user_techniques_payload_dice_chk;
ALTER TABLE public.official_techniques DROP CONSTRAINT IF EXISTS official_techniques_damage_dice_chk;
ALTER TABLE public.official_techniques DROP CONSTRAINT IF EXISTS official_techniques_payload_dice_chk;
ALTER TABLE public.user_empowered_techniques DROP CONSTRAINT IF EXISTS user_empowered_techniques_damage_dice_chk;
ALTER TABLE public.user_empowered_techniques DROP CONSTRAINT IF EXISTS user_empowered_techniques_payload_dice_chk;
ALTER TABLE public.official_empowered_techniques DROP CONSTRAINT IF EXISTS official_empowered_techniques_damage_dice_chk;
ALTER TABLE public.official_empowered_techniques DROP CONSTRAINT IF EXISTS official_empowered_techniques_payload_dice_chk;
ALTER TABLE public.user_items DROP CONSTRAINT IF EXISTS user_items_damage_dice_chk;
ALTER TABLE public.user_items DROP CONSTRAINT IF EXISTS user_items_shield_dr_dice_chk;
ALTER TABLE public.user_items DROP CONSTRAINT IF EXISTS user_items_shield_damage_dice_chk;
ALTER TABLE public.user_items DROP CONSTRAINT IF EXISTS user_items_payload_dice_chk;
ALTER TABLE public.official_items DROP CONSTRAINT IF EXISTS official_items_damage_dice_chk;
ALTER TABLE public.official_items DROP CONSTRAINT IF EXISTS official_items_shield_dr_dice_chk;
ALTER TABLE public.official_items DROP CONSTRAINT IF EXISTS official_items_shield_damage_dice_chk;
ALTER TABLE public.official_items DROP CONSTRAINT IF EXISTS official_items_payload_dice_chk;
ALTER TABLE public.user_creatures DROP CONSTRAINT IF EXISTS user_creatures_payload_dice_chk;
ALTER TABLE public.official_creatures DROP CONSTRAINT IF EXISTS official_creatures_payload_dice_chk;
ALTER TABLE public.official_enhanced_items DROP CONSTRAINT IF EXISTS official_enhanced_items_payload_dice_chk;
ALTER TABLE public.user_enhanced_items DROP CONSTRAINT IF EXISTS user_enhanced_items_data_dice_chk;
DROP FUNCTION IF EXISTS public.library_dice_document_valid(jsonb);
COMMIT;
```

pgTAP reuses the harness in `scripts/run-inventory-cas-pgtap.mjs` (JWT via `request.jwt.claim.sub` and `request.jwt.claim.role`, as `sql/tests/inventory_cas_pgtap_relational.sql` does) as a new `scripts/run-library-dice-pgtap.mjs` and an npm script wired into CI. Tests run against the canonical SQL file. Bad `INSERT` and `UPDATE` as `authenticated` through the owner policies, and as `service_role`, on every covered column, including a bad die nested in `user_creatures.payload`. A master-negative test: the same bad insert succeeds on master, where the constraint does not exist. Valid rows, SQL NULL, `[]`, and `shield_damage` null still write as `authenticated`. A post-rollback test runs `sql/library-dice-document-valid-rollback.sql` as written above, then the bad insert succeeds again.

`insert_user_library_row_with_quota` (`src/app/api/user/library/[type]/route.ts`, both insert sites) and the PATCH in `src/app/api/user/library/[type]/[id]/route.ts` (the catch at line 181 is a 500 today) map SQLSTATE `23514` whose message names a `*_dice_chk` constraint to 400 `{ error: 'Die size must be 4, 6, 8, 10, or 12, and the count must be a whole number from 1 up.' }`. Other `23514` errors stay on their current path. Official library writes of these columns use the same mapper.

## Stays separate

Weapon types and the shield label stay props. Variant chrome stays in the power caller. The cheaper-energy attack pick stays in the cost hook. Technique damage has no type and no Apply Duration. `formatTechniqueDamage` stays technique-only. Item-property dedupe stays. `composedPowerProficiencyParts` stays on its damage-type rule. Range steps, area level, and armor’s flat reduction keep their own caps. Creature and species editors stay out of PR A and PR B.

## Saves

No stored die face of 2 or 20. “1d2” on 33 user powers, 20 user items, 5 user techniques, and 7 user creatures is codex option text. `{amount: 5, size: 8}` round-trips. Three empowered rows store `totals.energy` (2 official, 1 user). Readers ignore it. No data rewrite in any of the three PRs.

## Tests

Lines marked guard already pass on master. The others fail on current master through the real path.

| Done when | Test |
|---|---|
| Both halves, fixture 10→12 | #620 cost hooks |
| Live 5.75→6.25 and damage badge 3→5.25 | Same hooks, snapshot parts |
| Non-action % leaves the technique half alone | Guard. Hook with a non-action percentage and no action part |
| Quick plus a non-action % | Fails today. Technique half = flat technique cost × the action multiplier only |
| Range with Apply duration matches power’s section contribution | Empowered hook. Section-only pricing is the current miss |
| Power-part and mechanic badges match power | Same hook |
| Add twice | `addMechanicPart` on the real power hook |
| 1 round clears the four flags | Empowered config handlers |
| No warning on a buff; warning on a cone or technique damage | Empowered workspace hook |
| Breakdown lines equal `energyRaw` | Guard. `buildEmpoweredAdvancedCalculationGroups` |
| Live Quick Action breakdown total is 6.25 | Same builder. Today the technique line is unscaled, so the total is 5.75 |
| Four readers ignore a stale Quick Action total | Each reader, non-empty codex; empty codex returns a dash |
| Hook and one reader agree | Same saved row through the payload builder |
| Two same-id rows stay | Empowered save `autoMechanics`; `enrichTechniques`; `characterPartsToPartData` |
| Filter list is presence only | `composedPowerSavedParts`: two copies of one part, and one part on two variants, each yield that id once |
| Version list shows the count | `buildPowerVariantChips`: two same-name parts on one version render `Elemental Damage ×2`; one copy has no suffix. `powerVariantChipDescription` is not exported |
| Shared default priced once | `expandLegacyRandomizeFace`: a repeated Shared part in a legacy face is priced once |
| App-path dice rule | `validateUserLibraryWriteBody`: reject size 2 and 20, reject 1.5, `"4"`, and 0; accept a safe integer above 20; accept `shieldDamage: null` and `damage: []` |
| Database rule | PR C pgTAP, above, including the 400 mapping for `*_dice_chk` |

## What players see

Empowered badges include duration. That Quick Action case publishes 7, not 6. The same part can be added twice and still shows twice on the creator and on a version line as `Elemental Damage ×2`. Filters and category tags still list that part once. An old Randomize face does not pay twice for a Shared part it inherited. At 1 round, empowered drops those four modifiers. Dice counts are no longer stopped at 10 or 20. Sizes stay d4 through d12. A save with any other size is refused, including a direct database write once PR C is applied. Empowered warns on No Weapon/Attack only when an attack or damage is still attached.

## Flag

`dedupeSavedParts` stays for item properties, for `composedPowerSavedParts`, and for `expandLegacyRandomizeFace`. It comes off the creator rows, empowered `autoMechanics`, the technique enrich chips, and `characterPartsToPartData`.
