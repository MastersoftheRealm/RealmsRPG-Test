# Determination: was the codex data loss intentional, or a systematic editing bug?

**Question posed by the owner:** the 22 parts and 1 feat that lost values "may have been intentionally
removed as an edit to the data itself, or it could be a systematic problem when editing occurs data is
lost — we need to determine this."

**Answer: the observed losses were intentional editorial work. My audit finding P0-3 was wrong and is
retracted. However, the underlying code defect (F-01) is real, still live, and has simply not been
triggered yet.**

Both halves matter, so both are documented below.

---

## Method

The `codex_change_logs` table stores `before_data`, `after_data`, and — critically — `changed_fields`,
a JSONB array of `{field, before, after}` objects recording what the application *believed* it was
changing. That third column is the discriminator my original audit did not consult:

- If a null appears in `changed_fields` with an explicit `before`/`after`, the application knew it was
  clearing the field. That is a deliberate edit.
- If a field silently differs between `before_data` and `after_data` but is **absent** from
  `changed_fields`, the application did not know. That is collateral loss.

I pulled `changed_fields` for all 22 affected parts and the affected feat.

---

## Verdict 1 — the 22 codex parts: INTENTIONAL

Every single null was recorded in `changed_fields` with an explicit before/after, and every one
occurred inside a save that also made substantive, coherent editorial changes. Five independent lines
of evidence:

**1. Two options literally said they should be deleted.**

| Part | Field | `before` value |
|---|---|---|
| `Absorb` (214) | `op_1_desc` | "If you're seeing this option, it needs to be deleted." |
| `Ability Increase` (126) | `op_2_desc` | "If you're seeing this option, it needs to be deleted." |

**2. Four options held spreadsheet error artifacts being cleaned up.** `op_N_desc` = `#ERROR!` on
`Growth` (366), `Immune to Take-Over` (202), and `Manipulate Earth` (322) ×2.

**3. The dominant theme is a deliberate duration-system refactor.** The removed options are
overwhelmingly ones that charged Energy "per additional round / minute / hour / day" — exactly what
becomes redundant once duration is a first-class Power property. In each case the description was
rewritten in the same save to say so. Examples:

| Part | Removed option | Same-save description change |
|---|---|---|
| `Freeze Time` (363) | "+11 EN, +1 TP per additional round of frozen time" | now reads "The duration for this power is the amount of time you have with frozen time" |
| `Communicate` (194) | "+2 EN to extend this to one hour", "+6 EN … one day" | dropped "for one minute" from the description |
| `Terraform` (365) | "+11 EN, +1 TP for every additional 5 minutes" | dropped "Lasts for 5 minutes" |
| `Empower Plant` (367) | "+3 EN, +1 TP per additional minute" | dropped "Lasts 1 minute" |
| `Power Armor` → `Damage Reduction` (210) | "+4 EN, +1 TP for each additional 4 hours of duration" | renamed and rewritten |

**4. Options were shifted up, then the tail cleared.** On `Massive Outer Illusion` (166), `op_1_desc`
received the old `op_2` content ("add sound"), `op_2_desc` received animation, and `op_3` — previously
the "sound and animation" combo — was cleared. Same shape on `Relocate Power` (154), where `op_2`
received `op_3`'s text before `op_3` was cleared. That is the signature of deleting one option from a
list and letting the rest move up.

**5. Every save carried other deliberate changes.** Renames (`Personal Power Linger` →
`Personal Power Attack`, `Power Armor` → `Damage Reduction`, `EmPowered Plant` → `Empower Plant`),
category changes, `base_en` / `base_tp` rebalances (`Freeze Time` 21→15, `Terraform` 23→10,
`Gravity Center` 9→4, `Ping` 5→0.5), and `mechanic` / `percentage` flag flips.

**Consequence:** no recovery is needed or wanted. Restoring these values would undo months of
deliberate game-balance work. The recovery SQL proposed in report 00 §P0-3 must **not** be run.

---

## Verdict 2 — feat id 248: NOT a nulling; a delete followed by id reuse

