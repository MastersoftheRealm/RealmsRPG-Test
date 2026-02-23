# Accessibility (RealmsRPG)

We target **WCAG 2.1 Level AA** for contrast, focus, labels, headings, and images. This doc summarizes requirements so AI agents and developers keep new UI accessible.

## Quick rules

| Area | Requirement |
|------|-------------|
| **Contrast** | Normal text ≥ 4.5:1, large text ≥ 3:1. Use semantic tokens (`text-text-primary`, etc.) or ensure custom colors pass in both themes. |
| **Buttons** | Every button has discernable text. Icon-only buttons **must** have `aria-label` (e.g. "Show password", "Clear history"). |
| **Form controls** | Every `<select>` and meaningful `<input>` has an accessible name: `<label htmlFor="id">` + `id` on control, or `aria-label`. |
| **Headings** | Levels increase by at most one (no h1 → h3). Page title = h1; first section = h2; subsections = h3. SectionHeader renders h2; GridListRow/PartChip section labels render h3; EmptyState title renders h2. |
| **Images** | Decorative or when the same info is visible as text (e.g. dice "d4" next to image), use `alt=""`. Otherwise use descriptive `alt`. |

## Tooling

- **ESLint:** `eslint-config-next` enables `eslint-plugin-jsx-a11y`. Run `npm run lint` and fix reported a11y issues.
- **Cursor/Agents:** `.cursor/rules/realms-accessibility.mdc` is applied when editing UI; follow its checklist before merging.

## References

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
- Vercel accessibility audit (2026-02-23): fixes tracked in TASK-267 and `ALL_FEEDBACK_CLEAN.md` §6b.

## Dark mode contrast (site-wide patterns)

Use these patterns so elements meet WCAG 2.1 AA in both themes:

- **Icon-only buttons** on dark UI (e.g. roll log MOD +/-): avoid `bg-white/10 hover:bg-white/20` only; add `dark:bg-white/20 dark:hover:bg-white/35` so the button background has enough contrast; keep icon `text-white`.
- **Section / subsection titles** (SectionHeader, chip labels): if using `text-text-muted`, add `dark:text-text-secondary` so headings meet contrast on dark backgrounds.
- **Form inputs** (HP/EN, etc.): add `bg-surface dark:bg-surface-alt` so the input field is visible in dark mode.
- **Toast message text**: ensure toast type styles include dark text (e.g. `dark:text-success-300` for success) so message contrasts on dark toast background.
- **Primary / warning buttons** (solid, white text): ensure `.dark` in globals defines button background tokens so white text meets ≥4.5:1, or use component-level `dark:bg-*` overrides.
- **Bare spans / labels** in cards or panels: add `text-text-primary` or `text-text-secondary` where the parent background is dark or could change.
- **Range sliders**: ensure track/thumb have sufficient contrast in `.dark`.
