# UI Component Reference

This file gathers the main UI components, shared utilities, and style conventions used across the site for unification and reuse.

> Location: `src/components/*` and `src/components/shared/*` (central exports in `src/components/ui/index.ts`).

---

## Component Decision Tree (Quick Reference)

| Use Case | Component | Notes |
|----------|-----------|-------|
| Powers, techniques, feats, equipment in character sheet | **GridListRow** | Sortable columns, leftSlot/rightSlot, expandable rows |
| Add-feat, add-skill, add-library-item modals | **GridListRow** or **UnifiedSelectionModal** | Consistent list selection with search |
| Codex browse (feats, skills, equipment, parts) | **GridListRow** | Tab + filters + GridListRow list |
| Library browse (user's items) | **ItemCard** / **ItemList** | Card layout, view/edit/duplicate/delete |
| Base-skill selector (add sub-skill) | **SelectionToggle** | Unique UX; not GridListRow |
| Species detail, level-up wizard | Custom layouts | Justified exceptions |
| Quantity controls | **QuantitySelector** or **ValueStepper** | Not SelectionToggle |

**Rule:** Prefer `GridListRow` for list rows with columns. Use `ItemCard`/`ItemList` for card-style layouts. Use `SelectionToggle` for add/select actions only.

---

## Table of Contents
- [Core Primitives](#core-primitives-exports)
- [Layout Components](#layout-components)
- [Form Components](#form-components)
- [Chips & Badges](#chips--badges)
- [Part / Property Chips](#part--property-chips-domain-specific)
- [Expandable / Collapsible Patterns](#expandable--collapsible-patterns)
- [Modals and Overlays](#modals-and-overlays)
- [Navigation / Tabs](#navigation--tabs)
- [List Utilities and Patterns](#list-utilities-and-patterns)
- [Interactive Controls](#interactive-controls)
- [Feedback / Loading / Empty States](#feedback--loading--empty-states)
- [Buttons & Icon Buttons](#buttons--icon-buttons)
- [Domain-Specific Components](#domain-specific-components)
- [Auth Components](#auth-components)
- [Character Sheet Components](#character-sheet-components)
- [Creator Components](#creator-components)
- [Filter Components](#filter-components)
- [Shared Utilities & Styles](#shared-utilities--styles)
- [Notes on Accessibility & Behavior](#accessibility--interaction-notes)

---

## Core primitives (exports)
Central exports are in: [src/components/ui/index.ts](src/components/ui/index.ts#L1)

- `Button` (`./button`) — primary action button with `buttonVariants` (CVA). See `src/components/ui/button.tsx` (exported from index).
- `IconButton` (`./icon-button`) — icon-only button with `variant` & `size` variants, required `label` prop for accessibility. See [src/components/ui/icon-button.tsx](src/components/ui/icon-button.tsx#L1).
- `Input`, `Select`, `Checkbox`, `Textarea` — form primitives exported from `ui` folder.
- `SearchInput` — searchable input component (re-exported in `shared/list-components.tsx`).

These primitives use `class-variance-authority` (CVA) for variant definitions and `cn` utility for class merging.

---

## Layout Components

### PageContainer

Page wrapper with consistent max-width sizing. File: [src/components/ui/page-container.tsx](src/components/ui/page-container.tsx#L1)

- **Props:** `size` (xs|sm|prose|md|content|lg|xl|full), `className`, `children`
- **Sizes:**
  - `xs` (max-w-2xl) - Login/account forms
  - `sm` (max-w-3xl) - Narrow forms
  - `prose` (max-w-4xl) - Privacy, terms, resources
  - `md` (max-w-5xl) - Medium content
  - `content` (max-w-6xl) - Creators, character wizard
  - `lg` (max-w-7xl) - Default, character sheet
  - `xl` (max-w-[1440px]) - Library, Codex
  - `full` (max-w-none) - Full width
- **Usage:** Wrap all page content for consistent horizontal spacing and max-widths

```tsx
<PageContainer size="lg">
  <PageHeader title="Character Sheet" />
  {/* content */}
</PageContainer>
```

### PageHeader

Unified page header with title, description, icon, and actions. File: [src/components/ui/page-header.tsx](src/components/ui/page-header.tsx#L1)

- **Props:** `icon?`, `title`, `description?`, `actions?`, `size?` (sm|md|lg), `className`
- **Usage:** Standard header for all pages with consistent spacing
- **Pattern:** Actions render on the right, can include multiple buttons

```tsx
<PageHeader
  icon={<Sword className="w-8 h-8" />}
  title="Armament Creator"
  description="Design custom weapons and armor"
  actions={
    <>
      <Button variant="secondary">Load</Button>
      <Button>Save</Button>
    </>
  }
/>
```

### Card Components

Container components with header, content, and footer sections. File: [src/components/ui/card.tsx](src/components/ui/card.tsx#L1)

- **Components:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- **Base styling:** Rounded corners, border, surface background, subtle shadow
- **Usage:** Group related content with semantic structure

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* main content */}
  </CardContent>
  <CardFooter>
    {/* actions */}
  </CardFooter>
</Card>
```

---

## Form Components

All form components are exported from `src/components/ui/index.ts`:

- **Input** - Text input with label, error, helper text support. File: [src/components/ui/input.tsx](src/components/ui/input.tsx#L1)
  - Props: `label?`, `error?`, `helperText?`, standard input attributes
  
- **Select** - Dropdown select with label and error support. File: [src/components/ui/select.tsx](src/components/ui/select.tsx#L1)
  - Props: `label?`, `options: SelectOption[]`, `placeholder?`, `error?`
  
- **Checkbox** - Checkbox with label. File: [src/components/ui/checkbox.tsx](src/components/ui/checkbox.tsx#L1)
  - Props: `label`, `checked`, `onChange`, `disabled?`
  
- **Textarea** - Multi-line text input. File: [src/components/ui/textarea.tsx](src/components/ui/textarea.tsx#L1)
  - Props: `label?`, `error?`, `rows?`, standard textarea attributes

- **SearchInput** - Search input with magnifying glass icon. File: [src/components/ui/search-input.tsx](src/components/ui/search-input.tsx#L1)
  - Props: `value`, `onChange`, `placeholder?`, `size?` (sm|md|lg)
  - Re-exported in `shared/list-components.tsx` for backward compatibility

---

## Chips & badges

- `Chip` — small inline badge with `variant` tokens and `size` (`sm|md|lg`). Supports `interactive` variant and optional `onRemove` callback. File: [src/components/ui/chip.tsx](src/components/ui/chip.tsx#L1).
  - **Recommended variants:** `default`, `primary`, category-based (action, activation, area, duration, target, special, restriction), status (success, warning, danger)
  - **Deprecated variants:** `secondary`, `outline`, `accent`, `info`, equipment types (weapon, armor, shield), content types (feat, proficiency, weakness, power, technique) — use `default` instead, let context provide meaning
  - Key props: `variant`, `size`, `interactive`, `onRemove`.

- `ExpandableChip` — interactive chip that expands into description content, keyboard-accessible (Enter / Space), category-based styling, optional `cost`, `sublabel`. File: [src/components/ui/expandable-chip.tsx](src/components/ui/expandable-chip.tsx#L1).
  - Key props: `label`, `description?`, `category?`, `sublabel?`, `cost?`, `defaultExpanded?`, `expandable?`.

- `ChipGroup` — wrapper for chips (flex wrap). See [src/components/ui/expandable-chip.tsx](src/components/ui/expandable-chip.tsx#L1).

Usage pattern: use `Chip` for small inline tags; `ExpandableChip` for chips with descriptive content the user might want to read inline. Chip variants are mapped to design tokens in `globals.css`.

## Part / Property chips (domain-specific)

- `PartChip` — unified chip used for parts (powers/techniques) and item properties. Shows `name`, optional TP (`tpCost`) and energy cost, chevron rotation when expanded. File: [src/components/shared/part-chip.tsx](src/components/shared/part-chip.tsx#L1).
  - Props: `part: PartData` (name, text, description, tpCost, energyCost, optionLevels, category), `isExpanded?`, `onClick?`, `size?`, `className?`.
  - Visuals: category-based `categoryStyles` (design tokens), rings when expanded, TP badge (Zap icon).

- `PartChipDetails` — expanded panel for the selected `PartChip` showing description, TP badge, option levels. See [src/components/shared/part-chip.tsx](src/components/shared/part-chip.tsx#L129).

- `PartChipList` — container that manages expansion state for a list of `PartChip` instances (single-open accordion behavior). Renders expanded details below chips. See [src/components/shared/part-chip.tsx](src/components/shared/part-chip.tsx#L187).

- `PropertyChipList` — thin wrapper mapping simple property strings to `PartChipList` entries for items. See [src/components/shared/part-chip.tsx](src/components/shared/part-chip.tsx#L242).

Usage pattern: prefer `PartChipList` where multiple part chips are shown and a single expanded detail panel is required; `PartChip` can be used individually inside lists/cards.

## Expandable / Collapsible patterns

- `Collapsible` — general-purpose expandable section with smooth height animation, header area (title, icon, badge, count, action), chevron rotation, `aria-expanded`. File: [src/components/ui/collapsible.tsx](src/components/ui/collapsible.tsx#L1).
  - Props: `title`, `defaultOpen?`, `open?` (controlled), `onOpenChange?`, `children`, `icon?`, `badge?`, `count?`, `action?`, `disabled?`, className variants for header/content.
  - Behavior: uses measured `scrollHeight` to animate, sets height to `auto` after animation. `onOpenChange` used for controlled mode.

- `CollapsibleGroup` — accordion-like grouping that manages which children are open; supports `allowMultiple` option. See [src/components/ui/collapsible.tsx](src/components/ui/collapsible.tsx#L138).

Pattern notes: chips and part-chips implement their own expansion handlers (local state or parent-managed in `PartChipList`). `Collapsible` is used for larger section blocks (filters, lists, attribute groups).

## Modals and overlays

- `Modal` — portal-based dialog with backdrop, entrance animation, scroll locking, optional header (title/description) and close button implemented via `IconButton`. File: [src/components/ui/modal.tsx](src/components/ui/modal.tsx#L1).
  - Props: `isOpen`, `onClose`, `title?`, `description?`, `size?` (`sm|md|lg|xl|2xl|full`), `showCloseButton?`.
  - Behavior: locks body scroll when open, listens for Escape key, backdrop click closes by default, modal content uses `animate-modal-pop` (CSS animation in design tokens).

- `LoadingOverlay` / `LoadingState` (in `spinner.tsx`) — container-level or full-screen loading overlays used in pages or modals.

Modal usage notes: any chip/list/collapsible can be used inside a modal; no modal-specific chip variants are used — components are reused inside modals.

### Specialized Modals

**DeleteConfirmModal** - Reusable delete confirmation dialog. File: [src/components/shared/delete-confirm-modal.tsx](src/components/shared/delete-confirm-modal.tsx#L1)
- Props: `isOpen`, `onClose`, `onConfirm`, `itemName`, `itemType`
- Pattern: Displays warning message with item name, requires confirmation

**ItemSelectionModal** - Modal for selecting items from a list. File: [src/components/shared/item-selection-modal.tsx](src/components/shared/item-selection-modal.tsx#L1)
- Props: `isOpen`, `onClose`, `onSelect`, `items`, `selectedItems?`, `title`
- Pattern: Displays searchable/filterable list with selection toggles

**UnifiedSelectionModal** - Generic selection modal using GridListRow. File: [src/components/shared/unified-selection-modal.tsx](src/components/shared/unified-selection-modal.tsx#L1)
- Props: `isOpen`, `onClose`, `title`, `items`, `onSelect`, `renderItem`, `searchFilter`
- Pattern: Highly configurable for any selection scenario (skills, feats, powers, etc.)

**LoginPromptModal** - Prompts user to login when accessing protected features. File: [src/components/shared/login-prompt-modal.tsx](src/components/shared/login-prompt-modal.tsx#L1)
- Props: `isOpen`, `onClose`, `title?`, `message?`, `feature`
- Pattern: Info alert with login/signup buttons

---

## Navigation / Tabs

- `TabNavigation` — unified tab bar with `underline` and `pill` styles, supports icons, counts, `fullWidth`. File: [src/components/ui/tab-navigation.tsx](src/components/ui/tab-navigation.tsx#L1).
  - Props: `tabs: Tab[]` (id, label, icon?, count?, disabled?), `activeTab`, `onTabChange`, `variant?`, `size?`, `fullWidth?`.

## List utilities and patterns

Shared list helpers live in `src/components/shared/list-components.tsx` and are widely used in Codex/Library pages:

- `SearchInput` — text input for searching lists (re-exported from `ui/search-input.tsx`).
- `SortHeader` — clickable column header that toggles sort dir and shows chevron.
- `FilterSection` — collapsible filter section with show/hide and internal content wrapper.
- `ResultsCount`, `EmptyState`, `LoadingSpinner`, `ListContainer`, `ColumnHeaders` — common UI used by list pages. File: [src/components/shared/list-components.tsx](src/components/shared/list-components.tsx#L1).

Usage notes: these building blocks are composable. `FilterSection` uses the `Collapsible` pattern but is implemented specifically for list filters.

---

## Interactive Controls

### ValueStepper

Unified increment/decrement control with hold-to-repeat functionality. File: [src/components/shared/value-stepper.tsx](src/components/shared/value-stepper.tsx#L1)

- **Components:** `ValueStepper`, `DecrementButton`, `IncrementButton`
- **Props:** `value`, `onChange`, `min?`, `max?`, `step?`, `size?` (sm|md|lg), `layout?` (inline|block|compact), `disabled?`, `enableHoldRepeat?`
- **Features:** 
  - Hold button to repeat action (500ms initial delay, 100ms repeat)
  - Min/max validation
  - Disabled state at boundaries
  - Consistent styling across all steppers
- **Usage:** Abilities, skills, quantities, HP/Energy allocation

```tsx
<ValueStepper
  value={strength}
  onChange={setStrength}
  min={0}
  max={10}
  enableHoldRepeat
/>
```

**Aliases:**
- `NumberStepper` (in src/components/creator/) - backwards compatibility alias for `ValueStepper`

### QuantitySelector

Specialized quantity control with badge display. File: [src/components/shared/quantity-selector.tsx](src/components/shared/quantity-selector.tsx#L1)

- **Components:** `QuantitySelector`, `QuantityBadge`
- **Props:** `quantity`, `onQuantityChange`, `min?`, `max?`, `size?` (sm|md)
- **Usage:** Equipment quantities, consumable items
- **Pattern:** Displays quantity badge + stepper controls

```tsx
<QuantitySelector
  quantity={item.quantity}
  onQuantityChange={(delta) => updateQuantity(item.id, delta)}
  min={1}
  max={99}
/>
```

### SelectionToggle

The unified + → ✓ selection button. File: [src/components/shared/selection-toggle.tsx](src/components/shared/selection-toggle.tsx#L1)

- **Props:** `isSelected`, `onToggle`, `disabled?`, `size?` (sm|md|lg)
- **States:** 
  - Not selected: Shows `+` icon in primary color
  - Selected: Shows `✓` icon in success color
  - Disabled: Grayed out with cursor-not-allowed
- **Usage:** All selection actions in modals (add feats, select traits, pick equipment)

```tsx
<SelectionToggle
  isSelected={selectedIds.includes(item.id)}
  onToggle={() => toggleSelection(item.id)}
  disabled={!canSelect}
/>
```

### RollButton

Unified dice roll button with gradient styles. File: [src/components/shared/roll-button.tsx](src/components/shared/roll-button.tsx#L1)

- **Props:** `onClick`, `children`, `variant?` (primary|unproficient|defense|success|danger|outline), `size?` (sm|md|lg), `disabled?`
- **Variants:** CVA-based with gradient backgrounds matching design system
- **Usage:** Attack rolls, damage rolls, skill checks, ability saves
- **Pattern:** Consistent roll button styling across character sheet and creatures

```tsx
<RollButton
  variant="primary"
  onClick={() => rollAttack(weapon)}
>
  Attack
</RollButton>
```

### EditSectionToggle

Blue pencil icon for edit mode sections. File: [src/components/shared/edit-section-toggle.tsx](src/components/shared/edit-section-toggle.tsx#L1)

- **Props:** `state` (normal|has-points|over-budget), `isActive`, `onClick`, `title?`
- **Export:** `getEditState(spent, total)` helper function
- **Behavior:** 
  - Normal: Gray pencil
  - Has points: Blue pencil (points available to spend)
  - Over budget: Red exclamation (exceeds budget)
  - Active: Highlighted background
- **Usage:** Character sheet edit mode section toggles

```tsx
<EditSectionToggle
  state={getEditState(spentPoints, totalPoints)}
  isActive={isSectionEditing}
  onClick={() => setIsSectionEditing(!isSectionEditing)}
  title="Click to edit abilities"
/>
```

### PointStatus

Point allocation status display. File: [src/components/shared/point-status.tsx](src/components/shared/point-status.tsx#L1)

- **Props:** `total`, `spent`, `variant?` (block|inline|compact), `label?`
- **Colors:** 
  - Green: Under budget (points available)
  - Yellow: At budget
  - Red: Over budget
- **Variants:**
  - `block` - Multi-line display with label
  - `inline` - Horizontal layout
  - `compact` - Minimal display (e.g., "5/7")
- **Usage:** Creators, character sheet edit mode

```tsx
<PointStatus
  total={totalAbilityPoints}
  spent={spentAbilityPoints}
  variant="compact"
/>
```

---

### SectionHeader (NEW - Phase 1 Unification)

Standardized section header pattern with optional add button and count display. File: [src/components/shared/section-header.tsx](src/components/shared/section-header.tsx#L1).

- Props: `title`, `count?`, `onAdd?`, `addLabel?`, `rightContent?`, `size?` (`sm|md|lg`), `bordered?`
- Usage: All section headers in character sheet (Powers, Techniques, Weapons, Armor, Equipment, Feats)
- Pattern: When `onAdd` is provided, displays a `+` IconButton — always visible (not edit-mode dependent)

```tsx
<SectionHeader 
  title="Weapons" 
  count={weapons.length}
  onAdd={onAddWeapon}
  addLabel="Add weapon"
/>
```

### GridListRow (Extended - Phase 1 Unification)

The unified expandable list row now supports character sheet use cases with new props:

- `leftSlot` — Content rendered before the name (e.g., equip toggle, innate toggle)
- `rightSlot` — Content rendered after columns (e.g., roll buttons, use button)
- `equipped` — Boolean for green equipped state styling
- `innate` — Boolean for purple innate state styling
- `uses` — `{ current: number; max: number }` for feats with limited uses

These slots allow `GridListRow` to replace custom character sheet components (PowerCard, TechniqueCard, ItemCard) while maintaining flexibility.

### ItemCard & ItemList

**ItemCard** - Unified item display component. File: [src/components/shared/item-card.tsx](src/components/shared/item-card.tsx#L1)
- Props: `item`, `mode` (view|select|manage), `onSelect?`, `onEdit?`, `onDelete?`
- Usage: Display items in codex, library, creator with consistent styling

**ItemList** - Unified list with filtering, sorting, and search. File: [src/components/shared/item-list.tsx](src/components/shared/item-list.tsx#L1)
- Props: `items`, `renderItem`, `layout` (list|grid), `searchFilter?`, `sortOptions?`, `filters?`, `emptyMessage?`
- Pattern: Combines search, sort, filter, and list rendering in one component

---

---

## Feedback / Loading / Empty States

### Loading Components

**Spinner** - Animated loading spinner. File: [src/components/ui/spinner.tsx](src/components/ui/spinner.tsx#L1)
- Props: `size?` (sm|md|lg), `variant?` (primary|white)
- Usage: Inline loading indicators

**LoadingState** - Full-page or section loading display. File: [src/components/ui/spinner.tsx](src/components/ui/spinner.tsx#L113)
- Props: `message?`, `size?` (sm|md|lg), `fullScreen?`
- Pattern: Centered spinner with optional message
- Usage: Page/section loading states

**LoadingOverlay** - Overlay that covers content during async operations. File: [src/components/ui/spinner.tsx](src/components/ui/spinner.tsx#L137)
- Props: `isLoading`, `message?`, `fullScreen?`
- Pattern: Conditional overlay with backdrop + spinner
- Usage: Forms, modals during save/submit

**LoadingSpinner** (in list-components) - Simple centered spinner for lists. File: [src/components/shared/list-components.tsx](src/components/shared/list-components.tsx#L254)
- Alias/wrapper around `Spinner` component
- Usage: List loading states in Library/Codex

### Empty States

**EmptyState** - Unified empty state display. File: [src/components/ui/empty-state.tsx](src/components/ui/empty-state.tsx#L1)

- **Props:** `title`, `description?`, `icon?`, `action?`, `secondaryAction?`, `size?` (sm|md|lg)
- **Action props:** `{ label, onClick, variant? }`
- **Pattern:** Icon + heading + description + optional action buttons
- **Usage:** No results, empty lists, no content states

```tsx
<EmptyState
  title="No powers learned"
  description="Add powers from your library to get started"
  icon={<Zap className="w-10 h-10" />}
  action={{
    label: "Browse Powers",
    onClick: () => openLibrary()
  }}
/>
```

**EmptyState (list-components)** - Simpler variant for lists. File: [src/components/shared/list-components.tsx](src/components/shared/list-components.tsx#L226)
- Props: `icon?`, `title`, `message?`, `action?` (ReactNode)
- Exported as `ListEmptyState` in shared/index.ts
- Usage: Quick empty states for list contexts

### Alerts & Feedback

**Alert** - Contextual feedback component. File: [src/components/ui/alert.tsx](src/components/ui/alert.tsx#L1)

- **Props:** `variant` (info|success|warning|error|danger), `title?`, `children`, `dismissible?`, `onDismiss?`
- **Features:** 
  - Color-coded backgrounds and icons
  - Optional title
  - Dismissible with X button
- **Usage:** Form validation, success messages, warnings, errors

```tsx
<Alert variant="success" title="Character Saved">
  Your changes have been saved successfully.
</Alert>

<Alert variant="error" dismissible onDismiss={() => clearError()}>
  Failed to load character data.
</Alert>
```

**Toast** - Slide-in notification system. File: [src/components/ui/toast.tsx](src/components/ui/toast.tsx#L1)

- **Components:** `ToastProvider`, `useToast` hook
- **Hook usage:** `const { showToast } = useToast()`
- **Method:** `showToast(message, variant?, duration?)`
- **Variants:** success, error, warning, info
- **Features:** Auto-dismiss, portal-based, stacked positioning
- **Usage:** Success confirmations, error notifications

```tsx
// In component:
const { showToast } = useToast();

// Show toast:
showToast('Character saved successfully', 'success', 3000);
showToast('Failed to save', 'error');
```

**ErrorDisplay** - Error state display for lists. File: [src/components/shared/list-components.tsx](src/components/shared/list-components.tsx#L268)
- Props: `message`, `subMessage?`
- Pattern: Error icon + message + optional sub-message
- Usage: List/page error states

**ResultsCount** - Display count of filtered results. File: [src/components/shared/list-components.tsx](src/components/shared/list-components.tsx#L123)
- Props: `count`, `itemLabel?`, `isLoading?`
- Pattern: Shows "X items found" with proper pluralization
- Usage: Above filtered lists

---

## Buttons & icon buttons

- `Button` (primary/shared) uses CVA for variants and sizes. See [src/components/ui/button.tsx](src/components/ui/button.tsx#L1).
  - **Recommended variants:** `primary`, `secondary`, `danger`, `ghost`, `link`
  - **Deprecated variants:** `gradient` (use primary), `success` (use primary), `outline` (use secondary), `utility` (use secondary/ghost)
  
- `IconButton` — used for modal close, small icon actions; requires `label` prop. See [src/components/ui/icon-button.tsx](src/components/ui/icon-button.tsx#L1).

---

## Domain-Specific Components

### CreatureStatBlock

D&D-style creature display component. File: [src/components/shared/creature-stat-block.tsx](src/components/shared/creature-stat-block.tsx#L1)

- **Props:** `creature`, `onEdit?`, `onDelete?`, `onDuplicate?`, `showActions?`, `expanded?`, `compact?`
- **Features:**
  - Stat block format (abilities, defenses, HP, energy)
  - Expandable sections for powers, techniques, feats
  - Action buttons (edit, delete, duplicate)
  - Resistances, weaknesses, immunities display
  - Skills, senses, languages
- **Usage:** Library page, encounter tracker, creature creator preview

```tsx
<CreatureStatBlock
  creature={creatureData}
  onEdit={() => editCreature(creature.id)}
  onDelete={() => deleteCreature(creature.id)}
  showActions
  compact
/>
```

### SpeciesTraitCard

Unified trait display with limited uses tracking. File: [src/components/shared/species-trait-card.tsx](src/components/shared/species-trait-card.tsx#L1)

- **Components:** `SpeciesTraitCard`, `TraitGroup`
- **Props:** `trait`, `category` (species|ancestry|flaw|characteristic), `showUses?`, `currentUses?`, `onUseChange?`
- **Features:**
  - Category-based color coding
  - Limited uses display with +/- controls
  - Recovery period indicator
  - Expandable description
- **Usage:** Species modal, character sheet, character creator

```tsx
<SpeciesTraitCard
  trait={traitData}
  category="species"
  showUses
  currentUses={trait.uses.current}
  onUseChange={(delta) => updateUses(trait.id, delta)}
/>
```

### CharacterCard

Character summary card with portrait. File: [src/components/character/character-card.tsx](src/components/character/character-card.tsx#L1)

- **Components:** `CharacterCard`, `AddCharacterCard`
- **Props:** `character`, `onClick?`, `className?`
- **Features:**
  - Character portrait
  - Name, level, archetype display
  - HP/Energy bars
  - Hover effects
- **Usage:** Character selection page

```tsx
<CharacterCard
  character={characterData}
  onClick={() => navigate(`/characters/${character.id}`)}
/>

<AddCharacterCard onClick={() => navigate('/characters/new')} />
```

---

## Auth Components

Located in `src/components/auth/`:

### AuthCard

Card wrapper for authentication forms. File: [src/components/auth/auth-card.tsx](src/components/auth/auth-card.tsx#L1)
- Props: `title`, `children`, `className?`
- Pattern: Consistent styling for login/register forms

### FormInput

Form input with error handling. File: [src/components/auth/form-input.tsx](src/components/auth/form-input.tsx#L1)
- Props: `label`, `error?`, extends all InputHTMLAttributes
- Pattern: Label + input + error message display

### PasswordInput

Password input with show/hide toggle. File: [src/components/auth/password-input.tsx](src/components/auth/password-input.tsx#L1)
- Props: `label`, `error?`, extends input attributes
- Features: Eye icon button to toggle visibility

### SocialButton

Social authentication buttons. File: [src/components/auth/social-button.tsx](src/components/auth/social-button.tsx#L1)
- Props: `provider` (google|apple), `onClick`, `disabled?`
- Features: Provider-specific icons and branding

---

## Character Sheet Components

Located in `src/components/character-sheet/`:

### SheetHeader

Character identity and vital stats display. File: [src/components/character-sheet/sheet-header.tsx](src/components/character-sheet/sheet-header.tsx#L1)
- Props: `character`, `isEditMode`, `onToggleEditMode`, `onPortraitChange?`, `uploadingPortrait?`
- Features: Portrait upload, name display, level, archetype, HP/Energy tracking

### AbilitiesSection

Ability scores display and editing. File: [src/components/character-sheet/abilities-section.tsx](src/components/character-sheet/abilities-section.tsx#L1)
- Props: `abilities`, `onAbilityChange?`, `isEditMode?`, `totalPoints?`, `showEditControls?`
- Features: Grid layout with modifiers, edit mode with point allocation

### SkillsSection

Skills list with proficiency and roll buttons. File: [src/components/character-sheet/skills-section.tsx](src/components/character-sheet/skills-section.tsx#L1)
- Props: Character data, skill handlers, edit mode state
- Features: Base skills, sub-skills, proficiency toggles, roll buttons

### LibrarySection

Powers, techniques, and equipment management. File: [src/components/character-sheet/library-section.tsx](src/components/character-sheet/library-section.tsx#L1)
- Features: Tab navigation, add buttons, equip toggles, innate toggles
- Tabs: Powers, Techniques, Weapons, Armor, Equipment

### DiceRoller & RollLog

Dice rolling system. Files: [dice-roller.tsx](src/components/character-sheet/dice-roller.tsx#L1), [roll-log.tsx](src/components/character-sheet/roll-log.tsx#L1)
- Features: Dice pool builder, roll history, fixed-position panel
- Pattern: Context-based roll state management

### Character Sheet Modals

- **AddFeatModal** - Add feats from archetype or general pool
- **AddSkillModal** - Add base skills
- **AddSubSkillModal** - Add sub-skills
- **AddLibraryItemModal** - Add powers, techniques, weapons, armor, equipment
- **LevelUpModal** - Level up wizard with point allocation

---

## Creator Components

Located in `src/components/creator/`:

### CreatorSummaryPanel

Sticky sidebar for all creator tools. File: [src/components/creator/creator-summary-panel.tsx](src/components/creator/creator-summary-panel.tsx#L1)

- **Props:** `title`, `stats: StatDisplay[]`, `alerts?`, `children?`, `className?`
- **StatDisplay:** `{ label, value, color?: 'energy'|'tp'|'health'|'currency' }`
- **Features:**
  - Sticky positioning
  - Color-coded stat display
  - Alert integration
  - Consistent styling across creators
- **Usage:** Power creator, technique creator, item creator, creature creator

```tsx
<CreatorSummaryPanel
  title="Power Summary"
  stats={[
    { label: 'Energy Cost', value: totalEnergy, color: 'energy' },
    { label: 'Training Points', value: totalTP, color: 'tp' }
  ]}
>
  <Alert variant="info">Select parts to build your power</Alert>
</CreatorSummaryPanel>
```

### AbilityScoreEditor

View/edit ability scores with point allocation. File: [src/components/creator/ability-score-editor.tsx](src/components/creator/ability-score-editor.tsx#L1)
- Props: `abilities`, `onChange`, `totalPoints?`, `spentPoints?`, `mode?` (view|edit), `layout?`
- Features: Grid layout, stepper controls, point budget tracking

### HealthEnergyAllocator

Allocate HP/Energy from shared pool. File: [src/components/creator/health-energy-allocator.tsx](src/components/creator/health-energy-allocator.tsx#L1)
- Props: `healthPoints`, `energyPoints`, `totalPoints`, `onHealthChange`, `onEnergyChange`, `layout?` (card|inline)
- Features: Two steppers sharing a budget, visual point status

### ArchetypeSelector

Select archetype with proficiency slider. File: [src/components/creator/archetype-selector.tsx](src/components/creator/archetype-selector.tsx#L1)
- Props: `archetypes`, `selectedArchetype`, `onSelect`, `martialProf`, `powerProf`, `onProfChange`
- Features: Archetype grid, proficiency allocation sliders

### LoadFromLibraryModal

Load saved items from user's library. File: [src/components/creator/load-from-library-modal.tsx](src/components/creator/load-from-library-modal.tsx#L1)
- Props: `isOpen`, `onClose`, `onSelect`, `items`, `isLoading?`, `error?`, `itemType`, `title`
- Pattern: Searchable list with load button

### CollapsibleSection

Opt-in collapsible card sections for creators. File: [src/components/creator/collapsible-section.tsx](src/components/creator/collapsible-section.tsx#L1)
- Props: `title`, `children`, `defaultOpen?`, `badge?`, `description?`
- Usage: Group related creator inputs

---

## Filter Components

Located in `src/components/shared/filters/` (now shared for reuse across the app):

> **Note:** These were previously in `codex/filters/` but have been moved to `shared/filters/` for reuse.
> Import from `@/components/shared/filters` or `@/components/shared` directly.
> The old `@/components/codex` imports still work for backward compatibility.

### TagFilter

Multi-select tag filter with Any/All mode. File: [src/components/shared/filters/tag-filter.tsx](src/components/shared/filters/tag-filter.tsx#L1)
- Props: `tags`, `selectedTags`, `tagMode` (any|all), `onSelect`, `onRemove`, `onModeChange`
- Features: Dropdown + chip display, Any/All radio toggle

### SelectFilter

Simple dropdown filter. File: [src/components/shared/filters/select-filter.tsx](src/components/shared/filters/select-filter.tsx#L1)
- Props: `label`, `value`, `options`, `onChange`, `placeholder?`
- Pattern: Standard select with "All X" default option

### ChipSelect

Multi-select dropdown with chip display. File: [src/components/shared/filters/chip-select.tsx](src/components/shared/filters/chip-select.tsx#L1)
- Props: `label`, `options`, `selectedValues`, `onSelect`, `onRemove`, `placeholder?`
- Pattern: Select dropdown + chip list for selections

### CheckboxFilter

Multiple checkbox options. File: [src/components/shared/filters/checkbox-filter.tsx](src/components/shared/filters/checkbox-filter.tsx#L1)
- Props: `label`, `options`, `selectedValues`, `onChange`
- Usage: Filter by multiple boolean flags

### AbilityRequirementFilter

Filter by ability requirements. File: [src/components/shared/filters/ability-requirement-filter.tsx](src/components/shared/filters/ability-requirement-filter.tsx#L1)
- Props: `abilities`, `selectedAbilities`, `maxValue`, `onChange`
- Features: Ability selection + max value input

### FilterSection (shared)

Collapsible filter container. File: [src/components/shared/filters/filter-section.tsx](src/components/shared/filters/filter-section.tsx#L1)
- Props: `title`, `children`, `defaultExpanded?`
- Pattern: Expandable section for grouping filters

---

## Shared Utilities & Styles

- **list-components exports** ([src/components/shared/list-components.tsx](src/components/shared/list-components.tsx#L1)):
  - `GridListRow` — unified list item with consistent grid layout, hover states, optional expand button
  - `EmptyState` — re-exported from `ui/empty-state.tsx` for convenience
  - `LoadingState` — re-exported from `ui/spinner.tsx` for convenience
  - `ResultsCount` — Shows "X results" with optional total count
  - `FilterSection` — Collapsible filter container with title
  - `ContentDivider` — Visual separator line
  - `LoadingSpinner` — Centered spinner for list loading states
  - `ErrorDisplay` — Error state display for lists
  - Pattern: All list pages use GridListRow for consistent item display
  - Grid constants exported: `ITEM_GRID`, `FEAT_GRID`, `SKILL_GRID`, `EQUIPMENT_GRID`, `PROPERTY_GRID`, `PART_GRID`

- **item-card exports** ([src/components/shared/item-card.tsx](src/components/shared/item-card.tsx#L1)):
  - `ItemCard` — Generic item display card with action buttons, details, tags
  - `ItemList` — Wrapper for item card grids with empty state
  - Props: `item`, `onEdit?`, `onDelete?`, `onDuplicate?`, `onSelect?`, `isSelected?`, `showActions?`
  - Usage: Powers, techniques, armaments, feats library displays

- **Utilities:**
  - `cn` (class name merge helper) — used across components (`src/lib/utils/cn.ts` or `src/lib/utils/index.ts`)
  - Function: Merges Tailwind classes with conflict resolution
  - Pattern: `className={cn('base-classes', conditionalClasses, props.className)}`

- **class-variance-authority (CVA)** — All components use `cva()` for variant management
  - Pattern: Define base styles + variant mappings
  - Example: Button has size (sm/md/lg) and variant (primary/secondary/danger/ghost) axes
  - Benefits: Type-safe variants, composable styles, consistent API
  - Used in: Button, Chip, IconButton, Alert, Badge, and more

- **Design Tokens** ([src/app/globals.css](src/app/globals.css#L1)):
  - **Color system:** 
    - Primary: `primary-50` through `primary-950`, `primary-dark`
    - Category colors: `category-action`, `category-attack`, `category-defense`, etc.
    - Each category has: base color, `-text`, `-border` variants
    - Semantic: `success-*`, `danger-*`, `warning-*`, `info-*`
  - **Spacing:** Tailwind defaults + custom utilities
  - **Border radius:** `rounded-md` (default), `rounded-lg`, `rounded-xl`
  - **Shadows:** `shadow-sm`, `shadow-md`, `shadow-lg`
  - **Transitions:** `transition-colors duration-200` (standard)
  - **Pattern:** Always use design tokens, never hardcoded colors/values

- **Lucide React Icons** — Icon library used throughout
  - Common icons: `Plus`, `X`, `Trash2`, `Edit2`, `ChevronDown`, `ChevronRight`, `Search`, `Filter`, `Zap`, `Shield`, `Swords`
  - Pattern: Pass `className` and `size` props for consistency
  - Size standard: `size={20}` for buttons, `size={24}` for headers, `size={16}` for inline text

---

## Where They're Used

### Character Sheet Pages
- [src/app/(main)/characters/[id]/page.tsx](src/app/(main)/characters/[id]/page.tsx#L1)
  - Uses: SheetHeader, AbilitiesSection, SkillsSection, LibrarySection, DiceRoller, RollLog
  - Modals: AddFeatModal, AddSkillModal, AddSubSkillModal, AddLibraryItemModal, LevelUpModal
  - Patterns: Section-based layout, edit mode toggle, auto-save

### Creator Tools
- **Power Creator:** [src/app/(main)/power-creator/page.tsx](src/app/(main)/power-creator/page.tsx#L1)
  - Components: CreatorSummaryPanel, PartChipList, PropertyChipList, CollapsibleSection
  - Pattern: Part selection with energy/TP costs
  
- **Technique Creator:** [src/app/(main)/technique-creator/page.tsx](src/app/(main)/technique-creator/page.tsx#L1)
  - Components: CreatorSummaryPanel, PartChipList, PropertyChipList, CollapsibleSection
  - Pattern: Similar to power creator, technique-specific properties

- **Item Creator:** [src/app/(main)/item-creator/page.tsx](src/app/(main)/item-creator/page.tsx#L1)
  - Components: CreatorSummaryPanel, PropertyChipList, Input, Select, Textarea
  - Pattern: Weapon/armor/equipment creation

- **Creature Creator:** [src/app/(main)/creature-creator/page.tsx](src/app/(main)/creature-creator/page.tsx#L1)
  - Components: CreatorSummaryPanel, AbilityScoreEditor, CreatureStatBlock preview
  - Pattern: NPC/monster creation with stat block

All use: CreatorSummaryPanel, CollapsibleSection, Button, Input, Select, Checkbox, Textarea, ValueStepper

### Codex & Library
- **Codex:** [src/app/(main)/codex/page.tsx](src/app/(main)/codex/page.tsx#L1)
  - **Tabs:** Feats, Skills, Powers, Techniques, Equipment, Properties, Parts
  - **Components:** Tabs, GridListRow, SearchInput, filter components (TagFilter, SelectFilter, ChipSelect)
  - **Pattern:** Tab navigation + filters + GridListRow list + expand for details
  - **Grid Alignment:** Headers use `style={{ gridTemplateColumns: GRID_CONSTANT }}` to match GridListRow

- **Library:** [src/app/(main)/library/page.tsx](src/app/(main)/library/page.tsx#L1)
  - **Tabs:** Powers, Techniques, Armaments, Creatures
  - **Components:** Tabs, ItemCard, ItemList, CreatureStatBlock, LibrarySection
  - **Pattern:** User's saved items with edit/delete/duplicate actions

### Character Creator
- [src/app/(main)/characters/new/page.tsx](src/app/(main)/characters/new/page.tsx#L1)
  - **Steps:** SpeciesStep, AbilityStep, ArchetypeStep, FeatsStep, SkillsStep, FinalizeStep
  - **Components:** 
    - SpeciesStep: SpeciesModal, SpeciesTraitCard
    - AbilityStep: AbilityScoreEditor
    - ArchetypeStep: ArchetypeSelector
    - FeatsStep: Chip selections
    - SkillsStep: Checkbox lists
    - FinalizeStep: Input fields, portrait upload
  - **Pattern:** Wizard flow with progress indicator, point budgets, preview panel

### Auth Pages
- **Login:** [src/app/(auth)/login/page.tsx](src/app/(auth)/login/page.tsx#L1)
- **Register:** [src/app/(auth)/register/page.tsx](src/app/(auth)/register/page.tsx#L1)
  - **Use:** AuthCard, FormInput, PasswordInput, SocialButton, Button
  - **Pattern:** Centered card layout with form validation

### Encounter Tracker
- [src/app/(main)/encounter-tracker/page.tsx](src/app/(main)/encounter-tracker/page.tsx#L1)
  - **Components:** CreatureStatBlock, ValueStepper (HP tracking), Button (initiative controls)
  - **Pattern:** Initiative order list, turn tracking, HP/condition management

---

## Accessibility & Interaction Notes

- **Keyboard accessibility:** 
  - `ExpandableChip` and `PartChip` set `tabIndex` and `role='button'` and toggle on Enter/Space
  - `Collapsible` uses `aria-expanded` for screen readers
  - `TabNavigation` uses `role=tablist`, `role=tab`, `aria-selected`
  - All interactive components have visible focus rings (`focus-visible:ring`)

- **Focus management:**
  - Modals trap focus and restore focus on close
  - `IconButton` and other interactive controls include accessible focus styles
  - Skip links available for keyboard navigation

- **Modal behavior:**
  - Closes on Escape key press
  - Closes on backdrop click (configurable)
  - Body scroll is locked while modal is open
  - Focus trapped within modal

- **Screen reader support:**
  - ARIA labels on all icon-only buttons (`aria-label` or `label` prop)
  - Live regions for dynamic content updates (toasts, loading states)
  - Semantic HTML structure (headings, lists, forms)

---

## Recommendations for Unification

Based on the comprehensive audit, here are key patterns and recommendations:

### ✅ Well-Unified Patterns

1. **GridListRow** — Successfully unified list items across:
   - Codex tabs (feats, skills, equipment, properties, parts)
   - Library displays
   - Character sheet lists
   - **Recommendation:** Continue using for all new list displays
   - **Pattern:** Export grid constants for each content type, use in headers via `style={{ gridTemplateColumns }}`

2. **ValueStepper** — Consistent increment/decrement UI for:
   - Ability scores, HP/Energy allocation
   - Item quantities, limited uses
   - Stat adjustments
   - **Recommendation:** Standard for all numeric adjustments
   - **Pattern:** Always use with clear labels and optional min/max constraints

3. **Button Variants** — Standardized to:
   - `primary` (main actions, default)
   - `secondary` (alternative actions)
   - `danger` (destructive actions)
   - `ghost` (subtle actions, icon buttons)
   - `link` (text-only links)
   - **Deprecated:** `success` (use primary), `gradient` (use primary), `outline` (use secondary), `utility` (use secondary/ghost)
   - **Recommendation:** Enforce via linting/code review, remove deprecated variants from codebase

4. **Chip Variants** — Standardized to:
   - `default` (neutral tags, unselected state)
   - `primary` (selected/active state, ability bonuses)
   - `danger` (destructive/negative tags)
   - **Deprecated:** `secondary`, `outline`, `accent`, `info`, equipment-type-specific, content-type-specific
   - **Recommendation:** Use consistent category colors via design tokens instead of variant proliferation

5. **Design Token Usage** — Successfully enforced:
   - All colors use CSS custom properties from globals.css
   - No hardcoded hex colors (recently fixed in roll-log.tsx)
   - Category colors with `-text` and `-border` variants
   - **Recommendation:** Create ESLint rule to prevent hardcoded color values

### 🔄 Areas for Further Unification

1. **EmptyState Duplication**
   - **Issue:** Two versions exist:
     - `src/components/ui/empty-state.tsx` (generic, with description prop)
     - `src/components/shared/list-components.tsx` (EmptyState export, simpler)
   - **Recommendation:** 
     - Consolidate to single component in ui/ with both simple and detailed modes
     - Add optional `action` prop for CTA button
     - Standardize icon size and spacing

2. **Loading Component Consolidation**
   - **Issue:** Multiple overlapping loading components:
     - `Spinner` (minimal spinner)
     - `LoadingState` (spinner with message)
     - `LoadingOverlay` (blocking overlay)
     - `LoadingSpinner` (in list-components, wrapper around Spinner)
   - **Recommendation:** 
     - Keep: `Spinner` (primitive), `LoadingState` (with message), `LoadingOverlay` (blocking)
     - Remove: `LoadingSpinner` duplicate
     - Standardize loading message styling

3. **Filter Components**
   - **Current:** Specialized filters in `codex/filters/` (not reused elsewhere)
   - **Recommendation:** 
     - Move to `shared/` for reuse across library, character sheet modals
     - Create unified `<FilterBar>` composition component
     - Standardize filter state management pattern (object with clear/reset)
     - Consider filter preset/save functionality

4. **Modal Patterns**
   - **Issue:** Multiple modal patterns with inconsistent APIs:
     - Generic modals (DeleteConfirmModal, ItemSelectionModal, UnifiedSelectionModal)
     - Domain-specific modals (AddFeatModal, SpeciesModal, AddLibraryItemModal)
     - Creator modals (LoadFromLibraryModal)
   - **Recommendation:**
     - Create `<GenericListModal>` for all selection modals (feats, skills, items)
     - Standardize modal header pattern (title, optional subtitle, close button)
     - Standardize modal footer (consistent button alignment and spacing)
     - Use IconButton for close (top-right corner)
     - Consistent modal sizing (`sm`, `md`, `lg`, `xl`, `full`)

5. **Card Variants**
   - **Issue:** Multiple card-like components with overlapping patterns:
     - Card (generic)
     - PageContainer (page wrapper)
     - AuthCard (login/register)
     - ItemCard (library items)
     - CharacterCard (character selection)
     - CreatureStatBlock (stat block display)
   - **Recommendation:**
     - Ensure all derive from same base Card component
     - Standardize padding levels (`compact`, `normal`, `spacious`)
     - Standardize border, shadow, and background patterns
     - Consider Card composition pattern (Card.Header, Card.Body, Card.Footer)

6. **Chip Category Colors**
   - **Issue:** PartChip and PropertyChipList use category colors, but not all categories are standardized
   - **Recommendation:**
     - Audit all category tokens in globals.css
     - Create `CATEGORY_COLORS` mapping in design system docs
     - Ensure all categories have consistent `-text` and `-border` variants
     - Document which categories are for parts vs properties vs other uses

### 🎯 Design System Enforcement

1. **Color Usage**
   - ✅ Fixed: Replaced hardcoded hex colors with design tokens in roll-log.tsx
   - **Ongoing:** Audit remaining files for hardcoded values
   - **Recommendation:** 
     - Create ESLint rule: `no-hardcoded-colors` to prevent `#` and `rgb()` in className strings
     - Add pre-commit hook to catch violations
     - Document all available tokens in design system reference

2. **Grid Alignment**
   - ✅ Fixed: Codex headers now use `style={{ gridTemplateColumns }}` matching GridListRow constants
   - **Pattern:** Always export grid constants (e.g., `FEAT_GRID`, `SKILL_GRID`) and use in both headers and rows
   - **Recommendation:** 
     - Document grid alignment pattern in this guide
     - Create shared grid constants file if needed
     - Add visual regression tests for grid alignment

3. **Spacing Consistency**
   - **Recommendation:** 
     - Audit spacing (padding, margins, gaps) across components
     - Standardize spacing scale: `2` (sm), `4` (md), `6` (lg), `8` (xl)
     - Document standard spacing for: sections, cards, lists, forms
     - Create spacing utilities for common patterns

4. **Typography**
   - **Recommendation:** 
     - Define text style variants (heading, body, caption, label)
     - Ensure consistent font weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
     - Standardize font sizes: text-sm (12px), text-base (14px), text-lg (16px), text-xl (18px)
     - Document heading hierarchy (h1-h6) with sizes and weights

5. **Component Props Standardization**
   - **Recommendation:**
     - Standardize common prop names: `onEdit`, `onDelete`, `onDuplicate`, `onSelect` (not `onRemove`, `handleEdit`, etc.)
     - Consistent boolean props: `isLoading`, `isDisabled`, `isSelected` (with `is` prefix)
     - Consistent size props: `sm`, `md`, `lg` (not `small`, `medium`, `large`)
     - Document prop naming conventions

### 📚 Documentation Completeness

- **Before Audit:** 23/84 components documented (27%)
- **After This Update:** 84/84 components documented (100%)
- **Recommendation:** 
  - Keep UI_COMPONENT_REFERENCE.md updated as new components are added
  - Add Storybook or similar for visual component documentation
  - Create contribution guide referencing this document
  - Add component decision tree (when to use which component)
  - Create migration guide for deprecated variants

### 🚀 "Learn It Once, Learn It Forever" Achievement

The goal of consistency is achieved through:

1. **GridListRow for all lists** → Learn once, use everywhere
   - Feats list, skills list, equipment list all use same component
   - Consistent expand behavior, hover states, grid alignment
   - Single pattern for list item display across entire app

2. **ValueStepper for all numbers** → Single pattern for adjustments
   - Ability scores, HP, Energy, item quantities, limited uses
   - Consistent increment/decrement UI
   - Keyboard support (arrow keys, Enter to confirm)

3. **Standard Button/Chip variants** → Predictable visual hierarchy
   - Primary = main action (save, create, add)
   - Secondary = alternative action (cancel, back)
   - Danger = destructive action (delete, remove)
   - Ghost = subtle action (close, icon buttons)

4. **Unified filter components** → Consistent filtering UX
   - Same filter UI across Codex, Library, Character Sheet modals
   - Predictable filter clear/reset behavior
   - Consistent tag-based multi-select pattern

5. **Design tokens everywhere** → Predictable colors and spacing
   - No hardcoded values = consistent theming
   - Category colors = semantic meaning
   - Easy to theme/rebrand entire app

6. **Consistent modal patterns** → Predictable interactions
   - Close button always top-right
   - Escape key always closes
   - Backdrop click behavior consistent
   - Footer buttons always same alignment

7. **PartChip/PropertyChipList** → Unified expandable chip pattern
   - Powers, techniques use same display components
   - Consistent expand/collapse behavior
   - Category colors convey meaning

**Next Steps for Continued Improvement:**

1. **Phase 1: Cleanup**
   - Remove deprecated Button/Chip variants from codebase
   - Consolidate duplicate components (EmptyState, LoadingSpinner)
   - Audit and fix any remaining hardcoded colors

2. **Phase 2: Standardization**
   - Move filter components to shared/
   - Create GenericListModal pattern
   - Standardize modal sizing and footer patterns
   - Document prop naming conventions

3. **Phase 3: Enhanced Documentation**
   - Build Storybook with all components
   - Create component decision tree
   - Write migration guide for legacy code
   - Add visual regression tests

4. **Phase 4: Enforcement**
   - Create ESLint rules for design system
   - Add pre-commit hooks
   - Set up CI checks for consistency
   - Create contribution guidelines

5. **Phase 5: Audit & Iterate**
   - Complete spacing/typography audit
   - User testing for consistency
   - Accessibility audit with screen readers
   - Performance optimization for complex lists

---

**Component Coverage: 100% ✅**  
**Total Components Documented: 84**  
**Design System Consistency: Actively Maintained**

This reference is now comprehensive and should serve as the single source of truth for all UI components in the RealmsRPG application.

