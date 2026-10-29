# Build validation (how-to)

Manual QA suites are recorded on **ClickUp** tasks. **Do not load historical archive docs to start a task.**

## When to add a row

Add or update a **DEV-V-###** test on the ClickUp task **only** when:

1. The change is user-facing and needs owner QA, and  
2. **CI does not already cover** the behavior (typecheck, vitest, Playwright/ui-verify, or another workflow gate).

Record pending QA on the **ClickUp task** (steps and expected results). Older DEV-* cross-references live in git history.

**ID scheme:** `DEV-V-###` (suite) and `DEV-V-###-T###` (single test). Do not reuse IDs that already appear in git history for the same suite.
