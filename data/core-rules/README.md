# Core Rules Data (backup / re-seed source)

One JSON file per category (e.g. `PROGRESSION_PLAYER.json`, `ABILITY_RULES.json`). Used to re-create or re-seed the `public.core_rules` table after Path C.

## Generate these files

From the repo root:

```bash
node scripts/seed-core-rules.js --export-json
```

This writes one `.json` file per category from the embedded `CORE_RULES` in `scripts/seed-core-rules.js`. Run after changing that data to refresh the JSON files.

## After Path C Phase 0 Part 2

1. Run `sql/create-public-core-rules.sql` in Supabase SQL Editor (creates `public.core_rules`).
2. Seed the table: `node scripts/seed-core-rules.js` (uses embedded CORE_RULES; Prisma must point at `public` schema).

The app reads core rules via `/api/codex` (coreRules) and `useGameRules()`; admin edits save to `core_rules` via codex actions.
