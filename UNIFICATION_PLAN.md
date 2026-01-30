# RealmsRPG Component & Style Unification Plan

> **Last Updated:** Phase 4 Complete  
> **Goal:** Unify components, styles, and logic across the entire site while preserving vanilla site functionality

---

## Progress Summary

### ✅ Completed
- [x] Created unified `RollButton` component (`shared/roll-button.tsx`)
- [x] Created unified `PointStatus` component (`shared/point-status.tsx`)
- [x] Created unified `ValueStepper` component (`shared/value-stepper.tsx`)
- [x] Consolidated SearchInput to single source (`ui/search-input.tsx`)
- [x] Updated LoadingSpinner to use `ui/spinner.tsx`
- [x] Updated `abilities-section.tsx` to use shared components
- [x] Updated `skills-section.tsx` to use shared components
- [x] Updated `NumberStepper` to wrap shared `ValueStepper`
- [x] Fixed color tokens in `LoadFromLibraryModal.tsx`
- [x] Fixed color tokens in `list-components.tsx`
- [x] Fixed color tokens in `collapsible.tsx`
- [x] Fixed color tokens in `expandable-chip.tsx`
- [x] Fixed color tokens in `sheet-header.tsx` (20+ replacements)
- [x] Fixed color tokens in `archetype-section.tsx` (25+ replacements)
- [x] Fixed color tokens in `add-skill-modal.tsx`
- [x] Fixed color tokens in `library-section.tsx` (50+ replacements)
- [x] **Phase 4 Color Migration Complete** - All non-auth components migrated

### ✅ Phase 4 Color Migration - Migrated Files
**App Pages:**
- [x] `characters/[id]/page.tsx` - 10 gray-* replaced
- [x] `characters/new/page.tsx` - 4 gray-* replaced
- [x] `power-creator/page.tsx`
- [x] `creature-creator/page.tsx`
- [x] `encounter-tracker/page.tsx`
- [x] `technique-creator/page.tsx`
- [x] `resources/page.tsx`
- [x] `rules/page.tsx`
- [x] `item-creator/page.tsx`
- [x] `privacy/page.tsx`
- [x] `library/page.tsx`
- [x] `(main)/layout.tsx`

**Character-Creator Steps:**
- [x] `abilities-step.tsx`
- [x] `archetype-step.tsx`
- [x] `ancestry-step.tsx`
- [x] `equipment-step.tsx`
- [x] `feats-step.tsx`
- [x] `finalize-step.tsx`

**Character-Sheet Components:**
- [x] `level-up-modal.tsx`
- [x] `feats-tab.tsx`
- [x] `dice-roller.tsx`
- [x] `add-sub-skill-modal.tsx`
- [x] `roll-log.tsx` (except dropdown `<option>` elements - browser-styled)
- [x] `proficiencies-tab.tsx`
- [x] `notes-tab.tsx`
- [x] `skills-section.tsx`

### ⚠️ Intentionally Preserved
- Auth components (`login/`, `register/`, `forgot-password/`, `forgot-username/`, `layout.tsx`) - Use dark theme gray-* styling
- Dropdown `<option>` elements in `roll-log.tsx` - Browser/OS styled

