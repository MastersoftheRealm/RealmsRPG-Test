# Agent Sources of Truth

Purpose: a compact, machine- and human-friendly reference so agents know where to look and what to update.

- **Components:**
  - UI components: `src/components/` (subfolders: `character-sheet/`, `creator/`, `shared/`, `ui/`)
  - Presentational building blocks: `src/components/shared/grid-list-row.tsx`, `src/components/shared/skill-row.tsx`, `src/components/shared/list-header.tsx`

- **Pages / App routes:**
  - App pages: `src/app/` (notable routes: `(main)/library`, `(main)/item-creator`, `(main)/characters/[id]`, `(main)/power-creator`, `(main)/technique-creator`)

- **Data & Enrichment:**
  - Enrichment and server helpers: `src/lib/data-enrichment.ts`, `src/lib/*`, `src/services/*`
  - Character and item shapes: `src/types/` and `src/lib/item-transformers.ts`

- **State & Hooks:**
  - Stores: `src/stores/` (e.g. `character-creator-store.ts`) and hooks in `src/hooks/` (e.g. `use-characters.ts`, `use-creator-cache.ts`)

- **Utilities & Calculations:**
  - `src/lib/calculators/`, `src/lib/utils/`, `src/lib/constants/`

- **Styles & UI system:**
  - Tailwind CSS is used; global styles in `src/app/globals.css` and `postcss.config.mjs`.
  - Prefer component-level classes and shared `ui` components under `src/components/ui/`.

- **Hosting & secrets:**
  - Hosting: Firebase Hosting (frameworks backend). Deploy via `firebase deploy`.
  - Secrets: use Google Cloud Secret Manager (do NOT store service account keys in repo). CI and deploy expect secrets filled externally.

- **Agent workflow preferences (owner policy):**
  - Agents may implement changes directly and open PRs; prefer to implement when the fix is unambiguous.
  - Ask the owner only when multiple UX/architecture options exist or when data/permissions are unclear.
  - Do not autopush/auto-merge without explicit `--autopush` approval from owner.
  - On PR: include screenshots for visual changes, update `src/docs/ai/AI_TASK_QUEUE.md` `status` and add PR link to `notes`, append summary to `src/docs/ai/AI_CHANGELOG.md`.

- **Where to record progress:**
  - Tasks: `src/docs/ai/AI_TASK_QUEUE.md`
  - Changelog: `src/docs/ai/AI_CHANGELOG.md`
  - Raw feedback: `src/docs/ALL_FEEDBACK_CLEAN.md` (append owner-provided raw entries)

- **Quick tips for agents:**
  - Run `npm run build` locally before opening a PR; CI will run build + reconciliation.
  - When changing field names used across enrichment and UI (e.g. `energy` vs `cost`), update `src/lib/data-enrichment.ts` and add a small migration/adaptor where needed.
  - For list column changes, prefer updating `src/components/shared/grid-list-row.tsx` so multiple lists inherit the change.

If anything here is unclear, ask the owner one focused question rather than proposing many options.
