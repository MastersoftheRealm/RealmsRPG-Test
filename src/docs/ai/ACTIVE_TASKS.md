# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-762
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-755, TASK-754, TASK-750, TASK-747, TASK-746, TASK-739, TASK-741, TASK-734, TASK-735, TASK-736, TASK-737, TASK-714, TASK-732, TASK-716, TASK-726…)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 12 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** Owner 2026-08-14 creator feedback is **TASK-754–760**. **TASK-754 done** (create 500). **TASK-755 done** (Energy **EN**, never EP). **Next: TASK-756** (split innate → powers → techniques screens) **before** TASK-751–753; **TASK-757** (Power path See weapons); **TASK-758–759** (feat GLR: drop REQ LEVEL + State Feats `(i)` — before TASK-753); **TASK-760** (ability tiles). **TASK-733** (sheet innate InfoTippys) can run in parallel with 756+. Wave 2 sheet Query SoT (**TASK-750**) is done. **TASK-761** (campaign RM view Query load) is a 750 leftover — low. **TASK-751–753** stay **low** — after 733 **and** 756/758/759 so path-filter wiring lands on the new screens/columns. TASK-718 / 719 last. Wave 3 still waits for the owner.

---

- id: TASK-756
  title: Split guided innate powers, powers, and techniques into sequential screens
  created_at: 2026-08-14
  created_by: owner
  priority: high
  status: not-started
  related_tasks:
    - TASK-754
    - TASK-755
    - TASK-726
    - TASK-727
    - TASK-692
    - TASK-753
  related_files:
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/components/guided-creator/steps/use-powers-techniques-selection.ts
    - src/components/guided-creator/guided-powers-techniques-l1-content.tsx
    - src/components/guided-creator/guided-powers-techniques-l2-modal.tsx
    - src/lib/guided-creator/powers-techniques-step-helpers.ts
    - src/lib/guided-creator/guided-substep-nav.ts
    - src/lib/guided-creator/substep-satisfaction.ts
    - src/stores/guided-creator-store.ts
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Power / Powered-Martial still pick innate and regular powers on one screen (dual
    L1 lists + L3 innateScope All / Innate / Powers dropdown). Owner wants sequential
    screens after loadout: (1) innate powers only — no innate vs non-innate copy or
    filter; (2) non-innate powers; (3) techniques when the path has them. Example:
    L1 Powered-Martial → weapons/armor/equipment → innate → powers → techniques.
    Back still shows prior picks. Martial-only skips innate/powers; Power-only skips
    techniques. Custom L3 uses the same screen order (TASK-692 combined innate+powers
    list + scope filter goes away).
  acceptance_criteria:
    - Inner-phase pattern like loadout (`equipmentPhase`), not a new shared component
      or store. Visibility by archetype type: Power → innate then powers; Martial →
      techniques; Powered-Martial → innate, powers, techniques. Continue/Back and
      chapter rail land on first inner screen forward / last inner screen back
      (`landsOnFirstInnerScreen`).
    - Innate screen: innate catalog only; no Show Innate+Powers / innate-scope
      SelectFilter. Keep Innate Energy bar + innatePowersHelp / innateEnergyHelp
      (TASK-726). Soft energy-cap warn + last-in swap (TASK-727) stay on this screen.
    - Powers screen: non-innate powers only. Techniques screen: techniques only.
      Shared TP budget still counts innate + powers + techniques. L1 cards + L2 USM
      + L3 GuidedInlineCatalogList reused per screen (ADR-0012); no second catalog.
    - REALMS / FEATURE_INDEX: sequential screens, not one combined step with a scope
      dropdown. Delete `innateScope` chrome. Typecheck/lint. Vitest for phase order /
      visibility. DEV-V-013 T086 (PM walk) + T056/T043/T076 updated; DEV-V-050 T001
      step 6 / T003 against the innate screen (not a combined list).
  notes: |
    After TASK-754/755. Do before TASK-751–753 (753 add-X / L2 must not re-combine
    tracks). Not Architect — extend existing store + equipment-phase pattern. Legacy
    `/advanced` powers step out of scope unless it still uses the same combined UI.

