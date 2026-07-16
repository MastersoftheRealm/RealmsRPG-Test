# Build Validation (QA How-To)

Step-by-step manual checks for QA after a build or PR. **One behavior = one test.** Do not combine unrelated checks in a single test.

**Owner / QA:** Run suites linked from [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md). Report each test as **PASS**, **FAIL**, or **SKIP** with notes.

**Agents:** When you mark a user-facing task `done` or `partial`, you **must** add or update tests here and index the suite in `DEVELOPER_TASK_QUEUE.md`. See [`AGENT_GUIDE.md`](AGENT_GUIDE.md) → Build validation.

---

## ID scheme

| Prefix | Meaning | Example |
|--------|---------|---------|
| **DEV-V-###** | Validation **suite** (category) | DEV-V-001 — Character creator step guards |
| **DEV-V-###-T###** | Single test inside a suite | DEV-V-001-T001 |

- Suite number = next free `DEV-V-###` in this file.
- Test number = next `T###` within that suite (reset per suite).
- Link every suite to one or more `TASK-###` IDs.

---

## Test template (copy per test)

```markdown
#### DEV-V-###-T### — Short title (what is being verified)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-### — Category name |
| **Section** | N. Step or area name |
| **Related task** | TASK-### |
| **Where** | Route or page (e.g. `/characters/new`) |
| **Needs** | Account role, data, or environment |

**Steps**
1. First action (include nav path: Characters → Add Character).
2. Second action.
3. …

**Expected**
- One observable outcome per bullet.
- Use exact UI labels (e.g. **Continue →**, **5. Skills**).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:
```

### Agent rules

1. **Split** — If a test has “and then also check X”, make a second test.
2. **Context** — Always include how to reach the screen (nav + URL).
3. **Labels** — Use visible tab/button text from the app, not internal step ids.
4. **Prerequisites** — State login, role, and any setup (e.g. “complete steps 1–3 first”).
5. **Stale tests** — When behavior changes, update the test or mark **Superseded** with date + replacement ID.
6. **Partial work** — Add tests only for `completed_work`; note `remaining_work` tests as *Planned* in the suite header.

---

## DEV-V-001 — Character creator step guards

**Related tasks:** TASK-356  
**Start URL:** `/characters/new`  
**Needs:** Logged-in test account  

Use **Forge Your Own** for tab-guard and validation tests unless the test title says otherwise.

---

### 1. Archetype

#### DEV-V-001-T001 — Choose a Path can be selected

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 1. Archetype |
| **Related task** | TASK-356 |
| **Where** | `/characters/new` → **1. Archetype** |
| **Needs** | Logged-in test account |

**Steps**
1. Go to **Characters** → **Add Character** (or open `/characters/new`).
2. On step **1. Archetype**, click the **Choose a Path** card.

**Expected**
- **Choose a Path** card shows selected styling (highlighted border/background).
- Official archetype path groups appear below (Power / Martial / Powered-Martial paths), if codex has paths.
- **Forge Your Own** card is not selected.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T002 — Forge Your Own can be selected

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 1. Archetype |
| **Related task** | TASK-356 |
| **Where** | `/characters/new` → **1. Archetype** |
| **Needs** | Logged-in test account |

**Steps**
1. Go to **Characters** → **Add Character**.
2. On **1. Archetype**, click the **Forge Your Own** card.

**Expected**
- **Forge Your Own** card shows selected styling.
- Archetype type cards appear (**Power**, **Martial**, **Powered-Martial**).
- **Choose a Path** card is not selected.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T003 — Choose a Path is deselected when Forge Your Own is selected

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 1. Archetype |
| **Related task** | TASK-356 |
| **Where** | `/characters/new` → **1. Archetype** |
| **Needs** | Logged-in test account |

**Steps**
1. On **1. Archetype**, click **Choose a Path** (path list visible).
2. Click **Forge Your Own**.

**Expected**
- **Forge Your Own** is selected; **Choose a Path** is not selected.
- Path list hides; archetype type cards (**Power** / **Martial** / **Powered-Martial**) show instead.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T004 — Forge Your Own is deselected when Choose a Path is selected

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 1. Archetype |
| **Related task** | TASK-356 |
| **Where** | `/characters/new` → **1. Archetype** |
| **Needs** | Logged-in test account |

**Steps**
1. On **1. Archetype**, click **Forge Your Own** (type cards visible).
2. Click **Choose a Path**.

**Expected**
- **Choose a Path** is selected; **Forge Your Own** is not selected.
- Archetype path list shows; forge type cards hide.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T005 — Forge flow: confirm archetype advances to Species

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 1. Archetype |
| **Related task** | TASK-356 |
| **Where** | `/characters/new` → **1. Archetype** |
| **Needs** | Logged-in test account |

**Steps**
1. Click **Forge Your Own**.
2. Click **Martial** (or **Power**).
3. Pick one ability button (e.g. **Strength**).
4. Click **Confirm Archetype**.
5. Click **Continue →**.

**Expected**
- Summary shows chosen archetype and ability chips.
- **Continue →** moves you to **2. Species** (tab active; step indicator updates).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T006 — Choose a different archetype returns to selection

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 1. Archetype |
| **Related task** | TASK-356 |
| **Where** | `/characters/new` → **1. Archetype** |
| **Needs** | Logged-in test account; archetype already confirmed (see T005)

**Steps**
1. Complete T005 so archetype is confirmed (summary visible).
2. Click **Choose a different archetype**.

**Expected**
- Returns to creation-style selection (**Choose a Path** / **Forge Your Own**).
- Prior archetype summary is cleared from the step body.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

### 2. Tab navigation (step guards)

#### DEV-V-001-T007 — Skills tab disabled before Ancestry is complete

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 2. Tab navigation |
| **Related task** | TASK-356 |
| **Where** | `/characters/new` |
| **Needs** | Logged-in; archetype confirmed and **Continue →** used to reach **2. Species** or later only through step **1** complete

**Steps**
1. Confirm archetype (T005) and click **Continue →** (you are on **2. Species**).
2. In the top tab bar, try to click **5. Skills** without finishing **3. Ancestry**.

**Expected**
- **5. Skills** tab is greyed out (`cursor-not-allowed`), not clickable.
- You remain on the current step (cannot skip to Skills).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T008 — Skills tab unlocks after Species and Ancestry are complete

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 2. Tab navigation |
| **Related task** | TASK-356 |
| **Where** | `/characters/new` |
| **Needs** | Logged-in; progress through **2. Species** and **3. Ancestry**

**Steps**
1. On **2. Species**, pick a species and click **Continue →**.
2. On **3. Ancestry**, select required ancestry/traits and click **Continue →**.
3. In the tab bar, click **5. Skills** (or complete **4. Abilities** first if Skills is still locked until Abilities is marked complete — use **Continue →** on each step in order).

**Expected**
- After **3. Ancestry** is completed via **Continue →**, **5. Skills** becomes clickable (not greyed out).
- Clicking **5. Skills** opens the Skills step.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

### 3. Abilities

#### DEV-V-001-T009 — Continue disabled while ability points remain unspent

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 3. Abilities |
| **Related task** | TASK-356 |
| **Where** | `/characters/new` → **4. Abilities** |
| **Needs** | Logged-in; reach Abilities with prior steps complete

**Steps**
1. Reach **4. Abilities** (complete archetype, species, ancestry).
2. Leave at least one ability point unspent (do not max all allocations).

**Expected**
- **Continue →** at the bottom is **disabled** (cannot advance).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T010 — Continue enabled when all ability points are spent

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 3. Abilities |
| **Related task** | TASK-356 |
| **Where** | `/characters/new` → **4. Abilities** |
| **Needs** | Same session as T009

**Steps**
1. On **4. Abilities**, allocate all remaining points until the UI shows **0** points left.
2. Check **Continue →**.

**Expected**
- **Continue →** is **enabled**.
- Clicking it advances to **5. Skills**.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

### 4. Feats

#### DEV-V-001-T011 — Continue disabled without required feats

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 4. Feats |
| **Related task** | TASK-356 |
| **Where** | `/characters/new` → **6. Feats** |
| **Needs** | Logged-in; reach Feats with skills step completed

**Steps**
1. Complete steps through **5. Skills** and open **6. Feats**.
2. Do **not** add required archetype feat or character feat (if the step shows validation messages).

**Expected**
- **Continue →** is **disabled** while required feats are missing.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T012 — Continue enabled after required feats are added

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 4. Feats |
| **Related task** | TASK-356 |
| **Where** | `/characters/new` → **6. Feats** |
| **Needs** | Same session as T011

**Steps**
1. On **6. Feats**, add the required **archetype** feat and **character** feat (per on-screen prompts / validation).

**Expected**
- **Continue →** becomes **enabled**.
- Clicking it advances to **7. Equipment**.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

### 5. Archetype change clears downstream progress

#### DEV-V-001-T013 — Changing archetype clears later-step selections

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 5. Downstream reset |
| **Related task** | TASK-356 |
| **Where** | `/characters/new` |
| **Needs** | Logged-in; partial progress through species, ancestry, skills, or feats

**Steps**
1. Confirm archetype and complete **2. Species** and **3. Ancestry** (note species/ancestry choices).
2. Go back to **1. Archetype** via tab bar or **← Back**.
3. Click **Choose a different archetype**, pick a **different** archetype (e.g. switch Martial → Power), confirm, and **Continue →**.
4. Open **2. Species**, **3. Ancestry**, **5. Skills**, **6. Feats**.

**Expected**
- Species, ancestry, skills, and feats from before the archetype change are **cleared** (must re-select).
- Starting currency resets to **200c** on equipment step (see T014).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

### 6. Equipment & currency

#### DEV-V-001-T014 — Equipment step shows 200c starting budget

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 6. Equipment |
| **Related task** | TASK-356 |
| **Where** | `/characters/new` → **7. Equipment** |
| **Needs** | Logged-in; reach Equipment without spending currency yet

**Steps**
1. Reach **7. Equipment** with a fresh creator session (or after archetype reset).
2. Find the currency / budget display on the step.

**Expected**
- Starting budget shows **200c** (not 500c or another value).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T015 — Saved character currency matches purchases

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 6. Equipment |
| **Related task** | TASK-356 |
| **Where** | `/characters/new` → **7. Equipment** → saved character sheet |
| **Needs** | Logged-in; note item prices before buying

**Steps**
1. On **7. Equipment**, add one or more items; note total spent.
2. Finish creator through **9. Finalize** and save the character.
3. Open the saved character sheet and check **currency**.

**Expected**
- Character **currency** = **200c − total spent** (matches remainder after purchases).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-008 — Archetype path completion (TASK-366–374)

Path-created characters: hydration, level-up guidance, sheet identity, public codex, creator apply actions, admin visibility. **Needs:** logged-in account; at least one codex archetype path with level-1 add recommendations and (optional) level-2+ row in admin.

#### DEV-V-008-T001 — Sheet shows codex path name after reload

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Character sheet header |
| **Related task** | TASK-366, TASK-484 |
| **Where** | `/characters/[id]` |
| **Needs** | Saved path character (`creationMode: path` or `archetypePathId` set) |

**Steps**
1. Open a path-created character sheet (header shows path name, not generic "Power"/"Martial" only).
2. Confirm there is no **Forge Your Own Path** / **Archetype Path** creation chip next to the archetype name.
3. Hard refresh the page (F5).

**Expected**
- Header still shows the **codex path name** after reload.
- No Forge/Path creation chip next to the archetype (before or after reload).
- If the path has admin notes/description, **ArchetypePathGuidance** still appears under the name.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T002 — Characters list shows path name column

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Characters list |
| **Related task** | TASK-366 |
| **Where** | `/characters` |
| **Needs** | Same path character as T001 |

**Steps**
1. Go to **Characters**.
2. Find the path character in the list.

**Expected**
- List **archetype** column shows the **path name** (not only generic type label).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T003 — Level-up modal shows path progression guidance

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Level-up |
| **Related task** | TASK-367 |
| **Where** | Character sheet → adjust level up |
| **Needs** | Path character; codex path has a `codex_archetype_levels` row for target level (e.g. level 2) |

**Steps**
1. Open path character sheet; open **Adjust Level** / level-up modal.
2. Increase level to one that has progression data in admin (e.g. 1 → 2).

**Expected**
- Modal shows **path guidance** block with resolved recommendation names and/or admin notes for that level.
- If no row exists for target level, shows graceful empty message (not an error).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T004 — Level-up to 5 applies path proficiency floor

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Level-up proficiency |
| **Related task** | TASK-368 |
| **Where** | Character sheet → level-up |
| **Needs** | Path with `power_prof_level5` and/or `martial_prof_level5` set in admin; character level 4 |

**Steps**
1. Note current Power/Martial prof on sheet.
2. Level up from **4 → 5** via level-up modal.

**Expected**
- Prof values increase to at least admin level-5 targets (never reduced).
- Success toast mentions path proficiency update when values change.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T012 — Level ≥5 path character loads with prof floor applied

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Sheet load |
| **Related task** | TASK-368 |
| **Where** | `/characters/[id]` |
| **Needs** | Path character already level ≥5 saved with prof below admin level-5 floor |

**Steps**
1. Open the character sheet (fresh load).

**Expected**
- Power/Martial prof on sheet are at least admin level-5 targets without requiring another level-up.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T005 — Sheet path identity and admin notes (not player archetype desc)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Sheet header guidance |
| **Related task** | TASK-369 |
| **Where** | `/characters/[id]` |
| **Needs** | Path with description and/or `level1_notes` in admin |

**Steps**
1. Open path character sheet header.
2. Open **Notes** tab; check **Archetype** description field (player text).

**Expected**
- Header shows path description snippet and read-only **admin guidance** (level 1 / per-level notes).
- Player **archetype description** in Notes tab remains separate and editable.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T006 — Realms Codex Archetypes tab

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Public codex |
| **Related task** | TASK-370 |
| **Where** | `/codex` → **Archetypes** tab |
| **Needs** | At least one visible path in codex |

