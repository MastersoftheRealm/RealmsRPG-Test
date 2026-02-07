# Comprehensive Audit — 2026-02-06

**Scope:** Feedback audit, equip/delete armor & weapons, header capitalization, full dark mode, style consistency, component reuse, maintainability.

---

## 1. Feedback Audit Summary

### Already Addressed (Tasks Done)
- ✅ TASK-028: List headers full caps (ListHeader + SortHeader use `uppercase`)
- ✅ TASK-034: Equip toggle (EquipToggle component, circle/check icons)
- ✅ TASK-074: Dark mode softening (chip, stepper, ListHeader, GridListRow, health/energy)
- ✅ TASK-084: Dark mode pass on modals, skill-row, grid-list-row, archetype-section, etc.
- ✅ TASK-035: Equipment tab type/rarity/cost badges, quantity edit outside edit mode
- ✅ Feat deletion (pencil icon): Library section has onRemoveFeat; feat deletion in edit mode

### Gaps Identified

| Gap | Priority | Description |
|-----|----------|-------------|
| **Equip in campaign view** | Low | Campaign character view passes `onToggleEquipWeapon={() => {}}` and `onToggleEquipArmor={() => {}}` — read-only by design (`isEditMode={false}`). If campaign view should allow equip, handlers need wiring. |
| **Equip persistence / ID matching** | Medium | Handlers match by `item.id || item.name || String(i)`. If items lack IDs or have inconsistent shapes (enriched vs raw), toggle may not persist. Verify in character sheet. |
| **Delete armor/weapons** | High | Weapons and armor have `onDelete` when `onRemoveWeapon`/`onRemoveArmor` provided. Character sheet passes these. Feedback: "pencil icon useless" referred to **feat deletion** on feats tab, not equipment. Feat deletion: verify pencil opens edit mode and delete works. |
| **Inventory remove bug** | High | Feedback 2/5: "Unable to remove items from inventory." Notes → Inventory — add item, try to remove. Verify `onRemoveEquipment` flow. |
| **Header caps everywhere** | Medium | SectionHeader and ListHeader use `uppercase`. Audit: PageHeader, Modal titles, Tab labels, Creator section titles (e.g. "Power Summary", "Technique Summary") — these may use Title Case. User wants FULL CAPS for *list item headers* specifically. |
| **Full dark mode** | High | TASK-074/084 softened some components. User wants *full* dark mode: all modals, cards, inputs, buttons, chips, hover states. Audit components for raw colors (gray-*, blue-*, etc.) that lack `dark:` variants. |
| **Style consistency** | High | Same/similar UI pieces should share styles. Ability allocation, defense allocation, steppers, health/energy allocators — verify character sheet, creature creator, character creator use identical patterns. |
| **Modal/list reuse** | Medium | Unify add-X modals (add feat, add power, add technique, add armament) across character sheet, creature creator, equipment step. Use UnifiedSelectionModal or shared patterns. |

---

## 2. Equip & Delete — Armor & Weapons

### Current Implementation
- **Character sheet:** `handleToggleEquipWeapon`, `handleToggleEquipArmor`, `handleRemoveWeapon`, `handleRemoveArmor` passed to LibrarySection.
- **Campaign view:** All handlers are no-ops; LibrarySection is `isEditMode={false}`.
- **EquipToggle:** Circle (unequipped) → CheckCircle2 (equipped). Used in leftSlot of GridListRow for weapons/armor.
- **Delete:** GridListRow has `onDelete`; shows X when `onRemoveWeapon`/`onRemoveArmor` provided. Only visible in edit mode.

### Actions
1. **TASK-109:** Verify equip toggle persists correctly — test with items that have `id`, `name`, or index-only. Fix ID matching if needed.
2. **TASK-110:** Verify weapon/armor delete works in character sheet edit mode. Ensure pencil opens edit and delete button appears.
3. **TASK-111:** Fix inventory remove bug — users cannot remove items from Notes → Inventory. Trace `onRemoveEquipment` and UI wiring.

---

## 3. Header Capitalization (Full Caps)

