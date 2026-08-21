# Audit 09 — Character Sheet & Live Play

**Date:** 2026-08-13 · **Mode:** independent, read-only · **Verified in code** (docs not trusted)

**Scope read:** `src/components/character-sheet/**` (all files + its 5 test files), `src/lib/character/**`,
`src/components/character/**`, `src/components/rolls/**`, `src/components/encounters/**`,
`src/app/(main)/characters/[id]/**`, `src/app/(main)/encounters/[id]/**`,
`src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx`,
plus the persistence chain (`services/character-service.ts`, `lib/data-enrichment/clean-for-save.ts`,
`lib/character-save.ts`, `lib/api-validation.ts`, `lib/api-client.ts`, `lib/rate-limit.ts`,
`hooks/use-auto-save.ts`, `hooks/use-character-resource-sync.ts`,
`lib/encounter/character-resource-sync.ts`, `api/characters/[id]/route.ts`,
`api/campaigns/[id]/rolls/route.ts`, `api/campaigns/[id]/characters/[userId]/[characterId]/route.ts`,
`api/encounters/[id]/route.ts`) and the rules engine (`lib/game/**`, `lib/calculators/**`).

---

## 1. Executive summary

The sheet is architecturally well-factored (context instead of prop bags, hooks split by domain,
read-only campaign view reuses the same body — no parallel fork). The problems are almost entirely
in **two places**: (a) the persistence contract, and (b) numbers that the sheet computes locally
instead of asking the rules engine.

**Persistence is the highest risk.** Every save is a **full-object last-write-wins PATCH** of the
entire `data` JSONB, there is **no version/`updated_at` guard**, incoming realtime updates merge
**only HP/EN/AP** (everything else is discarded), a **failed save is never retried**, and the write
endpoint is rate-limited **per IP at 30/min** while the sheet emits **two independent PATCH streams**
(400 ms resource sync + 2 s full autosave) on *every* character mutation — including keystrokes in
the name field. Two tabs, a flaky connection, a shared household IP, or a stale tab left open are all
sufficient to silently lose or roll back a player's inventory/level/HP.

**Numbers second.** 14 places re-implement a formula that already exists in `lib/game/**` (or
implement a rules formula that exists nowhere else). Two of them are **provably wrong today**: the
Attack Bonuses table shows the unproficient bonus as the *full* ability score instead of half
(`archetype-section.tsx:84`), and the sheet's skill-point budget is `2 + 3×level` while the creator
and the level-up modal use `3×level` — so a character who finishes creation fully spent shows
"2 unspent points" and a pulsing red dot on the sheet.

**Live play** is safer than expected on the authorization axis: encounters are strictly GM-owned
(`api/encounters/[id]/route.ts:32,90`), roll writes are validated against the campaign roster
server-side (`api/campaigns/[id]/rolls/route.ts:184-193`) and the displayed name comes from the
roster, not the client. One real leak: `?scope=encounter` skips the `visibility === 'private'` check,
so any campaign member can read another member's HP/abilities.

**Counts:** 3 P0 clusters (6 findings) · 11 P1 · 18 P2 · 4 P3 · 14-row formula-duplication table ·
0 tests covering autosave, `cleanForSave`, resource sync, recovery, level-up application, or rolls.

| Severity | Count | Theme |
|---|---|---|
| P0 | 6 | Full-object LWW PATCH, no retry on failure, IP rate-limit + double write, suppression window drops GM HP, no request timeout |
| P1 | 11 | Wrong attack bonus, skill-budget mismatch, unvalidated level-down, roll log renders above modals, notes-tab a11y, scope=encounter leak |
| P2 | 18 | Full-sheet recompute per HP tick, formula drift, 5 files >400 LOC, legacy-creator coupling |
| P3 | 4 | Legacy alias writes, raw `x-forwarded-for`, dead `SKILL_LIMITS`, no unload flush |

---

## 2. Save-path table

Every row below writes through the same endpoint. `cleanForSave` copies **all 50 allow-listed fields**
(`clean-for-save.ts:14-64,92-100`), so "field-level" edits are in fact whole-character writes.

