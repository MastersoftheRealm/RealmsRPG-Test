# Build Validation (QA How-To)

Step-by-step manual checks for QA after a build or PR. **One behavior = one test.** Do not combine unrelated checks in a single test.

**Owner / QA:** Run suites linked from [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md). Report each test as **PASS**, **FAIL**, or **SKIP** with notes.

**Agents:** When you mark a user-facing task `done` or `partial`, you **must** add or update tests here and index the suite in `DEVELOPER_TASK_QUEUE.md`. See [`AGENT_GUIDE.md`](AGENT_GUIDE.md) → Build validation.

---

## ID scheme

| Prefix | Meaning | Example |
|--------|---------|---------|
| **DEV-V-###** | Validation **suite** (category) | DEV-V-001 — Advanced character creator step guards |
| **DEV-V-###-T###** | Single test inside a suite | DEV-V-001-T001 |

- Suite number = next free `DEV-V-###` in this file **or** the archive (do not reuse archived IDs).
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
| **Where** | Route or page |
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
5. **Stale tests** — When behavior changes, update the test or mark **Superseded** with date + replacement ID. See **Archive** below for moving whole suites.
6. **Partial work** — Add tests only for `completed_work`; note `remaining_work` tests as *Planned* in the suite header.

---

## Archive

Verified, CI-only, or long-superseded suites **not** cited by [Pending owner QA](DEVELOPER_TASK_QUEUE.md#pending-owner-qa-implementation-done) live in [`archive/BUILD_VALIDATION_ARCHIVE.md`](archive/BUILD_VALIDATION_ARCHIVE.md). Do not delete tests — move them. Suites still linked from Pending owner QA stay in this file.

Moved (TASK-718): DEV-V-005, DEV-V-010, DEV-V-011, DEV-V-014, DEV-V-015, DEV-V-022, DEV-V-031.

---

## DEV-V-001 — Advanced character creator step guards

**Related tasks:** TASK-356, TASK-717, TASK-804, **TASK-856**  
**Chooser vs Advanced:** `/characters/new` is the Guided / Custom / Legacy chooser (DEV-V-013-T001 / T075). Numbered steps (**1. Archetype** … **9. Finalize**), **Forge Your Own**, and **Choose a Path** live at `/characters/new/advanced` (chooser **Legacy**). Do not treat the chooser as step 1 Archetype.  
**Start URL:** `/characters/new/advanced`  
**Needs:** Logged-in test account  

Reach Advanced via **Characters** → **Add Character** → **Legacy**, or open `/characters/new/advanced` directly. Use **Forge Your Own** for tab-guard and validation tests unless the test title says otherwise.

---

### 1. Archetype

#### DEV-V-001-T001 — Choose a Path can be selected

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 1. Archetype |
| **Related task** | TASK-356, TASK-717 |
| **Where** | `/characters/new/advanced` → **1. Archetype** |
| **Needs** | Logged-in test account |

**Steps**
1. Go to **Characters** → **Add Character** (chooser at `/characters/new` — Guided / Custom / Legacy).
2. Click **Legacy** (or open `/characters/new/advanced` directly).
3. On step **1. Archetype**, click the **Choose a Path** card.

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
| **Where** | `/characters/new/advanced` → **1. Archetype** |
| **Needs** | Logged-in test account |

**Steps**
1. Go to **Characters** → **Add Character** → **Legacy** (or open `/characters/new/advanced`).
2. On **1. Archetype**, click the **Forge Your Own** card.

**Expected**
- **Forge Your Own** card shows selected styling.
- Archetype type cards appear (**Power**, **Martial**, **Powered-Martial**) with fantasy category descriptions (supernatural focus / blend / martial master — shared `ARCHETYPE_CATEGORY_INFO`; TASK-599).
- **Choose a Path** card is not selected.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T003 — Choose a Path is deselected when Forge Your Own is selected

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 1. Archetype |
| **Related task** | TASK-356 |
| **Where** | `/characters/new/advanced` → **1. Archetype** |
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
| **Where** | `/characters/new/advanced` → **1. Archetype** |
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
| **Where** | `/characters/new/advanced` → **1. Archetype** |
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
| **Where** | `/characters/new/advanced` → **1. Archetype** |
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
| **Where** | `/characters/new/advanced` |
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
| **Where** | `/characters/new/advanced` |
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
| **Where** | `/characters/new/advanced` → **4. Abilities** |
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
| **Where** | `/characters/new/advanced` → **4. Abilities** |
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
| **Where** | `/characters/new/advanced` → **6. Feats** |
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
| **Where** | `/characters/new/advanced` → **6. Feats** |
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
| **Where** | `/characters/new/advanced` |
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
| **Related task** | TASK-356 · TASK-596 · TASK-606 |
| **Where** | `/characters/new/advanced` → **7. Equipment** (Forge / Advanced) |
| **Needs** | Logged-in; reach Equipment without spending currency yet
| **CI** | Partial — `src/lib/creator/advanced-equipment-catalog.test.ts` asserts `computeStartingCurrency(1) === 200` (display chrome stays human)

**Steps**
1. Reach **7. Equipment** with a fresh Advanced creator session (or after archetype reset).
2. Find the **Currency** PointStatus on the step header (`LoadoutBudgetBar`).

**Expected**
- **Currency** remaining shows **200** / **200** (starting budget 200c; not 500c or another value).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T015 — Saved character currency matches purchases

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 6. Equipment |
| **Related task** | TASK-356 · TASK-739 |
| **Where** | `/characters/new/advanced` → **7. Equipment** → saved character sheet |
| **Needs** | Logged-in; note item prices before buying |
| **CI** | Partial — `character-creator-store.test.ts` floors negative `getCharacter` currency at 0 |

**Steps**
1. On **7. Equipment**, add one or more items; note total spent.
2. Finish creator through **9. Finalize** and save the character.
3. Open the saved character sheet and check **currency**.

**Expected**
- Character **currency** = **max(0, 200c − total spent)** (matches remainder after purchases; never negative).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T016 — Advanced equipment / powers / finalize use LoadoutBudgetBar PointStatus

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 6. Equipment · Powers · Finalize |
| **Related task** | TASK-606 |
| **Where** | `/characters/new/advanced` → **7. Equipment** → **8. Powers & Techniques** → **9. Finalize** (Forge / Advanced) |
| **Needs** | Logged-in; path or forge Advanced session with budgets visible |

**Steps**
1. On **7. Equipment**, confirm header shows **Currency** and **Training Points** PointStatus pills (colored remaining grammar; TP tip on the Training Points label).
2. On **8. Powers & Techniques**, confirm the same **Training Points** PointStatus pill (not a plain “Proficiency TP” chip / text bar).
3. On **9. Finalize**, confirm **Currency**, **Training Points**, and **Energy** PointStatus pills together.

**Expected**
- All three steps use PointStatus via `LoadoutBudgetBar` (no plain text resource bar; no separate L1 vs non-L1 currency/TP chrome).
- Labels spell **Currency** / **Training Points** / **Energy**.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T017 — Legacy label on the tabbed creator (TASK-748)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | Entry chrome |
| **Related task** | TASK-748 |
| **Where** | `/characters/new` → **Legacy** → `/characters/new/advanced` |
| **Needs** | — |

**Steps**
1. Open `/characters/new`. Confirm the third card is **Legacy** (not Advanced). Tagline/bullets refer to the former Advanced / tabbed wizard.
2. Open the Legacy card. Confirm the wizard heading is **Create New Character** with a **Legacy** chip, the step line starts with **Legacy creator**, and **Choose another way to create** returns to the chooser.
3. Confirm the browser tab title is **Legacy Character Creator** (or includes that phrase). Repeat at ~360px: chip stays beside the title; back link remains tappable.

**Expected**
- Players never see “Advanced” as the product name for this wizard. Guided and Custom remain the cohesive creator; Legacy is the transitional tabbed flow.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T018 — Overspent Advanced kit saves at 0 Currency (TASK-739)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 6. Equipment |
| **Related task** | TASK-739 |
| **Where** | `/characters/new/advanced` → **7. Equipment** → **9. Finalize** → saved character sheet |
| **Needs** | Logged-in; a path whose recommended kit costs more than 200c, **or** any Equipment session where remaining Currency is negative |
| **CI** | Partial — `character-creator-store.test.ts` + `character-save.test.ts` (`clampSavedCurrency`) |

**Steps**
1. On **7. Equipment**, get remaining Currency **below 0** (path **Add all recommended** that exceeds the 200c budget is enough; catalog add is gated by remaining).
2. Continue through **9. Finalize**. Confirm the Currency pill can still show the signed remainder (overspend), then **save**.
3. Open the saved character sheet and check **currency**. Confirm the save did **not** 400 with “cannot start play in debt”.

**Expected**
- Save succeeds.
- Sheet **currency** is **0** (not negative). Equipment on the character is the overspent kit.
- Repeat at ~360px: save still succeeds; sheet currency is 0.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T019 — Continue Without Saving dismisses login on Finalize (TASK-804)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 9. Finalize |
| **Related task** | TASK-804 |
| **Where** | `/characters/new/advanced` → **9. Finalize** |
| **Needs** | Logged out (incognito); a complete legal level-1 build |

**Steps**
1. Finish a legal Legacy build while signed out.
2. On **9. Finalize**, press **Create Character** (or **Review & Create** then **Create Character**).
3. On **Login Required to Save**, press **Continue Without Saving**.
4. Press **Create Character** again to confirm the prompt can reopen, then **Continue Without Saving** once more.

**Expected**
- The login prompt closes and stays closed. The review modal is also gone. The draft is still on Finalize (name, portrait, Health/Energy unchanged).
- Nothing is created. No navigation to a character sheet.
- A second Create opens the same login prompt again (guest still cannot save).
- Desktop + ~360px (Continue sits in the sticky modal footer on the phone).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T020 — Legacy step rail shows a C1 overflow affordance (TASK-848)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | Entry chrome |
| **Related task** | TASK-848 |
| **Where** | `/characters/new/advanced` at **360** and **390** |
| **Needs** | — |

**Steps**
1. Open the Legacy creator at **360px**. Confirm the numbered step rail (1. Archetype …) is a side-scroll with an edge fade and a **Show more steps** chevron when later steps are off-screen. **Restart** stays visible (not inside the scrolling steps).
2. Click the chevron (or scroll the rail). Confirm the fade/chevron on the start edge appears once you have scrolled, and both hide when every step is in view.
3. Repeat at **390px**. Resize to `md+` (768+): steps wrap; chevrons are gone when nothing overflows.
4. Confirm the page itself does not side-scroll (C6). `/characters/new/advanced` still loads.

**Expected**
- Overflowing step rails use the same `.tab-nav-scroll` fade + chevrons as underline `TabNavigation`. Affordance unmounts when the rail does not overflow. Chevrons scroll the step list only.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-001-T021 — Legacy feat and equipment Search + Filters share one row (TASK-856)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-001 |
| **Section** | 4. Feats / 6. Equipment |
| **Related task** | TASK-856 |
| **Where** | `/characters/new/advanced` → **6. Feats** and **7. Equipment** |
| **Needs** | Logged-in; Forge Your Own through Skills so Feats and Equipment catalogs load |

**Steps**
1. Open `/characters/new/advanced`, complete through **5. Skills**, and open **6. Feats**. Confirm **Search** and **Filters** sit on one row (Filters to the right of search), not a Search field stacked above a separate Show Filters block. Archetype / Character feat pills stay above that row.
2. Open **Filters**. Category, Ability, and Qualification still apply. Type in Search and confirm the feat list still filters.
3. Continue to **7. Equipment**. On Weapons / Armor / Equipment (not Unarmed Prowess), confirm the same Search + Filters row. Source and Budget live inside **Filters**. Search and source still change the list.
4. Repeat at **~360px**: the search row may wrap; the page itself does not side-scroll (C6). `/characters/new/advanced` still loads.

**Expected**
- Both catalogs use the same compact Search + Filters grammar as Codex/Library (`ListSearchToolbar`). Lists still search and filter. Guided L3 catalogs are unchanged.

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
| **Needs** | Saved path character (`archetypePathId` set) |

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

#### DEV-V-008-T015 — Sheet header armor DR + Critical Range (TASK-512 / TASK-522 / TASK-788)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Character sheet header |
| **Where** | `/characters/[id]` |
| **Needs** | Character with armor equipped vs unarmored |

**Steps**
1. Open a character with **no** equipped armor — confirm **Damage Reduction** and **Critical Range** do not appear in the header vitals row (Speed/Evasion area).
2. Equip armor that has **no** Damage Reduction and **no** Critical Range +1 property — confirm neither DR nor Critical Range appears (do not show DR 0 or unmodified Evasion+10).
3. Equip armor with known DR only — confirm **Damage Reduction** appears and matches the Library armor DR column; **Critical Range** stays hidden.
4. Equip armor with Critical Range +1 (Option 1 level N → increase **1+N**). Confirm header **Critical Range** = sheet **Evasion + 10 +** that increase. DR still follows step 3 if the armor also has DR.
5. Confirm DR / Critical Range cards (when shown) match Speed / Evasion card size (padding, value `text-4xl`, `text-text-primary` value color — not a smaller martial-colored variant).
6. Toggle dark mode; confirm labels and values remain readable.

**Expected**
- Unarmored, or armor that does not change the stat: no DR / Critical Range block for that stat (play/edit). Temp mode always shows both cards — DEV-V-009-T053.
- Armored with DR: DR matches library armor row.
- Armored with Critical Range +1: Critical Range = Evasion + 10 + (1 + op_1_lvl).
- Header vitals cards are visually consistent (size + value color).

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

#### DEV-V-008-T027 — Level-up auto-assigns prof to pure side (TASK-892)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Level-up proficiency |
| **Related task** | TASK-892 |
| **Where** | Character sheet → level-up |
| **Needs** | Pure Martial (e.g. 2/0) or pure Power (0/2) character at level 4 |

**Steps**
1. Note Power/Martial prof split on Archetype section.
2. Level up from **4 → 5** (or 9 → 10 for a second +1).

**Expected**
- Pure Martial: new point goes to Martial (e.g. 2/0 → 3/0), not left unspent.
- Pure Power: new point goes to Power (e.g. 0/2 → 0/3).
- Powered-Martial with both sides > 0: split unchanged; player allocates manually.
- Path level-5 admin floor still applies when set (DEV-V-008-T004).

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
| **Related task** | TASK-372, TASK-484, TASK-594, TASK-599 |
| **Where** | Sheet edit mode → edit archetype |
| **Needs** | Path character; edit mode enabled |

**Steps**
1. Enable edit mode; open **Edit Archetype & Ability**.
2. Observe path view (read-only identity) — path name, abilities, proficiency; no creation chip.
3. Click **Switch to Forge Your Own** or **Choose a Different Path**.
4. On **Choose a Different Path**, confirm paths are grouped Power / Powered-Martial / Martial (`SelectionCard`, not GuidedChoiceCard); confirm before apply.
5. On forge editor, ability picks use the same ability-button chrome as Advanced forge; type cards show the same fantasy category descriptions as Advanced forge (not proficiency-only blurbs).

**Expected**
- Path characters see read-only path card (not forge type picker first).
- No **Forge Your Own Path** / **Archetype Path** creation chip on the path card.
- Switch actions show **ConfirmActionModal** with data-loss warning before proceeding.
- Path list grouping and forge ability buttons match Advanced creator (shared helpers).
- Forge type card copy matches Advanced / creature selector (`ARCHETYPE_CATEGORY_INFO`).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T009 — Creator Apply recommended skills

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Creator skills |
| **Related task** | TASK-373 |
| **Where** | `/characters/new/advanced` → **5. Skills** (path mode) |
| **Needs** | Path with level-1 skill recommendations |

**Steps**
1. Create a path character through to **5. Skills**.
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
| **Where** | `/characters/new/advanced` → **6. Feats** (path mode) |
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
- Validation uses progression Innate Energy/Threshold (not ARCHETYPE_CONFIGS.innateEnergy threshold).
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

#### DEV-V-008-T016 — Admin Level 1 skills picker (3 base, legacy warn)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Admin codex |
| **Related task** | TASK-515 |
| **Where** | `/admin/codex` → Archetypes |
| **Needs** | Admin account; codex skills with at least one sub-skill |

**Steps**
1. Add or edit an archetype path. Open **Level 1 Recommendations → Skills**.
2. Confirm the picker lists **base skills only** (`base_skill_id` empty/null). Sub-skills and any-base skills (`base_skill_id === 0`) are not offered as new picks.
3. Select 3 skills. Confirm a 4th cannot be added (dropdown empty / warning toast).
4. If a legacy path has more than 3 skills or any sub-skill (including `base_skill_id === 0`): open Edit — expect a non-blocking warning toast and inline warning; Save still succeeds.
5. Save a valid ≤3 base-skill path; re-open and confirm skills round-trip.

**Expected**
- New authoring capped at 3 base skills (null/undefined `base_skill_id` only); legacy excess/sub-skills warn only (do not block save).
- Guided creator still consumes `pathData.level1.skills` for paths with valid picks.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T017 — Admin Level 1 armaments weapon/armor split

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Admin codex |
| **Related task** | TASK-516 |
| **Where** | `/admin/codex` → Archetypes |
| **Needs** | Admin account; official items with weapon, shield, and armor |

**Steps**
1. Edit an archetype path Level 1 armaments. Confirm separate pickers: **Weapons & shields** and **Armor** (not one mixed list).
2. Add at least one weapon/shield and one armor with quantities. Save.
3. Re-open — each item appears under the correct picker; storage remains a single armaments list (guided loadout still sees both).
4. Confirm Equipment / recommended gear controls are unchanged.

**Expected**
- UI split matches guided weapon vs armor phases; no new DB columns.
- Touch targets / `fullScreenOnMobile` on the modal still work at ~360px.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T018 — Admin Level 1 feat guidance groups (character vs archetype)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Admin codex |
| **Related task** | TASK-514 |
| **Where** | `/admin/codex` → Archetypes |
| **Needs** | Admin account; Level 1 character + archetype feats in codex |

**Steps**
1. Edit an archetype path. Confirm Level 1 has separate **Character feat groups** and **Archetype feat groups** (not one mixed Feats ChipSelect).
2. Add a group in each section: name, why, designated feats. Save.
3. Re-open — groups persist with audience; **Synced Level 1 feats** lists the union.
4. In guided creator on that path: Character Feat step shows only character-audience groups; Archetype Feats step shows only archetype-audience groups (no title-includes-"character" dependency).

**Expected**
- Explicit `audience` on groups; flat `level1_feats` matches union; modal `fullScreenOnMobile` / ≥44px touch targets.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T019 — No path-recommended species (is_starter only)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Admin codex + creators |
| **Related task** | TASK-517 |
| **Where** | `/admin/codex` → Archetypes; `/characters/new/advanced` species; `/characters/new/guided` species |
| **Needs** | Admin + at least one `is_starter` species |

**Steps**
1. Admin archetype path modal: confirm there is **no** Recommended species ChipSelect.
2. Advanced creator path mode Layer 1 species: curated set is **starter** species (not path-specific IDs); Browse all still works.
3. Guided species step still uses starters only (unchanged).

**Expected**
- No `level1_recommended_species` authoring or filtering; species curation = `is_starter`.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T020 — Admin edit modals use wide layout (TASK-529)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Admin codex / admin editors |
| **Related task** | TASK-529 |
| **Where** | `/admin/codex` (Archetypes + at least one other tab); optional `/admin/images` |
| **Needs** | Admin account; desktop viewport ≥1280px |

**Steps**
1. Open **Add** or **Edit** on Archetypes. Confirm the dialog is clearly wider than a normal form modal (roughly content-page width, not a narrow card) and still has visible side margins/backdrop.
2. Spot-check Feats, Species, or Parts edit modal — same wide treatment; header/footer usable; content scrolls inside the modal if tall.
3. Resize below 768px (or device mode): modal goes full-screen (`fullScreenOnMobile`); no clipped controls.
4. Optional: Image Library edit modal and Public Library enhanced-item edit — same wide desktop size.

**Expected**
- Complex admin add/edit modals use Modal `size="full"` (`max-w-6xl`); confirms/delete stay small; mobile full-screen preserved.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T021 — Admin archetype modal: expandable selected feats + clean layout (TASK-534)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Admin codex |
| **Related task** | TASK-534 |
| **Where** | `/admin/codex` → Archetypes |
| **Needs** | Admin account; Codex feats with descriptions |

**Steps**
1. Edit an archetype path. In a Character or Archetype feat guidance group, add 2+ feats via **Add feats**.
2. Confirm selected feats appear as compact expandable rows (not pill chips only). Expand one — Codex description is readable; collapse and remove via row delete still work.
3. Confirm group name + remove control align without overlapping; armament/equipment quantity rows are full-width (label + qty + remove do not clip each other).
4. Optional: Level Progression (2+) **Add Feats** / **Remove Feats** — same expandable selected-feat rows.

**Expected**
- Admins can read feat text after picking without leaving the modal; dense controls do not overlap at desktop or ~360px width.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T022 — AdminSpecies trait Add uses UnifiedSelectionModal (TASK-572)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Admin codex |
| **Related task** | TASK-572 |
| **Where** | `/admin/codex` → Species |
| **Needs** | Admin account; Codex traits available |

**Steps**
1. Open **Add Species** (or edit an existing species).
2. Under **Species Traits** (or Ancestry / Flaws / Characteristics), click **Add**.
3. Confirm a selection modal opens with search, sortable Name/Uses/Recovery headers, selectable GridListRow list, and sticky **Cancel** / **Add Selected** footer (same grammar as other add-X USMs).
4. Search for a trait; select 1–2 rows; click **Add Selected**. Confirm they appear in the species field list and can be removed with the row X.
5. Re-open the same Add picker — already-added traits for that field are hidden.
6. Optional: Traits tab → edit a choice trait — **Choice trait options** stays an inline searchable multi-select inside the edit modal (not a nested USM).

**Expected**
- Species trait Add uses UnifiedSelectionModal (no per-row Add/Done-only parallel shell).
- AdminTraits choice options remain editor chrome inside the edit modal.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T023 — Admin Archetypes form helper extract parity (TASK-381 Phase 6a)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Admin codex |
| **Related task** | TASK-381 |
| **Where** | `/admin/codex` → Archetypes |
| **Needs** | Admin account |

**Steps**
1. Open Add Archetype — confirm modal opens (`size="full"` / full-screen on mobile).
2. Set name + type; author Level 1 skills (≤3 base), recommended abilities steppers, at least one feat guidance group with an expandable selected feat row, and one armament/equipment quantity row.
3. Save → re-open Edit — fields round-trip (skills, abilities, feat groups, qty rows, innate powers if Power/PM).
4. Duplicate an existing path — name gets ` copy` suffix; L1 recommendations restore; no console errors.
5. Optional regression: re-smoke DEV-V-008-T013 / T014 / T016–T018 / T021 behaviors that touch the same modal.

**Expected**
- Behavior unchanged after extract to `admin-archetype-path-form.ts` + `admin-archetype-path-rows.tsx`.
- Tab still owns list chrome, modal shell, and save/delete orchestration.

**Rollback**
- Inline helpers/rows back into `AdminArchetypesTab.tsx`; delete the two extracted modules.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T024 — Admin Archetypes editor island parity (TASK-381 Phase 6b)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Admin codex |
| **Related task** | TASK-381 |
| **Where** | `/admin/codex` → Archetypes |
| **Needs** | Admin account |

**Steps**
1. Repeat DEV-V-008-T023 smoke (add/edit/duplicate; L1 skills ≤3; feat guidance groups; qty rows; recommended abilities).
2. Confirm modal footer still owns Cancel / Save / Delete (editor is body-only).
3. Optional: re-smoke T013 / T014 / T016–T018 / T021 on the same modal.

**Expected**
- Behavior unchanged after modal body move to `admin-archetype-editor.tsx`.
- Tab keeps list chrome, modal shell/footer, option memos, save/delete.

**Rollback**
- Inline modal body back into `AdminArchetypesTab.tsx`; delete `admin-archetype-editor.tsx`.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-008-T025 — Admin Archetypes workspace hook parity (TASK-381 Phase 6c)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Admin codex |
| **Related task** | TASK-381 |
| **Where** | `/admin/codex` → Archetypes |
| **Needs** | Admin account |

**Steps**
1. Repeat DEV-V-008-T023 / T024 smoke (add/edit/duplicate; L1 skills/feats/qty/abilities; Save round-trip).
2. Confirm list inline delete Yes/No and modal Delete confirm still work.
3. Optional: re-smoke T013 / T014 / T016–T018 / T021.

**Expected**
- Behavior unchanged after state/options/save move to `use-admin-archetype-workspace.ts`.
- Tab is list + Modal shell only; editor props come from the workspace return.

**Rollback**
- Inline workspace body back into `AdminArchetypesTab.tsx`; delete `use-admin-archetype-workspace.ts`.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-008-T026 — Path guidance and Codex Archetypes resolve names (TASK-732)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-008 — Archetype path completion |
| **Section** | Sheet + public codex |
| **Related task** | TASK-732 |
| **Where** | `/characters/[id]` path guidance / level-up; `/codex` → **Archetypes** |
| **Needs** | Path character with level-up recommendations; at least one visible path in Codex |

**Steps**
1. Open a path character sheet (and level-up if the target level has recommended feats/skills/armaments). Confirm guidance lists **names**, not raw ids. Quantity suffixes still show as `Name ×N`.
2. Codex → Archetypes → expand a path. Level 1 and progression summaries use names (feats, skills, powers/techniques, armaments/equipment).

**Expected**
- Lookups match id and `docId` (case-insensitive); name fallback still works for name-keyed path refs.
- Unmatched refs may still show the stored id string; matched library/codex rows show names.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-009 — Character sheet refactor (TASK-317, TASK-348, TASK-365, TASK-375, TASK-483, TASK-485, TASK-486, TASK-502, TASK-478)

Manual QA for library/feats modularization and shared part display. **Needs:** character with powers, techniques, equipment, and feats. TASK-611 smoke: T002 / T011 / T013 / T031 (+ creature Library / `CreatureStatBlock` nested lists) after shared hot-module co-located splits.

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
| **Steps** | 1. Open add modal for each type. 2. Toggle My Library / Realms Library source. 3. For powers, switch Powers vs Empowered mode. 4. Select item(s) and confirm Add Selected. 5. For Equipment: confirm owned gear still appears (stackable) and Add Selected / custom add updates the Inventory list. |
| **Expected** | Modal loads items, filters/sorts work, selection adds to sheet; powers/weapons/armor/shields hide already-owned ids of that type only; equipment remains selectable when already owned (quantity merges); empowered powers use separate columns when in empowered mode. |
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

#### DEV-V-009-T011 — Powers/Techniques Energy header + spend button only

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-502, TASK-513 |
| **Where** | `/characters/[id]` → Library → Powers and Techniques (desktop) |
| **Steps** | 1. Open Techniques with at least one technique that has an energy cost. 2. Confirm list headers are **Name \| Action \| Attack** plus a far-right **Energy** header over the spend buttons (no separate static Energy *value* column in the middle; no collapsed **TP** column — TP may still appear on expanded part chips). 3. Confirm each paid technique shows a single far-right spend button labeled with the cost number (RollButton style), and no duplicate static energy number in the data columns. 4. Click the spend button; confirm current Energy decreases by that cost. 5. Open Powers; confirm the same pattern (Energy header over rightSlot spend buttons only). 6. Optional: open a campaign member character view; confirm energy costs still appear as disabled far-right buttons under Energy (not a static mid-row Energy column, and not clickable no-op spend). |
| **Expected** | Energy cost appears only as the far-right spend control under an **Energy** ListHeader label; no duplicate static Energy data column beside it. View-only campaign sheet uses the same rightSlot chrome disabled. Creature/library browse lists that lack spend buttons may still show an Energy data column. Creator selected lists may keep an Energy column for budgeting (remove affordance only — not spend). |
| **Report** | DEV-V-009-T011: PASS / FAIL / SKIP — |

#### DEV-V-009-T012 — Sheet portrait expands in play; upload in edit

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-478 |
| **Where** | `/characters/[id]` (character with a portrait) |
| **Steps** | 1. Open sheet in normal (non-edit) view. 2. Click the portrait. 3. Confirm a preview modal opens with the enlarged portrait; close it. 4. Toggle edit mode. 5. Click the portrait. |
| **Expected** | Play view: click opens ExpandableImage preview (not navigation). Edit mode: click opens **Upload Character Portrait** crop modal instead of preview. |
| **Report** | DEV-V-009-T012: PASS / FAIL / SKIP — |

#### DEV-V-009-T013 — Library tab section collapse + add expands

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-510 |
| **Where** | `/characters/[id]` → Library → Feats, Powers (with innate energy), Inventory, Proficiencies, Notes |
| **Steps** | 1. Open Feats; confirm Traits / Archetype Feats / Character Feats each show title with a minimal inline chevron immediately to the right of the name (no circle/border chrome; + Add stays far right where applicable); empty sections start collapsed, sections with items start expanded. 2. Collapse a section; confirm list/empty text hides but header + chevron + Add remain. 3. Expand via title/chevron; collapse again. 4. With a section collapsed, click + Add and complete add; confirm that section expands after add. 5. Inventory: weapons/shields/armor/equipment sections behave the same. 6. Techniques tab: confirm no chevron (single section). 7. Notes: Appearance / Archetype / General / Custom Notes collapse; Custom Notes + expands after add note. 8. Proficiencies: Owned + Missing sections and owned category groups collapse. |
| **Expected** | Session-only collapse state; empty default closed, non-empty default open; content hidden when collapsed; add-via-+ expands target section; techniques single-section has no chevron; collapse chevrons match ListHeader/ExpandableChip minimal style (inline beside title, no surrounding circle). |
| **Report** | DEV-V-009-T013: PASS / FAIL / SKIP — |

#### DEV-V-009-T019 — Collapsed library sections stack tightly

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-526 |
| **Where** | `/characters/[id]` → Library → Inventory, Feats, Powers (with innate), Notes, Proficiencies |
| **Steps** | 1. Open Inventory; collapse Weapons, Shields, Armor, and Equipment. 2. Confirm the four headers stack with a modest gap (~8px) — not jammed, not a large leftover band under each closed header. 3. Expand one section; confirm list content appears under its header and neighboring collapsed headers keep that modest gap. 4. Repeat on Feats (collapse all subsections) and Notes (collapse Appearance / Archetype / General / Custom). 5. Optional: Powers with innate energy — collapse Innate Powers + Powers; same spacing. |
| **Expected** | Collapsed subsection headers stack with modest `space-y-2` breathing room; collapsing still reclaim vertical space vs old `space-y-6`; title/chevron and + keep ≥44px targets on touch (coarse pointer). |
| **Report** | DEV-V-009-T019: PASS / FAIL / SKIP — |

#### DEV-V-009-T020 — Inventory Currency / Armament Proficiency no overlap; solid tab summaries

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-537 |
| **Where** | `/characters/[id]` → Library → Inventory, Proficiencies, Notes (and Powers if innate energy > 0) |
| **Steps** | 1. Open Inventory at ~360px width. 2. Confirm Currency and Armament Proficiency (TP) do not overlap — they stack vertically on narrow viewports. 3. Confirm the Inventory summary bar uses a solid fill (no left-to-right gradient). 4. Open Proficiencies and Notes; confirm their top summary bars are solid fills (no gradient). 5. Optional ≥640px: Currency and Armament Proficiency sit on one row without overlap. |
| **Expected** | No overlapping labels/values on mobile; TabSummarySection variants use solid theme fills (`bg-*-light` / `bg-surface-alt`), not `bg-gradient-to-r`. |
| **Report** | DEV-V-009-T020: PASS / FAIL / SKIP — |

#### DEV-V-009-T018 — Library card title + subsection header size

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-525 |
| **Where** | `/characters/[id]` → Library panel (desktop grid next to Skills / Archetype) |
| **Steps** | 1. Open a character sheet at desktop width (≥1024px). 2. Confirm the Library card shows a **Library** title at the same size/weight as **Skills** and **Archetype & Attacks** (`text-lg font-bold`). 3. Open Powers (or Feats/Inventory); confirm subsection titles (e.g. Powers, Innate Powers, Weapons) use readable uppercase labels (`text-base` / `lg`, not `text-sm` or `text-xs`). 4. Confirm a small margin under each subsection title before list content / next header. 5. If a collapsible subsection has a chevron, confirm the title size matches non-collapsible peers (collapse control does not shrink the label). 6. Optional ~360px: Library title still readable above tabs. |
| **Expected** | Library card title matches peer sheet sections; Library list subsection headers are `lg` (`text-base`) with modest space below; SectionHeader default remains `md` elsewhere; size unchanged when collapsible. |
| **Report** | DEV-V-009-T018: PASS / FAIL / SKIP — |

#### DEV-V-009-T014 — Auto-proficiency over-cap toast (no render warning)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-508 |
| **Where** | `/characters/[id]` with proficiencies near/over TP budget |
| **Steps** | 1. Open sheet; open browser console. 2. Add or change equipment/powers so auto-proficiency sync would exceed TP (or use a character already over soft cap). 3. Confirm warning toast still appears when over limit. 4. Confirm no React warning: "Cannot update ToastProvider while rendering CharacterSheetPage". |
| **Expected** | Toast after commit only; no setState-during-render console error. |
| **Report** | DEV-V-009-T014: PASS / FAIL / SKIP — |

#### DEV-V-009-T015 — Single armor equip + create auto-equip (TASK-509)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-509 |
| **Where** | `/characters/[id]` Inventory; guided/advanced create |
| **Steps** | 1. On sheet, equip one armor via toggle; equip a second — first unequips. 2. Create a new character (guided or advanced); on sheet confirm weapons/shields/general gear equipped and exactly one armor (highest DR if multiple). 3. Reload an old save — equip flags unchanged unless user toggles. |
| **Expected** | At most one equipped armor; starter equip on create only; weapons/shields/gear equipped per applyStarterEquippedFlags. |
| **Report** | DEV-V-009-T015: PASS / FAIL / SKIP — |

#### DEV-V-009-T016 — Archetype armaments empty hide + milestone edit-only (TASK-511)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-511 |
| **Where** | `/characters/[id]` → Archetype |
| **Steps** | 1. Character with no equipped shields/armor — confirm Shields/Armor blocks not shown (no empty tables). 2. Equip shield/armor — tables appear with compact range where applicable. 3. Powered-Martial mixed archetype: milestone Innate/Feat toggles visible in section edit only; play view read-only. 4. Dark mode: milestone labels readable. |
| **Expected** | Empty quick-armament sections hidden; milestone controls gated to edit; unarmed row label/range polish intact. |
| **Report** | DEV-V-009-T016: PASS / FAIL / SKIP — |

#### DEV-V-009-T017 — Weapons Range/Attack/Damage column breathing room (TASK-523)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-523 |
| **Where** | `/characters/[id]` → Archetype → Weapons (desktop + ~360px) |
| **Needs** | Equipped weapon with **multiple** named properties (preferably at least one long property name) |
| **Steps** | 1. Open Weapons on desktop. 2. Confirm **Range**, **Attack**, and **Damage** are readable and not cramped, without the table overflowing the Archetype panel. 3. Confirm named properties remain one `• Property` per line under the weapon name; long property text truncates with ellipsis (not char-by-char wrap). 4. Confirm Unarmed Prowess (same table) still aligns under the same headers. 5. At ~360px, confirm `TableScroll` allows horizontal scroll without crushing Attack/Damage under wrong headers. |
| **Expected** | Metric columns use tight content-sized widths (fit roll buttons / range text); Name column truncates long names/properties; table stays inside the panel; Unarmed alignment preserved; no regression to roll buttons. |
| **Report** | DEV-V-009-T017: PASS / FAIL / SKIP — |

#### DEV-V-009-T021 — Mobile side-scroll panels centered with header gutters (TASK-538)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-538 / TASK-868 |
| **Where** | `/characters/[id]` at ~360px and ~700px width (below `md`) |
| **Steps** | 1. Open character sheet. 2. Compare left/right edges of the sheet header card vs the Abilities panel below — they should share the same horizontal gutters. 3. Swipe to Skills, Archetype, and Library; confirm each snapped panel keeps those gutters (not flush to the screen edge, not shifted left of the header). 4. While swiping between panels, confirm a clear gap/margin between adjacent section cards. |
| **Expected** | Side-scroll panels align with the header/PageContainer content width; gap between panels; snap stops do not shift content left of the header. Desktop `md+` grid unchanged. |
| **Report** | DEV-V-009-T021: PASS / FAIL / SKIP — |

#### DEV-V-009-T022 — Inventory Add equipment actually adds items (TASK-542)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-542 / TASK-815 |
| **Where** | `/characters/[id]` → Library → Inventory → Add equipment |
| **Needs** | Owned character; Codex equipment available (or use custom form) |
| **Steps** | 1. Open Add equipment. 2. Confirm Codex/library gear rows are listed (not an empty “already added” false empty). 3. Confirm the **Add custom** form (Name / Notes / Qty) is visible under Search without opening Filters. 4. Select one item with quantity ≥1 → Add Selected; confirm it appears under Equipment. 5. Add the same item again; confirm quantity stacks. 6. Add a custom item by name (and optional notes); confirm it appears and survives refresh. |
| **Expected** | Custom-add is always visible (not buried in Filters). Library and custom adds update the Equipment list immediately; stacking merges quantity; custom notes persist after save/reload. |
| **Report** | DEV-V-009-T022: PASS / FAIL / SKIP — |

#### DEV-V-009-T023 — Roll log bonus badge readable in dark mode (TASK-542)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-542 |
| **Where** | Character sheet → Roll log (personal or campaign) |
| **Needs** | Dark theme enabled; a roll with a non-zero bonus/modifier |
| **Steps** | 1. Switch to dark mode. 2. Make an ability/skill roll with a non-zero bonus (or custom roll with mod). 3. Inspect the second numeric chip in the roll row (the bonus value between dice and total). |
| **Expected** | Bonus chip uses dark-mode success/danger surface + border so the number stays readable (not light-on-light). |
| **Report** | DEV-V-009-T023: PASS / FAIL / SKIP — |


#### DEV-V-009-T024 — Skills edit Value stepper + fully visible (TASK-543 / TASK-800)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-543 (clip); TASK-800 (inline placement) |
| **Where** | `/characters/[id]` → Skills panel at desktop `lg+` (≥1024px) with edit mode on |
| **Steps** | 1. Open a character sheet at ≥1024px width (Skills in the left column of the three-panel grid). 2. Enter sheet edit mode and click the Skills pencil so Value steppers appear. 3. Confirm each skill row shows a full `−` value `+` control in the **Value** cell (same column as the bonus caption) — the `+` button is not clipped and does not require scrolling sideways to see. 4. Confirm there is no fifth Value column and no per-row **X**. 5. Optional ~360px: edit Skills; steppers stay in the Value cell (44px targets); no inner-table side-scroll needed to discover edit mode. |
| **Expected** | Steppers live in the Bonus/Value cell (`editControlsPlacement="inline"`); `+` is never cut off; mode is visible without horizontal scroll. |
| **Report** | DEV-V-009-T024: PASS / FAIL / SKIP — |

#### DEV-V-009-T025 — No duplicate traits / part chips / feat rows (TASK-546)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-546 |
| **Where** | `/characters/new/guided` finish → `/characters/[id]` Feats + Library Powers/Techniques; also Library / Official power expand |
| **Steps** | 1. Create a guided character with a species that has species traits + at least one ancestry trait. 2. Open Feats/Traits — each species trait and ancestry trait appears once (no double listing). 3. Open a power/technique with parts — each expandable part chip name appears once (no 2–3 identical chips). 4. Confirm archetype/character feats are not duplicated across sections. 5. Optional: re-save a power in Power Creator and confirm part chips stay unique. |
| **Expected** | Trait, feat, power/technique row, and part-chip lists have unique entries; species traits come from species codex, ancestry picks from `selectedTraits` only. |
| **Report** | DEV-V-009-T025: PASS / FAIL / SKIP — |

#### DEV-V-009-T026 — Ability and defense name tooltips (TASK-547)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-547 |
| **Where** | `/characters/[id]` → Abilities & Defenses section |
| **Steps** | 1. Open a character sheet. 2. Hover (desktop) or touch-hold ~400ms (mobile ~360px) the **Strength** ability name — confirm a tip opens with the Strength definition (no Info icon; tip is on the word). 3. Repeat for at least one other ability (e.g. **Charisma**). 4. Hover/touch-hold **Might** (or **Mental Fortitude**) in the defenses row — confirm the matching defense tip (e.g. Might mentions Strength; Mental Fortitude mentions Intelligence). 5. Confirm roll buttons and edit steppers still work (tip does not block play controls). 6. Keyboard: Tab to an ability name and confirm the tip opens on focus. |
| **Expected** | All six ability names and six defense names are word-tied help triggers; copy matches `tooltip-text.tsx` (`getAbilityHelp` / `getDefenseHelp`) without repeating the name (e.g. “Acuity reflects…”, “Might (Strength) resists…”); no separate Info icons beside the names. |
| **Report** | DEV-V-009-T026: PASS / FAIL / SKIP — |

#### DEV-V-009-T027 — Add Proficiency uses UnifiedSelectionModal (TASK-567)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-567 |
| **Where** | `/characters/[id]` → Library → Proficiencies → + Add (any owned category) |
| **Needs** | Owned character in edit mode; Codex parts/properties available |
| **Steps** | 1. Open Add Power Part (or Technique / Weapon-Shield / Armor property) proficiency. 2. Confirm Search + ListHeader + selectable rows match other add-X modals (USM chrome; Cancel / Add Proficiency sticky in footer). 3. Select a row; set option levels in the footer panel; confirm Total TP updates. 4. Add Proficiency — row appears under Owned; modal closes. 5. Reopen the same Add variant — selection and option levels are empty (fresh mount). 6. Optional ~360px: footer actions stay pinned without scrolling the list. |
| **Expected** | No parallel hand-rolled list shell; single-select + option levels via USM `footerExtra`; overspend still allowed when Total TP > 0; remount clears abandoned UI state (same as DEV-V-019-T007 step 4). |
| **Report** | DEV-V-009-T027: PASS / FAIL / SKIP — |

#### DEV-V-009-T028 — Abilities and Defenses name size parity (TASK-582)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-582 |
| **Where** | `/characters/[id]` → Abilities & Defenses (desktop) |
| **Steps** | 1. Open a character sheet at desktop width. 2. Compare ability names (STRENGTH…CHARISMA) to defense names (MIGHT…RESOLVE) — same label size (`text-sm`, like Speed/Evasion). 3. Confirm ability tiles are compact (label glued to `md` roll chip; no tall empty card). 4. Confirm defense tiles show a large Score with a smaller roll chip under it (content packed to the top; tiles in a row share height). 5. Optional ~360px: 2-col grid; **Intelligence** / **Discernment** / **Mental Fortitude** stay inside their tiles (wrap, never mid-glyph clip). |
| **Expected** | Matching labels; dense header-stat density; Score is defense glance primary; no large empty band in ability tiles. |
| **Report** | DEV-V-009-T028: PASS / FAIL / SKIP — |

#### DEV-V-009-T029 — Roll log die face badges readable in dark mode (TASK-582)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-582 |
| **Where** | Character sheet → Roll log (dark theme) |
| **Needs** | Dark theme; rolls that hit die max and die min (or crit / crit-fail totals) |
| **Steps** | 1. Switch to dark mode. 2. Roll until a die shows max (e.g. 8 on d8) and min (e.g. 1). 3. Inspect die-face chips and any crit/crit-fail total chip. |
| **Expected** | Max/min die chips and crit totals use dark-mode success/danger surfaces + `*-fg` text (readable; not pale wash + washed text). Bonus chip remains readable (DEV-V-009-T023). |
| **Report** | DEV-V-009-T029: PASS / FAIL / SKIP — |

#### DEV-V-009-T030 — Edit pencil compact on desktop (TASK-582)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-582 |
| **Where** | `/characters/[id]` → Edit mode → Abilities / Skills pencils (desktop `md+`) |
| **Steps** | 1. Enter sheet edit mode at ≥768px. 2. Inspect Abilities and Skills pencil icons. 3. Confirm the control hugs the icon (no large empty button chrome). 4. Optional below `md`: confirm tap target is still comfortable (~44px). |
| **Expected** | Desktop pencils are icon-dense; coarse-pointer tap uses Dense expanded hit (`.hit-area-dense-square`), not a 44px painted slab. |
| **Report** | DEV-V-009-T030: PASS / FAIL / SKIP — |

#### DEV-V-009-T031 — Parts/Properties & Proficiencies default collapsed + InfoTippy (TASK-583)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-583 |
| **Where** | `/characters/[id]` → Library (Powers / Techniques / Weapons); also Library page or Add Power modal |
| **Steps** | 1. Sheet Library: expand a power (or technique) with parts — **Parts & Proficiencies** starts collapsed; chevron opens/closes; **i** tip uses power vs technique wording. 2. Expand a weapon/armor/shield — **Properties & Proficiencies** collapse + wield/wear tip. 3. My Library Powers / Techniques / Armaments (and Realms Official lists): same collapse + family tip (not generic “Power or Technique” on a pure power row). 4. Confirm descriptor chips outside those sections stay visible when the row is expanded. 5. Optional ~360px: tip via touch-hold (`size="inline"`). |
| **Expected** | Parts/Properties default collapsed sitewide via `MetadataDetailSection` + GridListRow; family tips from `tooltip-text`; descriptor sections not collapsed. |
| **Report** | DEV-V-009-T031: PASS / FAIL / SKIP — |

#### DEV-V-009-T032 — Skills catalog list + filters + − removes (TASK-584 / TASK-778)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-584 / TASK-778 |
| **Where** | `/characters/[id]` → Skills section (edit mode) |
| **Needs** | Editable character; Codex skills loaded |
| **Steps** | 1. Open Skills (play view) — confirm every Codex **base** skill appears (not only previously added). 2. Toggle **Proficient** filter — only proficient rows remain; **All** restores full catalog. All/Proficient is compact (lighter than Library SourceFilter; not a Filters panel). 3. Uncheck **Sub-Skills** — sub-skill rows hide; re-check — proficient subs return; unproficient subs only if previously added via Add Sub-Skill. 4. Enter **Edit** (toolbar pencil): top-right **pencil** is present and spend is closed; click it — **Editing** appears next to Skills, Skill Points pill + **Sub-Skill** appear; no Temp sliders; no **Add Skill** button; pill matches guided inline PointStatus size (`text-base`, TASK-706). 5. No per-row **X**. Value steppers sit in the Value cell with the bonus caption under them (not a fifth column). On a base skill: **+** gains proficiency (value 0), further **+** raises value; **−** lowers value then clears proficiency (row stays in catalog). 6. Add a sub-skill, gain proficiency, then **−** until proficiency clears, then **−** again — sub-skill leaves the list. 7. Optional ~360px: filters usable (44px targets); Value stepper visible in the Value cell without side-scroll. Desktop: All/Proficient + Sub-Skills stay text-hugging (not 44px). |
| **Expected** | Catalog-all base skills; filters as above; − path replaces remove-X; header chrome uncramped; species skills still locked. |
| **Report** | DEV-V-009-T032: PASS / FAIL / SKIP — |

#### DEV-V-009-T033 — Temp Modifier exclusive mode + persistence (TASK-585 / TASK-586 / TASK-782)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-585 (contract); TASK-586 (surfaces); TASK-782 (sheet-level exclusive modes) |
| **Where** | `/characters/[id]` → toolbar Edit vs Temp Modifier; Abilities, Skills, header LargeStatBlocks |
| **Needs** | Character you can edit and save |
| **Steps** | 1. Play view: no spend steppers and no Temp steppers; existing temp tints still show. 2. Tap toolbar **Temp Modifier** — do **not** enter Edit first. Confirm Edit closes if it was open. Header Speed/Evasion/DR/crit + Terminal show a sliders icon each (blue if no delta) — steppers stay closed until that icon is tapped. DR and Critical Range appear in Temp even when armor does not grant them. Abilities/Skills show a top-right sliders icon, not open steppers. No spend pencils. 3. Open Speed sliders, set a positive Temp — value and icon tint gold; roll chip stays untinted. 4. Set a negative Temp — value and icon tint danger. 5. Tap toolbar **Edit** — Temp icons/steppers disappear. Abilities/Skills show a top-right **pencil** (not already in spend); click it to open spend. 6. Refresh / reopen — deltas persist. 7. In Temp mode (section open): ability temps cascade but do **not** change max Health/Energy/TP unless the resource-maxima toggle is on. 8. Campaign / other-user: View only — no Edit and no Temp FAB. |
| **Expected** | ADR-0006 (Amended): persist `tempModifiers`; play / edit / temp exclusive; value tint not roll tint; cascade gate default off; level-up still opens Edit. |
| **Report** | DEV-V-009-T033: PASS / FAIL / SKIP — |

#### DEV-V-009-T034 — Temp Modifier on v1 sheet surfaces (TASK-586)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-586 |
| **Where** | `/characters/[id]` → Temp Modifier mode → header (Speed/Evasion/DR/crit + Health `Terminal: X`), Abilities (+ defenses), Skills; optional campaign view |
| **Needs** | Editable character |
| **Steps** | 1. Enter **Temp Modifier** from the toolbar (not Edit). 2. Header: Speed, Evasion, **Damage Reduction**, and **Critical Range** each show a sliders icon (even unarmored / armor that does not grant DR or crit). Tap to open that stat only; set values — icons tint; no pencil / base edit. Unarmored Critical Range shows Evasion + 10 (+ temp). Health `Terminal: X` — tap its sliders, adjust ±. Leave Temp: DR/crit hide again unless armor (or a leftover temp) modifies that stat. 3. Abilities: tap the section sliders to open temp steppers + resource-maxima toggle (default off). 4. Leave Temp, enter **Edit**: tap the Skills **pencil** to open spend (not auto-open); cannot overspend; Value steppers in the Value cell (no Temp chrome). Re-enter Temp: tap Skills sliders — **Temp** heading + strip; Temp steppers in the same cell (no fifth column). 5. Refresh + campaign view — temps persist and tint; campaign has no Temp chrome. 6. Mobile (~360px): Terminal temp controls fit; toolbar Temp FAB is 44px. |
| **Expected** | All v1 surfaces support Temp Modifier with tint + persistence; ability cascade + HP/EN/TP toggle per ADR-0006; Edit spend locks on Abilities/Skills prevent intentional overspend; Speed/Evasion have no permanent-base pencil. |
| **Report** | DEV-V-009-T034: PASS / FAIL / SKIP — |

#### DEV-V-009-T035 — Defense Score hover tip (TASK-587)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-587 |
| **Where** | `/characters/[id]` → Abilities & Defenses → Defenses row |
| **Steps** | 1. Open a character sheet. 2. Hover (desktop) or touch-hold ~400ms (mobile ~360px) the large Score number under **Might** — confirm a tip opens explaining Defense Score (10 + Defense Bonus / Bonus + 10 passive target). 3. Repeat for at least one other defense (e.g. **Resolve**). 4. Confirm the defense **name** tip still uses `getDefenseHelp` (different copy). 5. Confirm roll chips still work. 6. Keyboard: Tab to a Score value — tip opens on focus; accessible name still includes the defense and Score number (not only “About Defense Score”). |
| **Expected** | All six Score values share `defenseScoreHelp` from `tooltip-text.tsx` via `WordHelpTip`; tip does not replace name tips or roll controls; AT hears e.g. “Might Defense Score 14”. |
| **Report** | DEV-V-009-T035: PASS / FAIL / SKIP — |

#### DEV-V-009-T037 — Edit Species uses Advanced TraitSection (TASK-594)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Section** | Edit species / ancestry |
| **Related task** | TASK-594 |
| **Where** | Character sheet → edit mode → Change species |
| **Needs** | Saved character; species with ancestry traits (and ideally a choice-trait species trait) |

**Steps**
1. Enable edit mode; open **Change species**.
2. Confirm species grid uses SelectionCard / SelectionCardSurface chrome (not plain dashed/border buttons).
3. Pick a single species → **Next: Ancestry**.
4. Confirm ancestry/characteristic/flaw sections use the Advanced TraitSection chrome (section header + SelectionToggle / choice list picker), not chip-only toggles.
5. Complete required picks and **Save species & ancestry** — skills migrate for the new species; modal closes.
6. Optional: Mixed species — size select, one species trait per parent, choose-2 skills, flaw scoped by parent species; save succeeds.
7. Mobile (&lt;768px): modal is full-screen; content scrolls (sticky header/footer if present); no stuck `max-h` viewport clip.

**Expected**
- Species pick uses SelectionCard chrome; ancestry chrome matches Advanced TraitSection.
- Skill migration still runs on save; mixed flaw → extra ancestry trait from flaw species only.
- Mobile fullScreenOnMobile scroll remains usable.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-009-T036 — Inventory Armament Proficiency tip (TASK-581)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-581 |
| **Where** | `/characters/[id]` → Library → Inventory |
| **Steps** | 1. Open Inventory on a character with Martial Proficiency set (Armament Proficiency shown). 2. Hover/focus the **i** beside the Armament Proficiency label. 3. Confirm tip explains the TP ceiling for weapons/armor (same copy as Path More details Weapons and Armor tip). 4. Optional ~360px: tip usable via touch-hold (`size="inline"`). |
| **Expected** | Shared `armamentProficiencyHelp` from `tooltip-text.tsx`; no duplicate tip string; tip does not replace the numeric value. |
| **Report** | DEV-V-009-T036: PASS / FAIL / SKIP — |

#### DEV-V-009-T038 — Speed/Evasion Temp Modifier only (TASK-600)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-600 |
| **Where** | `/characters/[id]` → Temp Modifier mode → header Speed / Evasion |
| **Needs** | Editable character |
| **Steps** | 1. Enter **Edit** — Speed/Evasion have no pencil and no temp sliders. Abilities/Skills show a top-right pencil; spend is closed until clicked. 2. Enter **Temp Modifier**. Speed/Evasion show a sliders icon (not already-open steppers) — no pencil / “Base:” stepper. 3. Open Speed sliders, adjust +/− — value and icon tint. 4. Repeat for Evasion. 5. Abilities/Skills show a sliders icon only (no spend pencils or dual pairs); tap to open that section. |
| **Expected** | Speed/Evasion are Temp-only; rules `speedBase`/`evasionBase` are not editable from the sheet header; Edit and Temp never share chrome. |
| **Report** | DEV-V-009-T038: PASS / FAIL / SKIP — |

#### DEV-V-009-T039 — Recovery modal SegmentedControl (TASK-602)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-602 |
| **Where** | `/characters/[id]` → toolbar **Recovery** |
| **Needs** | Character with HP and/or Energy below max (optional: limited-use feats/traits) |
| **Steps** | 1. Open **Recovery**. 2. Confirm Full / Partial is a shared `SegmentedControl` (pill track), not hand-rolled bordered buttons. 3. Switch to **Partial Recovery** — duration **2 / 4 / 6 hours** and **Automatic / Manual** are also SegmentedControls; Manual shows the HP/EN slider. 4. Confirm preview shows Health/Energy deltas; Confirm CTA still reads **Full Recovery** or **Recover (Nh)** and sits in the sticky Modal footer (Cancel alongside), with the same inset from the modal edge as the title/content (not flush to the bottom-right corner). 5. Optional ~360px: modal is full-screen; footer stays visible without scrolling; segments remain ≥44px touch targets. |
| **Expected** | Three choice groups use SegmentedControl; recovery math unchanged; no parallel pill chrome; Cancel/confirm via Modal `footer` + `flexLayout` with inset from the modal edge (not flush to the corner); preview uses warning semantic surface (`warning-fg` / status panel), not numbered `warning-*` + `dark:` pairs on the choice clusters. |
| **Report** | DEV-V-009-T039: PASS / FAIL / SKIP — |

#### DEV-V-009-T040 — Sheet modals + Library from context (TASK-667)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-667 |
| **Where** | `/characters/[id]` (edit mode) |
| **Needs** | Editable character with library items / feats |
| **Steps** | 1. Open Recovery → Full + Partial. 2. Level Up → confirm. 3. Library → Add power/technique/weapon/equipment. 4. Feats → Add archetype + character feat; remove one. 5. Edit Archetype + Edit Species save. 6. Reload; confirm library lists + notes still match. |
| **Expected** | All sheet modals open/save via context (no blank/error). Library tabs still add/remove/equip; campaign RM view remains read-only. |
| **Report** | DEV-V-009-T040: PASS / FAIL / SKIP — |

#### DEV-V-009-T041 — Sheet innate help distinguishes Threshold from pool (TASK-733)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-733 |
| **Where** | `/characters/[id]` → Library → Powers (character with Innate Energy) |
| **Needs** | Character with Innate Pools, Innate Threshold, and at least one innate power |
| **Steps** | 1. Open the Powers tab on desktop and at ~360px. 2. Focus/click the `(i)` beside **Innate Energy**; confirm it explains the total pool as Pools × Threshold. 3. Focus/click the `(i)` beside **Innate Powers**; confirm it says each power is capped by Innate Threshold and its Energy counts against the pool. 4. Collapse and expand Innate Powers; confirm the title/chevron still toggles while the `(i)` opens help. |
| **Expected** | Both icon-only help triggers have accessible names and show the same global rules copy as the creator. The stale “energy costs up to your innate energy” blurb is absent, so the per-power Threshold cap is not confused with the total Innate Energy pool. Heading order and compact desktop/mobile layout remain intact. |
| **Report** | DEV-V-009-T041: PASS / FAIL / SKIP — |

#### DEV-V-009-T042 — Sheet autosave survives re-renders and failed saves (TASK-736)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-736 |
| **Where** | `/characters/[id]` (edit mode) |
| **Needs** | Editable owned character; optional: throttle network in DevTools |

**Steps**
1. Edit a note (or name) and wait ~2s without further typing — confirm the save toast / dirty indicator clears (debounce still fires even if the sheet re-renders from queries).
2. Offline or block `/api/characters/*` PATCH, edit again — confirm an error toast; wait and restore network — a retry should persist without requiring another keystroke.
3. Optional: edit, then switch away from the tab (hide) — returning should not lose the edit.

**Expected**
- Autosave is not starved by re-renders. Failed saves retry. Hiding the tab flushes a dirty save.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T043 — Dirty-key PATCH keeps other-tab edits; stale lock 409s (TASK-741)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Task** | TASK-741 |
| **Where** | `/characters/[id]` (edit mode); two tabs or Network panel |
| **Needs** | Editable owned character |

**Steps**
1. Open the same character in two tabs. In tab A change a note (or add an inventory item) and wait for autosave. In tab B change current HP and wait. Reload both — notes/inventory **and** HP should both persist (not last-tab-wins the whole sheet).
2. Optional: in DevTools, PATCH a stale `updatedAt` (copy an old token) — the response is **409**; the next autosave after a refresh still works.
3. Settings visibility / speed-unit save still persists without wiping notes.

**Expected**
- Concurrent edits to different fields both survive. A stale write does not silently restore an old full character.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T044 — Sheet realtime shows other-tab non-resource edits (TASK-747)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-747 |
| **Where** | `/characters/[id]` (edit mode); two tabs |
| **Needs** | Editable owned character |
| **CI** | Partial — `realtime-merge.test.ts` (remote non-resource apply; dirty notes kept; HP suppress; adopted keys not dirty) |

**Steps**
1. Open the same character in two tabs. In tab A change **notes** (or add an inventory item) and **do not wait** for autosave — keep typing or leave the field dirty.
2. In tab B change **feats** or **level** (or add a different inventory item) and wait for autosave.
3. Without reloading tab A, confirm tab A shows tab B's feats/inventory/level **and** still shows tab A's unsaved notes.
4. Repeat with tab A editing current HP: tab B's notes should still appear in tab A during the HP echo window. Reload both when done.

**Expected**
- Untouched keys from the other tab appear in this tab without a reload.
- Local dirty keys are not overwritten. HP/EN/AP echo suppression still applies.
- Tab A does not look unsaved for tab B's keys alone (adopted keys are not a second autosave PATCH).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T045 — Sheet document shares useCharacter cache (TASK-750)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-750 |
| **Where** | `/characters/[id]` (edit mode) + Library add-to-character |
| **Needs** | Editable owned character; a Library power/technique/weapon not already on the sheet |
| **CI** | Partial — `use-characters.cache.test.ts` (setCharacter-shaped cache update; merge dirty keys; no-op when empty) |

**Steps**
1. Open the character sheet. Change **notes** (or the name) and wait for autosave.
2. In the **same tab**, go to Library Powers (or Weapons), select that character, and **Add to character** an item the sheet does not already have. Confirm the add toast.
3. Navigate back to the sheet (no full reload). Confirm the new row is present **and** the notes/name from step 1 are still there.
4. Reload the sheet — notes/name **and** the added item both persist. Optional: start editing notes (leave dirty), alt-tab away and back — notes must not revert to the last GET.

**Expected**
- Sheet load is `useCharacter` (no parallel getCharacter effect). Library add (`useSaveCharacter`) and sheet edits share `characterKeys.detail` **in this tab**.
- Adding from Library does not wipe sheet fields. Focus-switching a dirty sheet does not revert notes.
- Two-tab live appearance of the other tab’s edits is **DEV-V-009-T044** (realtime), not this test.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-009-T046 — Campaign RM character view loads via React Query (TASK-761)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-761 |
| **Where** | `/campaigns/[id]/view/[userId]/[characterId]` (Realm Master account) |
| **Needs** | Campaign you own with another player's non-private character on the roster; a second character on the roster helps step 3 |
| **CI** | Partial — `use-campaigns.cache.test.ts` (campaign + viewer scoped key; `libraryForView` split off the character payload) |

**Steps**
1. As the Realm Master, open the campaign, click a player character, and confirm the read-only sheet renders (header stats, Library tabs, roll log) with the loading spinner appearing only once.
2. Switch the Library tab (e.g. Feats → Powers), navigate **Back to Campaign**, then reopen the same character. The sheet renders from cache with no spinner flash; the Library tab resets to the default (local UI state).
3. Open a second roster character, then return to the first — each shows its own sheet, never the other's data.
4. Sign out and sign in as a **player** in that campaign, then hit the same view URL directly. Expect the "Only the Realm Master can view player character sheets" error card (no cached sheet from the RM session).
5. Open a roster character whose visibility is **private** (or a bad `characterId`) and confirm the error card plus the Back to Campaign link.

**Expected**
- View load is `useCampaignCharacterView` / `campaignKeys.characterView` against the campaign route — no `useState` + `apiFetch` effect and no read of `/api/characters/[id]`.
- RM authorization, roster membership, private-visibility blocks and `libraryForView` enrichment behave exactly as before.
- Cached sheets are scoped per campaign, per viewer and per character; a viewer change never shows another account's cached sheet.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-009-T047 — RM / other-user sheet uses referenced enrichment (TASK-773)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-773 |
| **Where** | `/campaigns/[id]/view/[userId]/[characterId]` (Realm Master) and `/characters/[id]` as another user (public or shared-campaign visibility) |
| **Needs** | Campaign you own with another player's non-private character that has library powers/techniques/feats (and ideally an empowered technique). A second account to open the public/campaign sheet. Network tab (or React Query Devtools). |
| **CI** | Partial — `character-view-enrichment.test.ts`, `character-view-enrichment-server.test.ts`, `src/app/api/characters/[id]/route.test.ts` (owner GET omits enrichment; other-user GET includes it; referenced-id gate) |

**Steps**
1. As Realm Master, open a roster player's sheet. Confirm header stats, Library tabs (powers/techniques/feats/species traits), and empowered techniques render — not empty rows for ids the character actually has.
2. In the Network tab, confirm the full campaign character GET returns `libraryForView` and `enrichment`, and that the page does **not** fire `/api/user/library/*` or `/api/official/*` for the viewer's catalogs. (`/api/codex?collection=coreRules` may still run once via `useGameRules` — TASK-775.)
3. Open **Add to encounter** (or combat add) so `?scope=encounter` runs. Payload stays HP/EN/AP only — no `libraryForView`, no `enrichment`.
4. Sign in as that player (owner) and open `/characters/[id]`. Confirm Add Power / Add Feat still have full catalogs (owner GET has no `enrichment`).
5. As a non-owner, open a **public** character URL. Sheet rows resolve; Network shows `enrichment` on GET `/api/characters/[id]` and no viewer-library waterfall.

**Expected**
- Read-only views resolve from referenced owner/official/codex rows on the GET (same P0-1 gate as `libraryForView`). The viewer's private library is not downloaded.
- Owner sheet still uses catalog hooks for add-X.
- Encounter-scope GET is unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-009-T048 — Sheet feat rank via expanded Feat Levels chips (TASK-780)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-780 |
| **Where** | `/characters/[id]` → Feats (character with a multi-rank archetype or character feat) |
| **Needs** | Edit access; a feat family with at least two ranks; one higher rank the character does not yet qualify for if possible |

**Steps**
1. Play view: expand the feat. Confirm **Feat Levels** chips include the current rank (marked) and other ranks; collapsed row has **no Lvl column** or quantity stepper beside Uses/Recovery.
2. Enter sheet edit. Expand the same feat. Confirm there is still no collapsed Lvl stepper. Current rank chip is marked (`aria-current`); a qualified other rank is a clickable Feat Levels chip (same `GridListChip` path as play); an unqualified rank is disabled (not ±).
3. Click a qualified higher or lower rank. Confirm the row swaps to that family rank, feat-point slot count updates, and Uses/Recovery still track uses (not rank).
4. Optional ~360px: Feat Levels chips wrap; Uses ± still distinct from rank chips.

**Expected**
- Rank change uses the existing family replace (`onFeatLevelChange`); play view has no rank picker.
- Creature creator Lvl stepper is unchanged (out of scope).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-009-T048 — Sheet feat rank via expanded Feat Levels chips (TASK-780)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-780 |
| **Where** | `/characters/[id]` → Feats (character with a multi-rank archetype or character feat) |
| **Needs** | Edit access; a feat family with at least two ranks; one higher rank the character does not yet qualify for if possible |

**Steps**
1. Play view: expand the feat. Confirm **Feat Levels** chips include the current rank (marked) and other ranks; collapsed row has **no Lvl column** or quantity stepper beside Uses/Recovery.
2. Enter sheet edit. Expand the same feat. Confirm there is still no collapsed Lvl stepper. Current rank chip is marked (`aria-current`); a qualified other rank is a clickable Feat Levels chip (same `GridListChip` path as play); an unqualified rank is disabled (not ±).
3. Click a qualified higher or lower rank. Confirm the row swaps to that family rank, feat-point slot count updates, and Uses/Recovery still track uses (not rank).
4. Optional ~360px: Feat Levels chips wrap; Uses ± still distinct from rank chips.

**Expected**
- Rank change uses the existing family replace (`onFeatLevelChange`); play view has no rank picker.
- Creature creator Lvl stepper is unchanged (out of scope).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T049 — Sheet autosave does not 409 on same-tab edits (TASK-786)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-786 |
| **Where** | `/characters/[id]` (edit mode); Network panel |
| **Needs** | Editable owned character |
| **CI** | Partial — `save-lock.test.ts`, `character-resource-sync.test.ts`, `character-service.save-lock.test.ts` |

**Steps**
1. Open the sheet. Change **notes** (or name) and keep typing for a few seconds. Confirm autosave succeeds — Network may show a 409 only if another tab wrote; a same-tab notes edit should be **PATCH 200** (no 409 → GET → retry loop).
2. Change current **HP** (or EN/AP), then quickly change notes. Both persist after reload. Network: HP may use the fast resource PATCH; notes autosave should still succeed (retry is OK; a toast **Failed to save character** is a fail).
3. Optional: two tabs still behave as **T043** (different-field edits both survive; a truly stale lock is 409).

**Expected**
- Editing notes does not fire a resource-only PATCH.
- Same-tab overlapping saves do not leave the sheet stuck unsaved or toasting on every debounce.
- Other-tab dirty-key lock (T043) is unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-009-T050 — Sheet trait kind chip expanded-only (TASK-779)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-779 |
| **Where** | `/characters/[id]` → Library → Feats |
| **Needs** | Character with at least one Ancestry, Characteristic, or Flaw trait (species trait optional); a state feat if possible |
| **CI** | Partial — `library-feat-rows.test.ts` |

**Steps**
1. Play view, Feats list collapsed: Ancestry / Characteristic / Flaw rows show the trait name only — no kind chip beside the name.
2. Expand one of those rows. Confirm a single **DescriptorChip** for the kind (Ancestry, Characteristic, or Flaw) in the expanded body — not an ExpandableChip (no chevron / no expand-in-place).
3. If the character has a species trait: collapsed and expanded show **no** Species kind chip.
4. If a state feat is present: collapsed row still shows the **Archetype** or **Character** badge on the name.
5. Optional ~360px: kind chip appears only after expand; name stays readable.

**Expected**
- Kind is expanded-only for traits; compact GLR name badges on state feats are unchanged.
- Codex / Library path-filter name chips (`showBadgesInName`) are out of scope and unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-009-T051 — Sheet customized feat play-view note + italic name (TASK-783)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-783 |
| **Where** | `/characters/[id]` → Library → Feats |
| **Needs** | Character with a feat or trait that has a custom name and a player note (edit the sheet, Customize, save) |
| **CI** | Partial — `library-feat-rows.test.ts` |

**Steps**
1. Play view, collapsed: custom name is italic and the right edge of the last letter is not clipped. Official/codex name is not shown as a second title.
2. Expand the row. Confirm there is **no** View/Hide customization button, **no** Custom name field, and **no** “Note” heading.
3. Confirm the player note sits **in the same rounded description box** as the official description, below it, separated by a simple line only — not a second card. The custom name is not repeated in the body.
4. Toggle sheet Edit. Expand the same row. Confirm **Customize** still reveals Custom name + Player note fields; changing them still saves.
5. Repeat on a trait if one is customized. Optional ~360px: italic name and in-box note still readable.

**Expected**
- Play view is description + note in one box; italic title only. Edit keeps Customize fields. Trait kind chips (TASK-779) unchanged. Do not use archived DEV-V-010.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-009-T052 — Recovery (and Modal) footer inset (TASK-787)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-787 |
| **Where** | `/characters/[id]` → toolbar **Recovery**; spot-check Edit Archetype / a USM add modal |
| **Needs** | Any character |
| **CI** | None (visual) |

**Steps**
1. Open **Recovery**. Confirm Cancel and Full Recovery sit inset from the bottom and right edges — similar gutter to the title card and content, not hugging the modal chrome.
2. Optional ~360px: full-screen Recovery; footer stays visible; inset still present (safe-area on notched phones).
3. Spot-check Edit Archetype Close/Save and one add-X USM: footers keep a gutter (USM still has its top border; no doubled padding).

**Expected**
- Modal `footer` owns the inset. Recovery buttons are not flush to the corner. USM/detail modals are not double-padded.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-009-T053 — Header DR / Critical Range only when armor modifies (TASK-788)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-788 |
| **Where** | `/characters/[id]` header vitals (Speed / Evasion row) |
| **Needs** | Unarmored character; armor with DR; armor with Critical Range +1 (Option 1 level ≥ 0) |
| **CI** | Partial — `library-list-helpers.test.ts`, `calculations.test.ts`, `item-calc.test.ts` |

**Steps**
1. Unarmored: header shows Speed and Evasion only — no Damage Reduction, no Critical Range.
2. Equip armor with DR and no crit property: Damage Reduction appears and matches the Library armor DR cell; Critical Range stays hidden.
3. Equip (or switch to) armor with Critical Range +1 at Option 1 level N: Critical Range appears as **Evasion + 10 + (1 + N)**. If that armor has no DR, Damage Reduction is hidden.
4. Optional Temp mode: **Damage Reduction** and **Critical Range** cards appear even if armor does not grant them (so a temp can be added). Unarmored Critical Range = Evasion + 10. Leave Temp: cards hide again unless armor (or a leftover temp) modifies that stat. Speed/Evasion/Terminal unchanged.

**Expected**
- Independent visibility per stat in play/edit. Temp mode always shows both DR and Critical Range cards. Crit math is Evasion + 10 + armor increase (1 + op_1_lvl). Same as DEV-V-008-T015.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T054 — Skills spend/temp mode visible without side-scroll (TASK-800)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-800 |
| **Where** | `/characters/[id]` → Skills panel |
| **Needs** | Editable character; Codex skills loaded |

**Steps**
1. Desktop `lg+` (≥1024px): enter **Edit**, click the Skills pencil. Confirm **Editing** next to the Skills heading, Skill Points strip, and Value steppers in the last column (bonus caption under each stepper). No fifth column; no horizontal scroll required to see that the section is open.
2. Close the pencil. **Editing** and steppers disappear; Bonus + roll return.
3. Enter **Temp Modifier**, click the Skills sliders. Confirm **Temp** next to the heading, the Temp Modifier strip (same family as Abilities), and Temp steppers in that same last column. Bonus caption still shows and tints.
4. Optional ~360px: same cues; steppers use 44px targets; no inner-table side-scroll to discover mode.

**Expected**
- Mode is named on the heading (`aria-live`) and visible in the first screenful of the Skills card.
- Creator/allocation Skills tables still use a separate Value column.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T055 — Skills show Codex names + hover description after species change (TASK-803)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-803 |
| **Where** | `/characters/[id]` → Skills panel; Edit Species |
| **Needs** | Editable character; Codex skills loaded; a species whose granted skill the character does not already have |

**Steps**
1. Open the sheet Skills list. Confirm every skill **name** is a human label (not a UUID / raw id). Hover (desktop) or focus/touch-hold (phone) a skill name — the Codex skill description appears. Names without a description stay plain text.
2. Edit Species: pick a different species (or mixed pair) that grants a skill the character did not have. Save.
3. Confirm the new species skill appears in Skills as its Codex **name**, proficient, not as an id. Hover still shows that skill’s description.
4. Optional ~360px: skill names remain tappable (44px); desktop names stay text-hugging (not 44px rows).

**Expected**
- Species-change never leaves a raw skill id in the Skills list.
- Skill names with Codex copy use the same word-tied tip pattern as ability names (`WordHelpTip`).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-009-T056 — Sheet feat Customize caret stays while typing (TASK-805)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-805 |
| **Where** | `/characters/[id]` → Library → Feats → **Edit** → expand a feat or trait → **Customize** |
| **Needs** | Editable character with at least two feats (or two traits) so Name sort can reorder |
| **CI** | Partial — `library-feat-rows.test.ts` |

**Steps**
1. Enter **Edit**. Expand a feat. Open **Customize**.
2. Click in the middle of **Custom name** (or start typing a new name). Type several characters, including a space in the middle. Confirm the caret stays where you are typing — it does not jump to the start or end of the field after each key.
3. Repeat in **Player note**. Confirm the same.
4. Blur the field (click Hide customization or another row). Confirm the italic title / note still save (reload or wait for autosave).
5. Optional: with two feats sorted by Name, rename one so it would sort above the other. Confirm the list does not reorder until you leave the field, and typing stays usable. Repeat on a trait. Optional ~360px.

**Expected**
- Caret stays mid-field while typing. Title/note persist after blur. Play-view T051 behavior unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T057 — Innate star and Equip circle stay icon-pair toggles (TASK-799)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-799 |
| **Where** | `/characters/[id]` → Library → Powers (innate star) and Inventory (equip circle on a weapon or armor) |
| **Needs** | Editable character with at least one power and one weapon or armor |

**Steps**
1. On Powers, click the innate star on a power. Confirm it fills (Lucide star, not ☆/★ text) and the power is marked innate. Click again to clear.
2. On Inventory, click the equip circle on a weapon or armor. Confirm it becomes a filled check-circle; click again to unequip.
3. Optional ~360px: both controls remain tappable without overlapping neighbors.

**Expected**
- Same select/equip/innate behavior as before. Innate uses a star icon. Equip uses circle → check-circle. Edit/Temp pencils still color-code remaining vs over-budget.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T058 — Mobile sheet panels do not stretch to the tallest sibling (TASK-838)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-838 |
| **Where** | `/characters/[id]` at 360px and 390px (below `md`) |
| **Needs** | A populated character (Library panel taller than Abilities — level-20 / loaded sheet) |

**Steps**
1. Open the sheet at ~390px. Confirm the Abilities panel is on screen.
2. Scroll the page / panel to the end of Abilities. Confirm you reach the last ability/defense content with at most one viewport of trailing blank — not ~3 empty viewport heights.
3. Swipe to Skills, Archetype, and Library. Confirm horizontal snap still stops on each panel (`scroll-snap-stop: always`).
4. On Library, scroll through the list; confirm the panel scrolls internally and the page does not grow to ~4700px.
5. Repeat at ~360px. Optional ≥768px: confirm the `md+` grid (`lg:grid-cols-[1fr_1fr_2fr]`) is visually unchanged.

**Expected**
- Each mobile panel is bounded to the remaining viewport and scrolls its own content. Page height does not follow the tallest sibling. Snap and desktop grid unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T059 — Sheet action dock and RollLog FAB do not overlap content or modal footers (TASK-837)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-837 |
| **Where** | `/characters/[id]` at 360px and 390px (below `md`); also 768 / 1024 / 1280 / 1440 |
| **Needs** | Logged-in owner of a character; Recovery / Level Up / Add Feat available |

**Steps**
1. Open the sheet at ~390px. Confirm the Edit / Temp / Recovery / Level Up / Settings controls sit in an opaque bottom bar, not over STRENGTH / VITALITY / AGILITY tiles.
2. Confirm the dice FAB sits in the bar's right slot and does not cover any of those circular buttons.
3. Open **Recovery**. Confirm **Full Recovery** (and the rest of the footer) is fully tappable — the FAB and action bar are gone while the modal is open. Close it.
4. Repeat with **Level Up** and **Add Feat**: footer primary actions stay clear of the FAB.
5. At ≥768px: confirm the action icons are top-right (not a bottom bar) and the dice FAB is bottom-right with a gutter so it does not sit on the Library panel.
6. Optional ~360px: same as steps 1–4.

**Expected**
- Mobile: one bottom dock (opaque bar + FAB slot); sheet content has reserved space; no FAB on modal footers.
- Desktop: toolbar top-right, RollLog bottom-right, reserved gutter, no control-to-control overlap.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T060 — Sheet header stat cards stay an even grid (TASK-839)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-839 |
| **Where** | `/characters/[id]` at 360 / 390 / 768 / 1024 / 1280 / 1440 |
| **Needs** | A character that shows all four header stats (Speed, Evasion, Damage Reduction, Critical Range) — equipped armor that changes DR and crit |

**Steps**
1. Open the sheet at ~1024px (small laptop / iPad landscape). Confirm Speed / Evasion / DR / Critical Range are equal-width cards in the **middle** column (2×2), not a 119px single column, and the header height is comparable to 1440 (not ~530px / ~2.5×).
2. Confirm identity, stats, and resources **are** three columns at 1024 (equal tracks). From ~1280, side columns may cap while stats stay 2×2.
3. At ~1280 and ~1440: confirm the three-column identity | stats | resources layout. Stat cards are equal width and at most two rows (2×2 in the middle column).
4. At ~360 and ~390: confirm a 2×2 (or 2-wide) even grid **inside the viewport** (no off-canvas cards); labels wrap instead of clipping mid-word. At ~768: four equal cards in one row is fine.
5. Optional: Temp mode still shows DR and Critical Range cards with their own sliders.

**Expected**
- Equal-track stat cards at every listed width. Stat grid never exceeds two rows. Three-column header from `lg` (1024). 1024 header height is comparable to 1440, not ~2.5× it. Phone widths do not horizontally overflow the header.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T061 — RM campaign view has no empty owner-dock strip (TASK-843)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-843 |
| **Where** | `/campaigns/[id]/view/[userId]/[characterId]` at 360px and 390px; compare `/characters/[id]` |
| **Needs** | Logged-in Realm Master of a campaign with a roster character; same character available as owner sheet |

**Steps**
1. Open the RM campaign character view at ~390px. Confirm there is **no** opaque (or empty) full-width action bar under the sheet. The dice FAB sits at the bottom-right gutter.
2. Scroll the last library/abilities content: the FAB must not permanently cover the last rows (panel end padding clears it).
3. Open the **owner** `/characters/[id]` sheet at the same width. Confirm the opaque Edit / Temp / Recovery / Level Up / Settings dock is still reserved (unchanged from T059).
4. Optional ~360px: same as steps 1–3.

**Expected**
- RM view: no owner-dock strip; FAB reachable; sheet content can use the bottom of the frame.
- Owner sheet: dock reservation unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T062 — Ability and defense tile labels stay inside the tile (TASK-835)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-835 |
| **Where** | `/characters/[id]` Abilities & Defenses at 360 / 390 / 768 / 1024 / 1280 / 1440 |
| **Needs** | Any owned character (E2E Baseline Knight is enough) |

**Steps**
1. Open the sheet at ~360px and ~390px. Confirm abilities and defenses are a **2-column** equal-track grid (not 3-col). **Intelligence**, **Discernment**, and **Mental Fortitude** stay inside their tiles — wrap to a second line if needed; never clip mid-glyph.
2. Confirm every tile in a row is the same height, and labels use one convention: full GAME_RULES words (Mental Fortitude, Reflexes) — not a mix with **Mental Fort.**
3. At ~768: 3-col is fine. From ~1024: 6-col is fine. Desktop labels stay `text-sm` like Speed/Evasion (T028).
4. Header character name still truncates with a visible ellipsis when longer than the identity column (TASK-839 /cleanup).

**Expected**
- Full names only. Labels inside tiles at 360/390. Equal row height. Desktop label size unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T063 — Sheet skill dots, Sub-Skills, and Current Health meet Dense/Standard (TASK-836)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-836 |
| **Where** | `/characters/[id]` Skills panel + header Health at 360 / 390 (touch) and a fine-pointer desktop window |
| **Needs** | Any owned character (E2E Baseline Knight is enough). Touch emulation (`pointer: coarse`). |
| **CI** | Partial — `button-tiers.test.ts` (SkillRow layout-neutral + ResourceInput `touch-tier-standard` + Sub-Skills `hit-area-layout-neutral`) |

**Steps**
1. Open the sheet at ~390px with **touch** emulation. In Skills, proficiency dots stay **16px** painted circles (not 44px slabs). Tap a toggleable dot in Edit — it still toggles. Adjacent skill name / roll / stepper still receive their own taps (no stolen hits).
2. Confirm **Sub-Skills** is easy to tap (label + checkbox) and still shows/hides sub-skill rows. The Prof column is not a fifth column and the Skills card is not wider on desktop.
3. Header **Health** current input is ≥44px tall under coarse pointer (Energy matches). Fine-pointer desktop: dots, checkbox, and Health input stay compact (`h-4` / `py-0.5`).
4. Optional ~360px: same as steps 1–3.

**Expected**
- Dense dots: 16px paint + 44px expanded hit; coarse rows have enough vertical gap that overlays do not overlap neighbours.
- Sub-Skills checkbox uses the same `.hit-area-layout-neutral` overlay as skill dots (16px paint); the wrapping label stays Dense. Not a 13px naked checkbox.
- Current Health (and Energy) Standard 44 min-h under coarse; `w-12` unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T064 — Mobile sheet header fully hides on panel scroll (TASK-868)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-868 |
| **Where** | `/characters/[id]` at 360px and 390px (below `md`) |
| **Needs** | A populated character (header tall enough to share the first screen with Abilities — E2E Baseline Knight / loaded sheet) |

**Steps**
1. Open the sheet at ~390px. Confirm identity / Speed / resources are visible above Abilities. The header is not its own scroller — the first downward scroll is the panel. The carousel shows a right-edge fade while later panels are off-screen (C1; no next-panel peek / scroller padding).
2. Scroll down inside the Abilities (or Library) panel. Confirm the **sheet** header (not the site nav) fully leaves — no leftover identity/stat strip taking half the lower section. The panel uses the leftover viewport above the dock.
3. Scroll that panel back to the top. Confirm the sheet header returns.
4. Swipe to Skills / Archetype / Library. Confirm each snapped panel lines up with the header card’s left/right edges (T021). On the last panel the right-edge fade is gone.
5. Repeat at ~360px. Optional ≥768px: header stays in document flow (no collapse); no carousel fade.

**Expected**
- Below `md`, panel scroll fully collapses `data-sheet-mobile-header`. Restoring scrollTop restores the header. Snap panels stay aligned with PageContainer/header gutters. Desktop grid unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T065 — Notes Age + Backstory fields (TASK-886)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-886 |
| **Where** | `/characters/new/guided` Reveal, `/characters/new/advanced` Finalize, `/characters/[id]` Notes tab |
| **Needs** | Character with age + backstory from creator; optional legacy save with `Age: N` prefix inside appearance |

**Steps**
1. Guided Reveal or Advanced Finalize: enter Age, appearance text, and backstory/background. Create character.
2. Sheet → Library → Notes: Age appears in the physical header after Height/Weight (not inside Appearance). Backstory has its own section. Appearance is appearance-only.
3. Edit mode: change Age; save/reload — Age persists; Appearance never regains an `Age:` prefix.
4. Legacy character with `Age: 42` prefix in appearance only: Notes shows Age 42 in header and clean Appearance body; after any save, stored JSON has dedicated `age` and stripped `appearance`.

**Expected**
- Creators map to `age`, `appearance`, and `backstory` fields. Save migrates legacy age prefix out of appearance.

**Automated** | `npm test` — `appearance-age.test.ts` + `build-character.test.ts`

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T066 — Sheet Health may go negative (TASK-894)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-894 |
| **Where** | `/characters/[id]` header Health; encounter combat card with linked campaign character |
| **Needs** | Loaded character with editable Health; optional encounter with a player-linked combatant |

**Steps**
1. Sheet header: step Current Health below 0 (e.g. −3). Confirm value persists and Energy still floors at 0.
2. Click Health value, type `-5` at positive HP, press Enter — confirm absolute −5 (not current−5). Type `+2` — confirm adds 2.
3. Over-heal above max still works (gold bar if shown).
4. Encounter: editable linked campaign combatant allows negative HP; standalone NPC combatant still floors at 0.
5. Desktop + ~360px coarse pointer: Health input/stepper remain tappable.

**Expected**
- Current Health may be negative per GAME_RULES Dying. Energy ≥ 0. NPC encounter HP unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T067 — Global edit pencil dot matches section semantics (TASK-896)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-896 |
| **Where** | `/characters/[id]` toolbar edit pencil + section EditSectionToggle pencils |

**Steps**
1. Open a character with **no** unspent pools and not XP-ready — confirm no dot on the toolbar edit pencil.
2. Open a character with unspent ability, skill, feat, prof, or HE points — confirm toolbar dot is **green** (not red); hover shows which pools remain (e.g. “Unspent: 2 ability points; 1 archetype feat slot”).
3. Enter edit mode — confirm section pencils are **green** where those pools apply (Abilities, Skills, Archetype prof, Library when feat slots remain); none are red unless overspent.
4. Overspend one pool and leave points in another — confirm toolbar dot is a **red/green gradient** with both “Over budget” and “Unspent” in the tooltip; section pencils show red/green per pool.
5. Character XP-ready with all pools balanced — confirm **purple** level-up dot (not red/green) and tooltip mentions Level Up.

**Expected**
- Global dot severity: green = unspent only; red = overspent only; red/green gradient = both; purple = level-up when no unspent/overspend; none when fully balanced and not XP-ready.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T068 — Identity text wraps by word or ellipsis, not char-by-char (TASK-897)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-897 |
| **Where** | Sheet Library GLR rows, Archetype → Weapons table, ability/defense tiles, header stat labels |

**Steps**
1. Open a loaded character sheet at **~360px**. Library → Weapons (or Powers): confirm collapsed row names show an ellipsis when long — not one character per line down the column.
2. Archetype → Weapons: confirm weapon names truncate with ellipsis (or stay on one line); property bullets under the name truncate rather than char-wrap vertically.
3. Abilities / Defenses panels: multi-word labels (e.g. **Intelligence**, **Mental Fortitude**) wrap at word boundaries inside tiles — not mid-word glyph stacks.
4. Header Speed / Evasion / Critical Range / DR labels: two-word titles wrap at the space (e.g. CRITICAL / RANGE), not letter-by-letter.
5. Expand a truncated GLR row — full name visible in expanded body. Hover collapsed name shows native `title` tooltip when truncated.

**Expected**
- Dense name columns use truncate/ellipsis; multi-word fixed labels use word-boundary wrap; no inflated row height from vertical char stacks.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T069 — Header stat tiles are compact and centered (TASK-885)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-885 |
| **Where** | `/characters/[id]` at 360 / 768 / 1024 / 1280 |
| **Needs** | A character that shows Speed + Evasion (and DR / Crit if armored) |

**Steps**
1. Open the sheet at ~1024px. Confirm Speed / Evasion / DR / Crit are equal compact/squarish tiles centered in the middle column — not full-bleed rectangles squeezing identity or Health/Energy.
2. Confirm titles (including **Critical Range** / **Damage Reduction**) fit with padding; no long empty bars.
3. Repeat at ~360, ~768, and ~1280. Three-column header still engages at 1024.

**Expected**
- Equal compact tiles; identity and resources keep their tracks. C3 equal-track grid remains.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T070 — Library edit eyes do not force tab scroll (TASK-887)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-887 |
| **Where** | `/characters/[id]` Library, Edit mode |
| **Needs** | Loaded sheet; typical desktop width (~1280) |

**Steps**
1. Enter sheet Edit. Confirm hide/show eyes sit next to every Library tab.
2. With all tabs visible, confirm the tab strip does **not** require horizontal scroll solely because of eye padding.
3. Toggle an eye — tab still hides/shows in play. On a coarse pointer, the eye hit stays ~44px.

**Expected**
- Eyes stay Dense-painted; hide/show works; desktop tabs fit without eye-caused overflow.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T071 — Feats Customize is a button with even rule gaps (TASK-888)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-888 |
| **Where** | `/characters/[id]` Library → Feats, Edit |
| **Needs** | A feat or trait that can be customized |

**Steps**
1. Edit → Feats → expand a row. Confirm **Customize** looks like a button (outline variant — not a descriptor chip).
2. Confirm equal space from desc chips to the rule and from the rule to the button.
3. Open Customize — fields still work; Hide customization toggles.

**Expected**
- Shared Button `outline`/`sm`, tight vertical padding, even gaps. Not a desc-chip cousin.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T072 — Library tab chevrons only when overflowing (TASK-890)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-890 |
| **Where** | Sheet Library + `/codex` / `/library` tab strips |
| **Needs** | A width where all tabs fit, and one where they overflow |

**Steps**
1. At a width where every tab is visible, confirm no left/right chevron.
2. Narrow until tabs overflow — chevron appears on the clipped edge only.
3. Click the end chevron — list jumps to the last tab; start chevron jumps to the first.

**Expected**
- No dead arrow when content fits. Codex/Library share the same `TabNavigation` behavior.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T073 — Prof-point pool is read-only; slider thumb centered (TASK-891)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-891 |
| **Where** | `/characters/[id]` Archetype & Attacks, Edit |
| **Needs** | Powered-Martial (or any) character; also check dark theme |

**Steps**
1. Edit Archetype. Confirm remaining/total prof. points is a read-only chip — no +/− to raise the max.
2. Drag the Power↔Martial slider: thumb sits on the track (not hanging below).
3. Toggle dark theme: thumb/track use surface / `*-fg` tokens (readable, not a white-only thumb).

**Expected**
- Pool max is not editable. Slider is centered and tokenized in both themes. Creature Creator slider matches.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-009-T074 — Roll-log bonus hover and outside click (TASK-893 / TASK-895)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-009 — Character sheet refactor |
| **Related task** | TASK-893, TASK-895 |
| **Where** | `/characters/[id]` with the Roll Log open |
| **Needs** | Loaded sheet that can roll abilities, defenses, skills, attacks, and a Power attack |

**Steps**
1. Roll Strength, a defense (e.g. Reflexes), a skill, a weapon attack, and a Power attack. Hover each bonus chip — source names Strength / Reflexes bonus / skill bonus / Attack or ability bonus / **Power bonus**.
2. A roll with +0 (or no modifier) has no bonus chip and no bogus hover.
3. With the log open, click empty page chrome — log closes. Click a RollButton — log stays open and records the new roll. Click inside the panel — stays open. FAB still toggles.

**Expected**
- Named bonus hover; outside click closes; roll triggers keep the log open. No second overlay.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

Archived (TASK-718; not cited by Pending owner QA). Full steps: [`BUILD_VALIDATION_ARCHIVE.md`](archive/BUILD_VALIDATION_ARCHIVE.md#dev-v-005--rls-policy-consolidation-task-352-task-327).

---

## DEV-V-010 — Feat/trait custom name + note (TASK-377)

Archived (TASK-718; not cited by Pending owner QA). Full steps: [`BUILD_VALIDATION_ARCHIVE.md`](archive/BUILD_VALIDATION_ARCHIVE.md#dev-v-010--feattrait-custom-name--note-task-377).

---

## DEV-V-011 — UI verification safety net (TASK-383)

Archived (TASK-718; not cited by Pending owner QA). Full steps: [`BUILD_VALIDATION_ARCHIVE.md`](archive/BUILD_VALIDATION_ARCHIVE.md#dev-v-011--ui-verification-safety-net-task-383).

---

## DEV-V-029 — Post-activation onboarding (TASK-388)

Verifies play-together after first save, optional sheet tour, level-up milestone guides, and tutorials toggle (REALMS_PRODUCT_OVERVIEW §11).

#### DEV-V-029-T001 — Play-together after first character save

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-029 — Post-activation onboarding |
| **Related task** | TASK-388 |
| **Where** | Guided or Advanced creator finish |
| **Needs** | Signed-in; clear `localStorage` key `realms_seen_play_together_prompt` (or use a fresh browser profile) |

**Steps**
1. Complete a character and save (no `?returnTo=`).
2. Confirm play-together modal: **See my character** (primary, top), then secondary section — Join campaign, Join Discord, Run games as RM.
3. Optionally uncheck Don't show again, dismiss, then save another character — modal may reappear.
4. With Don't show again checked (default), dismiss — subsequent saves skip the modal.
5. Save with `?returnTo=/campaigns` — no play-together; redirect honors returnTo.

**Expected**
- Modal only on first-seen save path without returnTo; sheet navigation works after See my character.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-029-T002 — Optional sheet tour offer

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-029 — Post-activation onboarding |
| **Related task** | TASK-388 |
| **Where** | `/characters/{id}` after post-save handoff |
| **Needs** | Tutorials on; sheet tour not dismissed forever |

**Steps**
1. After play-together → See my character (or save when play-together already seen), land on sheet with tour offer.
2. Skip — no tour; Don't show again — never offers again; Take the tour — step card highlights sections; finish/skip completes.
3. Confirm home `/` does not show a sheet tour.

**Expected**
- Offer is post-save only; Skip / Don't show again / tour complete behave as labeled.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-029-T004 — Sheet tour retake + roll-log overlap

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-029 — Post-activation onboarding |
| **Related task** | TASK-388 |
| **Where** | Character sheet settings (gear) + tour step card |
| **Needs** | Owned character; tutorials on |

**Steps**
1. Open an owned character sheet → gear → **Character settings** → **Take the tour again** — tour starts at step 1/6; **Next** is clickable (not blocked by the d20 roll-log FAB).
2. Advance through all six steps — highlights move (abilities, skills, library, roll log, edit toolbar, header help); finish or skip completes.
3. With tutorials off (My Account) — retake button disabled with hint; re-enable tutorials — retake works again.

**Expected**
- Tour card sits above roll-log FAB (`z-tour`); desktop card is bottom-left; mobile leaves room for the FAB.
- Retake always restarts at step 1; settings modal closes when tour starts.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-029-T003 — Level-up milestone guide + tutorials off

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-029 — Post-activation onboarding |
| **Related task** | TASK-388 |
| **Where** | Character sheet level-up + My Account |
| **Needs** | Owned character; tutorials on initially |

**Steps**
1. Level up for the first time — floating delta guide highlights the sheet header (not a blocking modal).
2. Level up into an ability-point milestone (e.g. to 3) — Abilities section highlighted, edit mode on; allocate tip once; no full sheet tour.
3. My Account → turn off Show tutorials → level up again — no guide.
4. Turn tutorials back on — already-seen milestones stay suppressed.

**Expected**
- Guides are skippable highlight cards, delta-scoped, and respect tutorials off + milestone flags.
- Ability milestone shows *where* to spend (scroll + ring on Abilities) with edit mode enabled.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-012 — Landing page rebuild (TASK-387)

Verifies the rebuilt marketing landing page at `/` (REALMS_PRODUCT_OVERVIEW Section 4). One dominant primary CTA, AIDA scroll story, removed onboarding tour / welcome link-farm / Codex-Library CTAs. TASK-763: guest CTA is **Create Character**; how-it-works steps are create / find a table / start playing (no system jargon).

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
- Hero shows headline, subline, and one prominent **Create Character** button → `/characters/new`.
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
- Page scrolls to the **Start Playing in Three Steps** section (3 numbered steps) with offset (heading not hidden under header).
- Steps are **Create a character**, **Find a table** (Discord is a link to the invite), and **Start playing**. No Archetype Path / Species / Feats jargon in the step titles or bodies.

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
- Signing in on an account with **0** characters instead shows the guest **Create Character** hero.

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

#### DEV-V-012-T007 — Mid-width window: no header-driven horizontal strip

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-012 — Landing page rebuild |
| **Related task** | TASK-519 |
| **Where** | `/` (any signed-in page with site header) |
| **Needs** | Window or DevTools width ~1024–1279px (and spot-check ~1280–1400px with Admin visible) |

**Steps**
1. Resize to ~1100px wide so the header hamburger is visible (inline desktop nav is `xl+` only).
2. Confirm the page has **no** bottom horizontal scrollbar caused by the header.
3. Confirm there is **no** empty/unfilled vertical strip to the right of the header bar or page background when attempting to scroll horizontally.
4. Widen past `xl` (~1280px+): inline nav appears; still no document-level horizontal scroll or unfilled strip beside the header (including when Admin is shown).

**Expected**
- Header never widens the document past the viewport; backgrounds stay continuous; mid-width uses the menu button instead of overflowing nowrap nav.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-012-T008 — How-it-works steps are create / find a table / play (TASK-763)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-012 — Landing page rebuild |
| **Related task** | TASK-763 |
| **Where** | `/` (signed out) |
| **Needs** | Logged out (or incognito) |

**Steps**
1. Open `/` while signed out.
2. Scroll to **Start Playing in Three Steps**.
3. Click **Discord** in step 2.
4. Confirm the mid-page repeat CTA matches the hero (**Create Character** → `/characters/new`).

**Expected**
- Step titles: **Create a character**, **Find a table**, **Start playing**.
- Step 1 does not mention Archetype Path or other creator jargon; it says the creator walks you through making a hero.
- Step 2 **Discord** opens the invite (`DISCORD_URL`) in a new tab. Closing **Join the Discord** CTA still present.
- Hero and how-it-works primary buttons both say **Create Character**, not Start Playing.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-012-T009 — Home uses (main) chrome without remount (TASK-789)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-012 — Landing page rebuild |
| **Related task** | TASK-789 |
| **Where** | `/` → `/codex` → `/` |
| **Needs** | — |

**Steps**
1. Open `/`. Confirm the landing H1 and sections render without a “Signing you in…” spinner (OAuth `?code=` is handled by the proxy, not the page).
2. Open `/about`. Confirm the page title and creator note render; the carousel still changes slides.
3. Open `/characters/new`. Confirm Guided / Custom / Legacy cards. Add `?returnTo=/campaigns` and click Guided — URL keeps `returnTo`.
4. From `/`, click **Codex** in the header, then the logo back to `/`. Confirm the header/footer do not visibly remount (no flash of missing chrome).

**Expected**
- `/` is `(main)/page.tsx` (server page + `HeroSection` island). About and the chooser are server pages. Desktop + ~360px.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-012-T010 — About carousel arrows stay on-screen (TASK-833)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-012 — Landing page rebuild |
| **Related task** | TASK-833 |
| **Where** | `/about` at 360px and 390px |
| **Needs** | None |

**Steps**
1. Open `/about` at 390px (and 360px). Confirm **Previous section** and **Next section** arrows are fully inside the viewport and tappable.
2. Tap each arrow — the slide title/body changes. Tap a neighboring die — the same slide change happens.
3. Confirm each die control is at least 44×44 (scale is on the image, not the button).

**Expected**
- Neither arrow sits off the left/right edge. Dice stay 44×44 tap targets. Overlay arrows + `w-full` replaced the old fixed-width flex track on **all** widths — desktop should still read as a centered dice row, not the prior 464px side-arrow layout.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-013 — Guided Simple character creator (TASK-394–403)

**Category:** End-to-end guided creator funnel — entry chooser, chapters, save.  
**Prerequisite:** Run **DEV-004** (`sql/guided-creator-schema-seed.sql`) so starter species and Berserker loadouts/abilities exist.  
**Related (steppers):** TASK-487 / ADR-0002 — sitewide ± chrome; verify via **T053** (and Skills ± on T014).

#### DEV-V-013-T001 — Entry chooser routes

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-394, TASK-638 |
| **Where** | `/characters/new` |
| **Needs** | — |

**Steps**
1. From home, click **Create Character** or **Create another character** (or open `/characters/new` directly).

**Expected**
- Guided vs Custom cards appear with landing-style hero (gradient, dice decor).
- **Guided** → `/characters/new/guided` (Path L1).
- **Custom** → `/characters/new/guided?entry=custom` (Path L3 custom archetype).

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
- First screen after entering Loadout is **Weapons & shields** (not Equipment); cold catalog load must not skip to Equipment (see T062).
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
- Armor browse uses **Damage Reduction**; Equipment browse uses **Name | Category | Currency | Rarity**.
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
| **Related task** | TASK-402, TASK-489, TASK-490, TASK-503 |
| **Where** | Guided creator → Your Hero |
| **Needs** | Signed-in account; complete prior steps; path with weapons and/or powers that cost Training Points |

**Steps**
1. Enter name, allocate HP/EN, click **Save character** (or Finish).
2. Wait for the success toast ("Your character is ready!").
3. If the play-together modal appears, click **See my character** (or close the modal).
4. On the character sheet → Proficiencies tab: confirm required part/property proficiencies for the loadout/powers were saved (not empty when the build spends TP).
5. On Library → Feats: confirm archetype and character feat **names** match the Codex (not raw feat ids).
6. Optionally: force a failed save (e.g. offline) and confirm the wizard draft is still intact.
7. Optionally: start from `/characters/new?returnTo=/campaigns?tab=join`, finish guided save — confirm redirect honors `returnTo` **without** play-together (same as custom finalize).
8. Signed-out save: confirm shared **Login Required to Save** modal (`LoginPromptModal`); after login, return to guided with query preserved.

**Expected**
- Wizard draft is **not** cleared until create returns a character id successfully.
- After success: redirect to `/characters/{id}` (or sanitized `returnTo` when set), directly or after dismissing play-together (play-together only when no `returnTo`).
- Finish/Save stays disabled after success (no second create while play-together is open).
- Character sheet loads; **proficiencies** persist for armaments/powers/techniques (parity with custom creator `getCharacter`).
- Feat rows show human-readable names (resolved from Codex at save; sheet also enriches id-as-name legacy rows).
- Guest save uses shared LoginPromptModal with `redirect=` (not a broken `next=` param).
- Character appears on `/characters`.
- On failure: stay on Your Hero with draft preserved; error toast; no navigation.

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
- The size track **hugs** the pills (does not stretch full overview width when there are few sizes).
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
1. Reach the optional flaw pick after characteristic and ancestry trait.
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
4. In the Add Skills modal footer, confirm **Browse all Sub-Skills** (when shown) has visible gap below the horizontal separator — not flush on the rule.
5. Expand a few skill rows and read descriptions; tap + to select one or more skills.
6. Confirm the warning banner and that **Add Selected** stays disabled.
7. Close modal; decrease or remove a skill to free a point; reopen browse and add a skill successfully.

**Expected**
- Browse control is Layer 2 under recommendations (not a primary CTA on the skill list).
- USM footer `footerExtra` (Browse all Sub-Skills / Browse all Skills layer nav) clears the footer separator with consistent padding (TASK-875).
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

#### DEV-V-013-T012 — Feat steps Layer 2 add modal

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-429, TASK-565, TASK-758, TASK-759, **TASK-753** |
| **Where** | Guided creator → Archetype Feats, then Character Feat |
| **Needs** | Path + species + abilities + skills complete |

**Steps**
1. On Archetype Feats, confirm path guidance groups and **See more Feats** below the grid (L1 cards stay as path recommendations only — not the full catalog).
2. Click See more Feats; confirm an **Add Archetype Feats** modal opens (`UnifiedSelectionModal`, full-screen on mobile) and L1 groups remain behind the overlay.
3. Select a non-path feat (respect max); Add Selected; confirm counter updates and modal closes.
4. Re-open See more Feats; deselect / replace; confirm L1 cards and counter stay in sync after confirm. Cancel leaves prior picks unchanged.
5. On Character Feat, repeat with **See more Character Feats** → **Add Character Feat** modal; confirm single-select replace works.
6. In both feat modals, confirm there is no **REQ. LEVEL** header/cell; feats requiring level >1 remain hidden. Open the **State Feats (i)** and confirm it explains Quick Action → Enter State, 1-minute duration, and activating multiple state feats together.
7. Confirm **Filters** is expanded on open and **Archetype Path** is last in the panel, pre-selected to every player-visible path of this draft’s archetype type (Martial path → all Martial paths, not Power). Matching rows show path-name chips, not a duplicate Recommended badge. Family rank chips on a legal L1 feat remain.
8. Clear the Archetype Path filter (or deselect all paths) — the list widens to feats the L1 cards did not show (still hiding `lvl_req` >1). Re-selecting paths narrows it again.

**Expected**
- GuidedLayerNav opens an add modal (same grammar as Browse all Skills / See more options on Loadout & Powers) — does **not** dump all feats as in-step cards.
- L2 defaults to feats you qualify for; optional "Show Feats I don't qualify for".
- Creator feat columns omit Req. Level only; Codex/Admin feat lists still show it. State Feats help uses the same sentence as state-feat card notices and remains link-blue/readable at ~360px.
- Modal uses `fullScreenOnMobile`; Add Selected / Cancel are sticky (≥44px targets).
- Path flow See more auto-filters to same-type path recommendations (union); clearing the path filter is L3 in the same modal. L1 cards stay the path’s curated set.

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
| **Related task** | TASK-406, TASK-462, TASK-729, TASK-755 |
| **Where** | Guided creator → Your Hero |
| **Needs** | Complete prior steps; signed-in optional for save/portrait |

**Steps**
1. Open reveal: hero band shows clickable portrait + name field; identity (age/height/weight/appearance/background) and Health/Energy sit above Your Build.
2. Click the portrait to upload/change; type a name in the hero band (not only a lower form).
3. Confirm Your Build has no Edit jump links, no Type card, and no standalone Power/Martial ability cards (pills remain on the abilities grid).
4. Confirm **Auto-allocate** is short copy with an (i) tip; click it — Health/Energy PointStatus remaining ticks down to 0/18 (same as spending the pool with the steppers). Labels read **Health / Energy** on desktop; **HP / EN** below `md`. Power/technique chips in Your Build show Energy as **EN** (e.g. `4 EN`), never **EP**. Save (or guest login prompt).

**Expected**
- Cherry-on-top finale: name/portrait in header; identity + Health/Energy before summary; summary is show-off only (chapter rail to edit); T005 save still works when signed in. Auto-allocate spends the pool (remaining → 0) and names the highest Energy-cost Power/Technique in the tip when known. Dense Energy abbreviation is **EN**, never **EP**.

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
5. Under **Powered-Martial Paths**, select a hybrid path → **More details** → Close → confirm the modal still opens on the same card (detail lookup is against the full path list; hybrids are always visible in their section).
6. Species: repeat steps 1–4 for selection independence (content checked in T017).

**Expected**
- Progressive disclosure: truncated → **See more…** → **More details** (deep-dive). Cards without overflow may show **More details** while collapsed.
- **More details** never toggles selection; card click still selects.
- Path modal opens (content checked in T018); Close dismisses.
- Path step shows type sections (not a hybrid LayerNav); species catalog Layer 2 (`Show all species`) remains separate below the species grid.
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
2. Confirm Overview shows full description immediately (no Power / Martial / Powered-Martial type chip); while options load, a “Loading path options…” line may appear under overview, then sections populate (no blank flash without feedback).
3. Confirm proficiency (when present), path abilities as **Primary Ability** chips for each Archetype Ability (martial/power = one Primary; powered-martial = **two** Primary chips — both archetype abilities, not Primary+Secondary) plus optional **Secondary Ability** only when a distinct secondary recommended ability exists; no Power/Martial ability *tags* on those chips; recommended ability scores, and recommended skills when data exists.
4. Expand each listed catalog section (omit empty ones): archetype feats, character feats, weapons (Unarmed Prowess only when that path recommends it), armor, Equipment, techniques (martial) or powers (power / powered-martial). Confirm InfoTippy tips; collapsed rows show truncated descriptions + stats; expand for full copy; weapon/armor named property chips use descriptor + InfoTippy (Training Points spelled out, not TP) when codex properties are known.
5. Confirm no raw-id “phantom” rows for missing powers/techniques/feats (unresolved refs omitted).
6. Close modal; select the path via the card; reopen **More details** and confirm selection stays.
7. Under **Powered-Martial Paths**, open **More details** on a hybrid → confirm powers section (not techniques); selection independence still holds.

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
| **Related task** | TASK-435 / TASK-711 |
| **Where** | Guided creator → Path / Species deep-dives; Advanced creator species modal (if opened from Advanced flow) |
| **Needs** | Codex species + archetypes |

**Steps**
1. Guided Species → **More details** → expand an option catalog; confirm GridListRow name + truncated description + Uses when limited; expand row for full copy / uses hint.
2. Guided Path → **More details** → expand weapons (or armor); expand a row with properties; confirm chips expand for description/TP (same language as species trait rows). Optionally expand powers/techniques and confirm energy stats via shared combat builders.
3. Select a species → Ancestry overview (`SpeciesRevealPanel`): granted species traits render as **read-only compact cards** (name + description preview; **See more…** when copy overflows or uses notice exists; limited-uses notice on expand). Cards must **not** look selectable (no checkmark, no hover-as-pick, no Choose aria). Check desktop + ~360px (cards stack to one column; See more stays tappable). Species **More details** catalogs stay elongated `DetailOptionList` / GLR rows. Mixed-species Ancestry overview has **parent species cards** (art, description, More details) and no granted-trait list (choices-ahead copy still below).
4. Optional Advanced: open species info modal → trait sections use expandable DetailOptionList rows (choice traits group options under the parent name; limited-use options show Uses). Unresolved trait placeholders (if any) appear dimmed. Confirm Select Species still works; Close dismisses.
5. Spot-check light + dark: description/`text-text-secondary` readable; muted uses `dark:text-text-secondary` where applicable.

**Expected**
- One visual/interaction language for **deep-dive catalogs** (shared `@/lib/detail-option` builders for traits/feats/equipment/powers/techniques).
- Ancestry **overview** granted traits are read-only `GuidedChoiceCard`s (TASK-711) — not GLR rows. Modal catalogs stay DetailOptionList.
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
1. On the Path step, confirm path cards show descriptor chips for **Primary Ability …** and **Secondary Ability …** when the path has those fields (Advanced creator parity).
2. Open a **Martial** path → **More details**. Confirm overview shows Martial proficiency only (no Power Proficiency 0). Path abilities read `Primary Ability …` (no Power/Martial type chip). Section title is **Recommended Abilities** (not scores). Recommended Skills chips expand for descriptions.
3. Open a **Powered-Martial** path → **More details**. Path Abilities show **two** `Primary Ability …` chips (Power + Martial archetype abilities — both primary; not Primary/Secondary between them). No Power/Martial type chip on the overview.
4. Confirm **Path Options** title + intro sit **above the expandable catalogs** (not inside Overview). Expand Archetype Feat Options (or similar); hover the InfoTippy: tip body must **not** repeat the section title as a heading.
5. Expand Weapons / Armor / Powers or Techniques: list shows name + description only (no Stats column, no visible column header bar). Expand a row: fact chips are self-describing (`Damage Reduction N`, `Range …`, `Energy N`, `Action Type …`, `Uses N`, property chips with descriptions).
6. Spot-check Species **More details** tips the same way (no redundant tip titles). Light + dark readable.

**Expected**
- Unused proficiency lines omitted; path abilities use Primary for Archetype Ability(ies) and Secondary only for a distinct recommended ability; powered-martial shows two Primaries; no Power/Martial type tag in More details; Path Options bridges into catalogs; title-less tips; Name/Description catalogs with labeled fact chips.
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
- Lands on the Path step (**Choose your Archetype Path**), not Species.
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
| **Related task** | TASK-451 · TASK-588 |
| **Where** | Guided creator — Ancestry / Abilities / Skills / Feats |
| **Needs** | Progress through Ancestry (with flaw + second trait if available), Abilities, Skills, Archetype Feat |
| **Automated** | Path same/new select patch: `npm test` — `path-selection-draft.test.ts` (TASK-588). Full back-navigation retain remains manual. |

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
| **Related task** | TASK-451 · TASK-760 |
| **Where** | Guided creator → Abilities (and optionally Your Hero summary) |
| **Needs** | A Power path with a distinct `secondary_ability` (not equal to Archetype Ability) |

**Steps**
1. Choose a Power path that lists a Secondary Ability in Path **More details**.
2. Continue to Abilities.
3. On the ability grid, confirm the archetype ability tile has a **Primary** pill (accessible name Primary Ability) and the secondary ability tile has a **Secondary** pill (accessible name Secondary Ability).
4. Optionally Customize Abilities and confirm both pills remain; check Your Hero summary grid if reached.
5. At desktop six-column width, compare all tiles: highlighted and unhighlighted tiles have the same height and content alignment, with pills straddling the top edge rather than pushing content down.

**Expected**
- Secondary Ability pill visible and distinct when path secondary ≠ archetype ability.
- Pills stay single-line and do not overlap ability names (see also T035).
- Hybrid Powered-Martial paths use **Power** / **Martial** pills (both Archetype Abilities); no duplicate Secondary when `secondary_ability` equals one of those.
- Every tile reserves the same pill clearance; top and bottom whitespace look balanced after the straddling pill is accounted for.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T035 — AbilityScoreGrid mobile labels + path pills

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-452, TASK-455, TASK-760 |
| **Where** | Guided creator → Abilities (and Your Hero summary grid) |
| **Needs** | DevTools ~360px width; path with Archetype Ability (+ Secondary if available) |

**Steps**
1. Resize viewport to ~360px width.
2. On Abilities recommended grid, confirm the two-column tiles show full ability names without horizontal overflow.
3. Confirm path pills show short single-line copy (**Primary** / **Secondary**, or **Power** / **Martial** on hybrids) and do **not** wrap into a taller pill that overlaps the ability name.
4. Hover or inspect the pill: accessible name / title still exposes the full term (e.g. Primary Ability, Secondary Ability, Archetype Power/Martial Ability on hybrids).
5. Confirm pills stay inside their tile and do not spill into neighbor tiles at ~360px, tablet, or desktop.
6. Continue to Your Hero and confirm the same grid behaves.
7. Compare highlighted and unhighlighted tiles in each two-column row: heights, name/score alignment, and top/bottom whitespace are even.

**Expected**
- No overflow/spill from labels or pills; pill height growth never covers the ability name.
- Full terms remain available via aria-label/title when visible copy is shortened.
- Full ability names remain visible at phone and `sm+` widths.
- Highlighted tiles are not taller and their content is not shifted below neighboring tiles.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T036 — AbilityScoreGrid customize edit layout on mobile

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-452 · TASK-760 · **TASK-880** |
| **Where** | Guided creator → Abilities → Customize |
| **Needs** | DevTools ~360px width; path with a Primary/Secondary or Power/Martial pill |

**Steps**
1. On Abilities, open Customize.
2. Confirm the edit grid matches the character sheet: **2 columns** at ~360px, **3** at `sm`, **6** at `lg` — not a single-column phone stack or a cramped 3-column phone grid.
3. Confirm labels are **text-sm** full ability names; values are **text-xl** (not oversized slabs); tiles use compact density (`px-2.5 py-3`), not full-bleed wide rectangles.
4. Confirm Decrement/Increment use Dense expanded hit (`.hit-area-dense`, `size="sm"`) — usable without zoom; steppers do not overlap neighboring values.
5. Confirm **Ability Points** inline tracker has an InfoTippy (rules: max +3, below 0 returns points, floor −2, total negatives ≥ −3).
6. Compare highlighted and unhighlighted tiles on phone, then `sm+`: heights and alignment stay even; path pills do not push a highlighted tile down.

**Expected**
- Customize edit layout tracks sheet `AbilityStatTile` density (TASK-880).
- Steppers do not overflow or overlap neighboring ability values.
- Point-buy remains usable with recommended Back via LayerNav.
- Every edit tile reserves the same pill clearance; highlighted tiles keep the same padding and height as neighbors.

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

#### DEV-V-013-T039 — Loadout chapter + Equipment phase copy (TASK-459 / TASK-872)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-459, TASK-872 |
| **Where** | Guided creator chapter rail, Loadout phases, path More details, Your Hero summary |
| **Needs** | Path with weapon/armor/Equipment recommendations (e.g. Berserker) |

**Steps**
1. Confirm chapter rail label **Loadout** (not Equipment).
2. On weapon/armor phases, confirm page titles are phase-only (**Weapons & shields**, **Armor**).
3. Advance to Equipment; confirm page title **Equipment**, continue label **Continue to Equipment →** from armor, and **Add all recommended Equipment**.
4. Open **See more options** on Equipment; confirm **Browse Equipment** (no Adventuring Gear / bare Gear).
5. On path **More details**, confirm Equipment section title (not Adventuring Gear).
6. On Your Hero, confirm summary section **Loadout**.

**Expected**
- Chapter = Loadout; Equipment phase = **Equipment**; no user-facing Adventuring Gear or bare Gear labels; no new em dashes in these strings.
- Armaments (weapons/armor/shields) stay separate from Equipment; Enhanced items are not merged into either list.

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
1. Reach Powers or Techniques. Confirm the chapter still reads **Loadout** framing for prior phases. Martial lands on **Your Techniques**. Power lands on **Your Innate Powers** (Continue to Powers next). Powered-Martial walks innate → powers → techniques (T086).
2. Confirm path recommendations appear as **GuidedChoiceCards** with visible selected/unselected state (soft-seeded affordable picks may start selected; deselecting clears them). Continue works with zero selections.
3. Confirm **Training Points** PointStatus and per-card Training Points cost remain (TASK-456); overspend still shows a blocked reason.
4. Click **See more options** below the grid; confirm an add modal opens (`GuidedPowersTechniquesL2Modal` / `UnifiedSelectionModal`) while L1 cards stay behind the overlay (same grammar as feats TASK-565 / Loadout L2).
5. Toggle a catalog pick (respecting TP); Add Selected; confirm selection updates and modal closes.
6. Re-open See more options / cancel; confirm L1 cards and prior selections remain. Non-path catalog picks appear as selected cards on L1 (flat grid or **Your other Powers/Techniques** section). Removing a promoted card updates Training Points immediately.

**Expected**
- No silent select-all without visible card selection state.
- GuidedLayerNav opens an add modal below content (feats / Loadout / Powers L2 grammar) — not an in-step full-catalog card dump.
- Martial never shows Powers browse; Power never shows a Techniques screen; Powered-Martial does (T086).
- L2 → L1 promotion keeps selected non-path cards visible (TASK-458).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T044 — Weapon/armor disclosure-safe fact layout (TASK-457)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-457 / **TASK-716** |
| **Where** | Guided Loadout → Weapons and Armor (~360px + desktop, light and dark) |
| **Needs** | Path with weapon/armor picks (e.g. Berserker); items with named properties and Finesse / ranged as available |

**Steps**
1. Collapsed weapon card: confirm only title-adjacent **Currency N** and **Training Points N** beside the name — no Graze/Cleave/mechanic chips in the collapsed body, and nothing under **See more…**.
2. Expand **See more…**: confirm non-expanding chips for Abilityname Requirement (e.g. `Strength Requirement N+`), handedness (`Two-handed` / `One-handed` / `Ranged` / …), damage (`XdY Type Damage`), and **Strength Weapon** / **Agility Weapon** / **Acuity Weapon**. Finesse weapons show Agility Weapon (no separate Finesse chip); ranged non-Finesse show Acuity Weapon. Ranged weapons chip **Range 8 Spaces** / **Range 16 Spaces** (never raw `0` or a bare level int); melee omits a Range chip (TASK-716).
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

#### DEV-V-013-T050 — InfoTippy inside chips and Training Points label (TASK-465 / TASK-707)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-465, TASK-707 |
| **Where** | Guided Loadout Weapons (See more) + budget bar; light/dark |
| **Needs** | Weapon with a named property that has a description |

**Steps**
1. Expand See more: property chip with tip shows the **i** inside the chip boundary (not floating beside it). Chip **i** matches the chip text color (not washed muted gray).
2. Training Points PointStatus: **i** sits inside the status pill next to the label and reads **TP green** (`text-tp-text`), not muted gray. Nearby heading InfoTippys stay link-blue.
3. Hover/focus/touch-hold still opens help; accessible names present. Repeat in dark theme — contrast holds; touch targets unchanged.

**Expected**
- Tips feel attached to their control; no layout jump from sibling icons. Default InfoTippy is link-blue; on-chip inherits; TP tracker tip is TP green.

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
5. **SourceFilter (TASK-705):** Path L2 defaults to Realms Library and can switch All / My / Realms (always visible under search via `scopeExtra`; scopes the catalog, not chrome-only).

**Expected**
- Quantity-first selection; shared UnifiedSelectionModal (no guided-only fork). Path L2 SourceFilter defaults to Realms.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T053 — ValueStepper unified guided-skills chrome (TASK-487 / ADR-0002)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-487 (supersedes TASK-468 visual AC) |
| **Where** | Guided Skills bonus ± + Equipment quantity + sheet HP/EN / skill edit |
| **Needs** | Any stepper surface |

**Steps**
1. Guided Skills: ± buttons are soft `surface-alt`, no invasive border, bold −/+, not red/green circles.
2. Equipment Quantity and sheet skill/ability steppers match that same chrome.
3. Health/Energy steppers use the same neutral buttons (value text may still be green/blue); no colored ± pills.
4. Touch targets ≥44px below md; light/dark contrast OK.

**Expected**
- One shared stepper visual language (`ValueStepper` / Dec/Inc / `QuantitySelector`); no hand-rolled ±.

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

#### DEV-V-013-T056 — Innate then regular screens + store (TASK-471 / TASK-756)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-471, TASK-756 |
| **Where** | Guided Powers step (Power or Powered-Martial path) |
| **Needs** | Power archetype path (innate list may be empty until TASK-473 seeds) |

**Steps**
1. After Loadout, land on **Your Innate Powers** only (no Powers list and no Show Innate+Powers filter). Martial never sees this screen.
2. Confirm innate and regular picks stay independent after Continue to Powers (selecting one does not double-count in the other screen).
3. **See more Innate Powers** opens the innate modal; on the Powers screen **See more options** opens the regular powers modal.
4. Empty innate recommendations show a graceful empty state + browse affordance.

**Expected**
- Sequential screens; draft `innatePowerIds` separate from `powerIds`; no `innateScope` dropdown.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T057 — Innate Energy soft warn + threshold + TP parity (TASK-472 / TASK-573 / TASK-590 / TASK-706)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-472, TASK-573, TASK-590, TASK-706 |
| **Where** | Guided Powers step (Power archetype preferred — Innate Energy 16 at L1) |
| **Needs** | Path or catalog with innate-eligible powers (Energy ≤ threshold 8 for Power) |
| **Automated** | Threshold filter + shared TP spend: `npm test` — `powers-techniques-l2.test.ts` (TASK-590). Soft Continue warn + L1 TP chip UI remain manual. |

**Steps**
1. Confirm **Innate Energy** PointStatus uses progression budget (Power L1 = 16, Powered-Martial = 6), not threshold-only 8. Confirm it sits in the same `LoadoutBudgetBar` row as **Training Points** and matches Skills / Ability Points height, padding, font, and border (TASK-706 — not a smaller sibling pill).
2. Attempt to select a power with Energy > Innate Threshold — blocked.
3. With remaining Innate Energy > 0, Continue stays enabled; footer/hint shows a soft warning (not a hard block). Spending to remaining 0 clears the soft warning.
4. Innate L1 cards show a **Training Points** title chip (same as regular Powers); Energy stays in See more / detail chips. Selecting innate powers increases the shared Training Points spent (Loadout budget bar).
5. Regular powers remain optional. Save character: innate picks persist with `innate: true`.

**Expected**
- Threshold gate preserved; Innate Energy under-fill is soft-warn only; innate TP spend + TP chip parity; Innate Energy + Training Points share LoadoutBudgetBar inline PointStatus size with Skills/Abilities; sheet Abilities/Skills spend PointStatus uses the same inline size; sheet-compatible save.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T058 — Add-modal ListHeader column sort (TASK-488)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-488 |
| **Where** | Guided Loadout / Powers L2 browse; Advanced creator Powers add modal |
| **Needs** | Path with equipment + powers/techniques catalog |

**Steps**
1. Guided Weapons → **See more options**: click **Currency** / **Training Points** / **Name** column headers; confirm list reorders ascending then descending on second click.
2. Guided Powers/Techniques → **See more options**: click **Action Type**, **Energy**, and **Training Points**; confirm asc/desc toggle.
3. On mobile (~360px): open **Sort by**, pick a non-Name column, confirm order changes; tap again to reverse.
4. Spot-check Advanced character creator Powers add modal and creature creator inventory ListHeader (RANGE / ATTACK / DAMAGE).

**Expected**
- All labeled data columns sortable; spacer/action columns remain non-sortable; UnifiedSelectionModal `sortByColumn` uses row `columns` values (and enriched sort keys where display values are computed).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T059 — Footer Continue does not jump to furthest screen (TASK-520 / TASK-592)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-520 · automation TASK-592 |
| **Where** | Guided creator footer **Continue** after revisiting Foundation / Ancestry |
| **Needs** | Progress through Ancestry (and optionally further), then return via chapter rail or Back |
| **CI** | `src/lib/guided-creator/guided-substep-nav.test.ts` — `nextGuidedSubStep` one-step index + `landsOnFirstInnerScreen` intent predicate (`forward`/`first` vs `back`). Full multi-screen landing remains human steps below. |

**Steps**
1. Complete Foundation (path + Human); advance through Ancestry picks into Abilities (or further).
2. Click **Foundation** or **Ancestry** on the chapter rail (or Back to Species).
3. Re-select the same species (Human) if on Species; click footer **Continue**.

**Expected**
- Continue moves only to the immediate next screen (Species → Ancestry overview → first ancestry pick → …), not the furthest Ancestry pick or later chapter you had already reached.
- Footer **Back** still returns to the previous screen / last inner screen (T031 unchanged).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T060 — Feat steps use guidance group audience (TASK-514)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-514 |
| **Where** | Guided Character Feat + Archetype Feats steps |
| **Needs** | Path with both character-audience and archetype-audience feat guidance groups |

**Steps**
1. Open guided creator on a path authored with separate character vs archetype feat groups.
2. On **Character Feat**, Layer 1 cards come only from character-audience groups.
3. On **Archetype Feats**, Layer 1 sections come only from archetype-audience groups (character groups absent).

**Expected**
- Filtering uses `PathGuidanceGroup.audience` (not title containing "character").

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T061 — Ancestry pick order: characteristic before ancestry trait (TASK-524)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-524 (order); **TASK-591** CI — `ancestry-pick-tasks.test.ts` |
| **Where** | Guided creator → Ancestry (after species overview) |
| **Needs** | Starter species with characteristics, ancestry traits, and at least one flaw |

**Steps**
1. Complete Foundation (path + species); on Ancestry continue past the species overview (and any species-trait option picks).
2. Confirm the next screen is **Pick a characteristic** (not ancestry trait or flaw).
3. Select a characteristic → Next pick → confirm **Pick an ancestry trait**.
4. Select an ancestry trait → Next pick → confirm **Take a flaw? (optional)**.
5. Optionally take a flaw → Next pick → confirm bonus ancestry trait; or Skip / No Flaw → confirm advance without bonus trait.

**Expected**
- Order is characteristic → ancestry trait → optional flaw → (bonus ancestry trait if flaw taken).
- Characteristic is never immediately followed by the flaw screen.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T062 — Loadout entry does not skip Weapons/Armor (TASK-527)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-527 |
| **Where** | Guided creator → first entry into Loadout (path with weapons + armor, e.g. Berserker) |
| **Needs** | Hard refresh or cold cache preferred so item catalogs load after the step mounts |

**Steps**
1. Complete Foundation through Skills/Feats as needed; click Continue (or chapter rail) onto **Loadout**.
2. Repeat a few times with a hard refresh before re-entering Loadout (or clear site data for the origin).

**Expected**
- First Loadout screen is **Weapons & shields** (not Equipment), then Armor when the path includes it, then Equipment.
- Spinner may show briefly while items load; after load, phase stays on Weapons (does not jump to Equipment).
- Paths with no weapon/armor options may still open on Equipment only.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T063 — Path step grouped by Power / Powered-Martial / Martial (TASK-528)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-528 |
| **Where** | Guided creator → Path (`/characters/new/guided`) |
| **Needs** | Codex has at least one path in two different types (ideally all three) |

**Steps**
1. Open the guided Path step.
2. Confirm paths appear under section headings **Power Paths**, **Powered-Martial Paths**, and **Martial Paths** (omit a heading only when that type has zero player-visible paths).
3. Confirm there is **no** "Show hybrid…" / "Back to Power and Martial paths" LayerNav control.
4. Hover/focus the **i** next to each visible section title; confirm a short new-user tip explains that type (Power / Powered-Martial / Martial).
5. Select a path from each visible section in turn; confirm Continue enables and the card selection highlight follows the pick.
6. At ~360px width: section titles + title-adjacent InfoTippy remain usable (inline tip size beside the heading — established pattern); cards still use the guided choice grid.

**Expected**
- Grouping order is Power → Powered-Martial → Martial (same as Advanced path picker).
- Cards remain `GuidedChoiceCard` with More details / See more behavior unchanged.
- Tooltips use shared `tooltip-text` copy via `InfoTippy` `size="inline"` on the section title.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T067 — Guided creator subsection title typography (session)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Where** | `/characters/new/guided` — Path, Archetype Feats, Abilities, Reveal |
| **Needs** | Codex paths with feat guidance groups |

**Steps**
1. Open guided Path. Confirm **Power Paths** / **Powered-Martial Paths** / **Martial Paths** use the display font, are clearly smaller than the step title (“Choose your path” or equivalent) but larger than card titles and body copy.
2. Select a path with archetype feat guidance groups → Archetype Feats. Confirm each group heading matches the same subsection style as Path (display font, consistent size).
3. On Abilities (recommended view), confirm the path-recommended heading uses the same subsection style.
4. On Reveal, confirm **Identity**, **Health & Energy**, and the build summary panel title use the same subsection style under the step title.
5. At ~360px width: subsection titles remain readable and do not collide with adjacent InfoTippy icons on Path.

**Expected**
- One shared subsection title scale (`font-display`, `text-xl` / `sm:text-2xl`, semibold) across guided steps; step title stays the largest heading on each screen.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T066 — Guided skills Ability chip + Skill Bonus tip (TASK-548)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-548 |
| **Where** | Guided creator → Skills (`/characters/new/guided`) |
| **Needs** | Path + species with skills; abilities already set |

**Steps**
1. Open Skills. Confirm each listed Skill shows a contributing Ability chip (e.g. Strength) beside the name, before Species / path chips when present. Ability uses the primary chip style (distinct from Species descriptor).
2. Hover (desktop) or touch-hold (mobile) the Skill Bonus number between the ± steppers. Confirm a tip shows Ability + Skill Value = Skill Bonus with the current numbers. Keyboard: focus the bonus control — accessible name includes the bonus and “how … Skill Bonus is calculated.”
3. For a multi-ability Skill (e.g. Intimidate), confirm the chip matches the highest linked Ability and the tip notes that rule when applicable.
4. Decline a path Skill so it appears in suggestions; confirm the card tags include the Ability (not only the path name).

**Expected**
- Players can see which Ability feeds each Skill and how the Skill Bonus is calculated without leaving the step.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T064 — Path content smoke after archetype enrichment (TASK-530)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-530 |
| **Where** | Guided creator → Path → Feats / Abilities / Skills (`/characters/new/guided`) |
| **Needs** | Live codex paths enriched (RealmsRPG-Test) |

**Steps**
1. Open guided Path; open **More details** on **Berserker**, **Assassin**, **Sorcerer**, and **Wardsmith** in turn. Confirm each has a readable description (no placeholder / empty) and notes when present.
2. Select **Berserker** → continue to Feats. Confirm guidance groups distinguish **character** vs **archetype** audiences (labels / sections match path authoring — e.g. Rage / Stay in the fight style groups for Berserker).
3. On Abilities: confirm soft-defaults show primary **3**, secondary at least **2**, and Ability Point cost sum **7** (spread, not a flat dump of unused scores when the path recommends spread).
4. On Skills: confirm the path recommends **at most 3** base skills (no sub-skills in the L1 list).
5. Select **Wardsmith** and reach powers / proficiency: confirm Power Proficiency starts at **2** (not 0).
6. Spot-check one other martial (**Warrior** or **Monk**) and one other power path (**Healer** or **Necromancer**) for the same shape: character + archetype feat groups, abilities sum 7, skills ≤3.

**Expected**
- Content matches the TASK-530 enrichment (not the older flat L1 feat lists).
- Choice-card deep-dive chrome itself is covered by **T016**; this test is path **content**, not disclosure UX.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T065 — Ability name tooltips on guided Abilities step (TASK-547)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-547 |
| **Where** | Guided creator → Abilities (`/characters/new/guided`) |
| **Steps** | 1. Choose a Path and continue to the **Abilities** step (recommended array view). 2. Hover (desktop) or touch-hold (mobile) a full ability name such as **Strength** or **Acuity** — confirm the definition tip opens on the word (no Info icon). 3. Confirm tip copy starts once (e.g. “Acuity reflects…” / “Might (Strength) resists…”) — not “Acuity. Acuity…”. 4. Open **Customize abilities** and confirm tips still work on ability names in the edit grid. 5. Optional: sheet Defenses / skills allocation — same non-duplicated defense tips. |
| **Expected** | Ability labels use `WordHelpTip` + `getAbilityHelp`; tips match sheet copy without repeating the name; path pills and steppers remain usable. |
| **Report** | DEV-V-013-T065: PASS / FAIL / SKIP — |

#### DEV-V-013-T067 — Guided Skills row layout + Abilities mobile full names (TASK-566)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-566 |
| **Where** | Guided creator → Abilities + Skills (`/characters/new/guided`) |
| **Needs** | Narrow viewport (~360px); path with skills (e.g. Tamer / Beastcraft) |

**Steps**
1. On **Abilities** (recommended grid) at ~360px: confirm all six labels show full names (Strength, Vitality, … — not STR/VIT/ACU). Tiles use a 2-column layout and do not look like tall skinny columns.
2. Continue to **Skills**. Confirm each row: skill name + expand chevron on the first line; Ability / Species / path chips wrap on a line below (chips not truncated into “Beas”; chevron does not overlap chips).
3. Confirm ± steppers and remove (X) stay clear of chips; expand/collapse still reveals the description.
4. Spot-check desktop (`sm+`): Skills still usable; Abilities show full names in a wider grid.

**Expected**
- No overlapping expand control vs chips; path chips readable; mobile Abilities use full names and compact 2-col tiles.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T068 — Path L1 Archetype Path chrome (TASK-577)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-577 |
| **Where** | Guided creator → Path (`/characters/new/guided`) |
| **Needs** | Codex has paths in at least two types |

**Steps**
1. Open guided creator. Confirm Foundation chapter subtitle includes **Archetype Path** (e.g. “Choose your Archetype Path and species”).
2. On the Path step, confirm the title is **Choose your Archetype Path** with an **i** tip beside it. Hover/focus/touch-hold: tip explains Archetype Path warmly without saying “class”.
3. Confirm section headings **Power Paths** / **Powered-Martial Paths** / **Martial Paths** read as clear, larger/bolder h3 titles (not tiny uppercase labels).
4. Hover each section **i**: tip leads with what that path type *is* (Power: spellcasters / artificers / benders / warlocks / bards; Martial: weapon masters / scouts / unarmed specialists; Powered-Martial: blend at a lighter level). Mechanic term remains **Power** (not “spell”).
5. On path cards, confirm Primary Ability chips are slightly larger than before and have a slight primary blue; Secondary Ability chips match that size and stay neutral (no power-fg / martial-fg role tint).
6. At ~360px: title tip and section tips remain usable (`size="inline"`).

**Expected**
- Game-term **Archetype Path** is exposed on chapter rail + step title; path-type tips and ability chips match TASK-577 product decisions.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T069 — Path More details overview (TASK-578)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-578 |
| **Where** | Guided creator → Path → More details on any path card |
| **Needs** | Codex paths with recommended abilities (prefer one Martial + one Power) |

**Steps**
1. Open More details on a path. Confirm there is **no** preview subtext under the title (no “Preview this path…” line).
2. Confirm there is **no** Proficiency section (no Power/Martial Proficiency lines in the overview).
3. Confirm **Path Abilities** shows Primary (slight primary blue) and Secondary chips at the same larger (`md`) size as L1 cards, with an **i** tip. Tip explains Primary = Archetype Ability (Energy, Training Points, Attack Bonus) and Secondary = recommendation only; Powered-Martial has two Primaries.
4. Confirm **Weapons and Armor** summary: type-appropriate prose and Armament Proficiency number matching path type (Power 3 / Powered-Martial 8 / Martial 12 from live rules). Section **i** tip explains Armament Proficiency (reusable global tip).
5. Confirm **Recommended Abilities** use compact ability cards (name + bonus tiles), not DescriptorChip dumps.
6. At ~360px: tips usable (`size="inline"`); recommended tiles remain readable.

**Expected**
- Lean overview: description, Path Abilities + tip, Weapons and Armor + Armament tip, recommended ability cards, recommended skills. Numbers from `getArmamentMax` / live core rules (not hardcoded UI fakes).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T070 — Path feat deep-dive uses chips + restriction notices (TASK-579 / TASK-759)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-579, TASK-759 |
| **Where** | Guided creator → Path → More details → Archetype / Character Feats sections; feat-step filters |
| **Needs** | Path with at least one limited-use feat and ideally one state feat (e.g. Berserker / Assassin / Sorcerer) |

**Steps**
1. Open More details on a path that lists feats. Expand a feat with limited uses (chip like `Uses 1 / Full Recovery`).
2. Confirm the Uses chip is a non-expanding DescriptorChip (no chevron / no expandable restatement panel).
3. Confirm there is **no** duplicate “This feat can be used … per … Recovery” sentence when the chip already states uses/recovery.
4. Expand a **state** feat (if present): confirm the same info-warning callout style as Archetype Feats step cards (`GuidedFeatRestrictionNotice` — State feat / Enter State teaching). Uses chip still present when the feat has a per-feat limit; notice does not restate the uses sentence.
5. On an Archetype Feats or Character Feat catalog, open the **State Feats (i)**. Confirm its State feat / Enter State / 1-minute / multiple-state sentence exactly matches the teaching sentence in the card notice.
6. At ~360px: expand a feat row and open the filter (i); chip, notice, and tip remain readable; touch targets ≥44px.

**Expected**
- Uses/recovery = DescriptorChip only; state / meaningful restrictions use shared GuidedRestrictionNotice styling; the State Feats filter reuses that teaching copy; no parallel warning UI or duplicate copy.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T071 — Training Points tip clarity (TASK-580)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-580 |
| **Where** | Guided Loadout (Weapons) or Powers/Techniques — `LoadoutBudgetBar` Training Points InfoTippy |
| **Needs** | Path with Training Points PointStatus visible |

**Steps**
1. Open guided creator and reach Weapons (or Powers/Techniques). Confirm **Training Points** PointStatus with an **i** tip beside the label.
2. Hover/focus/touch-hold the tip: copy says Training Points are a **shared budget** for weapons, armor, Powers, and Techniques (full words — not TP).
3. Confirm the tip does **not** lecture the level / Archetype Ability formula; it explains remaining = what you can still afford and that over-cost choices stay unavailable.
4. Optionally select an affordable item and an over-budget pick: PointStatus remaining drops; unaffordable choices stay gated (behavior unchanged — tip only).

**Expected**
- Same `trainingPointsHelp` export on LoadoutBudgetBar; shorter teaching copy; still matches GAME_RULES shared-budget + remaining-gates affordability.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T072 — Chooser Custom opens Path L3 (TASK-638)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-638 |
| **Where** | `/characters/new` → Custom |
| **Needs** | — |

**Steps**
1. Open `/characters/new` and click **Custom**.
2. Confirm URL is `/characters/new/guided?entry=custom` (or equivalent with returnTo preserved).
3. Confirm Path step shows **Custom Archetype** face (Power / Powered-Martial / Martial type cards), not path cards.
4. Confirm **View archetype paths** (layer collapse) is visible below the content.

**Expected**
- Custom and Guided both use the guided shell; Custom lands on Path L3.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T073 — Path L1 Custom Archetype hatch (TASK-638)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-638 |
| **Where** | `/characters/new/guided` Path step |
| **Needs** | — |

**Steps**
1. Open Guided entry (`/characters/new/guided`).
2. Confirm path cards (grouped Power / Powered-Martial / Martial).
3. At the bottom, click **Custom Archetype**.
4. Confirm L3 type cards appear; path selection is cleared; Continue stays disabled until type + ability(ies) are valid.

**Expected**
- Same-place GuidedLayerNav expand; L3 face matches product overview §5.1.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T074 — Path L3 type/ability Continue + return to paths (TASK-638)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-638 |
| **Where** | Guided Path L3 |
| **Needs** | — |

**Steps**
1. On Path L3, pick **Power**, then a Power Ability — Continue enables.
2. Switch to **Powered-Martial**, pick two different abilities — Continue enables; same ability on both sides stays disabled/blocked.
3. Click **View archetype paths** — return to L1 path cards; forge picks cleared.
4. Optionally pick a path and Continue to Species — path flow still works.
5. Optionally on L3: pick type + abilities, Continue to Species — **Abilities** step is full point-buy only (all scores at 0, no See recommendations, Continue after spending all points); archetype feats shows empty recommendations with **See more Feats** browse (no path id on saved character if completed later).

**Expected**
- Tooltips on type and ability help; L3↔L1 clears incompatible draft fields; path Continue still requires a path on L1.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T075 — Chooser Legacy card (TASK-640)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-640 |
| **Where** | `/characters/new` |
| **Needs** | — |

**Steps**
1. Open `/characters/new` — confirm three cards: **Guided**, **Custom**, **Legacy**.
2. Click **Legacy** — confirm `/characters/new/advanced` (classic tabbed creator).
3. Return; click **Guided** — confirm `/characters/new/guided` Path L1 (`entry=guided` applied then stripped from URL).
4. Return; click **Custom** — confirm `?entry=custom` and Path L3 custom archetype face.

**Expected**
- Legacy is temporary peer; Guided/Custom share cohesive shell; `returnTo` preserved on all three.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T076 — Custom entry deep catalogs (TASK-640)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-640 |
| **Where** | Custom chooser → complete Path L3 → Species onward (no path pick) |
| **Needs** | Starter + non-starter species in codex |

**Steps**
1. Enter via **Custom**, forge archetype, Continue to **Species** — confirm **all species** visible (not starters-only).
2. Confirm **See starter species** (outline) collapses to starter set; **See all species** (primary) expands.
3. On **Abilities**, confirm customize panel opens; **See recommendations** returns to path suggestions when a path exists (pick path via View archetype paths first).
4. On **Skills**, confirm browse does **not** auto-open on first landing; scroll and use **Browse all Skills**; in that modal use **Browse all Sub-Skills** for L3. On **Archetype Feats** / **Character Feat** / **Loadout** / **Powers** (innate screen first for Power / Powered-Martial), confirm browse/L2 still opens on first landing for custom forge (no `archetypePathId`).
5. **Ancestry**: Continue from Species (or chapter rail into Ancestry) lands on **species overview** — stable heritage summary / size pick; does **not** flash overview then jump to first pick. Second Continue enters first pick in order.

**Expected**
- `creatorEntryMode` custom + no path id drives deep landing on browse/catalog steps; Ancestry overview is never skipped. Picking a path on L1 reverts later steps to guided faces.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T077 — Layer nav button chrome (TASK-640, TASK-695)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-640, TASK-695 |
| **Where** | Any guided step with `GuidedLayerNav` (Species, Abilities, Loadout L2 footer) |
| **Needs** | — |

**Steps**
1. On Species L1, confirm **See all species** uses hatch chrome (outline + subtle fill, **not** solid primary blue) and sits **bottom left** below the grid (not in footer).
2. On Species L2, confirm **See starter species** (outline, bottom left) and **Create Species** (hatch chrome, bottom right) sit below the grid — not in the sticky footer.
3. Confirm sticky footer **Continue** remains the only solid primary-blue progress CTA on those steps.
4. On Loadout L2 browse, confirm footer **See recommendations** uses outline, not primary.

**Expected**
- Deeper/hatch = outline `lg` + `guidedNavExpandClassName` (subtle fill); shallower = outline `lg` transparent; footer Continue = primary `lg`; no layer-nav button matches Continue solid blue.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T079 — Restart preserves chooser entry mode (TASK-693)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 — Guided Simple character creator |
| **Related task** | TASK-693 |
| **Where** | `/characters/new/guided` → Restart (header button) |
| **Needs** | — |

**Steps**
1. Enter via **Custom** chooser; on Path L3 pick type + abilities (or leave partial) — advance to Species or beyond.
2. Click **Restart** → confirm — land on Path L3 custom archetype face (type cards), not Guided path cards.
3. Confirm selections cleared (no species, no spent ability points).
4. Return to chooser; enter via **Guided**; pick a path and advance to Species.
5. **Restart** — confirm Path L1 path cards (not L3 custom face).

**Expected**
- Restart clears chapter progress but preserves `creatorEntryMode` session face; URL has no `?entry=` after bootstrap.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T078 — Guided Species L2 (mixed + Create Species) (TASK-641)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-641 |
| **Where** | `/characters/new/guided` → Species (L2) → Ancestry (mixed) |
| **Needs** | At least two species; ideally a pair with 4+ combined skills for skill-pick step |

**Steps**
1. On Species L1, **See all species** — confirm full catalog.
2. On Species L2, confirm **Mixed Species** card at end of grid; open modal, pick two distinct species, confirm selection ring.
3. Confirm **Create Species** (hatch chrome, bottom-right below grid via `GuidedLayerNav`) opens `/species-creator` in a new tab — not in the sticky Back/Continue footer.
4. Continue to **Ancestry** — mixed overview shows both parent species as cards (art, description, **More details**) plus **Change species**; complete trait/skill/characteristic picks (choose 2 skills when 4 options).
5. Continue through Skills — locked species skills match mixed picks; save character — `ancestry.mixed` + `speciesIds` on sheet.

**Expected**
- Mixed selection no longer dead-ends on Ancestry; save persists mixed ancestry fields.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T079 — Mixed species skill picks show descriptions (TASK-670)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-670 |
| **Where** | Guided `/characters/new/guided` → Ancestry (mixed, 4+ combined skills); Advanced mixed ancestry; sheet Edit Species (mixed) |
| **Needs** | Mixed species pair with more than two combined skill options (four-option pick step) |

**Steps**
1. Guided: on **Choose your species skills**, confirm each `GuidedChoiceCard` shows skill description (truncated; **See more…** when long).
2. Advanced mixed ancestry: **Species skills** section shows description under each skill name (clamp + See more when long).
3. Sheet **Edit Species** (mixed): same picker descriptions in modal.
4. Confirm **Any** skill option shows its helper description when present in codex data.

**Expected**
- No name-only skill pick cards/rows in mixed species skill selection flows.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T080 — Your Hero Loadout and power/technique chips show names (TASK-730)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-730, TASK-755 |
| **Where** | Guided creator → Loadout (weapon + armor) → Powers/Techniques → Your Hero → Your Build |
| **Needs** | A path (or Custom) with a weapon pick; include at least one My Library weapon if available; if possible also a My Library power or technique |

**Steps**
1. Pick a weapon and armor on Loadout (official and, if possible, a user-library weapon). Continue to **Your Hero**.
2. In **Your Build → Loadout**, confirm the weapon chip shows the item **name** (expandable when a description exists), not a raw UUID/id. Armor still shows its name.
3. Confirm Unarmed Prowess still appears when selected; general gear is still omitted from this summary.
4. If a My Library power and/or technique is on the build, confirm those chips show **names**, not UUIDs. Unresolved rows may show “Unknown power” / “Unknown technique” — not a raw id. Energy on those chips is **N EN**, never **EP**.

**Expected**
- Loadout weapon and armor chips use library names (official or My Library); no raw ids in the summary.
- Power/technique chips use library names (official or My Library); no raw ids. Energy cost on those chips is **EN**, never **EP**.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T081 — Mixed Ancestry overview parent cards + size hug (TASK-720)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-720 |
| **Where** | Guided `/characters/new/guided` → Ancestry (single-species size pick + mixed overview) |
| **Needs** | A species with 2+ sizes; two distinct species for mixed |

**Steps**
1. Pick a multi-size species → Ancestry overview. Confirm **Choose your size** track hugs the pills (not a full-width bar).
2. Back to Species L2 → Mixed Species → confirm two parents → Ancestry. Confirm both parents are cards with art, description, and **More details** (opens the species deep-dive; Close only — does not switch to a single species).
3. Click **Change species** — MixedSpeciesModal opens (same dual-select as Species L2), prefilled with the current pair. Confirm a different pair without leaving Ancestry. Confirm ancestry picks reset and the overview still shows the new parents.
4. Desktop + ~360px: cards stack; Change species stays tappable; size track does not overflow.

**Expected**
- Size picker hugs few options on single-species and mixed overviews.
- Mixed overview shows both parents as read-only `GuidedChoiceCard`s and can change them via `MixedSpeciesModal` in place.
- Single-species overview is unchanged aside from the hugging size track (granted-trait cards still TASK-711).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T082 — Your Hero Auto-allocate pool, tip, and Health/Energy labels (TASK-729)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-729, TASK-755 |
| **Where** | Guided creator → Your Hero (Health & Energy); Advanced `/characters/new/advanced` → Finalize |
| **Needs** | Complete prior steps; at least one Power or Technique with a known Energy cost |

**Steps**
1. On Your Hero, confirm the allocator pool is PointStatus remaining/total (starts unspent, e.g. 18/18). Desktop totals read **Health** / **Energy**; below `md` they may read **HP** / **EN**.
2. Click **Auto-allocate** — remaining ticks to 0 (same as spending the pool with the steppers); Health/Energy totals update. Hover the (i) — tip names the highest Energy-cost Power/Technique and its Energy when known (enough to use it once, rest to Health).
3. Decrement a stepper so remaining is not 0; click Auto-allocate again — remaining returns to 0 with the same split.
4. Advanced Finalize: same pool tick + tip on **Auto-allocate to match highest cost**. Sheet edit-mode allocator may keep **HP** / **EN**.

**Expected**
- Auto-allocate spends the shared pool through the same PointStatus as the steppers; tip copy matches GAME_RULES Energy/Health terms; no raw HP/EN on the creator card at desktop width. Dense labels and chips use **EN** for Energy, never **EP**.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T083 — Innate Energy and Innate Powers InfoTippys (TASK-726)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-726 |
| **Where** | Guided Powers step (Power or Powered-Martial — Innate Energy tracker visible); L1 cards and L3 Full Customize; L2 See more Innate Powers footer |
| **Needs** | Path or custom draft with an innate track (not Martial-only) |

**Steps**
1. On Powers, confirm the **Innate Energy** PointStatus has an **(i)** inside the pill (same `labelAccessory` slot as Training Points). Hover/focus/touch-hold: copy says Innate Energy is the total combined energy of innate powers and that the pool is Innate Pools × Innate Threshold. Icon stays link-blue (not TP green).
2. Confirm the **Innate Powers** heading has an **(i)** (`GuidedSectionTitle` addon). Tip: powers you can use without spending Energy; each must cost at or below Innate Threshold; Energy totals count against the Innate Energy pool.
3. Open **See more Innate Powers** (path L2) — footer Innate Energy pill has the same **(i)** and copy. Repeat on L3 Full Customize (heading + budget bar). Desktop + ~360px tap (layout-neutral hit; heading stays one line).
4. Advanced `/characters/new/advanced` Powers: no Innate Energy tracker / Innate Powers heading — do not expect these tips there.

**Expected**
- Copy lives in `tooltip-text.tsx` (`innateEnergyHelp` / `innatePowersHelp`) and matches GAME_RULES terms; one Innate Energy tip via `InnateEnergyPointStatus` (L1/L2/L3); Innate Powers heading tip on L1 + L3 via `InnatePowersHelpTip`.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T084 — Preview feats and path More details use names (TASK-732)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-732 |
| **Where** | Guided creator → Path (More details) → feats on preview strip/panel |
| **Needs** | A path with recommended weapons/gear; optional My Library item whose `docId` differs from `id` |

**Steps**
1. On Path L1, open **More details** for a path that lists weapons/armor/gear. Confirm each row shows the **item name**, not a raw UUID. If a My Library copy is the only match (draft key is `docId`), the name still appears.
2. Pick feats on Archetype Feats / Character Feat. Confirm the preview strip/panel feat line uses feat **names** (not ids). Unresolved feats are omitted rather than shown as UUIDs.
3. Desktop + ~360px: names remain readable (preview strip may side-scroll).

**Expected**
- Path More details equipment names resolve via official + My Library + `docId`.
- Preview feat labels never fall back to a raw id.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T085 — Choice card See more is keyboard-usable (TASK-734)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-734 |
| **Where** | Guided creator → Path L1 (or Species / Ancestry choice cards) |
| **Needs** | Keyboard; a card with truncated copy so **See more…** appears |

**Steps**
1. Tab to a path/species card, then Tab to **See more…**. Press Enter (and Space). Confirm the card **expands** and is **not** selected.
2. Tab to **See less** (if shown) and activate — card collapses without selecting.
3. Tab to **More details** (if present) — still opens the modal without selecting. Enter/Space on the card itself still selects.
4. Repeat at ~360px: See more remains tappable (≥44px on touch).

**Expected**
- See more / See less / More details never select the card from the keyboard. Card root announces “selected” in its accessible name when chosen.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T086 — Powered-Martial innate → powers → techniques walk (TASK-756)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-756 |
| **Where** | Guided creator → Powered-Martial path after Loadout |
| **Needs** | Powered-Martial path (innate + powers + techniques); desktop + ~360px |

**Steps**
1. Continue from Loadout. Confirm **Your Innate Powers** only — Innate Energy bar + innate help tips; no regular Powers list; no Show Innate+Powers filter. Continue stays enabled with Innate Energy remaining (soft warn).
2. Continue → **Your Powers** (non-innate). Innate Energy bar is gone; Training Points still count innate picks. Back returns to the innate screen with prior picks.
3. Continue → **Your Techniques**. Shared TP still includes innate + powers. Power-only drafts never reach this screen; Martial-only drafts skip innate/powers and land here from Loadout.
4. Chapter rail onto this step from a later chapter lands on the first inner screen; Back from Reveal/Your Hero resumes the last inner screen.
5. Repeat a custom (no path) Powered-Martial draft: same screen order with inline catalogs, not a combined list.

**Expected**
- Inner `powersPhase` matches loadout `equipmentPhase`. Shared TP. Deleted `innateScope` chrome. Desktop + ~360px.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T087 — Power gear screen optional See weapons hatch (TASK-757)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-757 |
| **Where** | Guided creator → path-based Power Loadout → Equipment |
| **Needs** | A Power path with no weapon recommendations; a Martial or Powered-Martial path with a weapon phase; Custom entry |

**Steps**
1. Choose the Power path and continue to Loadout. Confirm the first/main screen is **Equipment**, Power still has no armor screen, and a **See weapons** hatch appears at bottom-right on the same GuidedLayerNav row as **See more options**.
2. Open **See weapons**. Confirm the existing full-screen-on-mobile weapon selection modal opens with weapon headers, search, filters, Currency, and Training Points capped by current Armament Proficiency.
3. Pick and confirm a weapon. Confirm it remains selected when the modal is reopened, the Equipment screen remains the current phase, and the budget bar includes the weapon spend.
4. Continue to **Your Hero**, save, and open the character. Confirm the weapon appears by name in Loadout/inventory.
5. Repeat with Martial / Powered-Martial paths that already show a weapon phase, and with Custom/fullCatalog. Confirm none shows a duplicate **See weapons** hatch on Equipment.
6. Check desktop and ~360px: hatch is bottom-right, tappable (at least 44px on mobile), and the modal is usable full-screen without horizontal page overflow.

**Expected**
- Path-based Power users can optionally browse and save weapons without adding a weapon or armor phase to the main flow.
- Existing weapon-phase and Custom/fullCatalog flows do not duplicate the hatch; all picks use the existing loadout budget and persistence path.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T088 — Guided Skills defense + governing Ability (TASK-790)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-790 |
| **Where** | Guided creator → Skills |
| **Needs** | A path with remaining Skill Points; a multi-ability skill (e.g. Lockpick) if present |

**Steps**
1. Reach **Your Skills**. Confirm a **Defense Bonuses** grid below the skill list (Might / Fortitude / Reflexes / Discernment / Mental Fortitude / Resolve).
2. Spend 2 Skill Points on a Defense (+1). Confirm the Skill Point counter drops by 2 and Continue stays gated until remaining is 0.
3. If a skill shows more than one governing Ability, change the picker. Confirm the Skill Bonus updates.
4. Finish the funnel and save. On the sheet, confirm the Defense bonus and the chosen Ability persist.
5. Desktop + ~360px: Defense steppers and the Ability picker are usable (44px on touch).

**Expected**
- Guided no longer hard-saves default-zero `defenseVals` or first-listed Ability when the player chose otherwise.
- Same `DefenseBonusesCard` as Legacy/creature allocation. Desktop + ~360px.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T089 — Shared Legacy creator chrome (TASK-798)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-798 |
| **Where** | Guided Path L3 / Species L2; Legacy `/characters/new/advanced`; sheet Edit Species / Edit Archetype / identity |
| **Needs** | A forge-capable draft or saved character; a mixed-species pair optional |

**Steps**
1. Guided Custom Path L3: Power/Martial **AbilityPickButton**s still pick abilities (tooltips on).
2. Guided Species L2: **Mixed species** still opens the dual-select modal (`fullScreenOnMobile`); confirm a pair.
3. Guided Reveal: portrait crop + library pick still uses the same presenter as Legacy Finalize.
4. Legacy Ancestry: **TraitSection** chrome (header + SelectionToggle / choice picker) unchanged; path **PathHelpCard** still shows on path steps.
5. Sheet: Edit Archetype forge buttons, Edit Species ancestry TraitSection, and path identity PathHelpCard still match.
6. Confirm `/characters/new/advanced` still loads (do not treat this as a delete). Desktop + ~360px.

**Expected**
- One shared module each; no parallel copies under `character-creator/` for these five symbols.
- MixedSpeciesModal stays non-USM dual `<select>`s. Behavior unchanged from pre-move.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T090 — Shared MixedSpeciesSkillPicker (TASK-820)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-820 |
| **Where** | Legacy `/characters/new/advanced` mixed Ancestry; sheet Edit Species (mixed) |
| **Needs** | A mixed-species pair with combined skill options |

**Steps**
1. Legacy mixed Ancestry: **Species skills** still uses TraitSection-style rows with descriptions (clamp + See more when long). Toggles still select.
2. Sheet **Edit Species** (mixed): same picker in the ancestry step.
3. Confirm `/characters/new/advanced` still loads (do not treat this as a delete). Desktop + ~360px.

**Expected**
- One shared `MixedSpeciesSkillPicker` from `@/components/patterns`; no copy under `character-creator/`.
- Guided mixed skills stay `GuidedChoiceCard` (T079). Behavior unchanged from pre-move.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T091 — Guided sticky footer is opaque on phones (TASK-829)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-829 |
| **Where** | `/characters/new/guided` Path L1 (choice cards + sticky Back/Continue + chapter rail) |
| **Needs** | DevTools ~360px / ~390px; also `md+` (768+) |

**Steps**
1. Open Guided Path at ~390px (and 360px). Scroll a choice card under the sticky footer.
2. Confirm the footer bar is solid — no card title, art, or body text is visible through Continue / Back.
3. Confirm the last choice card can still scroll fully above the bar (no clipped control, no large empty strip).
4. Scroll a card under the sticky chapter rail. Confirm the rail is solid — no card content reads through it.
5. Resize to `md+` (768+). Confirm the frosted/translucent footer and rail look is unchanged from before this task.

**Expected**
- Below `md`: opaque footer (`bg-surface`) and chapter rail (`bg-background`); content does not read through either.
- `GuidedStepLayout` bottom padding still matches footer height (`pb-24` / `pb-32` with hints).
- Desktop/tablet `md+`: frosted `bg-surface/95` / `bg-background/95` unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-013-T092 — Chapter rail shows a C1 overflow affordance (TASK-848)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-013 |
| **Related task** | TASK-848 |
| **Where** | `/characters/new/guided` at **360** and **390** |
| **Needs** | — |

**Steps**
1. Open Guided Path at **360px**. Confirm the chapter rail (Foundation … Your Hero) side-scrolls with an edge fade and a **Show more chapters** chevron when later chapters are off-screen.
2. Click the chevron (or scroll the rail). Confirm the start fade/chevron appears after scrolling, and both hide when every chapter is in view.
3. Repeat at **390px**. Confirm the page itself does not side-scroll. Sticky footer (T091) still opaque.

**Expected**
- Overflowing chapter rails reuse `.tab-nav-scroll` / `TabNavOverflowScroller` (same chrome as underline tabs). Affordance unmounts when the rail fits. List-local scroll only.

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

Archived (TASK-718; not cited by Pending owner QA). Full steps: [`BUILD_VALIDATION_ARCHIVE.md`](archive/BUILD_VALIDATION_ARCHIVE.md#dev-v-014--codex-payload--roll-timestamp-task-378).

---

## DEV-V-015 — Library API typing (TASK-420)

Archived (TASK-718; not cited by Pending owner QA). Full steps: [`BUILD_VALIDATION_ARCHIVE.md`](archive/BUILD_VALIDATION_ARCHIVE.md#dev-v-015--library-api-typing-task-420).

---

## DEV-V-024 — Client error handling (TASK-479)

Convention: `ARCHITECTURE.md` § Client error handling. Automated helper coverage via `src/lib/api-client.test.ts` and `src/lib/auth-errors.test.ts`.

#### DEV-V-024-T001 — getErrorMessage unit coverage

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-024 |
| **Automated** | `npm test` — api-client.test.ts |

**Expected** — `getErrorMessage` returns Error/string/object messages and falls back when empty.

#### DEV-V-024-T002 — My Account surfaces profile load failure

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-024 |
| **Task** | TASK-479 |
| **Where** | `/my-account` |
| **Steps** | 1. Sign in. 2. Open My Account with a forced profile-load failure (e.g. temporary network block on the profile action) or confirm that a successful load shows no danger Alert. 3. On failure, press Retry and confirm reload is attempted without a full browser refresh. 4. Trigger password-reset email / picture upload error paths if easy. |
| **Expected** | Profile load failure shows a danger Alert + Retry (≥44px). User actions show inline error text — never succeed silently when Supabase returns `{ error }`. |
| **Report** | DEV-V-024-T002: PASS / FAIL / SKIP — |

#### DEV-V-024-T003 — Library delete/sync/add toast on failure

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-024 |
| **Task** | TASK-479 |
| **Where** | `/library` (My Library delete; Realms Library add; sync if available) |
| **Steps** | Force a failing mutation (offline or invalid id) on delete, duplicate, or add-to-library. |
| **Expected** | Error toast with a useful message; no silent no-op. Name lookup failures during creator save must not masquerade as “create new” when the API is down. |
| **Report** | DEV-V-024-T003: PASS / FAIL / SKIP — |

#### DEV-V-024-T004 — Auth error mapper unit coverage (TASK-540)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-024 |
| **Task** | TASK-540 |
| **Automated** | `npm test` — `src/lib/auth-errors.test.ts` |

**Expected** — SMTP / “confirmation email” failures are **not** labeled “Invalid email address.” Real invalid-format and already-exists / credentials / rate-limit cases map correctly.

#### DEV-V-024-T005 — Register accepts a normal email (TASK-540)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-024 |
| **Task** | TASK-540 |
| **Where** | `/register` |
| **Steps** | 1. Open Create Account. 2. Enter a normal address (e.g. `name+tag@gmail.com` or with a trailing space when pasting). 3. Fill password + accept terms. 4. Submit. |
| **Expected** | Field validation passes (trim/lowercase). If signup fails for send/SMTP reasons, Alert must **not** say “Invalid email address” — prefer a send-failure or generic message. Success → check-email or signed-in redirect. |
| **Report** | DEV-V-024-T005: PASS / FAIL / SKIP — |

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
| **Task** | TASK-379 · TASK-589 |
| **Where** | `/technique-creator` → Load |
| **Steps** | 1. Open Load. 2. Confirm columns include Action, Energy, Attack, Training Pts. 3. Select a technique → Load. |
| **Expected** | Same list UX as add-technique modal columns; form restores parts/attackMode/action correctly. Attack cell is the derived attack-mode label (Weapon / Unarmed / No Attack), not a tied-weapon name. |
| **Automated** | Header + column contract: `npm test` — `library-selectable-builders.test.ts` (TASK-589). Full Load→form restore remains manual. |
| **Report** | DEV-V-016-T002: PASS / FAIL / SKIP — |

#### DEV-V-016-T003 — Item / armament creator Load from Library

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-379 / TASK-810 |
| **Where** | `/item-creator` → Load |
| **Steps** | 1. Open Load. 2. Confirm **Weapons / Armor / Shields** tabs (no mixed All list). 3. Weapons: Damage column (Range is an expand chip). Armor: Damage Reduction column. Shields: Block + Damage. 4. Load a weapon, then switch to Armor and load an armor — form type fields follow the loaded kind. |
| **Expected** | Per-kind catalog select-density columns (no Type + Stat mixed list). Each load restores the correct item type fields. |
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

#### DEV-V-016-T008 — Codex Equipment Category / Currency / Rarity (TASK-723)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-723 |
| **Where** | `/codex` → Equipment; `/admin/codex` → Equipment |
| **Steps** | 1. Open Codex Equipment. 2. Confirm headers: Category, Currency, Rarity — no Cost, Damage, or Dmg. Red. columns. 3. Currency cells are plain numbers (no trailing “c”, not blue/highlighted). 4. Expand a mixed row: **no** required Damage / Damage Reduction / Weight fact chips (gear closed set, TASK-806). Named property chips may still appear when the row has properties. 5. Filters: optional min/max currency. With a character selected, optional “rarity this level can access” and “within currency” are **off** by default; turning them on narrows the list. 6. Admin Equipment: same three headers and plain Currency cells. |
| **Expected** | Mixed Codex/Admin browse is gear chrome (Category / Currency / Rarity). Combat facts belong on Official/sheet/guided armament lists, not this mixed list. Character filters are opt-in. |
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
| **Task** | TASK-437 / TASK-810 |
| **Where** | `/creature-creator` |
| **Steps** | 1. Select Powers → expand → `Duration …` chip when duration exists. 2. Select Inventory: no **All** tab; Weapons / Armor / Shields / Equipment. 3. Weapons tab: Damage column; expand a ranged weapon → Range chip (not a Range column, not a Damage chip). 4. Armor tab: Damage Reduction column; expand → Crit / Abl. Req. chips as applicable. |
| **Expected** | Inventory picker uses the same select-density catalog columns as sheet Add Weapon/Armor/Shield. Combat facts are never both a column and a chip. |
| **Report** | DEV-V-016-T010: PASS / FAIL / SKIP — |

#### DEV-V-016-T011 — My Library Enhanced Items tab shell (no sync/duplicate) (TASK-475)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-475 |
| **Where** | `/library` → My Library → **Enhanced Items** |
| **Needs** | Signed-in user; empty Enhanced Items tab OK, or at least one enhanced item for row actions |
| **Steps** | 1. Open **Enhanced Items** (tab immediately before Creatures) — search spans full row width; no “Sync with current patch” button (no empty sync gutter). 2. Empty state (if none): “Go to Crafting” CTA; with items: expand a row, Edit opens `/crafting/<id>`, Delete still prompts via parent. 3. Search filters by name/base/power; no Duplicate action on rows. 4. While loading, search/header may show with inline spinner (same as other My Library tabs — not a full-page-only spinner). |
| **Expected** | Shared list chrome only; no sync-all or duplicate UI; delete/edit unchanged; loading/error match other My Library shell tabs. |
| **Report** | DEV-V-016-T011: PASS / FAIL / SKIP — |

#### DEV-V-016-T012 — Mobile GLR name not squeezed by X/+ (TASK-536)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-536 |
| **Where** | `/library` → My Library → **Powers** (primary); also Armaments / add-X modal with `+` |
| **Needs** | Narrow viewport (~360px) or DevTools device mode; signed-in user with at least one power that has Remove (X) + Edit |
| **Steps** | 1. Open My Library → Powers at ~360px width. 2. Confirm each power name uses most of the row width left of the X (and thumbnail if present) — not character-by-character wrap in a thin strip with a large empty gap before Edit. 3. Confirm X and Edit sit together on the right (not X mid-row with empty fr space). 4. Spot-check Armaments and an add-X modal `+` the same way. |
| **Expected** | Below `lg`, GridListRow collapses empty desktop data-column tracks via `--glr-mobile-grid` (not overridden by inline `gridTemplateColumns`); name gets `minmax(0, 1fr)` beside action chrome. Desktop `lg+` alignment unchanged. |
| **Report** | DEV-V-016-T012: PASS / FAIL / SKIP — |

#### DEV-V-016-T013 — Mobile selection modal sticky Add Selected (TASK-541)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-541 |
| **Where** | `/characters/[id]` → Edit → Library → Add Power (or Add Feat / Add Skill); also creator Load from Library |
| **Needs** | Narrow viewport (~360px) or DevTools device mode below 768px; enough list items that the modal content overflows |
| **Steps** | 1. Open Add Power (or any UnifiedSelectionModal add-X) at ~360px width. 2. Confirm the modal is full-screen. 3. Scroll the item list. 4. Confirm **Cancel** and **Add Selected** (or Load) remain visible and pinned at the bottom of the screen without scrolling to reach them. 5. Select one or more rows → Add Selected still reachable and works. |
| **Expected** | Primary actions live in Modal `footer` (not scrolled children); footer stays sticky on `fullScreenOnMobile`; list scrolls above it. |
| **Report** | DEV-V-016-T013: PASS / FAIL / SKIP — |

#### DEV-V-016-T014 — Selection modal list-first Filters chrome (TASK-564)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-564 / TASK-815 |
| **Where** | `/characters/[id]` → Edit → Library → Add Power; also Add Feat, Add Skill, Add Equipment; spot-check creature creator Select Powers |
| **Needs** | Narrow viewport (~360px) and a desktop width; enough list items to scroll |
| **Steps** | 1. Open Add Power at ~360px. 2. Confirm **Search** + **Filters** on one row, and **Powers / Empowered Techniques** mode tabs always visible under search (not inside Filters). 3. Confirm a one-line source summary when Filters are closed (if source ≠ All). 4. Confirm several list rows are visible between chrome and the sticky footer. 5. Tap **Filters** — SourceFilter appears; mode tabs stay visible; Hide Filters collapses the panel. 6. Open Add equipment — custom-item form is visible under Search without opening Filters; Filters still holds SourceFilter / path only. 7. Open Add Feat — Filters starts collapsed; opening it reveals category/ability/checkboxes. 8. Spot-check Crafting (Armaments/Equipment always visible; source under Filters), creature Add feat (feat-source tabs always visible), and a creator Load modal (source under Filters). 9. Spot-check desktop: Filters not permanently expanded. |
| **Expected** | Primary mode tabs (and sheet equipment custom-add) via `scopeExtra` always visible; `headerExtra`/`filterContent` collapsed by default; list remains the dominant focus; sticky footer still works (T013). |
| **Report** | DEV-V-016-T014: PASS / FAIL / SKIP — |

#### DEV-V-016-T015 — Add-modal chrome declutter + leave-with-selection prompt (TASK-574)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-574 |
| **Where** | Guided creator → Powers → See more Innate Powers (or sheet Library → Add Power / Add Feat); also spot-check Load from Library |
| **Needs** | Narrow viewport (~360px) preferred; an account/character with selectable items |
| **Steps** | 1. Open Browse Innate Powers (or Add Power). 2. Confirm header has at most a **single short** help line under the title (innate: none). 3. Confirm the sticky footer sits flush under the list — no blank white strip above Cancel / Add Selected (or the Innate Energy badge). 4. Select 1–2 rows; tap **Cancel** (or X). 5. Confirm an **Add selected?** prompt appears; choose **Add Selected** and confirm picks apply. 6. Re-open, select again, dismiss via X → **Don't add**; confirm modal closes without applying. 7. Re-open, select again, dismiss the prompt with X; confirm the selection modal stays open with picks intact. 8. Spot-check a Load modal: prompt says **Load selected?** / **Don't load**. |
| **Expected** | No multi-sentence header help; no footer gap strip; leave-with-selection prompt on Cancel/X/backdrop/Escape when picks differ from open seed; Add confirms, Don't add discards, prompt X keeps browsing. |
| **Report** | DEV-V-016-T015: PASS / FAIL / SKIP — |

#### DEV-V-016-T016 — My Library search spans to sync button (session)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Where** | `/library` → My Library → **Powers** (primary); spot-check Techniques / Weapons |
| **Needs** | Signed-in user; at least one drifted item optional (sync button visible) |
| **Steps** | 1. Open My Library → Powers at desktop width. 2. Confirm search input grows to fill the row and ends at the **Sync with current patch** button (not a short fixed-width field). 3. Repeat at ~360px — search wraps above sync button if needed (`flex-wrap`). 4. Open **Enhanced Items** — search spans full width (no sync button). 5. Confirm tab bar order: … Shields → **Enhanced Items** → Creatures. |
| **Expected** | Codex-parity search toolbar; Search + Filters on one row; Enhanced Items label + order; Sync stays after Filters. |
| **Report** | DEV-V-016-T016: PASS / FAIL / SKIP — |

#### DEV-V-016-T017 — Add Power/Technique USM PowerTechniqueFilters compact (TASK-675)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-675 |
| **Where** | `/characters/[id]` → Edit → Library → **Add Power** / **Add Technique**; spot-check Advanced creator Powers/Techniques select modals |
| **Needs** | Signed-in character; library with multiple powers/techniques spanning categories / energy / action types |
| **Steps** | 1. Open **Add Power** at desktop + ~360px. 2. Open **Filters** — confirm shared `PowerTechniqueFilters` compact panel (Category, Max Energy, Max TP, Action Type, Action/Reaction, Innate Threshold / Eligible; Character filter + Available TP when a character is selected). 3. Confirm no nested second Filters toggle inside the panel. 4. Set Max Energy / Category / Innate Eligible and confirm the list narrows via `applyPowerTechniqueFilters` (same as Library browse). 5. Switch to Empowered Techniques — advanced P/T filters hidden. 6. Open **Add Technique** — same compact filters without power-only innate controls. 7. Spot-check Advanced creator Select Powers / Select Techniques modals match. |
| **Expected** | USM add-power/technique reuse Library `PowerTechniqueFilters` + apply helpers; guided L3 still uses innate-scope SelectFilter (not this panel). |
| **Report** | DEV-V-016-T017: PASS / FAIL / SKIP — |

#### DEV-V-016-T018 — Guided P/T budget rows via shared builders (TASK-691)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-691 |
| **Where** | `/characters/new/guided` → Powers or Techniques (L2 modal + L3 inline) |
| **Needs** | Signed-in; custom Power draft preferred |
| **Steps** | 1. Open Powers L3 (Full Customize) or L2 See more. 2. Confirm **L2/L3 columns match Official Library** (powers: Category / Energy / Action / Duration / Range / Area / Damage; techniques: Category / Energy / TP / Action / Attack / Damage). TP still shows as row totalCost. 3. Confirm path-name chips only while Archetype Path is filtering (no static Path badge), TP budget gates, and theoretical max-EN / innate threshold filtering still apply. 4. Expand a row — Parts & Proficiencies (not duplicate Action/Energy chips). 5. Spot-check Martial techniques Energy still kind-correct (DEV-V-050-T002). L1 cards may still show compact Action/Energy/TP facts. |
| **Expected** | L2/L3 shaped by Official list builders; L1 cards may still use `buildPowerTechniqueBudgetDisplay`; guided orchestration preserved (TASK-709). |
| **Report** | DEV-V-016-T018: PASS / FAIL / SKIP — |

#### DEV-V-016-T019 — Creature creator library source merge (TASK-712)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-712 |
| **Where** | `/creature-creator` → Select Powers / Techniques / Inventory |
| **Needs** | Signed-in account with at least one My Library power/item and matching Realms Library content (or an id collision you can spot) |
| **Steps** | 1. Open Select Powers with **All sources** — list includes Realms + My; if the same library id exists in both, only the Realms row appears. 2. Switch **Realms Library** / **My Library** — catalogs scope accordingly. 3. Open Select Inventory, add an armament, reopen the picker — that `docId` is hidden (already selected). 4. Empowered tab: duplicate `docId`s across My + Realms do not appear twice. 5. Guided keep-selected is unchanged (creature picker does not re-show a My-only item after switching to Realms). |
| **Expected** | Creature pickers use shared `mergeLibraryBySource` (public wins on id). Armament still hides selected ids; empowered still dedupes on `docId`. |
| **Report** | DEV-V-016-T019: PASS / FAIL / SKIP — |

#### DEV-V-016-T020 — Library tab counts + lazy per-tab rows (TASK-774)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-774 |
| **Where** | `/library` (My Library and Realms Library) |
| **Needs** | Signed-in user with items in more than one tab; also a guest / signed-out check |
| **Steps** | 1. Open `/library` signed in (My Library). Confirm tab badges show counts. In Network, first paint should request `/api/user/library/counts` plus **only the active tab’s** list (default Powers → `/api/user/library/powers`), not techniques/items/creatures/enhanced. 2. Switch to Weapons, then Armor — items list may load once and stay cached; counts stay. 3. Delete one power — Powers badge drops without a full reload. 4. Switch to Realms Library — badges come from `/api/official/counts`; first Realms tab loads only that collection. Enhanced Items is hidden. 5. Guest / signed-out: Realms read-only, no My Library toggle, no Add to library. |
| **Expected** | Badges use the counts endpoints (ADR-0015). Inactive tab row lists do not fetch on first paint. Create/delete updates counts. Enhanced stays My-Library only. |
| **Report** | DEV-V-016-T020: PASS / FAIL / SKIP — |

#### DEV-V-016-T021 — GLR density: browse vs play vs add-modal vs gear (TASK-807)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-807 |
| **Where** | `/library` Official Powers/Weapons; `/characters/[id]` Library Powers + Inventory weapons; sheet Add Power; `/codex` Equipment |
| **Needs** | Signed-in character with at least one power and one weapon; Codex equipment rows |
| **Steps** | 1. Official Library Powers: Category / Energy / Action / Duration / Range / Area / Damage columns (TP not a dense column). 2. Sheet Powers play: Action / Damage / Area / Duration columns; Energy is the far-right spend control, not a value column. 3. Add Power: Energy / Action / Duration / Area / Damage columns; expand → Range chip when ranged (not a `Range —` leftover). 4. Codex Equipment: Category / Currency / Rarity only; expand does **not** require Damage/DR/Weight chips. 5. Guided gear L2/L3 matches those three gear headers. ~360px + desktop. |
| **Expected** | One catalog + density mode drives column vs chip. Gear stays Category / Currency / Rarity columns. Armament combat facts stay on Official/sheet/guided loadout, not mixed Codex browse. |
| **Report** | DEV-V-016-T021: PASS / FAIL / SKIP — |

#### DEV-V-016-T022 — GLR never-both + chipFacts-driven add-modal chips (TASK-808 / TASK-809)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-808 / TASK-809 |
| **Where** | `/characters/[id]` → Edit → Library → Add Power / Add Weapon / Add Armor; Inventory armor row |
| **Needs** | Signed-in character; a ranged power, a ranged weapon, and armor with Critical Range +1 plus an ability requirement |
| **Steps** | 1. Add Power: columns Energy / Action / Duration / Area / Damage; expand a ranged power → **Range … Spaces** descriptor (not a Range column, not `Range —`). 2. Add Weapon: Damage column only; expand a ranged weapon → Range chip, no Range column. 3. Add Armor: Damage Reduction column; expand → Crit / Abl. Req. / Agility Red. as descriptor chips, **not** a duplicate Critical Range property chip. 4. Sheet Inventory armor: DR + Crit columns; expand → Strength/Agility requirement chips; **no** Critical Range property chip beside the Crit column. Desktop + ~360px. |
| **Expected** | Ranked facts come from `layout.chipFacts` (plus parts/properties). A valued fact is a column **or** a chip, never both. Feat Ability Requirements chips stay extra-chrome (`Strength 3+`, not the ranked `… Requirement N+` fact). |
| **Report** | DEV-V-016-T022: PASS / FAIL / SKIP — |

#### DEV-V-016-T023 — Separated armament lists (TASK-810)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-810 |
| **Where** | `/item-creator` Load; `/creature-creator` Inventory |
| **Needs** | Signed-in user with at least one weapon and one armor in My or Realms library (empty tabs OK to confirm copy) |
| **Steps** | 1. Armament Creator → Load: Weapons / Armor / Shields tabs; no combined Type+Stat list. 2. Creature Creator → Inventory: four selected lists (Weapons / Armor / Shields / Equipment) with sheet play columns; Add weapon/armor/shield/equipment opens the picker on that tab. 3. Picker has no All tab. Desktop + ~360px. |
| **Expected** | No mixed weapon+armor+shield gear list. Kind tabs drive catalog columns. Selected creature inventory is split the same way as sheet Library → Inventory. |
| **Report** | DEV-V-016-T023: PASS / FAIL / SKIP — |

#### DEV-V-016-T024 — Creature inventory document kind buckets (TASK-812)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-812 |
| **Where** | `/creature-creator`; Library → Creatures expand |
| **Needs** | Signed-in user; a saved creature that still has mixed `data.armaments` if available, plus a new creature with one weapon and one equipment item |
| **Steps** | 1. Creature Creator → add one weapon and one equipment item → Save. Reload `/creature-creator?edit=<id>`: items still sit in Weapons vs Equipment lists. 2. Equipment Qty is `-` unless that item actually has a quantity (do not show a fake 1). 3. Currency / TP summary still counts those items; picker hides already-selected ids. 4. Library → Creatures → expand the same creature: Weapons and Equipment sections match. 5. If an older creature with only `data.armaments` exists, Load it — kinds split correctly. Desktop + ~360px. |
| **Expected** | Saved document uses kind buckets, not a mixed armaments dump. Legacy `armaments[]` still loads. Stat block and creator lists stay in sync. Equipment Qty is blank/`-` until quantity is real data. |
| **Report** | DEV-V-016-T024: PASS / FAIL / SKIP — |

#### DEV-V-016-T025 — Creature EquipmentListSection Qty (TASK-813)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-813 |
| **Where** | `/creature-creator`; Library → Creatures expand |
| **Needs** | Signed-in user; a creature with one equipment item that has no stored quantity and one with Qty 2 (or set Qty on save) |
| **Steps** | 1. Library → Creatures → expand: Equipment is the shared list section (Type + Qty, not a second Qty column). Missing quantity is blank (not a fake 1 / stepper). Stored Qty 2 shows `2`. 2. Creature Creator → Inventory → Equipment: same blank / `2` (also `layout="creature"`). Sheet Inventory equipment steppers still default missing qty to 1. 3. Desktop + ~360px. Skip Legacy `/characters/new/advanced`. |
| **Expected** | Creator and stat-block Equipment Qty both use `EquipmentListSection` `layout="creature"` (`buildCreatureEquipmentColumns`). Character sheet steppers unchanged. |
| **Automated** | `npm test` — `entity-library-sections-columns.test.ts` + `map-creature-inventory-rows.test.ts` + `creature-inventory.test.ts` |
| **Report** | DEV-V-016-T025: PASS / FAIL / SKIP — |

#### DEV-V-016-T026 — GLR never-neither: demoted chips on sheet / Add Feat / Official (TASK-814)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-814 |
| **Where** | `/characters/[id]` Library Powers / Inventory / Feats; Add Feat; `/library` Official Powers |
| **Needs** | Signed-in character with a power that has parts + range, a feat with category/ability/req level, and inventory gear with rarity/cost; Official library powers |
| **Steps** | 1. Sheet Library → Powers: expand a power → **Category**, **Range**, **Training Points** descriptor chips (Energy stays the spend control, not a column or Total TP footer). 2. Inventory equipment: expand → rarity / currency / TP chips; no `Cost Nc` badge. 3. Feats play: expand → Req. Level / Category / Ability chips (Uses/Recovery stay columns when present). 4. Add Feat: Category / Ability / Uses / Recovery columns; expand → Req. Level chip. 5. Official Powers: TP is an expand chip, not a dense column and not Total TP in the expanded footer. Desktop + ~360px. |
| **Expected** | Overflow/demoted catalog facts appear as chips. A valued fact is a column **or** a chip **or** rightSlot, never both and never nowhere. Guided L2 still uses TP `rightSlot`/`totalCost` (`creatorBudget`). Skip Legacy `/characters/new/advanced`. |
| **Report** | DEV-V-016-T026: PASS / FAIL / SKIP — |

#### DEV-V-016-T027 — Path More details power/technique chips from GLR catalog (TASK-818)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-818 |
| **Where** | Guided creator → Path → **More details** on a Power path (Powers section) and a Martial path (Techniques section) |
| **Needs** | Codex paths that list at least one power and one technique with Energy / Action / Damage (and Range or Attack as applicable) |
| **Steps** | 1. Open More details on a Power path → expand a listed power. Confirm Name + Description columns only; Energy / Action / Duration / Range / Area / Damage / Category / Training Points appear as labeled descriptor chips when valued (not a Stats column, not `pushFact` leftovers like bare numbers). 2. Open More details on a Martial path → expand a listed technique. Confirm Attack / Energy / Action / Damage / Category / Training Points chips when valued. 3. Desktop + ~360px. Skip Legacy `/characters/new/advanced`. |
| **Expected** | Path More details combat rows use `detail-option-power` / `detail-option-technique` (`layout.chipFacts`). A valued catalog fact is a chip here (detail density has no ranked columns). Name+description stay identity columns. |
| **Automated** | `npm test` — `combat-builder.test.ts` |
| **Report** | DEV-V-016-T027: PASS / FAIL / SKIP — |

#### DEV-V-016-T028 — Gear play Training Points chip (TASK-825)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-825 |
| **Where** | `/characters/[id]` Library → Inventory equipment; `/creature-creator` selected Equipment; `/codex` Equipment; sheet Add equipment |
| **Needs** | Signed-in character with an equipment item that costs Training Points; a creature with selected equipment that has stored TP; Codex equipment rows |
| **Steps** | 1. Sheet Library → Inventory → Equipment: expand an item with valued TP → **Training Points N** chip. No TP column. No Total TP footer. 2. Creature Creator → Inventory → Equipment: same chip when stored TP is valued; Qty still blank / stored number (TASK-813). 3. Codex + Admin Equipment: headers stay Category / Currency / Rarity. Expand a row with valued TP → Training Points chip, not a fourth dense column. Add equipment modal: same three columns; expand → TP chip when valued. 4. An item with 0 TP has no Training Points chip. Desktop + ~360px. Skip Legacy `/characters/new/advanced`. |
| **Expected** | Gear play shows valued TP as a ranked chip (`character-sheet-gear`). Browse/select keep the three gear columns and demote TP. No new GLR surface id. |
| **Automated** | `npm test` — `glr-fact-catalog.test.ts` + `resolve-glr-fact-layout.test.ts` + `map-creature-inventory-rows.test.ts` + `equipment-list.test.ts` |
| **Report** | DEV-V-016-T028: PASS / FAIL / SKIP — |

#### DEV-V-016-T032 — Power/technique Category chips value-only (TASK-869)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-869 |
| **Where** | `/characters/[id]` Library → Powers or Techniques (expand row); Add Power/Technique modal; `/library` Official Powers browse (expand) |
| **Needs** | A power with a non-mechanic part category (e.g. Offense) and/or synthetic Damage category |
| **Steps** | 1. Expand a power on the sheet Library tab: Category descriptor chip reads `Offense` or `Offense, Damage` — not `Category Offense`. 2. Add Power modal: same value-only chip when Category is demoted to expand. 3. Official Library browse: **Category** column header still present; expanded chip stays value-only. 4. Sheet Feats expand: chip still reads `Category Utility` (labeled). Desktop + ~360px. Skip Legacy `/characters/new/advanced`. |
| **Expected** | Power/technique Category chips follow Action Type grammar (value only); column headers unchanged. Feat/gear Category chips keep the Category prefix. |
| **Automated** | `npm test` — `compact-facts.test.ts` + `glr-fact-catalog.test.ts` + `combat-builder.test.ts` |
| **Report** | DEV-V-016-T032: PASS / FAIL / SKIP — |

#### DEV-V-016-T033 — GLR expanded row reflow; Uses steppers do not overlap (TASK-898)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-898 |
| **Where** | `/characters/[id]` Library → Feats (edit mode with Uses steppers) at 360 / 390 / 768; spot-check Powers/Techniques/Inventory armaments with expanded rows |
| **Needs** | Character with feats that have Uses + Recovery; edit mode enabled for Uses steppers |
| **Steps** | 1. Expand a feat with Uses steppers + Recovery at 360px. Confirm Uses and Recovery appear in the expanded body only (not the collapsed header row). 2. Confirm Uses ± steppers do not overlap the Recovery label/value. 3. Repeat at 768 and 1024 (narrow sheet panel): expanded body still owns column facts; no header-track overlap. 4. Spot-check another GLR entity with steppers/chips on one row (power Energy spend, quantity stepper). Skip Legacy `/characters/new/advanced`. |
| **Expected** | Expanded column facts reflow/stack (`min-w-0`); interactive values (steppers) stack label above control; no same-row overlap at thin widths. |
| **Automated** | `npm test` — `grid-list-row-columns.test.ts`; `npm run verify:responsive` (54/54 responsive-layout probes) |
| **Report** | DEV-V-016-T033: PASS / FAIL / SKIP — |

#### DEV-V-016-T029 — GLR expanded mobile facts once; omit blanks (TASK-868)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-868 |
| **Where** | `/characters/[id]` Library → Feats at ~360px / ~390px (below `lg`); spot-check Codex feats |
| **Needs** | A character with mixed feats: one with Uses and Recovery, one with neither (or Uses `-`) |
| **Steps** | 1. Collapse a feat that has Uses and Recovery. Confirm those facts appear in the row header / mobile summary only. 2. Expand that feat. Confirm Uses and Recovery appear in the expanded body only — not still labeled in the collapsed header/summary. 3. Expand a feat with no Uses / Recovery (or `-`). Confirm those labels are absent from both header and body. 4. When expanded, column facts live in the body at every width (TASK-898); Uses steppers must not overlap Recovery — see DEV-V-016-T033. Skip Legacy `/characters/new/advanced`. |
| **Expected** | Column facts are collapsed summary/header **or** expanded body, never both. Blank / `-` / `none` values are omitted. |
| **Automated** | `npm test` — `grid-list-row-columns.test.ts` + `library-feat-rows.test.ts` |
| **Report** | DEV-V-016-T029: PASS / FAIL / SKIP — |

#### DEV-V-016-T030 — Armament Currency chips match Library market cost (TASK-870)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-016 |
| **Task** | TASK-870 |
| **Where** | `/library` Weapons/Armor/Shields; `/characters/[id]` Inventory weapons/armor/shields; Add Weapon/Armor/Shield; `/item-creator` cost summary |
| **Needs** | Signed-in character with a library weapon (or armor/shield) that has properties; Codex item properties loaded |
| **Steps** | 1. `/library` → Weapons: note a row’s **Currency** column. 2. Sheet Inventory → expand that weapon: the Currency descriptor chip is the same number (e.g. Currency 31), not the tiny property C sum / multiplier (2). 3. Add Weapon: expand the same item — same market Currency chip. Repeat Armor / Shields. 4. Item creator: **Currency cost (final)** matches that number; Currency sum (C) may still show the small C total. Desktop + ~360px. Skip Legacy `/characters/new/advanced`. |
| **Expected** | Weapon/armor/shield Currency chips and Library columns share `resolveItemMarketPricing` market cost. Do not display raw IP, option multipliers, or pre-rarity `costs.totalCurrency` as Currency. Codex Equipment still uses stored currency (not the IP formula). |
| **Automated** | `npm test` — `item-calc.test.ts` + `official-item-list.test.ts` + `library-selectable-builders.test.ts` + `equipment-catalog-rows.test.ts` + `equipment-currency.test.ts` |
| **Report** | DEV-V-016-T030: PASS / FAIL / SKIP — |

---

## DEV-V-027 — Admin Official Enhanced list shell (TASK-575)

Admin Official Enhanced uses the same OfficialEntityList chrome as peer Official*List tabs (powers/items/creatures/techniques), not a hand-rolled Search+ListHeader shell.

#### DEV-V-027-T001 — Official Enhanced list chrome + create modal

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-027 — Admin Official Enhanced list shell |
| **Task** | TASK-575 |
| **Where** | `/admin/public-library` → Enhanced Items |
| **Needs** | Admin account |
| **Steps** | 1. Open Enhanced Items. 2. Confirm SectionHeader + Search + sortable ListHeader match peer Official tabs (Armaments/Powers). 3. Confirm **New Enhanced Item** sits beside search. 4. Open New → modal still creates; Cancel closes. 5. If rows exist: Edit opens modal; Delete confirm still works. 6. Empty library: New remains available (not a dead-end empty-only page). |
| **Expected** | No parallel hand-rolled list shell; create/edit/delete unchanged; Enhanced badge on rows; empty + create still reachable. |
| **Report** | DEV-V-027-T001: PASS / FAIL / SKIP — |

---

## DEV-V-028 — Codex browse list shell (TASK-576)

Admin Codex tabs, Codex browse tabs (including Codex Archetypes header chrome), and Admin Images share `CodexBrowseListShell` (SectionHeader when admin + Search + filters + ListHeader + loading/empty/rows). Official* library grids stay on `OfficialEntityList`. **Admin** Archetypes path rows stay tab-local (ADR-0005). Admin entity CRUD (save / row actions / edit-modal footer) is ADR-0025 (TASK-842 / TASK-845), not an extension of the browse shell. TASK-849: one `COPY_NAME_SUFFIX`. TASK-827: Codex **Advanced** is `TabNavigation` `trailing` (T006). TASK-840: overflowing tab strips fade + chevron (T007).

#### DEV-V-028-T001 — Admin Codex Skills list chrome

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-028 — Codex browse list shell |
| **Task** | TASK-576 / TASK-849 / TASK-852 |
| **Where** | `/admin/codex` → Skills (spot-check Equipment + Creature Feats the same way) |
| **Needs** | Admin account |
| **Steps** | 1. Open Skills. 2. Confirm SectionHeader (+ Add) + Search + filters + sortable ListHeader. 3. Search/filter still narrows rows. 4. Add opens create modal; Cancel closes. 5. Empty filters: empty state still offers Add Skill. 6. Duplicate a skill — name ends with ` copy`; a “Creating a copy of {source}” banner includes “save to add the new skill”; Save / Delete / Cancel stay in the sticky footer. |
| **Expected** | Same chrome as peer admin codex tabs; Skills / Equipment / Creature Feat edit lives in co-located `admin-*-edit-modal` with `AdminCodexEditModalFooter`. Duplicate still appends ` copy` and shows `AdminCodexCopySourceBanner` (entity-specific “save to add the new …”). Create/edit/delete behavior unchanged. |
| **Report** | DEV-V-028-T001: PASS / FAIL / SKIP — |

#### DEV-V-028-T002 — Codex browse Skills peer

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-028 |
| **Task** | TASK-576 |
| **Where** | `/codex` → Skills (Realms Codex) |
| **Needs** | Signed-in user |
| **Steps** | 1. Open Skills. 2. Confirm Search + filters + ListHeader (no SectionHeader Add). 3. Search/filter still works. 4. Switch My Codex if present — empty state still not the browse shell. |
| **Expected** | Browse chrome matches admin minus Add header; my-mode empty unchanged. |
| **Report** | DEV-V-028-T002: PASS / FAIL / SKIP — |

#### DEV-V-028-T003 — Admin Images bank list uses shell

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-028 |
| **Task** | TASK-576 |
| **Where** | `/admin/images` |
| **Needs** | Admin account |
| **Steps** | 1. Open page. 2. Confirm PageHeader stays; Images SectionHeader + Search + category filter + thumbnail ListHeader. 3. Add image still opens edit modal. 4. Search/filter still narrows rows. |
| **Expected** | Same CodexBrowseListShell chrome; upload/edit/delete unchanged. |
| **Report** | DEV-V-028-T003: PASS / FAIL / SKIP — |

#### DEV-V-028-T004 — Codex Archetypes browse chrome on shell

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-028 |
| **Task** | TASK-576 |
| **Where** | `/codex` → Archetypes (Realms Codex) |
| **Needs** | Signed-in user |
| **Steps** | 1. Open Archetypes. 2. Confirm Search + sortable ListHeader match peer Codex tabs. 3. Search still filters paths; expand a path card still works. |
| **Expected** | Shell chrome; path-card bodies unchanged. Admin `/admin/codex` Archetypes may still use bordered non-ListHeader layout. |
| **Report** | DEV-V-028-T004: PASS / FAIL / SKIP — |

#### DEV-V-028-T005 — Admin Codex delete uses DeleteConfirmModal (TASK-799 / TASK-845 / TASK-842)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-028 — Codex browse list shell |
| **Task** | TASK-799 / TASK-845 / TASK-842 |
| **Where** | `/admin/codex` → any entity tab (Skills is enough) |
| **Needs** | Admin account |
| **Steps** | 1. Open Skills (or Feats). 2. Click a row’s trash icon. 3. Confirm a delete modal titled **Delete {name}?** with Cancel / Delete and copy that the entry is removed from your Codex — not “Click again to confirm delete” and not an inline **Remove? Yes/No** row. 4. Cancel — row remains. 5. Open the same row’s edit modal → footer **Delete** — same confirm modal. Footer **Save** is the Primary large button. 6. Confirm Delete on an unreferenced row — it disappears. 7. If you have a referenced row: confirm Delete, then the existing **still referenced / Delete anyway** modal still appears. 8. Add / Duplicate / Edit still open the same modal chrome. |
| **Expected** | First-step delete is `DeleteConfirmModal` on row trash and edit-modal Delete. Shared `AdminCodexRowActions` + `AdminCodexEditModalFooter` (ADR-0025). Referential-integrity gate unchanged. `/characters/new/advanced` still loads. |
| **Report** | DEV-V-028-T005: PASS / FAIL / SKIP — |

#### DEV-V-028-T006 — Codex Advanced does not cover the last tab (TASK-827)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-028 — Codex browse list shell |
| **Task** | TASK-827 |
| **Where** | `/codex` (Realms Codex) |
| **Needs** | Guest is enough. Check 360px, 390px, and a desktop window. |

**Steps**
1. Open `/codex` at **360px** and **390px**. Confirm **Advanced** sits **below** the tab strip, not on top of **Archetypes** (or any other tab).
2. Tap **Archetypes** — it activates. Tap **Advanced** — extra tabs appear; **Parts** / **Properties** / **Creature** use the short labels (not “Power & Technique Parts” etc.).
3. Resize to **md+** (~768 and 1280): **Advanced** sits in the tab bar to the right of the strip. Scroll the tabs if needed; **Advanced** does not cover a tab trigger.
4. Confirm `/characters/new/advanced` still loads.

**Expected**
- 0 overlap between tab triggers and **Advanced** at 360/390. `labelMobile` is used below `md`. Desktop bar is one row with Advanced outside the scrollport. No page-local tab strip.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-028-T007 — Tab strips show a C1 overflow affordance (TASK-840)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-028 — Codex browse list shell |
| **Task** | TASK-840 |
| **Where** | `/library` at 768 / 1024 / 1280; sheet Library tablist at 360 / 390 / 1024; `/codex` at 360 |
| **Needs** | Guest is enough for `/library` and `/codex`. Sheet check needs a loaded character with the Library section. |

**Steps**
1. Open `/library` at **1280px**. If a tab is cut off at the right edge, confirm a fade and a **Show more tabs** chevron — not a mid-word clip with no signal. Click the chevron (or use arrow keys) to reach the hidden tab. The chevron disappears when the strip is fully scrolled or does not overflow.
2. Repeat at **768** and **1024** (more tabs hidden). Keyboard: with a tab focused, ArrowRight selects the next tab and scrolls it into view.
3. Open a character sheet Library strip at **360** and **390**. Same fade/chevron when Feats/Powers/Techniques leave Inventory/Notes off-screen.
4. Confirm `/characters/new/advanced` still loads.

**Expected**
- Overflowing underline tab strips show an edge fade and a chevron (coarse chevron is 44px wide inside the fade, with ~8px of faded tab before unfaded labels). Affordance gone when fully scrolled or when everything fits. Arrow keys / chevrons scroll **the tablist only** (the sheet C1 carousel does not move). Codex **Advanced** still sits outside the tablist (T006).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

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

#### DEV-V-017-T003 — Rules page copy + view-source link

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-017 — Site copy modules |
| **Related task** | TASK-390 |
| **Where** | `/rules` |
| **Needs** | — |

**Steps**
1. Open `/rules`.
2. Confirm page title/description and “open in new tab” link text match `rules-copy.ts`.
3. Confirm the Google Doc is only that new-tab / view-source link (no iframe on the index).

**Expected**
- Copy and URLs come from `RULES_COPY`; `viewUrl` opens in a new tab. Chapter list uses first-party MDX routes.

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
| **Related task** | TASK-390, TASK-765 |
| **Where** | `/privacy` |
| **Needs** | — |

**Steps**
1. Open `/privacy`.
2. Confirm title, intro site URL, section headings (including **Cookies and Analytics**), and contact email match `privacy-copy.ts` / `SITE_CONTACT_EMAIL`.
3. Confirm Cookies and Analytics mentions Vercel Web Analytics / anonymous page views and essential (non-advertising) cookies.

**Expected**
- Prose and mailto use copy modules; heading hierarchy h1 → h2 with no skip.
- Section **3. Cookies and Analytics** is present between How We Use Information and Data Retention.

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

## DEV-V-018 — CreatorPageShell parity (TASK-380 / TASK-381 / TASK-616)

Verifies shared auth/load/save chrome on standalone creators after `CreatorPageShell` rollout.
T001–T007 focus on chrome parity (domain cost math out of scope). **T008** covers power/item
workspace-hook extraction parity after TASK-381 Phase 3 and TASK-616 co-located splits (cost-derivation + part/property modules; facades unchanged). **T009–T010** cover creature editor
islands (Phase 4) and workspace hook (Phase 5). **T012–T014** cover expanded headers without an empty summary line (TASK-764) and power creator InfoTippy (TASK-408).

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

#### DEV-V-018-T008 — Power + item workspace hook parity (TASK-381 Phase 3; TASK-616 splits)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 |
| **Related task** | TASK-381 / TASK-616 |
| **Where** | `/power-creator`, `/item-creator` (+ `?edit=<id>` when available) |
| **Needs** | Signed in; optional saved library power/armament |

**Steps**
1. Open `/power-creator` — set a name, add a part, tweak action/damage/range; confirm sidebar Energy/TP update; refresh — draft restores (same as DEV-V-019-T009).
2. Reset — form clears; draft cache cleared.
3. Load a saved power — form fills; success toast.
4. Repeat 1–3 on `/item-creator` for Weapon (and briefly Armor/Shield type switch) — IP/TP/currency + rarity sidebar update; draft restore; Load toast.
5. Optional: open `?edit=<id>` for each — loads target; navigating to plain `/power-creator` or `/item-creator` shows a blank draft (no edit leak).

**Expected**
- Behavior matches pre–Phase 3 / pre–TASK-616 (state lives in `use-*-creator-workspace` + co-located cost/part modules; page is shell-only).
- No regression vs DEV-V-018-T001/T002 chrome or DEV-V-019-T009/T010 bootstrap.

**Rollback** — Delete `use-*-creator-workspace.ts` and restore prior page bodies from git; keep editor islands + bootstrap.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-018-T009 — Creature creator editor islands (TASK-381 Phase 4; TASK-610 splits)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 |
| **Related task** | TASK-381 / TASK-610 |
| **Where** | `/creature-creator` (+ `?edit=<id>` when available) |
| **Needs** | Signed in; optional saved library creature |

**Steps**
1. Open `/creature-creator` — set name, allocate HP/EN and an ability; add a resistance; refresh — draft restores (DEV-V-019-T010).
2. Add feat / power / technique / inventory via section buttons — modals open; confirm adds rows; remove X and innate toggle work.
3. Reset confirm still clears form (DEV-V-018-T005).
4. Optional: `?edit=<id>` loads target; plain `/creature-creator` shows blank draft.

**Expected**
- Form sections render from `creature-creator-editor` facade + co-located `creature-creator-editor-{traits,loadout}-sections.tsx`; shell/modals/sidebar unchanged.
- No regression vs T005 chrome or T010 bootstrap.

**Rollback** — Delete `creature-creator-editor-{traits,loadout}-sections.tsx` and restore monolithic `creature-creator-editor.tsx` from git.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-018-T010 — Creature creator workspace hook (TASK-381 Phase 5; TASK-610 / TASK-615 splits)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 |
| **Related task** | TASK-381 / TASK-610 / TASK-615 |
| **Where** | `/creature-creator` (+ `?edit=<id>` when available) |
| **Needs** | Signed in; optional saved library creature |

**Steps**
1. Repeat DEV-V-018-T009 smoke (draft restore, add/remove feat/power/technique/inventory, innate toggle, reset confirm).
2. Over-budget save still blocked with error toast (DEV-V-018-T005).
3. Optional: `?edit=<id>` then navigate to plain `/creature-creator` — blank draft (no edit leak).

**Expected**
- State lives in `use-creature-creator-workspace` + co-located `creature-creator-{library-selectables,derived-stats,feat-armament-display,skill-bonus,summaries}.ts`; page is shell + modal/editor wiring only.
- No regression vs T005 / T009 / DEV-V-019-T010.

**Rollback** — Delete co-located workspace modules and restore monolithic `use-creature-creator-workspace.ts` from git; keep editor islands.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-018-T011 — Species creator skill labels are names (TASK-732)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 |
| **Related task** | TASK-732 |
| **Where** | `/species-creator` |
| **Needs** | Signed in; Codex skills loaded |

**Steps**
1. Pick two base skills. Confirm the sidebar Skills line and the Base skills summary show **skill names** (or **Any** for the any-skill option).
2. If a stale/unknown skill id is on the form (optional), confirm it is omitted — not shown as a UUID.

**Expected**
- Skill labels resolve via `findByNormalizedId`; unmatched ids do not appear as raw UUIDs.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-018-T012 — Expanded creator section headers drop empty summary line (TASK-764)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 |
| **Related task** | TASK-764 |
| **Where** | `/power-creator` (spot-check `/technique-creator` or `/item-creator`) |
| **Needs** | None |

**Steps**
1. Open Power Creator. Confirm collapsible sections start **collapsed** with a one-line summary under the title (title size matches other creator section titles — not `text-sm`).
2. Expand Attack, Action Type, and Damage. Confirm the expanded header is still the same title size/padding, with **no empty second line** under the title, and content starts immediately below.
3. Collapse again — summary line returns. Spot-check Technique or Item creator the same way.

**Expected**
- Expanded `CollapsibleSection` headers keep original `p-4` + `font-bold` / `h2` `text-title` chrome; they do **not** shrink titles to `text-sm`.
- When expanded with no `subtitle`, the reserved empty summary slot is gone (`min-h-[1.25rem]` / `&nbsp;` not shown).
- Collapsed summaries remain readable. Desktop Enable/Remove stay 44px; title row is not shrunk.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-018-T013 — Power creator Attack selector is not titled twice (TASK-764)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 |
| **Related task** | TASK-764 |
| **Where** | `/power-creator` |
| **Needs** | None |

**Steps**
1. Expand **Attack**.
2. Confirm the section header says Attack and the dropdown has no second visible “Attack” label above it.
3. Confirm the dropdown is still named for assistive tech (`aria-label="Attack"`).

**Expected**
- One visible Attack title (the collapsible header). Inner select has no redundant field label.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-018-T014 — Power creator InfoTippys from owner draft (TASK-408)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 |
| **Related task** | TASK-408 |
| **Where** | `/power-creator` |
| **Needs** | None |

**Steps**
1. Confirm an `(i)` sits beside Description, Action Type, Reaction, Attack, Area of Effect, Duration, Power Parts, Power Mechanics, and Damage.
2. Confirm Energy Cost and Training Points boxes in the summary have `(i)`; Innate Power has an `(i)` under those boxes; Load and Reset in the toolbar each have an `(i)`.
3. Hover/focus/touch-hold Description, Attack, Energy, Innate, and Load — copy matches the owner draft (fireball example; weapon-as-part-of-the-action; rounded-up Energy; L1 threshold 8/6; load from library).
4. Repeat one tip at ~360px (touch-hold). Confirm the `(i)` does not stretch the section title row.

**Expected**
- All listed advanced fields have accessible InfoTippy copy from `tooltip-text.tsx`.
- Guided L1 placeholder strings exist in `tooltip-text.tsx` but are **not** wired on this page.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-018-T015 — Creature Type/Size and Codex search truncate with an ellipsis (TASK-832)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 — CreatorPageShell parity |
| **Related task** | TASK-832 |
| **Where** | `/creature-creator` and `/codex` at 360px and 390px |
| **Needs** | Signed-in for creature creator |

**Steps**
1. Open Creature Creator at 390px. Confirm Type and Size selected values end with an ellipsis instead of a mid-word cut (e.g. not "Huma" / "Medi" with no ellipsis).
2. Open `/codex` → Feats at 390px. Confirm the search field shows **Search...** (or a truncated placeholder with an ellipsis), not "Search names, tags, descri".

**Expected**
- Overflowing select values use `text-overflow: ellipsis`. Codex browse placeholders are short or ellipsized. Desktop is unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-018-T016 — Creature ability steppers stay inside their tiles (TASK-828)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 — CreatorPageShell parity |
| **Related task** | TASK-828 |
| **Where** | `/creature-creator` at 360px and 390px (touch emulation) |
| **Needs** | DevTools responsive + coarse pointer |

**Steps**
1. Open Creature Creator at 390px with touch emulation. Scroll to Abilities.
2. Confirm STR/VIT/AGI/ACU/INT/CHA ± controls sit inside their tiles and do not overlap the neighbouring cell.
3. Repeat at 360px. At `sm` (640px+) the grid is three-across; six-across starts at `lg` (1024px), not 768. Advanced `/characters/new/advanced` Abilities stay full names (not compact short codes).

**Expected**
- Compact tiles use 2 columns below `sm`, 3 from `sm`, 6 from `lg`. Painted steppers stay inside the tile. Sheet ability grid is unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-018-T017 — Creature Creator has no page overflow from Roll Log (TASK-826)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 — CreatorPageShell parity |
| **Related task** | TASK-826 |
| **Where** | `/creature-creator` at 360px and 390px |
| **Needs** | DevTools responsive; FAB visible |

**Steps**
1. Open Creature Creator at 360px. Confirm the page does not scroll horizontally (`document.documentElement.scrollWidth <= clientWidth`).
2. Confirm the dice FAB is tappable in the bottom-right dock. Open the Roll Log — the panel fits the viewport (gap on both sides); close it and confirm no off-screen “Roll Log” heading remains in the accessibility tree.
3. Repeat at 390px.

**Expected**
- Closed Roll Log is unmounted. Open panel width is `min(22.5rem, 100svw − 2×gap)`. FAB stays reachable. Skills table scrolls inside TableScroll; the page does not. No new shared/ui dock.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-018-T018 — Item creator handedness is SegmentedControl (TASK-866)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-018 — CreatorPageShell parity |
| **Related task** | TASK-866 |
| **Where** | `/item-creator` Weapon Configuration (Handedness) |
| **Needs** | DevTools responsive + coarse pointer at 360/390; a fine-pointer desktop window |

**Steps**
1. Open `/item-creator`, choose Weapon, expand Weapon Configuration. Confirm One-Handed / Two-Handed is shared `SegmentedControl` (same chrome as SourceFilter / the Load Armament type tabs), not two custom `min-h-[44px]` warning-fill buttons.
2. Toggle both options: IP/TP/currency badge and `isTwoHanded` still update; save/load still persist handedness.
3. Touch emulation at 390px: the control is ≥44px tall (Standard). Fine-pointer desktop stays compact (no always-on 44 slab).
4. Confirm `/characters/new/advanced` still loads.

**Expected**
- One SegmentedControl; pointer tiers, not viewport or always-on 44. No second segmented primitive.

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

#### DEV-V-019-T004 — Library scope + Enhanced Items tab clamp

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-019 |
| **Related task** | TASK-430 |
| **Where** | `/library` |
| **Needs** | Signed-in user with at least one Enhanced item (or empty Enhanced Items tab OK) |

**Steps**
1. Open `/library` signed in — defaults to My Library (unless `?view=realms`).
2. Switch to **Enhanced Items** tab, then SegmentedControl → Realms Library — active tab becomes Powers (Enhanced Items hidden); content is not blank.
3. Switch back to My Library — Enhanced Items is available again; if you left Realms with Powers selected, Enhanced Items is not auto-restored (state was clamped).
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

#### DEV-V-019-T008 — Create-time Library tab hide for power/martial-only

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-019 |
| **Related task** | TASK-501 |
| **Where** | Guided or advanced character creator → character sheet Library |
| **Needs** | Create a new level-1 Power-only and Martial-only character |

**Steps**
1. Create a **Power** archetype character (guided or advanced); open the sheet → Library (view mode, not edit).
2. Confirm **Techniques** is not shown; **Powers** is shown.
3. Enter edit mode → Library → eye-toggle **Techniques** back on; leave edit — Techniques visible.
4. Create a **Martial** archetype character; confirm **Powers** is hidden and **Techniques** is shown (unhide via edit as above).
5. Optional: Powered-Martial character — both Powers and Techniques tabs visible by default.

**Expected**
- Defaults come from `libraryTabVisibility` set at create (`defaultLibraryTabVisibilityForArchetype`); same hide prefs as the existing eye toggle.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-019-T009 — Power creator draft restore + ?edit= bootstrap (batch 4 remount)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-019 |
| **Related task** | TASK-430 |
| **Where** | `/power-creator` (+ `?edit=<id>`) |
| **Needs** | Account with at least one saved power |

**Steps**
1. Open `/power-creator`; set name, add a part, set damage/range/duration; refresh the page — draft restores.
2. Load a saved power via Load modal — all fields replace the draft; "Power loaded successfully!" shows.
3. From My Library, open a power's Edit link (`/power-creator?edit=<id>`) — the power loads; make no changes; navigate to plain `/power-creator` — a **blank** creator shows (edit mode clears the draft cache and does not autosave; behavior change from pre-batch-4, where the edited power leaked into the draft).
4. Open `?edit=<invalid-id>` — blank creator renders (no infinite spinner).
5. Simulate parts API failure (offline/devtools) — error message with **Try again** renders instead of a spinner.

**Expected**
- Draft cache round-trips on refresh; `?edit=` remounts the workspace per id; error and missing-row paths never hang on the loading state.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-019-T010 — Technique / item / empowered / creature creators draft restore + ?edit= bootstrap (batch 4 complete)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-019 |
| **Related task** | TASK-430 |
| **Where** | `/technique-creator`, `/item-creator`, `/empowered-technique-creator`, `/creature-creator` (+ `?edit=<id>`) |
| **Needs** | Account with at least one saved technique, armament, empowered technique, and creature |

**Steps** (repeat per creator)
1. Open the creator; fill several fields (name, parts/properties, damage, weapon/type where present); refresh — draft restores, including part rows and weapon/type selection.
2. Load a saved row via the Load modal — all fields replace the draft; the "loaded successfully" message shows.
3. Open the creator with `?edit=<id>` — the row loads; navigate to the plain creator URL — a **blank** creator shows (edit mode clears the draft cache and does not autosave; same behavior change as T009).
4. Open `?edit=<invalid-id>` — blank creator renders, no hang.
5. Simulate reference-data API failure (offline/devtools) — error message with **Try again** renders (technique/item/empowered) instead of an endless spinner.

**Creator-specific checks**
- Technique: saved No Attack / weapon-TP techniques restore the right Weapon selection on load and `?edit=`.
- Item (armament): switching Weapon/Armor/Shield type still drops incompatible properties and clears the ability requirement; editing a **shield** via `?edit=` now restores Shield Block / Shield Damage dice (old bug); loading via the Load modal now restores the item's image (previously dropped).
- Creature: `?edit=` shows the loading state until the creature is ready (no blank-form flash); no "loaded" toast on `?edit=` (parity with the other creators).

**Expected**
- Draft caches round-trip per creator; `?edit=` remounts per id; edit mode never writes the loaded row into the draft cache.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-019-T011 — Crafting bootstrap + modal/sheet derive (batch 5)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-019 |
| **Related task** | TASK-430 · TASK-607 (facade smoke) |
| **Where** | `/crafting/<sessionId>`, any large Modal, character sheet header HP/EN, Archetype PoweredMartialSlider |
| **Needs** | Crafting session (or create one); character with powered-martial archetype |

**Steps**
1. Open an existing crafting session — tool loads (no blank flash); change quantity/options — requirements update; refresh — session restores.
2. Enhanced session: pick a power whose library name/energy differs from the stored ref — sidebar Power Energy / Effective Energy show the **live** values without waiting for a save.
3. Open any selection/settings Modal — backdrop fades in; Escape closes; body scroll restores.
4. On a character sheet: click HP (or EN) value, type a number, Enter — value applies; blur without Enter — value resets to current.
5. In Archetype edit, drag PoweredMartialSlider — allocation updates; leave and re-enter edit — slider matches saved martial/power.

**Expected**
- No hydrate flash on crafting; live power metadata; modal portal still works after `useIsClient`; ResourceInput and slider stay controlled without sync effects.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-019-T012 — Admin/account queries + selection modal reopen (batch 6)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-019 |
| **Related task** | TASK-430 |
| **Where** | `/admin/changelogs`, `/admin/roles`, `/admin/users`, `/campaigns?tab=join`, `/my-account`, any UnifiedSelectionModal, Admin Images edit |
| **Needs** | Admin account; any character sheet Add modal |

**Steps**
1. Admin Changelogs — switch tabs; list loads; force offline then Retry recovers.
2. Admin Roles / Users — pages load; Roles edit+save still works; Users role change still works; Retry on error.
3. Open `/campaigns?tab=join` — Join tab is active.
4. My Account — profile loads; Retry works if profile fetch fails; change profile picture still updates avatar.
5. Open an Add-X UnifiedSelectionModal, select items, close without confirm (leave prompt if dirty), reopen — search/filters reset; prior unconfirmed picks are gone.
6. Admin Images — open edit on a row, change name fields, close, open create — form is blank (remount).

**Expected**
- No fetch-in-effect regressions; URL tab deep-link works; USM/image edit reset on open without wiping mid-session selection on re-render.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-019-T013 — Final leftovers: crafting FSM, sheet tour, core-rules, spreadsheet (batch 7)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-019 |
| **Related task** | TASK-430, TASK-617 |
| **Where** | `/crafting/<id>`, `/characters/<id>?offerTour=1`, sheet tour, `/admin/core-rules`, Admin Codex spreadsheet |
| **Needs** | Crafting session with rolls; path character L5+ optional; admin |

**Steps**
1. Crafting: change quantity/options — DS/session labels update; enter rolls; change Difficulty Score Bonus — success/failure chips update live; Complete saves correct netDelta.
2. Open character with `?offerTour=1` (tutorials on) — offer modal shows; URL loses the query; Start/Dismiss work; retake via Character settings (gear) → Take the tour again.
3. Sheet tour: advance steps — highlights move; Skip completes; reopen tour later starts at step 1.
4. Admin Core Rules: switch tabs — editor reseeds; edit a field (dirty); Save; switch away and back — saved values show.
5. Admin Codex spreadsheet: switch entity tabs — rows reload; edit a cell (dirty); tab switch clears dirty for the new tab.

**Expected**
- Zero `react-hooks/set-state-in-effect|exhaustive-deps|preserve-manual-memoization` warnings sitewide; no behavior regressions on the above flows.

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
3. Confirm How it Works steps are **Create a character**, **Find a table**, **Start playing** (no Archetype Path / Species / Feats jargon).

**Expected**
- No em dashes in visible hero/how-it-works copy.
- Landing how-it-works uses visitor language; system terms belong in the creator, not these three steps.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-020-T002 — Chooser Custom card is player-facing

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-020 |
| **Related task** | TASK-439, TASK-784 |
| **Where** | `/characters/new` |
| **Needs** | — |

**Steps**
1. Open `/characters/new`.
2. Read the **Custom** card tagline and bullets.

**Expected**
- Tagline is **Fully customizable archetype and Loadout, built step by step.**
- Bullets explain choosing your own archetype type and abilities, then species, Feats, and Loadout — no Layer 3, cohesive creator, Forge, or other backend speak.
- No em dashes in Custom card copy.

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

#### DEV-V-020-T004 — Dense HUD uses Health / Energy (not HP / EN)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-020 |
| **Related task** | TASK-440 |
| **Where** | Library → Creatures; encounter CombatantCard (compact); Creature Creator summary |
| **Needs** | Signed-in; a creature in My Library or Official; an encounter with a combatant; Creature Creator open |

**Steps**
1. Open Library → Creatures list; confirm column headers say **Health** and **Energy** (not HP / EN).
2. Open an encounter with a combatant in compact card layout; confirm resource labels say **Health** and **Energy**.
3. Open Creature Creator with stats computed; confirm summary quickStats chips say **Health** and **Energy**.

**Expected**
- Dense resource HUD labels use full Realms terms Health / Energy.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-020-T005 — No player-facing Gear for Equipment or Armaments (TASK-872)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-020 |
| **Related task** | TASK-872 |
| **Where** | `/`; `/characters/new/advanced` Equipment step; sheet tour Library step; Admin Codex archetype guided Equipment |
| **Needs** | Signed-in for Advanced + Admin; a saved character for the sheet tour |

**Steps**
1. Open `/` uniqueness cards: character-creation body uses **Loadout** (not Gear); second card title is **Custom Powers & Armaments**.
2. Open `/characters/new/advanced` Equipment step: body says weapons, armor, and **Equipment**.
3. On a sheet tour Library step (or `onboarding-copy.ts` Library body): Feats / Powers / Techniques / Equipment / Armaments — not Gear.
4. Admin Codex → Archetypes → guided recommended Equipment: label **Recommended Equipment** (not adventuring gear).
5. Creature or sheet Equipment Type cell for `adventuring_gear` shows **Equipment**, not Adventuring Gear (TASK-873 will drop the Type column on the sheet).

**Expected**
- Player-facing copy uses Equipment, Armaments, or Enhanced items — never Gear as a bucket name.
- Settings cog copy may still say “gear icon”; that is the Lucide icon, not the game term.

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

#### DEV-V-021-T004 — Chip / GLR body tap toggles expand (not header-only)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-021 |
| **Related task** | TASK-539 |
| **Where** | `/dev/styleguide` → Expandable Chips; Library / Codex list at ~360px |
| **Needs** | — |

**Steps**
1. Styleguide → **Expandable Chips**: expand a chip via the **header**, then tap the **description body** — chip collapses (collapsed chips have no body, so expand still starts from the header).
2. On a chip with Options: open Options; tapping the Options control or option list must toggle Options only — it must **not** collapse the chip.
3. At ~360px (Library Powers or Codex feats): tap the **mobile summary** under a collapsed row — row expands. Tap the expanded **description** (not a chip or button) — row collapses.
4. With a row expanded, tap a nested property/part **chip header or body** — chip toggles; the **row** stays expanded.

**Expected**
- ExpandableChip: header or expanded body toggles; Options / nested controls excluded.
- GridListRow: header, mobile summary, or non-interactive expanded body toggles; chip groups and action buttons do not collapse the row when used for their own actions.
- Stable vertical expand (T001/T002) still holds.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-022 — Characters list page (TASK-469)

Archived (TASK-718; not cited by Pending owner QA). Full steps: [`BUILD_VALIDATION_ARCHIVE.md`](archive/BUILD_VALIDATION_ARCHIVE.md#dev-v-022--characters-list-page-task-469).

---

## DEV-V-023 — Admin Realms Image Library (TASK-493)

**Related tasks:** TASK-493  
**Start URL:** `/admin` → **Open Image Library**  
**Needs:** Admin account  

#### DEV-V-023-T001 — Admin dashboard links to Image Library

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-023 |
| **Related task** | TASK-493 |
| **Where** | `/admin` |
| **Needs** | Admin account |

**Steps**
1. Sign in as admin and go to **Admin**.
2. Find the **Realms Image Library** card and click **Open Image Library**.

**Expected**
- Navigates to `/admin/images` with page title **Realms Image Library**.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-023-T002 — Upload image with name and category tags

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-023 |
| **Related task** | TASK-493 |
| **Where** | `/admin/images` |
| **Needs** | Admin account |

**Steps**
1. On `/admin/images`, click **+** (Add image).
2. Enter a name, add at least two category tags (e.g. **Weapon** and **Equipment**).
3. Click **Upload & crop**, pick a square image, confirm crop, then **Add image**.

**Expected**
- New row appears in the list with thumbnail, name, and category labels.
- Thumbnail click opens preview (ExpandableImage).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-023-T003 — Rename and retag without re-upload

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-023 |
| **Related task** | TASK-493 |
| **Where** | `/admin/images` |
| **Needs** | Image from T002 |

**Steps**
1. Edit the image from T002 (pencil icon).
2. Change the name and add/remove a category tag.
3. Click **Save changes** without using **Replace image**.

**Expected**
- List updates with new name and tags; same thumbnail URL (no re-upload).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-023-T004 — Replace image updates master asset

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-023 |
| **Related task** | TASK-493 |
| **Where** | `/admin/images` edit modal |
| **Needs** | Image from T002 |

**Steps**
1. Open edit modal for the test image.
2. Click **Replace image**, crop a different file, confirm.
3. Close modal and confirm list thumbnail shows the new art.

**Expected**
- Toast confirms replace; thumbnail updates (cache-busted URL).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-023-T005 — Delete shows usage warning and removes asset

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-023 |
| **Related task** | TASK-493 |
| **Where** | `/admin/images` |
| **Needs** | Image from T002 (unused or with known usages) |

**Steps**
1. Edit the test image and click **Delete**.
2. Confirm the delete modal lists usage count (0 or referenced entities).
3. Confirm **Delete image** removes the row from the list.

**Expected**
- Delete modal warns about clearing references; image removed from bank after confirm.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-023-T006 — Search and category filter

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-023 |
| **Related task** | TASK-493 |
| **Where** | `/admin/images` |
| **Needs** | At least two images with different category tags |

**Steps**
1. Add filter tag **Power** and confirm only power-tagged images show.
2. Clear filter, search by partial name.

**Expected**
- Category filter and name search narrow the list correctly.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-025 — ExpandableImage adoption (TASK-478)

Meaningful inline art uses shared click-to-enlarge; justified exceptions stay documented in `guide/03-entity-card-art.md`.

#### DEV-V-025-T001 — Creature stat-block portrait expands

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-025 |
| **Related task** | TASK-478 |
| **Where** | Encounter or creature view that shows `CreatureStatBlock` with art |
| **Needs** | Creature (or encounter creature) with an `imageUrl` |

**Steps**
1. Open a creature/stat-block surface that shows a portrait.
2. Click the portrait.

**Expected**
- Preview modal opens with the enlarged creature art (`ExpandableImage`).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-025-T002 — Campaign roster chip portrait expands

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-025 |
| **Related task** | TASK-478 |
| **Where** | `/campaigns/[id]` |
| **Needs** | Campaign with at least one character that has a portrait |

**Steps**
1. Open the campaign detail roster.
2. Click a character chip portrait (not the sheet link).

**Expected**
- Preview modal opens; View sheet / remove controls still work.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-025-T003 — Account profile photo expands

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-025 |
| **Related task** | TASK-478 |
| **Where** | `/my-account` |
| **Needs** | Signed-in user with a profile picture |

**Steps**
1. Open **My Account**.
2. Click the circular profile photo.
3. Confirm **Change Picture** still opens the crop upload modal.

**Expected**
- Photo click opens ExpandableImage preview; Change Picture remains the upload path.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-025-T004 — CreatureStatBlock weapon attack ability parity (TASK-604)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-025 |
| **Related task** | TASK-604 |
| **Where** | Encounter or library creature view that shows `CreatureStatBlock` Weapons; optional: character sheet equipped weapon Attack column |
| **Needs** | Creature (or draft) with known abilities + martial proficiency and weapons covering melee, Finesse, ranged, and Thrown when available |

**Steps**
1. Open a creature/stat-block with a plain melee weapon — confirm Attack = Strength + Martial Proficiency.
2. Open (or add) a Finesse weapon — confirm Attack = Agility + Martial Proficiency.
3. Open (or add) a ranged non-Thrown weapon — confirm Attack = Acuity + Martial Proficiency.
4. If a Thrown weapon is available — confirm Attack uses Strength (not Acuity) + Martial Proficiency.
5. Optional: same properties/abilities on a character sheet weapon row — Attack matches the creature display.

**Expected**
- No local attack-bonus fork in `creature-stat-block.tsx`; bonuses match `getWeaponAttackBonusFromProperties` / sheet helper for the same inputs.
- Vitest `weapon-attack-ability.test.ts` covers the shared bonus path (melee / finesse / ranged / thrown).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-026 — Realms Image Library wiring (TASK-496–499, TASK-531–533)

Admin/creator editors, user `image_id` parity, legacy catalog migration, portrait/profile bank pick, soft theme matte for transparent art, and sitewide art-capable GLR list thumbs.

#### DEV-V-026-T001 — Admin species/equipment use RealmsImageField

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-026 |
| **Related task** | TASK-496 |
| **Where** | `/admin/codex` → Species / Equipment |
| **Needs** | Admin account |

**Steps**
1. Open Species editor for a row with art (or upload via picker).
2. Confirm **Choose from library** / picker opens (not a legacy entity-tied-only upload field).
3. Repeat for Equipment (weapon/armor/shield path).

**Expected**
- Shared `RealmsImageField` / `RealmsImagePicker`; selecting sets `image_id` and art previews on save/reload.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-026-T002 — Creators pick bank art (non-admin cannot upload into bank)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-026 |
| **Related task** | TASK-496 / TASK-497 |
| **Where** | `/creature-creator`, `/power-creator`, `/technique-creator`, `/item-creator` (and peers) |
| **Needs** | Signed-in non-admin (and optionally admin) |

**Steps**
1. As non-admin, open a creator image field → pick from bank.
2. Confirm no upload-into-bank control.
3. As admin (optional), confirm upload-into-bank is available on admin/publish paths.

**Expected**
- Guests/signed-in can pick; non-admins cannot write to the bank.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-026-T003 — Add-to-library preserves image_id

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-026 |
| **Related task** | TASK-497 |
| **Where** | `/library` → Realms Library → add power/technique/creature with art |
| **Needs** | Signed-in user; official row with `image_id` |

**Steps**
1. Add an official art-bearing entity to My Library.
2. Open My Library row / creator edit and confirm the same art resolves (same bank master).

**Expected**
- User row keeps `image_id`; no re-upload; art still displays.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-026-T004 — Legacy cataloged species art appears in Image Library

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-026 |
| **Related task** | TASK-498 |
| **Where** | `/admin/images` + guided species step |
| **Needs** | Admin; RealmsRPG-Test after `realms_image_catalog_legacy_entity_art` |

**Steps**
1. Open `/admin/images` and find cataloged starter species (e.g. Human / Halfling / Erethi).
2. Confirm guided Choose-a-Path / species cards still show art.

**Expected**
- Bank rows tagged `species`; consumer `image_id` set; no broken cards. Legacy Storage paths may remain until replace.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-026-T005 — Character portrait bank pick

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-026 |
| **Related task** | TASK-499 / TASK-603 |
| **Where** | Character sheet (edit) or creator finalize / guided portrait |
| **Needs** | Character draft or saved character |

**Steps**
1. Open portrait upload → **Choose from library**.
2. Pick a species/creature bank image.
3. Confirm portrait updates; custom crop upload still works.
4. Smoke both Advanced finalize and Guided reveal — same crop modal + library picker (shared `CreatorPortraitUpload`).

**Expected**
- Bank pick is additive; surfaces are pick-only (`allowAdminUpload={false}`).
- Advanced + Guided share one portrait presenter (layout variants OK); no parallel ImageUploadModal forks.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-026-T010 — Creator save-time portrait upload errors

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-026 |
| **Related task** | TASK-603 |
| **Where** | Advanced finalize create / Guided reveal create (with a cropped data-URL portrait) |
| **Needs** | Signed-in user; optional Network throttle / failing `/api/upload/portrait` |

**Steps**
1. Set a portrait via crop (or bank URL — skip upload path) on Advanced finalize and/or Guided reveal.
2. Create character with a data-URL portrait; confirm Storage upload succeeds and sheet shows the portrait URL.
3. (Optional) Force upload failure; confirm toast shows a real error message (not a silent failure / empty toast).

**Expected**
- Save path uses `uploadCharacterPortraitFromDataUrl` + `getErrorMessage`; character still creates if portrait upload fails.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-026-T006 — My Account profile picture bank pick

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-026 |
| **Related task** | TASK-499 |
| **Where** | `/my-account` |
| **Needs** | Signed-in user |

**Steps**
1. Change Picture → Choose from library → select a bank portrait.
2. Confirm profile photo updates and ExpandableImage preview still works.
3. (Optional) Force a failing update and confirm error text surfaces (not a silent failure).

**Expected**
- Bank pick updates `photo_url` / avatar; custom upload remains; errors use `getErrorMessage`.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-026-T007 — Soft theme matte behind transparent art

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-026 |
| **Related task** | TASK-531 |
| **Where** | Image upload/crop modal; Realms Image Library picker; guided choice card / list thumb; ExpandableImage enlarge |
| **Needs** | PNG (or WebP) with transparent background; light and dark theme |

**Steps**
1. Open Upload & crop (admin images or picker) with a transparent PNG.
2. Confirm cropper stage and output preview use a soft tinted matte — not pure black or white.
3. Confirm & save; open the asset in the picker grid and ExpandableImage enlarge — matte matches theme.
4. Toggle light ↔ dark; matte should stay soft and on-theme in both.
5. Upload a **new** transparent PNG portrait; toggle theme again — matte adapts without re-upload.

**Expected**
- Transparent areas use adaptive `bg-image-matte` at display time (`--color-image-matte`); **not** baked into stored PNG/WebP uploads.
- Crop output preserves alpha; toggling light ↔ dark updates matte behind art without re-upload.
- **Legacy** images uploaded before alpha-preserving crops (TASK-531 JPEG bake) may still show a fixed matte until re-uploaded.
- Card placeholder SVGs have `-dark.svg` variants; missing portrait fallback is theme-aware.
- Cropper dim overlay uses theme background mix — not pure black.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-026-T008 — Equipment / armament GLR list thumbnails

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-026 |
| **Related task** | TASK-532 |
| **Where** | `/codex` Equipment; `/library` Realms + My Library armaments; `/admin/codex` Equipment |
| **Needs** | At least one equipment/item with `image_id` / `image_url` set |

**Steps**
1. Open Codex Equipment — rows with art show a 44px thumb left of the name (placeholder when none).
2. Open Library → Realms Library → Armaments — same thumb column; click thumb opens ExpandableImage preview.
3. Open My Library → Armaments for an item that has bank art — thumb visible.
4. Admin Codex Equipment — thumb + header alignment with name column.

**Expected**
- Same pattern as species: `ListHeader.hasThumbnailColumn` + `GridListRow.thumbnail` via `resolveListRowThumbnail('equipment', …)`.
- No parallel lightbox / custom thumb component.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-026-T009 — All art-capable entity GLR thumbnails

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-026 |
| **Related task** | TASK-533 |
| **Where** | Library Realms + My (powers, techniques, empowered, creatures, armaments); Codex species/equipment; add-power/technique/equipment selection modals; character sheet Library tab; advanced creator Selected Equipment; creature creator selected powers/techniques/inventory |
| **Needs** | At least one bank-imaged power, technique, creature, and armament |

**Steps**
1. Realms Library: Powers / Techniques / Creatures / Armaments — each shows 44px thumbs (placeholder when no art).
2. My Library: same tabs — thumbs present; creature collapsed row shows thumb.
3. Add Power / Add Technique / guided L2 equipment modal — thumbs appear on art-capable rows; feats/skills modals stay thumb-less.
4. Character sheet Library — powers / techniques / weapons / armor / shields / equipment show thumbs (placeholder OK for older saves without `image_url`).
5. Advanced creator Selected Equipment + Powers/Techniques selected lists — thumbs present.
6. Creature creator — add-power/technique/armament modals and selected lists show thumbs.
7. Click a thumb — ExpandableImage enlarge works; header columns stay aligned.

**Expected**
- One pattern: `resolveListRowThumbnail` + `ListHeader.hasThumbnailColumn` / `SelectableItem.thumbnail`.
- No thumbs on non-art entities (feats, skills, archetypes, parts, properties, traits).
- Enhanced items remain deferred (TASK-500).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-030 — Encounter play facades (TASK-608)

Smoke suite for combat/skill encounter view splits. Routes and AddCombatantModal are unchanged; verify play loops still work after facade extraction.

#### DEV-V-030-T001 — Combat encounter play after facade split

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-030 — Encounter play facades |
| **Related task** | TASK-608 |
| **Where** | `/encounters/<id>/combat` (or Mixed → Combat tab) |
| **Needs** | Signed-in; an existing combat encounter (or create one) |

**Steps**
1. Open the combat encounter — combatants list + Add Combatant sidebar render (no blank flash).
2. Add a manual combatant (name + Add Creature) and/or open **From Library / Campaign** (AddCombatantModal) and add one.
3. Click **Start Encounter** → **Next Turn** / **Previous**; toggle Auto Sort Initiative; **Sort Initiative**.
4. Edit HP/AP on a combatant card; wait for autosave indicator; refresh — state restores.

**Expected**
- Round chrome, drag-reorder list, and AddCombatantModal behave as before the split.
- No new selection shell; combat/mixed routes still mount `CombatEncounterView`.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-030-T002 — Skill encounter play after facade split

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-030 — Encounter play facades |
| **Related task** | TASK-608 |
| **Where** | `/encounters/<id>/skill` (or Mixed → Skill tab) |
| **Needs** | Signed-in; an existing skill encounter (or create one) |

**Steps**
1. Open the skill encounter — Successes tracker, participant list, Configuration sidebar render.
2. Set DS / required successes; add a participant (manual name or AddCombatantModal).
3. Enter a roll total + optional RM → Submit — successes/failures update; outcome chips update.
4. Optional: enable Track turns / use initiative; in mixed mode, **Copy combatants** / **Sync with combat order**.
5. Refresh — rolls and totals restore via autosave.

**Expected**
- Tracker + ParticipantCard + sidebar config parity with pre-split behavior.
- AddCombatantModal `mode="skill"` still adds participants; no USM fork.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-030-T003 — Full combatant card Health/Energy ValueStepper (TASK-819)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-030 — Encounter play facades |
| **Related task** | TASK-819 |
| **Where** | `/encounters/<id>/combat` (full combatant card, not compact) |
| **Needs** | Signed-in; a combat encounter with a non-linked combatant |

**Steps**
1. Open a combat encounter in the full-card layout.
2. On a manual (not linked-character) combatant, confirm Health and Energy show current + max number inputs **and** a ValueStepper beside them.
3. Step Health and Energy up/down; type a number directly — both persist after refresh.
4. Open a linked-character combatant — still read-only current/max text, no steppers.

**Expected**
- Full cards match compact stepper parity (ADR-0002). Initiative click-to-edit and condition chips are unchanged. Compact layout is unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-030-T004 — AddCombatantModal Add stays in the sticky footer (TASK-846)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-030 — Encounter play facades |
| **Related task** | TASK-846 |
| **Where** | `/encounters/<id>/combat` → **Add From Library / Campaign** |
| **Needs** | Signed-in; a combat encounter; at least one library creature |

**Steps**
1. Open **Add From Library / Campaign** at 390px touch (full-screen modal).
2. Select a creature so the primary **Add** appears. Scroll the list — **Add** must stay visible in the sticky Modal footer (not below the list).
3. Confirm **Add** is ≥48px tall (`size="lg"`). Quantity stepper and enemy/ally/companion radios stay in the scrollable content.
4. Switch to **Campaign Characters**, select one or more, confirm **Add** is also in the sticky footer. Confirm still inserts combatants. Do not migrate this modal onto USM (TASK-571).

**Expected**
- Primary Add is Modal `footer` on both tabs. Intentional non-USM. Close still works with no selection.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-031 — API route smoke (TASK-613)

Archived (TASK-718; not cited by Pending owner QA). Full steps: [`BUILD_VALIDATION_ARCHIVE.md`](archive/BUILD_VALIDATION_ARCHIVE.md#dev-v-031--api-route-smoke-task-613).

---

## DEV-V-032 — Realms Library creature stat blocks (TASK-620)

Parity: Realms Library → Creatures uses the same `CreatureStatBlock` rows as My Library (not the compact official grid).

#### DEV-V-032-T001 — Realms Library creatures full stat blocks

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-032 — Realms Library creature stat blocks |
| **Related task** | TASK-620 |
| **Where** | `/library` → Realms Library → Creatures (signed-in and guest browse) |
| **Needs** | At least one official creature in Realms Library |

**Steps**
1. Open Library → Realms Library → Creatures — rows match My Library chrome (level, size, type, archetype, Health, Energy columns + thumb).
2. Expand a creature — full stat block sections (abilities, defenses, skills, powers, techniques, armaments, etc.) render like My Library.
3. Use a roll button inside the expanded block — `RollLog` records the result.
4. Signed-in: tap **+** or expanded **Add to library** — confirm modal → creature appears in My Library.
5. Guest (signed out): browse and expand stat blocks; add actions prompt sign-in (no error).
6. Admin `/admin/public-library` → Creatures — still compact name/level/type grid (not stat blocks).

**Expected**
- Library `variant="library"` → `CreatureStatBlock`; admin `variant="admin"` → compact `OfficialEntityList`.
- Shared mapper `mapLibraryCreatureToStatBlockData` drives both Realms and My Library rows.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-033 — Library armaments split (TASK-621)

Realms Library and My Library replace the single Armaments tab with **Weapons**, **Armor**, and **Shields** tabs. Each tab shows type-specific column headers.

#### DEV-V-033-T001 — Library Weapons / Armor / Shields tabs

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-033 — Library armaments split |
| **Related task** | TASK-621 |
| **Where** | `/library` → Realms Library and My Library |
| **Needs** | Official and/or user weapons, armor, and shields in library |

**Steps**
1. Open Library → Realms Library — confirm tabs are **Weapons**, **Armor**, **Shields** (not a single Armaments tab).
2. **Weapons** tab: columns include Rarity, Currency, TP, Range, Damage (no Type column). Sort by Damage/TP works.
3. **Armor** tab: columns include Damage Red., Agility Red., Abl. Req., and Crit + (not Range/Damage). Sort by Damage Red. works.
4. **Shields** tab: columns include Block and Damage.
5. Switch to My Library — same three tabs with edit/duplicate/sync chrome per kind.
6. Admin `/admin/public-library` → Armaments: segmented Weapons / Armor / Shields control; lists filter correctly.
7. Optional ~360px: tab bar wraps; list headers remain readable.

**Expected**
- `equipment`-typed rows are excluded (armaments only); counts per tab match filtered items.
- Add-to-library from Realms still works for each kind.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-033-T002 — Armor Abl. Req. + Crit + columns (TASK-628)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-033 — Library armaments split |
| **Related task** | TASK-628 |
| **Where** | `/library` → Realms Library and My Library → **Armor** |
| **Needs** | Armor with a Strength (or other) ability requirement and/or Critical Range +1 property |

**Steps**
1. Open Library → Realms Library → **Armor**.
2. Confirm column headers include **ABL. REQ.** and **CRIT +** (alongside Damage Red. / Agility Red.).
3. Spot-check an armor with a Strength requirement: Abl. Req. cell shows e.g. `Strength 3+` (not blank when the item has a req).
4. Spot-check an armor with Critical Range +1: Crit + cell shows `+1` (or higher stack); expand the row and confirm **Critical Range +1** is not duplicated as a property chip.
5. Armor with neither: Abl. Req. and Crit + show `-`.
6. My Library → Armor: same headers/cells.

**Expected**
- Quick-ref ability requirement and Critical Range increase are visible in collapsed columns without expanding.
- No column + chip duplication for Critical Range +1 on armor rows.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-034 — GLR chrome + Parts chip grammar (TASK-622)

Library / Official GLR rows: action icons share chrome (header spacers + hover), no redundant Total TP when a TP column exists, Parts/Properties chips use dense `TP: N` and omit zero levels.

#### DEV-V-034-T001 — Action chrome alignment + hover

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-034 — GLR chrome + Parts chip grammar |
| **Related task** | TASK-622 / **TASK-702** / **TASK-710** |
| **Where** | `/library` → My Library → Powers (also Techniques / Weapons) |
| **Needs** | At least one user power with edit + delete |

**Steps**
1. Open My Library → Powers. Confirm Name/Energy/…/Damage headers align with row values (no drift from edit/delete/sync icons).
2. Include at least one row **without** a “Needs sync” badge: confirm its columns still align with the header (empty sync spacer reserved — same width as drifted rows).
3. Hover a collapsed power row: highlight extends through edit pencil + delete X (one continuous band — not split; right chrome shares hover with name/columns — TASK-702 / TASK-710). Icons are vertically centered with the name and use the shared GLR action size (not a smaller top-pinned set).
4. Expand a power: Parts chips show `TP: N` (not `Training Points: N`); chips with no TP and no option level show no `(0)`. Expanded `bg-surface-alt` continues through the edit/delete column (no empty band of row background beside the description; icons stay in the header row).
5. My Library → Techniques: expand a technique that has a TP column — confirm there is **no** expanded "Total TP" / "Total Training Points" chip (TP already in the collapsed column).
6. Optional: Realms Library → Powers with Add (+): header reserves space so columns stay centered over values; expand a selectable (+) row — description fully readable (no + overlay/blackout); expanded surface continues into the + column.
7. Codex → Equipment (browse): no empty trailing action column; Admin Codex → Equipment: edit/duplicate/delete sit in reserved right chrome aligned with the header.

**Expected**
- Edit/delete (and add when present) reserved via `rowChrome`, not a single leftover grid track that splits hover; hover band includes right chrome (TASK-702 / TASK-710). Expanded surface-alt fills the action column; action icons stay header-centered at shared `md` size.
- Powers without a TP column may still show expanded Total TP when cost is greater than 0.
- Codex/Admin shell lists (TASK-624) match the same chrome pattern.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-034-T002 — Creatures GLR spacing + header chrome (TASK-630)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-034 — GLR chrome + Parts chip grammar |
| **Related task** | TASK-630 |
| **Where** | `/library` → My Library → Creatures; Realms Library → Creatures |
| **Needs** | At least one user creature (edit/delete) and one official creature |

**Steps**
1. Open My Library → Creatures. Confirm row vertical spacing matches Powers/Techniques (tight `gap-1`, not airy `space-y-3`).
2. Confirm Name / Level / Size / Type / Archetype / Health / Energy headers align with row values (edit/delete chrome reserved — no column skew).
3. Open Realms Library → Creatures — same tight row spacing as other Realms tabs; + add chrome keeps columns aligned.
4. Optional ~360px: headers collapse to Sort by; rows still readable.

**Expected**
- Creatures use the same shell list gap and `rowChrome` contract as other Library entity tabs.
- Stat-block expanded content unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-040 — Creature level fraction display (session)

User-facing creature levels use unicode fractions (¼ / ½ / ¾), not raw decimals.

#### DEV-V-040-T001 — Fraction display sitewide

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-040 — Creature level fraction display |
| **Related task** | Session cleanup (owner feedback) |
| **Where** | `/creature-creator`, `/library` → Creatures, Realms Library → Creatures, encounter Add Combatant → Creature Library, Codex → Creature Feats |
| **Needs** | At least one creature at level ½ or ¼ (create in creature creator if needed) |

**Steps**
1. Creature creator → Level select shows `¼`, `½`, `¾` (not `1/4` / `0.25`).
2. Save/load a ½-level creature — summary panel and stat block Level column show `½` or `Lv ½`.
3. Library + Realms Library creature rows — Level column matches fraction display.
4. Add Combatant modal creature list — `Lv ½` style label.
5. Codex Creature Feats — Req. Lvl column uses fractions when applicable.

**Expected** — No raw decimal creature levels in user-facing UI; calculations still use numeric level internally.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-040-T002 — Library Creatures Level column sort (TASK-678)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-040 — Creature level fraction display |
| **Related task** | TASK-678 |
| **Where** | `/library` → My Library → Creatures; Realms Library → Creatures |
| **Needs** | At least three creatures at levels ¼, ½, and 1 (create in creature creator if needed) |

**Steps**
1. Open My Library → Creatures. Click **LEVEL** header once (ascending).
2. Confirm order is ¼ → ½ → ¾ (if present) → 1 → higher integers — not ½ before ¼.
3. Click **LEVEL** again (descending). Confirm highest levels first, with 1 above ½ above ¼.
4. Repeat on Realms Library → Creatures.

**Expected** — Level sort follows numeric quarter-step order; display still shows unicode fractions.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-035 — Realms Library redundant source badge (session)

Realms Library browse rows should not repeat source context with a **Realms** descriptor chip when the page is already Realms Library.

#### DEV-V-035-T001 — No Realms badge on official browse rows

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-035 — Realms Library redundant source badge |
| **Related task** | Session cleanup (owner feedback) |
| **Where** | `/library` → Realms Library → Powers, Techniques, Weapons/Armor/Shields, Creatures |
| **Needs** | At least one official item per tab you spot-check |

**Steps**
1. Open Library → Realms Library → Powers — expand a row. Confirm there is **no** descriptor chip labeled **Realms** (parts/properties chips may still appear).
2. Repeat on Techniques and one Armaments tab (e.g. Weapons).
3. Creatures: expand a stat block — confirm **no** **Realms** badge under the description.
4. Admin `/admin/public-library` → Enhanced (if any): **Enhanced** purple badge may still appear (meaningful, not source tagging).

**Expected**
- Realms Library `variant="library"` rows omit source badge; `getBadges` only when explicitly set (e.g. Enhanced).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-036 — Power Creator multi-elemental damage EN (TASK-623)

Each added damage row (including multiple elemental types sharing one codex part id) must independently contribute to Energy in the creator, after save/reload, and in Library display.

#### DEV-V-036-T001 — Three elemental damage rows sum EN

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-036 — Power Creator multi-elemental damage EN |
| **Related task** | TASK-623 |
| **Where** | `/power-creator` |
| **Needs** | Signed-in user optional (save smoke) |

**Steps**
1. Open `/power-creator`. In Added Damage Types, add three rows: `1d6 fire`, `1d6 ice`, `1d6 lightning` (or acid).
2. Confirm damage section EN and sidebar total reflect **three** Elemental Damage contributions (e.g. **12 EN** if each 1d6 row is 4 EN).
3. Save the power; reload via Edit or refresh draft — EN unchanged.
4. Optional: open saved power in Library — listed Energy matches creator total.

**Expected**
- Each damage row adds its own EN/TP; no collapse to a single Elemental Damage instance.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-037 — Official power part chip dedupe (session cleanup)

Library/Official powers with promoted duration/area columns must not show duplicate mechanic part chips (e.g. Menace: one `Duration (Minute)`, one `Sphere of Effect`).

#### DEV-V-037-T001 — Menace official power expand

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-037 — Official power part chip dedupe |
| **Related task** | session cleanup (power-calc dedupe) |
| **Where** | `/library` → Realms → Powers |
| **Needs** | None (public official data) |

**Steps**
1. Open `/library`, Realms tab, Powers. Search **Menace**.
2. Expand the row. Open **Parts & Proficiencies**.
3. Count chips: expect **one** `Duration (Minute)`, **one** `Sphere of Effect`, plus Frighten / Immune / No Harm (5 unique chips total).
4. Optional: spot-check **Fog Cloud** (sphere + minute) — no doubled area/duration mechanic chips.

**Expected**
- No duplicate auto-mechanic chips when columnar fields and `payload.parts` both exist.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-038 — Empowered technique nested power part chips (TASK-626)

Library empowered technique rows must show both nested power parts (`derivePowerDisplay` on `power` payload) and technique parts.

#### DEV-V-038-T001 — Library empowered expand + USM chips

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-038 — Empowered technique nested power part chips |
| **Related task** | TASK-626 |
| **Where** | `/library` → Realms + My → Empowered; sheet Add → Empowered; `/empowered-technique-creator` → Load |
| **Needs** | Account with at least one empowered technique that has both power and technique parts saved |

**Steps**
1. Open `/library` → Realms → Empowered. Expand a row with known power + technique parts.
2. Open **Parts & Proficiencies** — confirm chips from **both** sides (e.g. power Range/Frighten + technique Weapon Attack).
3. Repeat on My Library → Empowered tab.
4. Sheet → Add power → Empowered tab (or creator Load): expand row — same part chips in detail sections.

**Expected**
- Power-side parts from nested `power.parts` / `power.mechanics` appear alongside technique parts; no forked chip builder.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-039 — Codex feat Tags section (session)

Feat expanded rows must label the Tags section even for a single tag, and Tags must appear after ability/skill requirements and feat levels.

#### DEV-V-039-T001 — Codex Feats Tags label + order

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-039 — Codex feat Tags section |
| **Related task** | Session cleanup |
| **Where** | `/codex` → Feats |
| **Needs** | Signed-in user |

**Steps**
1. Open Feats; expand **Abundant Harvest** (single tag).
2. Confirm **TAGS** section header appears above the **Craft** chip (not a floating unlabeled chip).
3. Confirm order: Type (if shown) → Ability Requirements (if any) → Skill Requirements → Feat Levels → **Tags** last.
4. Expand **Abjure** (multi-tag) — **TAGS** still labeled; tags remain after requirements/levels.

**Expected**
- Tags section always has a visible label; Tags is the last detail section before any supplemental content.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-045 — Codex character filter UX (session)

Feats + Skills character filter: shared collapsible `CharacterFilter` (default collapsed, InfoTippy on the header). Feats: qualification + show-unqualified. Skills: known / not known / base-owned. Persistence shared with Library.

#### DEV-V-045-T001 — Codex Feats character filter

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-045 — Codex character filter UX |
| **Related task** | Session — 2026-08-06 feedback / **TASK-722** |
| **Where** | `/codex` → Feats → Filters |
| **Needs** | Signed-in user with at least one character |

**Steps**
1. Open Feats; expand **Filters**. Confirm **Filter by character** is in the filters panel (not beside Realms/My Codex toggle) and starts **collapsed**; the (i) tippy sits **immediately after the title** (not at the far right of the row).
2. Expand Filter by character; select a character — list narrows to qualified feats; **Show unqualified feats** appears on the same row as the select (right side).
3. Confirm **Max Required Level** and **Ability/Defense Requirement** are disabled with **Set by character** placeholders; max-level label has an InfoTippy (no helper line below).
4. Toggle **Show unqualified feats** — unqualified feats appear; toggle off — hidden again.
5. Switch to Species — no character filter. Skills **does** have Filter by character (see T003).
6. Clear character filter — manual level/ability filters re-enable.
7. Select a character on Feats → open **Library** (Powers or Techniques) — same character pre-selected in **Filter by character**. Switch to Weapons — same character. Clear filter on any tab → return to Codex Feats — filter cleared. Refresh page — last selection restored.

**Expected**
- Filter by character on Feats (and Skills); qualification uses character stats; clutter-free filter panel (no qualification banner).
- Character selection shared across Library and Codex feats/skills tabs via one persistence key.
- Filter by character subsection is collapsed until expanded; (i) remains usable while collapsed and sits next to the title.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-045-T002 — Cross-tab character filter persistence (TASK-681)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-045 — Codex character filter UX |
| **Related task** | TASK-681 / TASK-722 |
| **Where** | `/codex` Feats/Skills ↔ `/library` Powers/Techniques/Weapons |
| **Needs** | Signed-in user with at least one character |

**Steps**
1. On Codex Feats, select a character in **Filter by character**.
2. Navigate to Library → Powers — confirm the same character is selected.
3. Switch Library tabs (Techniques, Weapons) — selection unchanged.
4. Open Codex → Skills — same character (expand Filter by character if collapsed).
5. Clear the filter on any tab — confirm Codex Feats also shows no character when you return.
6. Re-select a character on Library; refresh the browser — selection persists on Library, Codex Feats, and Codex Skills.

**Expected**
- One shared character filter across Library browse tabs and Codex Feats/Skills; clear is global; survives refresh.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-045-T003 — Codex Skills character filters (TASK-722)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-045 — Codex character filter UX |
| **Related task** | TASK-722 |
| **Where** | `/codex` → Skills → Filters |
| **Needs** | Signed-in user with ≥1 character that has at least one base skill |

**Steps**
1. Open Skills; expand **Filters**. Confirm Ability / Base Skill / Skill Type are visible even before picking a character (and if the account has no characters, those filters still show).
2. Confirm **Filter by character** starts collapsed with the (i) tippy immediately after the title. Expand it and pick a character (same persistence as Feats/Library).
3. Confirm **Known** (All / Known / Not known) and **Sub-skills whose base skill I have** appear. Leave Known on All — list still shows other skills.
4. Set Known → **Known** — only skills on that character remain. **Not known** — those drop out.
5. Check **Sub-skills whose base skill I have** — list is sub-skills for bases the character has (not unrelated subs).
6. Clear the character — Known / base-owned controls hide; Ability / Base Skill / Skill Type remain.
7. Repeat collapse check on Library Powers **Filter by character** (and Feats): starts collapsed; (i) still works and sits next to the title.

**Expected**
- Shared `CharacterFilter` (no Codex-only fork); skills character extras stay simple; other skill filters never depend on having a character.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-045-T004 — Filter by character (i) beside the title (TASK-781)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-045 — Codex character filter UX |
| **Related task** | TASK-781 |
| **Where** | `/codex` → Feats → Filters; `/codex` → Skills → Filters; `/library` → Powers → Filters |
| **Needs** | Signed-in user with at least one character |

**Steps**
1. Open Codex Feats; expand **Filters**. Do **not** expand Filter by character yet.
2. Confirm the (i) sits immediately after the **Filter by character** title (after the person icon + title, before the chevron). It must not sit at the far right of the filter row.
3. Hover/focus the (i) — help copy appears; the subsection stays collapsed.
4. Click the title or chevron — subsection expands; (i) stays next to the title.
5. Repeat on Codex Skills and Library Powers.

**Expected**
- Shared `CharacterFilter` header: title, then (i), then optional selected-name, then chevron. Expand does not push the tip to the trailing edge.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-046 — Library power/technique categories + filters (TASK-673 / TASK-676)

Derived part categories (non-mechanic) as Category column; shared `PowerTechniqueFilters` on Realms Library, My Library, and Admin public lists. TASK-676: character/TP filters, Max Energy only, aligned filter cells, center Category. TASK-731: add-to-library is **BookPlus**; add-to-character is **UserPlus** (T006 when both show).

#### DEV-V-046-T001 — Powers filters + Category column (Library + Admin)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-046 — Library power/technique filters |
| **Related task** | TASK-673 / TASK-676 |
| **Where** | `/library` → Realms + My → Powers; `/admin/public-library` → Powers |
| **Needs** | Powers with varied part categories, energy, action types; at least one innate-eligible and one heal power |

**Steps**
1. Open Realms Library → Powers. Confirm **CATEGORY** column is **center**-aligned (like Energy; Name stays left) and **Filters** (collapsed by default).
2. Expand Filters: Filter by character (when signed in); Category; **Max Energy** (no Min); **Max TP**; Action Type; Action/Reaction; Power Threshold (Innate) + tip; Innate Eligible (label + control cell aligned with other filters).
3. Filter by a category — list narrows; Category column shows that category (multi joined with commas when applicable).
4. Select Power Threshold (Innate) e.g. **8** — Innate Eligible auto-checks; heal / high-energy / non-Basic powers drop out.
5. Repeat on My Library → Powers and Admin public Powers — same filters and Category column.

**Expected**
- Shared filter UX; no duplicate Category desc chip when column is present; Admin/Realms/My stay in sync; filter controls share row alignment.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-046-T002 — Techniques filters + Category column

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-046 |
| **Related task** | TASK-673 / TASK-676 |
| **Where** | `/library` → Techniques; Admin public Techniques |
| **Needs** | Techniques with part categories |

**Steps**
1. Open Techniques (Realms + My + Admin). Confirm Category column (center) + Filters (no Innate Threshold / Innate Eligible).
2. Filter by category, Max Energy, Max TP — list updates; empowered techniques tab still lists without power-only filters.

**Expected**
- Technique filters match powers minus innate controls.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-046-T003 — Character filter + available TP (powers/techniques)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-046 |
| **Related task** | TASK-676 |
| **Where** | `/library` → Powers (and Techniques); signed-in user with ≥1 character |
| **Needs** | Character with known max Energy, innate threshold (if Power), and TP spent/remaining from proficiencies |

**Steps**
1. Sign in → Library → Powers → expand Filters → **Filter by character** → pick a character.
2. Confirm Max Energy fills to character max Energy and is disabled (“Set by character”); summary line shows max Energy / innate threshold / TP spent/total/remaining.
3. Check **Innate Eligible** — threshold uses character innate threshold and locks; uncheck clears threshold. List respects eligibility + energy ≤ threshold.
4. Check **Available TP** (≤ N remaining) — entries with TP cost above remaining disappear. Set **Max TP** independently (with or without character) and confirm it caps TP cost.
5. Spot-check Techniques tab: character caps Max Energy; Available TP + Max TP work; no innate controls. Confirm damaging powers can show **Damage** in Category.
6. Powers: with character selected, check **Innate Eligible** — Power Threshold greys out with **Set by character** (same as Max Energy).
7. Spot-check **SelectFilter** / **ChipSelect** dropdowns (Action Type, Action / Reaction, innate threshold): chevron has comfortable right inset (not hugging the border); chevron weight/color reads as muted, matching field text — not the heavy native browser arrow.

**Expected**
- Character caps compose with Max Energy lock; TP remaining matches sheet proficiency spend model; Damage category appears for powers with damage; innate threshold locks when Innate Eligible + character filter.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-046-T004 — Add to character from Library (+ row action)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-046 |
| **Related task** | TASK-679 · TASK-746 |
| **Where** | `/library` → My Library + Realms Library → Powers and Techniques |
| **Needs** | Signed-in user with ≥1 character; library power/technique not already on that character |
| **CI** | Partial — `map-library-to-character.test.ts` dirty-key subset + 409 re-apply

**Steps**
1. Library → Powers → Filters → pick a character under **Filter by character**.
2. Confirm each GLR row not already on that character shows a **person-plus** (UserPlus) control whose label is **Add to character's powers** (not a second identical + / BookPlus).
3. Click that person-plus → confirm modal names the character and power → **Add**.
4. Open that character's sheet → Powers tab → entry appears; required proficiencies auto-added if applicable.
5. Return to Library with same character filter — person-plus hidden for the added power. Repeat on Techniques tab and Realms Library browse.

**Expected**
- Confirm/cancel modal matches other library confirms; save persists; duplicate adds blocked per row id.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-046-T005 — Armaments character filter + add to character

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-046 |
| **Related task** | TASK-680 |
| **Where** | `/library` → My Library + Realms Library → Weapons, Armor, Shields |
| **Needs** | Signed-in user with ≥1 character; library armament not already on that character; items with ability req / high TP / varied currency help spot-check filters |

**Steps**
1. Library → Weapons → Filters → **Filter by character** → pick a character.
2. Confirm summary shows Armament Proficiency + Currency; list drops items over proficiency TP max or unmet ability requirements.
3. Check **Within currency** — high-currency rows disappear.
4. Confirm GLR **person-plus** (UserPlus, label **Add to character's weapons** / armor / shields) on rows not already on that character; click it → confirm modal → **Add**.
5. Open character sheet → Inventory → entry appears; required proficiencies auto-added if applicable.
6. Return to Library with same character — person-plus hidden for added item. Repeat Armor / Shields and Realms Library browse.

**Expected**
- Shared `ArmamentFilters` + `useAddToCharacterFromLibrary` (no parallel hook); admin public-library has no add-to-character; character pick shares persistence key with power/technique filters.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-046-T006 — Dual-action row icons (library vs character)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-046 |
| **Related task** | TASK-731 |
| **Where** | `/library` → Realms Library → Powers (also Techniques, Weapons, Armor, Shields) |
| **Needs** | Signed-in user with ≥1 character; at least one Realms row not in My Library and not already on that character |

**Steps**
1. Library → Realms Library → Powers → Filters → **Filter by character** → pick a character.
2. Find a row with **two** action icons (not already in My Library, not already on the character).
3. Confirm the icons are **different**: **book-plus** (BookPlus, label **Add to my library**) vs **person-plus** (UserPlus, label **Add to character's powers**). Not two identical Plus glyphs.
4. Hover / focus each — `title` / `aria-label` name the destination (library vs character). Action column stays narrow (no header legend).
5. Repeat on Techniques, Weapons, Armor, Shields. Spot-check **light and dark**. On My Library with character filter, only person-plus appears (already in library). Creatures: book-plus add-to-library only (no character add).

**Expected**
- Distinction comes from shared `LibraryAddToLibraryButton` / `LibraryAddToCharacterButton` (no per-tab icon forks). Compact `md` desktop chrome; 44px touch on coarse pointers.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-046-T007 — Filter control height + InfoTippy label spacing (TASK-725)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-046 |
| **Related task** | TASK-725 |
| **Where** | `/library` → Powers Filters; `/codex` → Feats Filters; Guided Path subsection titles with (i) |
| **Needs** | Signed-in user (Library/Codex filters) |

**Steps**
1. Library → Powers → expand Filters. Confirm **Max Energy** / **Max TP** number fields match **Category** / **Action Type** dropdowns: same height (`h-11`), same `rounded-md` border (not a shorter `h-10` / `rounded-lg` input beside a taller select). Ability Requirement on Codex Feats: ability select, Max number, and + button share that height.
2. Codex Feats → **Max Required Level** label + (i): the (i) does **not** add a gap under the label or wrap the title; the number field still matches adjacent ChipSelect height. Library Powers **Power Threshold (Innate)** (i) same.
3. Guided Path (or any `GuidedSectionTitle` with `titleAddon`): section title + (i) sit on one line; the (i) does not inflate heading line-height. Hover/focus/touch-hold still opens the tip.
4. Repeat at ~360px width: (i) remains tappable (overlay hit, not a 44px hole in the heading). Desktop (`md+`) (i) stays icon-hugging in the label row.

**Expected**
- Filter text/number/select chrome is shared `FilterInput` / `FilterNativeSelect`. InfoTippy layout box is the 16px icon; 44px touch via `.hit-area-layout-neutral`. No per-page `!min-h-*` on the (i).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-046-T008 — Library add keeps sheet edits across a stale lock (TASK-746)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-046 |
| **Related task** | TASK-746 |
| **Where** | Character sheet tab + `/library` with **Filter by character** |
| **Needs** | Signed-in user with ≥1 character; a library power (or weapon) not already on that character |
| **CI** | Partial — `map-library-to-character.test.ts` (`mergeLibraryAddOnConflict` re-applies onto remote) |

**Steps**
1. Open the character sheet in tab A. Change **notes** (or add an inventory item) and wait for autosave.
2. In tab B, open Library → Powers (or Weapons) → **Filter by character** → that character. Add a row that is not already on the character.
3. Confirm the add succeeds (no error toast). Reload the sheet in tab A.

**Expected**
- Sheet **notes** (or the other-tab inventory) **and** the newly added library row both survive reload.
- A failed add because of a stale lock should retry once, not restore an old full document.
- Repeat at ~360px: add still succeeds; sheet shows the new row after reload.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-046-T009 — Innate eligible: duration + Adaptation (TASK-879)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-046 |
| **Related task** | TASK-879 |
| **Where** | `/library` → Powers (Innate Eligible filter); `/characters/new/guided` → Powers → **See more Innate Powers**; Admin Codex archetype Level 1 innate picks |
| **Needs** | Catalog with: (a) Basic power duration ≤1 min, (b) Basic power duration >1 min or permanent, (c) power with Adaptation-category part (saved payload or codex), (d) heal-part power |
| **CI** | `innate-eligibility.test.ts`, `power-technique-filters.test.ts`, `power-technique-categories.test.ts` |

**Steps**
1. Library → Powers → Filters → check **Innate Eligible** (set threshold 8 if needed). Confirm (a) stays; (b)(c)(d) drop out.
2. Guided creator → Innate Powers → **See more**. Same exclusions; instant/basic ≤ threshold remain.
3. Admin archetype editor: add ineligible innate (10+ min duration or Adaptation part) → Save blocked with Appendix G error.

**Expected**
- One shared `isPowerInnateEligible` gate; unknown duration fails closed; inline `part.category` on saved payloads counts for Adaptation.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-047 — Collapse-by-default creators + browse filters (TASK-677)

Owner feedback: reduce initial visual load — creator `CollapsibleSection` blocks and browse `FilterSection` panels start collapsed.

#### DEV-V-047-T001 — Standalone creators start collapsed

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-047 |
| **Related task** | TASK-677 |
| **Where** | `/power-creator`, `/technique-creator`, `/item-creator`, `/species-creator` |
| **Needs** | None |

**Steps**
1. Open Power Creator — confirm Range, Area of Effect, Duration, Action Profile, Damage, and Parts sections are **collapsed** on first load; collapsed summary lines still show key state.
2. Expand one section; collapse again.
3. Spot-check Technique + Item creators — same collapsed-first behavior for `CollapsibleSection` blocks.

**Expected**
- No creator section auto-expands on first paint unless user expands it.
- Summaries remain readable when collapsed.
- When expanded, the header stays a compact title row (no empty second line).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-047-T002 — Codex + Library filters start collapsed

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-047 |
| **Related task** | TASK-677 |
| **Where** | `/codex` (Feats tab), `/library` → Powers |
| **Needs** | None |

**Steps**
1. Codex → Feats — confirm **Filters** is on the same row as Search (right side) and collapsed; list is primary focus; click Filters — panel opens (**Hide Filters**).
2. Library → Powers (Realms or My) — Filters collapsed by default on the search row; expand and apply a filter; collapse again — active count badge shows when collapsed.

**Expected**
- Browse filter panels use collapsed default sitewide via `FilterSection`.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-048 — Library search toolbar + Enhanced Items tab (session)

My Library entity tabs: Search + Filters on one row (guided/USM pattern); sync after Filters; **Enhanced Items** tab label and order (before Creatures). Codex / Admin browse lists share the same toolbar (TASK-721).

#### DEV-V-048-T001 — Search span + Enhanced Items tab

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-048 — Library search toolbar + Enhanced Items tab |
| **Related task** | Session — 2026-08-06 feedback; **TASK-682** (ListSearchToolbar); **TASK-721** (Filters on row) |
| **Where** | `/library` → My Library |
| **Needs** | Signed-in user |

**Steps**
1. Open My Library → **Powers** (desktop). Confirm search grows toward **Filters**, then **Sync with current patch** (Filters is not replaced by Sync).
2. Narrow to ~360px — row wraps without clipping; Filters control is ≥44px; search may wrap above Filters/sync (`flex-wrap`).
3. Open **Enhanced Items** — tab sits immediately before **Creatures**; search spans full width (no Filters, no sync button).
4. Spot-check Techniques or Weapons — Search + Filters on one row; sync still after Filters.

**Expected**
- Codex-parity search toolbar in `UserLibraryEntityTabShell`; Filters on the search row (TASK-721); tab label **Enhanced Items**; order Shields → Enhanced Items → Creatures.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-048-T002 — Codex / Library / Admin Filters on the search row (TASK-721)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-048 — Library search toolbar + Enhanced Items tab |
| **Related task** | TASK-721 |
| **Where** | `/codex` → Feats; `/library` → Realms Powers; `/admin/codex` → Skills; `/admin/images` |
| **Needs** | Signed-in; admin for admin routes |

**Steps**
1. Codex → Feats — **Search** and **Filters** on one row (Filters on the right). Panel collapsed. Expand Filters — character + other fields; no second Filters toggle inside the panel.
2. Library → Realms Library → Powers — same row; Filters on the right. Admin Official Create (if present) stays after Filters, not in the Filters slot.
3. Admin Codex → Skills — SectionHeader Add stays in the header; Search + Filters on one row.
4. Admin Images — Search + Filters (category) on one row; Add image still in SectionHeader.
5. Repeat Feats or Powers at ~360px — row wraps without clipping; Filters ≥44px.
6. Spot-check USM Add Power — Search + Filters unchanged (do not regress L3/USM).

**Expected**
- Browse lists reuse FilterSection `toolbarStart` via ListSearchToolbar; no third toolbar; USM/L3 unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-049 — Empowered cheaper-EN overlap + No Attack (TASK-683)

Empowered Attack mode must prefer the cheaper live Energy part when power and technique both offer a matching mechanic, and No Weapon/Attack must add No Attack like the technique creator.

#### DEV-V-049-T001 — Weapon Attack uses cheaper Add Weapon

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-049 — Empowered cheaper-EN overlap + No Attack |
| **Related task** | TASK-683 |
| **Where** | `/empowered-technique-creator` |
| **Needs** | Signed-in; Codex parts loaded (Add Weapon to Power ~4.5 EN, Add Weapon to Technique ~2.5 EN) |

**Steps**
1. Open `/empowered-technique-creator`. Set Attack to **Weapon Attack**.
2. Confirm the Attack section cost badge shows ~2.5 EN (technique Add Weapon), not ~4.5 EN (power Add Weapon), and TP does not jump by +1 from the power part alone.
3. Open Advanced cost breakdown / save draft and inspect payload: technique `autoMechanics` includes Add Weapon to Technique; `power.addWeaponPowerPart` is null/absent.
4. Set Attack to **No Weapon/Attack**. Confirm Attack cost reflects No Attack (percentage reduction / non-zero EN contribution vs Unarmed).
5. Set Attack to **Unarmed Attack**. Confirm Attack section cost is 0 EN / 0 TP (no Add Weapon, no No Attack).

**Expected**
- Cheaper-EN overlap pick for Weapon; No Attack attached for No Weapon/Attack; Unarmed adds nothing.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-050 — Guided creator L3 inline catalog lists (TASK-684)

Full Customize (L3, no archetype path) on archetype feats, character feat, loadout (weapon/armor/gear), and powers/techniques must render the filtered catalog inline in the step body (selected items as removable rows above the list) instead of auto-opening a modal. Guided paths (L1, has an archetype path) must be unchanged — curated cards + "See more" still opens the L2 modal. TASK-685 follow-up: hide unmet feats; custom loadout always shows weapons (Power-only skips armor); gear quantity-first; powers sequential screens (TASK-756; no innate-scope filter) + max EN filter. TASK-686–690: preview strip parity, Energy kind fix, equipment Codex columns + qty spacing, Power armor skip regardless of path `armorStep`.

#### DEV-V-050-T001 — L3 inline catalogs render + filter + select correctly

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-050 — Guided creator L3 inline catalog lists |
| **Related task** | TASK-684 / TASK-685 / TASK-688 / **TASK-699** / **TASK-702** / **TASK-710** / **TASK-709** / **TASK-703** / **TASK-705** / **TASK-706** / **TASK-727** / **TASK-724** / **TASK-758** / **TASK-759** / **TASK-753** |
| **Where** | `/characters/new/guided` — start a **custom** (no path) character |
| **Needs** | Signed-in; a draft with no `archetypePathId` (Full Customize) |

**Steps**
1. Archetype Feats step: confirm the full eligible Feats list renders inline (no modal); creator columns compose Codex facts but intentionally omit **Req. Level** (Category / Ability / Uses / Recovery); Category (multi-select), State Feats, and **Archetype Path** (last, not auto-selected) filters work; the State Feats **(i)** explains Quick Action → Enter State, 1-minute duration, and activating multiple state feats together; search covers name/tags/keywords/category; picking a Feat adds a removable card above the list; **unmet-requirement Feats are hidden** (including `lvl_req` >1, not shown disabled). Selecting then becoming unmet still shows the selected row so it can be removed. Selecting paths narrows to the union; clearing them returns the full eligible catalog.
2. Character Feat step: same as step 1, single-select (max 1); selecting a new Feat swaps the previous one.
3. Loadout — Weapon phase: **always present** for Martial / Power / Powered-Martial custom drafts; inline list shows eligible weapons/shields within armament proficiency; **columns match Codex/Library** (Name, Rarity, Currency, TP, Range, Damage); Range is **Melee** (never `0`) or `8 spaces` / `16 spaces` from properties (TASK-701 / **TASK-716**); **SourceFilter** All / Realms / My scopes the catalog (Custom defaults All); **Archetype Path** last (not auto-selected); **Create Armament** hatch opens `/item-creator` in a new tab; Currency + Training Points budget bar updates live; selecting a two-handed weapon with a shield already selected shows the hand-slot error and does not apply.
4. Loadout — Armor phase: present for Martial and Powered-Martial with **Codex armor columns** (Rarity, Currency, TP, Damage Red., Agility Red., Abl. Req., Crit +); **skipped for Power only**; single-slot swap on select; TP budget shared with weapons. Same SourceFilter + Create Armament hatch.
5. Loadout — Gear phase: **quantity stepper on the far right replaces the + add button** (no dual chrome; slot wide enough that ± controls are not clipped); **Name / Category / Rarity / Currency** columns (TASK-724 — Category is Adventuring/Tools/… taxonomy, not “Equipment”); incrementing from 0 adds; editing qty in the catalog row or the selected panel works; Currency budget enforced. **TASK-702 / TASK-710 chrome:** ListHeader bar spans full width through the qty track; column titles align with row cells; row hover highlight extends through the stepper **including the ± buttons** (no `bg-surface` / `bg-surface-alt` island); expand a selectable (+) feat/weapon row — description is fully readable (no + blackout overlay) and expanded surface-alt continues into the + / qty column (no empty band below the control).
6. Powers/Techniques (Power or Powered-Martial path-less draft): sequential **innate → powers** screens (Powered-Martial then **techniques**). No **Show** Innate+Powers filter. Each screen has **one** Filters panel (PowerTechniqueFilters compact, no sheet Character filter, **Archetype Path** last and not auto-selected) + SourceFilter; **columns match Official Library**; regular/technique lists filtered by **theoretical L1 max Energy**; innate list by Innate Threshold; TP-blocked rows still hidden (selected kept); **energy-over-cap innate rows stay visible on the innate screen** (TASK-727 — see T003). Expand = Parts & Proficiencies (not duplicate budget chips). **TASK-706:** on the innate screen, Innate Energy and Training Points sit in one `LoadoutBudgetBar` row and match Skills / Ability Points PointStatus size (not a smaller sibling pill). L2 innate modal footer same.
7. For all six: verify at ~360px width — search/filter toolbar and selected-panel rows stay usable, touch targets ≥44px; **Selected** panel has even horizontal cushion from the card border (title, column header, and GLR rows inset — not flush to the frame) and balanced top/bottom padding under the last row (TASK-700). Selected rows keep warning/chips when present.
8. Sanity check a **path-based** (L1) character still shows curated cards + "See more options" opening the existing L2 modal (no regression). Path L2 SourceFilter defaults to Realms Library. Path with empty weapon pool may still omit weapon (path behavior unchanged).
9. **Descriptor chips (TASK-699):** Expand a Library or Codex GLR row — descriptor metadata chips and expandable part/cost chips share the same inline size (readable `text-sm`, not undersized `text-xs`). Filter toolbar pills remain the smaller `sm` role. Optional: `/dev/styleguide` → Entity row parity row matches GLR expanded chips. **Library vs L3 spot-check (TASK-709):** same power/weapon/feat in Official/Codex vs creator L3 matches columns/expand modulo ADR-0012 allowlist.

**Expected**
- All four L3 screens show the catalog inline with live budgets/eligibility; creator feat lists omit Req. Level while retaining eligibility and shared State Feats help; unavailable feats/powers hidden except innate energy-over-cap (T003); custom loadout never skips weapons; Power-only skips armor; gear is quantity-first with readable qty chrome (full-width header + hover through stepper buttons + expanded band through qty/+); equipment headers match Codex; L1 path-based flow is unchanged except innate energy-at-cap now swaps last-in (same `applyInnateSelection` as L3 / path L2 — TASK-727); + expand does not overlay description.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-050-T002 — L3 parity smoke (preview, Power armor, Energy, equipment headers) (TASK-686–690)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-050 — Guided creator L3 parity |
| **Related task** | TASK-686 / TASK-687 / TASK-688 / TASK-689 / TASK-690 / **TASK-708** |
| **Where** | `/characters/new/guided` |
| **Needs** | Signed-in; custom Power draft + Martial techniques draft + optional Power path with `armorStep: required` if available |

**Steps**
1. **Preview strip (TASK-694):** Before the Abilities step, the strip shows name + species/path subtitle only — **no** ability chips and **no** duplicate path/type DescriptorChip (path or Power/Martial/Powered-Martial type lives in the subtitle once). After abilities are selected or the Abilities step is completed, all six signed ability chips appear (`+N` / `0` / `−N`), including on narrow mobile (horizontal scroll). Only `pow_abil` / `mart_abil` chips use power/martial highlight; the rest use default descriptor styling. Path-based draft: path name in subtitle only, not a second chip.
2. **Power armor skip (TASK-689):** Custom Power loadout goes weapon → gear only (no armor). If a Power path exists with armor recommendations / `armorStep: required`, confirm armor phase is still omitted.
3. **Equipment headers (TASK-688 / TASK-724):** On Martial custom loadout, armor list shows Abl. Req. / Crit + / Agility Red. columns aligned with headers; **gear** list shows **Category** (Adventuring/Tools/…) aligned with the header — not a duplicate “Equipment” type; qty stepper has breathing room (not overlapping Currency).
4. **Powers Energy (TASK-687 / TASK-708):** Power custom — Energy column matches Official Realms Library and L2 modal for the same power id (columnar scalars + parts, not false `0`). Martial techniques — Energy values resolve via techniques path (not skewed as powers); max-EN filter uses `mart_abil`.

**Expected**
- Preview always shows six signed abilities (after Abilities gate) with archetype-ability highlight only; path/type identity is subtitle-only; Power never sees armor; equipment columns/qty match Codex intent; techniques Energy is correct.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-050-T003 — L3 innate powers stay listed at energy cap; select swaps last-in (TASK-727)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-050 — Guided creator L3 inline catalog lists |
| **Related task** | TASK-727 |
| **Where** | `/characters/new/guided` — custom (no path) Power/Powered-Martial for steps 1–4; path-based draft for step 5 |
| **Needs** | Signed-in; Powers step with Innate Energy filled (or fill it with one/two innates) |

**Steps**
1. On the L3 **innate** screen, select innate power(s) until the Innate Energy tracker is full (spent = total).
2. Confirm the innate catalog **does not empty** — other threshold-eligible powers remain listed (over-threshold rows may still be hidden).
3. Select a different listed innate. Confirm it becomes selected, last-selected innate(s) drop until the new pick fits, and the Innate Energy tracker stays in sync (not over the cap).
4. Confirm a power above Innate Threshold still cannot be selected (blocked / hidden). Training Points over-budget still blocks (does not swap extra innates just for TP).
5. Path-based (L1) character: fill Innate Energy on curated cards, then **See more options**. In the innate L2 modal, the catalog stays listed at cap; selecting another innate swaps last-in (Add Selected stays enabled when the swap fits).

**Expected**
- Energy-full innate list stays browsable; new select swaps last-in rather than hiding the catalog; threshold and TP rules unchanged. Path L2 USM uses the same swap helper as L3.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-050-T004 — Guided equipment gear Category column (TASK-724)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-050 — Guided creator L3 inline catalog lists |
| **Related task** | TASK-724 |
| **Where** | `/characters/new/guided` — custom Loadout → Equipment (gear), and path L1 **See more options** Browse Equipment |
| **Needs** | Signed-in; custom Martial draft (or any type that reaches gear); desktop (`lg+`) for ListHeader |

**Steps**
1. Custom L3 Loadout → Equipment (gear) list: confirm **CATEGORY** header between Name and Rarity; row cells show taxonomy (Adventuring, Tools, Consumable, …) aligned with that header — not a blank column and not the word Equipment as type.
2. Confirm weapon and armor phases still have no Category column (type is implied by the phase).
3. Path L1: open **See more options** on Equipment — same Category header + cells in the L2 modal.
4. Spot-check ~360px: Category still visible in the expanded row / sort-by if headers collapse.

**Expected**
- Gear GLR has Category header + matching cells; weapon/armor unchanged; L2 modal matches L3.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

#### DEV-V-050-T005 — L3 Selected panel does not jump the catalog on select (TASK-728)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-050 — Guided creator L3 inline catalog lists |
| **Related task** | TASK-728 |
| **Where** | `/characters/new/guided` — custom (no path) Archetype Feats, Character Feat, Loadout, Powers |
| **Needs** | Signed-in; Full Customize draft; desktop pointer (mouse) for the jump check |

**Steps**
1. On Archetype Feats L3 with nothing selected, click a catalog row. Confirm the clicked row stays under the cursor (the Selected card may appear above without shoving the list). Empty selected state before the click is not a large blank hole.
2. Select a second feat. Confirm the extra selected row does not jump the catalog out from under the pointer.
3. Repeat on Character Feat (swap still must not jump), Loadout weapon, and Powers innate + regular lists.
4. Gear quantity-first: incrementing 0→1 adds the selected panel without jumping the qty row.
5. ~360px: first select still usable; selected panel remains visible enough to remove; no huge empty reserved slot when nothing is selected.

**Expected**
- Catalog row stays visually stable on select; Selected items remain available above the list; no reserved empty hole.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-042 — Campaigns RLS SELECT consolidation (TASK-650 / TASK-802)

Post-apply smoke for D6 `multiple_permissive_policies` on `public.campaigns`. Automated SQL parity + RLS access: `node scripts/verify-task-650.mjs`. TASK-802 keeps a single SELECT policy and adds an `owner_id` short-circuit so create/`INSERT … RETURNING` works.

#### DEV-V-042-T001 — Automated advisor + RLS access (DB)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-042 — TASK-650 campaigns RLS |
| **Related task** | TASK-650 |
| **Where** | Terminal / CI |
| **Needs** | `DATABASE_URL` in `.env.local`, `psql` on PATH |

**Steps**
1. Run `node scripts/verify-task-650.mjs`.

**Expected**
- Exit 0; output ends with `TASK-650 verify PASS`.
- Asserts: no duplicate permissive `(cmd, roles)` on `campaigns`; exactly one `authenticated` SELECT policy; `campaigns_owner_select` absent; owner/member/stranger RLS smoke on a sample campaign.

**Report** — `[x] PASS` (agent 2026-08-03) · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-042-T002 — Campaign UI smoke (browser)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-042 |
| **Related task** | TASK-650 |
| **Where** | `/campaigns`, campaign detail |
| **Needs** | Owner account + member account (or invite join) |

**Steps**
1. Signed in as **owner**: `/campaigns` list loads; open a campaign detail.
2. Signed in as **member** (non-owner): same campaign visible in list and detail.
3. Signed in as **non-member**: campaign detail not accessible (403/empty).
4. Invite join flow still works for a new player with valid invite code.

**Expected**
- Owner and member read access unchanged after policy drop; non-participant blocked; join-by-invite unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-042-T003 — Create campaign (signed-in owner)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-042 |
| **Related task** | TASK-802 |
| **Where** | `/campaigns` → Create tab |
| **Needs** | Signed-in account under the campaign quota |

**Steps**
1. Sign in and open `/campaigns`.
2. Open the **Create** tab. Enter a name of at least 2 characters (optional description).
3. Submit. Confirm the success state shows an 8-character invite code (no “Failed to create campaign”).
4. Click **View Campaign** — detail loads for the new campaign; invite code matches.
5. Return to **My Campaigns** — the new campaign is in the list.
6. Optional: DevTools console should not show a Sentry `ingest.us.sentry.io` Content-Security-Policy refusal.

**Expected**
- Campaign is created; invite code is shown; detail and list include the new campaign.
- Browser console may still show Grammarly / Iterable / Blackboard extension noise (ignore).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-044 — Power Creator AoE apply duration + duration modifiers (TASK-672)

Saving a power must persist Area **Apply duration** and Duration modifiers (Focus / No Harm / Ends on Activation / Sustain). Library GLR Energy after reload must match the creator total.

#### DEV-V-044-T001 — AoE Apply duration survives save/reload

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-044 — Power Creator AoE apply duration + duration modifiers |
| **Related task** | TASK-672 |
| **Where** | `/power-creator` → Library Powers |
| **Needs** | Signed-in user |

**Steps**
1. Open `/power-creator`. Set Area to **Sphere** (any level), check **Apply duration**.
2. Set Duration to **1 minute** (or longer) and enable **Focus** (and optionally Sustain).
3. Confirm the Area section EN badge rises vs unchecked Apply duration (duration multiplier applied), and note the sidebar Energy total.
4. Save to My Library; Load the power (or open `?edit=`). Confirm **Apply duration** is still checked and Focus/Sustain restored.
5. Open the power in Library — Energy matches the creator total from step 3 (higher than the same power without Apply duration).

**Expected**
- Checkbox and duration modifiers round-trip; Area section badge + GLR Energy include apply-duration contribution when a duration is set.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---


## DEV-V-041 — Supabase least-privilege Phase 2 (TASK-649)

Post-apply smoke for anon grant hardening, public read paths, and guest character sheets. Automated SQL parity: `node scripts/verify-task-649.mjs`.

#### DEV-V-041-T001 — Public codex + official library (logged out)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-041 — TASK-649 DB hardening |
| **Related task** | TASK-649 |
| **Where** | `/codex`, Realms Library tabs |
| **Needs** | Logged out (incognito) |

**Steps**
1. Open `/codex` — feats/skills/species load without sign-in.
2. Open Realms Library → Powers (or Items) — official list loads.
3. Expand a row with bank art — image renders (direct URL).

**Expected**
- No permission-denied errors; codex and official library readable without auth.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-041-T002 — Guest public character sheet

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-041 |
| **Related task** | TASK-649 |
| **Where** | Public character URL |
| **Needs** | A character with `visibility = public`; logged out |

**Steps**
1. Open a known public character sheet URL while logged out.
2. Confirm sheet loads (name, portrait if set, library-derived cards).
3. Open a private character URL while logged out — expect 404 / not found.

**Expected**
- Public sheet readable for guests; private sheet blocked.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-041-T003 — Authenticated flows unchanged

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-041 |
| **Related task** | TASK-649 |
| **Where** | Login, own character, campaign |
| **Needs** | Signed-in user |

**Steps**
1. Sign in; open own character sheet — full edit access.
2. Join or open a campaign roster — member sheets load as before.
3. Admin codex edit (if admin) — save still works.

**Expected**
- No regression on authenticated owner/campaign/admin flows.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-041-T004 — GET honors visibility column over blob (TASK-735)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-041 |
| **Related task** | TASK-735 |
| **Where** | Public / private character URLs while logged out |
| **Needs** | A public character; a private character (owner URL) |

**Steps**
1. Logged out: public sheet still loads (column `public`).
2. Logged out: private sheet 404s even if you previously saw it as owner.
3. Signed-in owner: private sheet still loads.

**Expected**
- Cross-user GET uses `characters.visibility` (not a stale `data.visibility` blob). Automated: `route.test.ts` column-private + blob-public → 404.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-043 — Wave 5 page facade splits (TASK-666)

Smoke suite for Wave 5 hook/section extracts. Listed facades are under ~500 LOC; verify routes still load and core actions work after splits (no behavior change intended).

#### DEV-V-043-T001 — Combat encounter play after Wave 5 hook split

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-043 — Wave 5 page facade splits |
| **Related task** | TASK-666 (666a) |
| **Where** | `/encounters/<id>/combat` (or Mixed → Combat tab) |
| **Needs** | Signed-in; an existing combat encounter (or create one) |

**Steps**
1. Open the combat encounter — combatants list + Add Combatant sidebar render (no blank flash).
2. Add a combatant (manual and/or From Library / Campaign).
3. Start encounter → Next/Previous turn; edit HP/AP; wait for autosave; refresh — state restores.

**Expected**
- Round chrome, roster actions, and linked-character sync behave as before the `use-combat-encounter-view` split.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-043-T002 — My Account after facade split

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-043 |
| **Related task** | TASK-666 (666b) |
| **Where** | `/my-account` |
| **Needs** | Signed-in account |

**Steps**
1. Open `/my-account` — role limits, profile, preferences, security, and danger-zone cards render.
2. Toggle a preference (e.g. tutorials) and refresh — preference persists.
3. Spot-check profile display name / email fields still load.

**Expected**
- No blank page; section cards match pre-split account surface.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-043-T003 — Campaign detail after facade split

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-043 |
| **Related task** | TASK-666 (666c) |
| **Where** | `/campaigns/<id>` |
| **Needs** | Signed-in; owned or joined campaign |

**Steps**
1. Open campaign detail — header, invite, roster, and roll log sections render.
2. Copy/view invite if owner; confirm roster characters list.
3. Optional: open roll log entries if any exist.

**Expected**
- Campaign detail sections mount without blank flash; invite/roster/log chrome unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-043-T004 — Character sheet after page facade split

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-043 |
| **Related task** | TASK-666 (666d) |
| **Where** | `/characters/<id>` |
| **Needs** | Signed-in; owned character |

**Steps**
1. Open character sheet — header stats + section panels load (no blank flash).
2. Toggle edit mode; expand Library / Skills briefly.
3. Refresh — sheet restores.

**Expected**
- Sheet orchestration via `use-character-sheet-page` (+ `page-data` / `page-ui`) still wires modals/sections; no regression vs pre-split page.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-043-T005 — Crafting tool after derived extract

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-043 |
| **Related task** | TASK-666 (666e) |
| **Where** | `/crafting/<sessionId>` |
| **Needs** | Signed-in; existing crafting session (or create one) |

**Steps**
1. Open crafting session — tool loads (no blank flash).
2. Change quantity/options — requirements/summary update.
3. Enter a roll value if available; refresh — session restores.

**Expected**
- Derived calc extract does not break options/rolls/summary wiring.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-043-T006 — Edit Species modal after shell/hook split

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-043 |
| **Related task** | TASK-666 (666f) |
| **Where** | Character sheet → Edit Species |
| **Needs** | Signed-in; owned character with species/ancestry |

**Steps**
1. Open Edit Species — species step grid renders (`fullScreenOnMobile` still applies on narrow viewport). Sticky Modal `footer` shows Cancel / Next (or Save on ancestry).
2. Continue to ancestry step — trait picks render. For mixed species, skills use shared `MixedSpeciesSkillPicker` (same as Advanced creator; intentional TASK-670 unification, not pre-split pill chips).
3. Cancel without save — sheet unchanged; optional: save once and confirm ancestry persists.

**Expected**
- Modal shell + `use-edit-species-modal` / step components match pre-split flow (footer sticky; mixed skills via shared picker).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-043-T007 — Admin core rules category tabs after editor split

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-043 |
| **Related task** | TASK-666 (666g) |
| **Where** | `/admin/core-rules` |
| **Needs** | Admin account |

**Steps**
1. Open admin core rules — category tabs render.
2. Switch across several tabs (Progression, Combat, Archetypes, Conditions, Crafting, etc.) — each editor mounts.
3. Edit one non-destructive field (or open then discard) — no crash / blank panel.

**Expected**
- `core-rules-category-editor` facade still routes each tab to its category editor module.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-043-T008 — Combat linked-character HP sync via React Query (TASK-762)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-043 — Wave 5 page facade splits |
| **Related task** | TASK-762 |
| **Where** | `/encounters/<id>/combat` (campaign-linked combatants) |
| **Needs** | Signed-in campaign member; a combat encounter with at least one campaign-character combatant; that character's sheet open in another tab helps |
| **CI** | Partial — `use-campaigns.cache.test.ts` (`characterEncounter` key distinct from `characterView`; `getCampaignCharacterForEncounter` hits `?scope=encounter`) |

**Steps**
1. Open the combat encounter. Linked combatant HP/EN/AP match the character sheet (sync on load; spinner is the encounter load, not a separate uncancelled fetch).
2. In another tab, change that character's current HP on the sheet and save. Return to the combat tab (or wait for realtime). Combat HP updates; the roster is not replaced with a full RM sheet.
3. Hide the combat tab (~10s) then show it again — resources refetch once without duplicating combatants.
4. Add Combatant → Campaign Characters (and, if the encounter has a linked campaign, Add all). Added rows show live HP/EN from the same payload. A player member can add (not RM-only).

**Expected**
- Linked sync is `useCampaignCharacterEncounters` / `campaignKeys.characterEncounter` against `getCampaignCharacterForEncounter` (`?scope=encounter`). No parallel `useEffect` `apiFetch` for that URL.
- Add Combatant and add-all use `fetchCampaignCharacterForEncounter` (same fetcher; not a third copy of the URL).
- 90s visibility-gated poll and postgres realtime merge still apply HP/EN/AP. RM view (`useCampaignCharacterView`) is unchanged.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-051 — Guided funnel entry, trusted create, feat choice (TASK-738 / TASK-754)

Audit report 03 P1-6 through P1-10, plus TASK-754 create 500 / error copy, plus TASK-804 guest **Continue Without Saving**. Automated cover: `character-legality.test.ts`, `src/app/api/characters/route.test.ts`, `creator-entry-mode.test.ts`, `feat-selection.test.ts`, `character-save.test.ts` (create-error copy). Guest Continue Without Saving is human-only (T011). These tests are the parts only a browser can show.

#### DEV-V-051-T001 — Guided creator entry does not wait on the session

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-051 — TASK-738 |
| **Related task** | TASK-738 (P1-6) |
| **Where** | `/characters/new/guided` |
| **Needs** | Logged out (incognito); throttle the network to Slow 3G to make the auth round-trip visible |

**Steps**
1. Logged out with Slow 3G throttling, open `/characters/new/guided`.
2. Watch the first paint after hydration.
3. Pick a path and continue to **2. Species**.

**Expected**
- The Path step renders as soon as the page hydrates; it does not sit on a full-screen "Loading..." for the length of the session request.
- No hydration warning in the console, and a reload mid-flow returns to the sub-step you were on (persisted draft still applies).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-051-T002 — Guest still cannot save without signing in

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-051 |
| **Related task** | TASK-738 (P1-6) |
| **Where** | `/characters/new/guided` → **10. Your Hero** |
| **Needs** | Logged out |

**Steps**
1. Complete the whole funnel while logged out.
2. On **Your Hero**, name the character and allocate all Health/Energy.
3. Press **Create character**.

**Expected**
- The login prompt modal opens; nothing is created.
- After signing in you return to the creator with the draft intact, and **Create character** then saves.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-051-T003 — A retried save does not create two characters

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-051 |
| **Related task** | TASK-738 (P1-8) |
| **Where** | `/characters/new/guided` → **10. Your Hero**, then `/characters` |
| **Needs** | Signed-in user; DevTools Network |

**Steps**
1. Complete the funnel to **Your Hero** so **Create character** is enabled.
2. In DevTools → Network, drop the *response* to `POST /api/characters` (request blocking after the request is sent, or go Offline immediately after the click) — the point is a lost response, not a request that never left.
3. Let the error toast appear, restore the network, and press **Create character** again.
4. Open `/characters`. Confirm there is still only one new character.
5. Repeat 1–2 on a second run, then **reload the page** after the lost response (do not press Create again first). Restore the network, press **Create character**. Open `/characters` again.

**Expected**
- Exactly one character in the list for each run — the retry returned the character the first attempt created.
- You land on that character's sheet, not on a second copy.
- The reload-then-retry case also leaves one character (the idempotency key is on the persisted draft, not only in memory).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-051-T004 — Advanced creator save is unaffected

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-051 |
| **Related task** | TASK-738 (P1-7, P1-8) |
| **Where** | `/characters/new` → Advanced creator → Finalize |
| **Needs** | Signed-in user |

**Steps**
1. Build a legal level-1 character in the Advanced creator.
2. Save from the Finalize step.
3. Open the saved sheet and check abilities, skills, feats, Currency, Health and Energy.

**Expected**
- The character saves with no 400; the server legality check accepts a normal Advanced build.
- Sheet values match what Finalize showed. (A 400 reading "Character is not a legal level 1 build" here is a **FAIL** — report the `details` list from the response.)

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-051-T005 — Recommended abilities save what the step displays

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-051 |
| **Related task** | TASK-738 (P1-9) |
| **Where** | `/characters/new/guided` → **4. Abilities** |
| **Needs** | Signed-in user; a path whose recommended array is not all zeros |

**Steps**
1. Pick a path, reach **4. Abilities** on the recommended (non-customized) view; note the six scores.
2. Hard-refresh directly onto the Abilities step and let the codex finish loading.
3. Continue through the funnel and save; open the sheet's ability tiles.

**Expected**
- The scores after the refresh match the scores from step 1 — no different array flashes in and sticks.
- Saved abilities equal what **4. Abilities** displayed.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-051-T006 — Character feat is not chosen for the player

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-051 |
| **Related task** | TASK-738 (P1-10) |
| **Where** | `/characters/new/guided` → **7. Character Feat** |
| **Needs** | Signed-in user; an archetype path with curated character feats authored |

**Steps**
1. Reach **7. Character Feat** for the first time.
2. Read the completion hint next to **Continue →** without touching a card.
3. Select a card, then select the same card again.

**Expected**
- On arrival the hint reads **0 / 1** and **Continue →** is disabled — no card is pre-selected.
- Selecting sets **1 / 1** and enables Continue; selecting the same card again clears it back to **0 / 1**.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-051-T007 — Curated feat cards hide picks the build cannot take

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-051 |
| **Related task** | TASK-738 (P1-10) |
| **Where** | `/characters/new/guided` → **6. Archetype Feats** and **7. Character Feat** |
| **Needs** | Signed-in user; a curated feat with an ability or skill requirement this build fails |

**Steps**
1. Build toward a path whose curated feat list includes a feat with an unmet requirement (low ability score, or a skill you did not take).
2. Open **6. Archetype Feats** and **7. Character Feat**.
3. Open **See more…** on each and compare the catalog with the cards on the step.

**Expected**
- Requirement-failing feats are not offered as cards, matching what the browse catalog shows.
- If a feat was already selected and the build later stopped qualifying, its card stays visible so it can be deselected.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-051-T008 — Empty L1 after the requirement filter still has See more

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-051 |
| **Related task** | TASK-738 (P1-10) |
| **Where** | `/characters/new/guided` → **7. Character Feat** (also **6. Archetype Feats** if every curated card is gated) |
| **Needs** | Signed-in user; a path whose curated Character Feats this build cannot take (Beast Tamer: several `lvl_req` > 1; Berserker: skill-gated) |

**Steps**
1. Pick a path whose curated Character Feats this level-1 build will not qualify for (Beast Tamer or Berserker are known cases).
2. Keep abilities/skills such that those curated cards fail requirements.
3. Open **7. Character Feat**.
4. Press **See more Character Feats** and pick a feat this build *does* qualify for.

**Expected**
- Layer 1 shows the empty state that they do not qualify (not “none exist”), and **See more Character Feats** is still available.
- After confirming a qualifying pick from the catalog, the step is **1 / 1** and Continue is enabled.
- Saving this character does not 400 on feat requirements.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-051-T009 — Legal Guided and Legacy create succeed (TASK-754)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-051 |
| **Related task** | TASK-754 |
| **Where** | `/characters/new/guided` → **Your Hero**; `/characters/new/advanced` → Finalize |
| **Needs** | Signed-in user; a complete legal level-1 build |

**Steps**
1. Guided: finish a legal level-1 path build (all chapters satisfied, HP/EN remaining 0, named). Press **Create character**.
2. Confirm the character appears on **My Characters** and the sheet opens (or play-together offers it).
3. Repeat on **Legacy** (`/characters/new/advanced`) with a legal Finalize create.

**Expected**
- Neither create 500s. No toast/alert about a missing column, Postgres, or a duplicate.
- Success toast **Your character is ready!** (Guided) / character is created (Legacy).
- A second click after success does not insert a second row (idempotency still holds — T003).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-051-T010 — Create error copy is actionable, not a duplicate hint (TASK-754)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-051 |
| **Related task** | TASK-754 |
| **Where** | `/characters/new/guided` → **Your Hero** (also Legacy Finalize) |
| **Needs** | Signed-in user; a build that can fail legality (over-budget abilities) **and** a way to observe a generic failure if one occurs |

**Steps**
1. Guided: from a complete build, temporarily overspend ability points if a test override exists; otherwise skip to step 3 if you cannot force a 400. Press **Create character**.
2. Read the error toast.
3. If you can force a server 500 (disconnect DB is out of scope — this is a copy check): confirm the toast is **Could not create your character. Please try again.** with **no** “Check My Characters… duplicate” sentence.
4. Offline / airplane-mode the tab after the button is armed, press Create, then restore: the toast **may** mention My Characters (lost-response case).

**Expected**
- A 400 legality failure lists the rule(s) (ability/skill/feat), not the 500 string, and does **not** tell the player they may have created a duplicate.
- A 500 (if observed) is “Could not create… try again” without My Characters / duplicate.
- My Characters / duplicate copy appears only when the request may have succeeded (network drop).
- Desktop + ~360px.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-051-T011 — Continue Without Saving dismisses guest login (TASK-804)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-051 |
| **Related task** | TASK-804 |
| **Where** | `/characters/new/guided` → **10. Your Hero** |
| **Needs** | Logged out (incognito); a complete guided draft (all chapters satisfied, Health/Energy remaining 0, named) |

**Steps**
1. Complete the funnel while logged out.
2. On **Your Hero**, press **Create character**.
3. On **Login Required to Save**, press **Continue Without Saving**.
4. Confirm you are still on **Your Hero** with the same name and draft.
5. Press **Create character** again, then **Continue Without Saving** once more. Repeat at ~360px.

**Expected**
- The login prompt closes and stays closed (it does not flash and reopen).
- Nothing is created. The local draft is intact. No navigation.
- A second Create opens the same prompt (guest still cannot save).
- On a phone, **Continue Without Saving** is in the sticky modal footer and still dismisses.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-052 — Archetype Path list filter (TASK-751 / TASK-752)

Filters browse lists by what an archetype path recommends, read live from `path_data` (ADR-0014). Automated cover: `path-recommendation-index.test.ts` (union, id/name resolve, `remove_*` excluded, hidden paths omitted, admin edit on rebuild, multi-kind bags, live list filter), `feat-list.test.ts`, `skill-list.test.ts`, and `equipment-list.test.ts`. These steps are the parts only a browser can show.

#### DEV-V-052-T001 — Codex Feats filter by path, with chips and live admin edits

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-052 — TASK-751 |
| **Related task** | TASK-751 |
| **Where** | `/codex` → **Feats**; `/admin/codex` → **Feats** and **Archetypes** |
| **Needs** | Two seeded paths that recommend different feats (e.g. a Martial and a Power path); admin access for the edit step |

**Steps**
1. Open `/codex` → **Feats**, expand **Filters**, and find **Archetype Path** as the **last** control (bottom-right of the grid), with its `(i)` help. Confirm the dropdown groups options under **Power Paths / Powered-Martial Paths / Martial Paths** and lists no admin-only path.
2. Select one path. Note the row count, then select a second path.
3. Read the name row of a few matching feats.
4. With paths still selected, set **Max Required Level** to `1`, then pick a **Category**, then clear both.
5. Remove both path chips (the `x` on each).
6. Select a path that recommends nothing (or combine filters until nothing matches) and read the empty state.
7. Admin: open `/admin/codex` → **Archetypes**, add a feat to one path's level-1 recommendations, save, then return to `/codex` → **Feats** with that path selected. Also check `/admin/codex` → **Feats** has the same filter.

**Expected**
- Selecting one path shows only feats that path recommends; adding the second path **grows** the list (union — not an intersection).
- Matching rows show a small chip with each **selected** path name that recommends that feat, beside the name. No chips appear when no path is selected, and a path you did not select never appears as a chip.
- Level/category filters still apply on top of the path filter (a feat recommended at path level 5 is not hidden for that reason, but `lvl_req` above the max still drops out). Higher ranks of a recommended feat family stay listed.
- Clearing the path chips restores the unfiltered list.
- Empty state reads "No feats the selected archetype paths recommend match your filters." — not a blank list.
- The newly recommended feat appears for that path with no page reload beyond returning to the tab (no second dataset to reseed).
- Desktop + ~360px: the filter is full-width on mobile and the name chips do not squeeze the feat name.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-052-T002 — Codex Skills filter by path

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-052 — TASK-752 |
| **Related task** | TASK-752 |
| **Where** | `/codex` → **Skills**; `/admin/codex` → **Skills** |
| **Needs** | A path that recommends at least one skill |

**Steps**
1. Open `/codex` → **Skills**, expand **Filters**, and find **Archetype Path** as the last control (bottom-right of the grid), with its `(i)` help.
2. Select one path, then a second path. Read name-row chips. Clear the path chips.
3. Combine the path filter with Ability / Base Skill until the list is empty.

**Expected**
- The control is last in the filter grid, not first. Multi-select is a union. Matching rows chip only the selected paths that recommend them; chips vanish when the filter is cleared.
- Empty copy reads "No skills the selected archetype paths recommend match your filters."
- Desktop + ~360px.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-052-T003 — Library Powers filter by path (including innate bag)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-052 — TASK-752 |
| **Related task** | TASK-752 |
| **Where** | `/library` → **Powers** (Realms Library and My Library) |
| **Needs** | A path with a recommended power and/or innate power |

**Steps**
1. Expand **Filters** and confirm **Archetype Path** is the last control.
2. Select a path that recommends a regular power; confirm that power is listed.
3. Select a path that recommends an innate power (not also in the regular powers bag); confirm that innate still appears on this powers list.
4. Turn on **Innate Eligible** while a path is selected; other filters still apply. Read empty copy if nothing matches.

**Expected**
- Same shared `ArchetypePathFilter` as Codex Feats. Innate recommendations use the `innatePowers` bag (they still show on the powers list). Name chips only while filtering. Empty copy names the path filter.
- Desktop + ~360px.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-052-T004 — Library Techniques filter by path

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-052 — TASK-752 |
| **Related task** | TASK-752 |
| **Where** | `/library` → **Techniques** (standard, not Empowered) |
| **Needs** | A path that recommends at least one technique |

**Steps**
1. Expand **Filters** and confirm **Archetype Path** is last.
2. Select one path, then a second; confirm union + name chips; clear the filter.
3. Confirm Empowered Techniques has no path filter.

**Expected**
- Standard techniques filter by the `techniques` bag. Empty copy names the path filter. Empowered tab is unchanged.
- Desktop + ~360px.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-052-T005 — Codex Equipment + Library weapons/armor/shields filter by path

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-052 — TASK-752 |
| **Related task** | TASK-752 |
| **Where** | `/codex` → **Equipment**; `/library` → **Weapons** (and Armor / Shields if seeded) |
| **Needs** | A path that recommends a weapon (`armaments`) and/or gear (`equipment`) |

**Steps**
1. Codex Equipment: expand **Filters**; **Archetype Path** is last (after Category / Rarity / currency). Select a path that recommends a weapon and a torch/kit; both kinds of rows appear. Read name chips.
2. Library Weapons: same control last in `ArmamentFilters`; selecting that path keeps the recommended weapon and hides unrelated weapons.
3. Force an empty path match and read the empty copy.

**Expected**
- Codex mixed list unions `armaments` + `equipment` bags. Library weapons/armor/shields use `armaments` only. Chips only while filtering. Empty copy names the path filter.
- Desktop + ~360px.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-052-T006 — Creator L2 / L3 and sheet add-X filter by path

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-052 — TASK-753 |
| **Related task** | TASK-753, **TASK-878** |
| **Where** | Guided See more on Feats, Powers/Techniques, Loadout; custom inline catalogs; sheet Add Feat / Add Skill / Add Power (not Empowered) |
| **Needs** | A Martial path character and a custom (no-path) draft; sheet with library add |

**Steps**
1. Path character: Archetype Feats **See more** — Filters expanded; **Archetype Path** last and auto-selected to **Any Martial** (one chip, not every martial path). Path-name chips, not Recommended. Clear paths — list widens. Repeat on Powers **See more options** and Loadout **See more options**.
2. Custom / no-path: feat, loadout, and powers inline catalogs show **Archetype Path** last with **no** auto-select. Selecting paths narrows; clearing returns the eligible catalog.
3. Sheet: Add Feat / Add Skill / Add Power — same last control. Add Feat keeps family rank chips when only one rank is recommended. Empowered add has no path filter.
4. **Quick select:** dropdown offers **Any**, **Any Power**, **Any Martial**, **Any Powered-Martial** first; selecting **Any Power** replaces individual Power path chips (does not stack). **Any** replaces the whole selection.

**Expected**
- Same shared `ArchetypePathFilter` and live `path_data` index as Codex. Union multi-select via aliases or individual paths. Chips only while filtering. Desktop + ~360px.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-053 — Wave 3A SEO + token hygiene (TASK-769 / TASK-770 / TASK-771)

Public crawl metadata and the muted-token strip. Automated: `src/lib/site-url.test.ts`, `src/app/robots-sitemap.test.ts`.

#### DEV-V-053-T001 — robots.txt and sitemap.xml

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-053 — Wave 3A SEO |
| **Related task** | TASK-771 |
| **Where** | `/robots.txt`, `/sitemap.xml` |
| **Needs** | Dev server or production |

**Steps**
1. Open `/robots.txt`.
2. Open `/sitemap.xml`.
3. Confirm `/dev/styleguide` is not listed in the sitemap.

**Expected**
- robots.txt disallows `/dev/`, `/login`, `/register`, `/api/`, `/admin`, `/my-account`, and auth recovery paths, and points at `/sitemap.xml`.
- sitemap lists `/`, `/about`, `/codex`, `/rules`, `/resources`, `/privacy`, `/terms`, `/library`, `/characters/new` on `https://realmsrpg.com` (or the current `NEXT_PUBLIC_SITE_URL`).
- Desktop + ~360px N/A.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-053-T002 — Open Graph and metadataBase

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-053 — Wave 3A SEO |
| **Related task** | TASK-771 |
| **Where** | `/` view-source or browser Network |
| **Needs** | — |

**Steps**
1. View source on `/`.
2. Confirm `og:title` / `twitter:card` and an `og:image` URL that resolves (opengraph-image).
3. Confirm relative OG URLs are not used (metadataBase is set).

**Expected**
- Title RealmsRPG; twitter card `summary_large_image`; og:image is an absolute URL on the canonical origin.
- `<link rel="canonical">` points at `https://realmsrpg.com/` (or the current `NEXT_PUBLIC_SITE_URL`).
- Sharing the homepage in Discord/Slack shows a card (after deploy), not a grey box.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-053-T003 — Styleguide and auth are noindex

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-053 — Wave 3A SEO |
| **Related task** | TASK-771 |
| **Where** | `/dev/styleguide`, `/login` |
| **Needs** | — |

**Steps**
1. View source on `/dev/styleguide` and `/login`.
2. Confirm a robots noindex meta (or equivalent robots directive).

**Expected**
- Both routes are noindex; styleguide still loads (visual baselines). `/admin` layout is also noindex. Desktop + ~360px N/A.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-053-T004 — Privacy intro URL is realmsrpg.com

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-053 — Wave 3A SEO |
| **Related task** | TASK-771 |
| **Where** | `/privacy` |
| **Needs** | — |

**Steps**
1. Open `/privacy`.
2. Read the intro site URL link.

**Expected**
- The linked origin is `https://realmsrpg.com` (canonical custom domain), matching `SITE_URL`.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-053-T005 — Muted text still reads in dark mode (no pairing)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-053 — Wave 3A hygiene |
| **Related task** | TASK-770 |
| **Where** | Character sheet Skills / Library (dark theme) |
| **Needs** | A saved character |

**Steps**
1. Open a character sheet, switch to dark theme.
2. Spot-check muted helper copy (Skills empty/disabled, Library tab chrome).

**Expected**
- Muted copy is still readable (same grey as before). No missing-color flash. Desktop + ~360px.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-053-T006 — Crafting / My Account titles + Rules chapter index (TASK-793 / TASK-853)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-053 — Wave 3A SEO |
| **Related task** | TASK-793 / TASK-853 |
| **Where** | `/crafting`, `/my-account`, `/rules` |
| **Needs** | Signed-in account for `/my-account` |

**Steps**
1. Open `/crafting` — document title includes **Crafting**.
2. Open `/my-account` — document title includes **My Account**; view-source is noindex.
3. Open `/rules` — confirm crawlable intro text (seo description), a chapter list / RulebookNav, and that the Google Doc is a view-source / open-in-new-tab link only (no iframe). Open one chapter.

**Expected**
- Missing layout titles from the Aug audit are filled. `/rules` is the MDX chapter index (ADR-0021); Google Doc is view-source only. Desktop + ~360px.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-054 — Codex per-collection fetch + virtualized browse rows (TASK-775)

Codex browse fetches only the open tab's collection (`GET /api/codex?collection=`) and window-virtualizes long row lists. Automated cover: `src/app/api/codex/route.test.ts` (slice keys, tables queried, 400 on unknown) and `use-codex.keys.test.ts` (key prefix, parts split). These steps are the parts only a browser can show.

#### DEV-V-054-T001 — Codex tab downloads its own collection

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-054 — Codex per-collection fetch |
| **Related task** | TASK-775 |
| **Where** | `/codex` → Feats, then Skills, then Archetypes |
| **Needs** | Seeded codex data; browser Network tab |

**Steps**
1. Open `/codex` → **Feats** with Network recording.
2. Confirm the codex request is `/api/codex?collection=feats` and that no request downloads the full payload.
3. Switch to **Skills**, then **Archetypes** — each fires its own `?collection=` request once, then stays cached.
4. Expand **Filters** → **Archetype Path** on Feats and pick a path; confirm filtering works and only adds `?collection=archetypes`.

**Expected**
- One request per visited collection, no full-codex download on browse. Path filter, search, sort, and character filter behave exactly as before. Desktop + ~360px.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-054-T002 — Long feat list scrolls and expands correctly

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-054 — Virtualized browse rows |
| **Related task** | TASK-775 |
| **Where** | `/codex` → Feats (unfiltered, hundreds of rows) |
| **Needs** | Full codex feat data |

**Steps**
1. Open `/codex` → **Feats** with no filters and scroll from the first row to the last, then back up.
2. Confirm rows render as they enter view with no blank gaps, flicker, or jumping scroll position, and that the scrollbar length stays sensible.
3. Expand a feat mid-list; scroll past it and back. Expand a multi-rank feat and confirm its **Feat Levels** chips still work.
4. Expand **Filters** (do not apply any) and confirm rows stay aligned under the header — no overlap, gap, or jump. Collapse Filters and confirm the same.
5. Filter down to a short list (e.g. search a specific feat) and confirm rows render normally.
6. Repeat the scroll at ~360px width.

**Expected**
- Long lists scroll smoothly and are noticeably faster to first paint than before. Expanding Filters does not leave rows stuck at the old offset. A row that scrolls out of view and back is collapsed again (expected with virtualization). Short lists behave exactly as before. Desktop + ~360px.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-054-T003 — Admin codex save still refreshes browse

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-054 — Codex per-collection fetch |
| **Related task** | TASK-775 |
| **Where** | `/admin/codex` → Feats (or Skills), then `/codex` |
| **Needs** | Admin account |

**Steps**
1. In `/admin/codex`, edit a feat name and save.
2. Confirm the admin list shows the new name, and the codex spreadsheet view still loads every tab.
3. Open `/codex` → **Feats** and confirm the edited name appears without a hard reload.
4. Open a character sheet or creator and confirm game rules (health/energy formulas, conditions) still load.

**Expected**
- `['codex']` invalidation still reaches each collection slice, so admin saves surface on browse. `useGameRules` reads the `coreRules` slice with no missing-rules fallback flash. Desktop + ~360px.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-055 — ADR-0023 control touch tiers (TASK-841)

**Related tasks:** TASK-841, TASK-847, TASK-830, TASK-850, TASK-851, TASK-857, TASK-865  
**Start URL:** `/dev/styleguide` (Buttons row); also `/` footer and `/creature-creator` ability tiles  
**Needs:** Coarse pointer (phone or DevTools touch emulation). Fine-pointer desktop is a separate check.

#### DEV-V-055-T001 — Button / IconButton / stepper / footer tiers

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-055 — ADR-0023 control touch tiers |
| **Section** | Shared controls |
| **Related task** | TASK-841 |
| **Where** | `/dev/styleguide` Buttons; site footer; Creature Creator STR/VIT tiles; any add-X USM (e.g. sheet Add Feat) |
| **Needs** | Touch emulation at 390px and a fine-pointer desktop window |

**Steps**
1. Open `/dev/styleguide` with **touch** emulation at 390px. Inspect **Large** (should be ≥48px tall), default **Primary** (≥44px tall, not extra-wide), **Small** and **Link** (painted ≤36px, still tappable).
2. Confirm **Link** is not a ~167×44 slab around the text.
3. Switch to a fine-pointer / desktop window: icon buttons and Small stay compact (no empty 44px padding).
4. Open `/` and check footer nav links: compact painted height, tappable on touch, not 44px-tall slabs on desktop.
5. Open `/creature-creator` at 390px: ability ± glyphs stay inside their tile (Dense painted size, not 44×44 layout).
6. Open any add-X USM (sheet **Add Feat** or Library load) at 390px touch: **Add Selected** is ≥48px tall; **Cancel** stays Standard (~44px), not a matching 48px slab.

**Expected**
- Coarse Primary (`size="lg"`, including USM **Add Selected** / modal Save / Continue) ≥48px tall; Standard standalone and Cancel ≥44px tall; Dense (`sm` / `link` / steppers) paint ≤36px with a 44px expanded hit.
- Fine pointer stays compact. Footer links and `variant="link"` are not 167×44 boxes.
- Creature ability steppers do not overflow their tile from a 44px min-w.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-055-T006 — Dense hit class is `.hit-area-dense` only (TASK-857)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-055 — ADR-0023 control touch tiers |
| **Related task** | TASK-857 |
| **Where** | Sheet Edit/Temp pencils; CombatantCard Dmg/Heal; Chip dismiss; `/dev/styleguide` Small/Link |
| **Needs** | Touch emulation at 390px plus a fine-pointer desktop window |

**Steps**
1. Open a loaded sheet in Edit at 390px touch: Abilities/Skills pencils stay icon-dense (not a 44px painted slab) and remain tappable (Dense expanded hit).
2. Open an encounter combatant: Dmg/Heal/Use/Rest stay compact paint with a tappable expanded hit. Fine-pointer desktop stays compact.
3. Confirm Compact SegmentedControl (sheet Skills All/Proficient) and Chip dismiss stay Dense, not Standard 44 painted.

**Expected**
- Coarse Dense hit stays 32px paint + 44 expanded; fine pointer stays compact. Call sites use `.hit-area-dense` or `.hit-area-dense-square`. Do not change Primary/Standard tiers. Do not retag list thumbs, image mattes, or innate-toggle.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-055-T002 — Leftover viewport hit slabs on Codex spreadsheet, list Filters, RollLog send (TASK-847)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-055 — ADR-0023 control touch tiers |
| **Related task** | TASK-847 |
| **Where** | Admin Codex spreadsheet toolbar; Library/Codex list **Filters**; character-sheet RollLog send |
| **Needs** | Admin for spreadsheet; any sheet with RollLog; touch emulation at 390px plus a fine-pointer desktop window |

**Steps**
1. Open an Admin Codex spreadsheet at 390px touch vs desktop: toolbar icon hits use `@media (pointer: coarse)` or `IconButton` tiers — not `md:min-h-0` shrinking because the viewport is wide.
2. Open a list with **Filters** (Library or Codex browse): the Filters toggle is Standard under coarse pointer and compact under fine pointer (`max-md:` 44 is gone).
3. Open a character sheet RollLog: **send** uses shared `Button` (not a raw `min-h-[44px] min-w-[44px]` slab).

**Expected**
- Those three surfaces match ADR-0023 (pointer for hit area, viewport for layout). Header hamburger / grid selection / combatant compact are TASK-851 (DEV-V-055 T005). Do not retag list thumbs, image mattes, or innate-toggle.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-055-T004 — RollButton hit area is pointer-tier, not viewport `md:min-h-0` (TASK-850)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-055 — ADR-0023 control touch tiers |
| **Related task** | TASK-850 |
| **Where** | Character sheet ability/skill/defense `RollButton`; `/dev/styleguide` if a roll sample exists |
| **Needs** | Touch emulation at 390px plus a fine-pointer desktop window |

**Steps**
1. Open a loaded character sheet with **touch** emulation at 390px. Ability or skill **RollButton** is ≥44px tall (`touch-tier-standard` or shared Button Standard).
2. Switch to a fine-pointer desktop window: the same button is compact (no empty 44px padding from a leftover `min-h-[44px]`).
3. Confirm a wide desktop window does **not** shrink the hit because of `md:min-h-0` — pointer, not viewport.

**Expected**
- `RollButton` has no `md:min-h-0` / blanket `min-h-[var(--touch-target-min,44px)]`. Coarse = Standard 44 height; fine = compact paint. Header hamburger / grid selection / combatant compact are TASK-851 (T005).

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-055-T005 — Header hamburger, grid selection, combatant compact use pointer tiers (TASK-851)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-055 — ADR-0023 control touch tiers |
| **Related task** | TASK-851 |
| **Where** | Site header below `xl`; any GridListRow with a selection checkbox; encounter combatant compact Health/Energy |
| **Needs** | Touch emulation at 390px plus a fine-pointer desktop window (header also at 1280 vs 1440) |

**Steps**
1. Header below `xl` at 390px touch: hamburger is a tappable `IconButton` square (or equivalent pointer-coarse square) — not a painted `min-w-[44px]` slab that also inflates fine-pointer chrome at 1280.
2. A selectable library/Codex row: the selection column is not an always-on `min-w-[44px] w-11` layout slab; `SelectionToggle` pointer-coarse square remains.
3. Encounter combatant compact Health/Energy (and sibling compact number fields): Standard 44 under coarse, compact under fine — no `md:min-h-0`.

**Expected**
- Those three named surfaces match ADR-0023. Do not retag every remaining `min-w-[44px]` (list thumbs, image mattes, innate star). Do not fold TASK-850 RollButton.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-055-T003 — Creator form fields are Standard 44 under coarse pointer (TASK-830)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-055 — ADR-0023 control touch tiers |
| **Related task** | TASK-830 |
| **Where** | `/power-creator`, `/item-creator`, `/creature-creator` |
| **Needs** | Touch emulation at 360 and 390; a fine-pointer desktop window |

**Steps**
1. Open `/power-creator` with **touch** emulation at 390px. Name (and any visible dropdowns beside steppers) are ≥44px tall — not a 40px field next to a 44px button.
2. Repeat on `/item-creator` (Name) and `/creature-creator` (Name, Level, Type, Size).
3. Switch to a fine-pointer desktop window: those fields stay compact `h-10` (~40px). Codex/Library Filters **Max Energy** / **Max TP** still match sibling selects (`h-11`).
4. Optional ~360px touch: same as steps 1–2.

**Expected**
- Coarse: visible `input` / `select` / `textarea` on those three routes are ≥44px tall (`touch-tier-standard`; no `min-w` slab).
- Fine pointer keeps compact chrome. Filter rows stay aligned on `FILTER_CONTROL_CLASS` `h-11`.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-055-T007 — Remaining viewport 44 slabs use pointer tiers (TASK-865)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-055 — ADR-0023 control touch tiers |
| **Related task** | TASK-865 |
| **Where** | `/admin/core-rules` add-row links; `/rules` nav + `/rules/[slug]` prev/next; Codex/Library CharacterFilter header; Admin Codex spreadsheet table hits |
| **Needs** | Touch emulation at 360 and 390; a fine-pointer desktop window |

**Steps**
1. Open `/admin/core-rules` with **touch** emulation at 390px. Add-row links (sizes, rarities, armaments, conditions, abilities/skills, crafting) are ≥44px tall and do **not** shrink via `md:min-h-0`.
2. Open `/rules` and a chapter (`/rules/[slug]`): nav items and prev/next are tappable under coarse pointer; fine-pointer desktop stays compact (no leftover `md:min-h-0`).
3. Codex or Library CharacterFilter header: coarse ≥44, fine compact — not `md:min-h-5`.
4. Admin Codex spreadsheet: row/checkbox/icon hits follow pointer — not `md:min-h-[36px]` / `md:min-w-[36px]`.
5. Confirm `/characters/new/advanced` still loads.

**Expected**
- Named surfaces match ADR-0023 (pointer for hit area, viewport for layout). Do not retag list thumbs, image mattes, or innate-toggle. Always-on 44 on crafting options / Edit Archetype cards / skill-participant / encounters hub is out of scope.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## DEV-V-007 — Auth UI (TASK-361, TASK-899)

#### DEV-V-007-T006 — Register Turnstile + server-side CAPTCHA enforcement (TASK-899)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-007 — Auth UI |
| **Related task** | TASK-899 |
| **Where** | `/register`, Supabase Auth API |
| **Needs** | **DEV-015** complete (Vercel site key + Supabase CAPTCHA secret enabled) |

**Steps**
1. Open `/register` — Cloudflare Turnstile widget visible; **Create Account** disabled until check completes.
2. Complete signup with valid email/password — account created; confirmation email if enabled.
3. Using reporter-style direct POST to `/auth/v1/signup` **without** a valid `captchaToken` — request rejected (4xx), user not created.

**Expected**
- Widget + token required on the form when CAPTCHA enabled.
- Supabase rejects tokenless signup even when bypassing the UI.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-007-T007 — security.txt + login/forgot-password CAPTCHA (TASK-899)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-007 — Auth UI |
| **Related task** | TASK-899 |
| **Where** | `https://realmsrpg.com/.well-known/security.txt`, `/login`, `/forgot-password` |
| **Needs** | Production deploy; **DEV-015** |

**Steps**
1. Fetch `/.well-known/security.txt` — valid RFC 9116 fields (`Contact`, `Expires`, `Canonical`); contact matches site support email.
2. `/login` — Turnstile present; sign-in works after completion.
3. `/forgot-password` — Turnstile present; reset email sends after completion.

**Expected**
- security.txt publicly reachable.
- All password auth surfaces pass CAPTCHA when Supabase protection is on.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---

## Planned suites (split from legacy DEV-T)

| Suite | Topic | Legacy | Status |
|-------|-------|--------|--------|
| DEV-V-002 | Campaign & rolls security | DEV-T-002 | Planned |
| DEV-V-003 | Admin role change safety | DEV-T-003 | Planned |
| DEV-V-004 | Storage & account security | DEV-T-004 | Planned |
| DEV-V-005 | RLS / DB migrations | DEV-T-005 | Archived — [archive](archive/BUILD_VALIDATION_ARCHIVE.md#dev-v-005--rls-policy-consolidation-task-352-task-327) |
| DEV-V-006 | Resources PDF | DEV-T-006 | Planned |
| DEV-V-007 | Auth UI (CAPTCHA + Google) | DEV-T-007 | Pending QA (T006–T007 after DEV-015) |
| DEV-V-014 | Codex typing + roll timestamp (TASK-378) | — | Archived (CI) — [archive](archive/BUILD_VALIDATION_ARCHIVE.md#dev-v-014--codex-payload--roll-timestamp-task-378) |
| DEV-V-015 | Library API typing (TASK-420) | — | Archived (CI) — [archive](archive/BUILD_VALIDATION_ARCHIVE.md#dev-v-015--library-api-typing-task-420) |
| DEV-V-016 | Library add/load selection parity (TASK-379, TASK-437, TASK-475, TASK-536, TASK-541, TASK-712) | — | Manual — see suite above (T001–T028) |
| DEV-V-017 | Site copy modules (TASK-390) | — | Manual — see suite above |
| DEV-V-018 | CreatorPageShell parity (TASK-380 / TASK-431 / TASK-826 / TASK-828 / TASK-866) | — | Manual DEV-V-018 T001–T018 (+ vitest `roll-log.test.ts`, `ability-score-editor.test.ts`) |
| DEV-V-019 | React Compiler hook cleanup (TASK-430) | — | Manual — see suite above |
| DEV-V-020 | Sitewide copy compliance (TASK-439) | — | Manual — see suite above |
| DEV-V-022 | Characters list page (TASK-469) | — | Archived — [archive](archive/BUILD_VALIDATION_ARCHIVE.md#dev-v-022--characters-list-page-task-469) |
| DEV-V-023 | Admin Realms Image Library (TASK-493) | — | Manual — see suite above |
| DEV-V-024 | Client error handling (TASK-479, TASK-540) | — | Automated (`npm test`) + manual smoke |
| DEV-V-025 | ExpandableImage adoption (TASK-478) | — | Manual — see suite above |
| DEV-V-026 | Realms Image Library wiring (TASK-496–499, TASK-531–533) | — | Manual — see suite above |
| DEV-V-027 | Admin Official Enhanced list shell (TASK-575) | — | Manual — see suite above |
| DEV-V-030 | Encounter play facades (TASK-608, TASK-819, TASK-846) | — | Manual — see suite above (T001–T004) |
| DEV-V-031 | API route smoke (TASK-613) | — | Archived (CI) — [archive](archive/BUILD_VALIDATION_ARCHIVE.md#dev-v-031--api-route-smoke-task-613) |
| DEV-V-032 | Realms Library creature stat blocks (TASK-620) | — | Manual — see suite above |
| DEV-V-033 | Library armaments split (TASK-621, TASK-628) | — | Manual — see suite above |
| DEV-V-034 | GLR chrome + Parts chip grammar (TASK-622, TASK-630) | — | Manual — see suite above |
| DEV-V-035 | Realms Library redundant source badge (session) | — | Manual — see suite above |
| DEV-V-036 | Power Creator multi-elemental damage EN (TASK-623) | — | Manual — see suite above |
| DEV-V-037 | Official power part chip dedupe (session cleanup) | — | Manual — see suite above |
| DEV-V-038 | Empowered technique nested power part chips (TASK-626) | — | Manual — see suite above |
| DEV-V-039 | Codex feat Tags section (session) | — | Automated (`feat-list.test.ts`) + manual smoke |
| DEV-V-040 | Creature level fraction display (session) | — | Manual — see suite above |
| DEV-V-045 | Codex character filter UX (session) | — | Manual — see suite above |
| DEV-V-048 | Library search toolbar + Enhanced Items tab (session) | — | Manual — see suite above |
| DEV-V-046 | Library power/technique categories + filters (TASK-673 / TASK-676 / TASK-731 / TASK-725 / TASK-746) | — | Automated (category/filter/innate/formulas tests) + manual DEV-V-046 T001–T008 |
| DEV-V-044 | Power Creator AoE applyDuration persistence (TASK-672) | — | Automated (library-columnar + power-calc tests) + manual DEV-V-044-T001 |
| DEV-V-041 | Supabase least-privilege Phase 2 (TASK-649 / TASK-735) | — | Manual DEV-V-041 T001–T004 + `node scripts/verify-task-649.mjs` |
| DEV-V-042 | Campaigns RLS SELECT consolidation (TASK-650 / TASK-802) | — | `node scripts/verify-task-650.mjs` + DEV-V-042-T002/T003 browser |
| DEV-V-043 | Wave 5 page facade splits (TASK-666 / TASK-762) | — | Manual — see suite above |
| DEV-V-051 | Guided funnel entry, trusted create, feat choice (TASK-738 / TASK-754) | — | Automated (`character-legality`, characters route, `creator-entry-mode`, `feat-selection`, `character-save` create-error copy) + manual DEV-V-051 T001–T010 |
| DEV-V-052 | Archetype Path list filter (TASK-751 / TASK-752 / TASK-753) | — | Automated (`path-recommendation-index`, `feat-list`, `skill-list`, `equipment-list`) + manual DEV-V-052 T001–T006 |
| DEV-V-053 | Wave 3A SEO + token hygiene (TASK-769 / TASK-770 / TASK-771 / TASK-793 / TASK-853) | — | Automated (`site-url`, `robots-sitemap`, `rulebook`) + manual DEV-V-053 T001–T006 |
| DEV-V-054 | Codex per-collection fetch + virtualized browse rows (TASK-775) | — | Automated (`api/codex/route.test`, `use-codex.keys.test`) + manual DEV-V-054 T001–T003 |
| DEV-V-055 | ADR-0023 control touch tiers (TASK-841, TASK-847, TASK-830, TASK-850, TASK-851, TASK-857, TASK-865) | — | Automated (`button-tiers.test.ts` + `verify:responsive` creator form-height probe) + manual DEV-V-055 T001–T007 |

When implementing a related task, replace the legacy **DEV-T-###** block with granular **DEV-V-###** tests in this file.
