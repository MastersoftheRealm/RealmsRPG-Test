-- Full rollback: inventory row-id + CAS helpers → master relational surface.
-- **Agents do not run.** Requires named backup and human apply.
--
-- Pin relational SQL to merge-base **8ae31ecd** (or current `master` before this PR merges).
--
-- **Order (all required; do not drop `inventory_row_id` before master expand/cutover/read/write):**
--   1. Revert deploy — roll back app build from before this PR (or revert merge).
--   2. `sql/characters-inventory-cas-patch-rollback.sql`  (drop CAS functions)
--   3. Re-apply from git ref 8ae31ecd:
--        `sql/characters-relational-expand.sql`
--        `sql/characters-relational-cutover.sql`
--        `sql/characters-relational-read-rpc.sql`
--        `sql/characters-relational-write-rpc.sql`
--   4. `sql/characters-inventory-row-id-rollback.sql`  (drop constraint + column)
--
-- CI proof after step 3: `sql/tests/inventory_cas_pgtap_post_rollback.sql` via `npm run test:inventory-cas-pgtap`.

BEGIN;
-- This file is documentation only; executable steps are the files named above.
COMMIT;