### Scope
- **List headers:** ListHeader, SortHeader — already `uppercase`.
- **Section headers:** SectionHeader — already `uppercase` in h4.
- **Other:** Page titles ("My Library", "Codex"), Modal titles ("Add Power", "Recovery"), Creator summary titles ("Power Summary"), Tab labels.

### User Intent
> "Capitalization of all headers (full caps ie NAME instead of Name) for headers of list items in any/every location"

**Interpretation:** List item column headers (NAME, ACTION, DAMAGE, ENERGY) — already done. Section titles (POWERS, WEAPONS, ARMOR) — already done via SectionHeader. Page-level titles (e.g. "My Library") — user may want these as "MY LIBRARY" or may mean only list headers. Clarify or apply consistently.

### Actions
4. **TASK-112:** Auditorily confirm all list/section headers use full caps. Add `uppercase` to any custom headers that don't use SectionHeader/ListHeader.

---

## 4. Full Dark Mode Implementation

### Current State
- `globals.css`: `.dark` class overrides surface, text, borders, status colors.
- TASK-074: Softer chip, stepper, health/energy, power/martial.
- TASK-084: Recovery modal, skill-row, grid-list-row, archetype-section, notes-tab, etc.

### Gaps
- Some components may still use `bg-gray-100`, `text-blue-700` without `dark:` variants.
- Hover states that "white out" content in dark mode (feedback mentioned).
- Modal backgrounds, card borders, input focus rings.
- Auth pages use `gray-*` intentionally (per AGENTS.md).

### Actions
5. **TASK-113:** Full dark mode audit — grep for `bg-gray-`, `text-blue-`, `border-gray-` and similar; add `dark:` variants. Ensure hover states don't bleach text in dark mode.

---

## 5. Style Consistency

### Areas to Unify
- **Ability allocation:** Character sheet vs creature creator vs character creator.
- **Defense allocation:** Same.
- **Steppers:** ValueStepper, btn-stepper — unified in TASK-071. Verify no stragglers.
- **Health/energy:** HealthEnergyAllocator — unify across sheet, character creator, creature creator (TASK-035 / feedback).
- **Modals:** Rounded corners, header spacing, sortable columns, add/select controls.
- **Buttons:** btn-solid, btn-outline-clean; no gradients.

### Actions
6. **TASK-114:** Style consistency audit — compare ability/defense/health-energy UIs across sheet, creators. Ensure single source of truth.

---

## 6. Component Reuse & Best Practices

### Current Reuse
- GridListRow, ListHeader, SectionHeader, SkillRow, ValueStepper, EquipToggle, SelectionToggle, Modal.
- UnifiedSelectionModal used for add feat, add skill, add library item.

### Gaps
- Creature creator add modals (TASK-068 done) — verify they match character sheet add modals.
- Recovery modal — specialized but should match site styles.
- Dice roller — feedback: match vanilla site, use custom images.

### Actions
7. **TASK-115:** Component reuse audit — ensure all add-X modals use shared Modal + ListHeader + GridListRow. No inline custom list UIs.

---

## 7. Task Queue Additions

| ID | Title | Priority |
|----|-------|----------|
| TASK-109 | Verify equip toggle ID matching and persistence | medium |
| TASK-110 | Verify weapon/armor delete in character sheet | high |
| TASK-111 | Fix inventory remove bug (Notes → Inventory) | high |
| TASK-112 | Audit all list/section headers for full caps | medium |
| TASK-113 | Full dark mode implementation pass | high |
| TASK-114 | Style consistency audit (ability/defense/health-energy) | medium |
| TASK-115 | Component reuse audit (add-X modals) | medium |

---

## 8. High-Level Checklist

- [ ] Equip armor/weapons works in character sheet; ID matching robust
- [ ] Delete armor/weapons works in character sheet edit mode
- [ ] Remove items from inventory (Notes tab) works
- [ ] All list/section headers full caps
- [ ] Full dark mode — no harsh contrasts, hover states safe
- [ ] Same UI patterns across sheet, character creator, creature creator
- [ ] Add-X modals use shared components
- [ ] Sleek, seamless experience — no jarring inconsistencies
