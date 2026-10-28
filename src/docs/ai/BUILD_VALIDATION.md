# Build validation (how-to)

Manual QA suites live in the archive. **Do not load them to start a task.**

## When to add a row

Add or update a **DEV-V-###** test in the archive **only** when:

1. The change is user-facing and needs owner QA, and  
2. **CI does not already cover** the behavior (typecheck, vitest, Playwright/ui-verify, or another workflow gate).

Put new suites and tests in [`archive/BUILD_VALIDATION_SUITES.md`](archive/BUILD_VALIDATION_SUITES.md). Older or superseded material may also appear in [`archive/BUILD_VALIDATION_ARCHIVE.md`](archive/BUILD_VALIDATION_ARCHIVE.md). Do not delete tests — move them.

Record pending QA on the **ClickUp task** (steps and expected results). The old repo task-queue index was removed; use ClickUp and git history for historical DEV-* cross-references.

**ID scheme:** `DEV-V-###` (suite) and `DEV-V-###-T###` (single test). Do not reuse IDs that already exist in the archive files.
