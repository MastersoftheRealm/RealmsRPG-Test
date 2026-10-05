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
- Collin merges normally. Kadin may bypass-merge only after full best practice; task stays **in review**, assigned to Collin, with a dated Bypass merge note.
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

- Empty power/technique (no parts): show a **dash**, not 0 or 1.
- Min final power/technique EN = **1** after rounding (not a base cost). Site max(0) is a bug.
- Max Power EN = max(Power Prof, ½ Archetype Prof) × **15**, applied to calculated cost **before** feat/attribute reductions. Reductions cannot make an over-limit power usable.
- Max EN in creator: **informational** (like Innate Power), not limiting.
- Range (and similar mechanics) **does cost TP**; round **up each instance** (e.g. Range 3 = 0.5 → 1 TP), not sum-then-round.
- Duration: 1 round and Instant cost the same (no duration). Duration modifiers multiply each other before applying. Rounds capped at 5; 6 rounds = 1 minute option only. 1 minute = 6 rounds (10-second rounds). Sustain up to 4 AP is fine.
- Empowered techniques: whole-thing scalers (e.g. action type / Quick Action) apply to both halves; type-specific only to that half. Creator out of MVP/Open Beta scope for remaining empowered design.

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

- **2026-10-05 (~4:54 PM ET):** Appended standing QA triggers (post-dep smoke, S25 page-speed budgets, security-header/RLS retests, testing-status bot limits, Website QA check delegated to QA Tester, CI npm audit policy, no CVE IDs in public repo).
- **2026-10-05:** Initial seed from `/workspace/qa/intent.md` settled rulings + Oct 5 Dev Team / Kadin corrections (ability hard caps −5/+10; Drive vs GAME_RULES ask-first; Realm Master spelling).
