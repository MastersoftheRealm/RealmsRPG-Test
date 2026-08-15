# Design Intent

Short, durable constraints that are easy to lose in refactors. Prefer a one-line comment at the call site over another essay.

## Comment convention

```ts
// DESIGN_INTENT: Safari crashes if we measure layout during paint — defer to rAF.
```

Use when the “why” is non-obvious (browser bugs, intentional asymmetry, product policy that looks like a bug). Do **not** decorate every prop.

## Living index (add sparingly)

| Area | Intent | Where |
|------|--------|-------|
| Uploads | Multipart through `apiUpload` (eslint `realms/no-raw-upload-fetch`) | `@/lib/api-client` |
| New shared/ui files | Allowlist + ADR (CI `tasks:validate-shared-ui`) | `scripts/shared-ui-allowlist.json` |
| Theme status text | Prefer `*-fg` tokens over numbered ramp + `dark:` pairs | `DESIGN_SYSTEM.md` / constitution |
| Visual/a11y verify | Always serve production build; never reuse stray server | `guide/01-verification-and-ui-gates.md` |
| ListHeader in modals | Keep Codex/Library chrome — do not flatten with transparent overrides | `realms-unification.mdc` |
| Quantity selection | Quantity-first in-row stepper — not a side column that shoves the row | `guide/02-components-and-lists.md` |
| ± steppers | One chrome sitewide (guided skills bonus style via `ValueStepper` / Dec/Inc; `QuantitySelector` wraps it) | ADR-0002 · `DESIGN_SYSTEM.md` |
| Codex writes | Audit → SQL propose → owner approve before live mutate | `realms-codex-data.mdc` |
| ExpandableImage | Default for meaningful inline art; skip when nested in Link/button, edit-upload click, or decorative chrome | `guide/03-entity-card-art.md` § Adoption inventory |
| Site header nav | Inline links at `xl+` only; tighter gutters than `.layout-shell-wide`; no `overflow-x-clip` on `<header>` (clips menus) — page clip on `MainAppChrome` | `header.tsx` · `main-app-chrome.tsx` · `MOBILE_UX.md` |
| Sheet header DR / Critical Range | Prefer library-enriched armor (same as armor rows); play/edit hide either vital when armor does not modify it. Temp mode always shows both cards so a temp can be added. Formula is Evasion + 10 + (1 + op_1_lvl) | `sheet-header.tsx` · `calculateCriticalRange` · `getEquippedArmorQuickRef` · `QuickArmorTable` |
| Sheet Skills spend/temp | Do not add a fifth Value/Temp column in the narrow lg Skills panel — put the stepper in the Bonus cell (`editControlsPlacement="inline"`) and name the open state on the heading | `skills-section.tsx` · `skill-row.tsx` |
| SectionHeader size | Default `md` (`text-sm`) sitewide; character Library list subsections use explicit `lg` (`text-base`) + collapsible `pb-1.5` | `section-header.tsx` · `entity-library-sections.tsx` |

When you discover a hard-won constraint, add **one** row here and a `// DESIGN_INTENT:` at the code site.
