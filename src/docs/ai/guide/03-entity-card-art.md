> Back: [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) · Core: [`ARCHITECTURE_CONSTITUTION.md`](../ARCHITECTURE_CONSTITUTION.md)

# Entity Card Art & Expandable Images (TASK-405 / TASK-415)

**Product authority:** `REALMS_PRODUCT_OVERVIEW.md` §5.0.3 — three-layer image model (official/codex art, art bank, privileged user upload). **Schema authority:** `SUPABASE_SCHEMA.md` — nullable `image_url` on codex/official/user rows; **same column name and semantics everywhere** (not ad-hoc payload keys when a column exists).

**Goal:** One resolution pipeline for placeholders + DB URLs; unified **click-to-enlarge** via `ExpandableImage`; list thumbs and choice-card heroes share the same preview modal. Agents must **extend** these building blocks — not fork per page.

## Building blocks (use these)

| Piece | Location | Role |
|-------|----------|------|
| **ExpandableImage** | `src/components/shared/expandable-image.tsx` | **Default** for any meaningful inline image — wraps visible image, click opens `ExpandableImageModal` (`object-contain`, `fullScreenOnMobile`). Use `stopPropagation` inside selectable cards/rows. |
| **ExpandableImageModal** | same file | Controlled preview only (rare); prefer `ExpandableImage`. |
| **readRecordImageUrl** / **resolveChoiceCardImage** | `src/components/guided-creator/guided-choice-image.ts` | Read `image_url` / `imageUrl` from any record; fall back to typed SVG placeholders |
| **resolveListRowThumbnail** / **resolveSpeciesListRowThumbnail** | `src/lib/list-row-image.ts` | Wraps `resolveChoiceCardImage` → props for list thumbs |
| **ListRowThumbnail** | `src/components/shared/list-row-thumbnail.tsx` | 44×44 list thumb — thin wrapper over `ExpandableImage` for `GridListRow.thumbnail` |
| **GridListRow** `thumbnail` | `src/components/shared/grid-list-row.tsx` | D&D Beyond list style + `ListHeader` `hasThumbnailColumn` |
| **GuidedChoiceCard** | `src/components/guided-creator/guided-choice-card.tsx` | Choice cards — hero art via `ExpandableImage` inside card |
| **CodexArtUploadField** | `src/components/shared/codex-art-upload-field.tsx` | Admin crop/upload → `/api/upload/codex-art` |
| **codex-art.ts** | `src/lib/codex-art.ts` | Entity types, storage paths, `uploadCodexArt()` |

## Decision matrix — which surface?

| User-facing surface | Implement with | Image resolution |
|---------------------|----------------|------------------|
| **Any inline image** (species art, portrait, card hero, list thumb) | **`ExpandableImage`** wrapping `next/image` or `img` | Pass `src`, `alt`, optional `isPlaceholder` |
| Codex / Library / Admin **sortable list** | `GridListRow` `thumbnail` → `ListRowThumbnail` | `resolveListRowThumbnail(…)` |
| Guided creator **choice card** | `GuidedChoiceCard` (uses `ExpandableImage` internally) | `imageKind` + `imageRecord` / `imageUrl` |
| Species **reveal** / preview **portraits** | `ExpandableImage` directly | `resolveChoiceCardImage` or portrait URL |
| Admin / official **authoring** | `CodexArtUploadField` | `codex-art.ts` upload API |
| Decorative / redundant (`alt=""` only) | Plain `Image` / `img` — **no** expand | — |

## Shipped vs extend later

| Entity | List `thumbnail` | Choice card | Upload |
|--------|------------------|-------------|--------|
| **Species** | ✅ Codex + Admin species tabs | ✅ Guided species + reveal | ✅ Admin species editor |
| Weapons / armor / shield | Extend when art exists | Future | ✅ Official Item Creator (`?edit=`) |
| Powers / techniques / creatures | TASK-405 phase 2+ | Future | Planned |
| Simple equipment (`codex_equipment`) | Art **bank** only (TASK-415) | Bank picker | No per-row codex column |

When adding list thumbs for a new entity: (1) ensure API returns `image_url`, (2) pass `thumbnail={resolveListRowThumbnail('<kind>', row, row.name)}` on `GridListRow` — **do not** add a new grid column for art.

## Agent checklist (before shipping UI with art)

1. Grep `FEATURE_INDEX.md` + this section — do not add parallel thumb/modal/lightbox components.
2. Placeholders only via `resolveChoiceCardImage` — never hardcode `/images/placeholder-*.svg` in feature pages.
3. Wrap meaningful images in **`ExpandableImage`** (list thumbs use `ListRowThumbnail`; choice cards use `GuidedChoiceCard` or `ExpandableImage` directly).
4. Use `thumbnail` on `GridListRow`, not `leftSlot` (leftSlot is for equip/innate toggles).
5. `stopPropagation` on expand click when inside selectable rows/cards (`ExpandableImage` default `true`).
6. Pair **`ListHeader` `hasThumbnailColumn`** with `GridListRow` `thumbnail`.
7. For user-library parity / art bank, follow TASK-415.

## Anti-patterns

- Custom `<img>` + one-off lightbox / new preview modal per page.
- Storing card art only in `payload` when `image_url` column exists for that table.
- Different placeholder art per page.
- `codex_equipment.image_url` — simple gear uses **bank** presets only (§5.0.3).
