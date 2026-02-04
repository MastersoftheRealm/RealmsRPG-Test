# RealmsRPG Component & Style Unification Plan

> **Last Updated:** January 30, 2025 - Phase 10H Complete  
> **Goal:** Unify components, styles, and logic across the entire site while preserving vanilla site functionality
> **Status:** ✅ Phase 10H Complete - Comprehensive Neutral Token Migration

---

## 🔴 CRITICAL: Unused Shared Components (Deep Audit Finding)

These components exist but were **underutilized**:

| Component | File | Status |
|-----------|------|--------|
| **Input** | `ui/input.tsx` | ✅ Used in my-account, codex, power/technique/creature creators |
| **Card** | `ui/card.tsx` | ✅ Card layouts now use `bg-surface` token |
| **Chip** | `ui/chip.tsx` | ✅ Now used in 8+ files (filters, species-modal, ancestry-step, etc.) |
| **SearchInput** | `ui/search-input.tsx` | ✅ Now used in 7 modals |
| **IconButton** | `ui/icon-button.tsx` | ✅ Used in 15+ components (modals, cards, tables) |
| **Checkbox** | `ui/checkbox.tsx` | ✅ Used in 5+ components (filters, creator pages) |
| **Select** | `ui/select.tsx` | 🔄 Available - inline selects remain |
| **Textarea** | `ui/textarea.tsx` | ✅ Used in power-creator, technique-creator |
| **Button** | `ui/button.tsx` | ✅ Used in 25+ components (modals, pages, creators) |
| **ExpandableChip** | `ui/expandable-chip.tsx` | 🔄 Available for future use |
| **CreaturePowerCard** | `shared/creature-power-card.tsx` | 🔄 Available for future use |

---

## Progress Summary

### ✅ Phases 1-5 Complete (Previous Work)
- [x] Created unified `RollButton`, `PointStatus`, `ValueStepper` components
- [x] Consolidated SearchInput to single source (`ui/search-input.tsx`)
- [x] Updated LoadingSpinner to use `ui/spinner.tsx`
- [x] Updated character sheet components to use shared components
- [x] **Phase 4 Color Migration Complete** - All non-auth components migrated
- [x] **Phase 5: Dead Code Removal** - Deleted unused `alert-enhanced.tsx` and `tabs.tsx`
- [x] **Phase 5: Spinner Unification** - Replaced 12 inline spinners with `<Spinner />`
- [x] **Phase 5: Typography System** - Added `font-display` utility classes

### ✅ Phase 6: Adopt Unused Components (COMPLETE)
- [x] **Chip Component Adoption** - Replaced inline chips in:
  - `codex/filters/tag-filter.tsx` - Uses `<Chip variant="success" onRemove={...}>`
  - `codex/filters/ability-requirement-filter.tsx` - Uses `<Chip variant="warning" onRemove={...}>`
  - `character-creator/species-modal.tsx` - Ability bonuses, skills, languages
  - `character-creator/steps/ancestry-step.tsx` - Species skills, languages
  - `character-creator/steps/archetype-step.tsx` - Power/Martial ability display
  - `character-creator/steps/species-step.tsx` - Ability bonuses
  - `character-sheet/proficiencies-tab.tsx` - Proficiency chips
- [x] **SearchInput Component Adoption** - Replaced inline search inputs in:
  - `character-sheet/add-feat-modal.tsx`
  - `character-sheet/add-skill-modal.tsx`
  - `character-sheet/add-sub-skill-modal.tsx`
  - `character-sheet/add-library-item-modal.tsx`
  - `creator/LoadFromLibraryModal.tsx`
- [x] **Checkbox Component Adoption** - Replaced in:
  - `codex/filters/checkbox-filter.tsx` - Uses shared Checkbox
  - `character-sheet/add-feat-modal.tsx` - "Show eligible only" toggle
- [x] **bg-white → bg-surface Migration** - 73 instances converted across 25+ files
- [x] **Dead Code Removal**:
  - Removed `console.log` from `firebase/client.ts`
  - Removed `console.log` from `forgot-username/page.tsx`
  - Deleted unused `firebase/admin.ts`
  - Removed unused `Check` import from `ui/checkbox.tsx`