| Edit | Where handled | Persistence mechanism | Failure handling | Race risk |
|---|---|---|---|---|
| HP / EN (header steppers, `+5`/`-3` input) | `use-sheet-resource-actions.ts:49-69` → `withSyncedResourceFields` | **Two writes**: resource-only PATCH @400 ms (`use-character-resource-sync.ts:31-33` → `character-resource-sync.ts:149-164`) **and** full-object PATCH @2 s (`use-character-sheet-page-data.ts:248-260`) | Resource PATCH: `.catch(() => {})` — **silent** (`character-resource-sync.ts:161`). Autosave: toast only, **no retry** (`use-auto-save.ts:94-96`) | **High.** Full PATCH clobbers any concurrent GM HP edit; local edit opens a 1.6 s window where the GM's realtime echo is dropped (`character-resource-sync.ts:24-32`) |
| AP | `use-sheet-resource-actions.ts:71-83` (clamped 0–10) | same dual write | same | same |
| Spend Energy (Use Power/Technique) | `use-sheet-library-actions.ts:90-101,134-145` | full autosave only; sets top-level `currentEnergy` but **not** nested `energy.current` | none | Encounter tracker reads top-level first (`character-resource-sync.ts:46-49`) so display is OK, but the two representations diverge in local state until the next `cleanForSave` |
| Inventory add / remove / equip / quantity | `use-sheet-library-actions.ts:147-381` | full-object autosave @2 s | toast, no retry | **High — realtime merge ignores `equipment` entirely** (`character-resource-sync.ts:57-68`). Tab B never learns about Tab A's inventory change and overwrites it on its next save |
| Powers / techniques add / remove / innate toggle | `use-sheet-library-actions.ts:39-145` | full-object autosave | toast, no retry | same as inventory |
| Feats add / remove / uses / level-swap, trait uses, State uses | `use-sheet-feat-actions.ts:62-414` | full-object autosave | toast, no retry | same |
| Skills (prof toggle, value, ability, sub-skill add/remove) | `use-sheet-skill-identity-actions.ts:39-144` | full-object autosave | toast, no retry | same |
| Abilities / defenses / Temp Modifiers | `use-sheet-resource-actions.ts:156-202` | full-object autosave | toast, no retry | same |
| Recovery (full / partial) | `use-sheet-resource-actions.ts:252-398` | full-object autosave; single `setCharacter` so local state is atomic | toast, no retry | Resets HP/EN/feat uses/conditions in one object → a 429 or dropped request loses the whole recovery |
| Level up / down | `use-sheet-resource-actions.ts:400-426` + `use-character-sheet-page.ts:97-114` | full-object autosave (2 s) | toast, no retry | **Not transactional against the server.** Tab close inside 2 s loses the level. Path-proficiency is applied by a *second*, independent code path during render (`use-character-sheet-page-data.ts:216-246`) |
| Archetype / species edit | `use-sheet-skill-identity-actions.ts:178-223` | full-object autosave | toast, no retry | Replaces archetype+abilities+prof with no re-validation of dependent feats/powers/proficiencies |
| Notes (general + named) | `build-library-section-data.ts:94-120` | full-object autosave (fires on every keystroke → 2 s debounce) | toast, no retry | Two tabs editing different notes: last writer wins the whole `namedNotes` array |
| Name / XP | `use-sheet-resource-actions.ts:85-99` | full autosave **plus** a resource PATCH per keystroke burst (the resource-sync effect keys on the whole `character` object, `use-character-resource-sync.ts:34-37`) | as above | Burns the 30/min IP budget while typing |
| Portrait | `use-sheet-resource-actions.ts:101-154` | **explicit** `saveCharacter(id, { portrait })` — the only genuine partial PATCH | sets `error` state | Low; but autosave's baseline isn't updated, so the next autosave re-sends everything |
| Visibility / speed unit (settings modal) | `use-character-sheet-page-ui.ts:82-126` | explicit `saveCharacter(id, cleanForSave(next))` — full object built from a **stale closure** over `character` | unhandled promise rejection (no try/catch at `:87` and `:104`) | Payload can be older than autosave's in-flight snapshot → resurrects overwritten values |
| Proficiencies (auto-sync on load) | `use-sheet-auto-proficiencies.ts:109-133` | mutates state on mount → triggers autosave | toast for over-TP only | **Merely opening a sheet writes.** A stale tab left open on a phone will PATCH its whole stale character |
| Path proficiency at L5+ | `use-character-sheet-page-data.ts:216-246` (render-phase `setCharacter`) | triggers autosave | none | same as above |
| Encounter (combatants, HP, initiative, round, conditions) | `use-combat-roster-actions.ts` / `use-combat-round-actions.ts` | full-object autosave @1.5 s (`encounters/[id]/combat/page.tsx:55-72`) | toast, no retry | GM-owned single writer, so low; PATCH is also read-modify-write (`api/encounters/[id]/route.ts:107-108`) |
| Personal roll log | `roll-context.tsx:101-106` | `localStorage['realms-roll-log']`, last 20 | try/catch swallow | **One global key for all characters and all tabs** — logs bleed across sheets and tabs overwrite each other |
| Campaign roll log | `roll-context.tsx:117-132` → `api/campaigns/[id]/rolls` POST | server insert + trim, roster-validated | `.catch(() => {})` — **roll silently missing from the shared log** | Ordering ties broken by random UUID (`route.ts:105-107,211`) |

---

## 3. P0 — data loss / corruption

### P0-1 · Full-object last-write-wins PATCH with no concurrency guard
`src/app/api/characters/[id]/route.ts:146-157`

```146:157:src/app/api/characters/[id]/route.ts
    const currentData = (existing.data as Record<string, unknown>) ?? {};
    const mergedData = { ...currentData, ...cleanedData };
    normalizeCharacterForSave(mergedData);
    const archetypeNameById = await fetchArchetypeNameMap(supabase);
    const listCols = getCharacterListColumns(mergedData, { archetypeNameById });

    const { error: updateErr } = await supabase
      .from('characters')
      .update({ data: mergedData, ...listCols })
      .eq('id', id.trim())
      .eq('user_id', user.uid);
```

The spread *looks* like a merge, but the client always sends the whole character
(`clean-for-save.ts:92-100` copies all 50 `SAVEABLE_FIELDS`; `use-character-sheet-page-data.ts:252`
calls `cleanForSave(data)` on the entire object), so every top-level key is overwritten. There is no
`updated_at`/version precondition and no conflict response.

The client cannot self-heal either: the realtime subscription only merges resources —
```195:204:src/app/(main)/characters/[id]/use-character-sheet-page-data.ts
        (payload: { new: { id: string; data?: Record<string, unknown> } }) => {
          const data = payload.new?.data;
          if (!data) return;
          const charId = payload.new.id;
          if (shouldSuppressRemoteResourceMerge(charId)) return;
          setCharacter((prev) => {
            if (!prev || prev.id !== charId) return prev;
            return mergeResourceUpdatesIntoCharacter(prev, data) ?? prev;
          });
        },
```
and `mergeResourceUpdatesIntoCharacter` returns `null` for anything that isn't HP/EN/AP
(`character-resource-sync.ts:61-68`). Inventory, feats, skills, level, notes changes made elsewhere
are never pulled in, so the older tab's next autosave reverts them.

