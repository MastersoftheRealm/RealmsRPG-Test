# Un-Implemented Feedback & Audit Work — 2026-02-16

**Purpose:** Single list of all un-implemented feedback, task-queue items, and site-audit follow-ups. Newer feedback and audits are treated as more accurate than older.

**Sources:** `ALL_FEEDBACK_CLEAN.md`, `AI_TASK_QUEUE.md`, `CODEBASE_AUDIT_2026-02-13.md`, raw feedback log.

---

## 1. Task Queue — Open Tasks (not-started or in-progress)

### High priority

| ID | Title | Status |
|----|--------|--------|
| ~~TASK-190~~ | Admin Creature Feats — level, requirement, mechanic flags | **done** |
| ~~TASK-191~~ | Admin Equipment — currency, category, and type alignment | **done** |
| ~~TASK-192~~ | Admin Properties & Parts — mechanic/duration flags, percentage display, option chips | **done** |
| ~~TASK-193~~ | Admin Traits & Species — flaw/characteristic flags, sizes, trait chips | **done** |

### Medium priority

| ID | Title | Status |
|----|--------|--------|
| **TASK-159** | Admin Codex — Reduce input lag in edit mode | deferred (needs profiling) |
| ~~TASK-171~~ | Admin Skills — base skill dropdown resolves base_skill_id | **done** |
| ~~TASK-172~~ | Admin Skills — expose additional description fields (success_desc, failure_desc, ds_calc, craft_*) | **done** |
| ~~TASK-173~~ | Skills — render extra descriptions as expandable chips in item cards (Codex, add-skill modals) | **done** |
| **TASK-174** | Codex schema — add Use column and align fields | in-progress |
| ~~TASK-181~~ | Admin Skills — ability multi-select aligned with schema (12 abilities/defenses) | **done** |
| ~~TASK-182~~ | Admin Equipment — align fields with codex_equipment schema | **done** |
| ~~TASK-194~~ | Admin Skills & Feats — base skill display and filter "All" duplicate fix | **done** |
| **TASK-240** | Audit Phase 2 — Standardize modal/error/loading patterns (UX-3, UX-4, UX-5) | not-started |

### Low priority

| ID | Title | Status |
|----|--------|--------|
| ~~TASK-183~~ | Admin Parts — edit defense targets (multi-select of 6 defenses) | **done** |
| ~~TASK-248~~ | P-5: CharacterSheetContext to reduce prop drilling | **done** |
| ~~TASK-249~~ | FB-6: Campaign join notification for visibility change | **done** |

---

## 2. Curated Feedback — Still Un-Implemented

From **ALL_FEEDBACK_CLEAN.md** curated sections and High-Level Action Items:

### Character visibility & derived content (Section 19)

- **TASK-167** — Character visibility: public (link share, view-only); campaign (RM + members view); private→campaign on join. *(Check queue: may be done via public view + API; confirm and update docs.)*
- **TASK-168** — Character-derived content visibility: powers/techniques/items in private library visible (view-only) when viewing character. *(Feedback says ensure getOwnerLibraryForView returns referenced items; audit marked FB-7 done — verify.)*

### Admin Codex (Section 17)

- **TASK-171** — Skill base skill selector: dropdown by name → store base_skill_id (see open tasks above).
- **TASK-172** — Skill additional descriptions: expose success_desc, failure_desc, ds_calc, craft_success_desc, craft_failure_desc in Admin Skills edit modal.
- **TASK-173** — Skill chips: extra skill descriptions as expandable chips on skill cards (Codex, add-skill modals, add sub-skill modals).

### Doc sync (High-Level Action Items)

- **ALL_FEEDBACK_CLEAN.md** still shows `[ ]` for:
  - "Archetype prof slider: hide unless pencil clicked…" (TASK-101) — **Queue says done** → check off in feedback doc.
  - "Add creatures from library to encounter tracker…" (TASK-102) — **Queue says done** → check off in feedback doc.

---

## 3. Codebase Audit 2026-02-13 — Remaining Items

From **CODEBASE_AUDIT_2026-02-13.md** (newer audit = source of truth where it conflicts with older notes):