### ✅ Phase 7: Create Missing Shared Components (COMPLETE)
- [x] **IconButton** (`ui/icon-button.tsx`) - Created with CVA variants (default, ghost, primary, danger, success, muted) and sizes (sm, md, lg)
- [x] **Select** (`ui/select.tsx`) - Created with label, error, helperText, options support
- [x] **Checkbox** (`ui/checkbox.tsx`) - Created with label, description, error support
- [x] **Textarea** (`ui/textarea.tsx`) - Created with label, error, helperText support
- [x] **IconButton Adoption** - Used in 4 modal close buttons:
  - `character-sheet/add-feat-modal.tsx`
  - `character-sheet/add-skill-modal.tsx`
  - `character-sheet/add-sub-skill-modal.tsx`
  - `creator/LoadFromLibraryModal.tsx`

### ✅ Phase 8: Unify Remaining Patterns (COMPLETE)

**Button Component - All Navigation Buttons Migrated:**
- [x] All `.btn-back`/`.btn-continue` CSS classes eliminated (0 remaining)
- [x] **Dead CSS removed:** `.btn-back` and `.btn-continue` classes removed from `globals.css`
- [x] Character creator steps: species, powers, skills, feats, archetype, ancestry, abilities, equipment, finalize
- [x] Species modal: Pick Me/Nah buttons
- [x] All creators: Load/Reset/Save buttons
- [x] All modals: Cancel/Confirm buttons
- [x] Library/Codex: Empty state CTAs
- [x] Character sheet: Level Up/Recover/Edit header buttons

**IconButton Adoption** - 20+ components:
- [x] `character-sheet/add-feat-modal.tsx` - Close button
- [x] `character-sheet/add-skill-modal.tsx` - Close button
- [x] `character-sheet/add-sub-skill-modal.tsx` - Close button
- [x] `character-sheet/add-library-item-modal.tsx` - Close button
- [x] `creator/LoadFromLibraryModal.tsx` - Close button
- [x] `shared/item-selection-modal.tsx` - Close button
- [x] `character/character-card.tsx` - Delete button
- [x] `power-creator/page.tsx` - 3 remove part buttons
- [x] `technique-creator/page.tsx` - 3 remove part buttons
- [x] `item-creator/page.tsx` - 2 remove property buttons
- [x] `creature-creator/page.tsx` - 5 modal close + 3 table remove buttons
- [x] `ability-requirement-filter.tsx` - Add button (primary variant)

**Button Component Adoption** - 10+ components:
- [x] `shared/item-selection-modal.tsx` - Cancel/Confirm buttons
- [x] `creator/collapsible-section.tsx` - Enable section button
- [x] `library/page.tsx` - 4 empty state CTA buttons
- [x] `my-account/page.tsx` - 5 buttons (Update Email/Password, Delete, etc.)
- [x] `encounter-tracker/page.tsx` - 7 combat control buttons
- [x] `creature-creator/page.tsx` - 4 Add buttons
- [x] `level-up-modal.tsx` - Cancel/Level Up buttons
- [x] `add-library-item-modal.tsx` - Cancel/Add buttons
- [x] `forgot-username/page.tsx` - Submit button
- [x] `forgot-password/page.tsx` - "try again" link button
- [x] `finalize-step.tsx` - Modal buttons + main save/back buttons
- [x] `creature-stat-block.tsx` - Edit/Duplicate/Delete action buttons
- [x] `grid-list-row.tsx` - Edit/Duplicate/Delete action buttons
- [x] Creator page headers - All 4 creators (power/technique/item/creature) now use Button for Load/Reset/Save
- [x] `powers-step.tsx` - Add Powers/Add Techniques buttons + remove buttons
- [x] `collapsible-section.tsx` - Remove button
- [x] `species-step.tsx` - View Details link button
- [x] `skills-section.tsx` - Add Skill/Add Sub-Skill buttons + remove skill button

**IconButton Component Adoption** - 25+ components:
- [x] All modal close buttons (6 modals)
- [x] Creator table remove buttons (power/technique/item/creature)
- [x] `item-card.tsx` - View/Edit/Duplicate/Delete + expand/collapse buttons
- [x] `powers-step.tsx` - Remove power/technique buttons
- [x] `skills-section.tsx` - Remove skill button

**Checkbox Component Adoption** - 5+ components:
- [x] `codex/filters/checkbox-filter.tsx`
- [x] `character-sheet/add-feat-modal.tsx`
- [x] `power-creator/page.tsx` - 8 checkboxes
- [x] `technique-creator/page.tsx` - 1 checkbox
- [x] `item-creator/page.tsx` - 1 checkbox
- [x] `encounter-tracker/page.tsx` - 1 checkbox

**SearchInput Adoption** - 8 modals (complete):
- [x] 7 original modal adoptions
- [x] `creature-creator/page.tsx` - LoadFeatModal search

