> Back: [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) · Core: [`ARCHITECTURE_CONSTITUTION.md`](../ARCHITECTURE_CONSTITUTION.md)

# Entity Card Art & Expandable Images (TASK-405 / TASK-491+)

**Product authority:** `REALMS_PRODUCT_OVERVIEW.md` §5.0.3 — one Realms Image Library (master asset + category tags). **Architecture:** [`ADR-0003`](../ADR/0003-realms-image-library.md). **Schema authority:** `SUPABASE_SCHEMA.md` — `realms_images` catalog; consumers use nullable **`image_id`** FK (optional denormalized `image_url` cache). Do not invent ad-hoc payload image keys when columns exist.

**Goal:** One resolution pipeline for placeholders + bank URLs; unified **click-to-enlarge** via `ExpandableImage`; list thumbs and choice-card heroes share the same preview modal. Agents must **extend** these building blocks — not fork per page.

## Building blocks (use these)

| Piece | Location | Role |
|-------|----------|------|
| **ExpandableImage** | `src/components/shared/expandable-image.tsx` | **Default** for any meaningful inline image — wraps visible image, click opens `ExpandableImageModal` (`object-contain`, `fullScreenOnMobile`). Use `stopPropagation` inside selectable cards/rows. |
| **ExpandableImageModal** | same file | Controlled preview only (rare); prefer `ExpandableImage`. |
| **readRecordImageUrl** / **resolveChoiceCardImage** | `src/components/guided-creator/guided-choice-image.ts` → `src/lib/entity-image-url.ts` | Read `image_url` / `imageUrl` cache, bank join/enrichment, or `image_id`; fall back to typed SVG placeholders. |
| **resolveListRowThumbnail** / **resolveSpeciesListRowThumbnail** | `src/lib/list-row-image.ts` | Wraps `resolveChoiceCardImage` → props for list thumbs |
| **ListRowThumbnail** | `src/components/shared/list-row-thumbnail.tsx` | 44×44 list thumb — thin wrapper over `ExpandableImage` for `GridListRow.thumbnail` |
| **GridListRow** `thumbnail` | `src/components/shared/grid-list-row.tsx` | D&D Beyond list style + `ListHeader` `hasThumbnailColumn` |
| **GuidedChoiceCard** | `src/components/guided-creator/guided-choice-card.tsx` | Choice cards — hero art via `ExpandableImage` inside card |
| **CodexArtUploadField** | `src/components/shared/codex-art-upload-field.tsx` | **Interim** admin crop/upload → `/api/upload/codex-art` (entity-tied). Replace with bank upload + picker in TASK-495/496. |
| **codex-art.ts** | `src/lib/codex-art.ts` | Interim entity types / storage paths; keep until TASK-496/498. |
| **realms-images.ts** | `src/lib/realms-images.ts` | Bank types, category enum, client CRUD helpers (`apiUpload` / `apiFetch`) — TASK-492 |
| **`/api/images*`** | `src/app/api/images/` | Bank list (public), create/replace/delete/usage (admin) |
| **Admin Image Library** | `/admin/images` (TASK-493) | Admin browse/upload/rename/retag/replace/delete for bank assets; dashboard card under **Admin** |
| **RealmsImagePicker** | `src/components/shared/realms-image-picker.tsx` | Shared bank browse + select; admin-only upload-into-bank (TASK-495). Set `image_id` via `onSelect`. Filter with `categories` or `'empowered-technique'` / `'portrait'`. |

## Decision matrix — which surface?

| User-facing surface | Implement with | Image resolution |
|---------------------|----------------|------------------|
| **Any inline image** (species art, portrait, card hero, list thumb) | **`ExpandableImage`** wrapping `next/image` or `img` | Pass `src`, `alt`, optional `isPlaceholder` |
| Codex / Library / Admin **sortable list** | `GridListRow` `thumbnail` → `ListRowThumbnail` | `resolveListRowThumbnail(…)` |
| Guided creator **choice card** | `GuidedChoiceCard` (uses `ExpandableImage` internally) | `imageKind` + `imageRecord` / `imageUrl` |
| Species **reveal** / preview **portraits** | `ExpandableImage` directly | `resolveChoiceCardImage` or portrait URL |
| Admin / official **authoring** (target) | `RealmsImagePicker` (+ admin upload into bank) | Set `image_id`; do not fork upload fields |
| Admin **bank management** | `/admin/images` | Upload/rename/tag/replace/delete master assets (TASK-493) |
| Admin **authoring** (interim) | `CodexArtUploadField` | Until TASK-496 migrates callers |
| Decorative / redundant (`alt=""` only) | Plain `Image` / `img` — **no** expand | — |

## Entities with / without art

| Entity | Art? | Category tag(s) for picker |
|--------|------|----------------------------|
| Species, creatures | Yes | `species` / `creature` |
| Weapons, armor, shields, equipment | Yes | matching tag; equipment is first-class |
| Powers, techniques | Yes | `power` / `technique` |
| Empowered techniques | Yes | filter `power` **OR** `technique` (no empowered tag) |
| Feats, skills, archetypes, parts, properties, creature feats, traits | **No** | — |
| Enhanced items | Deferred | TASK-500 |

When adding list thumbs: (1) ensure API returns resolvable art (`image_id` / cache `image_url`), (2) pass `thumbnail={resolveListRowThumbnail('<kind>', row, row.name)}` on `GridListRow` — **do not** add a new grid column for art.

## Agent checklist (before shipping UI with art)

1. Grep `FEATURE_INDEX.md` + this section — do not add parallel thumb/modal/lightbox components.
2. Placeholders only via `resolveChoiceCardImage` — never hardcode `/images/placeholder-*.svg` in feature pages.
3. Wrap meaningful images in **`ExpandableImage`** (list thumbs use `ListRowThumbnail`; choice cards use `GuidedChoiceCard` or `ExpandableImage` directly).
4. Use `thumbnail` on `GridListRow`, not `leftSlot` (leftSlot is for equip/innate toggles).
5. `stopPropagation` on expand click when inside selectable rows/cards (`ExpandableImage` default `true`).
6. Pair **`ListHeader` `hasThumbnailColumn`** with `GridListRow` `thumbnail`.
7. New art attach UX → Realms Image Library / `RealmsImagePicker` (TASK-495+), not a third upload field. Binding is `image_id` (ADR-0003).

## Anti-patterns

- Custom `<img>` + one-off lightbox / new preview modal per page.
- Storing card art only in `payload` when `image_id` / `image_url` columns exist.
- Different placeholder art per page.
- Duplicating Storage files per entity use (copy-on-attach).
- Non-admin uploads into the shared bank.
- Citing TASK-415 for the image bank — chip unification; bank epic is TASK-491+ (TASK-417 archived).
