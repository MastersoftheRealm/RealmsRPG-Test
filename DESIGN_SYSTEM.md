# RealmsRPG Design System

This document outlines the unified design system for RealmsRPG, based on the Figma mockup specifications and best practices for consistency across the entire application.

## Color Palette

### Primary Colors (Deep Blue)
The main brand color used for primary buttons, links, and key UI elements.

| Token | Value | Usage |
|-------|-------|-------|
| `primary-50` | #e8f1f8 | Hover backgrounds |
| `primary-100` | #c5dbee | Light backgrounds |
| `primary-200` | #9ec3e3 | Borders, dividers |
| `primary-300` | #77abd8 | Secondary elements |
| `primary-400` | #4f94cd | Interactive elements |
| `primary-500` | #1a6aa8 | Standard primary |
| `primary-600` | #0a4a7a | Buttons, links |
| `primary-700` | #053357 | **Main brand color** |
| `primary-800` | #042845 | Dark variants |
| `primary-900` | #091d2d | Darkest, backgrounds |

### Accent Colors (Gold/Bronze)
Warm accent colors for highlights and special elements.

| Token | Value | Usage |
|-------|-------|-------|
| `accent-gold` | #c79956 | Primary accent |
| `accent-bronze` | #d99735 | Secondary accent |
| `accent-chip` | #fef8f0 | Chip backgrounds |

### Utility Colors (Cool Blue)
Secondary blue shades for utility buttons and accents.

| Token | Value | Usage |
|-------|-------|-------|
| `utility-100` | #c3e8fb | Light backgrounds |
| `utility-300` | #4584b6 | Utility buttons |
| `utility-400` | #407cb6 | Hover states |

### Neutral Colors
Grays for text, borders, and backgrounds.

| Token | Value | Usage |
|-------|-------|-------|
| `text-primary` | #091d2d | Main body text |
| `text-secondary` | #41464a | Secondary text |
| `text-muted` | #707070 | Muted/disabled text |
| `text-on-dark` | #f9f9f9 | Text on dark backgrounds |
| `title` | #5a5645 | Title text |
| `border` | #707070 | Primary borders |
| `border-light` | #dad9d9 | Light borders |
| `divider` | #707070 | Section dividers |

### Status Colors
Semantic colors for success, danger, warning, and info states.

| Status | Main | Hover | Light | Dark |
|--------|------|-------|-------|------|
| Success | #059669 | #055745 | #d1fae5 | #055745 |
| Danger | #dc2626 | #b91c1c | #fee2e2 | #570705 |
| Warning | #f59e0b | #d97706 | #fef3c7 | - |
| Info | #3b82f6 | #2563eb | #dbeafe | - |

### Category Colors
Used for chips, badges, and content type indicators.

| Category | Background | Text | Border |
|----------|------------|------|--------|
| Action | `category-action` | Blue | Blue border |
| Activation | `category-activation` | Teal | Teal border |
| Area | `category-area` | Green | Green border |
| Duration | `category-duration` | Purple | Purple border |
| Target | `category-target` | Orange | Orange border |
| Special | `category-special` | Yellow | Yellow border |
| Restriction | `category-restriction` | Red | Red border |

---

## Component Classes

### Page Layout

```tsx
// Use PageContainer for consistent page layout
import { PageContainer, PageHeader } from '@/components/ui';

<PageContainer size="content"> {/* xs | sm | prose | md | content | lg | xl | full */}
  <PageHeader 
    title="Page Title"
    icon={<IconComponent className="w-8 h-8 text-primary-600" />} {/* Optional icon */}
    description="Optional description"
    actions={<Button>Action</Button>}
  />
  {/* Page content */}
</PageContainer>
```

**PageContainer Sizes:**
| Size | Max Width | Use Case |
|------|-----------|----------|
| `xs` | max-w-2xl | Login/account forms |
| `sm` | max-w-3xl | Narrow forms |
| `prose` | max-w-4xl | Privacy, terms, resources |
| `md` | max-w-5xl | Medium content |
| `content` | max-w-6xl | Creators, character wizard |
| `lg` | max-w-7xl | Default, character sheet |
| `xl` | max-w-[1440px] | Library, Codex |
| `full` | max-w-none | Full width |

CSS classes available:
- `.page-container` - Standard page container
- `.page-container-wide` - Wide container with more horizontal padding
- `.page-container-narrow` - Narrow container for focused content