---

- id: TASK-757
  title: Power path equipment screen — See weapons hatch
  created_at: 2026-08-14
  created_by: owner
  priority: medium
  status: not-started
  related_tasks:
    - TASK-756
    - TASK-689
  related_files:
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/guided-equipment-phase-layout.tsx
    - src/components/guided-creator/guided-equipment-l2-modal.tsx
    - src/lib/guided-creator/equipment-phase-nav.ts
    - src/lib/guided-creator/equipment-eligibility.ts
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/MOBILE_UX.md
  description: |
    Path Power loadout skips the weapon phase when the path has no weapon recs, so
    Power users cannot pick weapons even though armament proficiency still allows
    them. On the equipment (gear) screen for a Power archetype path, add a
    bottom-right control to see weapons. It opens the existing weapon catalog modal
    (same L2 USM / filters as the weapon phase), still capped by armament
    proficiency max TP. Mainstream Power flow stays equipment-first; weapons are
    optional.
  acceptance_criteria:
    - Power path gear screen shows a bottom-right See weapons (or equivalent) hatch;
      Martial / Powered-Martial that already walked the weapon phase do not get a
      duplicate hatch. Custom `fullCatalog` already includes weapons — do not double
      the phase.
    - Modal is existing `GuidedEquipmentL2Modal` (weapon headers, `fullScreenOnMobile`),
      filtered by current armament proficiency max like the normal weapon catalog.
      Picks write `loadoutWeapons` and appear on Your Hero / save. Currency + TP
      still use LoadoutBudgetBar.
    - Do not show an armor phase for Power (TASK-689). Do not add a new shared/ui
      file. FEATURE_INDEX loadout note. DEV-V-013 T087. Typecheck/lint. Desktop +
      ~360px.
  notes: |
    After TASK-754; can ship with the TASK-756 creator pass. GuidedLayerNav is the
    See-more hatch — this is a second, optional catalog entry, not Continue-primary
    (TASK-695).

---

- id: TASK-758
  title: Hide REQ. LEVEL on character-creator feat GLR
  created_at: 2026-08-14
  created_by: owner
  priority: medium
  status: not-started
  related_tasks:
    - TASK-753
    - TASK-759
  related_files:
    - src/lib/guided-creator/feats-l2.ts
    - src/lib/guided-creator/feats-l2.test.ts
    - src/lib/codex/feat-list.ts
    - src/lib/glr/required-facts-registry.ts
    - src/docs/ai/ADR/0009-glr-required-facts-registry.md
    - src/components/guided-creator/steps/archetype-feats-step.tsx
    - src/components/guided-creator/steps/character-feat-step.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Creator feat L2/L3 reuse Codex `FEAT_SELECTABLE_HEADER_COLUMNS`, which includes
    REQ. LEVEL. At character create the hero is always level 1 and unmet `lvl_req`
    feats are already hidden, so the column is noise. Codex / Admin / sheet keep it.
  acceptance_criteria:
    - Guided archetype-feat and character-feat L2 USM + L3 inline catalogs have no
      REQ. LEVEL / `lvl_req` header or cell. Eligibility filter unchanged (`lvl_req`
      > 1 still hidden). Codex/Admin/sheet feat lists still show REQ. LEVEL.
    - ADR-0009: `guided-feats-l3` drops `FACT.reqLevel` as a required column (do not
      leave CI failing). Do not change Codex feat surfaces' required facts.
    - `feats-l2.test.ts` no longer expects `lvl_req` in creator columns. FEATURE_INDEX.
      DEV-V-013 T012 + DEV-V-050 T001 feat list. Typecheck/lint.
  notes: |
    Before TASK-753 — that task must compose creator feat headers without putting
    REQ. LEVEL back. Prefer a creator header/column helper wrapping feat-list, not a
    Codex fork and not a new shared file.