| Finding | Description | Disposition |
|--------|-------------|-------------|
| **UX-3, UX-4, UX-5** | Standardize modals (base Modal), errors (Alert/Toast), loading (LoadingState/skeletons/Spinner) | → TASK-240 |
| **P-5** | CharacterSheetContext to reduce prop drilling | → TASK-248 (deferred) |
| **FB-6** | Campaign join notification when private character → campaign visibility | → TASK-249 |

All other audit categories (Security, Dead Code, Duplicates, etc.) are marked resolved in the audit doc.

---

## 4. Raw Feedback (2/14/2026) — Verification Status

From **Raw Feedback Log** in ALL_FEEDBACK_CLEAN.md (newer = higher weight):

| Item | Expected | Status / Task |
|------|----------|--------------|
| Remove "mine" tags from My Library | Implied ownership; no "Mine" badge | ✅ Implemented (AI_CHANGELOG) |
| Feat abilities as comma-separated list in lists | "Strength, Intelligence" not "StrengthIntelligence" | Verify in Codex/feats list |
| Creator skills: add as proficient + value 0; stepper doesn’t remove at 0 | Value 0, proficient; don’t remove skill at 0 | Implemented 2/13–2/14 per feedback log |
| Ranged weapon range save/display | Range saved and shown on character sheet; not just melee | Verify in item creator + sheet |
| Part chips expandable (options/levels) + descriptions in expanded views | Part chips expand to show options/levels; descriptions in expanded views | Verify; TASK-192 touches option chips in Admin |
| No rolling when viewing others’ character | Disable roll UI when not owner | Verify in character sheet |
| Roll log realtime across locations | No refresh needed to see updated rolls | Realtime implemented; verify cross-tab/location |
| Character/portrait deletion: remove old image from storage on update/delete | Delete old portrait on character update; remove on character delete | Implemented 2/14 per feedback log |
| User management: admins shown as "Admin", no role change | UID-based admins non-editable | Verify in admin UI |
| About page dice: selected die in middle, 3 each side, arrows cycle | Carousel behavior | TASK-235 done per feedback |
| Creature creator: expand lists when enabling powers/techniques/items | Sections expanded by default when enabled | Implemented 2/14 per feedback log |
| Creator load: full reset + exact restore (options, range, action type, etc.) | Load clears state and restores all fields | Implemented 2/14 per feedback log |

Items above marked "Verify" should be spot-checked in code or UI; no open task was found for them in the queue.

---

## 5. Documentation Updates Needed

From audit **Category 9** and cross-reference:

| Doc | Issue |
|-----|--------|
| **ALL_FEEDBACK_CLEAN.md** | Check off TASK-101 and TASK-102 in High-Level Action Items (queue shows done). |
| **ALL_FEEDBACK_CLEAN.md** | Ensure any remaining "Firestore" references are "Supabase" (audit says DOC-1 done). |
| **CODEX_SCHEMA_REFERENCE.md** | Complete "Use" column and field alignment (TASK-174 in-progress). |
| **DESIGN_SYSTEM.md** | Add any missing component entries (EquipToggle, SelectionToggle, etc.) if still absent. |

---

## 6. Summary — Recommended Order of Work

**Immediate (high impact, no blocker):**

1. **TASK-190, TASK-191, TASK-192, TASK-193** — Admin Codex schema alignment (creature feats, equipment, properties/parts, traits/species).
2. **TASK-171, TASK-172, TASK-173** — Admin Skills: base skill dropdown, extra description fields, expandable skill description chips sitewide.
3. **TASK-194** — Admin Skills & Feats filter "All" and base skill display.
4. **TASK-174** — Finish Codex schema Use column and field alignment.

**Next (consistency & UX):**

5. **TASK-240** — Modal/error/loading standardization (audit Phase 2).
6. **TASK-181, TASK-182** — Admin Skills ability multi-select; Admin Equipment schema alignment.

**Lower / deferred:**

7. **TASK-183** — Admin Parts defense targets.
8. **TASK-249** — FB-6 campaign join notification.
9. **TASK-248** — CharacterSheetContext (deferred).
10. **TASK-159** — Admin input lag (deferred; needs profiling).

**Doc hygiene:**

- Update **ALL_FEEDBACK_CLEAN.md** High-Level Action Items: mark TASK-101 and TASK-102 as done.

---

*Generated 2026-02-16 from AI_TASK_QUEUE.md, ALL_FEEDBACK_CLEAN.md, CODEBASE_AUDIT_2026-02-13.md. Newer feedback and audits override older where conflicting.*
