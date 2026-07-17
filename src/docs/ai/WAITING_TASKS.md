# Waiting / Blocked / Human-owned AI Tasks

Not part of the agent session-start hot path. Agents may skim for dependencies, but **do not** load this file every session.

Move a task back to [`ACTIVE_TASKS.md`](ACTIVE_TASKS.md) when it becomes unblocked / unassigned to a human.

**Process:** [`AI_TASK_QUEUE.md`](AI_TASK_QUEUE.md)

---

- id: TASK-423
  title: Guided loadout path content — seed flat recommendations for remaining paths
  created_at: 2026-07-05
  created_by: agent
  priority: medium
  status: partial
  assignee: owner
  completed_work: |
    - Kit flatten applied 2026-07-15 (TASK-442): Berserker level1_loadouts NULL; weapons/armor/gear
      already in level1_armaments / level1_equipment.
  remaining_work: |
    - Author flat level1_armaments / level1_equipment (and armorStep / sharedEquipment as needed)
      for the other 11 archetype paths so guided L1 has path picks.
    - Optional: supersede sql/guided-berserker-loadout-fixes-proposed.sql (kit-era; no longer needed).
  description: |
    Owner content work: seed flat weapon/armor/gear recommendations for remaining paths
    (no quick kits). Kit column cleanup shipped with TASK-442.
  related_files:
    - sql/guided-remove-loadout-kits-proposed.sql
    - src/docs/SUPABASE_SCHEMA.md
  acceptance_criteria:
    - Live DB has no selectable kit arrays in level1_loadouts. (done)
    - Remaining martial/power paths that should offer L1 gear have flat recommendations authored.
    - DEV-V-013-T004 passes without Quick kits UI.
  notes: |
    Codex writes require owner approval. Frontend kit UI removed in TASK-442.

---

---

- id: TASK-353
  title: Enable Supabase leaked-password protection (HIBP)
  priority: medium
  status: not-started
  created_at: 2026-06-13
  parent_task: TASK-326
  assignee: human
  notes: "**Human-only — AI skip.** DEVELOPER_TASK_QUEUE DEV-001."

---

- id: TASK-408
  title: Power creator InfoTippy — tooltip draft to tooltip-text.tsx
  priority: medium
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Migrate owner draft copy from POWER_CREATOR_TOOLTIPS_DRAFT.md into public/tooltip-text.tsx and wire InfoTippy on advanced power creator sections (Description, Action Type, Reaction, Weapon, Area, Duration, Parts, Mechanics, Damage, Energy, Innate, TP, Load, Reset). Phase 1b / prerequisite for guided power creator.
  related_files:
    - src/docs/human/POWER_CREATOR_TOOLTIPS_DRAFT.md
    - public/tooltip-text.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - All draft field tooltips exist in tooltip-text.tsx (owner-editable strings).
    - InfoTippy on each major advanced power-creator section header or label.
    - Guided L1 placeholder exports added for Power character, Powered-Martial, innate intent, category (strings only; wiring in TASK-411).
    - npm run build and lint pass.
  notes: |
    **Blocked until TASK-414 done** (2026-07-01 owner: no creator L1 work until exact guided spec locked). Optional early win: advanced (L3) tooltips only — unblocks if owner explicitly requests before TASK-414.

---

- id: TASK-409
  title: Standalone creator Phase 1b — CreatorPageShell + power/item god-file split (TASK-380/381)
  priority: medium
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Execute engineering prerequisites before large guided power-creator UI: TASK-380 CreatorPageShell for shared auth/load/save; TASK-381 phase 1 extracting power-creator and item-creator page shells + section islands with parity tests.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/components/creator/
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - CreatorPageShell adopted by power-creator and item-creator routes (minimum).
    - Power-creator page decomposed into shell + section components without save/load/cost regressions.
    - Parity validation suite indexed in DEVELOPER_TASK_QUEUE / BUILD_VALIDATION.
    - npm run build passes.
  notes: |
    Blocks TASK-410–412. Species/creature creators out of scope for this phase.
    **Blocked until TASK-414 done** (2026-07-01 owner gate).
    2026-07-17: Engineering AC largely met via TASK-380 + TASK-381 (power/item shells +
    DEV-V-024). Keep blocked only for the TASK-414 product gate before guided power work.

---

- id: TASK-410
  title: Power creator guided — entry chooser + route shell
  priority: high
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Add /power-creator entry chooser (Guided vs Advanced) and /power-creator/guided route shell reusing guided-creator chrome (GuidedStepLayout, footer, preview slot). Advanced remains current builder at /power-creator/advanced or equivalent. No wizard steps yet — navigation scaffold only.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/characters/new/page.tsx
    - src/components/guided-creator/
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - /power-creator shows Guided vs Advanced choice before entering either flow.
    - /power-creator/guided renders step shell with placeholder step 1.
    - Advanced route loads existing power creator unchanged.
    - Mobile fullScreenOnMobile patterns where modals added.
    - npm run build passes.
  notes: |
    Mirror characters/new chooser pattern. Owner feedback required on labels (Guided/Advanced placeholders).
    **Blocked until TASK-414 done.**