- [x] `modal.tsx` - Close button
- [x] `alert.tsx` - Dismiss button  
- [x] `toast.tsx` - Dismiss button
- [x] `library-section.tsx` - 3 remove buttons (power, technique, item)
- [x] `item-list.tsx` - Clear search, filter toggle, layout buttons

**Input/Textarea Component Adoption:**
- [x] `my-account/page.tsx` - 7 form inputs → Input component
- [x] `codex/page.tsx` - Max level filter → Input component
- [x] `power-creator/page.tsx` - Name input + description textarea
- [x] `technique-creator/page.tsx` - Name input + description textarea
- [x] `creature-creator/page.tsx` - Name input + language input
- [x] `encounter-tracker/page.tsx` - Add Combatant form (5 inputs) → Input component

**bg-white → bg-surface Migration (Phase 9):**
- [x] `codex/filters/tag-filter.tsx` - select bg-white → bg-surface
- [x] `codex/filters/chip-select.tsx` - select bg-white → bg-surface
- [x] `codex/filters/select-filter.tsx` - select bg-white → bg-surface
- [x] `codex/filters/ability-requirement-filter.tsx` - select bg-white → bg-surface
- [x] `creator/ability-score-editor.tsx` - card bg-white → bg-surface
- [x] `character-sheet/skills-section.tsx` - table row bg-white → bg-surface
- [x] `character-sheet/sheet-header.tsx` - DefenseBlock bg-white → bg-surface
- [x] `character-sheet/library-section.tsx` - 3 card types bg-white → bg-surface
- [x] `character-sheet/feats-tab.tsx` - CollapsibleSection + FeatCard bg-white → bg-surface
- [x] `character-sheet/archetype-section.tsx` - roll button bg-white → bg-surface
- [x] `character-creator/steps/archetype-step.tsx` - 4 button types bg-white → bg-surface
- [x] `character-creator/steps/ancestry-step.tsx` - checkbox bg-white → bg-surface
- [x] `character-creator/steps/equipment-step.tsx` - 3 elements bg-white → bg-surface
- [x] `character-creator/creator-tab-bar.tsx` - tab button bg-white → bg-surface
- [x] `characters/[id]/page.tsx` - sticky action bar bg-white → bg-surface

**Intentionally Preserved bg-white (26 instances):**
- `bg-white/XX` opacity patterns (overlays on dark backgrounds in spinner, roll-log, creature-stat-block, power-creator)
- Roll log dice buttons (dark theme contrast)
- Creature stat block pills (on gradient backgrounds)
- Power creator cost displays (inside colored containers)
- Feats-step selected tags (contrast styling)
- Auth social buttons (gray theme)
- Encounter-tracker stat inputs (specialized compact fields with colored borders)
- CSS slider thumbs in globals.css

**Remaining Work (Phase 10+):**
- [x] ~14 inline inputs in encounter-tracker - KEPT intentionally (specialized stat table fields need compact styling)
- [x] ~10 inline inputs in character-sheet - KEPT intentionally (specialized currency/weight fields)
- [x] ~40 inline selects noted - These were in vanilla-site-reference-only, not in Next.js code

### ✅ Phase 9: Design Token Migration (COMPLETE)
- [x] Replace `bg-white rounded-*` → `bg-surface rounded-*` (73+ instances)
- [x] Replace remaining `neutral-*` → semantic tokens (COMPLETE - see Phase 10A below)
- [x] Add missing tokens (TP, Power, Health, Energy, Ally/Enemy/Companion combatant types)

### ✅ Phase 10A: Semantic Token Migration (COMPLETE)
**Page Backgrounds:**
- [x] `(main)/layout.tsx` - bg-neutral-50 → bg-background
- [x] `not-found.tsx` - bg-neutral-50 → bg-background
- [x] `my-account/page.tsx` - bg-neutral-50 → bg-background
- [x] All creator pages - bg-neutral-50 → bg-background
- [x] `characters/[id]/page.tsx` - bg-neutral-50 → bg-background
- [x] `characters/new/page.tsx` - bg-neutral-50 → bg-background

**Nested Section Backgrounds:**
- [x] Creator card headers/options → bg-surface-alt
- [x] Modal footers → bg-surface-alt
- [x] Character-sheet section backgrounds → bg-surface-alt
- [x] Character-creator step summaries → bg-surface-alt

**Border Tokens:**
- [x] All `border-neutral-200` → `border-border-light` (75+ instances)
- [x] Container borders, card borders, dividers
- [x] Modal headers/footers, table headers, section dividers

**Hover States:**
- [x] All `hover:bg-neutral-50` → `hover:bg-surface-alt`
- [x] Collapsible headers, list items, buttons

