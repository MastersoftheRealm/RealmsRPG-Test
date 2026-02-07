# Codex Seed Data

Place your exported Google Sheets CSV files here.

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
- Arrays: comma-separated values in a single cell
- Booleans: `true` / `false`

## Run

```bash
npm run db:seed
```
