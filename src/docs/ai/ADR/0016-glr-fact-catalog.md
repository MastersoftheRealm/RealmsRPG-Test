# ADR-0016: GLR fact catalog, density modes, and layout solver

- **Status:** Accepted
- **Date:** 2026-08-17
- **Deciders:** owner (plan ack) / agent (Architect)
- **Task:** TASK-806 (catalog + CI), TASK-807 (resolver drives list chrome), TASK-814 (demote overflow to chips), TASK-818 (path More details combat chips)
- **Supersedes:** [ADR-0009](0009-glr-required-facts-registry.md)

## Context

ADR-0009 copied required facts **per GLR surface**, including a static `column` / `chip` / `column-or-chip` placement. That caught drift in CI but duplicated the same game facts ~19 times and could not demote a column to a chip when a list was tighter. Owner direction: every applicable valued fact is accounted for **somewhere**; highest-purpose facts prefer columns; lower-priority facts become self-describing chips; per-surface placement lists should go away. Gear/Codex equipment is a closed set: Category, Currency, Rarity (plus pinned name/image).

## Decision

1. **Fact catalog** (`glr-fact-catalog.ts`) — one row per `GlrFactId` with entity membership, band (`primary` | `secondary` | `tertiary`), inclusion order, display order, column-key aliases, and chip matchers. Name and thumbnail are pinned identity, not facts. Parts/properties stay expandable chips, not ranked facts.
2. **Density modes** (`glr-density.ts`) — `browse` | `play` | `select` | `detail` plus a tiny flag set: `characterCreate` (omit feat `reqLevel`), `creatorBudget` (power TP via `rightSlot`), `mixedArmamentPhase` (shield Block may live in the Damage cell).
3. **Resolver** (`resolve-glr-fact-layout.ts`) — once per list, not per row: fill columns from primary → secondary → tertiary until the mode budget; remainder → chips; never both; never neither for applicable facts. Play/select `demoteFacts` skip the column fill so combat tracks stay dense, but those facts still join `chipFacts` (TASK-814). True omit is only `characterCreate` + feat `reqLevel`. Visual order uses `displayOrder`, not band rank. No `ResizeObserver` column stealing.
4. **Surface bindings** — CI pointers `{ entityType, mode, flags }`. New lists register a binding, not a custom fact table. Path More details power/technique catalogs (`DetailOptionList`) bind `detail-option-power` / `detail-option-technique` at detail density (column budget 0; all valued facts are chips).
5. **Mixed lists** use the intersection of kinds (Codex equipment → gear facts only). Filters/sort stay available even if a fact is currently a chip.

Formatting stays in `lib/detail-option/compact-facts.ts`. Chrome/spacing CI (`glr-chrome-spacing-norms.ts`) stays complementary.

Default bands (identity is pinned separately; owner may correct):

| Entity | Primary | Secondary | Tertiary |
|--------|---------|-----------|----------|
| Power | Energy, Action, Damage | Category, Duration, Range, Area | TP |
| Technique | Energy, Action, Weapon, Damage | Category, TP | — |
| Weapon | Damage, Range | Rarity, Currency, TP | — |
| Armor | DR, Crit + | Abl. Req., Agility Red., Rarity, Currency, TP | — |
| Shield | Block, Damage | Rarity, Currency, TP | — |
| Feat | Category, Ability | Uses, Recovery, Req. Level (`characterCreate` omits Req. Level) | — |
| Gear | Category, Currency, Rarity | TP | — |

## Consequences

- **Positive:** One SoT for “what must be visible”; Official / guided / USM / sheet chrome can share a resolved layout; gear cannot grow combat columns by accident. Mixed weapon+armor+shield USM lists are retired (**TASK-810**): Armament Load and creature Inventory pick per kind (sheet Add was already split). Codex/Admin equipment stays the closed gear column set (no combat columns).
- **Negative:** Mode budgets and a few order/key overrides still exist (play vs browse). That is smaller than 19 placement tables.
- **Rejected:** Per-surface `placement` enums (ADR-0009); generating columns inside `GridListRow`; live width-based column flicker; keeping a combined Stat column for mixed armaments.
