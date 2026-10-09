> **This file is a repo mirror of the Drive source of truth: [Realms Web Decisions](https://docs.google.com/document/d/1tGebelYXZPegt4iZiycOjI3RBHD6N_QKZW6CI0ckxkg/edit).** If this file and the Drive doc ever conflict, **Drive wins**. Keep them in sync when Kadin settles new decisions.

# Realms Web Decisions

**Status:** Source of truth (Drive) · Seeded 2026-10-05 from settled Kadin rulings  
**Owner:** Kadin Brooksby  
**Maintainers:** Web Manager proposes appends when Kadin settles intent; Production Manager keeps the Drive SoT in sync. Repo holds this mirror (Drive wins on conflict).  
**Related:** [Realms Dev Workflow & Agent Rules](https://docs.google.com/document/d/1F6iZUKP9nN0YTFzOkZ6Y82sySaw0iW101f_a-7ZeQdI/edit) · ClickUp wiki pointer after publish

Settled product and QA decisions for realmsrpg.com agents. Strip: open questions, secrets, Restricted material. Ask Kadin when Drive Alpha and `GAME_RULES.md` disagree (Drive wins by default; some repo entries may be test rules Drive will adopt).

Game runner = **RM (Realm Master)** — never GM.

---

## Process / workflow (Oct 5, 2026)

- ClickUp is the **only work queue**. Repo `ACTIVE_TASKS` / TASK-### are optional engineering notes.
- Collin merges normally. Kadin may bypass-merge only after full best practice. A bypass merge moves the ClickUp task to **testing**, with QA instructions for what changed, **James Owenby** added, and **Collin** kept assigned. Collin can move the task back to **in review** to review it.
- QA Tester checks the Vercel preview before merge or shortly after. Post-merge QA: QA Tester + Bob, or Bob alone.
- WCAG **2.2 AA** everywhere.
- Keep branch name **`master`**; ban direct pushes.
- Clickup Manager is the only Grok bot that writes to ClickUp (Kadin personal token). Cursor agents may write to ClickUp on Kadin's orders.
- No bot starts sweeps/checks/runs without Kadin or a bot he delegated.
- Duplicates go to Clickup Manager (dated section in existing task description), not a comment from the finder.
- Rules-math PRs: Production Manager checks Drive/Codex before Kadin signs off.
- Production Manager: Drive catalog + rules consistency; **flag/comment/ClickUp via Clickup Manager only** — no silent core/sub-rule text edits unless Kadin okays.

---

## Scope / MVP (Oct 1–3, 2026)

- Website MVP due **Dec 22, 2026**. Live scope = ClickUp tasks tagged `m1-mvp` (prefer over legacy `mvp`).
- VTT stays in Dec 22 MVP goal. Secure campaign joins and role-based security are urgent.
- Outside Open Beta scope (low priority): downtime, crafting, harvesting, companions, user homebrew rules, user custom codex. Craft Creator is a later expansion during Open Beta.
- Online rulebook can lag Drive; text Drive never had, or missing/garbled/misplaced text = bug.
- Codex Alpha in Drive is an artifact; website/Supabase is Codex SoT for sub rules.

---

## Creators / powers / TP / EN (Oct 4–5, 2026)
- Empty power/technique/empowered technique (no parts), or one with nothing contributing positive energy: show a **dash**, not 0 or 1 (see Power composition pricing below).
- Min final power/technique EN = **1** after rounding, applied only when real positive costs are reduced below 1 (not a base cost). Site max(0) is a bug.
- Max Power EN = max(Power Prof, ½ Archetype Prof) × **15**, applied to calculated cost **before** feat/attribute reductions. Reductions cannot make an over-limit power usable.
- Max EN in creator: **informational** (like Innate Power), not limiting.
- Range (and similar mechanics) **does cost TP**. Training Points round up once per part instance (the whole part's raw sum, base plus options), not per term and never floored. Power Range at 6 spaces is 1 TP and at 12 spaces is 2 TP. A power's TP total is informational (see Power composition pricing below).
- Duration: 1 round and Instant cost the same (no duration). Duration modifiers multiply each other before applying. Rounds capped at 5; 6 rounds = 1 minute option only. 1 minute = 6 rounds (10-second rounds). Sustain up to 4 AP is fine.
- Empowered techniques: whole-thing scalers (e.g. action type / Quick Action) apply to both halves; type-specific only to that half. Creator out of MVP/Open Beta scope for remaining empowered design.

## Power composition pricing (Oct 5–6, 2026)
Kadin adopted composed-power pricing Oct 5 (10:21 PM ET) and revised it Oct 6 (7:15–7:17 AM, QA Tester footprint ruling, 9:33 AM, 12:08 PM ET). The 12:08 PM ET range rule is final for Modify and Choice: range bought on Shared is paid once, a tab that adds its own range pays that range in full, and a shorter range is never refunded. The Oct 6 rulings win where they differ. Covers Choice, Alternate, Modify (Split Power Parts into Groups), Randomize, and Reverse Effects. Live Codex text for parts 371, 388, 401, and 402 is older until Kadin approves new wording.
- **Shared.** Action type is the only mechanic every tab must share. Exception: each Alternate version keeps its own action type. Other tabs start with Shared's range, area, and duration and may change them.
- **Modify and Choice price the same way.** Shared is paid once, including its range and action type. Any tab may use that range for free. A tab that adds its own range has a separate range and pays that range's full cost at the tab's area and action, including when it is shorter than Shared. There is no refund. A larger area or longer duration raises only that tab's parts; a smaller area or shorter duration lowers them. Randomize faces and Alternate versions price range inside the face. Modify = Shared + every piece. Choice = Shared + the most expensive option. How the creator decides that a tab added its own range is pending below.
- **Reverse range.** On a Reverse tab, its own range is part of the drawback and is priced with it like the tab's other parts, so a farther-reaching drawback deepens the discount (Kadin, Oct 6, 4:44 PM ET).
- **Energy rounding.** A power's Energy is rounded up once, at the very end of the whole power, never per part or per tab.
- **Alternate.** Each version is a complete power with its own action type; you pay for the version you use. Proficiency is required in every version, Innate is checked per version, and a part's TP is counted once.
- **Randomize.** Faces are independent, like Alternate versions, and share only the action type (spend the action, then roll). Each face is priced at its own range, area, duration, parts, and damage. The user marks each face good or bad. A bad face never pays for another face's range or area. What the Randomize Shared tab stores, and whether a face left off the die adds cost, are pending below.
  - **EN** = Σ good faces (p × face energy) − Σ bad faces (p × ½ × face basic-action energy ÷ action-type multiplier). p = 1 ÷ die sides, once per side a face fills. Round up once.
  - Kadin's example: free action (×1.5), d10. 2 faces Stunned 3 on self: basic 15 EN, reduction ½ × 15 ÷ 1.5 = 5. 8 faces ranged sphere heal with a third target: 10.3125 EN at free action. 0.8 × 10.3125 − 0.2 × 5 = 7.25 → **8 EN**.
- **Inverse action scaling on drawbacks.** Reverse Effects and Randomize bad faces: reduction = ½ × drawback energy priced as a Basic Action ÷ action-type multiplier. Slower action = bigger reduction, quicker action = smaller reduction, Basic stays ½. Reaction is part of the multiplier. Good faces and benefits pay the normal action-type increase or decrease.
- **Dash vs. 1 EN floor.** A power, technique, or empowered technique with nothing contributing positive energy (only 0 EN parts, quick-only, duration-only, No Attack alone, or a Randomize power whose faces are all bad) shows a **dash** everywhere, not 1 EN. The 1 EN floor applies only when real positive costs are reduced below 1.
- **TP and proficiency.** Training Points round up once per part instance (the whole part's raw sum, base plus options), not per term and never floored. Example: Power Range 6 spaces = 1 TP, 12 spaces = 2 TP. Proficiency is per part, a higher level covers lower levels (1d12 fire covers 1d4–1d12 fire), and a repeated part counts only at its highest instance, both in a power's TP and in the character's budget. Damage type still splits a damage part (fire and ice are two proficiencies; fire on several tabs counts once). A different part that shares a damage type is compared by that rounded total. A power's TP total is informational, not spent when the power is used. The character-budget dedupe is still a follow-up in code ([86e3krpzp](https://app.clickup.com/t/86e3krpzp)): the guided bar and the creature creator still add each power's own total. Matching a saved proficiency that has no part id, and a face left off the die, are pending below. Technique Additional Damage option 1 rounds up like every other option; the old per-full-1d4 floor is removed (Kadin, Oct 6, 9:19 PM ET).
- **Official powers** always compute from live Codex part data plus this math; their energy is never overridden. Published numbers are results of that math, not targets.

## Pending / implementation notes (not Kadin-confirmed)

- **Own-range detection.** A tab counts as adding its own range when its override flags include range, or when its stored range steps differ from Shared's. A stored range equal to Shared's, with no range override, uses Shared's range and adds nothing. `overrides` lists the creator-forced fields (`action`, `attack`, `range`, `area`, `duration`, `damage`). Explicit none or Instant stays stored when that flag is set. This detection does not pin an official power's energy. Randomize faces are complete specs, so they do not store overlay overrides.
- **Proficiency name fallback.** When a saved proficiency has no part id, coverage matches by part name and the same kind (power, technique, or item) before Training Points, so 1d6 does not cover 1d8 of that same kind. Different part ids still compare Training Points.
- **Stripped Randomize Shared.** The Randomize Shared tab is the action type plus range, area, and duration defaults. It has no parts or damage sections. It is shown as not priced, and editing it does not change faces that already exist. A good face that omits range, area, duration, or damage, or that stores only the empty default, is expanded on read: that face receives Shared's range, area, duration, parts, and damage, plus its own parts. A bad face keeps only its own parts and is not given Shared's range, area, duration, damage, or parts. A face that already stores all four fields stays as saved. The conversion is read-only. Legacy Shared parts are read only to convert good faces.
- **Off-die face.** A Randomize face that is not on any die result adds no Energy and no Training Points, and the creator warns that the face is not on any die result.
- Breakdowns show the action-type multiplier at its Codex value (0.875, not 0.88). Energy intermediates stay at most 2 decimals.

---

## Sheet / combat (Oct 4–5, 2026)

- Speed floor = **1 space** (5 ft / 1.5 m). Speed (incl. temp mods) in **spaces** by default; feet/metres only when settings pick that unit.
- Dying damage/condition at **0 HP or below**. Progression 1d4 → 2d4 → 4d4 → 8d4 (as applied).
- Overheal (HP) and Over Energized (EN): do **not** reset to max on recovery by default — only when an effect says so.
- When max HP/EN drops, current drops to new max. If current ≥ max and max rises, current rises by the same amount. Leveling up raises current with max.
- EN may go above max (Over Energized). Negative EN allowed when **manually** set; not from power usage.
- HP colors: gold when overhealed; dark red when below 0; black at or below −max HP. HP may go past −max and past −99.
- Energy gold when Over Energized.
- Temp mods are player overrides; recovery does not clear them. Limits: −99 min, +1000 max.
- d20 ±2 (nat 20 / nat 1) applies only to **single** d20 rolls, not group rolls that include d20s.
- Feat deletion may confirm (same as notes). 30 roll-log rolls/minute is fine.
- Unarmed proficient damage uses **full Attack Bonus**; table Level = prowess level; dice steps 1d2 → 1d4 → 1d6… are intended.
- Weapon damage adds Martial Bonus (Ability + Martial Prof) when proficient.
- "Forge Your Own" archetype label on site should be **Custom Archetype** (code/UI only; not creative rename of lore).

---

## Abilities / creatures / species (Oct 5, 2026)

- Player ability **hard caps: −5 and +10**. Soft cap = doubled point cost after +4. The "+5 max" / hard +5 lines are wrong.
- Creature ability limits: **+10 / −4** everywhere; doubled cost above +4 applies to creatures.
- Creature HP: **pool of 30**; retire older RMG "6 base HP" lines.
- Species creator: block impossible values (negative/decimal height/weight; adulthood age higher than lifespan).
- Darkvision: creature Darkvision II (12sp) cost 2 stays; species naming/ranges need design alignment (filed separately). Cost mismatch species vs creature is a bug to fix consistently.

---

## Product / UX (creators & sheets) (Oct 5, 2026)

- Save loaded library item under a new name = rename/update in place (not duplicate).
- Unsaved-changes warning when leaving, reloading, or loading over draft work: yes.
- Names ≤ 100 chars with counter; descriptions ≤ 10,000.
- Create Armor / Create Shield open creator set to that type (not Weapon). Shields can be Two-Handed.
- Weapons: same property not more than once; identical parts may be added twice.
- Innate Power label is informational; needs a character set to judge against innate threshold.
- Two-tab edit/delete/save: warn; do not silently recreate under a new ID.
- Quantity 0 does not delete; separate remove control. Notes reorderable/hideable; confirm note delete.
- Viewers see live sheet updates but never edit; Hidden Powers/Techniques stay hidden for viewers.
- Feats with unmet requirements may still be added as override, with the unmet-requirement flag.

---

## QA / accounts (Oct 5, 2026)

- QA accounts only for testing; prefix records `QA` / `QA Test`; clean up; never save/publish official library/Codex from QA (esp. qa-admin).
- Test accounts: `/workspace/qa/test-accounts.txt` + Realms Restricted. Authorized for bots; never paste passwords into chat.
- Never paste API keys in chat, ClickUp, ordinary Drive docs, or the repo.
- After any dependency or framework bump merges, QA Tester repeats a short production smoke covering home, sign-in, characters and sheet, one creator (load-only), codex, rules, the /opengraph-image PNG and console/hydration.
- Page-speed budgets come from the S25 medians. Re-run them after each perf fix, not on every small UI PR. TBT alone is not filed as a bug.
- Security-header checks are re-run when CSP, CORS or header fixes land. Role-separation checks are re-run on any PR touching RLS, auth or permissions, and any exposure is reported to Kadin privately.
- Bots may retest ClickUp tasks in testing and add dated comments or description updates through Clickup Manager, but never move a task out of testing. Final tests stay human (Bob).
- The Website QA check routine and these standing triggers are delegated to QA Tester. New ad-hoc sweeps still need Kadin or Web Manager.
- CI security audit (PR #128): `npm audit --audit-level=high --omit=dev` blocks merges, and a full-tree audit runs as a warning only.
- Advisory and vulnerability IDs stay out of public repo files, PR text and commit messages (the repo is public). ClickUp holds them.

---

## Changelog

- **2026-10-08:** Bypass merge moves the ClickUp task to testing with QA instructions for what changed, adds James Owenby, and keeps Collin assigned. Collin can move it back to in review.
- **2026-10-05 (~4:54 PM ET):** Appended standing QA triggers (post-dep smoke, S25 page-speed budgets, security-header/RLS retests, testing-status bot limits, Website QA check delegated to QA Tester, CI npm audit policy, no CVE IDs in public repo).
- **2026-10-05:** Initial seed from `/workspace/qa/intent.md` settled rulings + Oct 5 Dev Team / Kadin corrections (ability hard caps −5/+10; Drive vs GAME_RULES ask-first; Realm Master spelling).