### Buttons

```tsx
import { Button } from '@/components/ui';

// Variants
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Delete</Button>
<Button variant="success">Confirm</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="outline">Outline</Button>
<Button variant="utility">Utility</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>
<Button size="icon">🔍</Button>

// Loading state
<Button isLoading>Loading...</Button>
```

CSS classes available:
- `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`
- `.btn-outline`, `.btn-ghost`, `.btn-utility`, `.btn-icon`
- `.btn-stepper` - +/- stepper buttons

> **Note:** Navigation buttons (back/continue) now use the `<Button>` component with `variant="secondary"` for back and default for continue.

### Cards

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>
```

CSS classes available:
- `.card` - Base card styling
- `.card-padded` - Card with padding
- `.card-interactive` - Hoverable card
- `.card-selected` - Selected state
- `.selection-card` - Selection card variant

### Chips/Badges

```tsx
import { Chip } from '@/components/ui';

// Basic variants
<Chip variant="default">Default</Chip>
<Chip variant="primary">Primary</Chip>
<Chip variant="accent">Accent</Chip>

// Category variants
<Chip variant="action">Action</Chip>
<Chip variant="activation">Activation</Chip>
<Chip variant="area">Area</Chip>
<Chip variant="duration">Duration</Chip>

// Status variants
<Chip variant="success">Success</Chip>
<Chip variant="danger">Error</Chip>
<Chip variant="warning">Warning</Chip>
<Chip variant="info">Info</Chip>

// Removable
<Chip onRemove={() => {}}>Removable</Chip>

// Sizes
<Chip size="sm">Small</Chip>
<Chip size="md">Medium</Chip>
<Chip size="lg">Large</Chip>
```

CSS classes available:
- `.chip` - Base chip styling
- `.chip-action`, `.chip-activation`, etc. - Category variants
- `.chip-success`, `.chip-danger`, etc. - Status variants

### Tab Navigation

```tsx
import { TabNavigation } from '@/components/ui';

const tabs = [
  { id: 'powers', label: 'Powers', count: 5 },
  { id: 'techniques', label: 'Techniques', count: 3 },
  { id: 'equipment', label: 'Equipment' },
];

<TabNavigation
  tabs={tabs}
  activeTab="powers"
  onTabChange={(id) => setActiveTab(id)}
  variant="underline" // or "pill"
  size="md" // sm | md | lg
/>
```

CSS classes available:
- `.tab-nav`, `.tab-nav-list`, `.tab-nav-trigger`, `.tab-nav-trigger-active`
- `.tab-pill-list`, `.tab-pill-trigger`, `.tab-pill-trigger-active`
- `.creator-tab`, `.creator-tab--active`, `.creator-tab--completed`

### Form Inputs

```tsx
import { Input, SearchInput } from '@/components/ui';

<Input
  label="Username"
  placeholder="Enter username"
  error="This field is required"
  helperText="Your unique username"
/>

<SearchInput
  value={search}
  onChange={setSearch}
  placeholder="Search..."
  showClear
  size="md" // sm | md | lg
/>
```

CSS classes available:
- `.input-field` - Standard input styling
- `.search-input-wrapper`, `.search-input`, `.search-input-icon`

### Loading States

```tsx
import { Spinner, LoadingState, LoadingOverlay } from '@/components/ui/spinner';

// Simple spinner
<Spinner size="md" variant="primary" />

// Centered loading state
<LoadingState message="Loading data..." size="lg" />

// Full overlay
<LoadingOverlay isLoading={loading} message="Saving..." fullScreen />
```

CSS classes available:
- `.loading-spinner`, `.loading-spinner-sm`, `.loading-spinner-lg`
- `.skeleton`, `.skeleton-text`, `.skeleton-title`, `.skeleton-card`

### Alerts

```tsx
import { Alert } from '@/components/ui';

<Alert variant="success" title="Success!">
  Your changes have been saved.
</Alert>

<Alert variant="error" title="Error" dismissible onDismiss={() => {}}>
  Something went wrong.
</Alert>
```

CSS classes available:
- `.alert`, `.alert-error`, `.alert-success`, `.alert-warning`, `.alert-info`

### Empty States

```tsx
import { EmptyState } from '@/components/ui';
import { Search } from 'lucide-react';

