# ADR-0007: Co-located private extracts for shared hot modules

- **Status:** accepted
- **Date:** 2026-07-21
- **Deciders:** agent (Architect path for allowlist only; TASK-611)
- **Task:** TASK-611

## Context

Shared hotspots (`creature-stat-block`, `entity-library-sections`, `grid-list-row`) and `lib/data-enrichment` exceeded ~1000 LOC. TASK-611 requires facades ≤ ~500 LOC via co-located extracts **without** growing the public shared barrel API.

New files under `src/components/patterns/` must appear on `scripts/shared-ui-allowlist.json` (CI gate), which is an Architect surface even when the files are private implementation details.

## Decision

Split each hotspot into **private co-located siblings** (or `src/lib/data-enrichment/*`) imported only by the existing facade file. Keep consumer imports on the same facade / shared barrel paths. Do **not** add new named exports to `src/components/patterns/index.ts` for these internals.

Allowlist entries for the new private shared files are required for CI; this ADR records that they are implementation splits, not new public shared UI contracts.

## Consequences

- Positive: Hot modules become maintainable; consumers unchanged; no parallel GridListRow / library-section chrome.
- Negative / follow-ups: Allowlist grows with private files; future public shared APIs still need a separate ADR.
- Rejected alternatives: New barrel exports per extract (unnecessary API surface); moving React chrome into `lib/` (wrong layer).