**Why it matters:** two tabs (phone + laptop is the normal TTRPG setup), or one stale tab, silently
destroys inventory/level/feat changes. In live play the GM's encounter HP edits are the concurrent
writer (`character-resource-sync.ts:166-169`).

**Fix:** (1) send only changed keys — keep a dirty-key set in `useAutoSave` and PATCH that subset;
(2) add optimistic concurrency: client sends the `updatedAt` it loaded, the route adds
`.eq('data->>updatedAt', expected)` (or a dedicated `version int`) and returns **409** on mismatch;
(3) on 409, refetch and re-apply the local dirty keys, or prompt; (4) extend
`mergeResourceUpdatesIntoCharacter` into a general "remote wins for keys I haven't touched" merge.

### P0-2 · A failed save is never retried — the edit is simply lost
`src/hooks/use-auto-save.ts:94-96`, `:152-154`

```94:96:src/hooks/use-auto-save.ts
    } catch (err) {
      onSaveError?.(err instanceof Error ? err : new Error('Save failed'));
    } finally {
```
The only place a save is scheduled is the data-change effect (`:149-154`). If `performSave` throws
(offline, 429, 500, DNS blip), nothing re-arms the timer; `initialDataRef` stays at the old baseline
so `hasUnsavedChanges` remains `true` forever, but no further attempt is made unless the user
happens to edit again. The sheet's handler only shows a toast:
```257:259:src/app/(main)/characters/[id]/use-character-sheet-page-data.ts
    onSaveError: () => {
      showToast('Failed to save character', 'error');
    },
```
Mid-combat on mobile (tunnels, elevators, patchy wifi) this loses an entire recovery or level-up.

**Fix:** exponential-backoff retry (e.g. 2 s / 5 s / 15 s / 60 s, capped) with a persistent
"Unsaved changes — retrying" indicator; on repeated failure stash the payload in
`localStorage`/IndexedDB keyed by character id and offer a "restore unsaved changes" prompt on next
load. Do not clear `hasUnsavedChanges` until the server confirms.

### P0-3 · Save endpoint is rate-limited **per IP at 30/min**, and the sheet emits two PATCH streams per edit
`src/app/api/characters/[id]/route.ts:113-117` · `src/lib/rate-limit.ts:206`

