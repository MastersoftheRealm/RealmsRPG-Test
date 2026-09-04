# ADR-0026: Guest local characters (browser-only sheet)

- **Status:** Accepted
- **Date:** 2026-09-02
- **Deciders:** owner (DEV-Q09 proceed) / agent (Architect role)

## Context

Guests can finish Guided / Legacy create, but **Continue Without Saving** only dismissed `LoginPromptModal`. Drafts stayed in the wizard; `/characters` stayed empty; the sheet never opened. Product need: try the game / try a character without an account.

In-repo analog: guest **encounters** (`guest-encounter-storage.ts`, `local-` ids, hook/service branch, `migrateGuestEncountersOnSignIn`). Character sheets are larger (autosave, dirty PATCH, realtime, public GET) so a second guest UI would fork the retention surface.

## Decision

Clone the encounter pattern for **finished** characters (not a new zustand store):

- `guest-character-storage.ts` + `guest-character-migration.ts`; ids `local-` + UUID.
- Cap **3** per browser. Oversized portrait data-URLs are omitted (same ~700KB draft cap).
- `getCharacter` / `saveCharacter` / `deleteCharacter` / `duplicateCharacter` never call `/api/characters` for `local-` ids (IDOR hygiene).
- Finalize tertiary: **Continue without signing in** → persist lean payload → `/characters/local-…` on the existing sheet. Log In / Create Account stay primary.
- Guest is **owner** on that sheet (play + local autosave). Campaigns, public share, and portrait Storage upload stay account-gated.
- Sign-in **auto-migrates** like encounters (best-effort). Library Load/Save keep dismiss-only tertiary copy.

## Consequences

- Positive: try-the-game reaches a playable sheet; one sheet shell; migrate reuses create + portrait upload.
- Negative / follow-ups: character lives only in this browser; clearing site data removes it; `local-` URLs are not shareable; leftover locals after a failed migrate still use `local-` ids (filter them out of campaign join/add).
- Rejected: copy-only rename of Continue Without Saving; anonymous Supabase rows; a second guest sheet UI.