---

- id: TASK-759
  title: State Feats filter InfoTippy on creator GLR
  created_at: 2026-08-14
  created_by: owner
  priority: medium
  status: not-started
  related_tasks:
    - TASK-758
    - TASK-753
    - TASK-725
  related_files:
    - src/components/guided-creator/guided-feats-filter-fields.tsx
    - src/lib/codex/feat-restriction-notice.ts
    - src/lib/codex/feat-restriction-notice.test.ts
    - public/tooltip-text.tsx
    - src/components/shared/filters/select-filter.tsx
    - src/app/(main)/codex/CodexFeatsTab.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Creator feat GLR State Feats dropdown has no (i). Owner wants the existing state
    feat teaching copy (Quick Action / Enter State / 1-minute / multiple states —
    `getFeatRestrictionNotice`) shared on that filter. SelectFilter already has
    `labelAccessory`.
  acceptance_criteria:
    - GuidedFeatsFilterFields State Feats label has InfoTippy (`tone` default
      link-blue; TASK-725 hit-area). Copy is the shared state-feat sentence from
      `feat-restriction-notice` (export a constant or helper; do not paste a second
      string into tooltip-text).
    - Codex Feats State Feats SelectFilter gets the same accessory (unification).
      Admin may share it if it is the same control.
    - L1/L2 feat cards keep using `getFeatRestrictionNotice` — one SoT. FEATURE_INDEX
      + tooltip hub note. DEV-V-013 T012 / T070. Typecheck/lint. Desktop + ~360px.
  notes: |
    Before TASK-753 (`GuidedFeatsFilterFields` + ArchetypePathFilter). Do not create
    a new shared/ui file. GAME_RULES has no State feat section — do not invent extra
    rules copy.

---

- id: TASK-760
  title: AbilityScoreGrid tile spacing and Primary/Secondary pill alignment
  created_at: 2026-08-14
  created_by: owner
  priority: medium
  status: not-started
  related_tasks:
    - TASK-544
    - TASK-545
    - TASK-566
  related_files:
    - src/components/shared/ability-score-grid.tsx
    - src/components/guided-creator/steps/abilities-step.tsx
    - src/components/guided-creator/guided-abilities-customize-panel.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/MOBILE_UX.md
  description: |
    Guided Abilities tiles look uneven: too much space above, too little below, and
    Primary/Secondary (or Power/Martial) pills shove highlighted tiles down relative
    to neighbors. Fix once in AbilityScoreGrid (display + customize edit). Screenshot
    audit until the six-tile row is even.
  acceptance_criteria:
    - Display and customize/edit grids: uniform tile height and padding; pills sit on
      the top edge without dropping the highlighted tile; bottom padding matches top
      once pills are accounted for. Hybrid Power/Martial pills still fit without
      wrapping into the ability name (existing truncate/aria-label).
    - Screenshot audit (implementer): Power path (one Primary), Powered-Martial
      (Power + Martial), path with a distinct Secondary pill; desktop and ~360px;
      light + dark. Compare Abilities step and Your Hero summary grid if it uses the
      same component.
    - No new shared file; no per-step forks. FEATURE_INDEX AbilityScoreGrid note.
      DEV-V-013 T034 / T035 / T036. Typecheck/lint.
  notes: |
    Independent of TASK-756–759; after TASK-754. TASK-452/455/544/545 already added
    extra `pt-*` for straddling pills — that is the likely cause of “too much top /
    displaced down.” Prefer one reserved pill row or consistent padding on every
    tile, not padding only on highlighted tiles.

---