**Components Updated:**
- [x] `spinner.tsx` - muted variant border
- [x] `chip.tsx` - default variant + outline hover
- [x] `part-chip.tsx` - property variant
- [x] `collapsible-section.tsx` - header hover
- [x] `health-energy-allocator.tsx` - container borders
- [x] All character-sheet components (12 files)
- [x] All character-creator steps (7 files)
- [x] All creator pages (4 files)
- [x] `creature-creator/page.tsx` - 20+ instances

**Alert Component Adoption:**
- [x] `finalize-step.tsx` - Error message → Alert variant="danger"
- [x] `my-account/page.tsx` - Email/Password messages → Alert variant="success/danger"
- [x] `technique-creator/page.tsx` - Save message + loading error → Alert
- [x] `power-creator/page.tsx` - Save message + loading error → Alert
- [x] `item-creator/page.tsx` - Save message + loading error → Alert
- [x] `login/page.tsx` - Error message → Alert variant="danger"
- [x] `register/page.tsx` - Error message → Alert variant="danger"
- [x] `forgot-password/page.tsx` - Error message → Alert variant="danger"
- [x] `forgot-username/page.tsx` - Error message → Alert variant="danger"
- [x] `species-step.tsx` - Missing data warning → Alert variant="warning"
- [x] `skills-step.tsx` - Missing data warning → Alert variant="warning"
- [x] `ancestry-step.tsx` - No species selected warning → Alert variant="warning"
- [x] `LoadFromLibraryModal.tsx` - Library error → Alert variant="danger"
- [x] `add-sub-skill-modal.tsx` - Load error → Alert variant="danger"
- [x] `add-skill-modal.tsx` - Load error → Alert variant="danger"
- [x] `add-feat-modal.tsx` - Load error → Alert variant="danger"

### 📋 Phase 10: Final Cleanup
- [x] Remove console.logs (2 instances removed)
- [x] Delete unused files (`firebase/admin.ts` deleted)
- [x] Clean up unused imports in my-account/page.tsx
- [x] Unused hook exports - KEPT for API completeness (useGameDataList, useAncestry, etc. provide clean public API)

### ✅ Phase 10B: Collapsible Component Unification (COMPLETE)

**Shared Collapsible Component Enhancements:**
- [x] Enhanced `ui/collapsible.tsx` with `count` prop for item count display
- [x] Enhanced `ui/collapsible.tsx` with `action` prop for header action buttons

**feats-tab.tsx Migration:**
- [x] Removed local `CollapsibleSection` component (50 lines)
- [x] Migrated to shared `Collapsible` from `@/components/ui`
- [x] Preserved custom header gradients via `headerClassName`
- [x] Preserved action buttons (Add Feat) via `action` prop

**Other Collapsible Patterns (Intentionally Preserved):**
- `library-section.tsx` - Specialized expandable cards with innate toggle, use buttons, energy costs
- `creature-stat-block.tsx` - Specialized stat block expansion with action buttons
- Power/Technique/Item cards - Custom expand/collapse with specialized content

### ✅ Phase 10C: PageContainer Adoption (COMPLETE)

**PageContainer Size Enhancements:**
- [x] Added `xs` size (max-w-2xl) for narrow form pages
- [x] Added `prose` size (max-w-4xl) for content-heavy pages
- [x] Added `content` size (max-w-6xl) for medium content pages

**Static Pages Migrated:**
- [x] `privacy/page.tsx` - Now uses `<PageContainer size="prose">`
- [x] `terms/page.tsx` - Now uses `<PageContainer size="prose">`
- [x] `resources/page.tsx` - Now uses `<PageContainer size="prose">`
- [x] `rules/page.tsx` - Now uses `<PageContainer size="content">`
- [x] `my-account/page.tsx` - Now uses `<PageContainer size="xs">`

**PageContainer Size Reference:**
- `xs` = max-w-2xl (my-account, login forms)
- `sm` = max-w-3xl
- `prose` = max-w-4xl (privacy, terms, resources)
- `md` = max-w-5xl
- `content` = max-w-6xl (rules)
- `lg` = max-w-7xl (default)
- `xl` = max-w-[1440px] (library, codex)
- `full` = max-w-none

### ✅ Phase 10D: Border Token Completion (COMPLETE)

**Design Token Addition:**
- [x] Added `--color-border-subtle` token (neutral-100) to globals.css

