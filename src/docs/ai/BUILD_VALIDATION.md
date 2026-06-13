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

## Planned suites (split from legacy DEV-T)

| Suite | Topic | Legacy | Status |
|-------|-------|--------|--------|
| DEV-V-002 | Campaign & rolls security | DEV-T-002 | Planned |
| DEV-V-003 | Admin role change safety | DEV-T-003 | Planned |
| DEV-V-004 | Storage & account security | DEV-T-004 | Planned |
| DEV-V-005 | RLS / DB migrations | DEV-T-005 | Planned |
| DEV-V-006 | Resources PDF | DEV-T-006 | Planned |
| DEV-V-007 | Auth UI (Google only) | DEV-T-007 | Planned |

When implementing a related task, replace the legacy **DEV-T-###** block with granular **DEV-V-###** tests in this file.
