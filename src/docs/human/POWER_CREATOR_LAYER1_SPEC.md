# Power Creator - Layer 1 Spec (Owner)

> **Status:** `DRAFT` - not approved for implementation
> **Gate:** TASK-414 must be `done` before agents start TASK-408-413
> **Direction only:** REALMS_PRODUCT_OVERVIEW.md Section 5.11 (hypotheses, not contract)
> **Tooltips:** POWER_CREATOR_TOOLTIPS_DRAFT.md
> **Rules:** GAME_RULES.md (innate threshold, archetype)

**Owner approval:** When this spec is exact enough to build, change status to `APPROVED` and note date below.

```
APPROVED: (date) ___________
```

---

## Product goal (one paragraph)

What should a first-time user accomplish in guided power creation, and what must they *not* see on the first pass?

_Owner:_

---

## Entry and routes

| Decision | Options / notes | Owner choice |
|----------|-----------------|--------------|
| Entry chooser labels | Guided / Advanced / Custom / ... | |
| Guided route | e.g. `/power-creator/guided` | |
| Advanced route | e.g. `/power-creator/advanced` | |
| Default for landing CTA | Chooser vs guided directly | |

---

## Step list (exact order)

| # | Step name | Primary decision | Skip when? |
|---|-----------|------------------|------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

_Add rows until final. Use REALMS Appendix A per-step template for detail._

---

## Open questions (resolve before APPROVED)

- [ ] Audience first? Saved character vs generic Power / Powered-Martial + level?
- [ ] Guest flow? Complete guided, login only at save?
- [ ] Innate step - separate screen or toggle? When to show rules?
- [ ] Categories - which codex part categories as cards?
- [ ] Damage - separate step or folded into category/template?
- [ ] Templates - how many per category? Template vs blank default?
- [ ] Template source - which official_powers (name + id) per category?
- [ ] Customize in Advanced - what carries over?
- [ ] Preview panel - what updates live?
- [ ] Teaching - tooltips only v1, or tutorial/video?
- [ ] Success metric - e.g. save under 5 min without part option levels?

---

## Innate power rules (confirm UX when violated)

| Rule | L1 Power | L1 Powered-Martial | UX when violated |
|------|----------|-------------------|------------------|
| Max energy | 8 | 6 | |
| Actions | Basic, Reaction | Basic, Reaction | |
| Disallowed parts | Healing, energy gain | same | |

---

## Layer boundaries

| Layer | What user sees | Escape hatch |
|-------|----------------|--------------|
| L1 guided | | |
| L2 semi-guided | | |
| L3 advanced | Current full builder | |

---

## Out of scope for v1

Empowered guided; species/creature creators; item creator (separate spec).

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-01 | Created draft; implementation blocked until APPROVED |