**Border Migration (15 instances):**
- [x] `creator/collapsible-section.tsx` - border-neutral-100 → border-border-subtle
- [x] `character-sheet/skills-section.tsx` - Table row borders
- [x] `character-sheet/archetype-section.tsx` - Weapon/armor table borders
- [x] `character-sheet/add-sub-skill-modal.tsx` - Header divider
- [x] `character-sheet/add-skill-modal.tsx` - Header divider
- [x] `character-sheet/add-feat-modal.tsx` - Header divider
- [x] `technique-creator/page.tsx` - Section divider
- [x] `item-creator/page.tsx` - Section divider
- [x] `power-creator/page.tsx` - Section divider
- [x] `encounter-tracker/page.tsx` - 2 dividers
- [x] `character-creator/steps/feats-step.tsx` - Section divider
- [x] `my-account/page.tsx` - 2 profile info dividers

**Border Token System (Complete):**
- `border-border` = #707070 (neutral-600) - Default borders
- `border-border-light` = #dad9d9 (neutral-200) - Card/container borders
- `border-border-subtle` = #f6f6f6 (neutral-100) - Very light internal dividers

### ✅ Phase 10E: PageHeader Adoption (COMPLETE)

**Static Pages Migrated:**
- [x] `privacy/page.tsx` - Now uses `<PageHeader title="Privacy Policy" />`
- [x] `terms/page.tsx` - Now uses `<PageHeader title="Terms of Service" />`
- [x] `resources/page.tsx` - Uses PageHeader with title + description
- [x] `rules/page.tsx` - Uses PageHeader with title + description

**Result:** All static content pages now use consistent PageHeader + PageContainer pattern

### ✅ Phase 10F: Creator Pages PageContainer Adoption (COMPLETE)

**Creator Pages Migrated:**
- [x] `power-creator/page.tsx` - 3 instances → `PageContainer size="content"`
- [x] `technique-creator/page.tsx` - 3 instances → `PageContainer size="content"`
- [x] `item-creator/page.tsx` - 3 instances → `PageContainer size="content"`
- [x] `creature-creator/page.tsx` - 1 instance → `PageContainer size="full"`
- [x] `encounter-tracker/page.tsx` - 2 instances → `PageContainer size="full"`

**Impact:**
- Removed 12 inline `max-w-6xl mx-auto` and `max-w-7xl mx-auto` divs
- All creator tools now use consistent PageContainer component
- Sizes used: `content` (max-w-6xl) for focused creators, `full` (max-w-7xl) for wide layouts

### ✅ Phase 10G: PageHeader Adoption for Creators (COMPLETE)

**PageHeader Component Enhancements:**
- [x] Added `icon` prop for optional icon before title
- [x] Changed description text color to `text-text-secondary` for consistency
- [x] Changed flex alignment to `items-start` for better multi-line description handling

**Creator Pages Migrated to PageHeader:**
- [x] `power-creator/page.tsx` - Uses icon (Wand2), title, description, and action buttons
- [x] `technique-creator/page.tsx` - Uses icon (Swords), title, description, and action buttons
- [x] `item-creator/page.tsx` - Uses icon (Sword), title, description, and action buttons
- [x] `creature-creator/page.tsx` - Uses title, description, and action buttons (no icon)
- [x] `characters/new/page.tsx` - Now uses PageContainer size="content"

**Intentionally Preserved (Specialized Headers):**
- `encounter-tracker/page.tsx` - Has dynamic round display and auto-save indicator that require custom JSX
- `characters/[id]/page.tsx` - Has sticky action bar with separate container requirements

**Additional Migrations:**
- [x] `creator-constants.ts` - RARITY_COLORS Common: `text-gray-600 bg-gray-100` → `text-text-secondary bg-neutral-100`

### ✅ Phase 10H: Comprehensive Neutral Token Migration (COMPLETE)

**Major Token Migration Achievement:**
- Reduced `neutral-*` token occurrences from 100+ to just 13 intentional uses
- Migrated ~90+ files across components, pages, and UI elements

**Semantic Token Replacements Applied:**
| Original Token | Semantic Token | Usage Context |
|---------------|----------------|---------------|
| `bg-neutral-100` | `bg-surface-alt` | Alternative surface backgrounds |
| `bg-neutral-200` | `bg-surface` | Primary surface backgrounds |
| `border-neutral-300` | `border-border-light` | Input/card borders |
| `hover:bg-neutral-100` | `hover:bg-surface-alt` | Hover states |
| `hover:bg-neutral-200` | `hover:bg-surface` | Hover states |
| `text-neutral-300` | `text-border-light` | Decorative separators |
| `divide-neutral-100` | `divide-border-subtle` | List dividers |
| `border-neutral-400` | `border-border` | Stronger borders |
| `hover:border-neutral-300` | `hover:border-border` | Border hover states |
| `bg-neutral-100 text-neutral-300` | `bg-surface text-border-light` | Disabled states |