---

- id: TASK-411
  title: Power creator guided — audience, innate, and category steps
  priority: high
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Implement guided power wizard steps 1–3 (REALMS §5.11): (1) audience — pick saved character OR generic Power vs Powered-Martial + level; (2) innate intent toggle with InfoTippy and constraint preview; (3) power category cards mapped to codex part categories (Offense, Defense, Utility, Control, etc.). Store in guided-power-creator-store or equivalent; preserve handoff shape for advanced editor.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/components/guided-creator/
    - public/tooltip-text.tsx
    - src/docs/GAME_RULES.md
    - src/docs/human/POWER_CREATOR_TOOLTIPS_DRAFT.md
  acceptance_criteria:
    - Character picker loads user characters when logged in; guest can pick archetype + level.
    - Innate threshold shown from GAME_RULES (L1: 8 Power, 6 Powered-Martial).
    - Category step uses GuidedChoiceCard; max one primary category per screen.
    - InfoTippy on archetype, innate, and category decisions.
    - Owner review checkpoint before TASK-412.
  notes: |
    Depends on TASK-408 (tooltips) and TASK-410 (shell). Iterative owner feedback expected.
    **Blocked until TASK-414 done** — implement only from locked spec, not §5.11 draft.

---

- id: TASK-412
  title: Power creator guided — delivery, damage, templates, save, advanced handoff
  priority: high
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Complete guided power wizard steps 4–7: delivery (melee/ranged/area), damage yes/no + presets, template pick from official_powers (curated per category — e.g. Fireball, Icebolt, Healing Incantation, Protective Ward, Charm Creature, Fog Cloud) or start blank, name/description + live preview, save to My Library or open Advanced with state handoff. Reuse existing calculators and useCreatorSave.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/hooks/use-official-library.ts
    - src/lib/calculators/
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - At least 4 official_powers loadable as templates by category.
    - Innate filter hides/disables templates above threshold when innate selected.
    - Save works for logged-in users; guest login prompt at save.
    - Customize in Advanced opens advanced builder with guided state applied.
    - New user can complete flow without seeing part option levels.
    - npm run build passes.
  notes: |
    Templates from existing official_powers table (31 rows); no new DB table for MVP. Owner curates template set.
    **Blocked until TASK-414 done.**

---

- id: TASK-413
  title: Landing secondary CTAs → power creator guided entry
  priority: medium
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Update SecondaryDiscoverySection power CTA to /power-creator (chooser) or /power-creator/guided once TASK-410 ships. Item CTA waits for item guided. Aligns with REALMS §5.11 conversion fix.
  related_files:
    - src/components/landing/secondary-discovery-section.tsx
    - src/lib/constants/site-copy.ts
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - Create a Custom Power lands on guided entry or chooser, not raw L3 advanced scroll.
    - Item CTA unchanged or clearly marked until item guided exists.
    - npm run build passes.
  notes: |
    Blocked until TASK-410. Item guided follow-up task after TASK-412 validates power pattern.
    **Blocked until TASK-414 done** (do not change landing CTA until guided entry exists).

---

- id: TASK-414
  title: Power creator Layer 1 — owner spec lock (design before build)
  priority: high
  status: not-started
  assignee: owner
  created_at: 2026-07-01
  created_by: owner
  description: |
    Owner completes POWER_CREATOR_LAYER1_SPEC.md with exact step order, screen copy, template list, character/innate rules, and L1/L2/L3 boundaries. No agent implementation of guided power creator (TASK-408–413) until this task is marked done with owner approval.
  related_files:
    - src/docs/human/POWER_CREATOR_LAYER1_SPEC.md
    - src/docs/human/POWER_CREATOR_TOOLTIPS_DRAFT.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - Every wizard step documented per Appendix A template (purpose, L1 UI, completion rules, tooltips).
    - Open questions in spec resolved or explicitly deferred with owner decision.
    - Template powers chosen from official_powers with IDs and category mapping.
    - Character vs guest flow, innate filtering, and advanced handoff behavior specified.
    - Owner marks spec status APPROVED at top of POWER_CREATOR_LAYER1_SPEC.md.
    - REALMS §5.11 updated to reference locked spec (agent may assist after approval).
  notes: |
    Human-owned design task. Agents may help draft or facilitate review but must not implement TASK-410+ until done.
    2026-07-01: Owner — no perfect L1 vision yet; spec must be exact before build.