**Steps**
1. Open **Realms Codex**.
2. Select **Archetypes** tab.
3. Expand a path row.

**Expected**
- Searchable list of paths with type and abilities columns.
- Expanded row shows level 1 recommendations and level 2+ progression summaries.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T007 — Optional remove lists in level-up and sheet guidance

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Remove guidance |
| **Related task** | TASK-371 |
| **Where** | Level-up modal + sheet header |
| **Needs** | Path with `remove_*` lists for current or target level in admin |

**Steps**
1. Level up to a level with remove lists (or view sheet at that level).
2. Read copy near remove lists.

**Expected**
- **Consider replacing or removing** section lists resolved names.
- Copy states guidance is optional (nothing auto-removed).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T008 — Edit Archetype modal path awareness

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Edit archetype |
| **Related task** | TASK-372, TASK-484 |
| **Where** | Sheet edit mode → edit archetype |
| **Needs** | Path character; edit mode enabled |

**Steps**
1. Enable edit mode; open **Edit Archetype & Ability**.
2. Observe path view (read-only identity) — path name, abilities, proficiency; no creation chip.
3. Click **Switch to Forge Your Own** or **Choose a Different Path**.

**Expected**
- Path characters see read-only path card (not forge type picker first).
- No **Forge Your Own Path** / **Archetype Path** creation chip on the path card.
- Switch actions show **ConfirmActionModal** with data-loss warning before proceeding.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T009 — Creator Apply recommended skills

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Creator skills |
| **Related task** | TASK-373 |
| **Where** | `/characters/new` → **5. Skills** (path mode) |
| **Needs** | Path with level-1 skill recommendations |

**Steps**
1. Create path character through to **5. Skills**.
2. Remove a recommended path skill if present.
3. Click **Apply recommended skills**.

**Expected**
- Removed path skills are re-added as proficient (value 0).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T010 — Creator auto/manual apply recommended feats

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Creator feats |
| **Related task** | TASK-373 |
| **Where** | `/characters/new` → **6. Feats** (path mode) |
| **Needs** | Path with level-1 feat recommendations character qualifies for |

**Steps**
1. Reach **6. Feats** on a new path character.
2. Confirm recommended feats appear selected when requirements met (first visit).
3. Deselect one; click **Apply recommended feats**.

**Expected**
- Qualified recommended feats are selected again without blocking manual changes afterward.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T011 — Admin warning for hidden path (notes-only level 1)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Admin codex |
| **Related task** | TASK-374 |
| **Where** | `/admin/codex` → Archetypes |
| **Needs** | Admin account |

**Steps**
1. Edit or create an archetype path with **level 1 notes only** (no feats/skills/powers/techniques/armaments/equipment).
2. Save.

**Expected**
- Warning toast: path will **not appear** in creator picker or public codex path list until add recommendations exist.
- Save still succeeds.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T013 — Admin recommended Innate Powers + Appendix G validation

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Admin codex |
| **Related task** | TASK-473 |
| **Where** | `/admin/codex` → Archetypes |
| **Needs** | Admin account; column `level1_innate_powers` applied on RealmsRPG-Test (TASK-473, 2026-07-15) |

**Steps**
1. Edit a Power or Powered-Martial path. Confirm Level 1 shows **Innate Powers** distinct from **Powers**.
2. Add an ineligible innate (e.g. Quick Action power, Energy above threshold, or a Heal-part power) and Save — expect error toast; save blocked.
3. Add eligible Basic/Basic Reaction innates whose Energy sum stays within Innate Energy (16 Power / 6 PM). Save succeeds after column exists.
4. Martial path: Innate Powers control hidden; switching type to Martial clears innate picks.

**Expected**
- Validation uses progression Innate Energy/Threshold (not getInnateEnergyMax).
- Parsed `path_data.level1.innatePowers` available to guided creator (empty OK until seeded).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T014 — Admin structured recommended abilities (no raw JSON)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Admin codex |
| **Related task** | TASK-404, TASK-476 |
| **Where** | `/admin/codex` → Archetypes |
| **Needs** | Admin account |

**Steps**
1. Add or edit an archetype path. Confirm **Recommended abilities** shows six steppers (Strength…Charisma), not a JSON textarea.
2. Set at least one ability to +2 (within 0–+3). Save. Re-open the path — steppers restore the saved values.
3. Set all abilities to +0 and Save. Re-open — recommendation is empty/skipped (no stale JSON).
4. Confirm armor step / recommended gear / level-1 armaments & equipment still use structured controls (no loadout JSON textarea).
5. Optional: paste invalid text in Advanced Path JSON Override and Save — expect a labeled error toast; valid empty override does not block save.

**Expected**
- Admins can author recommended abilities and loadouts without hand-editing JSON.
- Domain helpers in `archetype-path.ts` back save/load (`parseOptionalJsonField` for Advanced Path JSON).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-009 — Character sheet refactor (TASK-317, TASK-348, TASK-365, TASK-375, TASK-483, TASK-485, TASK-486)

Manual QA for library/feats modularization and shared part display. **Needs:** character with powers, techniques, equipment, and feats.

#### DEV-V-009-T001 — Single library panel on mobile side-scroll

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-317, TASK-365 |
| **Where** | `/characters/[id]` at ~360px width |
| **Steps** | 1. Open character sheet on narrow viewport. 2. Swipe horizontally through Abilities → Skills → Archetype → Library. 3. Switch library tabs (Powers, Techniques, Inventory, Feats). |
| **Expected** | One Library panel (not duplicated); tab choice persists when scrolling away and back; library tabs render lists. |
| **Report** | DEV-V-009-T001: PASS / FAIL / SKIP — |

#### DEV-V-009-T002 — Library edit controls (powers/techniques)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 |
| **Task** | TASK-317 |
| **Where** | `/characters/[id]` → Edit mode → Library → Powers or Techniques |
| **Steps** | 1. Toggle edit mode. 2. Expand a power row. 3. Use Use button (if energy allows) or edit/delete if present. |
| **Expected** | Action columns, part chips, use/innate/edit controls behave as before refactor. |
| **Report** | DEV-V-009-T002: PASS / FAIL / SKIP — |

#### DEV-V-009-T003 — Feats tab sections and slot counts

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 |
| **Task** | TASK-317 |
| **Where** | `/characters/[id]` → Library → Feats |
| **Steps** | 1. View Traits, Archetype Feats, Character Feats sections. 2. In edit mode, confirm slot counts (e.g. 3/5). 3. If character has state feats, confirm Enter State + state uses in header. |
| **Expected** | Four sections render via unified list rows; uses steppers on traits/feats with uses; over-budget slots show danger styling on add button. |
| **Report** | DEV-V-009-T003: PASS / FAIL / SKIP — |

#### DEV-V-009-T004 — Part/property chips show TP and option levels

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 |
| **Task** | TASK-375 |
| **Where** | `/characters/[id]` → Library → Powers or Techniques (expand row) |
| **Steps** | 1. Expand a power/technique with leveled parts. 2. Check part chips for TP cost and Lv.X badge. 3. Compare TP total to add-library-item modal for same item if available. |
| **Expected** | Part chips show description, TP, and max option level; technique Additional Damage TP matches calculator rules. |
| **Report** | DEV-V-009-T004: PASS / FAIL / SKIP — |

#### DEV-V-009-T005 — Context-driven sections (no prop-drill regression)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 |
| **Task** | TASK-348 |
| **Where** | `/characters/[id]` desktop layout |
| **Steps** | 1. Edit abilities, skills, archetype proficiencies. 2. Save/reload page. 3. Confirm autosave indicator and values persist. |
| **Expected** | Abilities/Skills/Archetype panels work via context; autosave and enrichment unchanged. |
| **Report** | DEV-V-009-T005: PASS / FAIL / SKIP — |

#### DEV-V-009-T006 — Add library item modal (all types)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 |
| **Task** | TASK-318, TASK-349 |
| **Where** | `/characters/[id]` → Edit → Library → Add on Powers, Techniques, Inventory |
| **Steps** | 1. Open add modal for each type. 2. Toggle My Library / Realms Library source. 3. For powers, switch Powers vs Empowered mode. 4. Select item(s) and confirm Add Selected. |
| **Expected** | Modal loads items, filters/sorts work, selection adds to sheet without duplicate IDs blocked; empowered powers use separate columns when in empowered mode. |
| **Report** | DEV-V-009-T006: PASS / FAIL / SKIP — |

#### DEV-V-009-T007 — Unarmed Prowess columns align with weapons (Name | Range | Attack | Damage)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-483 |
| **Where** | `/characters/[id]` → Archetype → Weapons (desktop + ~360px width) |
| **Steps** | 1. Open a character with at least one equipped weapon and Unarmed Prowess visible. 2. Confirm weapons header **Name \| Range \| Attack \| Damage**. 3. Confirm Unarmed Prowess is in the **same** table; Melee lines up under Range (not encroaching on Attack). 4. At ~360px, confirm `TableScroll` still allows horizontal scroll without crushing Attack/Damage under wrong headers. 5. Roll Unarmed attack and damage; confirm proficient/unproficient styling and Bludgeoning subtype unchanged. |
| **Expected** | Unarmed columns share widths with weapon rows; Range centered under header; Attack/Damage not displaced; roll math and proficient display unchanged. |
| **Report** | DEV-V-009-T007: PASS / FAIL / SKIP — |

#### DEV-V-009-T008 — Skills play view: no source chrome; edit keeps locks

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-485 |
| **Where** | `/characters/[id]` → Skills (character with species skill + at least one sub-skill) |
| **Steps** | 1. Open sheet in normal (non-edit) view. 2. Confirm skill names have no `(species)` or path/source suffixes. 3. Confirm sub-skills use └ + italic with the same text color as base skills (not lighter muted). 4. Confirm species proficient dots match other proficient dots (no dimmer opacity/hue). 5. Toggle Skills section edit (pencil). 6. Confirm species skills show `(species)`, dimmed/locked prof affordance, and cannot be removed or proficiency-toggled. 7. In Advanced creator Skills allocation (path character), confirm path `sourceLabel` still appears while allocating. |
| **Expected** | Play view is clean and uniform; edit mode still identifies locked/species skills; creator allocation source labels unchanged. |
| **Report** | DEV-V-009-T008: PASS / FAIL / SKIP — |

#### DEV-V-009-T009 — Weapon named properties one per line under name

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-486 |
| **Where** | `/characters/[id]` → Archetype → Weapons (desktop + ~360px) |
| **Needs** | Martial-style character with an equipped weapon that has **multiple** named (non-mechanic) properties |
| **Steps** | 1. Open character sheet Archetype → Weapons on desktop. 2. Confirm each named property under the weapon name is its own line starting with `•` (not a single inline `• a • b • c` string). 3. Confirm columns remain **Name \| Range \| Attack \| Damage** and Unarmed Prowess (same table via `trailingRows`) still aligns. 4. Resize to ~360px; confirm properties remain readable stacked under the name (no cramped wrap of the joined string). 5. Optional: equipped shield/armor with named props shows the same stacked helper. 6. Optional creature check: Library/stat-block weapons still use `WeaponsListSection` chips (not `QuickWeaponsTable`) — confirm no regression there. |
| **Expected** | One `• Property` per line under the name via shared `QuickWeaponsTable` (shields/armor siblings share the same helper); no property names lost; readable at desktop and ~360px; Unarmed column alignment preserved. |
| **Report** | DEV-V-009-T009: PASS / FAIL / SKIP — |

#### DEV-V-009-T010 — Browser tab title uses character name

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | Sheet tab title polish |
| **Where** | `/characters` → `/characters/[id]` → `/characters` or `/characters/new` |
| **Steps** | 1. Open Characters list; confirm tab is `Characters \| RealmsRPG`. 2. Open a character sheet; while loading confirm tab stays `Characters \| RealmsRPG`, then becomes `CharacterName \| RealmsRPG`. 3. Navigate back to list or new-character; confirm tab is not stuck on the character name. 4. (Optional) Soft-nav between two character ids; confirm title falls back during load then matches the new name. |
| **Expected** | Detail tab is `Name \| RealmsRPG` after load; list/new stay `Characters \| RealmsRPG`; no stale name after leave. |
| **Report** | DEV-V-009-T010: PASS / FAIL / SKIP — |

---

## DEV-V-005 — RLS policy consolidation (TASK-352, TASK-327)

Manual QA after `sql/supabase-rls-consolidate-permissive-2026-06.sql`. **Needs:** two accounts (campaign owner + member), one campaign-visible character.

#### DEV-V-005-T001 — Campaign join and member read

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-005 — RLS / DB migrations |
| **Task** | TASK-352 |
| **Where** | `/campaigns` · invite link or code |
| **Steps** | 1. As member, join campaign via invite. 2. Confirm campaign appears in list. 3. Open campaign detail; confirm rolls and roster load. |
| **Expected** | Join succeeds; member can read campaign row via consolidated SELECT backed by `campaign_members` (single source of truth). |
| **Report** | DEV-V-005-T001: PASS / FAIL / SKIP — |

#### DEV-V-005-T002 — Campaign-shared character cross-read

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-005 |
| **Task** | TASK-352 |
| **Where** | `/campaigns/[id]/view/[userId]/[characterId]` or sheet link from campaign roster |
| **Steps** | 1. Add character to campaign with visibility **campaign**. 2. As another campaign member, open that character sheet. |
| **Expected** | Sheet loads (not 404); consolidated `characters_select_authenticated` allows read when on roster. |
| **Report** | DEV-V-005-T002: PASS / FAIL / SKIP — |

#### DEV-V-005-T003 — Admin role policies still editable

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-005 |
| **Task** | TASK-352 |
| **Where** | `/admin/roles` · **Needs:** admin account |
| **Steps** | 1. Open admin roles page. 2. Change a quota for a non-admin role. 3. Save and reload page. |
| **Expected** | Read works for all authenticated; admin INSERT/UPDATE/DELETE policies allow save without RLS error. |
| **Report** | DEV-V-005-T003: PASS / FAIL / SKIP — |