**Component Categories Migrated:**
1. **UI Components (9 files):**
   - `button.tsx` - secondary/ghost variants
   - `checkbox.tsx` - border color
   - `chip.tsx` - default/secondary variants
   - `empty-state.tsx` - icon background
   - `expandable-chip.tsx` - default variant
   - `icon-button.tsx` - hover states
   - `input.tsx` - disabled state
   - `select.tsx` - disabled state
   - `tab-navigation.tsx` - badge/pill backgrounds
   - `textarea.tsx` - disabled state

2. **Shared Components (8 files):**
   - `creature-stat-block.tsx` - quote border
   - `grid-list-row.tsx` - gray badge, hover states
   - `item-card.tsx` - default badge, checkbox border
   - `list-components.tsx` - header/empty icon backgrounds
   - `point-status.tsx` - decorative operators
   - `species-trait-card.tsx` - borders

3. **Creator Components (6 files):**
   - `archetype-selector.tsx` - hover borders, slider dots
   - `collapsible-section.tsx` - dashed border, badge
   - `creator-summary-panel.tsx` - badge defaults
   - `health-energy-allocator.tsx` - backgrounds, separators
   - All 4 creator pages - section backgrounds, borders

4. **Character Sheet Components (14 files):**
   - `abilities-section.tsx` - ability card gradients
   - `add-feat-modal.tsx` - filter buttons, cancel button
   - `add-library-item-modal.tsx` - dividers, borders
   - `add-skill-modal.tsx` - cancel/submit buttons
   - `add-sub-skill-modal.tsx` - cancel/submit buttons
   - `archetype-section.tsx` - stepper buttons
   - `dice-roller.tsx` - dice buttons
   - `feats-tab.tsx` - stepper buttons
   - `level-up-modal.tsx` - stepper buttons
   - `library-section.tsx` - action buttons
   - `notes-tab.tsx` - form borders
   - `proficiencies-tab.tsx` - header background
   - `roll-log.tsx` - custom roll border, die display
   - `sheet-header.tsx` - progress bar, decorative dots
   - `skills-section.tsx` - stepper buttons

5. **Character Creator Steps (7 files):**
   - `ancestry-step.tsx` - dividers, borders
   - `archetype-step.tsx` - hover borders, disabled states
   - `equipment-step.tsx` - property badges
   - `feats-step.tsx` - borders, filter buttons
   - `finalize-step.tsx` - image placeholder, input borders
   - `skills-step.tsx` - collapsed headers
   - `species-step.tsx` - badges

6. **Layout & Pages (5 files):**
   - `header.tsx` - dropdown hover, mobile nav
   - `character-card.tsx` - placeholder border/background
   - `creator-tab-bar.tsx` - tab backgrounds

**Codex Filter Components (4 files):**
- `ability-requirement-filter.tsx` - select borders
- `chip-select.tsx` - select border
- `select-filter.tsx` - select border
- `tag-filter.tsx` - input borders

**Intentionally Preserved Neutral Tokens (13 occurrences in 6 files):**
| File | Token | Reason |
|------|-------|--------|
| `roll-button.tsx` | Gradient neutrals (300-700) | Metallic button visual effect |
| `creature-stat-block.tsx` | `from-neutral-800 to-neutral-700` | Dark header gradient |
| `footer.tsx` | `bg-neutral-400` | Footer background color |
| `spinner.tsx` | `border-t-neutral-500` | Spinner indicator color |
| `roll-log.tsx` | `disabled:from-neutral-500/600` | Disabled roll button gradient |
| `notes-tab.tsx` | `from-neutral-50 to-indigo-50` | Special indigo gradient button |

### ⚠️ Intentionally Preserved
- Auth components (`login/`, `register/`, `forgot-password/`, `forgot-username/`) - Use dark theme gray-* styling
- Dropdown `<option>` elements - Browser/OS styled
- Semantic colors: Health=red, Energy=blue, Resistances=green (per design philosophy)
- `bg-white/XX` opacity patterns - Used for overlays on dark backgrounds
- Specialized stepper/toggle buttons - Roll log dice buttons, level selectors, proficiency dots (context-specific UI)

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

### Phase 1: Foundation (Week 1) ✅ COMPLETE

- [x] Create UNIFICATION_PLAN.md (this document)
- [x] Create `shared/roll-button.tsx`
- [x] Create `shared/point-status.tsx`
- [x] Create `shared/value-stepper.tsx`
- [x] Consolidate SearchInput to single source
- [x] Update components to use `ui/spinner.tsx`