<EmptyState
  icon={<Search className="w-10 h-10" />}
  title="No results found"
  description="Try adjusting your search or filters"
  action={{
    label: 'Clear filters',
    onClick: () => clearFilters(),
  }}
/>
```

### Modals

```tsx
import { Modal } from '@/components/ui';

<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Modal Title"
  description="Optional description"
  size="md" // sm | md | lg | xl | 2xl | full
>
  Modal content
</Modal>
```

---

## Typography

### Fonts
- **Body text**: Nunito (--font-sans)
- **Display/headers**: Nova Flat (--font-display)

### Text Colors
Use semantic color tokens for text:
- `text-text-primary` - Main body text
- `text-text-secondary` - Secondary text
- `text-text-muted` - Muted/disabled text
- `text-title` - Title/heading text
- `text-primary-foreground` - Text on primary backgrounds

---

## Spacing & Layout

### Container Sizes
| Size | Max Width | Usage |
|------|-----------|-------|
| sm | 768px | Focused content (forms, auth) |
| md | 1024px | Medium content |
| lg | 1280px | Standard pages |
| xl | 1440px | Wide layouts (header/footer) |
| full | none | Full width |

### Standard Padding
- Page container: `px-4 sm:px-6 lg:px-8 py-8`
- Cards: `p-6`
- Modal content: `p-6`

---

## Migration Guide

### Replacing Hardcoded Colors

| Old Pattern | New Pattern |
|-------------|-------------|
| `text-gray-900` | `text-text-primary` |
| `text-gray-600` | `text-text-secondary` |
| `text-gray-500` | `text-text-muted` |
| `bg-white` | `bg-surface` |
| `bg-gray-50` | `bg-surface-secondary` |
| `border-gray-200` | `border-border-light` |
| `border-gray-300` | `border-border` |
| `#053357` | `primary-700` |
| `#0a4a7a` | `primary-600` |
| `#707070` | `border` or `text-muted` |

### Replacing Inline Spinners

```tsx
// Old
<div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600" />

// New
import { Spinner } from '@/components/ui/spinner';
<Spinner size="lg" />

// Or use CSS class
<div className="loading-spinner loading-spinner-lg" />
```

### Using Page Components

```tsx
// Old
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <h1 className="text-3xl font-bold text-gray-900 mb-8">Page Title</h1>
  ...
</div>

// New
import { PageContainer, PageHeader } from '@/components/ui';

<PageContainer>
  <PageHeader title="Page Title" description="Optional description" />
  ...
</PageContainer>
```

---

## File Structure

```
src/
├── app/
│   └── globals.css          # Design system tokens & utility classes
├── components/
│   └── ui/
│       ├── alert.tsx         # Alert/feedback component
│       ├── button.tsx        # Button with variants
│       ├── card.tsx          # Card container
│       ├── chip.tsx          # Chip/badge component
│       ├── empty-state.tsx   # Empty state display
│       ├── input.tsx         # Form input
│       ├── modal.tsx         # Modal dialog
│       ├── page-container.tsx # Page layout wrapper
│       ├── page-header.tsx   # Page title section
│       ├── search-input.tsx  # Search input with icon
│       ├── spinner.tsx       # Loading spinners
│       ├── tab-navigation.tsx # Tab navigation
│       ├── tabs.tsx          # Tab content container
│       └── index.ts          # Component exports
└── lib/
    └── constants/
        └── colors.ts         # Category color mappings
```

---

## Best Practices

1. **Use semantic tokens** instead of hardcoded colors
2. **Import from `@/components/ui`** for all shared components
3. **Use CSS utility classes** from globals.css for consistent styling
4. **Prefer Lucide icons** over inline SVGs
5. **Use the design system colors** from the constants file for dynamic styling
6. **Follow the component patterns** established in this guide

---

## Color Palette Summary (Figma Reference)

| Role | Color | Token |
|------|-------|-------|
| Primary buttons | #053357 | `primary-700` |
| Text on dark | #F9F9F9 | `primary-foreground` |
| Paragraph text | #091D2D | `text-primary` |
| Borders/dividers | #707070 | `border` |
| Titles | #5A5645 | `title` |
| Utility buttons | #4584B6 | `utility-300` |
| Side sections | #302E33 | `surface-dark` |
| Gold accent | #C79956 | `accent-gold` |
| Bronze accent | #D99735 | `accent-bronze` |
| Deep red | #570705 | `danger-dark` |
| Deep green | #055745 | `success-dark` |