- id: TASK-761
  title: Campaign RM view character load is a Query (not useState + apiFetch)
  created_at: 2026-08-14
  created_by: agent
  priority: low
  status: not-started
  related_tasks:
    - TASK-750
  related_files:
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
    - src/hooks/use-characters.ts
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Report 06 P1-1 sibling left after TASK-750. The owned sheet now reads
    useCharacter. The campaign Realm Master view still holds the character in
    useState and loads with an uncancelled apiFetch to
    `/api/campaigns/[campaignId]/characters/[userId]/[characterId]` (not
    getCharacter / `/api/characters/[id]` — that route is the wrong SoT for a
    campaign-scoped view).
  acceptance_criteria:
    - RM view read is a React Query hook (campaign-scoped key or a documented
      variant of characterKeys). No parallel useState + apiFetch load effect.
    - Do not call getCharacter / useCharacter against `/api/characters/[id]`
      for this page unless that GET is proven equivalent to the campaign route
      (visibility, libraryForView, RM authorization).
    - Local UI state (library tab) stays useState. Typecheck/lint pass.
      FEATURE_INDEX. DEV-V-009 or DEV-V-041 one test.
  notes: |
    Filed from TASK-750 /cleanup. Architect — new query key or campaign-view
    hook; pause once before implementing. Do not redo TASK-750 sheet SoT.
    Cancellation (P1-1) comes for free when the effect is deleted.

---

- id: TASK-718
  title: Archive BUILD_VALIDATION suites that cannot stay in the 322KB hot file
  created_at: 2026-08-13
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  description: |
    BUILD_VALIDATION.md is ~322KB / 45 suites / 320 tests with no archive file. Create
    archive/BUILD_VALIDATION_ARCHIVE.md and move verified or long-superseded suites out of
    the hot file. Keep suites still cited by Pending owner QA in the hot file.
  acceptance_criteria:
    - archive/BUILD_VALIDATION_ARCHIVE.md exists with a pointer from BUILD_VALIDATION.md.
    - Hot file shrinks; Pending owner QA linked suites remain in the hot file.
    - DEVELOPER_TASK_QUEUE build-validation index links still resolve.
  notes: |
    Filed from 2026-08-13 /global-audit. Do not delete tests — move them.

---