### Phase 2: Character Sheet Components (Week 2) ✅ COMPLETE

- [x] Update `abilities-section.tsx` to use shared components
- [x] Update `skills-section.tsx` to use shared components
- [x] Ensure defenses use same RollButton pattern
- [x] Shared skill list component - NOT NEEDED (character-sheet and creature-creator have specialized requirements)

### Phase 3: Creator Unification (Week 3) ✅ COMPLETE

- [x] Character-creator steps use shared components
- [x] Updated `ability-score-editor.tsx` to use `<PointStatus />`
- [x] Replaced loading states with `<LoadingState />` in power/technique/item creators
- [x] Migrated hover colors to semantic tokens
- [x] Unified creator summary panels - all now use `CreatorSummaryPanel` component

### Phase 4: Color & Style Migration (Week 4) ✅ COMPLETE

- [x] Run search/replace for gray-* → semantic tokens
- [x] Audit all inline gray-* classes in non-auth components
- [x] Migrate character pages (characters/[id], characters/new)
- [x] Migrate all character-creator step components
- [x] Migrate all character-sheet components
- [x] Migrate all main page components (creators, library, etc.)
- [x] Typography system: Added `.font-display`, `.page-title`, `.section-title` utilities
- [x] h1/h2 headings now use Nova Flat display font by default

### Phase 5: Testing & Polish (Week 5) ✅ COMPLETE

- [x] Fixed syntax error in `list-components.tsx`
- [x] Replaced 12 inline spinners with `<Spinner />` component across 11 files
- [x] Removed dead code: `alert-enhanced.tsx`, `tabs.tsx` (unused components)
- [x] Updated `ui/index.ts` to remove dead exports
- [x] Creator loading states unified with `<LoadingState />` (power, technique, item, my-account)
- [x] Typography utilities added to globals.css (`.font-display`, `.page-title`, `.section-title`)
- [x] Audited expandable list items - GridListRow is the main unified component
- [x] Verified TabNavigation used consistently in library/codex
- [x] Cross-page component verification complete
- [x] Component documentation added (see Component Usage Guidelines section)

---

## Codebase Audit Results (Phase 5)

### Shared Components Usage

| Component | Definition | Usages | Status |
|-----------|------------|--------|--------|
| `RollButton` | shared/roll-button.tsx | 5 (abilities-section, skills-section) | ✅ In Use |
| `PointStatus` | shared/point-status.tsx | 5 (abilities-section, skills-section) | ✅ In Use |
| `ValueStepper` | shared/value-stepper.tsx | 2 (wrapped by NumberStepper) | ✅ In Use |
| `Spinner` | ui/spinner.tsx | 12+ across all pages | ✅ Unified |
| `TabNavigation` | ui/tab-navigation.tsx | Library, Codex pages | ✅ In Use |
| `SearchInput` | ui/search-input.tsx | Re-exported from list-components | ✅ Unified |

### Dead Code Removed

| File | Reason |
|------|--------|
| `ui/alert-enhanced.tsx` | Never imported anywhere |
| `ui/tabs.tsx` | Never used; TabNavigation is preferred |

### Semantic Color Decisions

Some `blue-*` colors are **intentionally preserved** as semantic colors:
- `blue-*` for Energy displays (power-creator, creature-creator)
- `blue-*` for Ally indicators in encounter-tracker
- These follow the design principle: "green for health, blue for energy"

### Local Component Variants (Acceptable)