```113:117:src/app/api/characters/[id]/route.ts
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = await standardLimiter.check(`char-patch:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }
```
`standardLimiter` is 30 requests / 60 s (`rate-limit.ts:206`). The key is the **IP**, not the user —
unlike the roll endpoint, which correctly uses `buildRateLimitKey('campaign-roll', { userId, ip })`
(`api/campaigns/[id]/rolls/route.ts:134-136`). Consequences:

- Two players in the same house / on the same CGNAT share one 30-write budget.
- Each sheet mutation produces **two** PATCHes: a 400 ms resource sync and a 2 s full autosave. The
  resource-sync effect keys on the entire character object, so it also fires for name typing,
  equipping items, and note edits:
  ```20:37:src/hooks/use-character-resource-sync.ts
    useEffect(() => {
      if (!enabled || !character?.id) { skipInitialRef.current = true; return; }
      if (skipInitialRef.current) { skipInitialRef.current = false; return; }
      const patch = buildResourcePatchFromCharacter(character);
      if (!patch) return;
      scheduleCharacterResourceSync(character.id, patch);
    }, [enabled, character]);
  ```
- ~15 discrete edits per minute (routine in combat) exhausts the budget → 429 → **P0-2 turns that
  into permanent loss.**

**Fix:** key by `userId` via `buildRateLimitKey` and raise the limit for this endpoint (sheet writes
are legitimately chatty); coalesce the two write paths into one; make the resource-sync effect depend
on `[character.id, currentHealth, currentEnergy, actionPoints, health?.max, energy?.max]` instead of
the whole object; honour `Retry-After` in the client.

### P0-4 · Local edits suppress incoming GM HP changes, then overwrite them
`src/lib/encounter/character-resource-sync.ts:19-32,149-164`

```24:32:src/lib/encounter/character-resource-sync.ts
export function shouldSuppressRemoteResourceMerge(characterId: string): boolean {
  const t = lastLocalResourceEditAt.get(characterId);
  if (!t) return false;
  if (Date.now() - t > REMOTE_SUPPRESS_MS) {
    lastLocalResourceEditAt.delete(characterId);
    return false;
  }
  return true;
}
```
`REMOTE_SUPPRESS_MS = 1600`. `notifyLocalResourceEdit` is called both by the HP/EN/AP handlers
(`use-sheet-resource-actions.ts:53,64,75`) **and** unconditionally by `scheduleCharacterResourceSync`
(`:153`), which the resource-sync effect calls on *any* character change. So editing a note opens a
1.6 s window in which the GM's HP update is **discarded, not deferred** — `use-character-sheet-page-data.ts:199`
returns early and there is no re-fetch afterwards. The player's stale HP is then written back by the
2 s autosave.

**Fix:** buffer suppressed payloads and apply the newest one when the window closes; scope the
suppression to the specific resource fields the user actually touched; only call
`notifyLocalResourceEdit` from real resource handlers.

### P0-5 · No request timeout — one hung save blocks every later save in the tab
`src/lib/api-client.ts:38-45` · `src/hooks/use-auto-save.ts:74-79`

`apiFetch` passes no `AbortSignal`. `performSave` guards re-entry with
`if (saveInProgressRef.current) { pendingResaveRef.current = true; return; }` and only clears that
flag in `finally`. A request that never settles (captive portal, dead socket) leaves
`saveInProgressRef` permanently `true`: all subsequent autosaves become no-ops that just set
`pendingResaveRef`. The user sees no error and keeps playing.

**Fix:** `AbortSignal.timeout(15_000)` in `apiFetch` (or a `timeoutMs` option used by save paths),
plus a watchdog in `useAutoSave` that clears `saveInProgressRef` and schedules a retry.

### P0-6 · Opening a sheet mutates and writes it (amplifies P0-1)
`src/app/(main)/characters/[id]/use-character-sheet-page-data.ts:216-246` ·
`src/components/character-sheet/use-sheet-auto-proficiencies.ts:109-133`

Both run on load for owners and call `setCharacter`, producing a dirty diff and therefore an
autosave — the path-proficiency block does it **during render**. A tab merely left open on a phone
will re-write its entire (possibly hours-old) character state and clobber newer data from another
device. It also means the first thing a read of the sheet does is a write.

**Fix:** make both idempotent-on-load (compute derived values without writing), or gate the write
behind an explicit user action / a one-shot migration keyed by a persisted marker. Never `setState`
during render for server-persisted data.

---

## 4. P1 — wrong numbers, broken progression, live-play UX failures

### P1-1 · Attack Bonuses table shows the wrong unproficient bonus
`src/components/character-sheet/archetype-section.tsx:82-95`

```82:95:src/components/character-sheet/archetype-section.tsx
  const martialBonuses = {
    strength: {
      prof: (abilities.strength ?? 0) + martialProf,
      unprof: abilities.strength ?? 0,
    },
```
Canonical rule (`formulas.ts:38-40`, used by `calculations.ts:174-188`): unproficient = ability
halved, rounded up; doubled if negative. The sheet shows the **full** ability score, and the value is
passed straight into `rollAttack`, so players roll with an inflated bonus. Same file contains a
*third* variant for unarmed at `:222` using `Math.floor` instead of `Math.ceil` — off-by-one for odd
scores. **Fix:** delete the local objects; call `calculateBonuses(martialProf, powerProf, abilities, pow_abil)`.

### P1-2 · Sheet and creator disagree on total skill points
`use-character-sheet-derived.ts:233` and `:298` (`const rawTotalSkillPoints = 2 + level * 3;`) vs
`formulas.ts:70-83` / `skill-allocation.ts:122-131` (`3 × level`), which the creator
(`skills-allocation-page.tsx:141`), the level-up modal (`level-up-modal.tsx:64-65`) and
`level-up-guide.ts:69-70` use. `character-sheet-body.tsx:69-70` even uses the canonical function as a
*fallback* for the same value, so the same screen can show two different totals.

A character who finishes creation fully spent lands on the sheet with 2 unspent points and a pulsing
red "unapplied points" dot (`hasUnappliedPoints` → `sheet-action-toolbar.tsx:73-78`). **Fix:** pick
one source (delete `getTotalSkillPoints`, keep `calculateSkillPointsForEntity`, add the `+2` there if
that is the real rule per `GAME_RULES.md`) and make every caller pass `rules`.

### P1-3 · Level-down is allowed and leaves a permanently invalid character
`level-up-modal.tsx:99-101,154` allows `targetLevel < currentLevel` ("Adjust Level"), and the applier
only sets the level and *raises* proficiency:
```409:416:src/components/character-sheet/use-sheet-resource-actions.ts
      setCharacter((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          level: newLevel,
          ...(profUpdate ?? {}),
        };
      });
```
`applyPathProficiencyForLevel` is `Math.max`-only (`archetype-display.ts:239-240`). Nothing prunes
over-cap ability points, skill points, health/energy points, or feats. Level 10 → 3 leaves ~20
ability points spent against a budget of 8; the sheet shows negatives and the state persists.
**Fix:** either make level-down a guided "rebuild" flow, or validate + surface an explicit
"these N feats / M points exceed level 3, choose what to drop" step before applying.

### P1-4 · Level-up is not transactional and the guide reads pre-update state
`use-character-sheet-page.ts:97-114` calls `applyLevelUp(newLevel)` then builds the guide from
`data.character` (still the old object) — correct for `previousLevel`, but any future guide logic
reading post-level fields will be wrong. More importantly the level change is only persisted by the
2 s debounce: closing the tab inside that window silently reverts the level while the level-up guide
card has already told the player what they gained. **Fix:** `await saveNow()` immediately after
`applyLevelUp` and only then show the guide; disable the confirm button while saving.

### P1-5 · Path proficiency applied by two independent code paths
`use-sheet-resource-actions.ts:400-426` (on level-up) and `use-character-sheet-page-data.ts:216-246`
(render-phase, every load at L5+). Both call `applyPathProficiencyForLevel`; the render-phase one
re-derives its own guard key. Any future change to the rule must be made twice.
**Fix:** one effect, one call site, keyed by `${id}:${level}`.

### P1-6 · Health/Energy point allocation uses local, wrong max formulas
```215:222:src/components/character-sheet/use-sheet-resource-actions.ts
        const level = prev.level || 1;
        const vitality = prev.abilities?.vitality ?? 0;
        const oldMax =
          vitality < 0 ? 8 + vitality + oldPoints : 8 + vitality * level + oldPoints;
