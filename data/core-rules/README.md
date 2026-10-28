# Core Rules Data (backup / re-seed source)

One JSON file per category (e.g. `PROGRESSION_PLAYER.json`, `ABILITY_RULES.json`). Used to document and export configurable rules for `public.core_rules`.

## Generate these files

From the repo root:

```bash
node scripts/seed-core-rules.js --export-json
```

This writes one `.json` file per category from the embedded `CORE_RULES` in `scripts/seed-core-rules.js`. Run after changing that data to refresh the JSON files.

## Loading into a database

Loading `core_rules` on any shared or production database requires **owner approval** and a **fresh backup** first. Use owner-directed SQL or migrations on a non-production project when developing schema changes. See [07-database-operations.md](../../src/docs/ai/guide/07-database-operations.md).

The app reads core rules via `/api/codex` (coreRules) and `useGameRules()`; admin edits save to `core_rules` via codex actions.