| Component | Location | Reason |
|-----------|----------|--------|
| `CollapsibleSection` | feats-tab.tsx | Has specialized props (count, action, headerColor) |
| `FilterSection` | codex/filters/*.tsx | Context-specific filtering UI |
| `Loader2` (lucide) | Various buttons | Appropriate for inline button spinners |

---

## Files to Create

1. ~~`src/components/shared/roll-button.tsx`~~ ✅ Created
2. ~~`src/components/shared/point-status.tsx`~~ ✅ Created
3. `src/components/shared/skill-list.tsx` - Reusable skill list for sheet/creatures
4. `src/components/shared/ability-grid.tsx` - 6-ability display grid

## Files to Update

1. ~~`src/components/character-sheet/abilities-section.tsx`~~ ✅ Uses shared components
2. ~~`src/components/character-sheet/skills-section.tsx`~~ ✅ Uses shared components
3. ~~`src/components/creator/ability-score-editor.tsx`~~ ✅ Uses PointStatus
4. ~~`src/components/shared/list-components.tsx`~~ ✅ Fixed syntax error, re-exports SearchInput
5. ~~Multiple files for color token migration~~ ✅ Complete

## Files Removed

1. ~~`src/components/ui/alert-enhanced.tsx`~~ ✅ Deleted
2. ~~`src/components/ui/tabs.tsx`~~ ✅ Deleted
3. ~~Inline `SkillRollButton`~~ ✅ Replaced with shared RollButton
4. ~~Inline `RollButton`~~ ✅ Replaced with shared RollButton
5. ~~Inline `PointTracker`~~ ✅ Replaced with shared PointStatus

---

## Success Criteria

- [x] Same RollButton component used across character sheet abilities and skills
- [x] Same PointStatus component used in abilities-section, skills-section, and ability-score-editor
- [x] No hardcoded gray-* classes in non-auth components (all use semantic tokens)
- [x] Single loading state implementation (ui/spinner.tsx + LoadingState)
- [x] Consistent typography (Nova Flat for h1/h2 via CSS base styles, Nunito for rest)
- [x] Single SearchInput implementation (ui/search-input.tsx)
- [x] All stepper controls use consistent styling (ValueStepper → NumberStepper)
- [x] Documentation updated for component usage (see below)

---

## Component Usage Guidelines

### Expandable List Items

| Component | Location | Use Case |
|-----------|----------|----------|
| `GridListRow` | shared/list-components.tsx | **Main unified component** - Library/Codex lists with expand/collapse rows |
| `FeatCard` | character-sheet/feats-tab.tsx | Character sheet feat display with uses tracking |
| `SpeciesTraitCard` | codex/species-traits-section.tsx | Species trait display with specialized formatting |
| `PartCard` | Each creator page | Creator-specific part selection (each has unique fields like duration, cost, etc.) |

**When to choose:**
- Library/Codex browsing → `GridListRow`
- Character sheet feats → `FeatCard` (has uses tracking)
- Species traits → `SpeciesTraitCard` (has trait type badges)
- Creator part selection → Use the creator's own `PartCard` (context-specific fields)

### Tab Systems

| Component | Location | Use Case |
|-----------|----------|----------|
| `TabNavigation` | ui/tab-navigation.tsx | Page-level navigation (Library, Codex) - underline or pill variants |
| Inline tabs | library-section.tsx | Section tabs with count badges (specialized) |

### Loading States

| Component | Location | Use Case |
|-----------|----------|----------|
| `<Spinner />` | ui/spinner.tsx | Standalone loading indicator |
| `<LoadingState message="..." />` | ui/spinner.tsx | Full-page loading with centered spinner + message |
| `<LoadingOverlay />` | ui/spinner.tsx | Overlay on top of existing content |
| `Loader2` (lucide) | N/A | Inline button spinners (e.g., "Saving...") |

**Decision Tree:**
1. Full page loading? → `<LoadingState message="Loading..." />`
2. Overlay on content? → `<LoadingOverlay />`
3. Button with loading state? → `<Loader2 className="animate-spin" />`
4. Simple indicator? → `<Spinner />`

### Point Displays

| Component | Location | Use Case |
|-----------|----------|----------|
| `<PointStatus variant="inline" />` | shared/point-status.tsx | Compact inline display (e.g., "5/10 points") |
| `<PointStatus variant="block" />` | shared/point-status.tsx | Full block with label and calculation display |

### Roll Buttons

| Component | Location | Use Case |
|-----------|----------|----------|
| `<RollButton variant="primary" />` | shared/roll-button.tsx | Proficient ability/skill rolls (blue gradient) |
| `<RollButton variant="unproficient" />` | shared/roll-button.tsx | Unproficient rolls (gray, -2 penalty) |
| `<RollButton variant="defense" />` | shared/roll-button.tsx | Defense skill rolls |

### Search Inputs

| Component | Location | Use Case |
|-----------|----------|----------|
| `<SearchInput />` | ui/search-input.tsx | **Single source of truth** - All search functionality |

**Note:** `shared/list-components.tsx` re-exports `SearchInput` from `ui/search-input.tsx` for backward compatibility.

---

## Typography Reference

| Element | Font | Class |
|---------|------|-------|
| Page titles (h1) | Nova Flat | `.page-title` or default h1 styling |
| Section headers (h2) | Nova Flat | `.section-title` or default h2 styling |
| Card titles (h3+) | Nunito | Default h3/h4/h5/h6 styling |
| Body text | Nunito | Default (inherited) |
| Buttons | Nunito | `font-semibold` |
| Custom display text | Nova Flat | `.font-display` |---

*This document will be updated as unification progresses.*
