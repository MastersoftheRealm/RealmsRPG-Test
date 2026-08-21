> Back: [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) · Core: [`ARCHITECTURE_CONSTITUTION.md`](../ARCHITECTURE_CONSTITUTION.md)

# Entity Card Art & Expandable Images (TASK-405 / TASK-491+)

**Product authority:** `REALMS_PRODUCT_OVERVIEW.md` §5.0.3 — one Realms Image Library (master asset + category tags). **Architecture:** [`ADR-0003`](../ADR/0003-realms-image-library.md). **Schema authority:** `SUPABASE_SCHEMA.md` — `realms_images` catalog; consumers use nullable **`image_id`** FK (optional denormalized `image_url` cache). Do not invent ad-hoc payload image keys when columns exist.

**Goal:** One resolution pipeline for placeholders + bank URLs; unified **click-to-enlarge** via `ExpandableImage`; list thumbs and choice-card heroes share the same preview modal. Agents must **extend** these building blocks — not fork per page.

## Building blocks (use these)

| Piece | Location | Role |
|-------|----------|------|
| **ExpandableImage** | `src/components/patterns/help/expandable-image.tsx` | **Default** for any meaningful inline image — wraps visible image, click opens `ExpandableImageModal` (`object-contain`, `fullScreenOnMobile`, soft `bg-image-matte` behind art). Use `stopPropagation` inside selectable cards/rows. |
| **ExpandableImageModal** | same file | Controlled preview only (rare); prefer `ExpandableImage`. |
| **readRecordImageUrl** / **resolveChoiceCardImage** | `guided-choice-image.ts` → `entity-image-url.ts`; placeholders via `lib/placeholder-art.ts` (`getPlaceholderCardArtPath`, dark `-dark.svg` pairs) | Read `image_url` / bank join; fall back to typed SVG placeholders (theme via `usePlaceholderTheme` in client surfaces). |
| **resolveListRowThumbnail** / **resolveSpeciesListRowThumbnail** | `src/lib/list-row-image.ts` | Wraps `resolveChoiceCardImage` (light path) → `ListRowThumbnail` applies dark swap via `getThemedPlaceholderSrc` |
| **ListRowThumbnail** | `src/components/patterns/list/list-row-thumbnail.tsx` | 44×44 list thumb — thin wrapper over `ExpandableImage` for `GridListRow.thumbnail` |
| **GridListRow** `thumbnail` | `src/components/patterns/list/grid-list-row.tsx` | D&D Beyond list style + `ListHeader` `hasThumbnailColumn` |
| **GuidedChoiceCard** | `src/components/guided-creator/guided-choice-card.tsx` | Choice cards — hero art via `ExpandableImage` inside card |
| **realms-images.ts** | `src/lib/realms-images.ts` | Bank types, category enum, client CRUD helpers (`apiUpload` / `apiFetch`) — TASK-492; sole authoring upload path after TASK-498 |
| **`/api/images*`** | `src/app/api/images/` | Bank list (public), create/replace/delete/usage (admin) |
| **Admin Image Library** | `/admin/images` (TASK-493) | Admin browse/upload/rename/retag/replace/delete for bank assets; dashboard card under **Admin** |
| **RealmsImagePicker / RealmsImageField** | `src/components/patterns/chrome/realms-image-picker.tsx` | Shared bank browse + select and compact entity binding; admin-only upload-into-bank. Set `image_id` plus URL cache. Filter with `categories` or `'empowered-technique'` / `'portrait'`. |

## Decision matrix — which surface?

| User-facing surface | Implement with | Image resolution |
|---------------------|----------------|------------------|
| **Any inline image** (species art, portrait, card hero, list thumb) | **`ExpandableImage`** wrapping `next/image` or `img` | Pass `src`, `alt`, optional `isPlaceholder` |
| Codex / Library / Admin **sortable list** | `GridListRow` `thumbnail` → `ListRowThumbnail` | `resolveListRowThumbnail(…)` |
| Guided creator **choice card** | `GuidedChoiceCard` (uses `ExpandableImage` internally) | `imageKind` + `imageRecord` / `imageUrl` |
| Species **reveal** / preview **portraits** | `ExpandableImage` directly | `resolveChoiceCardImage` or portrait URL |
| Admin / official **authoring** | `RealmsImageField` → `RealmsImagePicker` (+ admin upload into bank) | Set `image_id`; do not fork upload fields |
| Admin **bank management** | `/admin/images` | Upload/rename/tag/replace/delete master assets (TASK-493) |
| Decorative / redundant (`alt=""` only) | Plain `Image` / `img` — **no** expand | — |

## Adoption inventory (TASK-478)

Audited all direct `<Image>` / `<img>` call sites on 2026-07-17. The meaningful,
standalone display surfaces use `ExpandableImage` directly or through
`ListRowThumbnail` / `GuidedChoiceCard`:

- Entity art: sortable list thumbnails, guided choice cards, species reveal,
  creature stat blocks, and the admin image preview.
- Portraits: guided preview panels, read-only character-sheet header, campaign
  roster chips, and the account profile photo.

