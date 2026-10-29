# Codex Seed Data

Place your exported Google Sheets CSV files here. The script also checks `Codex csv/` at project root if this folder is empty.

## Expected Files

| File | Table |
|------|-------|
| `feats.csv` | codex_feats |
| `parts.csv` | codex_parts |
| `properties.csv` | codex_properties |
| `species.csv` | codex_species |
| `traits.csv` | codex_traits |
| `skills.csv` | codex_skills |
| `archetypes.csv` | codex_archetypes |
| `creature_feats.csv` | codex_creature_feats |
| `equipment.csv` | codex_equipment |

## Format

- First row = column headers
- Use `id` or `name` column for document ID (or one will be generated)
- **Descriptions:** Keep as single strings (use quotes in CSV if they contain commas)
- **Arrays:** Only these columns are parsed as comma-separated arrays: `tags`, `sizes`, `skills`, `species_traits`, `ancestry_traits`, `flaws`, `characteristics`, `languages`, `adulthood_lifespan`, `type`, `mechanic`, `base_skill`
- Booleans: `true` / `false`

## Run

```bash
npm run db:seed
```

Use a non-production database unless the owner has approved a live seed. See [07-database-operations.md](../../src/docs/ai/guide/07-database-operations.md).

After approved codex tag edits, sync `feats.csv` from the database:

```bash
node scripts/sync-feat-tags-csv.js
```

## Fixing Corrupted Data

If descriptions were incorrectly split into arrays, fix the CSV sources and run `npm run db:seed` again (upsert only). Bulk deletes are not supported from repo scripts; ask the owner for an approved recovery plan on the target database.
