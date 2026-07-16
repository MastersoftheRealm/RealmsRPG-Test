# ADR-0003: Realms Image Library (shared bank + image_id)

- **Status:** Accepted
- **Date:** 2026-07-16
- **Deciders:** owner (LOCKED 2026-07-16); agent Architect (TASK-491)
- **Supersedes:** REALMS §5.0.3 “three-layer” framing; TASK-417 art-bank-only scope

## Context

TASK-405 shipped entity-tied uploads (`codex-art/{entityType}/{entityId}.jpg` → row `image_url`). Product needs a **single shared image bank** with multi-category tags, admin replace/delete with usage awareness, and guest-readable picking — without duplicating Storage objects per use. Older docs incorrectly cited TASK-415 (chip unification) for art bank; canonical superseded stub is TASK-417.

## Decision

### Catalog & storage

- Master table **`realms_images`**: one row + **one Storage object** per asset (bucket may reuse/evolve `codex-art`; path keyed by image id, not entity id).
- Multi-select **category tags** on the master (enum locked):  
  `species` | `creature` | `weapon` | `armor` | `shield` | `equipment` | `power` | `technique`.  
  Example: dagger → `equipment` + `weapon` + `shield` + `technique`.
- **No** separate `empowered` tag — empowered-technique pickers filter `power` **OR** `technique`.
- Enhanced items: **out of MVP** (TASK-500).

### Entity binding

- Source of truth on consumers: nullable **`image_id`** FK → `realms_images.id`.
- Optional denormalized **`image_url`** cache on the entity, synced when the master file is replaced — **never** a second file copy.
- Existing `image_url`-only rows migrate to `image_id` (+ cache) in TASK-494 / TASK-498.
- **WITH art:** species, creatures, weapons, armor, shields, equipment (incl. `codex_equipment`), powers, techniques, empowered techniques (column yes; tag no).
- **WITHOUT art columns:** feats, skills, archetypes, parts, properties, creature feats, traits.

### Replace / delete

- **Replace:** admin replaces file/metadata on the master → all `image_id` consumers show new art (update cache URLs).
- **Delete:** warn with full usage list; delete-without-replace clears `image_id` (and cache) everywhere, then removes master row + Storage object.

### Roles & surfaces

- **Write into bank:** admin only — (a) `/admin/images`, or (b) admin publish-to-Realms / official editors (auto name = entity name, auto tag = entity category).
- **Pick / attach:** guests + all signed-in users (read only into bank). Non-admins do **not** upload into the bank.
- **Portrait / profile:** may pick bank images tagged `species` or `creature` (TASK-499); personal photo upload paths remain.
- UI: reuse **`ImageUploadModal`** (5MB, jpeg/png/gif/webp, square crop) — no fork. Shared picker: **`RealmsImagePicker`** (`src/components/shared/realms-image-picker.tsx`, TASK-495) — guest-readable browse, `onSelect` sets `image_id`, admin upload-into-bank only.

### Interim code

- Keep `/api/upload/codex-art` + `CodexArtUploadField` until TASK-496/498 migrate callers to bank upload + `image_id`.

## Consequences

- Positive: one asset, many refs; multi-tag pickers; replace-everywhere; clear admin vs pick roles.
- Follow-ups: TASK-492 (schema/API) → 493‖495 → 494/496/497/499 → 498; TASK-417 archived (superseded by this epic; scope in TASK-497); TASK-500 deferred.
- Rejected: three competing pipelines (entity file + separate bank + privileged user bank upload); per-use file copies; bank-only equipment with no entity `image_id`; non-admin uploads into the shared bank.