- id: TASK-719
  title: Disambiguate duplicate archive IDs TASK-615 and TASK-284
  created_at: 2026-08-13
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/docs/ai/archive/TASK_QUEUE_DONE.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  description: |
    Archive has two distinct done blocks each for TASK-615 (facade shrink vs Web Analytics)
    and TASK-284 (role-based admin vs mixed-species list dedupe). Not copy-paste dupes —
    ID collisions. Re-id one of each (new TASK-###) and retarget DEVELOPER_TASK_QUEUE /
    BUILD_VALIDATION citations so reconcile and pending-QA rows are unique.
  acceptance_criteria:
    - Each `- id: TASK-615` / `TASK-284` in the done archive refers to one piece of work.
    - The other block has a new unique TASK-###; DTQ pending-QA and DEV-006/DEV-V-018 links match.
    - `npm run tasks:validate` strict reconcile still passes for both IDs (commit subjects).
  notes: |
    Filed from 2026-08-13 /global-audit. Do not delete either block. Re-id needs a commit
    subject containing the new ID if strict-since covers completed_at.

---

- id: TASK-733
  title: Sheet LibraryPowersPanel — Innate Energy / Innate Powers InfoTippys
  created_at: 2026-08-13
  created_by: agent
  priority: medium
  status: not-started
  related_tasks:
    - TASK-726
  related_files:
    - src/components/character-sheet/library-powers-panel.tsx
    - public/tooltip-text.tsx
    - src/components/shared/tab-summary-section.tsx
    - src/components/shared/entity-library-powers-techniques.tsx
    - src/components/shared/section-header.tsx
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    TASK-726 wired innateEnergyHelp / innatePowersHelp on guided creator chrome. The
    character sheet Powers tab (LibraryPowersPanel) still has no (i) on Innate Energy or
    Innate Powers, and the summary blurb says energy costs may go "up to your innate
    energy" (pool vs Innate Threshold mixup). Reuse the TASK-726 global tips; do not
    invent a second copy string.
  acceptance_criteria:
    - Innate Energy SummaryItem uses labelAccessory + innateEnergyHelp (same GAME_RULES copy as creator).
    - Stale "up to your innate energy" sentence is removed or replaced so Threshold vs pool is not confused.
    - Innate Powers list heading has an InfoTippy with innatePowersHelp; extend SectionHeader / PowersListSection (GuidedSectionTitle titleAddon pattern) — no second header fork.
    - FEATURE_INDEX sheet Library note; DEV-V-009 T041; typecheck/lint pass.
  notes: |
    Filed from TASK-726 /audit. SummaryItem already has labelAccessory. SectionHeader has
    no titleAddon today — add a slot on the existing shared header, do not create a new
    shared/ui file. Threshold / Pools SummaryItems do not need their own tips unless copy
    is unclear without them.

---

- id: TASK-751
  title: Archetype Path filter — ADR, live path collectors, shared control, Codex Feats
  created_at: 2026-08-14
  created_by: owner
  priority: low
  status: not-started
  related_tasks:
    - TASK-752
    - TASK-753
    - TASK-423
  related_files:
    - src/docs/ai/ADR/0000-template.md
    - src/docs/ai/ADR/README.md
    - src/docs/ai/ADR/0010-lib-layer-dependency-direction.md
    - src/lib/game/archetype-path.ts
    - src/lib/game/archetype-path-helpers.test.ts
    - src/lib/game/archetype-edit.ts
    - src/types/archetype.ts
    - src/lib/utils/normalize-id.ts
    - src/lib/codex/feat-list.ts
    - src/lib/codex/feat-list.test.ts
    - src/lib/chip/chip-data-helpers.ts
    - src/components/shared/filters/chip-select.tsx
    - src/components/shared/filters/tag-filter.tsx
    - src/components/shared/filters/index.ts
    - src/components/shared/grid-list-row-collapsed.tsx
    - src/components/shared/grid-list-row-types.ts
    - src/components/codex/codex-feat-row.tsx
    - src/app/(main)/codex/CodexFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - scripts/shared-ui-allowlist.json
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/MOBILE_UX.md
  description: |
    First slice of sitewide Archetype Path list filtering. Canonical
    recommendations already live on each path (`path_data` level 1, later
    levels, guidance groups). The filter must **read those lists live** when
    the user selects path(s) — union the recommended feat ids, then apply
    existing list filters (`filterFeats`). Do not create a second
    recommendation table, `feats.paths[]` column, or cached copy that can
    drift when an admin edits a path. Wire Codex Feats only in this task.
    While the path filter is active, matching rows get DescriptorChips for
    the selected path names. Creator/USM L2 wiring is TASK-753.
  acceptance_criteria:
    - ADR-0014 accepted (`src/docs/ai/ADR/` + README): SoT is existing path
      recommendation arrays. `lib/game` exposes shared collectors (e.g.
      `collectPathRecommendedIds(path, kind)`) that L1 cards and this filter
      both use — extend `unionFeatIdsFromGuidanceGroups` / parse helpers;
      ADR-0010 (no library/guided-creator imports). Memoize from
      `useCodexArchetypes` / `['codex']` only; admin path save already
      invalidates that query so edits apply with no extra write. Forbidden:
      junction table, denormalized paths on feat rows, zustand/localStorage
      recommendation cache, a seed CSV just for this filter.
    - Match = ChipSelect multi-select **union** (Monk + Berserker → feats
      recommended by either). Do not add a TagFilter any/all toggle.
    - Collectors union **all path-authoring levels** (L1 + later `levels[]` +
      feat guidance groups). `remove_*` is not a recommendation. Player-visible
      paths only (`listPlayerVisiblePaths`). Resolve refs by id then name
      (`indexByNormalizedIds`). Path-authoring level does **not** hide a feat;
      `lvl_req` / character / category filters stay independent and still apply.
    - Shared `ArchetypePathFilter` under `src/components/shared/filters/`
      composing ChipSelect (optgroups for Power / Martial / Powered-Martial
      if needed — do not fork a second multi-select). Allowlist + FEATURE_INDEX.
      InfoTippy on the label.
    - Codex Feats: selecting paths shows only feats those paths recommend;
      empty copy when none match; composes existing feat filters.
    - Path DescriptorChips (`category: 'archetype'`, path display name) appear
      on matching rows **only while ≥1 path is selected**, next to the name.
      GridListRow.badges are compact-only today — extend the shared name-row
      chip slot for non-compact Codex browse; do not Codex-fork nameContent.
      Chips = selected paths that recommend that feat.
    - `filterFeats` takes the recommended-id set from the collectors so
      AdminFeatsTab can reuse the helper (wire Admin in this PR if it is the
      same FilterSection slot; no second feat-filter pipeline).
    - Vitest: union of two paths; admin-shaped path_data change is visible
      without a second store; id+name resolve; remove_* excluded; hidden paths
      omitted; lvl_req filter still drops high-req feats. Typecheck/lint.
      FEATURE_INDEX + changelog. DEV-V-052 T001 (Codex Feats) + DTQ index.
  notes: |
    Architect — new shared filter + ADR. Pause once before coding; do not pause
    again after owner “proceed.” Owner lock 2026-08-14: live read of path
    lists (no duplicate dataset); ChipSelect union; all recommendation
    levels; chips only while filtering; player-visible only.
    Do not start until TASK-733 **and** creator TASK-754–759 (esp. 756/758/759)
    are done unless the owner re-prioritizes.
    Does **not** wait for Wave 3.
    TASK-423 incomplete seeds can make some paths look empty — still list
    them. Creature feats out of scope. Do not change guided L1 / See more
    in this task.

---

- id: TASK-752
  title: Archetype Path filter — Codex/Library skills, powers, techniques, loadout
  created_at: 2026-08-14
  created_by: owner
  priority: low
  status: not-started
  related_tasks:
    - TASK-751
    - TASK-753
  related_files:
    - src/lib/codex/skill-list.ts
    - src/app/(main)/codex/CodexSkillsTab.tsx
    - src/lib/codex/equipment-list.ts
    - src/app/(main)/codex/CodexEquipmentTab.tsx
    - src/lib/library/power-technique-filters.ts
    - src/lib/library/armament-filters.ts
    - src/components/shared/filters/power-technique-filters.tsx
    - src/components/shared/filters/armament-filters.tsx
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    After TASK-751 ships the shared index + ArchetypePathFilter, drop the same
    control into other global browse lists: Codex skills, Codex/Library
    powers and techniques, Codex/Library weapons/armor/gear. Same union
    default, same “chips only while filtering” rule, same player-visible
    path options. No per-tab copy of match logic.
  acceptance_criteria:
    - Each listed browse surface uses `ArchetypePathFilter` + the TASK-751
      index (kind: skills / powers / innatePowers / techniques / armaments /
      equipment). No new filter component and no duplicated invert helpers.
    - Desc chips for selected recommending paths only while the filter is
      active; no new required-fact column (ADR-0009 unchanged unless a surface
      already lacks a name-adjacent chip slot — then extend GridListRow, not
      a local fork).
    - Empty-state copy when the path filter yields zero rows. Typecheck/lint.
      FEATURE_INDEX. DEV-V-052 T002–T00n (one test per entity family).
  notes: |
    Blocked in practice on TASK-751 (status stays not-started until 751 is
    done — do not mark `blocked`). Innate powers use the innatePowers bag,
    not the regular powers bag. Official Library lists share
    PowerTechniqueFilters / ArmamentFilters — add the path control there so
    Codex and Library stay one panel body. Skip creature feats / traits /
    species / parts / properties.

---

- id: TASK-753
  title: Archetype Path filter — creator L2 catalogs and add modals
  created_at: 2026-08-14
  created_by: owner
  priority: low
  status: not-started
  related_tasks:
    - TASK-751
    - TASK-752
    - TASK-756
    - TASK-758
    - TASK-759
  related_files:
    - src/components/guided-creator/guided-feats-filter-fields.tsx
    - src/lib/guided-creator/feats-l2.ts
    - src/components/guided-creator/guided-feats-l2-modal.tsx
    - src/components/guided-creator/steps/archetype-feats-step.tsx
    - src/components/guided-creator/steps/character-feat-step.tsx
    - src/components/shared/guided-choice/guided-inline-catalog-list.tsx
    - src/docs/ai/ADR/0012-guided-inline-catalog-list.md
    - src/components/character-sheet/add-feat-modal.tsx
    - src/components/shared/add-skill-modal.tsx
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Use the TASK-751 collectors as the L2 catalog face inside the existing
    See-more modal (not a second dataset). L1 stays the path’s curated cards.
    See more opens the same USM as today, with Filters **expanded**, and the
    Archetype Path filter **pre-selected to every player-visible path of the
    same archetype type** as the draft (Power path → all Power paths; Martial
    → all Martial; Powered-Martial → all Powered-Martial). Union of those
    paths’ recommended feats. User can deselect paths or clear the filter
    (that is L3 in the same modal — do not invent a fourth hatch). Custom /
    no-path inline catalogs get the same control with no auto-select.
    Sheet/creator add modals reuse filterContent so Codex / creator / add-X
    do not drift.
  acceptance_criteria:
    - Guided path flow: L1 cards unchanged. See more → modal as today;
      FilterSection open; ArchetypePathFilter selected = all
      `listPlayerVisiblePaths` with `type === draftPath.type`; still
      un-selectable / clearable to the full eligible catalog.
    - L1 creator eligibility: hide feats whose **required level** (`lvl_req`)
      is above 1 (existing unmet hide). Do **not** hide higher **feat family
      ranks** (expandable level 2/3/4 chips on a feat that is legal at L1).
      Path-authoring level (recommended at path level 5 vs 1) does not extra-
      hide a feat; `lvl_req` does.
    - Custom / no-path (`prefersDeepCatalogEntry`): path filter available,
      no auto-select; selecting paths is L2, clearing is L3.
    - `GuidedFeatsFilterFields` composes `ArchetypePathFilter`;
      `buildGuidedFeatsL2Items` uses `collectPathRecommendedIds` (same as
      Codex). While the path filter is on, show path-name chips not a
      duplicate “Recommended” badge.
    - AddFeatModal / AddSkillModal / other USM add-X that list the same
      catalogs get the same filterContent — no modal-local id lists.
    - REALMS §3 / §5 feat L2 rows: same-type auto-filter, unapply = full
      list. DEV-V-013 + DEV-V-050: L1 cards unchanged; See more opens with
      same-type paths selected and filters expanded; clearing paths shows
      feats the L1 cards did not; `lvl_req` > 1 hidden; family ranks remain.
      Typecheck/lint. FEATURE_INDEX.
  notes: |
    Owner lock 2026-08-14. Do after TASK-751 (752 may land in parallel) and
    after TASK-756 / TASK-758 / TASK-759 (creator screens + feat GLR chrome).
    Do not reintroduce a REQ. LEVEL column (TASK-758) or drop the State Feats
    filter InfoTippy (TASK-759). Powered-Martial is its own type (do not also
    auto-select pure Power and pure Martial unless the owner says so later).
    Character-feat step: same same-type default unless playtesting says
    character feats should start unfiltered. Do not fork GuidedFeatsFilterFields
    into a Codex copy.

---

