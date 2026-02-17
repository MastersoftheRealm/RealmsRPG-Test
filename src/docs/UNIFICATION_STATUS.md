# Unification Status — Verified State

Verified against codebase Feb 2026. Goal: "Learn once, use forever" — consistent UI across Library, Codex, Character Sheet, Creators.

## Unified (Verified)

| Pattern | Status | Where used |
|---------|--------|------------|
| GridListRow | ✅ | Library, Codex, add-feat-modal, add-library-item-modal, add-skill-modal (shared), equipment-step, feats-tab, library-section, creature-creator |
| SkillRow | ✅ | skills-section, skills-step, creature-creator |
| Skill bonus formulas | ✅ | `formulas.ts`: calculateSkillBonusWithProficiency, calculateSubSkillBonusWithProficiency — used by character sheet, character creator, creature creator |
| AddSkillModal / AddSubSkillModal | ✅ | In `components/shared`; used by character sheet (CharacterSheetModals), character creator (SkillsAllocationPage) |
| ValueStepper | ✅ | abilities-section, sheet-header, health-energy-allocator, dice-roller, all creators, encounter-tracker |
| SectionHeader | ✅ | feats-tab, proficiencies-tab, notes-tab, archetype-section |
| RollButton | ✅ | abilities-section, skills-section, archetype-section, library-section |
| PointStatus | ✅ | abilities-section, skills-section, ability-score-editor |
| PageContainer/PageHeader | ✅ | All main pages, creators, static pages |
| SearchInput | ✅ | All modals, Codex, Library |
| Design tokens | ✅ | Most components use `bg-surface`, `text-text-primary`, `border-border-light`, etc. |

## Exceptions (Intentional)

- **Auth pages** — Use `gray-*` for dark theme; do not migrate to design tokens.
- **AddSubSkillModal** — Uses SelectionToggle (not GridListRow); unique base-skill selector UX.
- **Footer** — `bg-neutral-400` (intentional).
- **RollButton gradients** — Uses neutral tokens for metallic effect (intentional).

## Known Gaps

- **forgot-username** — Uses `gray-*` (light page; could migrate to tokens if desired).
- **item-creator RARITY_COLORS** — `bg-neutral-100` in creator-constants; acceptable.

## Reference Docs

- `ARCHITECTURE.md` — Data flow, Supabase/Prisma, enrichment, hooks/services.
- `GAME_RULES.md` — Skill caps, defense caps, progression rules.
- `DESIGN_SYSTEM.md` — Color tokens, component API, migration patterns.
- `UI_COMPONENT_REFERENCE.md` — Detailed component usage; includes component decision tree.
- `.cursor/rules/realms-unification.mdc` — Quick reference for agents.