---

## DEV-V-010 — Feat/trait custom name + note (TASK-377)

Player rename + note on character sheet feats/traits. **Needs:** logged-in account with one character that has at least one feat and one species/ancestry trait. For T004 also a campaign with that character shared (visibility **campaign**) and a second member account.

#### DEV-V-010-T001 — Rename a feat (italic, codex name preserved)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-010 — Feat/trait custom name + note |
| **Task** | TASK-377 |
| **Where** | `/characters/[id]` → Edit → Library → Feats |
| **Steps** | 1. Enter edit mode. 2. Expand a feat; click **Customize**. 3. Type a **Custom name** with spaces (e.g. `My Honed Strike`). 4. Save/reload. |
| **Expected** | Feat row title shows the custom name in *italics*; codex name still visible via hover/title; spaces are preserved in the input while typing. |
| **Report** | DEV-V-010-T001: PASS / FAIL / SKIP — |

#### DEV-V-010-T002 — Add a feat note (expanded-only, persists)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-010 |
| **Task** | TASK-377 |
| **Where** | `/characters/[id]` → Edit → Library → Feats |
| **Steps** | 1. Expand a feat; click **Customize**. 2. Enter a **Player note** (multi-word). 3. Save/reload; collapse and re-expand the row. |
| **Expected** | Note shows only in the expanded row; the Customize block is collapsed by default; note text persists after reload. |
| **Report** | DEV-V-010-T002: PASS / FAIL / SKIP — |

#### DEV-V-010-T003 — Trait customization + feat level-swap preserves data

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-010 |
| **Task** | TASK-377 |
| **Where** | `/characters/[id]` → Edit → Library → Feats/Traits |
| **Steps** | 1. Rename a species/ancestry trait and add a note via **Customize**; save/reload. 2. On a multi-level feat with a custom name + note, change its level with the stepper; save/reload. |
| **Expected** | Trait custom name (italic) + note persist via `traitCustomizations`; after the feat level-swap the custom name and note remain attached to the feat. |
| **Report** | DEV-V-010-T003: PASS / FAIL / SKIP — |

#### DEV-V-010-T004 — Read-only campaign view shows customizations

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-010 |
| **Task** | TASK-377 |
| **Where** | `/campaigns/[id]/view/[userId]/[characterId]` |
| **Steps** | 1. Share the customized character to a campaign. 2. As another campaign member, open the character view. 3. Expand customized feats/traits. |
| **Expected** | Custom names show in italics and notes appear in expanded rows; no edit controls (read-only); button reads **View customization**. |
| **Report** | DEV-V-010-T004: PASS / FAIL / SKIP — |

---

## DEV-V-011 — UI verification safety net (TASK-383)

These verify the automated design-system net itself. They are **command-line** checks (no app clicking) — run from the repo root. A production build must exist (`npm run build`) or a dev/prod server must be running for the Playwright checks.

#### DEV-V-011-T001 — Token contrast gate

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-011 — UI verification safety net |
| **Related task** | TASK-383 |
| **Where** | Terminal, repo root |
| **Needs** | Node installed |

**Steps**
1. Run `npm run verify:contrast`.

**Expected**
- Exits 0 with `Contrast check passed.` and "0 ... no new regressions".
- Editing a semantic token in `src/app/globals.css` to a low-contrast value and re-running makes it exit non-zero listing the failing pair.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-011-T002 — Raw-color ESLint guardrail

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-011 — UI verification safety net |
| **Related task** | TASK-383 |
| **Where** | Terminal, repo root |
| **Needs** | — |

**Steps**
1. Run `npm run lint` (expect 0 errors).
2. Temporarily add `className="bg-blue-500"` to a non-exempt component (not under `(auth)/` or `components/ui/`) and re-run `npm run lint`.

**Expected**
- Step 1: 0 errors (warnings allowed).
- Step 2: a `realms/no-raw-color` **error** on that line. Revert the edit.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-011-T003 — Styleguide gallery renders in both themes

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-011 — UI verification safety net |
| **Related task** | TASK-383 |
| **Where** | `/dev/styleguide` |
| **Needs** | Dev/prod server running |

**Steps**
1. Open `/dev/styleguide`.
2. Click **Toggle theme** to switch light/dark.

**Expected**
- Every section renders (surfaces, text, borders, ramps, status, category, game tokens, buttons, forms, chips, alerts, cards, tabs, loading/empty, tooltip, modal).
- Both themes look intentional; no raw-white panels floating on the dark background.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-011-T004 — Visual + a11y Playwright suite

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-011 — UI verification safety net |
| **Related task** | TASK-383 |
| **Where** | Terminal, repo root |
| **Needs** | `npm run build` done (Playwright auto-starts `npm run start`); matching-OS baselines committed |

**Steps**
1. Run `npx playwright test` (or `npm run verify:visual` and `npm run verify:a11y`).

**Expected**
- All tests pass against committed baselines for the current OS.
- After an intentional UI change, the run fails with a diff; `npm run verify:visual:update` re-baselines and a re-run passes.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-011-T005 — Authenticated visual baselines (TASK-385)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-011 — UI verification safety net |
| **Related task** | TASK-385 |
| **Where** | Terminal, repo root |
| **Needs** | `E2E_TEST_EMAIL` + `E2E_TEST_PASSWORD`; run `npm run e2e:provision` once per environment |

**Steps**
1. Set E2E env vars (see `.env.example`).
2. Run `npm run verify:auth-visual`.

**Expected**
- 11 tests pass (1 setup + 10 screenshots: my-account, characters, campaigns, character-sheet, campaign-detail × light/dark).
- Without secrets, suite skips gracefully.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-011-T006 — Authenticated a11y ratchet (TASK-385)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-011 — UI verification safety net |
| **Related task** | TASK-385 |
| **Where** | Terminal, repo root |
| **Needs** | Same E2E credentials as T005 |

**Steps**
1. Run `npm run verify:auth-a11y`.

**Expected**
- No **new** violations vs `tests/visual/auth-a11y-baseline.json`.
- Pre-existing allowances on character sheet / my-account are documented in the baseline file.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-012 — Landing page rebuild (TASK-387)

Verifies the rebuilt marketing landing page at `/` (REALMS_PRODUCT_OVERVIEW Section 4). One dominant primary CTA, AIDA scroll story, removed onboarding tour / welcome link-farm / Codex-Library CTAs.

#### DEV-V-012-T001 — Guest hero: single primary CTA

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-012 — Landing page rebuild |
| **Related task** | TASK-387 |
| **Where** | `/` (signed out) |
| **Needs** | Logged out (or incognito) |

**Steps**
1. Open `/` while signed out.

**Expected**
- Hero shows headline, subline, and one prominent **Start Playing** button → `/characters/new`.
- A low-weight text link **New to TTRPGs? See how Realms works** sits below the button (not a second button).
- No "Take a quick tour", no welcome banner, no Browse Codex / Browse Library buttons anywhere on the page.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-012-T002 — Explorer anchor scrolls to How it works

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-012 — Landing page rebuild |
| **Related task** | TASK-387 |
| **Where** | `/` |
| **Needs** | — |

**Steps**
1. On `/`, click **New to TTRPGs? See how Realms works**.

**Expected**
- Page scrolls to the **Start playing in three steps** section (3 numbered steps) with offset (heading not hidden under header).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-012-T003 — Returning user gets continue-focused hero

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-012 — Landing page rebuild |
| **Related task** | TASK-387 |
| **Where** | `/` (signed in, ≥1 saved character) |
| **Needs** | Account with at least one saved character |

**Steps**
1. Sign in with an account that has ≥1 saved character.
2. Open `/`.

**Expected**
- Hero shows **Welcome back, adventurer.** with **Continue your adventure** → `/characters` and **Create another character** → `/characters/new`.
- Signing in on an account with **0** characters instead shows the guest **Start Playing** hero.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-012-T004 — Secondary discovery links to creators

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-012 — Landing page rebuild |
| **Related task** | TASK-387 |
| **Where** | `/` |
| **Needs** | — |

**Steps**
1. Scroll to **Want to build something custom?**.

**Expected**
- **Open the Power Creator** → `/power-creator`; **Open the Item Creator** → `/item-creator`.
- These are outline (subordinate) buttons, visually lighter than the hero primary CTA.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-012-T005 — Community Discord CTA

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-012 — Landing page rebuild |
| **Related task** | TASK-387 |
| **Where** | `/` |
| **Needs** | — |

**Steps**
1. Scroll to the closing **Realms is better together** section.

**Expected**
- **Join the Discord** opens the Discord invite in a new tab.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-012-T006 — Mobile (~360px) layout

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-012 — Landing page rebuild |
| **Related task** | TASK-387 |
| **Where** | `/` |
| **Needs** | DevTools responsive mode at 360px width |

**Steps**
1. Open `/` at 360px width, scroll the full page in both light and dark mode.

**Expected**
- No horizontal scroll; hero CTA is full-width and tappable (≥44px); all section headings and cards stack cleanly; dark mode surfaces/borders look intentional.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-013 — Guided Simple character creator (TASK-394–403+)

**Category:** End-to-end guided creator funnel — entry chooser, chapters, save.  
**Prerequisite:** Run **DEV-004** (`sql/guided-creator-schema-seed.sql`) so starter species and Berserker loadouts/abilities exist.

#### DEV-V-013-T001 — Entry chooser routes

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-394 |
| **Where** | `/characters/new` |
| **Needs** | — |

**Steps**
1. From home, click **Start Playing** or **Create another character** (or open `/characters/new` directly).

**Expected**
- Simple vs Advanced cards appear with landing-style hero (gradient, dice decor).
- **Simple** → `/characters/new/guided`; **Advanced** → `/characters/new/advanced`.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T002 — Chapter rail and preview

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-395, TASK-459 |
| **Where** | `/characters/new/guided` |
| **Needs** | — |

**Steps**
1. Open guided creator; confirm chapter rail shows 6 chapters including **Loadout** (not Equipment).
2. Pick a path; confirm preview panel updates with path name.

**Expected**
- Rail highlights active chapter; chapter 5 label is **Loadout**; preview shows path after selection; sticky footer visible at bottom.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T003 — Starter species filter

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-397 |
| **Where** | Guided creator → Species step |
| **Needs** | DEV-004 seed applied (`is_starter` flags) |

**Steps**
1. Complete path step; on species step confirm a reduced starter set appears.
2. Click **Show all species**; confirm full list expands.

**Expected**
- Starter filter when `is_starter` data exists; expand reveals all species.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T004 — Berserker phased loadout (path picks, no quick kits)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-399, TASK-422, TASK-424, TASK-442, TASK-443, TASK-446, TASK-447 |
| **Where** | Guided creator with Berserker (id=1) |
| **Needs** | DEV-004 seed applied |

**Steps**
1. Select Berserker path; on Abilities step click **Use recommended**.
2. Advance to Loadout step.

**Expected**
- Chapter rail shows **Loadout** (not Equipment) for this chapter.
- One page title per Loadout phase (Weapons & shields / Armor / Equipment), like ancestry picks - not a chapter title plus a nested phase heading.
- No Quick kits section or kit cards.
- No **Your selection** summary strip - selected state is the card ring only.
- No **Path pick** badge on weapon/armor cards.
- Weapon cards show image, title, description; collapsed cards show title-adjacent **Currency N** and **Training Points N** only (real costs, not 0) — no named property / mechanic chips in the collapsed body.
- Expand **See more…** for mechanic facts (Ability Requirement, handedness, damage, Strength/Agility/Acuity Weapon) and named property chips with InfoTippy (not expandable chips).
- **PointStatus** labeled **Currency** and **Training Points** (spent / total) on Weapons, Armor, and Equipment.
- Catalog control reads **See more options**.
- No user-facing **Adventuring Gear** or bare **Gear** phase title.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T006 — See more options gear browse (Layer 2 + TP)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-422, TASK-424 |
| **Where** | Guided creator → Loadout step (Berserker), weapon phase |
| **Needs** | DEV-004 seed applied |

**Steps**
1. On Loadout step (weapon phase), click **See more options**.
2. Confirm header columns **Name | Damage | Currency | Training Points** and row values align under those headers (not TYPE/STATS mismatch).
3. Toggle items in the catalog modal; watch Training Points PointStatus.

**Expected**
- Layer 2 `UnifiedSelectionModal` opens with Training Points `PointStatus`; weapon rows show **Name | Damage | Currency | Training Points** aligned under those headers.
- Armor browse uses **Damage Reduction**; gear browse uses **Name | Currency**.
- Selecting updates Training Points / Currency `PointStatus` in the footer; Confirm applies the selection to the draft. Items that would exceed budget are disabled or Confirm stays blocked.
- Closing L2 without Confirm (Escape / Cancel) returns to phase L1 cards without changing the draft.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T007 — Admin loadout TP validation

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-422 |
| **Where** | Admin → Codex → Archetypes → edit path |
| **Needs** | Admin role |

**Steps**
1. Edit Berserker (or any path with loadouts); paste loadout JSON whose items exceed level-1 TP budget.
2. Attempt save.

**Expected**
- Save blocked with validation error naming the kit and TP overrun (not silent failure).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T005 — Save character (signed in)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-402 |
| **Where** | Guided creator → Your Hero |
| **Needs** | Signed-in account; complete prior steps |

**Steps**
1. Enter name, allocate HP/EN, click **Save character**.

**Expected**
- Character saves; play-together modal or redirect to sheet; character appears on `/characters`.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T008 — Species size SegmentedControl clarity

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-425 |
| **Where** | Guided creator → Species → overview (species with 2+ sizes) |
| **Needs** | Starter species with multiple size options (e.g. Human if multi-size) |

**Steps**
1. Open guided creator, pick a species that offers more than one size, continue to overview.
2. Before selecting a size, inspect the size SegmentedControl.
3. Select a size; confirm selected vs idle contrast.