The single feat case was not a lost column at all. Two changelog rows, 26 minutes apart:

| Time (UTC) | What happened |
|---|---|
| 2026-04-20 17:56 | **Every** field of `Flawless Fighter` goes value → `null`, and `after_data` has no keys. This is a **delete**. |
| 2026-04-20 18:22 | **Every** field goes `null` → value, and `name` is **`Elemental Adaptation`**. A new feat was created reusing id `248`. |

So `mart_prof_req` is NULL on id 248 today because id 248 is now a *different feat* that legitimately
has no martial proficiency requirement. My audit statement that "Flawless Fighter has had no
requirement for four months, so anyone could take it" was incorrect — the feat was deleted.

**But this surfaces a genuine and worse problem, which is now tracked instead.** Codex ids are
recycled after deletion. Any saved character that had taken `Flawless Fighter` (feat 248) now silently
resolves to `Elemental Adaptation` — a different feat, different category, different effect, with no
error and no migration. This is the same defect class the codex/library audit flagged for species
(`10-codex-library-layer.md`, "codex species ids are reused after delete",
`api/official/[type]/route.ts:78`), now confirmed to have actually happened for feats.

**Action:** ids must never be reused. Allocate new ids monotonically, and soft-delete (or tombstone)
codex rows so dangling character references are detectable rather than silently repointed. A
one-off scan for characters referencing deleted-and-reused ids is also warranted.

---

## Verdict 3 — F-01 is a real defect, still live, not yet triggered

Independently of the above, the read/write asymmetry the admin audit identified is confirmed by
reading the code:

| Location | Fact |
|---|---|
| `src/app/api/codex/route.ts:118-145` | The `codexFeats` projection maps `pow_prof_req` (`:141`), `pow_abil_req` (`:140`), `mart_abil_req` (`:134`) — and **omits `mart_prof_req` entirely**. |
| `src/types/codex.ts:101` | `mart_prof_req?: number` is declared on the type, so nothing type-checks the omission. |
| `src/app/(main)/admin/codex/admin-feat-form.ts:86` | `mart_prof_req: toOptNum(ext.mart_prof_req)` reads from the API payload — always `undefined`. |
| `src/app/(main)/admin/codex/admin-feat-edit-modal-fields.tsx:445` | Renders `form.mart_prof_req ?? ''` — the input is always blank. |
| `src/app/(main)/admin/codex/admin-feat-form.ts:136` | Writes `form.mart_prof_req ?? undefined` back on save. |
| `src/app/(main)/admin/codex/codex-spreadsheet-config.ts:113` | The spreadsheet editor also lists the column, with the same blank-read problem. |

**30 feats currently hold a non-null `mart_prof_req`.** Editing any one of them through the admin form
or spreadsheet will silently clear it. The bug is real; it simply has not fired yet, because the one
row I originally flagged turned out to be the delete above.

This is a one-line fix (add the field to the projection) plus a regression test, and it is the
strongest argument for the table-driven column round-trip test the admin audit recommended: a test
that asserts every write-allowlisted column is also readable would have caught this without a
forensic investigation.

---

## What this changes in the audit

| Report | Change |
|---|---|
| `00-database-and-infrastructure.md` §P0-3 | **Retracted** as a data-loss finding. Downgraded to P1 and rewritten as the latent `mart_prof_req` round-trip defect. Recovery SQL marked DO-NOT-RUN. |
| `README.md` | "Confirmed live data loss" section replaced with this determination. |
| New finding | Codex id reuse after delete, confirmed to have occurred (feat 248). Tracked as P1 with a character-reference scan. |

## Lesson for the audit method

I inferred intent from a data shape (the `desc`/`en`/`tp` triplet clearing together) and from a
plausible code mechanism, and I stated four reasons the pattern "pointed strongly at the bug." The
`changed_fields` column was sitting in the same table and answered the question directly. Structural
evidence of *how* data changed is not evidence of *why*; when an audit trail records intent, read the
intent. My original report did flag that I could not prove intent from the database alone — that
caveat was correct, and the right move was to keep digging rather than to lead with the alarming
reading.
