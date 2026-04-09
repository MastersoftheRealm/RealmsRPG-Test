# Tooltip Audit And Interaction Standard (2026-04-09)

## Current patterns found

- Native `title` attribute used widely (buttons, steppers, icon actions, labels).
- Inline hint text exists in some admin/editor forms (`hint` props or muted helper text).
- One onboarding modal exists at `src/components/shared/onboarding-tour.tsx`.
- No reusable tooltip primitive in `src/components/ui` before this implementation.

## Chosen standard

- Use shared `Tooltip` + `HelpTooltip` components for contextual guidance.
- Trigger behavior:
  - Desktop: `hover` + keyboard `focus`.
  - Mobile (`< md`): `tap/click` for `auto` trigger mode.
- Tooltip content source:
  - Primary: `public.ui_tooltips` (admin-editable).
  - Fallback: in-code defaults for critical keys so UX remains functional before DB seeding.
- Content format:
  - Markdown-lite (`**bold**`, `*italic*`, inline code, links, list lines).
  - Runtime interpolation for Core Rule values (`{{rules.*}}`) and safe computed helpers (`{{calc.*(...)}}`).
- Accessibility:
  - Tooltip trigger must be keyboard focusable and have an accessible name.
  - Tooltip content rendered with `role="tooltip"` and `aria-describedby`.
- Mobile:
  - Help icons use minimum touch target sizing (`--touch-target-min` fallback to 44px).

## Migration guidance

- Existing native `title` strings can remain as fallback for now.
- Replace high-value onboarding/help points first:
  1. Global navigation
  2. Character creation (Archetype, Abilities, Skills)
  3. Character sheet and creators
