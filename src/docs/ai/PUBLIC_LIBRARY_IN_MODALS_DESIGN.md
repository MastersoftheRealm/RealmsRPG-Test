# Public Library in Add-X Modals — Design & DB Usage

**Date:** 2026-02-21  
**Context:** Character creator, character sheet, creature creator — modals for adding powers, techniques, armor, weapons. Owner asked to allow switching source (My library / Public library / All) and questioned whether adding a public item to a character should copy it to the user's library first (and thus increase Supabase usage).

---

## Recommendation: Reference public items; do not copy on add

### 1. Source filter in modals (same as Library page)

- In every modal that adds powers, techniques, armor, weapons, or equipment from “library”:
  - Add the same **SourceFilter** component used on the Library page: **All sources** | **Public library** | **My library**.
- Reuse the same merge logic as Library tabs:
  - **My:** only user library (current behavior for add-library-item-modal).
  - **Public:** only public library (from `usePublicLibrary(type)`).
  - **All:** merged list (user + public), with a way to show source (e.g. badge or column) so users can tell which is which if desired.
- Same styles and component as Library page (`@/components/shared/filters/source-filter.tsx`).

This lets users add public content to characters without leaving the sheet/creator.

---

### 2. What happens when they add an item to the character

**Do not** copy the item to the user's personal library when they add it to a character.

- **When user adds an item (from My or Public) to the character:**
  - Store on the character only a **reference**: same shape as today (e.g. `{ id, name }` for powers/techniques, and existing equipment shape for items). No new row in `user_powers` / `user_techniques` / `user_items`.
- **Enrichment (character sheet / display):**
  - Resolve by `id` (and name fallback) in this order:
    1. User's library (current behavior).
    2. If not found, **public library** (new): pass public arrays into `enrichCharacterData` and use them as a second lookup. So one public row can serve many characters; no duplication.

**Copy to “My library”** stays an explicit action only on the **Library** page (e.g. “Add to my library” on a public item). That is the only place that creates new rows in the user's library. Modals are for “add to this character/sheet/creature,” not for copying into the user's library.

---

### 3. Why this avoids excessive Supabase usage

| Approach | Effect on DB |
|----------|--------------|
| **Copy to user library first, then add to character** | Every “add public X to character” creates a new row in the user's library. Many users × many public items → large growth in `user_powers` / `user_techniques` / `user_items`. |
| **Reference only (recommended)** | Character stores only `id` (+ name). No new user library rows. Public tables stay the single source; enrichment reads from user then public. Minimal extra storage. |

So: **only add to the user's personal library when they explicitly do so on the Library page.** When adding from a modal to a character, keep it as a reference and resolve from public at display time.

---

### 4. Implementation outline (for TASK-265)

1. **Modals**
   - Add **SourceFilter** and merge user + public lists (by source) in:
     - `add-library-item-modal.tsx` (character sheet)
     - Character creator: equipment-step (and any power/technique add modals)
     - Creature creator: power/technique/item selection modals
   - Reuse the same “merge by source” pattern as `LibraryPowersTab` / `LibraryTechniquesTab` / `LibraryItemsTab`.

2. **Character storage**
   - No schema change. Keep storing references (id, name, etc.) on the character. Items added from public will have a public `id`; that’s fine.

3. **Enrichment**
   - Extend `enrichCharacterData` (and underlying `enrichPowers` / `enrichTechniques` / `enrichItems`) to accept optional **public** library arrays.
   - Lookup order: user library by id/name → if not found, public library by id/name.
   - Character sheet (and any other consumer) fetches public library when needed and passes it into enrichment.

4. **ID collision**
   - User and public IDs come from different tables; collision is negligible. If desired, you can later add an explicit `source: 'public' | 'user'` on the character reference and prefer that in lookup; not required for the first version.

---

### 5. Summary

- **Modals:** Same source filter (All / Public / My) and merge logic as Library page; same component and styles.
- **Add to character:** Only store a reference on the character; do **not** copy into the user's library.
- **Copy to library:** Only when the user explicitly does “Add to my library” on the Library page.
- **Enrichment:** Resolve from user library first, then public library, so character sheet (and creators) display public items correctly without duplicating data.

This keeps Supabase usage low while allowing users to add public powers, techniques, armor, and weapons to characters from the same modals they already use.