```
Canonical `calculateMaxHealth` (`calculations.ts:85-104`) reads `baseHealth` from
`rules.PROGRESSION_PLAYER.baseHealth` (not a literal `8`) **and** substitutes Strength when Vitality
is the archetype ability. The local copy does neither, so the "current HP is at max → bump it too"
check mis-fires for Vitality-archetype characters and for any DB rules change. The energy twin
(`:240-242`) reads only `prev.pow_abil`, ignoring `archetype.pow_abil` / `archetype.ability` /
`mart_abil` — for martial characters `oldMax` collapses to `oldPoints`, so current EN is always
bumped. **Fix:** call `computeMaxHealthEnergy(prev, rules)`.

### P1-7 · Defense scores hardcode base 10, ignoring `rules.COMBAT.baseDefense`
`abilities-section.tsx:111-113` (`return 10 + getDefenseBonus(...)`) vs `calculations.ts:37,49-54`.
The header's stats come from `calculateAllStats` (rules-aware) while the Abilities panel computes its
own — the two disagree the moment an admin edits `core_rules`. **Fix:** consume
`calculatedStats.defenseScores` / `defenseBonuses` from context.

### P1-8 · The sheet enforces an ability cap the rules say doesn't exist
`abilities-section-model.ts:51-59` defines a level→max table (3/4/5/6/7/8/9) and
`ability-stat-tile.tsx:65-69` blocks increases at it. `constants.ts:44-52` states the opposite:
> `MAX_ABSOLUTE: 10` — "no level-based cap; cost doubling at 4+ is the soft cap"

and `canIncreaseAbility` (`formulas.ts:285-301`) reads `rules.ABILITY_RULES.maxAbsoluteCharacter`.
Players are blocked from legal spends and the tooltip says "Max at level N". The same file's
`getMaxDefenseSkill: (level) => level` also contradicts `SKILL_LIMITS.DEFENSE_MAX = 3` and uses
different semantics from `canIncreaseDefense` (`skill-allocation.ts:153-164`, which caps
*defense + ability* at level). **Fix:** resolve against `GAME_RULES.md`, delete the loser, keep the
cap in `lib/game`.

### P1-9 · The roll log floats **above every modal**
`roll-log.tsx:196` uses `z-floating` (= 1000, `globals.css:360`); `modal.tsx:185` uses `z-overlay`
(= 50, `globals.css:357`). With any sheet modal open — including `fullScreenOnMobile` Add Feat /
Add Library Item / Recovery / Level Up — the d20 FAB sits on top of the modal, is clickable, is
outside the modal's focus trap (`modal.tsx:145-169`), and opening it covers 70 vh of modal content.
On a 360 px phone during play this makes the modal partially unusable. **Fix:** hide/disable the roll
log while a modal is open (a modal-count context, or `z-index` below `z-overlay`).

### P1-10 · Notes tab: unlabeled textareas and mouse-only controls
- `notes-tab.tsx:82-85` — note header is a `<div onClick>` with no `role`, `tabIndex`, or key handler:
  a keyboard user cannot expand/collapse a note.
- `notes-tab.tsx:104-114` — rename is a `<span onClick>`: same problem.
- `notes-tab.tsx:288,297,306` and `:132-137` — four `Textarea`s with only `placeholder`. `Textarea`
  supports a `label` prop (`ui/textarea.tsx:12,26-32`) and none is passed, violating the a11y rule
  (label or `aria-label` required).

**Fix:** use the existing `LibraryCollapsibleSection`/`Collapsible` for the note header (or a
`<button>`), and pass `label` (visually hidden if needed) to each `Textarea`.

### P1-11 · `?scope=encounter` bypasses the `private` visibility check
```95:100:src/app/api/campaigns/[id]/characters/[userId]/[characterId]/route.ts
    if (!forEncounter) {
      const visibility = (charData?.visibility as CharacterVisibility) || 'private';
      if (visibility === 'private') {
        return NextResponse.json({ error: 'This character is set to private and cannot be viewed' }, { status: 403 });
      }
    }