**Expected**
- Unselected size options show distinct borders/surfaces (not flat text on a track).
- Selected option uses primary fill; other options remain bordered idle chips.
- Continue stays blocked until a size is chosen (existing behavior).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T009 — Ancestry No Flaw choice card

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-426, TASK-455 |
| **Where** | Guided creator → Ancestry → Take a flaw? (optional) |
| **Needs** | Species with at least one flaw option |

**Steps**
1. Reach the optional flaw pick after characteristic.
2. Confirm **No Flaw** appears as a **peer** card in the same 2-column grid as Flaw options (same width as one Flaw card — not a full-row span, not a small button below).
3. Note the unselected No Flaw card height (and peer Flaw cards on the same or prior row).
4. Select No Flaw; confirm selected check; confirm the card does **not** shrink relative to peer Flaw cards or its own unselected footprint (density min-height + reserved disclosure action-row slot remain).
5. Click Next pick; confirm flow advances to Abilities (no bonus ancestry trait step).

**Expected**
- Skip uses GuidedChoiceCard styling (title + description) in the compact choice grid at the same card footprint as other options.
- Selecting Skip keeps density `cardCollapsed` min-height and the reserved action-row slot (does not collapse to a stub when alone on a row); empty disclosure controls under restriction notices are still omitted.
- Selecting Skip then Next pick completes ancestry without the bonus trait pick.
- Optional: Next pick with nothing selected still declines (existing footer skip path).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T010 — Skills browse modal when points spent

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-427, TASK-451 |
| **Where** | Guided creator → Skills → **Browse all Skills** (below recommended Skills, not on the skill list card) |
| **Needs** | Path + species chosen; skill points fully spent |

**Steps**
1. Reach Skills; spend all skill points (path/species defaults often do this).
2. Confirm **Browse all Skills** sits below any recommended/suggested skill cards (GuidedLayerNav), not attached to the allocated skill list.
3. Click **Browse all Skills**.
4. Expand a few skill rows and read descriptions; tap + to select one or more skills.
5. Confirm the warning banner and that **Add Selected** stays disabled.
6. Close modal; decrease or remove a skill to free a point; reopen browse and add a skill successfully.

**Expected**
- Browse control is Layer 2 under recommendations (not a primary CTA on the skill list).
- Rows stay full opacity (not greyed out) with 0 points remaining.
- Selection is allowed; warning explains needing to free skill points.
- Add Selected disabled while over budget; works after freeing a point.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-013-T011 — Archetype feats swap at capacity

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-428 |
| **Where** | Guided creator → Archetype Feats |
| **Needs** | Path chosen (e.g. Berserker / martial so max feats ≥ 2) |

**Steps**
1. Reach Archetype Feats; note the X / max counter.
2. Select feats until the counter is at max (Continue enabled).
3. Confirm unselected cards are full opacity (not greyed) and still clickable.
4. Click an unselected feat card; confirm it becomes selected and one previous pick drops (count stays at max).
5. Click a selected card to deselect; confirm count drops and Continue disables until filled again.

**Expected**
- No grey-out / hard lock on unselected cards at capacity.
- At-cap pick swaps in (replaces most recent selection); ancestry-style replace grammar.
- Deselect still works; Continue requires exact max count.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-013-T012 — Feat steps Layer 2 browse

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-429 |
| **Where** | Guided creator → Archetype Feats, then Character Feat |
| **Needs** | Path + species + abilities + skills complete |

**Steps**
1. On Archetype Feats, confirm path guidance groups and **See more feats** below the grid.
2. Click See more feats; confirm L1 groups are replaced by Browse feats (search + filters).
3. Select a non-path feat; confirm counter updates (swap at max if already full).
4. Click **← Back to recommendations**; confirm L1 groups return and selections remain.
5. On Character Feat, repeat See more / back; confirm single-select replace works in L2.

**Expected**
- GuidedLayerNav expand/collapse matches abilities placement (below content).
- L2 defaults to feats you qualify for; optional "Show feats I don't qualify for".
- No modal overlay for Layer 2.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-013-T013 — Phased Loadout walk (weapon → armor → Equipment)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-424, TASK-443, TASK-459 |
| **Where** | Guided creator → Loadout (Berserker) |
| **Needs** | DEV-004 seed; optional Playwright `npx playwright test -c playwright.loadout-audit.config.ts` |
| **Automated** | `tests/visual/guided-loadout-audit.pw.ts` (screenshot audit → `.guided-loadout-audit/`) |

**Steps**
1. Open Loadout; confirm chapter rail **Loadout**; no phase progress strip (footer may still show 1 / N); no Quick kits.
2. Select a weapon card; confirm collapsed card shows title-adjacent **Currency** / **Training Points** only; expand **See more…** for mechanic facts (handedness, damage, Ability Weapon, …) and named property InfoTippy chips.
3. Click **Continue to armor →**. On Armor, click **See more options** and confirm Browse armor modal; dismiss.
4. Click **Continue to Equipment →**; confirm **Equipment** as the page title (only one page title), **Currency** PointStatus, and **Add all recommended Equipment**.
5. Click **See more options**; confirm **Browse Equipment** modal.

**Expected**
- In-step phases with footer continue (not next chapter) until Equipment complete; no top phase strip.
- Layer 2 per-phase titles match (weapons & shields / armor / Equipment).
- Currency shown via PointStatus on all three phases.
- One page title per phase (e.g. Weapons & shields), not a chapter title plus a nested phase heading.
- No **Adventuring Gear** / bare **Gear** labels in the guided Loadout UI.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T014 — Guided skills Layer 1 (path chips + budget + browse)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-407, TASK-419 |
| **Where** | Guided creator → Skills |
| **Needs** | Path with recommended skills |

**Steps**
1. Open Skills step. Confirm centered skill-point budget (not a spreadsheet table).
2. Toggle path skills via path help chips; decline frees a point for curated/browse picks.
3. Spend remaining points (browse-all if needed); confirm Continue requires full spend.
4. Spot-check Advanced creator Skills still uses SkillsAllocationPage.

**Expected**
- GuidedSkillsPanel UX; species locks free; save uses skill_val from allocations; preview/reveal show skill names.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T015 — Your Hero reveal redesign

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-406, TASK-462 |
| **Where** | Guided creator → Your Hero |
| **Needs** | Complete prior steps; signed-in optional for save/portrait |

**Steps**
1. Open reveal: hero band shows clickable portrait + name field; identity (age/height/weight/appearance/background) and Health/Energy sit above Your Build.
2. Click the portrait to upload/change; type a name in the hero band (not only a lower form).
3. Confirm Your Build has no Edit jump links, no Type card, and no standalone Power/Martial ability cards (pills remain on the abilities grid).
4. Confirm HP/EN auto-allocate is quiet (short copy); Save (or guest login prompt).

**Expected**
- Cherry-on-top finale: name/portrait in header; identity + HP/EN before summary; summary is show-off only (chapter rail to edit); T005 save still works when signed in.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-013-T016 — Choice-card deep-dive shell (More details)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-432 |
| **Where** | Guided creator → Path, then Species |
| **Needs** | None |

**Steps**
1. On Path, for a card with long copy: confirm collapsed state shows **See more…** below the truncated body and does **not** show **More details** yet. Expand via See more (or select the card) and confirm **More details** appears in the same action row below the body (not labeled “See more options”).
2. Click **More details** on an unselected-but-expanded path; confirm a full-screen-on-mobile modal opens with Overview + a collapsible Option lists section; confirm the path is still **not** selected.
3. Close the modal; click the path card body; confirm the path **selects** and **More details** remains available (selected = expanded).
4. With a path selected, open **More details** again; confirm selection stays selected after close.
5. Show hybrid paths → expand / select → **More details** on a hybrid → Close → collapse hybrids → Show hybrids again → **More details** on the same hybrid still opens (detail lookup is against the full path list).
6. Species: repeat steps 1–4 for selection independence (content checked in T017).

**Expected**
- Progressive disclosure: truncated → **See more…** → **More details** (deep-dive). Cards without overflow may show **More details** while collapsed.
- **More details** never toggles selection; card click still selects.
- Path modal opens (content checked in T018); Close dismisses.
- Catalog Layer 2 controls (`Show hybrid…` / `Show all species`) remain separate below the grid.
- Switching entities remounts the modal (collapse state resets per entity).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-013-T017 — Species deep-dive modal (overview + option catalogs)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-433 |
| **Where** | Guided creator → Species |
| **Needs** | Codex species + traits loaded |

**Steps**
1. Open **More details** on an unselected species card; confirm the species is still not selected.
2. Confirm Overview shows hero art + description + vitals immediately (even if trait catalogs are still loading); languages, ability bonuses, skills, granted traits (with uses when limited) match post-select overview — no size SegmentedControl; multi-size appears as vitals text.
3. Expand **Ancestry trait options** (and Characteristics / Flaws / Species trait options when present); confirm InfoTippy tips explain pick counts; collapsed rows show truncated descriptions; expand for full copy; Uses column when any trait in the list has limited uses.
4. Confirm section headers show a single count (e.g. `(6)`), not duplicated “6 options (6)”.
5. Close modal; select the species via the card; reopen **More details** and confirm selection stays.

**Expected**
- Catalogs remain read-only (do not pick traits or set size). Footer **Select** applies the species (see **T027**); browsing alone still does not select.
- Empty catalogs omitted; no “Trait not found” placeholder rows.
- `fullScreenOnMobile`; Close returns focus usable on the page.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-013-T018 — Path deep-dive modal (overview + option catalogs)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-434 |
| **Where** | Guided creator → Path |
| **Needs** | Codex archetypes + feats + equipment / powers / techniques loaded |

**Steps**
1. Open **More details** on an unselected path card; confirm the path is still not selected.
2. Confirm Overview shows type chip + full description immediately; while options load, a “Loading path options…” line may appear under overview, then sections populate (no blank flash without feedback).
3. Confirm proficiency (when present), path abilities (martial = one ability chip, not mislabeled Secondary; hybrid = Primary + Secondary), recommended ability scores, and recommended skills when data exists.
4. Expand each listed catalog section (omit empty ones): archetype feats, character feats, weapons (Unarmed Prowess only when that path recommends it), armor, Equipment, techniques (martial) or powers (power / powered-martial). Confirm InfoTippy tips; collapsed rows show truncated descriptions + stats; expand for full copy; weapon/armor named property chips use descriptor + InfoTippy (Training Points spelled out, not TP) when codex properties are known.
5. Confirm no raw-id “phantom” rows for missing powers/techniques/feats (unresolved refs omitted).
6. Close modal; select the path via the card; reopen **More details** and confirm selection stays.
7. Hybrid path: Show hybrids → **More details** on a hybrid → confirm powers section (not techniques) when powered-martial; selection independence still holds.

**Expected**
- Catalogs remain read-only (do not apply equipment). Footer **Select** applies the path (see **T028**); browsing alone still does not select.
- Empty catalogs omitted; unarmed prowess appears only when flagged.
- `fullScreenOnMobile`; Close returns focus usable on the page.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-013-T019 — Shared detail option rows + remodeled legacy trait lists

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-435 |
| **Where** | Guided creator → Path / Species deep-dives; Advanced creator species modal (if opened from Advanced flow) |
| **Needs** | Codex species + archetypes |

**Steps**
1. Guided Species → **More details** → expand an option catalog; confirm GridListRow name + truncated description + Uses when limited; expand row for full copy / uses hint.
2. Guided Path → **More details** → expand weapons (or armor); expand a row with properties; confirm chips expand for description/TP (same language as species trait rows). Optionally expand powers/techniques and confirm energy stats via shared combat builders.
3. Select a species → Ancestry overview (`SpeciesRevealPanel`): granted species traits render as the same elongated expandable list (not card grid).
4. Optional Advanced: open species info modal → trait sections use expandable DetailOptionList rows (choice traits group options under the parent name; limited-use options show Uses). Unresolved trait placeholders (if any) appear dimmed. Confirm Select Species still works; Close dismisses.
5. Spot-check light + dark: description/`text-text-secondary` readable; muted uses `dark:text-text-secondary` where applicable.

**Expected**
- One visual/interaction language for deep-dive catalogs and remodeled legacy trait lists (shared `@/lib/detail-option` builders for traits/feats/equipment/powers/techniques).
- No regression to card select / **More details** independence (T016–T018).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T020 — Path deep-dive polish (overview, tips, labeled chips)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-436 |
| **Where** | Guided creator → Path **More details** (compare Martial vs Power); Species **More details** tip hover |
| **Needs** | Codex archetypes with Martial + Power paths; recommended skills on at least one path |

**Steps**
1. Open a **Martial** path → **More details**. Confirm overview shows Martial proficiency only (no Power Proficiency 0). Path abilities read `Archetype Ability …`. Section title is **Recommended Abilities** (not scores). Recommended Skills chips expand for descriptions.
2. Open a **Powered-Martial** path → **More details**. Path Abilities show both `Archetype Power Ability …` and `Archetype Martial Ability …` (both primary chips; no Primary/Secondary wording between them).
3. Confirm **Path Options** title + intro sit **above the expandable catalogs** (not inside Overview). Expand Archetype Feat Options (or similar); hover the InfoTippy: tip body must **not** repeat the section title as a heading.
4. Expand Weapons / Armor / Powers or Techniques: list shows name + description only (no Stats column, no visible column header bar). Expand a row: fact chips are self-describing (`Damage Reduction N`, `Range …`, `Energy N`, `Action Type …`, `Uses N`, property chips with descriptions).
5. Spot-check Species **More details** tips the same way (no redundant tip titles). Light + dark readable.

**Expected**
- Unused proficiency lines omitted; Powered-Martial dual Archetype Abilities; Path Options bridges into catalogs; title-less tips; Name/Description catalogs with labeled fact chips.
- Card select still independent of **More details** (T016–T018).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T021 — Ancestry trait limited uses (shared with feats)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-441 |
| **Where** | Guided creator → Ancestry (species with a limited-use trait option) |
| **Needs** | Trait option with `uses_per_rec` > 0 |

**Steps**
1. Reach an ancestry/characteristic/flaw pick whose options include a trait with uses.
2. Select that trait card (or expand it).

