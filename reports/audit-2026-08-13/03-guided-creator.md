# Independent Engineering Audit — Guided Character Creator

**Date:** 2026-08-13 · **Scope:** `src/components/guided-creator/**` (51 files), `src/lib/guided-creator/**` (31 source + 29 test files), `src/stores/guided-creator-store.ts`, `src/app/(main)/characters/new/guided/page.tsx`, `src/lib/constants/copy/guided-creator-copy.ts` · **Method:** read-only; every in-scope file read in full; claims verified in code (not docs). Supporting files read where the funnel crosses into them: `src/lib/game/{formulas,calculations,skill-allocation}.ts`, `src/lib/creator/build-creator-skills.ts`, `src/lib/data-enrichment/clean-for-save.ts`, `src/lib/character-save.ts`, `src/lib/api-validation.ts`, `src/app/api/characters/route.ts`, `src/hooks/{use-codex,use-guided-equipment-catalog,use-guided-equipment-l2-catalog,use-auth}.ts`, `src/components/shared/{guided-choice/guided-inline-catalog-list,unified-selection-modal-list,loadout-budget-bar,point-status}.tsx`, `src/components/ui/modal.tsx`, `src/components/character-sheet/{skills-section,use-character-sheet-derived}.tsx`, `src/stores/character-creator-store.ts`, `node_modules/zustand/middleware.js`.

**Severity key (per brief):** P0 = user loses a character / cannot complete creation / crash / data corruption. P1 = wrong game math, broken step, major a11y or mobile failure. P2 = maintainability, duplication, perf. P3 = nit.

---

## 0. Executive assessment

The flow is well-decomposed and unusually well-factored for a wizard of this size: 31 pure helper modules with 193 unit tests behind them, one shared `GuidedStepLayout`/`GuidedStepFooter` chrome, one shared `GuidedChoiceCard`, and real reuse of the shared selection modal and budget bar rather than per-step forks. The save payload goes through the same calculators as the sheet (`calculateMaxHealth`, `calculateMaxEnergy`, `buildRequiredProficiencies`, `buildCreatorSkillSaveRows`), so the big-ticket derived stats are not re-implemented.

The problems are concentrated in three places, and they are the three that matter most for a funnel:

1. **Progress bookkeeping is a monotonic list, not a state machine.** `completedSubSteps` is append-only and is never invalidated when the data those steps produced is wiped. Combined with a chapter rail that navigates purely off that list and a Reveal step whose save gate checks only *name + HP/EN allocated*, a player can save a structurally invalid level-1 character in about six clicks.
2. **Budget enforcement is inconsistent.** Training Points are checked everywhere; Currency is checked only in the gear phase. Weapons and armor can be bought past the 200-Currency budget, and the resulting negative balance is written to the saved character.
3. **The persisted draft is never reconciled against the live codex** — except in the loadout step, which does exactly that (`pruneUnresolvedLoadoutRefs`). The skills step has no equivalent, and an unresolvable skill id there is an unrecoverable dead-end.