```
Any campaign member (not just the RM) can `GET …?scope=encounter` and receive another player's name,
all six ability scores, HP/EN current+max, AP and evasion (`:102-131`) even when that character is
explicitly `private`. Not full-sheet exposure, but it defeats a setting the player deliberately chose.
**Fix:** restrict `scope=encounter` to the campaign owner (only the GM builds encounters —
`api/encounters/[id]/route.ts:32` already proves encounters are GM-owned), or return only HP/EN/AP for
non-owners and require `visibility !== 'private'`.

---

## 5. "Sheet re-implements a formula" table

| # | Location | Local formula | Canonical source | Consequence |
|---|---|---|---|---|
| 1 | `archetype-section.tsx:84-94` | `unprof: ability` (full) | `formulas.ts:38-40` `unproficientBonus` via `calculations.ts:174-188` | **Wrong number, wrong roll** (P1-1) |
| 2 | `archetype-section.tsx:222` | `Math.floor(ability/2)` | `unproficientBonus` uses `Math.ceil` | Off-by-one unarmed attack for odd scores |
| 3 | `archetype-section.tsx:389-390` | `powerPotency = 10 + prof + ability` | **none exists** | Rules formula lives in a UI file; base 10 hardcoded |
| 4 | `archetype-section.tsx:365` | `calculateProficiency(level)` without `rules` | `formulas.ts:146-161` | Ignores DB `core_rules` proficiency progression |
| 5 | `use-character-sheet-derived.ts:233,298` | `2 + level * 3` | `formulas.ts:70-83` / `skill-allocation.ts:122-131` (`3 × level`) | **Sheet vs creator mismatch, phantom unspent points** (P1-2) |
| 6 | `use-character-sheet-derived.ts:284` | `canLevelUp = xp >= level * 4` | **none exists** | XP threshold defined only here; not rules-driven |
| 7 | `use-character-sheet-derived.ts:375` | `calculateProficiency(level)` without `rules` | `formulas.ts:146-161` | State-uses max ignores DB rules |
| 8 | `use-sheet-resource-actions.ts:217-218` | `8 + vitality*level + points` | `calculations.ts:85-104` `calculateMaxHealth` | Wrong for Vitality-archetype + ignores `rules.baseHealth` (P1-6) |
| 9 | `use-sheet-resource-actions.ts:242` | `powerVal * level + points`, `pow_abil` only | `calculations.ts:109-117` `calculateMaxEnergy` | Wrong max for martial characters (P1-6) |
| 10 | `use-sheet-resource-actions.ts:302` | `calculateProficiency(level)` without `rules` | `formulas.ts:146-161` | Recovery resets State uses to a non-rules value |
| 11 | `abilities-section.tsx:111-113` | `10 + bonus` | `calculations.ts:37,49-54` `calculateDefenses` | Ignores `rules.COMBAT.baseDefense` (P1-7) |
| 12 | `abilities-section-model.ts:51-60` | level→max ability table; `maxDefense = level` | `constants.ts:44-58` + `formulas.ts:285-301`; `skill-allocation.ts:153-164` | Blocks legal spends; contradicts the stated rule (P1-8) |
| 13 | `sheet-resource-input.tsx:15-16` | `half = ceil(max/2)`, `terminal = ceil(max/4)` | `calculations.ts:233-235` `calculateTerminal` | Health colour ignores the Terminal Temp Modifier the header displays |
| 14 | `library-entity-rows.tsx:477-478` | `crit = 10 + agility + 10 + increase` | `calculateEvasion` + `getEquippedArmorQuickRef` | Armor row Crit disagrees with header Critical Range; ignores `evasionBase` and temps |
| 15 | `notes-tab.tsx:178-186` | jump H/V, climb, swim, fall dice | **none exists** | Five game formulas only in a tab component |
| 16 | `feats-tab.tsx:149-163` | feat-slot sum weighted by `feat_lvl` | duplicated at `use-character-sheet-derived.ts:327-338` | Two implementations of the same slot maths |
| 17 | `api/campaigns/[id]/characters/[userId]/[characterId]/route.ts:129` | `evasion: 10 + agility` | `calculations.ts:77-80` `calculateEvasion` | Combatant evasion ignores `evasionBase` / rules |
| 18 | `ap: 4` × 5 (`combat-encounter-helpers.ts:128`, `use-combat-round-actions.ts:107`, `add-combatant-modal.tsx:146,343`) + `DEFAULT_ACTION_POINTS` (`sheet-header.tsx:81`) + clamp `min(10,…)` (`use-sheet-resource-actions.ts:78`) | AP default / cap | **none** | 6 copies of one constant |

---

## 6. P2 — performance, duplication, maintainability

### P2-1 · One HP tick recomputes and re-renders essentially the whole sheet
`character` is a single `useState` object at the page root
(`use-character-sheet-page-data.ts:49`) and flows through one context value
(`character-sheet-context.tsx:138-145`, deliberately unmemoized). Every `setCharacter` — a single HP
`+1` — invalidates every memo keyed on `character`:

| Work redone per HP tick | Location | Cost |
|---|---|---|
| `enrichCharacterData` over **all** powers, techniques, items | `use-character-sheet-derived.ts:126-153` | heaviest; re-resolves every entity against 3 part DBs |
| `calculateAllStats` | `use-character-sheet-derived.ts:215-218` | full stat pass |
| `calculateAllStats` **again** | `sheet-header.tsx:124-142` (temp-modifier cascade) | second full pass |
| `pointBudgets` + `hasUnappliedPoints` (incl. a `Map` over the **entire** feats codex) | `:220-267`, `:279-350` (Map at `:327-332`) | two near-identical budget passes |
| Skills merged with the full codex catalog | `:378-451` then again in `skills-section.tsx:98-105` | O(codex) each |
| `buildLibrarySectionData` (new closures for every handler) | `library-section.tsx:52-60`, `build-library-section-data.ts:87-135` | rebuilds the whole panel model |
| Row view-models for **all six tabs**, not just the visible one | `use-library-section-rows.ts:243-278` | 7 mappers × N items |
| Skills table: `getSkillBonus` **twice per row** + `findParentSkill` `.find` per sub-skill (O(n²)) + `isSpeciesSkill` O(m) per row | `skills-section.tsx:398-404,107-119,121-129` | worst per-render loop |

Worst offenders to fix first: `use-character-sheet-derived.ts:126-153` (key enrichment on
`[character.powers, character.techniques, character.equipment, …]`, not `character`),
`use-library-section-rows.ts:243-278` (only map the active tab),
`skills-section.tsx:398-404` (memoize a `Map<id, row>`, compute each bonus once, wrap `SkillRow` in
`React.memo`), `sheet-header.tsx:124-142` (drop the second `calculateAllStats` — derive the cascade
once at page level and pass it down). Longer term: split the context into
`ResourcesContext` (HP/EN/AP) and `BuildContext` (everything else) so a HP tick can't reach the
library and skills panels at all.

### P2-2 · `RollProvider` value is rebuilt every render
`roll-context.tsx:299-312` constructs `value` inline with no `useMemo`, and `RollProvider` wraps the
entire page (`characters/[id]/page.tsx:105`). Every roll (and every parent render) invalidates the
context for all consumers — abilities, skills, archetype, all library rows. Memoize `value`, or move
`rolls` into a separate context from the (stable) roll functions.

### P2-3 · Personal roll log uses one global localStorage key
`roll-context.tsx:69` `const STORAGE_KEY = 'realms-roll-log'`. Character A's rolls appear on
character B's sheet, and two open tabs overwrite each other's history (`:101-106`). Key by character
id (and prune old keys).

### P2-4 · Campaign roll ordering ties break on a random UUID
`api/campaigns/[id]/rolls/route.ts:105-107` orders by `created_at desc, id desc` where `id` is
`crypto.randomUUID()` (`:211`) and `created_at` is millisecond ISO (`:212`). Same-millisecond rolls
order non-deterministically between refetches, and the trim at `:246-252` can delete the wrong roll.
Add a monotonic `seq bigserial` and order by it.

### P2-5 · Files over 400 LOC and what to extract

| File | LOC | Extract |
|---|---|---|
| `archetype-section.tsx` | 570 | `AttackBonusesTable` (→ shared, fed by `calculateBonuses`), `WeaponsSection`/`ShieldsSection`/`ArmorSection` (→ `archetype-armaments.tsx`), `UNARMED_PROWESS_DAMAGE` + unarmed maths (→ `lib/game/unarmed-prowess.ts`), prof-point editor (→ `archetype-prof-editor.tsx`). Target ~150 |
| `library-entity-rows.tsx` | 537 | one file per family (`power`, `technique`, `weapon`, `shield`, `armor`, `equipment`); `buildEnergyButton` + `needsProfBadge` into `library-row-chrome.tsx`. The weapon/shield mappers are ~70 % identical (attack cell, damage cell, range, properties, equip toggle) — a shared `mapArmamentRow` saves **~120 LOC** |
| `proficiencies-tab.tsx` | 526 | `toBuiltinUnarmedProficiency`/labels/TP constants (→ `lib/proficiencies`), category resolution, add/remove handlers into a `use-proficiencies-tab.ts` |
| `feats-tab.tsx` | 505 | the four `FeatsTraitsListSection` blocks are the same shape with different data/sort state — a `{ title, rows, sort, onAdd, max, used }[]` config loop saves **~90 LOC**; move enrichment (`enrichTrait`/`enrichFeat`) to `lib/character/enrich-feats.ts` (it duplicates codex-lookup logic already in `use-character-sheet-derived.ts:352-373`) |
| `skills-section.tsx` | 455 | `handleProfToggle`/`handleSkillIncrease`/`handleSkillDecrease`/`canIncreaseSkill`/`canDecreaseSkill` (~120 LOC of pure logic) → `lib/game/sheet-skill-spend.ts`, unit-testable and shared with the creator |
| `use-character-sheet-derived.ts` | 430 | `pointBudgets` and `hasUnappliedPoints` share ~40 duplicated LOC (`use-character-sheet-derived.ts:233-257` vs `:298-322`) — compute budgets once and derive the boolean |
| `edit-archetype-modal.tsx` | 430 | picker / confirm / path-view steps into sibling step components (mirror `edit-species-*`) |

Per-tab shell: `LibrarySection`'s six `resolvedActiveTab === …` branches
(`library-section.tsx:259-402`) each hand-thread 5–25 props. A `TABS: Record<TabType, {render}>` map
plus a single `data` object would remove ~90 LOC of prop-threading and stop unused tabs from being
prop-diffed.

### P2-6 · Legacy-creator coupling that will break when the legacy creator is deleted
Four sheet files import five components from `@/components/character-creator/`:

| Sheet file | Legacy import |
|---|---|
| `edit-species-modal.tsx:12` | `character-creator/MixedSpeciesModal` |
| `edit-species-ancestry-step.tsx:7` | `character-creator/TraitSection` |
| `edit-species-ancestry-step.tsx:8` | `character-creator/mixed-species-skill-picker` |
| `archetype-path-identity.tsx:4` | `character-creator/PathHelpCard` |
| `edit-archetype-modal.tsx:15` | `character-creator/AbilityPickButton` |

All five are presentational and shared by definition. **Move them to `src/components/shared/`
(+ ADR + `scripts/shared-ui-allowlist.json`) before deleting the legacy creator**, otherwise the
sheet's species and archetype edit flows break.

### P2-7 · Other P2s
- **Dead export:** `defaultSkillPointTotal` (`use-character-sheet-derived.ts:453-454`, returned at
  `:471`) has no consumer anywhere — delete it and the now-unused import at `:20`.
- **Effectively dead / contradictory:** `SKILL_LIMITS` (`constants.ts:55-58`) is referenced only by
  the `GAME_CONSTANTS` aggregate while the sheet uses its own defense cap (P1-8).
- **Mobile FAB collision:** `sheet-action-toolbar.tsx:50` renders 4 × 44 px buttons centered at
  `bottom-4 left-4 right-4`; the roll-log FAB is 56 px at `bottom-5 right-5` with a **20× higher**
  z-index. At 360 px there is ~4 px clearance; at 320 px the Settings button is overlapped and
  unreachable. Offset the toolbar (`pr-16` on mobile) or move it above the FAB.
- **Redundant work per row:** `resolveItemProperties(item)` is called twice per weapon
  (`library-entity-rows.tsx:277,281`) and twice per shield (`:363,371`).
- **`getEditState` shadowing:** `archetype-section.tsx:403` declares a local function with the same
  name as the imported `getEditState` used by the other sections (`skills-section.tsx:17`) —
  two different "edit state" derivations.
- **Feat enrichment duplicated:** `feats-tab.tsx:242-269` (`enrichFeat`) and
  `use-character-sheet-derived.ts:352-373` both do id-then-name codex lookup with different
  fallbacks.
- **Non-interactive click handler:** `library-entity-rows.tsx:527` `<div onClick={stopPropagation}>`
  around the quantity stepper.

---

## 7. P3

- `use-sheet-skill-identity-actions.ts:153-154,169-170` writes the legacy aliases
  `martialProficiency` / `powerProficiency` alongside the canonical `mart_prof` / `pow_prof`.
  `normalizeCharacterForSave` strips them on save (`schema-normalize.ts:123-125`), so this is dead
  state that contradicts the TASK-663 canonical-field policy.
- `api/characters/[id]/route.ts:113,171` uses the raw `x-forwarded-for` header instead of
  `resolveClientIp` (`rate-limit.ts:182-187`), so proxy chains produce inconsistent keys and the
  header is trivially varied to evade the limit.
- `use-auto-save.ts:197-207` warns on unload but never flushes; a `keepalive` fetch or
  `navigator.sendBeacon` would save the last edit instead of only warning about it.
- `roll-context.tsx:161-167` bakes the natural-20 `+2` / natural-1 `−2` rule into the provider and
  again into `roll-log.tsx:164-172` — two copies of a game rule with no `lib/game` home.

---

## 8. Tests: coverage vs actual risk

**What exists in scope** (7 files, all pure helpers): `sheet-item-match.test.ts` (19 LOC),
`library-entity-rows.test.ts` (66), `library-list-helpers.test.ts` (78),
`add-library-item/map-selection.test.ts` (51), `lib/character/temp-modifiers.test.ts` (103),
`sheet-skills-display.test.ts` (81), `collect-sheet-traits.test.ts` (31),
`schema-normalize.test.ts` (75). Adjacent: `character-save.test.ts` — **4 cases**, only
`tempModifiers` normalization and legacy-alias promotion; `api/characters/[id]/route.test.ts` — 14
cases, good IDOR/visibility coverage but **nothing about merge semantics**;
`level-up-guide.test.ts` covers the guide copy, not the applier.

**What is untested — and is exactly where the money is:**

| Risk | Test file | Status |
|---|---|---|
| Debounced autosave (retry, in-flight coalescing, enable transition, failure) | `hooks/use-auto-save.test.ts` | **missing** |
| `cleanForSave` field allowlist | `lib/data-enrichment/clean-for-save.test.ts` | **missing** — any new character field silently fails to persist until someone notices |
| PATCH merge / concurrency | `api/characters/[id]/route.test.ts` | file exists, **no merge or conflict case** |
| Resource sync + suppression window | `lib/encounter/character-resource-sync.test.ts` | **missing** |
| max HP / max EN / defenses / terminal | `lib/game/calculations.test.ts` | **missing entirely**, despite the file header "SINGLE SOURCE OF TRUTH" |
| Recovery (full + partial allocation) | — | **missing** |
| Level-up / level-down application | — | **missing** |
| Roll context (crit maths, campaign write, `canRoll` gating) | — | **missing** (only `roll-timestamp.test.ts`) |

**Highest-value tests to add, in order:**

1. `hooks/use-auto-save.test.ts` (vitest fake timers) — debounce fires once for a burst; an edit
   during an in-flight save trigged exactly one follow-up; **a rejected save is retried**; `saveNow`
   cancels the pending timer; enabling autosave does not fire a save. *This is the regression net for
   P0-2 and P0-5.*
2. `api/characters/[id]/route.test.ts` — add: PATCH with a stale `updatedAt` returns 409 and does not
   write; a partial payload leaves untouched keys intact; a full payload does **not** silently drop a
   key the client omitted. *Locks in the P0-1 fix.*
3. `lib/data-enrichment/clean-for-save.test.ts` — round-trip a fixture character and assert
   `Object.keys(cleanForSave(c))` ⊇ every field the sheet mutates (drive it off the handler list so
   adding a field to the sheet without adding it to `SAVEABLE_FIELDS` fails CI).
4. `lib/game/calculations.test.ts` — table-driven `calculateMaxHealth` / `calculateMaxEnergy` /
   `calculateDefenses` / `calculateTerminal` / `calculateBonuses`, including negative abilities,
   Vitality-as-archetype, and `rules` overrides. Then assert the sheet's numbers equal these
   (kills table rows 8, 9, 11).
5. `components/character-sheet/use-sheet-resource-actions.test.ts` (renderHook) — full recovery
   restores HP/EN to `calculatedStats` max and resets only Full/Partial-recovery feat uses; partial
   recovery clamps at max; `handleHealthPointsChange` bumps current HP only when it was at max —
   verified against `computeMaxHealthEnergy`.
6. `lib/encounter/character-resource-sync.test.ts` — a remote HP update inside the suppression window
   is **applied after the window** (not dropped); `buildResourcePatchFromCharacter` returns `null`
   when nothing changed. *Locks in the P0-4 fix.*
7. `components/rolls/roll-context.test.tsx` — natural 20 adds +2 and natural 1 subtracts 2 exactly
   once; `canRoll === false` makes every roll function a no-op and writes nothing to the campaign;
   history is keyed per character.
8. Playwright (`tests/visual/`) — two-tab concurrency: tab A adds an item, tab B changes HP, assert
   both survive after reload. This is the only test that actually reproduces the P0-1 field report.

---

## 9. Suggested sequencing

1. **P0-3** (rate-limit key + collapse the double write) — one-line key change, immediate relief.
2. **P0-2 / P0-5** (retry + timeout in `useAutoSave` / `apiFetch`) — self-contained, high payoff.
3. **P0-1** (dirty-key PATCH + `updatedAt` precondition + 409 handling) — needs an ADR; the real fix.
4. **P0-4 / P0-6** (suppression buffering; stop writing on load).
5. **P1-1, P1-2, P1-6, P1-7** — delete the local formulas, wire the rules engine, add test 4.
6. **P1-9 / P1-10** (roll log above modals; notes a11y) — cheap, user-visible.
7. **P2-1** (re-render containment) once the save path is safe.
8. **P2-6** (move the five legacy-creator components to `shared/`) **before** the legacy creator is
   deleted.
