/**
 * Raw-color migration backlog (ratchet allowlist)
 * ===============================================
 * Files that still contain raw Tailwind palette colors / hex as of the Phase 0a
 * audit. `realms/no-raw-color` is disabled ONLY for these paths so the build can
 * stay green today while the rule hard-blocks every other file and all new code.
 *
 * DELETE entries as files are migrated to semantic tokens (Phase 1/4). The
 * end-state is an empty array, at which point this file and the corresponding
 * eslint.config.mjs override can be removed.
 *
 * Regenerate/audit with: node scripts/list-raw-color-backlog.mjs
 */
export const RAW_COLOR_BACKLOG = [];
