# Accessibility (RealmsRPG)

We target **WCAG 2.1 Level AA** for contrast, focus, labels, headings, and images. This doc summarizes requirements so AI agents and developers keep new UI accessible.

## Quick rules

| Area | Requirement |
|------|-------------|
| **Contrast** | Normal text ≥ 4.5:1, large text ≥ 3:1. Use semantic tokens (`text-text-primary`, `text-text-secondary`). **Status colors:** use `text-success-700` (not `-600`) in light mode; pair with `dark:text-success-400`. Power/martial body text: `text-power-dark`, `text-martial-dark`. See DESIGN_SYSTEM.md and "Dark mode contrast" below. |
| **Buttons** | Every button has discernable text. Icon-only buttons **must** have `aria-label` (e.g. "Show password", "Clear history"). |
| **Form controls** | Every `<select>` and meaningful `<input>` has an accessible name: `<label htmlFor="id">` + `id` on control, or `aria-label`. For spreadsheet-style or unlabeled contexts, use `aria-label` (e.g. "Edit [column], row [n]"). |
| **Headings** | Levels increase by at most one (no h1 → h3). Page title = h1; first section = h2; subsections = h3. In wizards, step title = h2; section titles within step = h3. SectionHeader renders h2; GridListRow/PartChip section labels render h3; EmptyState title renders h2. |
| **Modals** | Use `Modal` with `title` (and optional `description`). If using custom header with no visible title, set `titleA11y` for screen readers. |
| **Touch targets** | Minimum 44×44px for tappable controls (buttons, steppers, tab triggers, list row actions). See MOBILE_UX.md. |
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

- **Status text (success, info, danger):** In **light mode** use the **darker** token so contrast passes on white/light backgrounds: `text-success-700` (not `text-success-600`), `text-danger-700` where needed. In **dark mode** use the lighter variant: `dark:text-success-400`, `dark:text-info-400`, etc. Always pair: e.g. `text-success-700 dark:text-success-400`.
- **Power / Martial archetype body text:** Use `text-power-dark` and `text-martial-dark` (not `text-power` / `text-martial`) for body text and labels so they meet contrast in light mode. Keep `text-power` / `text-martial` only for large headings or badges with sufficient contrast.
- **Secondary / muted text:** Use `text-text-secondary` for secondary copy. When using `text-text-muted`, add `dark:text-text-secondary` so it meets contrast on dark backgrounds (e.g. section labels, descriptions).
- **List/table column values:** Prefer `text-text-primary` for column content (e.g. category, value) when `text-text-secondary` fails contrast on the row background; or ensure row background and text pair passes.
- **Icon-only buttons** on dark UI (e.g. roll log MOD +/-): avoid `bg-white/10` only; add `dark:bg-white/20 dark:hover:bg-white/35`. Keep icon `text-white` or use a token that contrasts on the button.
- **Form inputs** (HP/EN, etc.): Use `bg-surface dark:bg-surface-alt` so the field is visible in dark mode. Every `<input>` and `<select>` must have an accessible name (`label` + `id`/`htmlFor` or `aria-label`).
- **Modals:** Use `Modal` from `@/components/ui/modal`. Provide `title` (and optional `description`) for the dialog; if using a custom header with no visible title, pass `titleA11y` so screen readers get an accessible name.
- **Touch targets:** Interactive controls (buttons, steppers, tab triggers, row actions) must have a minimum **44×44px** tap area on touch devices. See `src/docs/MOBILE_UX.md`.
- **Primary text in dark mode:** Prefer the design token `text-text-primary` (no override). In `globals.css`, `.dark` sets `--color-text-primary` for contrast; avoid ad-hoc overrides like `dark:text-neutral-300` unless the token is insufficient for a specific background.

## Console warnings from dependencies

These warnings can appear in production (e.g. Vercel) and are **not from our application code**:

- **Zustand:** `[DEPRECATED] Default export is deprecated. Instead use import { create } from 'zustand'`. Our stores use `import { create } from 'zustand'`; the warning comes from a dependency that still uses the default export. No change required in our code.
- **DialogContent / DialogTitle / Description:** Radix UI warns when `DialogContent` is used without a `DialogTitle` or without `Description`/`aria-describedby`. Our modals use the custom `Modal` component (`@/components/ui/modal`) with `role="dialog"`, `aria-labelledby`, `aria-describedby`, and optional `titleA11y`. The warning is emitted by a dependency that uses Radix Dialog, not by our Modal.
- **Rules page (embedded doc):** `Uncaught ReferenceError: DOCS_timing is not defined` at `pub?embedded=true` comes from inside the embedded Google Document iframe. Our rules page loads that iframe; we cannot fix script errors in the external document. If the doc owner can edit the source, they should define or remove the `DOCS_timing` reference.
- **Range/selectNode InvalidNodeTypeError:** `Failed to execute 'selectNode' on 'Range': the given Node has no parent` can occur on mouseup when the selection’s anchor node has been detached (e.g. modal or list item unmounted between mousedown and mouseup). The stack points to a bundled chunk (e.g. 525.js from React/Next), not our source. We mitigate by running a **SelectionGuard** in the root layout: on mouseup (capture phase) we clear the selection if `document.getSelection().anchorNode` is not in the document, so no code runs against a detached node. See `src/components/layout/selection-guard.tsx`.