**Expected**
- Info callout appears: “This trait can be used … per … Recovery.” (same shell styling as feat restriction notices).
- Traits without uses show no notice.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T022 — Admin archetype: no kit authoring

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-442 |
| **Where** | Admin → Codex → Archetypes → edit path |
| **Needs** | Admin access |

**Steps**
1. Open Guided creator (Simple) section on an archetype edit form.

**Expected**
- No “Loadout kits (JSON array)” field.
- Armor step + recommended Equipment controls remain.
- Save does not introduce new kit cards in guided Loadout.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T023 — Equipment phase numbering when options missing

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-443 |
| **Where** | Guided creator → Loadout on a path with no armor (and/or no weapons) |
| **Needs** | Power path or path with armorStep none / empty armament recommendations |

**Steps**
1. Open Loadout for a path without armor options (and separately one without weapons if available).

**Expected**
- No top phase progress strip (TASK-447). Phases advance only via Next/Back.
- Footer fraction (e.g. **1 / 2**) matches visible phase count only — no phantom third phase when armor was never shown.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T024 — Equipment: add all recommended + quantity

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-443, TASK-459 |
| **Where** | Guided creator → Loadout → Equipment |
| **Needs** | Path with recommended Equipment |

**Steps**
1. Reach Equipment phase (page title **Equipment**).
2. Click **Add all recommended Equipment**.
3. Adjust quantity on one selected Equipment card — visible label **Quantity** once; stepper a11y name is item-specific (e.g. Decrease/Increase quantity for [name]).
4. Confirm individual select/deselect still works; open **See more options** for common Equipment browse (**Browse Equipment**).
5. In the L2 modal, select an item and change quantity with the labeled ValueStepper (44px targets); reopen and confirm quantities restore from draft. Confirm fullScreenOnMobile at ~360px.

**Expected**
- All recommended Equipment selected after bulk add (budget-respecting; no duplicate rows); quantities editable on cards without Layer 2.
- Collapsed Equipment cards show title-adjacent **Currency** (and Training Points when applicable); description once — no **Use …** chip.
- Layer 2 still browses broader common Equipment with the same quantity grammar.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T025 — Equipment L1 card-first + no orphan selection chrome

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-446 |
| **Where** | Guided creator → Loadout (Berserker or similar with path weapon/armor picks) |
| **Needs** | DEV-004 seed; optional clear site data if prior kit draft existed |

**Steps**
1. Open Loadout → Weapons. Confirm path pick cards appear (selected ring on cards only — **no** “Your selection” chip strip).
2. Confirm collapsed cards show title-adjacent **Currency** + **Training Points** only (no named property / mechanic chips in the collapsed body); expand **See more…** for handedness / damage / Ability Weapon facts and named property InfoTippy chips.
3. Confirm centered **Currency** PointStatus and **See more options** catalog control.
4. If you previously had a broken draft (selected count without cards), reload once after this build — unresolved ids clear; path cards remain selectable.

**Expected**
- Equipment L1 feels like feats: cards first, See more for in-card depth, See more options for breadth.
- Selection and visible cards stay in sync.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T026 — Equipment PointStatus + property chips (no phase bar)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-447 |
| **Where** | Guided creator → Loadout |
| **Needs** | DEV-004 seed |

**Steps**
1. Confirm a single page title for the current phase (e.g. **Weapons & shields**) - not a chapter title above a second phase heading.
2. Confirm no 1. Weapons / 2. Armor / 3. Equipment strip under the step title.
3. Confirm centered **Currency: remaining / total** PointStatus (same family as Skill points).
4. On a weapon card, confirm title-adjacent **Currency N** / **Training Points N**; expand **See more…** for mechanic facts; hover InfoTippy on Cleave/Graze/etc. (no click-to-expand property chips); confirm cost chip is not 0 when the item has a library cost.
5. Open **See more options** on Equipment; confirm PointStatus still says Currency (not “c”) and modal title is **Browse Equipment**.

**Expected**
- Matches abilities/skills resource chrome; full **Currency** wording in L1/L2; ancestry-like one title per screen; chapter rail says **Loadout**.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T027 — Species More details footer Select

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-448 |
| **Where** | Guided creator → Species → **More details** |
| **Needs** | DEV-004 seed (starter species) |

**Steps**
1. Complete Path; on Species expand a card and open **More details** on an unselected species.
2. Confirm the modal footer shows **Close** on the left and **Select** on the right.
3. Click **Close**; confirm the modal dismisses and the species remains unselected.
4. Reopen **More details** on the same (or another) unselected species; click **Select**.

**Expected**
- Footer layout is Close | Select (not Close-only right-aligned).
- **Select** applies that species (selected ring / preview updates) and closes the modal.
- Catalog browsing alone still does not select.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T028 — Path More details footer Select

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-448 |
| **Where** | Guided creator → Path → **More details** |
| **Needs** | Codex archetypes loaded |

**Steps**
1. On Path, expand a card and open **More details** on an unselected path.
2. Confirm the modal footer shows **Close** on the left and **Select** on the right.
3. Click **Close**; confirm the modal dismisses and the path remains unselected.
4. Reopen **More details**; click **Select**.

**Expected**
- Footer layout is Close | Select.
- **Select** applies that path (selected ring / preview updates) and closes the modal.
- Catalog browsing alone still does not select or apply equipment.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T029 — Chapter rail Foundation lands on Path

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-448 |
| **Where** | `/characters/new/guided` chapter rail |
| **Needs** | Enough progress to open later chapters (complete Path + Species at minimum) |

**Steps**
1. Select a path and continue to Species (or further).
2. Click **Foundation** on the chapter rail.

**Expected**
- Lands on the Path step (**Choose your path**), not Species.
- Active chapter highlight is Foundation.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T030 — Chapter rail Ancestry lands on species overview

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-448 |
| **Where** | Guided creator → Ancestry micro-flow |
| **Needs** | Species selected; ancestry picks available |

**Steps**
1. Complete Foundation; enter Ancestry and advance past the species overview into a later pick (flaw, ancestry trait, or characteristic).
2. Optionally continue into Abilities so Ancestry is complete.
3. Click **Ancestry** on the chapter rail.

**Expected**
- Lands on the species overview (**Your {Species} heritage** / overview panel), not the mid-flow flaw or trait pick.
- Does **not** reopen the last sequential ancestry screen.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T031 — Footer Back stays sequential (not first-of-step)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-448 |
| **Where** | Guided creator footer **Back** (vs chapter rail) |
| **Needs** | Same setup as T030 — deep into Ancestry, then Abilities |

**Steps**
1. On Ancestry, advance to a late pick (e.g. flaw or second ancestry trait) so you are past the species overview.
2. Continue into **Abilities**.
3. Click footer **Back** (do not use the chapter rail).

**Expected**
- Returns to the last Ancestry screen you were on (that late pick), **not** the species overview first screen.
- Contrast with T030: rail jump = first-of-step; footer Back = sequential history.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T032 — Retain guided picks when going back

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-451 |
| **Where** | Guided creator — Ancestry / Abilities / Skills / Feats |
| **Needs** | Progress through Ancestry (with flaw + second trait if available), Abilities, Skills, Archetype Feat |

**Steps**
1. Complete Foundation; on Ancestry pick traits/characteristic/flaw (and second ancestry trait if flaw taken).
2. Continue through Abilities (optionally customize), Skills (spend points / add a suggestion), and pick an Archetype Feat.
3. Use footer **Back** several times to return through Feats → Skills → Abilities → Ancestry late pick.
4. Confirm each screen still shows the same selections.
5. Optionally jump via chapter rail and confirm draft picks still match (landing screen may be first-of-step per T030, but values remain).
6. Return to Path and re-select the **same** path; confirm downstream picks remain. Then select a **different** path; confirm skills/feats/loadout/powers cleared.

**Expected**
- Going back does not forget traits, abilities mode/values, skills, or feats.
- Same path re-select keeps dependents; new path invalidates skills/feats/equipment/powers and resets ability scores/`abilitiesMode` (Abilities step then soft-applies the new path recommended array).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T033 — Skills Browse all below recommended (L1/L2)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-451 |
| **Where** | Guided creator → Skills |
| **Needs** | Path with skill recommendations; some Skill Points remaining so suggestions appear when possible |

**Steps**
1. Open Skills.
2. Note order: allocated skill list (PointStatus + rows) → recommended/suggested skill cards (if any) → **Browse all Skills**.
3. Confirm Browse is not a footer inside the skill list card.
4. Open Browse; add or cancel; confirm Layer 2 modal still works.

**Expected**
- Catalog browse is below curated recommendations (REALMS §3.1 Layer 2), using GuidedLayerNav styling consistent with other guided steps.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T034 — Secondary Ability pill on abilities grid

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-451 |
| **Where** | Guided creator → Abilities (and optionally Your Hero summary) |
| **Needs** | A Power path with a distinct `secondary_ability` (not equal to Archetype Ability) |

**Steps**
1. Choose a Power path that lists a Secondary Recommended Ability in Path **More details**.
2. Continue to Abilities.
3. On the ability grid, confirm the archetype ability tile has an **Archetype** pill (accessible name Archetype Ability) and the secondary ability tile has a **Secondary** pill (similar clear pill treatment; accessible name Secondary Recommended Ability).
4. Optionally Customize Abilities and confirm both pills remain; check Your Hero summary grid if reached.

**Expected**
- Secondary Ability pill visible and distinct when path secondary ≠ archetype ability.
- Pills stay single-line and do not overlap ability names (see also T035).
- Hybrid Power/Martial paths still use Power / Martial pills; no duplicate Secondary when it equals one of those.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T035 — AbilityScoreGrid mobile labels + path pills

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-452, TASK-455 |
| **Where** | Guided creator → Abilities (and Your Hero summary grid) |
| **Needs** | DevTools ~360px width; path with Archetype Ability (+ Secondary if available) |

**Steps**
1. Resize viewport to ~360px width.
2. On Abilities recommended grid, confirm each tile shows a short ability label (e.g. **INT**, not cramped **INTELLIGENCE**).
3. Confirm path pills show short single-line copy (**Archetype** / **Secondary**, or **Power** / **Martial** on hybrids) and do **not** wrap into a taller pill that overlaps the ability name.
4. Hover or inspect the pill: accessible name / title still exposes the full term (e.g. Archetype Ability, Secondary Recommended Ability).
5. Confirm pills stay inside their tile and do not spill into neighbor tiles at ~360px, tablet, or desktop.
6. Continue to Your Hero and confirm the same grid behaves.

**Expected**
- No overflow/spill from labels or pills; pill height growth never covers the ability name.
- Full game terms remain available via aria-label/title when visible copy is shortened.
- At `sm+`, full ability names still appear on tiles.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T036 — AbilityScoreGrid customize edit layout on mobile

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-452 |
| **Where** | Guided creator → Abilities → Customize |
| **Needs** | DevTools ~360px width |

**Steps**
1. On Abilities, open Customize.
2. Confirm ability rows use a roomier layout (not 3 cramped columns with colliding ±).
3. Confirm Decrement/Increment targets are ≥44px and usable without zoom.

**Expected**
- Steppers do not overflow or overlap neighboring ability values.
- Point-buy remains usable with recommended Back via LayerNav.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T037 — Path change resets ability scores

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-451, TASK-452 |
| **Where** | Guided creator → Path → Abilities |
| **Needs** | Two paths with different recommended ability arrays |

**Steps**
1. Pick Path A; continue to Abilities (recommended applied).
2. Back to Path; pick Path B.
3. Return to Abilities (or open character preview abilities).

**Expected**
- Abilities soft-default to Path B’s recommended array (not Path A leftovers).
- Skills/feats/loadout still clear as on path change.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T038 — Mobile footer completion hints visible

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-453 |
| **Where** | Guided creator sticky footer (ancestry picks, skills, feats, loadout, powers) |
| **Needs** | DevTools ~360px width |

**Steps**
1. Resize to ~360px.
2. Ancestry (mid pick): confirm footer shows `N / M picks` above Back/Continue.
3. Skills: confirm points remaining / complete hint appears above actions (in addition to in-step PointStatus).
4. Archetype feats: confirm `N / max` above actions.
5. Loadout with multiple phases: confirm `N / M` phase hint above actions.
6. Resize to `sm+`: confirm hint is centered between Back and Continue (not duplicated above).
7. Character feat step: confirm `N / 1` appears the same way.

**Expected**
- Phone: completion progress is visible (stacked above actions); Back/Continue remain ≥44px and untangled.
- Desktop/tablet `sm+`: single mid-footer hint; **one React mount** (not a hidden duplicate).
- Content not covered by taller footer (`pb-32` on steps with hints).
- Character feat shows `0 / 1` or `1 / 1` like archetype feats.
**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T039 — Loadout chapter + Equipment phase copy (TASK-459)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-459 |
| **Where** | Guided creator chapter rail, Loadout phases, path More details, Your Hero summary |
| **Needs** | Path with weapon/armor/Equipment recommendations (e.g. Berserker) |

**Steps**
1. Confirm chapter rail label **Loadout** (not Equipment).
2. On weapon/armor phases, confirm page titles are phase-only (**Weapons & shields**, **Armor**).
3. Advance to Equipment; confirm page title **Equipment**, continue label **Continue to Equipment →** from armor, and **Add all recommended Equipment**.
4. Open **See more options** on Equipment; confirm **Browse Equipment** (no Adventuring Gear).
5. On path **More details**, confirm Equipment section title (not Adventuring Gear).
6. On Your Hero, confirm summary section **Loadout**.

**Expected**
- Chapter = Loadout; gear phase = Equipment; no user-facing Adventuring Gear or bare Gear phase labels; no new em dashes in these strings.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T040 — Compact fact grammar on weapon cards (TASK-454)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-454 |
| **Where** | Guided Loadout → Weapons (path with weapon picks, e.g. Berserker) |
| **Needs** | Expand a weapon card via See more |