There are also two real math divergences with the character sheet (skill contributing-ability, archetype proficiency start) and one keyboard defect on the single most-used control in the funnel (`GuidedChoiceCard`'s "See more" is unreachable by keyboard — pressing Enter on it selects the card instead).

Zero tests cover any of the above. 193/193 unit tests are on pure helpers; the store has 2 tests (both on `resetCreator`); there is no component test, no store-migration test, and no end-to-end test that creates a character. The four `tests/visual/guided-*-audit.pw.ts` files are one-off screenshot audits behind separate Playwright configs and are not part of `npm run verify`.

---

## 1. P0 — funnel-breaking

### P0-1 · `completedSubSteps` is never invalidated, so the chapter rail lets you save a gutted character

**Where:** `src/stores/guided-creator-store.ts:336-353` (`markSubStepComplete` / `canNavigateToSubStep`), `src/lib/guided-creator/path-selection-draft.ts:17-36` (`clearArchetypeDependentDraftFields`), `src/lib/guided-creator/species-selection-draft.ts:13-24` (`clearAncestryDependentDraftFields`), `src/components/guided-creator/steps/reveal-step.tsx:133` (`canSave`).

**Repro (verified by reading the code paths, not run):**
1. Complete the flow to `reveal` (all ten sub-steps land in `completedSubSteps`).
2. Chapter rail → **Foundation** → pick a *different* path. `buildPathSelectionDraftPatch` (`path-selection-draft.ts:39-56`) fires `clearArchetypeDependentDraftFields()`, wiping `abilities`, `abilitiesMode`, `skills`, `declinedPathSkillIds`, `archetypeFeatIds`, `characterFeatIds`, `loadoutWeapons`, `loadoutArmor`, `equipment`, `powerIds`, `innatePowerIds`, `techniqueIds`, `currency`, `unarmedProwess`.
3. `completedSubSteps` is untouched, so `canNavigateToSubStep('reveal')` still returns `true` (`store:350`).
4. Chapter rail → **Your Hero**. `hpAllocated` / `energyAllocated` are *not* in either clear-list, so `remaining === 0` still holds and `canSave = draft.name.trim().length > 0 && remaining === 0` is `true`.
5. Press **Create character**.

**Saved result:** `abilities` = `DEFAULT_ABILITIES` (0 of 6 ability points spent), `archetypeFeats: []` (should be 1–3 by `calculateMaxArchetypeFeats`), `feats: []` (should be exactly 1 character feat), `powers`/`techniques` empty, `equipment` empty, and 3 unspent skill points (only the new path's default-0 skills are re-added by `build-character.ts:224-231`). The character is written with `status: 'complete'` (`build-character.ts:349`).

The same bypass exists via the species route: changing species clears every ancestry pick but leaves `ancestry` in `completedSubSteps`, so you can jump to Reveal and save with no characteristic and no ancestry trait.

**Why it matters:** this is the single cheapest way for a new player to end up with a broken sheet, and it is reachable by a *reasonable* action ("let me try a different path"). Nothing downstream re-validates — the API accepts any JSON blob (see P1-7).

**Fix:** make completion derived, not recorded. Minimum viable version: have the draft-clearing patch builders also return the sub-steps to invalidate, and add a store action `invalidateSubStepsFrom(subStep)` that truncates `completedSubSteps` at the earliest cleared step. Better: replace `completedSubSteps` with a `isSubStepSatisfied(subStep, draft)` predicate table (one pure function per step, reusing the `canContinue` expressions already living in each step component), and derive both the rail's enabled state and Reveal's `canSave` from it. That also removes the persisted-progress/persisted-draft skew described in P1-2.

### P0-2 · An unresolvable skill id in the persisted draft permanently blocks the Skills step

**Where:** `src/components/guided-creator/steps/skills-step.tsx:120,157,289`, `src/lib/game/skill-allocation.ts:242-261`, `src/components/guided-creator/guided-skills-panel.tsx:273-310`.

`calculateSimpleSkillPointsSpent` charges `gainProficiencyCost` for **every** key in `allocations`, defaulting unknown ids to `{ isSubSkill: false }` (`skill-allocation.ts:244`). `GuidedSkillsPanel.orderedSkills` only renders skills that exist in `codexSkills` (`guided-skills-panel.tsx:285-308`). So a `draft.skills` key that no longer resolves in the codex:

- costs 1 skill point (`remainingPoints` at `skills-step.tsx:157` never reaches 0),
- renders no row, therefore has no ± stepper and no X remove button,
- and `canContinue = remainingPoints === 0 && …` (`skills-step.tsx:289`) is permanently `false`.

The only escape is **Restart**, which discards the whole character. Note that the loadout step already solves exactly this problem for item refs (`loadout-step.tsx:322-356` → `pruneUnresolvedLoadoutRefs`), which is strong evidence the skills equivalent is an oversight rather than a decision.

**Likelihood:** requires a `codex_skills` id to disappear or change between the write and the read. The admin codex spreadsheet supports row deletion, and drafts persist in `localStorage` indefinitely with no TTL, so any codex cleanup silently bricks in-flight guest drafts. Not hypothetical for a live product.

**Fix:** in `SkillsStep`, once `codexSkills.length > 0`, prune `draft.skills` keys with no codex match (mirror the loadout pattern, and gate on `codexSkills.length > 0` so a cold cache doesn't wipe valid allocations). Add a defensive floor as well: if `remainingPoints < 0` or unknown ids exist, surface a "some skills no longer exist — reset skills" affordance rather than a dead Continue button.

---

## 2. P1 — wrong math, broken step, major a11y/mobile

### P1-1 · Weapons and armor have no Currency check; negative currency is saved

**Where:** `src/components/guided-creator/guided-equipment-l1-phase.tsx:162-210` (currency guard only inside the `phase === 'gear'` branch at 205-210), `src/lib/guided-creator/guided-equipment-l2.ts:391-430` (weapon/armor branches validate hands + TP only; `gearBudget` is consulted only in the gear branch at 432-435), `src/lib/guided-creator/equipment-currency.ts:93-95` (`computeRemainingCurrency` is unclamped subtraction), `src/components/guided-creator/steps/loadout-step.tsx:389` (`updateDraft({ currency: currencyRemaining })`), `src/lib/guided-creator/build-character.ts:336-337,363`.

Eligibility for weapons/armor filters on phase, rarity, ability requirement and TP (`equipment-eligibility.ts:93-126`) — never on price. `LoadoutBudgetBar` turns the Currency pill red when overspent (`point-status.tsx:81`), but `phaseComplete` comes from `canCompleteEquipmentPhase`, which is a stub returning `true` (see P2-1), so Continue is never blocked. The negative remainder is written to `draft.currency` and then to the character's `currency` field.

**Why it matters:** the character starts play in debt, and the two creators disagree about what 200 starting Currency means. It is also the only budget in the funnel that can be violated, which teaches the wrong mental model on the step where the game's economy is introduced.

**Fix:** thread the currency ceiling through `applyGuidedEquipmentL2Refs` for all three phases (it already receives `gearBudget`; generalise it to `currencyBudget` and compute cross-phase spend the way `crossPhaseTpSpent` does), add the same check to `GuidedEquipmentL1Phase.toggleSelection` for weapon/armor, and clamp `computeRemainingCurrency` at 0 for the *saved* value while keeping the raw signed value for the red-pill display.

### P1-2 · Mixed-species required skill picks can be skipped entirely

**Where:** `src/components/guided-creator/steps/ancestry-step.tsx:482-486`, `src/lib/guided-creator/ancestry-pick-tasks.ts:159-167`.

`buildMixedAncestryPickTasks` emits a `mixed-species-skills` task only when there are **more than two** combined parent skills, with the description "Pick exactly two skills from your combined species options." The footer gate is:

```482:486:src/components/guided-creator/steps/ancestry-step.tsx
  const footerCanContinue = isOverview
    ? (totalPicks > 0 || ancestryComplete) && sizeOk
    : currentTask
      ? currentTask.phase === 'mixed-species-skills' || currentTask.optional || hasCurrentPick
      : ancestryComplete;
```

`currentTask.phase === 'mixed-species-skills'` unconditionally allows Continue. The remaining tasks (characteristic → ancestry trait → flaw) then advance via `advanceAfterPick()` (`ancestry-step.tsx:366-373`), and the last one calls `nextSubStep()` directly — `ancestryComplete` (which *does* check `hasRequiredMixedSpeciesSkills`) is never consulted on that path. Result: a mixed-species character can leave the Ancestry chapter with 0 of its 2 required species skills, and `build-character.ts:210-212,219-222` will then fall back to the parents' full skill list or omit `selectedSpeciesSkillIds` entirely.

**Fix:** replace the short-circuit with `hasRequiredMixedSpeciesSkills(mixedSkillOptionCount, draft.selectedSpeciesSkillIds.length)` — the predicate already exists and is already used two lines away in `hasCurrentPick` (`ancestry-step.tsx:281-291`). Also route the final `advanceAfterPick` through `ancestryComplete`.

### P1-3 · Guided skill bonus is computed from the *highest* linked ability but saved as the *first*

**Where:** `src/components/guided-creator/guided-skills-panel.tsx:363-385` vs `src/lib/creator/build-creator-skills.ts:65` vs `src/components/character-sheet/skills-section.tsx:278-303` and `src/components/character-sheet/use-character-sheet-derived.ts:427-446`.

The guided panel picks the contributing ability with `getHighestLinkedAbilityKey(skillForAbility.ability, abilities)` and feeds it to `calculateSkillBonusWithProficiency` as `chosenAbilityKey`. The save row records `ability: skillData?.ability?.split(',')[0]` — the **first** ability listed in the codex row. `cleanForSave` preserves that field (`clean-for-save.ts:216-217`), and the sheet passes it back in as `chosenAbilityKey` (`skills-section.tsx:301`).

For any multi-ability skill (`ability: "Agility, Intelligence"`) where the player's highest linked score is not the first-listed ability, **the Skill Bonus the guided creator shows is not the Skill Bonus the sheet shows.** With AGI 0 / INT 3 the creator displays +3 and the sheet displays +0 (plus the unproficient penalty path). The chip label in the creator (`formatGuidedSkillAbilityTag`, `curated-skills.ts:197-203`) is also derived from "highest", so the creator actively tells the player the wrong ability.

The guided creator also offers no way to *choose* the ability, even though the sheet does (`use-sheet-skill-identity-actions.ts:52-53,127`).

**Fix:** persist the ability actually used for display. In `build-creator-skills.ts`, accept the resolved key (or resolve it there with `getHighestLinkedAbilityKey` and the draft abilities) instead of `split(',')[0]`. Longer term, let the guided skills panel expose the ability choice for multi-ability skills, matching the sheet.

### P1-4 · Guided ignores the path's `power_prof_start` / `martial_prof_start`; Advanced honours them

**Where:** `src/lib/guided-creator/build-character.ts:355-356` vs `src/stores/character-creator-store.ts:289-290`.

```355:356:src/lib/guided-creator/build-character.ts
    mart_prof: type === 'martial' ? 2 : type === 'powered-martial' ? 1 : 0,
    pow_prof: type === 'power' ? 2 : type === 'powered-martial' ? 1 : 0,
```

The Advanced creator does `archetype.power_prof_start ?? (type === 'power' ? 2 : …)`. The columns exist in the codex payload (`api/codex/route.ts:380-381`), are editable in admin (`admin-archetype-workspace-save.ts:247-248`), and are displayed to players in the Codex tab (`CodexArchetypesTab.tsx:182-191`). Guided also saves `archetype: { id, type }` only (`build-character.ts:342-344`) whereas Advanced persists the two `*_prof_start` values (`character-creator-store.ts:311-312`).

**Why it matters:** the same codex path produces two different characters depending on which creator was used, and proficiency drives Training Point limits, armament max and innate progression. `archetype-display.ts:212-213` re-derives from codex on load, which masks some of it — which is worse, because the discrepancy is invisible until something reads the stored `mart_prof`/`pow_prof`.

**Fix:** extract the Advanced expression into one shared helper (e.g. `resolveArchetypeProficiencyStart(archetype, type)`) in `lib/game/` and call it from both creators; include the `*_prof_start` fields in the guided `archetype` payload for parity.

### P1-5 · `GuidedChoiceCard`: "See more" / "See less" are unusable by keyboard, and the card is not exposed as an interactive control

**Where:** `src/components/guided-creator/guided-choice-card.tsx:313-318` (container `onKeyDown`), `:354-359` (container element), `:441-460` ("See more"/"See less" buttons), `:332-338` (details button, which *does* stop propagation).

```313:318:src/components/guided-creator/guided-choice-card.tsx
  const handleCardKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.();
    }
  };
```

The expand/collapse buttons only handle `onClick` and do not stop keydown propagation. Pressing Enter or Space while focused on "See more…" bubbles to the container, which calls `preventDefault()` (suppressing the button's synthetic click) and **selects the card instead of expanding it**. The "More details" button is immune only because it has its own `handleDetailsKeyDown` with `stopPropagation()` — the fix pattern is already in the same file, five lines up.

Second defect on the same element: the card root is a `<div tabIndex={0} aria-label=… aria-selected=… onClick=…>` with **no `role`**. `aria-selected` is invalid on a generic element (valid only on `option`/`row`/`tab`/`gridcell`/`treeitem`), so assistive tech announces a focusable group with a label and no selection state or activation semantics. This is the primary choice affordance for path, species, ancestry, feats, equipment and powers — i.e. most of the funnel.

**Fix:** add `onKeyDown={(e) => e.stopPropagation()}` to the expand/collapse buttons (or move the container handler to `onKeyDown` guarded by `e.target === e.currentTarget`). Give the root `role="option"` inside a `role="listbox"` grid wrapper for single-select steps, or `role="checkbox"` + `aria-checked` for multi-select ones; drop `aria-selected` where no valid role applies.

### P1-6 · The whole funnel is gated on auth resolution even though it is guest-friendly

**Where:** `src/app/(main)/characters/new/guided/page.tsx:48-57`, `src/stores/auth-store.ts:27` (`loading: true`).

`GuidedCharacterCreatorInner` renders a full-screen `LoadingState` until `useAuth().loading` is false, and `loading` starts `true` until the Supabase `getSession` round-trip completes in a `useEffect`. The store comment says the creator is "Guest-friendly: persists to localStorage; login required only to save" (`guided-creator-store.ts:15`) — so nothing on the Path step needs the user. Every visitor eats a blank screen for the duration of an auth round-trip on the entry screen of the acquisition funnel.

(One upside of the current shape: because both server and first client render return the same `LoadingState`, the zustand-persist hydration mismatch that would otherwise occur — server has no `localStorage`, client hydrates `currentSubStep` from it — is masked. Any fix must preserve that, e.g. by gating on `useIsClient()` instead and only blocking the Reveal save button on auth.)

**Fix:** render the shell immediately; consume `user` lazily in `RevealStep` (which already handles `!user` with `LoginPromptModal`). Keep a client-only guard so the persisted `currentSubStep` isn't rendered during SSR.

### P1-7 · The character save is fully client-trusted

**Where:** `src/lib/api-validation.ts:95-107`, `src/app/api/characters/route.ts:91-94,151-163`, `src/components/guided-creator/steps/reveal-step.tsx:156-183`.

`characterCreateSchema` validates `name` (1–100 chars), optional `level` (1–20), optional `duplicateOf` UUID — then `.catchall(z.unknown())` accepts the entire rest of the blob, with only a key-count/unsafe-key guard (`isSafeMutationPayload`). Every game-relevant value — `abilities`, `skills`, `archetypeFeats`, `feats`, `powers`, `proficiencies`, `currency`, `healthPoints`, `energyPoints`, `mart_prof`/`pow_prof` — is whatever the client sent. Rate limiting and the per-role character quota are enforced; game legality is not.

For a small startup with a private beta this may be an accepted trade-off, but it means (a) every client-side validation gap in this audit is also a persistence gap, and (b) there is no server-side backstop for P0-1 or P1-1.

**Fix:** add a server-side level-1 legality check for creator-originated characters — ability points spent ≤ budget, skill points spent ≤ budget, archetype feat count = `calculateMaxArchetypeFeats`, exactly 1 character feat, `currency >= 0`, HP+EN allocation = pool. The formulas are already isomorphic and importable (`lib/game/formulas.ts` has no client-only deps).

### P1-8 · Save path can create duplicate characters on a flaky network

**Where:** `src/components/guided-creator/steps/reveal-step.tsx:148-215`.

`createCharacter` is a plain `POST` with no idempotency key. If the request reaches Supabase but the response is lost (mobile handoff, tab throttle, timeout), `apiFetch` rejects → the catch at 207-214 shows "Failed to save character" and re-enables the button → the player clicks again → two characters. The in-flight guard (`if (savedCharacterId || saving) return;` at 153) only protects against double-clicks within one attempt.

Related, same handler: after a successful create, the portrait upload failure path (188-195) shows a toast but leaves the character portrait-less with no retry, and `saving` is deliberately left `true` while the play-together modal is open (203) — if that modal is dismissed by any route other than `dismissPlayTogether`, the Finish button stays permanently disabled.

**Fix:** generate a client-side `crypto.randomUUID()` request id in the draft, send it as an idempotency key, and have the route upsert on it (or check for an existing character with that key before insert). On create failure, surface "retry" vs "check your characters" rather than a bare retry.

### P1-9 · Abilities: once `abilitiesMode === 'recommended'`, a changed recommendation is displayed but never saved

**Where:** `src/components/guided-creator/steps/abilities-step.tsx:97-100,111-115`.

```111:115:src/components/guided-creator/steps/abilities-step.tsx
  useEffect(() => {
    if (!recommended || customizing || draft.abilitiesMode === 'custom') return;
    if (draft.abilitiesMode === 'recommended') return;
    updateDraft({ abilities: recommended, abilitiesMode: 'recommended' });
  }, [recommended, customizing, draft.abilitiesMode, updateDraft]);
```

`displayAbilities` (97-100) renders the freshly computed `recommended`, but the write-back refuses to run once mode is `'recommended'`. `recommended` is *not* stable: `resolveGuidedRecommendedAbilities` (`build-character.ts:392-410`) returns the path's `recommended_abilities` when `pathData` is loaded and falls back to `buildSuggestedAbilityArray(1, primary, secondary)` when it isn't. On a hard refresh that lands directly on the Abilities step with `abilitiesMode` unset, the effect writes the *fallback* array during the codex fetch window and locks mode to `'recommended'`; when `pathData` arrives, the panel shows the path array while `draft.abilities` keeps the fallback. **What the player sees is not what gets saved.**

**Fix:** don't store the recommendation at all. Derive `abilities` at save time from `abilitiesMode` (`'recommended'` → recompute from `pathData`, `'custom'` → the stored point-buy), and gate the whole step on `pathData` being resolved when `archetypePathId` is set (`useGuidedPathData` already exposes `isLoading`; `AbilitiesStep` ignores it).

### P1-10 · Character feat is silently auto-selected for the player

**Where:** `src/components/guided-creator/steps/character-feat-step.tsx:67-73`.

```67:73:src/components/guided-creator/steps/character-feat-step.tsx
  useEffect(() => {
    if (draft.characterFeatIds.length > 0) return;
    const firstGroup = characterFeatGroups[0];
    if (firstGroup?.feats?.[0]) {
      updateDraft({ characterFeatIds: [String(firstGroup.feats[0])] });
    }
  }, [characterFeatGroups, draft.characterFeatIds.length, updateDraft]);
```

The first feat in the first guidance group is written into the draft on arrival, with no requirement check (`checkFeatRequirements` is applied to the L2/L3 catalog but not to this write, and not to the L1 card `onSelect` at `:205`). The step's `completionHint` then reads "1 / 1" and Continue is enabled, so a first-time player who taps Continue has made a choice they were never shown making — on the step titled "Who you are beyond the fight". If the path's first character feat has unmet requirements, the character is saved with an illegal feat.

The powers/techniques step has the same soft-seed behaviour (`use-powers-techniques-selection.ts:106-179`), but there it is TP-budget-aware and the step title frames it as recommendations, so it reads as intentional; this one does not.

**Fix:** either drop the auto-pick and let `canContinue` do its job (the step already has a `0 / 1` hint), or keep it but (a) filter through `checkFeatRequirements` with `requirementCharacter`, and (b) mark the card as pre-selected in the copy. L1 feat cards in both feat steps should also reject requirement-failing selections, matching the catalog.

---

## 3. P2 — maintainability, duplication, perf

### P2-1 · Three no-op abstractions still carry their full call-site cost

- `canCompleteEquipmentPhase` (`equipment-phase-nav.ts:121-128`) is `void phase; void ctx; return true;`. `LoadoutStep` builds a memoised 5-field `phaseCompletion` context for it (`loadout-step.tsx:154-171`) and `canNavigateToEquipmentPhase` (`:142`) branches on it. Everything that feeds it is dead weight, and the name asserts a guarantee the funnel does not have (see P1-1).
- `resolveForwardLandingPhaseIndex` (`ancestry-forward-landing.ts:16-23`) is `void tasks; void draft; return 0;` — plus an exported constant `ANCESTRY_DEEP_ENTRY_OVERVIEW_SKIP_PHASE_INDEX` that exists only so a test can assert the function does *not* return it (`ancestry-forward-landing.test.ts:53`). Three tests guard a function that ignores both arguments.
- `isFirstEquipmentPhase` (`equipment-phase-nav.ts:92`) has no callers at all.

**Fix:** delete all three; inline `phaseIndex === 0` where the ancestry landing constant is needed, and let `visiblePhases[0] === current` stand in for `isFirstEquipmentPhase` if it is ever needed again.

### P2-2 · Every step subscribes to the whole store, and heavy memos key off the whole `draft`

Every step and the shell call `useGuidedCreatorStore()` with no selector — `guided-creator-shell.tsx:51,114`, `path-step.tsx:67`, `species-step.tsx:36`, `ancestry-step.tsx:91-99`, `abilities-step.tsx:34`, `skills-step.tsx:49`, `archetype-feats-step.tsx:57`, `character-feat-step.tsx:40`, `loadout-step.tsx:71-78`, `powers-techniques-step.tsx:72`, `reveal-step.tsx:71`, `guided-health-energy-section.tsx:27`, `guided-portrait-upload.tsx:15`. In zustand v5 that re-renders on any state change.

`updateDraft` (`store:355-362`) always produces a new `draft` object, and several expensive memos depend on `draft` (the whole object) rather than the fields they read: `ancestry-step.tsx:110-113` (`resolveGuidedSpeciesContext`), `:422-431` (`ancestryComplete`), `reveal-step.tsx:105-108`, `guided-reveal-summary.tsx:67-70,77-100,149-168`, `character-preview-panel.tsx:58-61`, `loadout-step.tsx:228-231`, `character-feat-step.tsx:88-91`, `archetype-feats-step.tsx:96-99`.

Net effect on the Reveal step: **each keystroke in the name/age/appearance/background fields rebuilds the entire build summary** — species context, ancestry trait chips, skill chips, feat chips, equipment lookup + resolved loadout, power/technique chips — plus the preview strip and the chapter rail. Two `localStorage` writes per keystroke as well (`updateDraft` then persist).

**Fix:** field-level selectors (`useGuidedCreatorStore((s) => s.draft.name)`) or `useShallow` for multi-field reads; narrow the memo dependency arrays to the fields actually consumed; debounce the free-text Reveal fields before they reach the store.

### P2-3 · The equipment catalog is built twice per Loadout render

`LoadoutStep` calls `useGuidedEquipmentCatalog(...)` (`loadout-step.tsx:95-100`) and its child `GuidedEquipmentL1Phase` calls it again with the same inputs (`guided-equipment-l1-phase.tsx:97-101`). `buildEquipmentCatalogRows` runs `calculateItemCosts` + `resolveItemTrainingPoints` for every official item *and* every codex equipment row (`equipment-catalog-rows.ts:87-110`), so the whole item catalog is costed twice. `use-guided-equipment-l2-catalog.ts:6-7` documents "callers pass the base result so the catalog is built once per step" — the L1 child is the one place that didn't get the memo.

**Fix:** pass `catalog` / `itemProperties` / `rules` down as props (the component already receives `officialItems` and `codexEquipment`).

### P2-4 · No virtualization on the L3 inline catalogs

`UnifiedSelectionModalList` renders `filteredItems.map(...)` with no windowing (`src/components/shared/unified-selection-modal-list.tsx:66`), and `GuidedInlineCatalogList` renders it inline in the step body. In Custom (L3) mode the powers/techniques step (`powers-techniques-step.tsx:555-586`), the feats steps, and the loadout phases all mount the full eligible catalog as `GridListRow`s with expandable detail sections. On a 360px phone this is the heaviest thing in the funnel.

**Fix:** virtualize `UnifiedSelectionModalList` (one change, benefits every catalog in the app), or cap the inline list with a "show more" pager.

### P2-5 · `getTotalSkillPoints` and `getArmamentMax` are called without `rules` in the funnel but with `rules` elsewhere

- `skills-step.tsx:120` — `getTotalSkillPoints(level, 'character')`; the function takes no `rules` parameter at all (`skill-allocation.ts:122-131`) while the *costs* are rules-driven via `resolveSkillAllocationRules(rules)` two lines up. Half the skill economy is configurable, half is a constant.
- `archetype-feats-step.tsx:75` — `calculateMaxArchetypeFeats(1, draft.archetypeType ?? undefined)` with no `rules`, so a `core_rules.ARCHETYPES.martialBonusFeatsBase` override is ignored on the step that enforces the feat count.
- `equipment-eligibility.ts:104` — `getArmamentMax(ctx.archetypeType ?? 'power')` with no `rules`, while `guided-path-detail-overview.tsx:57` renders "Your Armament Proficiency is N" using `getArmamentMax(pathType, rules)`. If `core_rules` overrides it, the number shown in the path detail modal is not the number the catalog filters on.

**Fix:** thread `rules` through all three (the guided steps already hold `useGameRules()`), and give `getTotalSkillPoints` a `rules` parameter for consistency with the rest of `skill-allocation.ts`.

### P2-6 · Reveal summary omits innate powers and purchased gear

`guided-reveal-summary.tsx:181-195` maps `draft.powerIds` only; `draft.innatePowerIds` never appears in the "Your build" summary even though it is saved (`build-character.ts:249-260`) and counted in the Health/Energy auto-allocate (`guided-health-energy-section.tsx:62`). `loadoutItems` deliberately omits `draft.equipment` (`:159`). So the last screen before "Create character" under-reports the build the player is about to commit to. `CharacterPreviewPanel`'s `powerTechniqueCount` (`character-preview-panel.tsx:125`) has the same omission.

**Fix:** include `innatePowerIds` (flagged as innate) in `powerChips` and add a Gear section, or state explicitly in the copy what the summary covers.

### P2-7 · Cross-tab draft clobbering

The persisted key is a single `guided-creator-storage` (`store:379`) with no `storage` event listener and no cross-tab coordination. Two guided-creator tabs silently overwrite each other on every `updateDraft`. This is reachable in normal use: the Species and Loadout steps both open sibling creators in new tabs (`species-step.tsx:88-92`, `loadout-step.tsx:294-298`), which trains the "open in a new tab" habit.

**Fix:** at minimum, subscribe to `window.addEventListener('storage', …)` and warn; better, take a soft lock (a tab id written into the persisted state) and offer "resume here / start fresh".

### P2-8 · localStorage quota failures are unhandled

`compressPortraitBlobForDraft` caps the portrait data URL at 700 KB (`lib/portrait.ts:31`), which is stored in the persisted draft (`guided-portrait-upload.tsx:22`). zustand's persist calls `storage.setItem` synchronously right after `set(...)` (`node_modules/zustand/middleware.js:360-379`) with no try/catch, so a `QuotaExceededError` propagates out of `updateDraft` into the event handler. The in-memory state update has already happened, so the UI looks fine — but the write is lost, and on the next refresh the player silently rolls back to the last successful write. Note `createJSONStorage` *does* guard storage being unavailable entirely (Safari private mode), so this is specifically the quota case.

**Fix:** wrap `setItem` (custom `storage` adapter with try/catch) and surface a real message — "we couldn't save your progress locally, finish in this tab" — rather than failing silently.

### P2-9 · Three components over 400 LOC and one 600-LOC step

`powers-techniques-step.tsx` (600), `ancestry-step.tsx` (551), `loadout-step.tsx` (491), `guided-choice-card.tsx` (463), `guided-equipment-l2.ts` (474), `guided-skills-panel.tsx` (445).

`ancestry-step.tsx` is the one that needs it most: four `useEffect`s that write to the store or reset phase state (`:174-177`, `:179-197`, `:199-216`, `:218-244`), two `useRef` latches (`phaseInitialized`, `lastEntryNonce`) plus a render-time state adjust (`:168-172`), and the pick/validation logic inline. `powers-techniques-step.tsx` mostly delegates (selection hook + L1 content component) but still holds 12 `useMemo`s and both L2 and L3 branches.

**Fix:** for Ancestry, lift phase progression into a `useAncestryPhase(tasks, draft, …)` hook returning `{ phaseIndex, next, back }` and move the auto-fill writes (single-size, ≤2 mixed skills) into the draft-patch builders that already own species changes (`species-selection-draft.ts`), so they happen once at selection time instead of continuously in effects.

### P2-10 · `useEffect` write-backs that should be derived (full list, as requested)

| Location | Writes | Should be |
|---|---|---|
| `abilities-step.tsx:111-115` | `abilities`, `abilitiesMode` | derived at save from `abilitiesMode` (P1-9) |
| `character-feat-step.tsx:67-73` | `characterFeatIds` | explicit user choice (P1-10) |
| `ancestry-step.tsx:179-197` | `selectedSpeciesSkillIds` (auto-fill when ≤2 options) | part of `buildGuidedMixedSpeciesDraftPatch` |
| `ancestry-step.tsx:199-216` | `selectedSize` (auto-fill when 1 option) | already done for single species in `buildGuidedSingleSpeciesDraftPatch:40`; extend to mixed |
| `ancestry-step.tsx:218-244` | `phaseIndex` local state | derived from `navigationIntent` + task fill state |
| `loadout-step.tsx:300-305` | `equipmentPhase` (clamp to visible) | derived: `visiblePhases.includes(phase) ? phase : visiblePhases[0]` at read time |
| `loadout-step.tsx:312-319` | `equipmentPhase` (entry landing) | keep, but see below |
| `loadout-step.tsx:322-356` | re-bucket + prune loadout refs; compares with `JSON.stringify` | derived view over `draft` + `equipmentLookup`, persisted only on Continue |
| `use-powers-techniques-selection.ts:106-179` | `powerIds` / `innatePowerIds` soft-seed | keep (intentional), but move the two `useRef` latches into the store so it survives a remount |
| `use-powers-techniques-selection.ts:182-203` | `powerIds` (innate/regular exclusivity) | enforce in the toggle reducers, which already do it (`:236-239`, `:278-283`) — this is a redundant safety net |

`loadout-step.tsx:322-356` deserves a specific call-out: it re-derives buckets on every draft change and uses three `JSON.stringify` comparisons to decide whether to write back. That is an equality check by serialisation inside an effect that itself triggers on the value it writes — the loop is only broken by those string compares.

### P2-11 · Dead / unused exports

| Symbol | Location | Status |
|---|---|---|
| `isFirstEquipmentPhase` | `equipment-phase-nav.ts:92` | no callers |
| `canNavigateToEquipmentPhase` | `equipment-phase-nav.ts:130` | test-only |
| `resolveLoadoutItems` | `resolve-loadout-items.ts:106` | test-only |
| `groupResolvedItemsByCategory` | `resolve-loadout-items.ts:246` | test-only |
| `loadoutDraftFromSelection` | `resolve-loadout-items.ts:141` | test-only (quick kits removed from DB) |
| `flattenGuidedDraftSelections` | `loadout-tp.ts:94` | exported, internal-only |
| `gearShortUseForRef` | `equipment-catalog-rows.ts:165` | no callers |
| `GUIDED_SUBSTEP_LABELS` | `guided-creator-store.ts:110` | no callers |
| `getChapterForSubStep` | `guided-creator-store.ts:123` | no callers |
| `truncateAtWord`, `COMPACT_PREVIEW_LEN` | `guided-text.ts:6,20` | no callers (superseded by CSS line-clamp) |
| `GuidedEquipmentFactChips`, `GuidedEquipmentFactChipsProps` | `guided-equipment-fact-chips.tsx:31-32` | self-documented `@deprecated` alias |
| `ANCESTRY_DEEP_ENTRY_OVERVIEW_SKIP_PHASE_INDEX` | `ancestry-forward-landing.ts:14` | exists only for a negative test assertion |
| `steps.skills.applyRecommended` / `applyRecommendedHint` | `guided-creator-copy.ts:280-281` | unused copy |
| `steps.reveal.heroUnnamed` | `guided-creator-copy.ts:515` | unused copy |
| `steps.reveal.loginModal.*` | `guided-creator-copy.ts:568-573` | unused (`LoginPromptModal` owns its own copy) |
| `steps.loadout.unresolvedItem` (×2) | `guided-creator-copy.ts:350,382` | duplicated key, both unused |

### P2-12 · The whole codex is fetched into the client for the funnel

Every codex hook shares one `['codex']` query (`use-codex.ts:33-134`) whose payload is *all* reference data: feats, skills, species, traits, parts, properties, equipment, archetypes, archetype levels, creature feats and core rules (`api/codex/route.ts:51-79,431-444`). The guided creator needs archetypes, species, traits, skills, feats, equipment, properties and parts — so it is close to needing the whole thing anyway — but `creatureFeats` and the full `parts` list are pure ballast, and there is no field selection (`select('*')` on ten tables). `staleTime: 5min`, `gcTime: 30min` and shared caching are correct; the payload size is the issue.

**Fix:** a `?scope=creator` variant that omits `creatureFeats` and narrows columns, or move the archetype/species/starter data into the RSC layer and hydrate the query cache.

### P2-13 · Unnecessary client boundary on the route

`src/app/(main)/characters/new/guided/page.tsx:8` marks the entire route `'use client'`. The page shell (`GuidedCreatorPageShell`, `CreatorFunnelHero`, the "choose another way" link) is static, and the entry-mode bootstrap could be a server-side `searchParams` read plus a redirect instead of a client `useEffect` + `router.replace` (`:34-43`). Small win, but it is the funnel's entry point and it currently ships the whole creator tree as client JS with no server-rendered shell.

### P2-14 · Error handling is missing on every catalog fetch in the funnel

No step reads `isError` from any query. `path-step.tsx:68`, `species-step.tsx:37`, `ancestry-step.tsx:100-103`, `skills-step.tsx:51-52`, `loadout-step.tsx:80-82`, `powers-techniques-step.tsx:94-115`, `reveal-step.tsx:73-85` all destructure `data = []` with an empty-array default. A failed `/api/codex` (500, offline, RLS misconfiguration) therefore renders as "No paths available / No species available / No Feat recommendations" — an empty *content* state, not a *failure* state, with no retry. `GuidedInlineCatalogList` accepts an `error` prop (`guided-inline-catalog-list.tsx:58`) that no guided caller passes.

**Fix:** one shared `<GuidedStepError onRetry={refetch} />` and an `isError` branch in each step; pass `error` through to `GuidedInlineCatalogList` where it already exists.

---

## 4. P3 — nits

- `powers-techniques-step.tsx` never passes `canContinue` to `GuidedStepLayout`, so it defaults to `true` (`guided-step-layout.tsx:39`) — the only step with no gate. Probably intentional (picks are optional), but it reads as an omission next to nine gated siblings; make it explicit with `canContinue`.
- `reveal-step.tsx:183` sends `userId: user.uid` in the payload; the route derives the owner from the session and stores the field in the JSON blob as dead data.
- `powers-techniques-step.tsx:478` borrows the Skills step's `continueLabel` ("Looks good →") for the Powers step.
- `guided-creator-copy.ts:42-50` still documents a "Legacy" chooser mode; verify against the actual chooser at `/characters/new`.
- `curated-skills.ts:272` uses `limit = 48` for suggestion cards; the `minSuggestions` break (`:324`) only applies *after* a whole tier is added, so a broad primary ability can render 15–20 suggestion cards under the skills list.
- `skills-step.tsx:338` does `codexSkills.find(...)` inside the render map (O(n·m)); `skillMeta` is already a `Map` two blocks up.
- `equipment-currency.ts:17` hardcodes `GUIDED_GEAR_L2_MAX_UNIT_COST = 50`; the copy at `guided-creator-copy.ts:406` restates "50 Currency or less" via the constant (good), but the cap itself is not rules-driven like other caps.
- `guided-choice-card.tsx:293-311` carries ~20 lines of comments to explain `keepBodyFloor` / `showActionRow` layout heuristics. Worth extracting into a named helper with the comment as its docstring.

---

## 5. What is genuinely good (for coverage confidence)

- **Helper extraction.** 31 pure modules with 193 tests, and the split is principled: navigation (`guided-substep-nav`), landing (`guided-deep-entry-landing`), draft patches (`path-selection-draft`, `species-selection-draft`), eligibility (`equipment-eligibility`), budgets (`loadout-tp`, `equipment-currency`), catalog builders (`feats-l2`, `powers-techniques-l2`, `guided-equipment-l2`). This is why most of the findings above are one-line fixes in a named function rather than surgery.
- **One validated-apply path for equipment.** `applyGuidedEquipmentL2Refs` (`guided-equipment-l2.ts:383`) is shared by the L2 modal's batch confirm and the L3 inline toggle/quantity handlers, so hand-slot and TP rules cannot diverge between modal and inline. The currency gap (P1-1) is a missing rule inside that function, not a parallel implementation.
- **Shared calculators at the save boundary.** `build-character.ts` calls `calculateMaxHealth`, `calculateMaxEnergy`, `buildRequiredProficiencies`, `buildCreatorSkillSaveRows`, `applyStarterEquippedFlags`, `dedupeEntityRefs` — no local re-implementation of HP/EN/proficiency math. `build-creator-skills.ts` exists specifically so that proficient-at-0 skills survive `cleanForSave`, and its docstring says so.
- **Loadout ref reconciliation.** `pruneUnresolvedLoadoutRefs` + `rebucketLoadoutByLookup` handle stale ids and armor mis-bucketed into `armaments[]`. This is the pattern the skills step needs (P0-2).
- **Persistence migrations are taken seriously.** Schema v11 with sequential migrations plus a defensive `merge` that re-validates types field-by-field (`store:559-601`). The gap is behavioural (progress vs draft skew), not structural.
- **Modal a11y baseline is solid.** `Modal` implements focus-in-on-open, a real tab trap, focus restore on close, Escape, `role="dialog"`, `aria-modal`, and `fullScreenOnMobile` (`modal.tsx:118-167,199-216`) — and the guided deep-dive modals opt into it.
- **Copy is centralised and well-written for a first-time player.** `guided-creator-copy.ts` is one file, parameterised where it needs live numbers, and the prose is genuinely player-facing ("Spend 3 more Skill Points to continue", "Flaws add depth, and grant an extra ancestry trait"). Steps import from it rather than inlining strings.
- **Touch targets and semantic tokens are consistently applied.** `min-h-11` on interactive chrome throughout, `*-fg` status tokens rather than numbered ramps + ad-hoc `dark:`, and single-column grids below `sm` so 360px works.
- **Deliberate loading-order defence.** `loadout-step.tsx:307-319` explicitly waits for catalogs before consuming `entryNonce`, with a comment explaining that a cold cache would otherwise collapse `visiblePhases` to `['gear']` and lock the player onto the Equipment phase. That is the right instinct; it just was not applied to the Abilities step (P1-9).

---

## 6. Missing tests, ranked by risk

| # | Critical path | Current coverage | Proposed test |
|---|---|---|---|
| 1 | Rail jump after upstream data is cleared | none | store test: complete all steps → apply `buildPathSelectionDraftPatch` → assert `canNavigateToSubStep('reveal') === false` |
| 2 | Reveal save gate | none | pure `isGuidedDraftSaveable(draft)` extracted from `canSave`, tested against gutted drafts (no feats / no skills / unspent ability points) |
| 3 | Currency ceiling on weapons + armor | `guided-equipment-l2.test.ts` covers TP and gear budget only | `applyGuidedEquipmentL2Refs('weapon', …)` with refs costing > 200 → `ok: false` |
| 4 | Skills step with an unresolvable id | none | `SkillsStep` reconciliation helper: `{ '999': 0 }` + codex without 999 → id pruned, `remainingPoints` reaches 0 |
| 5 | Mixed-species required skills gate | `ancestry-pick-tasks.test.ts` covers task *construction* only | pure `canContinueAncestryPick(task, draft, optionCount)` extracted from `footerCanContinue`, asserting the `mixed-species-skills` case |
| 6 | Skill contributing-ability round-trip | none | `buildCreatorSkillSaveRows` + sheet `getSkillBonus` on a two-ability skill → same number as `GuidedSkillsPanel` |
| 7 | Archetype proficiency parity | `build-character.test.ts` (12 tests) does not assert `mart_prof`/`pow_prof` against `*_prof_start` | table test: guided vs advanced payload for the same codex archetype |
| 8 | Store migrations v1→v11 | 2 tests, both `resetCreator` | one fixture per historical version → assert the migrated draft is structurally valid |
| 9 | Happy path e2e | 4 screenshot audits, separate configs, not in `verify` | Playwright: guest → path → species → ancestry → abilities → skills → feats → loadout → powers → name → save; assert the sheet renders the same numbers |
| 10 | a11y + 360px baselines for the funnel | guided routes absent from `tests/visual/{a11y,screenshots}.pw.ts` | add `/characters/new/guided` (and one mid-flow state) to both baselines |
| 11 | `GuidedChoiceCard` keyboard behaviour | none | RTL: focus "See more…", press Enter → expands and does **not** select |
| 12 | Catalog fetch failure | none | mock `/api/codex` 500 → each step shows an error + retry, not an empty state |

---

## 7. What I'd fix first to protect the funnel

1. **Invalidate `completedSubSteps` when upstream draft data is cleared, and make Reveal's `canSave` a real completeness predicate** (P0-1). One store action + one extracted pure function; closes the "save a gutted character" hole and the rail-bypass class of bugs at once.
2. **Reconcile the persisted draft against the live codex on entry to each step** — start with `draft.skills` in the Skills step, reusing the loadout's prune pattern (P0-2). Removes the only unrecoverable dead-end.
3. **Enforce the Currency ceiling in `applyGuidedEquipmentL2Refs` for all three phases and clamp the saved `currency` at 0** (P1-1). One function; stops corrupt currency reaching the sheet.
4. **Fix `GuidedChoiceCard` keyboard + roles** (P1-5). Two small edits to the component every step depends on; without it the funnel is not keyboard-completable.
5. **Add the happy-path e2e and put the guided route into the a11y/visual baselines** (missing tests #9, #10). Everything above is a one-line regression away from returning, and right now nothing in `npm run verify` would notice.

Runner-up, worth scheduling immediately after: **stop storing the ability recommendation** (P1-9) and **share one proficiency-start resolver between the two creators** (P1-4) — both are cheap, and both are cases where the character the player was shown is not the character that got saved.
