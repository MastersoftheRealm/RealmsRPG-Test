# Accessibility (RealmsRPG)

We target **WCAG 2.1 Level AA** for contrast, focus, labels, headings, and images. This doc summarizes requirements so AI agents and developers keep new UI accessible.

## Quick rules

| Area | Requirement |
|------|-------------|
| **Contrast** | Normal text ≥ 4.5:1, large text ≥ 3:1. Use semantic tokens (`text-text-primary`, `text-text-secondary`). **Status / archetype body text:** `text-success-fg`, `text-danger-fg`, `text-warning-fg`, `text-info-fg`, `text-power-fg`, `text-martial-fg` (theme-aware; do not pair a numbered ramp with `dark:`). See DESIGN_SYSTEM.md and "Dark mode contrast" below. |
| **Buttons** | Every button has discernable text. Icon-only buttons **must** have `aria-label` (e.g. "Show password", "Clear history"). |
| **Form controls** | Every `<select>` and meaningful `<input>` has an accessible name: `<label htmlFor="id">` + `id` on control, or `aria-label`. For spreadsheet-style or unlabeled contexts, use `aria-label` (e.g. "Edit [column], row [n]"). |
| **Headings** | Levels increase by at most one (no h1 → h3). Page title = h1; first section = h2; subsections = h3. In wizards, step title = h2; section titles within step = h3. SectionHeader renders h2; GridListRow / ExpandableChip section labels render h3; EmptyState title renders h2. |
| **Modals** | Use `Modal` with `title` (and optional `description`). If using custom header with no visible title, set `titleA11y` for screen readers. |
| **Touch targets** | Coarse pointer uses the Primary (48) / Standard (44) / Dense (32 painted + 44 expanded hit) tiers in `MOBILE_UX.md` (ADR-0023). Fine pointer stays compact. Owner feedback is desktop-first unless labeled `mobile feedback:`. |
| **Images** | Decorative or when the same info is visible as text (e.g. dice "d4" next to image), use `alt=""`. Otherwise use descriptive `alt`. |

## Tooling

- **ESLint:** `eslint-config-next` enables `eslint-plugin-jsx-a11y`. Run `npm run lint` and fix reported a11y issues.
- **Cursor/Agents:** `.cursor/rules/realms-accessibility.mdc` is applied when editing UI; follow its checklist before merging.

## References

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
- Vercel accessibility audit (2026-02-23): fixes tracked in TASK-267 and `ALL_FEEDBACK_CLEAN.md` §6b.

## Dark mode contrast (site-wide patterns)

Use these patterns so elements meet WCAG 2.1 AA in **both light and dark** themes:

- **Status text (success, danger, warning, info):** Use `text-success-fg`, `text-danger-fg`, `text-warning-fg`, `text-info-fg`. Do not write `text-success-700 dark:text-success-400` (or the same pair for other statuses) — the `*-fg` token already has the correct value in both themes.
- **Power / Martial archetype body text:** Use `text-power-fg` and `text-martial-fg` (not `text-power` / `text-martial`, and not `text-power-dark` / `text-martial-dark`). Keep `text-power` / `text-martial` only for large headings or badges with sufficient contrast. `power-dark` / `martial-dark` remain CSS ramp internals.
- **Secondary / muted text:** Use `text-text-secondary` for secondary copy. Use `text-text-muted` **alone** — do not add `dark:text-text-secondary` (same dark hex; see DESIGN_SYSTEM.md § "Muted vs secondary text").
- **List/table column values:** Prefer `text-text-primary` for column content (e.g. category, value) when `text-text-secondary` fails contrast on the row background; or ensure row background and text pair passes.
- **Icon-only buttons** on dark UI (e.g. roll log MOD +/-): avoid `bg-white/10` only; add `dark:bg-white/20 dark:hover:bg-white/35`. Keep icon `text-white` or use a token that contrasts on the button.
- **Form inputs** (HP/EN, etc.): Use `bg-surface dark:bg-surface-alt` so the field is visible in dark mode. Every `<input>` and `<select>` must have an accessible name (`label` + `id`/`htmlFor` or `aria-label`).
- **Modals:** Use `Modal` from `@/components/ui/modal`. Provide `title` (and optional `description`) for the dialog; if using a custom header with no visible title, pass `titleA11y` so screen readers get an accessible name.
- **Touch targets:** Assign a tier from `MOBILE_UX.md` / ADR-0023. Coarse-pointer Standard is 44×44; Dense keeps a small painted box and expands the hit area (`.hit-area-dense` height-first, `.hit-area-dense-square` for icon-only, `.hit-area-layout-neutral` for 16px paint). Fine pointer stays compact (WCAG 2.1 AA does not require 44px).
- **Primary text in dark mode:** Prefer the design token `text-text-primary` (no override). In `globals.css`, `.dark` sets `--color-text-primary` for contrast; avoid ad-hoc overrides like `dark:text-neutral-300` unless the token is insufficient for a specific background.

## Console warnings from dependencies

These warnings can appear in production (e.g. Vercel) and are **not from our application code**:

- **Zustand:** `[DEPRECATED] Default export is deprecated. Instead use import { create } from 'zustand'`. Our stores use `import { create } from 'zustand'`; the warning comes from a dependency that still uses the default export. No change required in our code.
- **DialogContent / DialogTitle / Description:** Radix UI warns when `DialogContent` is used without a `DialogTitle` or without `Description`/`aria-describedby`. Our modals use the custom `Modal` component (`@/components/ui/modal`) with `role="dialog"`, `aria-labelledby`, `aria-describedby`, and optional `titleA11y`. The warning is emitted by a dependency that uses Radix Dialog, not by our Modal.
- **Range/selectNode InvalidNodeTypeError:** `Failed to execute 'selectNode' on 'Range': the given Node has no parent` can occur on mouseup when the selection’s anchor node has been detached (e.g. modal or list item unmounted between mousedown and mouseup). The stack points to a bundled chunk (e.g. 525.js from React/Next), not our source. We mitigate by running a **SelectionGuard** in the root layout: on mouseup (capture phase) we clear the selection if `document.getSelection().anchorNode` is not in the document, so no code runs against a detached node. See `src/components/layout/selection-guard.tsx`.