**Steps**
1. Open guided creator → pick a path with weapons → continue to Loadout weapons.
2. Expand a melee weapon with See more (or property disclosure).
3. Confirm mechanic chips use: `Strength Requirement …+` (if any; not "Ability Requirement …"), bare `Two-handed` / `One-handed` (not "Handedness …"), `XdY Type Damage`, and `Strength Weapon` / `Agility Weapon` / `Acuity Weapon` (not "… attack").
4. Confirm named properties (e.g. Graze) are descriptor chips, not expandable "Name: description" text.
5. Confirm Currency chip uses the full word **Currency** (not `c` / `Nc`).

**Expected**
- Chip language matches TASK-454 / `compact-facts` grammar; no "Header: value" mechanic chips; no content orphaned under See more/See less from this change alone (full card layout polish is TASK-457).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T041 — Optional Loadout picks (zero selection Continue) (TASK-456)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-456 |
| **Where** | Guided creator → Loadout (weapon → armor → Equipment) |
| **Needs** | Path with weapon and armor phases (e.g. Berserker) |

**Steps**
1. Reach Loadout weapons with no cards selected (deselect any soft defaults if present).
2. Click Continue (to armor or Equipment as applicable) without selecting a weapon.
3. On armor (if shown), Continue with zero armor selected.
4. On Equipment, Continue with zero Equipment selected.
5. Confirm you land on Powers or Techniques.

**Expected**
- Continue is enabled on weapon, armor, and Equipment with zero selections.
- Hand / Currency / Training Points validation still blocks illegal *adds* when items are chosen (e.g. two-handed + shield, overspend).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T042 — Cross-phase Currency / Training Points accounting (TASK-456)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-456 |
| **Where** | Guided Loadout phases + Powers/Techniques |
| **Needs** | Path with weapons and powers or techniques |

**Steps**
1. On weapons, note Currency and Training Points PointStatus (remaining / total) and InfoTippy on Training Points.
2. Select a weapon; confirm both PointStatus values update; card title shows **Currency N** and **Training Points N** beside the name.
3. Advance through armor/Equipment; confirm the same totals carry forward (spent from prior phases still counted).
4. Open **See more options**; confirm footer shows Currency and Training Points PointStatus.
5. On Powers/Techniques, confirm Training Points PointStatus includes Loadout spend; card taglines include **Training Points N**; selecting beyond remaining shows a clear blocked reason; Continue works with zero selections.

**Expected**
- L1 and L2 share Currency/Training Points totals; removing a selection reclaims budget immediately; powers/techniques share the TP pool with equipment.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T043 — Powers/Techniques L1 confirm + L2 browse (TASK-444 / TASK-458)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-444, TASK-458 |
| **Where** | Guided creator → Powers or Techniques (after Loadout) |
| **Needs** | Path with power or technique recommendations (e.g. a Power archetype path, or Berserker for Techniques); official library loaded |

**Steps**
1. Reach Powers or Techniques. Confirm the chapter still reads **Loadout** framing for prior phases, and this step title is **Your Powers** or **Your Techniques** (Martial → Techniques only; Power / powered-martial → Powers only).
2. Confirm path recommendations appear as **GuidedChoiceCards** with visible selected/unselected state (soft-seeded affordable picks may start selected; deselecting clears them). Continue works with zero selections.
3. Confirm **Training Points** PointStatus and per-card Training Points cost remain (TASK-456); overspend still shows a blocked reason.
4. Click **See more options** below the grid; confirm L1 cards are replaced by **Browse Powers** / **Browse Techniques** (search + optional Action Type filter); path picks sort first when matching.
5. Toggle a catalog pick (respecting TP); confirm selection updates the footer count.
6. Click **← Back to recommendations**; confirm L1 cards return and prior selections remain. Non-path catalog picks appear as selected cards on L1 (flat grid or **Your other Powers/Techniques** section). Removing a promoted card updates Training Points immediately.

**Expected**
- No silent select-all without visible card selection state.
- GuidedLayerNav expand/collapse matches feats placement (below content); L2 is in-step (not a modal).
- Martial never shows Powers browse; Power never shows Techniques browse.
- L2 → L1 promotion keeps selected non-path cards visible (TASK-458).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T044 — Weapon/armor disclosure-safe fact layout (TASK-457)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-457 |
| **Where** | Guided Loadout → Weapons and Armor (~360px + desktop, light and dark) |
| **Needs** | Path with weapon/armor picks (e.g. Berserker); items with named properties and Finesse / ranged as available |

**Steps**
1. Collapsed weapon card: confirm only title-adjacent **Currency N** and **Training Points N** beside the name — no Graze/Cleave/mechanic chips in the collapsed body, and nothing under **See more…**.
2. Expand **See more…**: confirm non-expanding chips for Abilityname Requirement (e.g. `Strength Requirement N+`), handedness (`Two-handed` / `One-handed` / …), damage (`XdY Type Damage`), and **Strength Weapon** / **Agility Weapon** / **Acuity Weapon**. Finesse weapons show Agility Weapon (no separate Finesse chip); ranged non-Finesse show Acuity Weapon.
3. Named properties (Graze, Cleave, …) appear as descriptor chips with a small InfoTippy info trigger — not "Property: description" and not click-to-expand.
4. Confirm no facts, chips, or controls render below See more / See less.
5. Repeat on armor (Damage Reduction / Agility facts under See more; Currency + TP title-adjacent). Check ~360px width and desktop in light and dark.

**Expected**
- Collapsed cards stay quiet; See more owns mechanic + property facts; disclosure boundary respected; grammar matches TASK-454.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T045 — Your Hero identity placeholders + powers title (TASK-462)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-462 |
| **Where** | Guided creator → Your Hero |
| **Needs** | Species with ave height/weight and adulthood_lifespan; path with only powers or only techniques |

**Steps**
1. On reveal, confirm age/height/weight placeholders show species averages (e.g. Avg adulthood / lifespan; Avg N cm; Avg N kg) in grey prompt text when empty.
2. Fill Appearance and Background; after save, confirm appearance and description land on the character (Notes/appearance fields).
3. With only powers selected, confirm Your Build section title is **Powers** (not Powers & Techniques). With only techniques, title is **Techniques**.

**Expected**
- Species averages guide demographics without returning to Species; dual identity textareas save; powers title matches content.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T046 — L2 catalog picks return as selected L1 cards (TASK-458)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-458 |
| **Where** | Guided Loadout → Weapons/Armor; then Powers or Techniques |
| **Needs** | Path with L1 recommendations; official library loaded |

**Steps**
1. Weapons: open **See more options**, select a non-path weapon that fits Currency/TP, Confirm. Confirm a selected card appears on L1; close/reopen modal and Back/Continue — card remains. Deselect it and confirm Currency/TP reclaim.
2. Repeat for Armor if available.
3. Powers/Techniques: **See more options**, select a non-path pick within TP, **← Back to recommendations**. Confirm it appears as a selected L1 card (or under **Your other Powers/Techniques**). Optional subtle **Path** chip may appear on path cards only when mixed in a flat grid — no noisy Path pick badges.

**Expected**
- ID-stable promotion; unresolved stale ids do not invent blank cards; remove updates budgets immediately.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T047 — Equipment quantity + Currency titleMeta polish (TASK-460)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-460 |
| **Where** | Guided Loadout → Equipment (~360px + desktop, light/dark) |
| **Needs** | Path with recommended Equipment |

**Steps**
1. Collapsed Equipment card: title-adjacent **Currency N** (Training Points if any); body description once; no Use chip.
2. Select an item: quantity appears once above See more with visible **Quantity** and item-specific stepper names; no duplicate count.
3. **Add all recommended Equipment** respects remaining Currency; no duplicate rows.
4. Browse Equipment L2: in-row quantity steppers on each row (≥44px), quantity-first select; Modal fullScreenOnMobile; totals update as quantity changes.

**Expected**
- Matches weapon/armor titleMeta placement; quantity UX shared L1/L2; budgets honored.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T049 — Ability Requirement / Damage / no redundant property chips (TASK-464)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-464 |
| **Where** | Guided Loadout → Weapons + Armor (~360px + desktop) |
| **Needs** | Path with weapon (ability req + named props) and armor (Strength Requirement / DR) |

**Steps**
1. Expand a weapon See more: ability chip reads **Strength Requirement N+** (not "Ability Requirement…"); damage reads **XdY Type Damage**.
2. Named properties (Graze, etc.) show **name only** — no Training Points on those chips; Currency / Training Points remain title-adjacent.
3. No chips for Weapon Damage, Armor Base, or a second Damage Reduction property when the dedicated DR fact is present.
4. Armor See more also shows Abilityname Requirement when the armor has a requirement.

**Expected**
- Matches GAME_RULES / compact-facts; no redundant mechanic property chips.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T050 — InfoTippy inside chips and Training Points label (TASK-465)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-465 |
| **Where** | Guided Loadout Weapons (See more) + budget bar; light/dark |
| **Needs** | Weapon with a named property that has a description |

**Steps**
1. Expand See more: property chip with tip shows the **i** inside the chip boundary (not floating beside it).
2. Training Points PointStatus: **i** sits inside the status pill next to the label.
3. Hover/focus/touch-hold still opens help; accessible names present.

**Expected**
- Tips feel attached to their control; no layout jump from sibling icons.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T051 — Equipment L1 Quantity adjacent (TASK-466)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-466 |
| **Where** | Guided Loadout → Equipment |
| **Needs** | Path with recommended Equipment |

**Steps**
1. Select an Equipment card.
2. Confirm **Quantity** label sits immediately beside the − / value / + steppers (not stretched across the card with a large gap).
3. Controls remain ≥44px on ~360px width.

**Expected**
- Tight Quantity group above See more; no excess vertical stretch from justify-between.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T052 — Equipment L2 in-row quantity-first (TASK-467)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-467 |
| **Where** | Guided Loadout → Equipment → See more options |
| **Needs** | Remaining Currency for at least one gear item |

**Steps**
1. Open L2: each row shows in-row **− n +** (including n=0 for unselected) without a side column shoving the row.
2. Increase an unselected row from 0 → 1: row becomes selected.
3. Decrease a selected row to 0: row deselects.
4. Confirm Add Selected carries quantities; Modal fullScreenOnMobile.

**Expected**
- Quantity-first selection; shared UnifiedSelectionModal (no guided-only fork).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T053 — ValueStepper sleek neutral default (TASK-468)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-468 |
| **Where** | Guided Equipment quantity + character sheet skill edit (or creator skills) |
| **Needs** | Any stepper surface |

**Steps**
1. Equipment Quantity steppers: neutral surface buttons (not red/green circles).
2. Skill value steppers (sheet edit or creator): same sleek family.
3. Health/Energy allocators may keep soft green/blue tints — still not loud red/green circle pairs for −/+.
4. Touch targets ≥44px below md; light/dark contrast OK.

**Expected**
- One shared stepper visual language; DESIGN_SYSTEM preference followed.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T054 — Powers/Techniques L1 card + Action Type chip parity (TASK-470)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-470 |
| **Where** | Guided Powers or Techniques step |
| **Needs** | Path with power or technique recommendations |

**Steps**
1. Open Powers (or Techniques) L1 cards.
2. Confirm title-adjacent **Training Points N** only (no Action Type beside the title).
3. Expand **See more…** on a card: Action Type chip is value-only (e.g. **Quick Action**, not “Action Type Quick Action”); Energy appears as **Energy N** chip (or equivalent).
4. Confirm nothing renders under the See more / See less row.

**Expected**
- Same disclosure anatomy as Loadout weapon/armor cards; Action Type chip vs column documented grammar.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T055 — Powers/Techniques L2 UnifiedSelectionModal + Energy filter (TASK-463)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-463 |
| **Where** | Guided Powers/Techniques → See more options |
| **Needs** | Official powers/techniques library; draft with abilities |

**Steps**
1. From L1, click **See more options**.
2. Confirm a full-screen-on-mobile **UnifiedSelectionModal** with GridListRow (Name / Action Type / Energy / Training Points) — not an in-step card dump.
3. Confirm catalog rows with Energy above theoretical L1 max (or >20 when abilities missing) are absent.
4. Select a non-path pick within TP; Confirm; confirm it promotes onto L1.
5. Empty path recommendations still offer modal browse (not inline cards).

**Expected**
- Modal L2 only; Martial→techniques, Power→powers; shared LoadoutBudgetBar TP in footer.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T056 — Innate vs regular L1 lists + store (TASK-471)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-471 |
| **Where** | Guided Powers step (Power or Powered-Martial path) |
| **Needs** | Power archetype path (innate list may be empty until TASK-473 seeds) |

**Steps**
1. On Powers step, confirm two sections: **Innate Powers** and **Powers** (Martial Techniques step has no innate section).
2. Confirm innate and regular picks are independent (selecting one does not double-count in the other list).
3. **See more Innate Powers** opens the innate modal; **See more options** opens the regular powers modal.
4. Empty innate recommendations show a graceful empty state + browse affordance.

**Expected**
- Dual L1 lists; draft `innatePowerIds` separate from `powerIds`.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T057 — Innate Energy fill + threshold gate (TASK-472)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-472 |
| **Where** | Guided Powers step (Power archetype preferred — Innate Energy 16 at L1) |
| **Needs** | Path or catalog with innate-eligible powers (Energy ≤ threshold 8 for Power) |

**Steps**
1. Confirm **Innate Energy** PointStatus uses progression budget (Power L1 = 16, Powered-Martial = 6), not threshold-only 8.
2. Attempt to select a power with Energy > Innate Threshold — blocked.
3. With remaining Innate Energy > 0, Confirm Continue is blocked; spend to remaining 0 — Continue enabled.
4. Regular powers remain optional (zero regular picks OK once innate is full).
5. Save character: innate picks persist with `innate: true`.

**Expected**
- Threshold gate + fully spend Innate Energy; sheet-compatible save.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T048 — Sitewide compact facts + Training Points chip labels (TASK-461)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-461 |
| **Where** | Guided Loadout (Weapons + Powers/Techniques); Library armaments + powers; Codex Equipment; character sheet library expand |
| **Needs** | Path with weapon + power/technique picks; library items with named properties (Graze/Cleave) |