Plain images remain intentional in these cases:

- **Primary-action images:** character cards navigate; campaign join/add rows select;
  guided/advanced portrait controls and editable sheet portraits open the image
  chooser; RealmsImagePicker tiles select an asset. Do not nest an expand button
  inside those links/buttons.
- **Authoring-only previews:** crop/output previews inside `ImageUploadModal` show
  the pending edit and are not content-browse surfaces.
- **Decorative, branding, and control graphics:** header/auth logos, landing/about
  compositions, dice/roll graphics, provider icons, and decorative art use plain
  images. Their role is identity, layout, or redundant control feedback—not
  inspectable entity content.
- **Fallback / missing portraits:** theme-aware inline “?” via `getFallbackPortraitDataUrl` / `useEffectivePortrait` / `PortraitThumb` (`character/portrait-thumb.tsx`). Read-only sheet portrait `ExpandableImage` must use `disabled` + `isPlaceholder` on fallback — do not open a preview of the placeholder.

When a primary-action surface also needs enlargement, add a separate, explicitly
labelled preview action; do not make one click perform both behaviors.

## Entities with / without art

| Entity | Art? | Category tag(s) for picker |
|--------|------|----------------------------|
| Species, creatures | Yes | `species` / `creature` |
| Weapons, armor, shields, equipment | Yes | matching tag; equipment is first-class |
| Powers, techniques | Yes | `power` / `technique` |
| Empowered techniques | Yes | filter `power` **OR** `technique` (no empowered tag) |
| Feats, skills, archetypes, parts, properties, creature feats, traits | **No** | — |
| Enhanced items | Deferred | TASK-500 |

**User library consumers (TASK-497):** `user_species`, `user_creatures`, `user_items`, `user_powers`, `user_techniques`, and `user_empowered_techniques` store the same nullable `image_id` (+ `image_url` cache) as official/codex. Creators pick bank art; private save and add-to-library copy preserve the master ref. Non-admins do not upload into the bank.

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

## Adoption inventory + justified exceptions (TASK-478)

**Default:** meaningful inline art → `ExpandableImage` (or `ListRowThumbnail` / `GuidedChoiceCard`).

### Adopted (click-to-enlarge)

| Surface | Implementation |
|---------|----------------|
| Guided choice card heroes | `GuidedChoiceCard` → `ExpandableImage` |
| Species reveal / character preview portraits | `ExpandableImage` directly |
| Codex / Admin species list thumbs | `GridListRow.thumbnail` → `ListRowThumbnail` |
| Codex / Admin / Library equipment (armaments) list thumbs | `GridListRow.thumbnail` → `resolveListRowThumbnail('equipment', …)` |
| Library + Official powers / techniques / creatures list thumbs | `resolveListRowThumbnail('power' \| 'technique' \| 'creature', …)` (TASK-533) |
| Character sheet library GLRs (powers/techniques/armaments) | `entity-library-sections` + `library-entity-rows` → `resolveListRowThumbnail` |
| UnifiedSelectionModal art-capable rows | `SelectableItem.thumbnail` from `buildSelectableItem` / empowered / creature `displayItemToSelectableItem` |
| Advanced creator selected equipment + power/technique lists | same resolve helpers |
| Creature creator selected power/technique/armament lists | persist `image_*` on add; `resolveListRowThumbnail` on selected GLRs |
| CreatureStatBlock collapsed row + nested power/technique/armament lists | `resolveListRowThumbnail` |
| CreatureStatBlock nested equipment GLR | `hasThumbnailColumn` + equipment kind |
| Creature stat-block portrait | `CreatureStatBlock` → `ExpandableImage` |
| Character sheet portrait (play / non-edit) | `sheet-header` → `ExpandableImage` |
| Campaign roster character chip | `campaigns/[id]` `CharacterChip` → `ExpandableImage` |
| Account profile photo | `/my-account` → `ExpandableImage` |
| Admin Image Library list thumbs | `ListRowThumbnail` (bank UI) |

### Justified exceptions (do **not** wrap in `ExpandableImage`)

| Surface | Why |
|---------|-----|
| **Character list cards** (`character-card.tsx`) | Portrait is inside a `Link` to the sheet — nested expand button is invalid HTML; primary action is navigate. |
| **Sheet portrait in edit mode** | Click opens `ImageUploadModal` (change portrait), not preview. |
| **Campaign “add character” picker thumbs** | Decorative (`alt=""`) inside a selectable row `button`. |
| **Authoring / crop previews** (`RealmsImageField`, `ImageUploadModal`, guided/advanced portrait upload slots) | Upload/crop affordance, not browse-to-enlarge. |
| **RealmsImagePicker upload preview** | Bank picker authoring chrome (TASK-495+). |
| **Landing / auth / layout chrome** (logo, hero, dice decor, OAuth icons) | Branding / decorative — not entity art. |
| **Dice roller / roll-log faces** | Game chrome, not entity art. |

When adding a new exception, add a `// DESIGN_INTENT:` at the call site **and** a row in `DESIGN_INTENT.md` (ExpandableImage exceptions).
