# Tooltip stack (Floating UI)

Onboarding map for contributors who worked on **PR #14 (`Collin-tooltipExperimentation`)** or the pre-merge Tippy stack.

## What happened in the merge (Jun 2026)

`master` combined **KadinBranch** (guided creator, static copy, shared primitives) with **Collin's Floating UI migration** (commit `286064c6`). Collin's engineering is **preserved**; the product wiring moved to a slightly different shape so copy ships in git instead of the `ui_tooltips` table.

| Collin PR #14 | Current location | Notes |
|---------------|------------------|-------|
| Inline Floating UI in `src/components/ui/tooltip.tsx` | `floating-help.tsx` + thin `tooltip.tsx` wrapper | Placement fallbacks, arrow, transitions, hover delays |
| `ContextHelpTooltip` + `useTooltipByKey` | `InfoTippy` + `public/tooltip-text.tsx` | Same UX; copy is TypeScript, not DB keys |
| `HelpTooltip` | `InfoTippy` (`size="icon"` default) | 44px touch target kept |
| `default-tooltips.ts` / `/api/tooltips` | **Removed** | Legacy DB keys → `tooltip-text` exports (table below) |
| Tippy.js / `@tippyjs/react` | **Removed** (TASK-392) | |

**Start here after a fresh pull:**

1. `src/lib/tooltips/floating-help.tsx` — shared panel + `getTooltipFallbackPlacements` (your placement order)
2. `src/components/patterns/help/info-tippy.tsx` — product help trigger (hover, focus, touch-hold, `safePolygon` for interactive lists)
3. `public/tooltip-text.tsx` — all help copy and level-aware helpers
4. `src/components/ui/tooltip.tsx` — generic demo/styleguide tooltip only (not for product help)

Full agent rules: `src/docs/ai/AGENT_GUIDE.md` § Floating UI & contextual help.

## Migrating a `ContextHelpTooltip` call site

**Before (PR #14):**

```tsx
<ContextHelpTooltip
  tooltipKey="characters.new.step.abilities.pointsHelp"
  scope="page:/characters/new"
  label="Ability point rules"
  context={{ level }}
/>
```

**After:**

```tsx
import { InfoTippy } from '@/components/patterns';
import { getAbilityPointsHelp } from '../../../../public/tooltip-text';

<InfoTippy
  content={getAbilityPointsHelp(level, rules)}
  label="Ability point rules"
  size="inline"
/>
```

**Word-tied label tips (no Info icon):** use `WordHelpTip` + `getAbilityHelp` / `getDefenseHelp` / `defenseScoreHelp` from `tooltip-text.tsx` (ability/defense names — TASK-547; sheet defense Score values — TASK-587). Name tip copy should name the term once (not “Acuity. Acuity…” — TASK-566). Score tips should keep the numeric value in `aria-label`. Same Floating UI engine as `InfoTippy`.

Removed DB keys (PR #14) map to `tooltip-text.tsx` exports:

| Old `tooltipKey` | Current export |
|------------------|----------------|
| `global.nav.library` | `navbarLibrary` |
| `global.nav.codex` | `navbarCodex` |
| `characters.new.step.abilities.pointsHelp` | `getAbilityPointsHelp` |
| `characters.new.step.archetype.pathHelp` | `createNewCharacter` |
| `characters.new.step.archetype.powerAbilityHelp` | `powerAbility` |
| `characters.new.step.archetype.martialAbilityHelp` | `martialAbility` |
| `characters.new.step.skills.pointsHelp` | `getSkillPointsHelp` |
| `characters.new.step.skills.subskillsHelp` | `subSkillsHelp` |
| `characters.new.step.archetype.ability.${ability}` | `getTooltipTextByPowerAbility` |

## Adding help on `SkillsAllocationPage`

Collin embedded help inside the shared page. We now pass addons from the parent so character vs creature copy can differ:

```tsx
<SkillsAllocationPage
  headingAddon={
    <InfoTippy content={getSkillPointsHelp(level, rules, 'creature')} label="Skill allocation help" size="inline" />
  }
  addSubSkillAddon={
    <InfoTippy content={subSkillsHelp} label="Sub-skill help" placement="top" size="inline" />
  }
  ...
/>
```

See `skills-step.tsx` (character) and `creature-creator/page.tsx` (creature).

## Interaction defaults (unchanged intent from PR #14)

| Setting | Value | Where |
|---------|-------|-------|
| Hover open delay | 100ms | `FloatingTooltip` in `tooltip.tsx` |
| Hover close delay | 0ms | same |
| Focus | `visibleOnly: false` | same |
| Max width | 320px | `FLOATING_HELP_MAX_WIDTH_PX` |
| Fallback placements | left→right→top→bottom, etc. | `getTooltipFallbackPlacements` |

`InfoTippy` adds touch-hold (~400ms) and `safePolygon` for panels with links/lists — product-only, not on the styleguide `Tooltip`.

## Do not reintroduce

- `ContextHelpTooltip`, `HelpTooltip`, `useTooltipByKey`, `useTooltips`
- Admin `/admin/tooltips` or `/api/tooltips`
- `ui_tooltips` table (dropped — `sql/drop-legacy-ui-tooltips-2026-06.sql`)

If you need editable copy without deploy, that is a **new product decision** — do not silently restore the old stack.