**Steps**
1. Guided Weapons: confirm shared Currency + Training Points PointStatus bar (same chrome as L2 footer and Powers/Techniques); collapsed card title-adjacent **Currency N** / **Training Points N** (not TP).
2. Expand See more: mechanic facts use Abilityname Requirement / Damage / Ability Weapon grammar; named properties are InfoTippy descriptors (not expand chips).
3. Powers/Techniques: title-adjacent **Training Points N**; Action Type capitalization matches cards; budget bar matches Loadout TP pool.
4. Library armaments (or Official list): dense columns may still say **TP**; expanded property chips are non-expanding descriptors with InfoTippy when a description exists; row cost badge says **Training Points**. Codex Equipment properties same.
5. Sheet library: expand a weapon/armor/power — property/part chips without options use descriptor + InfoTippy; cost labels are **Training Points**, not TP. Parts with option levels may still expand.

**Expected**
- L1/L2 chips and budget chrome spell Training Points; dense L3 headers may keep TP; no expand path on guided fact chips; LoadoutBudgetBar used in three guided surfaces; GridListRow descriptors keep InfoTippy tips.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-014 — Codex payload + roll timestamp (TASK-378)

Automated via `npm test` (`src/lib/codex-payload.test.ts`, `src/lib/roll-timestamp.test.ts`).

#### DEV-V-014-T001 — CodexPayload keys match GET /api/codex

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-014 |
| **Automated** | `npm test` — codex-payload.test.ts |

**Expected** — `CODEX_PAYLOAD_KEYS` matches every key on `CodexPayload`; all `useCodex*` selectors compile against typed slices.

#### DEV-V-014-T002 — Roll timestamp legacy + ISO compat

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-014 |
| **Automated** | `npm test` — roll-timestamp.test.ts |

**Expected** — `normalizeRollTimestamp` / `formatRollTimestamp` handle ISO strings, `{ seconds }` legacy objects, and Date instances; invalid strings format as `-`.

---

## DEV-V-015 — Library API typing (TASK-420)

Automated via `npm test` (`src/lib/library-types.test.ts`).

#### DEV-V-015-T001 — Library item types cover all collection keys

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-015 |
| **Automated** | `npm test` — library-types.test.ts |

**Expected** — `LIBRARY_ITEM_TYPES` lists all six library kinds; `LibraryItemByType` maps each kind to a typed interface with required id/docId/name fields.

#### DEV-V-015-T002 — Official library smoke (manual)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-015 |
| **Manual** | Library → Realms Library tabs |

**Expected** — Powers/Techniques/Armaments/Creatures load; "Add to library" confirm succeeds for a logged-in user.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-016 — Library add/load selection parity (TASK-379)

Unified `SelectableItem` shaping via `library-selectable-builders` + `LoadFromLibraryModal` as thin `UnifiedSelectionModal` wrapper. Confirm add (sheet) and load (creators) stay consistent.

#### DEV-V-016-T001 — Power creator Load from Library

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 — Library add/load selection parity |
| **Task** | TASK-379 |
| **Where** | `/power-creator` → Load |
| **Steps** | 1. Open Load. 2. Toggle All / My / Public. 3. Confirm Energy/Action/Duration/Area/Damage columns (dice under Damage, not type-only). 4. Expand a row → labeled `Range:` chip (not bare value). 5. Select one power → Load. 6. Confirm form populates from selection. |
| **Expected** | Modal uses UnifiedSelectionModal chrome (search, list, Load button max 1); columns match sheet Add Power; load restores power fields without duplicate mechanic entries. |
| **Report** | DEV-V-016-T001: PASS / FAIL / SKIP — |

#### DEV-V-016-T002 — Technique creator Load from Library

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-379 |
| **Where** | `/technique-creator` → Load |
| **Steps** | 1. Open Load. 2. Confirm columns include Action, Energy, Weapon, Training Pts. 3. Select a technique → Load. |
| **Expected** | Same list UX as add-technique modal columns; form restores parts/weapon/action correctly. |
| **Report** | DEV-V-016-T002: PASS / FAIL / SKIP — |

#### DEV-V-016-T003 — Item / armament creator Load from Library

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-379 |
| **Where** | `/item-creator` → Load |
| **Steps** | 1. Open Load. 2. Confirm Type + Damage/Armor/Block columns for mixed armaments. 3. Load a weapon and an armor separately. |
| **Expected** | Combined armament list; each load restores the correct item type fields. |
| **Report** | DEV-V-016-T003: PASS / FAIL / SKIP — |

#### DEV-V-016-T004 — Empowered technique creator Load

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-379 |
| **Where** | `/empowered-technique-creator` → Load |
| **Steps** | 1. Open Load. 2. Confirm empowered techniques appear (My/Public). 3. Confirm Energy/Action/Duration/Area/Damage columns + Empowered badge. 4. Load one. |
| **Expected** | Same shaping as sheet Add → Empowered; creator restores nested empowered technique data. |
| **Report** | DEV-V-016-T004: PASS / FAIL / SKIP — |

#### DEV-V-016-T005 — Species + creature creator Load wrappers

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-379 |
| **Where** | `/species-creator` and `/creature-creator` → Load |
| **Steps** | 1. Open Load on each. 2. Select one entry → Load. |
| **Expected** | Same UnifiedSelectionModal wrapper UX (search/sort/Load); type-specific columns still work; no parallel custom list chrome. |
| **Report** | DEV-V-016-T005: PASS / FAIL / SKIP — |

#### DEV-V-016-T006 — Character sheet Add library item parity

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-379 |
| **Where** | `/characters/[id]` → Edit → Library → Add (Powers, Techniques, Weapon/Armor/Shield/Equipment) |
| **Steps** | 1. Open add for power and technique. 2. Compare columns/chips to creator Load modals for the same type. 3. Add one of each; confirm sheet updates. |
| **Expected** | Shared shaping: technique Action column present; power Energy/Duration columns + dice Damage; property/part chips + TP match load modal; Add Selected still multi-select. |
| **Report** | DEV-V-016-T006: PASS / FAIL / SKIP — |

#### DEV-V-016-T007 — Add Power modal fact columns (TASK-437)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-437 |
| **Where** | `/characters/[id]` → Edit → Library → Powers → Add |
| **Steps** | 1. Open Add Power. 2. Confirm ListHeader: Energy, Action, Duration, Area, Damage. 3. Confirm a damaging power shows dice (e.g. `1d8 Fire`), not type alone. 4. Expand the row → `Range:` labeled chip present when ranged/melee applies. |
| **Expected** | No omitted Energy/Duration without a column or labeled chip; Damage cell is self-describing under its header. |
| **Report** | DEV-V-016-T007: PASS / FAIL / SKIP — |

#### DEV-V-016-T008 — Codex Equipment Damage / Dmg. Red. columns (TASK-437)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-437 |
| **Where** | `/codex` → Equipment |
| **Steps** | 1. Open Equipment tab. 2. Confirm Damage and Dmg. Red. column headers. 3. Spot-check a weapon (damage filled) and armor (Dmg. Red. filled). 4. Expand a row with weight → `Weight N kg` labeled chip (not a bare number). |
| **Expected** | Dense browse keeps Damage / Damage Reduction as columns; Weight uses a labeled chip when present. |
| **Report** | DEV-V-016-T008: PASS / FAIL / SKIP — |

#### DEV-V-016-T009 — Creator powers/techniques omitted facts (TASK-437)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-437 |
| **Where** | `/characters/new/advanced` → Powers |
| **Steps** | 1. Open Select Powers → expand a power with area → confirm labeled `Area …` / `Duration …` / `Range:` chips. 2. Empowered tab → expand → Duration/Area not dropped unlabeled. 3. Select Techniques → confirm Action column present. |
| **Expected** | Omitted column facts appear as labeled chips; technique Action matches add-library parity. |
| **Report** | DEV-V-016-T009: PASS / FAIL / SKIP — |

#### DEV-V-016-T010 — Creature creator select fact chips (TASK-437)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-437 |
| **Where** | `/creature-creator` |
| **Steps** | 1. Select Powers → expand → `Duration …` chip when duration exists. 2. Select Inventory → expand a weapon → `Damage:` / `Range:` chips; armor → `Damage Reduction N`. |
| **Expected** | Modal Type/TP/Cost layout still works; combat facts remain self-describing when expanded. |
| **Report** | DEV-V-016-T010: PASS / FAIL / SKIP — |

---

## DEV-V-017 — Site copy modules (TASK-390)

Verifies owner-editable marketing prose lives in `src/lib/constants/copy/` and still renders on major routes. Edit strings in the named `*-copy.ts` file — pages should not need JSX string edits for migrated sections.

#### DEV-V-017-T001 — About carousel from about-copy

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-017 — Site copy modules |
| **Related task** | TASK-390 |
| **Where** | `/about` |
| **Needs** | — |

**Steps**
1. Open `/about` at desktop width and scroll/navigate the dice carousel.
2. Spot-check one slide title and body (e.g. first slide) against `ABOUT_CAROUSEL_SLIDES` in `about-copy.ts`.
3. Resize to ~360px and confirm mobile slide body still renders (compact lists/CTAs).

**Expected**
- Carousel titles/bodies match copy module; Discord/community CTAs still open the shared invite URL.
- No horizontal page scroll; interactive controls remain usable on mobile.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-017-T002 — Header nav labels from nav-copy

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-017 — Site copy modules |
| **Related task** | TASK-390 |
| **Where** | Any authenticated page with main header |
| **Needs** | — |

**Steps**
1. Compare header link labels (Characters, Library, Codex, Creators…, About) to `NAV_COPY.links` in `nav-copy.ts`.
2. Open Creators / Rules dropdowns and confirm child labels match.

**Expected**
- Labels match `nav-copy.ts`; Library/Codex InfoTippy aria labels use `NAV_COPY.tippy`.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-017-T003 — Rules page copy + embed

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-017 — Site copy modules |
| **Related task** | TASK-390 |
| **Where** | `/rules` |
| **Needs** | — |

**Steps**
1. Open `/rules`.
2. Confirm page title/description and “open in new tab” link text match `rules-copy.ts`.
3. Confirm iframe loads (or trouble link opens the view URL).

**Expected**
- Copy and URLs come from `RULES_COPY`; iframe `title` is accessible.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-017-T004 — Resources download copy

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-017 — Site copy modules |
| **Related task** | TASK-390 |
| **Where** | `/resources` |
| **Needs** | — |

**Steps**
1. Open `/resources`.
2. Confirm character-sheet card title/body/download label and coming-soon list match `resources-copy.ts`.

**Expected**
- Prose matches module; download control remains labeled and ≥44px tap target.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-017-T005 — Privacy policy from privacy-copy

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-017 — Site copy modules |
| **Related task** | TASK-390 |
| **Where** | `/privacy` |
| **Needs** | — |

**Steps**
1. Open `/privacy`.
2. Confirm title, intro site URL, section headings, and contact email match `privacy-copy.ts` / `SITE_CONTACT_EMAIL`.

**Expected**
- Prose and mailto use copy modules; heading hierarchy h1 → h2 with no skip.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-017-T006 — Terms from terms-copy

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-017 — Site copy modules |
| **Related task** | TASK-390 |
| **Where** | `/terms` |
| **Needs** | — |

**Steps**
1. Open `/terms`.
2. Confirm section 2 has prohibited-use list between the two service paragraphs (ownership paragraph after the list).

**Expected**
- Matches `TERMS_COPY`; list mid-section order preserved.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-018 — CreatorPageShell parity (TASK-380)

Verifies shared auth/load/save chrome on standalone creators after `CreatorPageShell` rollout. Domain cost math is out of scope — focus on chrome parity.

#### DEV-V-018-T001 — Power creator chrome

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 — CreatorPageShell parity |
| **Related task** | TASK-380 |
| **Where** | `/power-creator` |
| **Needs** | Signed out for login-prompt check; signed-in account for save/load |

**Steps**
1. Open `/power-creator` signed out. Click Save (with a name filled) and Load.
2. Confirm Login prompt opens (soft gate, no hard redirect).
3. Sign in. Click Load — library modal opens. Reset clears fields. Save private succeeds when name set.

**Expected**
- Same toolbar (Load / Reset / Save); sticky summary sidebar; CollapsibleSection sections still expand/collapse.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-018-T002 — Item (armament) creator chrome

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 |
| **Related task** | TASK-380 |
| **Where** | `/item-creator` |
| **Needs** | — |

**Steps**
1. Repeat login-gate / Load / Reset / Save smoke as T001.
2. Confirm rarity sidebar still renders with summary.

**Expected**
- Parity with power chrome; armament type sections still collapsible.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-018-T003 — Technique + empowered technique

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 |
| **Related task** | TASK-380 |
| **Where** | `/technique-creator`, `/empowered-technique-creator` |
| **Needs** | — |

**Steps**
1. Open each route; confirm Load / Reset / Save toolbar and login soft-gate.
2. Empowered: wait for dual parts load (no permanent loading/error unless network fails).

**Expected**
- Chrome matches other creators; editor sections unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-018-T004 — Species Load ungated

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 |
| **Related task** | TASK-380 |
| **Where** | `/species-creator` |
| **Needs** | Signed out |

**Steps**
1. Signed out, click Load — modal opens without login prompt.
2. Click Save with incomplete form — stays blocked by form readiness; with ready form when signed out — login prompt.

**Expected**
- Load ungated; Save still auth-gated via shell.
- Load button aria/tooltip says “Load from library” (not “Log in to load…”) when signed out.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-018-T005 — Creature reset confirm + over-budget save

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 |
| **Related task** | TASK-380 |
| **Where** | `/creature-creator` |
| **Needs** | Signed in |

**Steps**
1. Click Reset — confirm modal appears; cancel leaves data; confirm clears.
2. Exceed a point budget if feasible — Save disabled and/or error toast; under budget Save works.