### 📋 TODO
- [ ] Update creator/ability-score-editor.tsx to use shared components
- [ ] Create unified DataTable/List component

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Identified Duplications](#identified-duplications)
3. [Unification Priorities](#unification-priorities)
4. [Component Consolidation Plan](#component-consolidation-plan)
5. [Style Unification Plan](#style-unification-plan)
6. [Implementation Roadmap](#implementation-roadmap)

---

## Current State Analysis

### ✅ What's Working Well

The codebase has a solid foundation with:

1. **Design System Tokens** - Comprehensive color palette defined in `globals.css` with semantic naming
2. **Component Library Structure** - Well-organized `ui/`, `shared/`, `creator/` folders
3. **Reusable UI Components** - Button, Card, Chip, Modal, TabNavigation using CVA
4. **CSS Component Classes** - `.btn-primary`, `.chip-action`, `.card` etc. provide consistent styling
5. **Export Organization** - Each component folder has an `index.ts` for clean imports

### ⚠️ What Needs Improvement

1. **Duplicate Component Implementations** - Same patterns reimplemented in multiple places
2. **Inconsistent Color Usage** - Mix of `gray-*` classes and design tokens
3. **Fragmented Styling** - Inline Tailwind vs CSS classes vs CVA variants
4. **Similar but Different Components** - Multiple tab systems, search inputs, loading states

---

## Identified Duplications

### 1. Roll Button Component

**Locations:**
- `character-sheet/skills-section.tsx` - `SkillRollButton` (lines 60-76)
- `character-sheet/abilities-section.tsx` - `RollButton` (lines 113-137)

**Issue:** Two separate implementations with slightly different styling.

**Solution:** Create unified `RollButton` in `shared/` with variants for different contexts.

---

### 2. Point Tracker / Status Display

**Locations:**
- `character-sheet/abilities-section.tsx` - `PointTracker` component (lines 141-157)
- `character-sheet/skills-section.tsx` - inline point display (lines 160-170)
- `character-creator/steps/skills-step.tsx` - inline points counter (lines 130-135)
- `creator/ability-score-editor.tsx` - points status bar (lines 135-165)

**Issue:** Same pattern (spent/remaining points) with inconsistent implementations.

**Solution:** Create unified `PointStatus` component with variants for inline/block display.

---

### 3. Search Input

**Locations:**
- `ui/search-input.tsx` - Standalone component
- `shared/list-components.tsx` - `SearchInput` component (lines 19-46)

**Issue:** Two implementations with slightly different APIs.

**Solution:** Use `ui/search-input.tsx` as source of truth, deprecate the one in list-components.

---

### 4. Loading States

**Locations:**
- `ui/spinner.tsx` - `Spinner`, `LoadingOverlay`, `LoadingState`
- `shared/list-components.tsx` - `LoadingSpinner` (lines 196+)
- Inline spinners throughout codebase (`w-8 h-8 border-4...`)

**Issue:** Multiple loading implementations, some use CSS classes, some inline.

**Solution:** Use `ui/spinner.tsx` exclusively, remove inline implementations.

---

### 5. Empty States

**Locations:**
- `ui/empty-state.tsx` - Full featured component
- `shared/list-components.tsx` - `EmptyState` (simpler version)

**Issue:** Duplicate empty state components with different capabilities.

**Solution:** Consolidate to `ui/empty-state.tsx`, add any missing features.

---

### 6. Tab Navigation

**Locations:**
- `ui/tab-navigation.tsx` - `TabNavigation` with underline/pill variants
- `ui/tabs.tsx` - `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` (context-based)

**Issue:** Two different tab systems exist.

**Solution:** Keep both but clarify use cases:
- `TabNavigation` - Simple navigation between page sections
- `Tabs` - Content tabs with panels

---

### 7. Stepper / Increment Controls

**Locations:**
- `creator/number-stepper.tsx` - Full featured with sizes
- `creator/ability-score-editor.tsx` - Inline +/- buttons (lines 200+)
- `character-sheet/abilities-section.tsx` - Defense skill steppers
- `character-sheet/skills-section.tsx` - Skill value steppers

**Issue:** Inconsistent stepper styling and behavior across contexts.

**Solution:** Enhance `NumberStepper` to handle all use cases, apply `.btn-stepper` classes consistently.

---

### 8. Error Display

**Locations:**
- `ui/alert.tsx` - Basic alert
- `ui/alert-enhanced.tsx` - More features
- `shared/list-components.tsx` - `ErrorDisplay`

**Issue:** Multiple error display patterns.

**Solution:** Consolidate to `ui/alert.tsx`, enhance with dismissible/icon options.

---

## Unification Priorities

### Priority 1: Critical (Blocks Other Work)
1. ✨ Consolidate SearchInput implementations
2. ✨ Create unified RollButton component
3. ✨ Standardize loading states

### Priority 2: High Impact
4. 🎯 Unify point tracker/status displays
5. 🎯 Consolidate stepper controls
6. 🎯 Standardize color usage (remove gray-* hardcoding)

### Priority 3: Polish
7. 📦 Consolidate alert/error components
8. 📦 Create unified DataTable/List component
9. 📦 Document component usage guidelines

---

## Component Consolidation Plan

### Shared Roll Button (`src/components/shared/roll-button.tsx`)

```tsx
interface RollButtonProps {
  value: number | string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'unproficient' | 'defense';
  disabled?: boolean;
  title?: string;
}
```

**Used By:**
- Character Sheet: abilities, skills, defenses
- Creature Stat Block: ability rolls
- Encounter Tracker: quick rolls

---

### Unified Point Status (`src/components/shared/point-status.tsx`)

```tsx
interface PointStatusProps {
  label?: string;
  spent: number;
  total: number;
  variant?: 'inline' | 'block' | 'compact';
  showCalculation?: boolean; // Show "Total - Spent = Remaining"
}
```

**Used By:**
- Character Creator: ability points, skill points
- Character Sheet (edit mode): ability/skill allocation
- Creature Creator: point allocation

---

### Enhanced Number Stepper (`src/components/shared/number-stepper.tsx`)

```tsx
interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ability' | 'skill';
  disabled?: boolean;
  showValue?: boolean; // For cases where value is displayed separately
}
```

**Used By:**
- All creators (level, quantities)
- Character Sheet (ability editing, skill editing)
- Ability Score Editor

---

## Style Unification Plan

### Color Token Migration

Replace hardcoded colors with design system tokens:

| Old Pattern | New Pattern |
|-------------|-------------|
| `text-gray-900` | `text-text-primary` |
| `text-gray-800` | `text-text-primary` |
| `text-gray-700` | `text-text-secondary` |
| `text-gray-600` | `text-text-secondary` |
| `text-gray-500` | `text-text-muted` |
| `text-gray-400` | `text-text-muted` |
| `bg-gray-50` | `bg-surface-secondary` |
| `bg-gray-100` | `bg-neutral-100` |
| `bg-gray-200` | `bg-neutral-200` |
| `border-gray-200` | `border-border-light` |
| `border-gray-300` | `border-border` |
| `hover:bg-gray-100` | `hover:bg-neutral-100` |
| `from-blue-500` | `from-primary-500` |
| `to-blue-700` | `to-primary-700` |

### Typography Consistency

Apply consistent font usage:

| Element | Font | Weight | Class |
|---------|------|--------|-------|
| Page titles (h1) | Nova Flat | 600 | `font-display font-semibold` |
| Section headers (h2) | Nova Flat | 600 | `font-display font-semibold` |
| Card titles (h3) | Nunito | 600 | `font-semibold` |
| Body text | Nunito | 400 | (default) |
| Buttons | Nunito | 600 | `font-semibold` |
| Labels | Nunito | 600 | `font-semibold text-sm` |

### Interactive Element Consistency

All interactive elements should follow these patterns:

| Element Type | Visual Pattern |
|--------------|----------------|
| Roll buttons | Blue gradient, white text, `+/-#` format |
| Action buttons | Primary gradient, prominent |
| Secondary buttons | Neutral background, bordered |
| Stepper +/- | Round buttons, success/danger colors |
| Tabs | Underline (navigation) or pill (wizards) |

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

- [x] Create UNIFICATION_PLAN.md (this document)
- [ ] Create `shared/roll-button.tsx`
- [ ] Create `shared/point-status.tsx`
- [ ] Consolidate SearchInput to single source
- [ ] Update components to use `ui/spinner.tsx`

### Phase 2: Character Sheet Components (Week 2)

- [ ] Update `abilities-section.tsx` to use shared components
- [ ] Update `skills-section.tsx` to use shared components
- [ ] Ensure defenses use same RollButton pattern
- [ ] Create shared skill list component for reuse

### Phase 3: Creator Unification (Week 3)

- [ ] Update all creator steps to use shared components
- [ ] Unify creator summary panels
- [ ] Consistent styling across all creator pages

### Phase 4: Color & Style Migration (Week 4) ✅ COMPLETE

- [x] Run search/replace for gray-* → semantic tokens
- [x] Audit all inline gray-* classes in non-auth components
- [x] Migrate character pages (characters/[id], characters/new)
- [x] Migrate all character-creator step components
- [x] Migrate all character-sheet components
- [x] Migrate all main page components (creators, library, etc.)
- [ ] Verify typography consistency (optional future work)

### Phase 5: Testing & Polish (Week 5)

- [ ] Visual regression testing
- [ ] Cross-page component verification
- [ ] Remove dead/unused code
- [ ] Update component documentation

---

## Files to Create

1. `src/components/shared/roll-button.tsx` - Unified roll button
2. `src/components/shared/point-status.tsx` - Point tracker display
3. `src/components/shared/skill-list.tsx` - Reusable skill list for sheet/creatures
4. `src/components/shared/ability-grid.tsx` - 6-ability display grid

## Files to Update

1. `src/components/character-sheet/abilities-section.tsx` - Use shared components
2. `src/components/character-sheet/skills-section.tsx` - Use shared components
3. `src/components/creator/ability-score-editor.tsx` - Use shared RollButton
4. `src/components/shared/list-components.tsx` - Remove duplicate SearchInput
5. Multiple files for color token migration

## Files to Remove/Deprecate

1. `src/components/ui/alert-enhanced.tsx` - Merge into alert.tsx
2. Inline `SkillRollButton` in skills-section.tsx
3. Inline `RollButton` in abilities-section.tsx
4. Inline `PointTracker` in abilities-section.tsx

---

## Success Criteria

- [ ] Same RollButton component used across character sheet, creatures, encounter tracker
- [ ] Same PointStatus component used in all point allocation contexts
- [x] No hardcoded gray-* classes in non-auth components (all use semantic tokens)
- [ ] Consistent typography (Nova Flat for h1/h2, Nunito for rest)
- [ ] Single SearchInput implementation
- [ ] Single loading state implementation
- [ ] All stepper controls use consistent styling
- [ ] Documentation updated for component usage

---

*This document will be updated as unification progresses.*
