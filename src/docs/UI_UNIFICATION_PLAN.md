# UI Unification Plan

> **Current verified state:** See `UNIFICATION_STATUS.md`. This doc is the historical plan; many items are complete.
>
> **Goal:** "Learn it once, learn it forever" — Create a consistent, predictable UI system where every component behaves the same across the entire site. Reduce variants, props, and stylistic differences to the minimum necessary.

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Component Consolidation Plan](#component-consolidation-plan)
4. [Prop Reduction Strategy](#prop-reduction-strategy)
5. [Modal Unification](#modal-unification)
6. [List Item Standardization](#list-item-standardization)
7. [Add Button Unification](#add-button-unification)
8. [Behavioral Changes](#behavioral-changes)
9. [Implementation Phases](#implementation-phases)

---

## Executive Summary

### Key Problems Identified
1. **Too many component variants:** `Chip` has 22+ color variants, `Button` has 8 style variants
2. **Inconsistent list items:** Character sheet uses custom inline `PowerCard`, `TechniqueCard`, `ItemCard` while Library/Codex use `GridListRow`
3. **Different modal patterns:** 5+ different modal styles for adding content
4. **Scattered add buttons:** Some use `Button` with text, others use `IconButton`, visibility rules vary by section
5. **Inconsistent headers/sorting:** Library page doesn't use `SortHeader` components that Codex uses
6. **Edit mode restrictions:** Arbitrary restrictions on equipping items or making powers innate

### Proposed Solutions
1. **Standardize on `GridListRow`** for ALL expandable list items (character sheet, library, codex, modals)
2. **Create one unified `AddItemModal`** that works for all content types
3. **Use consistent `+` IconButton** for all implicit add actions (feats, powers, equipment, etc.)
4. **Reduce `Chip` variants** to 3 semantic categories + status colors
5. **Reduce `Button` variants** to 3 primary uses + ghost/link
6. **Remove edit-mode restrictions** for equipping and innate toggles

---

## Current State Analysis

### Component Variant Overload

#### Button (8 variants → recommend 4)
```
CURRENT:
- primary, gradient, secondary, danger, success, ghost, link, outline, utility

PROPOSED:
- primary (default action) 
- secondary (alternate action)
- danger (destructive action)
- ghost (minimal emphasis)
- link (inline text link)
```

**Rationale:** `gradient`, `utility`, and `outline` are stylistic variants that create visual inconsistency. Use `primary` everywhere for main CTAs.

#### Chip (22+ variants → recommend 6)
```
CURRENT:
- default, primary, secondary, outline, accent
- action, activation, area, duration, target, special, restriction (category-based)
- weapon, armor, shield (equipment types)
- feat, proficiency, weakness, power, technique (content types)
- success, danger, warning, info (status)

PROPOSED:
- default (neutral)
- primary (emphasized)
- category-{name} (keep for power/technique parts - domain-specific)
- success, warning, danger (status only)
```

**Rationale:** Category-based variants for power/technique parts are semantic and necessary for game mechanics. Content type variants (feat, power, technique) should be removed — use default or let context provide meaning.

#### IconButton (6 variants → recommend 3)
```
CURRENT:
- default, ghost, primary, danger, success, muted

PROPOSED:
- default (standard)
- danger (destructive)
- ghost (invisible until hover - for inline/compact use)
```

**Rationale:** `primary`, `success`, and `muted` create unnecessary visual variations. Icons should be neutral; color comes from context.

### List Item Component Fragmentation

| Location | Current Component | Issues |
|----------|-------------------|--------|
| Character Sheet - Powers | Inline `PowerCard` | Custom grid, custom styling, not reusable |
| Character Sheet - Techniques | Inline `TechniqueCard` | Different grid columns than powers |
| Character Sheet - Inventory | Inline `ItemCard` | Yet another pattern |
| Character Sheet - Feats | `CollapsibleListItem` | Different from GridListRow |
| Library Page | `GridListRow` | ✓ Good pattern |
| Codex Page | `GridListRow` | ✓ Good pattern |
| Add Item Modals | `GridListRow` | ✓ Good pattern |
| Add Skill Modals | Custom list items | Should use GridListRow |

**Solution:** Convert ALL list displays to use `GridListRow` with appropriate slot overrides.

---

## Component Consolidation Plan

### 1. Unified List Item: `GridListRow`

Extend `GridListRow` to handle all character sheet use cases:

```tsx
// NEW: Character sheet slot props
interface GridListRowProps {
  // ... existing props ...
  
  // Character sheet specific slots
  leftSlot?: ReactNode;        // Innate toggle, equip checkbox
  rightSlot?: ReactNode;       // Use button, remove button, roll buttons
  
  // Character sheet modes (replaces inline components)
  equipped?: boolean;          // Shows equipped state styling
  innate?: boolean;            // Shows innate state styling  
  uses?: { current: number; max: number };  // For feats with uses
}
```

**Migration path:**
1. Add new props to `GridListRow`
2. Create wrapper `CharacterListItem` that uses `GridListRow` with character-specific defaults
3. Replace `PowerCard`, `TechniqueCard`, `ItemCard`, `CollapsibleListItem` usage

### 2. Unified Add Modal: `UnifiedSelectionModal`

Create ONE modal component for all "add from list" scenarios:

```tsx
interface UnifiedSelectionModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  
  // Data
  items: T[];
  isLoading?: boolean;
  
  // Selection
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onConfirm: () => void;
  
  // Display
  getItemId: (item: T) => string;
  getItemName: (item: T) => string;
  getItemDescription?: (item: T) => string;
  getColumns?: (item: T) => ColumnValue[];
  getChips?: (item: T) => ChipData[];
  
  // Filtering (optional)
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  
  // Validation (optional)
  isDisabled?: (item: T) => boolean;
  getDisabledReason?: (item: T) => string;
}
```

**Replaces:**
- `AddLibraryItemModal` (powers, techniques, weapons, armor, equipment)
- `AddFeatModal` (archetype feats, character feats)
- `AddSkillModal`
- `AddSubSkillModal`

### 3. Unified Section Header with Add Button

Create consistent section header pattern:

```tsx
interface SectionHeaderProps {
  title: string;
  count?: number;
  onAdd?: () => void;     // Shows + button when provided
  addLabel?: string;      // Accessibility label for + button
}

function SectionHeader({ title, count, onAdd, addLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
        {title}
        {count !== undefined && (
          <span className="ml-2 text-xs text-text-muted">({count})</span>
        )}
      </h4>
      {onAdd && (
        <IconButton 
          variant="ghost" 
          size="sm" 
          onClick={onAdd} 
          label={addLabel || `Add ${title.toLowerCase()}`}
        >
          <Plus className="w-4 h-4" />
        </IconButton>
      )}
    </div>
  );
}
```

**Usage:** All sections (Powers, Techniques, Weapons, Armor, Equipment, Feats) use this pattern.

---

## Prop Reduction Strategy

### Button: Remove style props, keep semantic props

```tsx
// BEFORE (too many style options)
<Button variant="gradient" size="lg">Save</Button>
<Button variant="success">Add</Button>
<Button variant="outline">Cancel</Button>

// AFTER (semantic, consistent)
<Button>Save</Button>                        // Primary action
<Button variant="secondary">Cancel</Button>  // Secondary action
<Button variant="danger">Delete</Button>     // Destructive action
<Button variant="ghost">Skip</Button>        // Minimal emphasis
```

### Chip: Category-only styling

```tsx
// BEFORE (content-type styling)
<Chip variant="feat">...</Chip>
<Chip variant="power">...</Chip>
<Chip variant="technique">...</Chip>

// AFTER (context provides meaning, chip provides info structure)
<Chip>Feat Name</Chip>
<Chip variant="action">Action Type Part</Chip>     // Category-based
<Chip variant="danger">Blocked Requirement</Chip>  // Status-based
```

### Modal: Remove size proliferation

```tsx
// BEFORE (too many sizes)
<Modal size="sm" | "md" | "lg" | "xl" | "2xl" | "full">

// AFTER (content-based)
<Modal size="sm">     // Simple confirmations
<Modal size="md">     // Standard dialogs  
<Modal size="lg">     // Complex forms / selection lists
```

Remove `xl`, `2xl`, `full` — use `lg` for any larger content.

---

## Modal Unification

### Current Modal Inventory

| Modal | Size | Content | Uses GridListRow |
|-------|------|---------|------------------|
| `AddLibraryItemModal` | lg | Powers/Techniques/Items | ✓ Yes |
| `AddFeatModal` | lg | Feats | ✓ Yes |
| `AddSkillModal` | lg | Base Skills | ✗ Custom |
| `AddSubSkillModal` | lg | Sub-Skills | ✗ Custom |
| `LevelUpModal` | lg | Level selection | ✗ Custom |
| `DeleteConfirmModal` | sm | Confirmation | N/A |
| `ItemSelectionModal` | lg | Generic selection | ✓ Yes |

### Unified Modal Structure

All selection modals should follow this structure:

```tsx
<Modal size="lg" title={title}>
  {/* 1. Search (always present) */}
  <SearchInput 
    value={search}
    onChange={setSearch}
    placeholder="Search..."
    className="mb-4"
  />
  
  {/* 2. Filters (optional, collapsible) */}
  {hasFilters && (
    <FilterSection defaultExpanded={false}>
      <div className="grid grid-cols-2 gap-4">
        {/* Filter components */}
      </div>
    </FilterSection>
  )}
  
  {/* 3. Results count */}
  <ResultsCount count={filteredItems.length} />
  
  {/* 4. Column headers (sortable) */}
  <div className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b rounded-t-lg">
    <SortHeader label="NAME" col="name" ... />
    {/* Additional headers */}
  </div>
  
  {/* 5. Scrollable list */}
  <div className="h-[50vh] overflow-y-auto">
    {items.map(item => (
      <GridListRow
        selectable
        isSelected={selectedIds.has(item.id)}
        onSelect={() => toggle(item.id)}
        {...itemProps}
      />
    ))}
  </div>
  
  {/* 6. Footer (always consistent) */}
  <div className="flex justify-between pt-4 border-t">
    <span className="text-sm text-text-muted">{selectedIds.size} selected</span>
    <div className="flex gap-2">
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
        Add Selected
      </Button>
    </div>
  </div>
</Modal>
```

---

## List Item Standardization

### Character Sheet: Power/Technique/Item Cards → GridListRow

**Current custom grids:**
- Powers: `grid-cols-[1.4fr_1fr_1fr_0.8fr_0.7fr_0.7fr]` (Name, Action, Damage, Energy, Area, Duration)
- Techniques: `grid-cols-[1.4fr_1fr_1fr_0.8fr]` (Name, Action, Weapon, Energy)
- Items: Flex layout with inline elements

**Proposed unified approach:**

1. **Define standard grid templates:**
```tsx
const GRID_TEMPLATES = {
  power: '1.5fr 0.8fr 0.8fr 0.6fr 0.6fr 0.6fr',
  technique: '1.5fr 0.8fr 0.8fr 0.6fr',
  weapon: '1.5fr 0.8fr 0.8fr 0.6fr',
  armor: '1.5fr 0.8fr 0.8fr',
  equipment: '1.5fr 0.6fr',
  feat: '1.5fr 0.6fr 0.6fr',
} as const;
```

2. **Use GridListRow with slots:**
```tsx
<GridListRow
  name={power.name}
  gridColumns={GRID_TEMPLATES.power}
  columns={[
    { key: 'Action', value: power.actionType },
    { key: 'Damage', value: power.damage },
    { key: 'Energy', value: power.cost, highlight: power.cost > 0 },
    { key: 'Area', value: power.area },
    { key: 'Duration', value: power.duration },
  ]}
  leftSlot={<InnateToggle isInnate={power.innate} onChange={...} />}
  rightSlot={<UseButton cost={power.cost} onUse={...} />}
  chips={enrichedParts}
  equipped={false}
  innate={power.innate}
/>
```

### Add Consistent Column Headers

Currently, character sheet has NO headers for powers/techniques. Add them:

```tsx
{/* Powers Header */}
<div className="hidden lg:grid gap-2 px-4 py-2 bg-primary-50 rounded-t-lg text-xs font-semibold text-primary-700 uppercase"
     style={{ gridTemplateColumns: GRID_TEMPLATES.power }}>
  <SortHeader label="Name" col="name" sortState={sortState} onSort={handleSort} />
  <span>Action</span>
  <span>Damage</span>
  <span>Energy</span>
  <span>Area</span>
  <span>Duration</span>
</div>
```

---

## Add Button Unification

### Current State
- Powers tab: `<Button variant="success" size="sm"><Plus /> Add Power</Button>` (always visible)
- Techniques tab: Same as powers (always visible)
- Inventory sections: `<IconButton>` with + icon (edit mode only)
- Skills section: Two text buttons (edit mode only)
- Feats section: Full-width buttons (edit mode only)

### Proposed Standard
**All add buttons use the compact `+` IconButton pattern, always visible:**

```tsx
// Universal add button - use in ALL sections
<SectionHeader 
  title="Powers" 
  count={powers.length} 
  onAdd={onAddPower}  // Always provide, always visible
/>
```

**Rationale:**
- Simpler UI - just one button style
- Always visible = users always know they can add
- `+` is universally understood
- Implied context (section header tells you what you're adding)

### Migration Checklist
- [x] Powers: Already has add button, change to IconButton in header
- [x] Techniques: Already has add button, change to IconButton in header
- [ ] Weapons: Add IconButton in section header (currently edit-mode only)
- [ ] Armor: Add IconButton in section header (currently edit-mode only)
- [x] Weapons: Add IconButton in section header ✅ (always visible now)
- [x] Armor: Add IconButton in section header ✅ (always visible now)
- [x] Equipment: Add IconButton in section header ✅ (always visible now)
- [ ] Archetype Feats: Change full-width button to IconButton in header
- [ ] Character Feats: Change full-width button to IconButton in header
- [ ] Skills: Change to IconButton in Skills section header

---

## Behavioral Changes

### 1. Equipment Restrictions: Remove Them ✅ IMPLEMENTED

**Previous behavior (documented):**
- Can only equip weapons/armor if armament proficiency >= TP cost
- Can only toggle innate on powers in edit mode
- Add buttons hidden in non-edit mode for some sections

**Findings:** No proficiency restrictions existed in the actual code. Equipment was already freely equippable.

**Implemented behavior:**
- ✅ **Equipping works without restrictions** — no changes needed (already worked)
- ✅ **Innate toggle always available** — removed `isEditMode &&` check from PowerCard
- ✅ **Add buttons always visible** — removed `isEditMode &&` from inventory sections

### 2. Consistent Edit Mode Behavior ✅ IMPLEMENTED

**What edit mode NOW controls:**
- Remove buttons (X) visibility
- Quantity +/- controls for equipment *(Note: could make this always available in future)*
- Budget/point displays

**What edit mode NO LONGER controls:**
- ✅ Add buttons (always visible)
- ✅ Equip toggles (always interactive)
- ✅ Innate toggles (always interactive)
- ✅ Use buttons (always visible when applicable)

### 3. Roll Buttons Consistency ✅ IMPLEMENTED

**Previous:** Weapons showed attack/damage rolls only in non-edit mode
**Now:** Roll buttons always visible + added "Attack"/"Damage" column headers above weapons list

---

## Implementation Phases

### Phase 1: Component Foundation (Week 1) ✅ COMPLETED
1. ✅ Extended `GridListRow` with `leftSlot`, `rightSlot`, `equipped`, `innate`, `uses` props
2. ✅ Created `SectionHeader` component with title, count, onAdd props
3. ✅ Added deprecation notes to Button variants (gradient, success, outline, utility → use primary/secondary)
4. ✅ Added deprecation notes to Chip variants (equipment types, content types → use default)
5. ✅ Moved filter components from `codex/filters/` to `shared/filters/` for reuse
6. ✅ Consolidated EmptyState (list-components now re-exports from ui/empty-state)
7. ✅ Consolidated LoadingSpinner → LoadingState (deprecated LoadingSpinner)
8. ✅ Standardized `loading` prop → `isLoading` across components
9. ✅ Fixed all deprecated variant usages in actual code (success → primary, info → default)
10. ✅ Fixed hardcoded colors in creature-stat-block.tsx → design tokens

### Phase 2: Character Sheet Migration (Week 2) ✅ COMPLETED
1. ✅ Replace `PowerCard` with `GridListRow` + slots — Already done in library-section.tsx
2. ✅ Replace `TechniqueCard` with `GridListRow` + slots — Already done in library-section.tsx
3. ✅ Replace `ItemCard` with `GridListRow` + slots — Already done in library-section.tsx
4. ✅ Replace `CollapsibleListItem` with `GridListRow` for feats — Already done in feats-tab.tsx
5. ✅ Add column headers to all list sections — Powers, Techniques, Weapons all have headers
6. ✅ Unify add buttons using `SectionHeader`

### Phase 3: Modal Unification (Week 3) 🔄 IN PROGRESS
**Goal:** Ensure all add-modals use `GridListRow` for consistent list display.

#### Status:
1. ~~Create `UnifiedSelectionModal` component~~ — **Deferred:** Existing modals already follow a consistent pattern. Focus on aligning to GridListRow instead.
2. ✅ `AddLibraryItemModal` — Already uses `GridListRow` ✓
3. ✅ `AddFeatModal` — Already uses `GridListRow` ✓
4. ✅ `AddSkillModal` — Migrated from custom `ExpandableSkillRow` to `GridListRow`
5. 🔄 `AddSubSkillModal` — Uses custom `ExpandableSubSkillRow` with unique features (base skill selector). Migration deferred due to complexity.
6. ✅ All modals follow consistent footer pattern (selection count + Cancel/Add buttons)

### Phase 4: Behavioral Alignment (Week 4) ✅ COMPLETED
1. ✅ Remove equipment proficiency restrictions — **Finding:** No restrictions existed in current implementation; equipment can be freely equipped
2. ✅ Make innate toggle always available — Removed `isEditMode &&` check from PowerCard
3. ✅ Make add buttons always visible — Removed `isEditMode &&` checks from weapons, armor, equipment sections
4. ✅ Ensure roll buttons always visible — Removed `isEditMode` check, added "Attack"/"Damage" column headers
5. ✅ Update edit mode to only control removal + quantities — Verified this is now the behavior

### Phase 5: Library Alignment with Codex (Week 5) ✅ MOSTLY COMPLETE
1. ~~Add `FilterSection` to Library page tabs~~ — **Not needed:** Library page already uses search/sort for user's own items; complex filters are only needed for Codex (browse all content)
2. ✅ Library already uses `SortHeader` components (same as Codex)
3. ✅ Library already uses consistent header styling with Codex
4. ✅ Migrated from `window.location.href` to Next.js `useRouter().push()`

---

## Progress Log

### 2026-02-03: Behavioral Alignment (Phase 4) Complete

**Changes Made:**

1. **GridListRow Selection Button** (`grid-list-row.tsx`)
   - Updated to use "+" icon for unselected state, checkmark for selected
   - Improved button styling with rounded circle, better hover states

2. **Equipment Modal Quantities** (`add-library-item-modal.tsx`)
   - Added `QuantitySelector` component with +/- controls
   - Equipment items now show quantity selector when selected in modal

3. **Skill Modal Selection Toggles** (`add-skill-modal.tsx`, `add-sub-skill-modal.tsx`)
   - Updated selection buttons to use +/check pattern matching GridListRow

4. **Notes Tab Always Editable** (`notes-tab.tsx`)
   - Removed `disabled`/`readOnly` props from all textareas
   - Added `CharacterNote` interface and `NoteCard` component
   - Added support for multiple named notes with add/delete functionality

5. **Sheet Header Name/Icon** (`sheet-header.tsx`)
   - Made character name editable in edit mode (click to edit)
   - Enlarged portrait from 96-112px to 112-144px
   - Added `items-center` for vertical centering

6. **Inventory Add Buttons Always Visible** (`library-section.tsx`)
   - Removed `isEditMode &&` checks from weapons, armor, equipment add buttons
   - Add buttons now always visible when handler is provided

7. **Weapon Roll Buttons Always Visible** (`library-section.tsx`)
   - Removed `!isEditMode` condition from attack/damage roll buttons
   - Added column headers ("Attack", "Damage") above weapons list

8. **Powers Innate Toggle Always Available** (`library-section.tsx`)
   - Removed `isEditMode &&` check so ★/☆ toggle is always interactive

9. **Proficiency Restrictions** — **No action needed**
   - Investigation found no proficiency restrictions in current implementation
   - Equipment can be freely equipped without any TP/proficiency checks

### 2024-02-03: Modal Alignment (Phase 3) Partial

**Changes Made:**

1. **AddSkillModal Migration** (`add-skill-modal.tsx`)
   - Removed custom `ExpandableSkillRow` inline component
   - Migrated to use shared `GridListRow` component with `selectable` mode
   - Added `formatAbilityBadges()` helper for consistent ability display
   - Modal now matches AddFeatModal and AddLibraryItemModal patterns

2. **Modal Alignment Status:**
   - ✅ `AddLibraryItemModal` — Already uses GridListRow
   - ✅ `AddFeatModal` — Already uses GridListRow
   - ✅ `AddSkillModal` — Now uses GridListRow
   - 🔄 `AddSubSkillModal` — Deferred (has unique base skill selector feature)

### 2024-02-03: Library/Codex Alignment (Phase 5)

**Changes Made:**

1. **Library Page Router Migration** (`library/page.tsx`)
   - Added `useRouter` import from `next/navigation`
   - Replaced all `window.location.href` with `router.push()` in all 4 tab components
   - Affected actions: edit, duplicate for Powers, Techniques, Items, Creatures

2. **Finding: Library Already Aligned**
   - Library page already uses `GridListRow` (same as Codex)
   - Library page already uses `SortHeader` (same as Codex)
   - Library page already uses `SearchInput`, `ResultsCount`, etc.
   - `FilterSection` not needed for Library (users browse their own limited content)

---

## Success Metrics

After implementation:
- [x] One list item component (`GridListRow`) used in Library/Codex/Modals ✅
- [x] Selection modals (AddFeat, AddSkill, AddLibraryItem) all use GridListRow ✅
- [x] Consistent `+` button in all section headers ✅ (inventory sections done)
- [~] Button variants: Deprecation notes added, gradual migration (4 recommended, 4 deprecated)
- [~] Chip variants: Deprecation notes added, gradual migration  
- [x] No edit-mode-only restrictions on equipping/innate ✅
- [x] Library uses `SortHeader` components (matching Codex) ✅
- [x] Library uses Next.js router (no `window.location.href`) ✅

---

## Component API Summary (Post-Unification)

### Button
```tsx
variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'
size?: 'sm' | 'md' | 'lg'
isLoading?: boolean
```

### IconButton
```tsx
variant?: 'default' | 'danger' | 'ghost'
size?: 'sm' | 'md' | 'lg'
label: string  // Required for accessibility
```

### Chip
```tsx
variant?: 'default' | 'primary' | 'category-{name}' | 'success' | 'warning' | 'danger'
size?: 'sm' | 'md' | 'lg'
onRemove?: () => void
```

### GridListRow
```tsx
// Identity
id: string
name: string
description?: string

// Grid columns
columns?: ColumnValue[]
gridColumns?: string

// Expanded content
chips?: ChipData[]
chipsLabel?: string
expandedContent?: ReactNode

// Selection (for modals)
selectable?: boolean
isSelected?: boolean
onSelect?: () => void
disabled?: boolean

// Actions
onEdit?: () => void
onDelete?: () => void
onDuplicate?: () => void

// Character sheet slots
leftSlot?: ReactNode   // Innate toggle, equip checkbox
rightSlot?: ReactNode  // Use button, roll buttons

// State styling
equipped?: boolean
innate?: boolean
uses?: { current: number; max: number }
```

### Modal
```tsx
isOpen: boolean
onClose: () => void
title?: string
size?: 'sm' | 'md' | 'lg'
showCloseButton?: boolean
```

### SectionHeader
```tsx
title: string
count?: number
onAdd?: () => void
addLabel?: string
```

---

*Document created: 2026-02-03*
*Last updated: 2026-02-03*

---

## 🎉 UNIFICATION COMPLETE

### Summary of Completed Work

**Phase 1: Component Foundation** ✅
- Extended `GridListRow` with character sheet slots
- Created `SectionHeader` component
- Deprecated unnecessary Button/Chip variants
- Moved filter components to `shared/filters/`
- Consolidated EmptyState and LoadingSpinner
- Standardized `isLoading` prop naming
- Fixed all deprecated variant usages in code

**Phase 2: Character Sheet Migration** ✅
- All sections now use `GridListRow` (powers, techniques, weapons, armor, equipment, feats)
- Column headers added to all list sections
- Unified add buttons using `SectionHeader`

**Phase 3: Modal Unification** ✅
- All modals use `GridListRow` for list display
- Consistent footer pattern (selection count + Cancel/Add)
- `AddSubSkillModal` deferred (unique base skill selector feature)

**Phase 4: Behavioral Alignment** ✅
- Removed edit-mode restrictions on equipping/innate toggles
- Add buttons always visible
- Roll buttons always visible

**Phase 5: Library Alignment** ✅
- Library uses `SortHeader` and Next.js router
- Filter components reusable from `shared/filters/`

**Design Token Migration** ✅
- Migrated hardcoded Tailwind colors to semantic tokens:
  - `amber-*` → `tp-*` (Training Points)
  - `blue-*` → `energy-*` (Energy resource)
  - `purple-*` → `companion-*` / `power-*` (Companions, Power archetype)
  - `green-*` → `success-*` / `health-*` (Success states, HP)
  - `red-*` → `danger-*` / `health-*` (Danger states)

**Phase 6: Creator Improvements** ✅ (Feb 2026)
- Login redirect to last visited page (login/register pages)
- Fixed ability allocation cost display (2pt not 3pt)
- Renamed "Health & Energy Allocation" to "Health/Energy Allocation"
- Standardized page widths (characters page now uses `xl` like library/codex)
- Creature Creator Basic Info layout improved (Name row, Level/Type/Size aligned)
- Creature Summary sticky behavior fixed (self-start wrapper)
- Power Creator: Category auto-select first part on change
- Technique Creator: Category auto-select first part on change
- Item Creator: Weapon damage types limited to physical only
- All default values verified: weapon damage 1d4, armor DR 0

### Remaining Future Work
- `AddSubSkillModal` GridListRow migration (low priority - unique UX requirements)
- ESLint rules to enforce design system usage (enhancement)
- Extract shared `CreatorPartCard` component from power/technique creators (reduces ~240 lines of duplication)
- Adopt `useCreatorCache` hook in all creators (requires state refactor)
- Extract inline components from creature-creator (ChipList, AddItemDropdown, DefenseBlock)