**Expected**
- Reset confirm preserved; budget gate preserved; login soft-gate on Load/Save when signed out.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-018-T006 — Mobile (~360px) creator shell

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 |
| **Related task** | TASK-380 |
| **Where** | `/power-creator` at 360px |
| **Needs** | DevTools responsive |

**Steps**
1. Open power creator at 360px width; use toolbar + one collapsed section.

**Expected**
- No horizontal page scroll; toolbar buttons usable (≥44px touch); sidebar stacks above main (order).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-018-T007 — Load hook parity + Collapsible a11y (TASK-431)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 |
| **Related task** | TASK-431 |
| **Where** | `/species-creator`, `/creature-creator`, `/empowered-technique-creator`, any creator with CollapsibleSection |
| **Needs** | Signed in (species Load also works signed out) |

**Steps**
1. Species + creature: open Load — SourceFilter My/Public/All; pick an item — form fills and success toast (“… loaded successfully!”).
2. Creature with `?edit=<id>` — loads from library with success toast; power/technique/item pickers still lazy-fetch only when those modals open.
3. Empowered: if both power and technique parts fail to load, error names both datasets; publish override copy says “empowered technique”.
4. CollapsibleSection: expand/collapse; with a rightSlot/Remove visible — only one interactive expand control (no nested button inside button); section title is under page h1 as h2.

**Expected**
- Shared `useLoadModalLibrary` chrome for species/creature; no duplicate load-list fetch UI.
- Load toast parity across creators; shell loading gate for critical codex deps on species/creature.
- Collapsible a11y: dedicated expand button; no heading skip.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-019 — React Compiler hook cleanup (TASK-430)

Verifies behavior parity after removing setState-in-effect / fixing exhaustive-deps in small batches. Domain math out of scope.

#### DEV-V-019-T001 — Guided choice card expand follows selection

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-019 — React Compiler hook cleanup |
| **Related task** | TASK-430 |
| **Where** | `/characters/new/guided` (species or archetype path step with choice cards) |
| **Needs** | Dev server |

**Steps**
1. Open a guided step that shows selectable `GuidedChoiceCard`s.
2. Select card A — card expands (See more / details visible when applicable).
3. Select a different card B — A collapses (or exits selected expand state); B expands.

**Expected**
- Expand state tracks selection without needing a full page refresh.
- No console errors when toggling selection.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-019-T002 — Login `?error=` then retry clears URL-derived message

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-019 |
| **Related task** | TASK-430 |
| **Where** | `/login?error=confirm` then `/login?error=auth_callback` |
| **Needs** | Signed out |

**Steps**
1. Open `/login?error=confirm` — danger alert about confirmation failed is visible.
2. Submit any email/password attempt (or start Google sign-in) — URL-derived confirm alert clears when clearing for a new attempt (submit failures may show a new local error).
3. Open `/login?error=auth_callback` — “Sign-in failed” alert shows again (param change restores URL message).

**Expected**
- `?error=` surfaces on load; starting a new attempt dismisses that URL message (same as old effect + `setError(null)`).
- Changing to a different `?error=` shows the matching copy again.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-019-T003 — Admin feat edit modal resets per open

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-019 |
| **Related task** | TASK-430 |
| **Where** | `/admin/codex` → Feats tab |
| **Needs** | Admin account |

**Steps**
1. Edit a feat; change a field (do not save); Close.
2. Edit the same feat again — form shows stored values, not the abandoned draft.
3. If leveled family: switch levels, edit, switch back — draft for the other level still restores within the same open session.

**Expected**
- Each open is a fresh session (remount via `sessionKey`); within one open, level-switch drafts still work.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-019-T004 — Library scope + enhanced tab clamp

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-019 |
| **Related task** | TASK-430 |
| **Where** | `/library` |
| **Needs** | Signed-in user with at least one Enhanced item (or empty Enhanced tab OK) |

**Steps**
1. Open `/library` signed in — defaults to My Library (unless `?view=realms`).
2. Switch to Enhanced tab, then SegmentedControl → Realms Library — active tab becomes Powers (Enhanced hidden); content is not blank.
3. Switch back to My Library — Enhanced is available again; if you left Realms with Powers selected, Enhanced is not auto-restored (state was clamped).
4. Fresh load of `/library?view=realms` — starts on Realms Library.
5. (Parity) After initial scope is set, changing only the URL `?view=` without reload need not re-lock scope — SegmentedControl is the user override (one-time init after auth).

**Expected**
- No blank Enhanced-under-Realms content; tab state clamps to Powers (display also derives Powers).
- Initial scope locked once auth is ready (auth + `?view=`), then signed-in SegmentedControl changes.
- Guests always see Realms Library (including after sign-out without full remount).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-019-T005 — Edit archetype modal resets per open

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-019 |
| **Related task** | TASK-430 |
| **Where** | Character sheet → edit archetype |
| **Needs** | Character in edit mode |

**Steps**
1. Open Edit Archetype; change type or an ability (do not save); Close.
2. Open Edit Archetype again — selections match the character, not the abandoned draft.
3. Optional: while modal is open, confirm that unrelated character refresh (abilities unchanged) does not wipe an in-progress forge edit.

**Expected**
- Remount-on-open via `editArchetypeSessionKey` (AdminFeats-style session key), not mid-edit remount tied to every ability field change.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-019-T006 — Sheet library tab visibility fallback

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-019 |
| **Related task** | TASK-430 |
| **Where** | Character sheet Library section |
| **Needs** | Owned character; edit mode |

**Steps**
1. Enter edit mode → Library → hide the currently selected tab (eye off) while leaving at least one tab visible.
2. Leave edit mode — content shows a still-visible tab (not blank); that tab stays selected if you re-enter edit briefly.

**Expected**
- Parent `libraryActiveTab` clamps via `resolveLibraryActiveTab` (controlled tab state stays valid).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-019-T007 — Modal filter / draft reset on reopen (batch 3 remounts)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-019 |
| **Related task** | TASK-430 |
| **Where** | Character sheet + creature creator + advanced skills |
| **Needs** | Owned character; optional creature draft |

**Steps**
1. Sheet → Add Feat: change a filter; Close; reopen — filters start clear.
2. Sheet → Level Up: change target level; Close; reopen — target resets to current+1.
3. Sheet → Settings (gear): change visibility/speed without Confirm; Close; reopen — drafts match saved character.
4. Sheet → Proficiencies → Add (any variant): select an item; Close; reopen — selection empty.
5. Advanced/guided skills → Add Skill: set ability filter; Close; reopen — filter clears.
6. Advanced/guided skills → Add Sub-Skill: set a filter; Close; reopen — filters clear.
7. Creature creator → Add Feat: change tab/filter; Close; reopen — defaults restore.

**Expected**
- Each open is a fresh mount (same AdminFeats / edit-archetype remount pattern); abandoned UI state does not stick.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-020 — Sitewide copy compliance (TASK-439)

Spot-checks Realms terminology and em-dash hygiene on high-traffic surfaces after TASK-439.

#### DEV-V-020-T001 — Landing hero has no em dash

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-020 — Sitewide copy compliance |
| **Related task** | TASK-439 |
| **Where** | `/` |
| **Needs** | — |

**Steps**
1. Open `/` and read the hero headline + subline.
2. Confirm copy matches `LANDING_COPY` in `landing-copy.ts` (no em dash `—` in visible hero text).
3. Confirm How it Works step 1 names **Archetype Path** (not Class).

**Expected**
- No em dashes in visible hero/how-it-works copy.
- Game terms use Realms vocabulary.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-020-T002 — Guided chooser Custom bullet has no em dash

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-020 |
| **Related task** | TASK-439 |
| **Where** | `/characters/new` |
| **Needs** | — |

**Steps**
1. Open `/characters/new`.
2. On the Custom mode card, read the bullets.
3. Confirm the first Custom bullet reads "Same rules engine: all steps, all choices" (colon, not em dash).

**Expected**
- Custom card bullets match `GUIDED_CREATOR_COPY.chooser` without em dashes.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-020-T003 — Roll log bonus steppers say Bonus not modifier

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-020 |
| **Related task** | TASK-439 |
| **Where** | Character sheet (any owned character) → open dice / roll log |
| **Needs** | Signed-in character owner |

**Steps**
1. Open a character sheet and open the roll log / custom roll panel.
2. Inspect the +/- controls that adjust the addend on a custom roll (screen reader / accessibility tree or hover titles).
3. Confirm accessible names are **Decrease bonus** / **Increase bonus** (not "modifier").

**Expected**
- aria-labels use Bonus (Realms term), not modifier.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-021 — Stable expand toggle (TASK-445)

Click-open / click-close without moving the pointer. Expandable chips grow into remaining row space; toggle must not jump vertically.

#### DEV-V-021-T001 — Styleguide wrap chips: expand then collapse in place

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-021 — Stable expand toggle |
| **Related task** | TASK-445 |
| **Where** | `/dev/styleguide` → **Expandable Chips** |
| **Needs** | — |

**Steps**
1. Open `/dev/styleguide` and scroll to **Expandable Chips**.
2. In the first ChipGroup (Elemental Damage / Extended Range / Versatile), note the screen position of the **Versatile** chip header.
3. Click **Versatile** once to expand. Do not move the mouse.
4. Click again in the same place to collapse.

**Expected**
- On expand, the **Versatile** header does not jump to a new vertical position (siblings may wrap below).
- Second click in the same spot collapses the chip.
- Expanded description is readable (chip grows into remaining row width, not a wrap-row reboot).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-021-T002 — Library / sheet property chips stay under cursor

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-021 |
| **Related task** | TASK-445 |
| **Where** | Library or character sheet → expand a power/technique/weapon with multiple property chips |
| **Needs** | Signed-in account; item with ≥3 expandable property/part chips |

**Steps**
1. Expand a library or sheet row that shows a wrap of property/part chips.
2. Click a chip that is **not** the first on its row.
3. Without moving the pointer, click again to collapse.
4. Optionally expand a GridListRow itself and confirm the row header stays put while details open below.

**Expected**
- Chip toggle stays under the pointer across open/close.
- Row expand opens content below without moving the row header/chevrons upward.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-021-T003 — Guided choice card See more placement

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-021 |
| **Related task** | TASK-445 |
| **Where** | `/characters/new/guided` → any step with long choice-card copy (Path / Species) |
| **Needs** | — |

**Steps**
1. Open Guided creator and reach Path or Species cards with truncated descriptions.
2. Confirm order: title → description (clamped) → **See more…** (not between title and body).
3. Expand via **See more…**; confirm **See less** (and **More details** when applicable) remain below the body.

**Expected**
- Disclosure controls are below card body copy, never between title and description.
- Selected short cards (e.g. No Flaw) still keep density min-height and the reserved action-row slot (TASK-455).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-022 — Characters list page (TASK-469)

Portrait cards match square crop; no search or ListHeader chrome; Add Character matches card geometry.

#### DEV-V-022-T001 — Portrait cards are square and not over-dense

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-022 |
| **Related task** | TASK-469 |
| **Where** | `/characters` |
| **Needs** | Signed-in user with at least one character that has a portrait |

**Steps**
1. Go to **Characters**.
2. Confirm each character card portrait area is **square** (1:1), matching how portraits are cropped on upload (not a tall 3:4 crop that cuts the sides).
3. On a wide desktop viewport, confirm the grid uses at most **3** columns (not 4 packed cards).

**Expected**
- Portrait display matches crop aspect; faces/art are not horizontally shortened by a tall frame + dense columns.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-022-T002 — No search or ListHeader on characters list

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-022 |
| **Related task** | TASK-469 |
| **Where** | `/characters` |
| **Needs** | Signed-in user with at least one character |

**Steps**
1. Go to **Characters** with characters present.
2. Confirm there is **no** search field and **no** NAME / LEVEL / UPDATED list header bar.
3. Confirm character cards still open the sheet; Add Character, duplicate, and delete still work.

**Expected**
- Page is title + card grid only (plus empty state when none); list-row search/sort chrome is gone.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-022-T003 — Add Character card matches portrait + footer geometry

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-022 |
| **Related task** | TASK-469 |
| **Where** | `/characters` |
| **Needs** | Signed-in user with at least one character |

**Steps**
1. Go to **Characters** with characters present.
2. Compare **Add Character** to a character card in the same row.
3. Confirm Add Character has a square top slot (icon area) plus a footer band under it, and matches the row height of neighboring character cards (not a short square-only tile).

**Expected**
- Add Character shares the same portrait-slot + info-footer structure so the grid reads as one composition.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## Planned suites (split from legacy DEV-T)

| Suite | Topic | Legacy | Status |
|-------|-------|--------|--------|
| DEV-V-002 | Campaign & rolls security | DEV-T-002 | Planned |
| DEV-V-003 | Admin role change safety | DEV-T-003 | Planned |
| DEV-V-004 | Storage & account security | DEV-T-004 | Planned |
| DEV-V-005 | RLS / DB migrations | DEV-T-005 | Planned |
| DEV-V-006 | Resources PDF | DEV-T-006 | Planned |
| DEV-V-007 | Auth UI (Google only) | DEV-T-007 | Planned |
| DEV-V-014 | Codex typing + roll timestamp (TASK-378) | — | Automated (`npm test`) |
| DEV-V-015 | Library API typing (TASK-420) | — | Automated (`npm test`) + manual smoke |
| DEV-V-016 | Library add/load selection parity (TASK-379) | — | Manual — see suite above |
| DEV-V-017 | Site copy modules (TASK-390) | — | Manual — see suite above |
| DEV-V-018 | CreatorPageShell parity (TASK-380 / TASK-431) | — | Manual — see suite above |
| DEV-V-019 | React Compiler hook cleanup (TASK-430) | — | Manual — see suite above |
| DEV-V-020 | Sitewide copy compliance (TASK-439) | — | Manual — see suite above |
| DEV-V-022 | Characters list page (TASK-469) | — | Manual — see suite above |

When implementing a related task, replace the legacy **DEV-T-###** block with granular **DEV-V-###** tests in this file.
