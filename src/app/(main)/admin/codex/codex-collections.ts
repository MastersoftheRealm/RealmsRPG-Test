/**
 * Admin Codex — collection allowlist (SEC audit F-03).
 * The codex server actions write through an RLS-bypassing service-role client, so the
 * table name has to be checked at runtime; the `CodexCollection` union is erased at build.
 */

export type CodexCollection =
  | 'codex_feats'
  | 'codex_skills'
  | 'codex_species'
  | 'codex_traits'
  | 'codex_parts'
  | 'codex_properties'
  | 'codex_equipment'
  | 'codex_archetypes'
  | 'codex_creature_feats'
  | 'core_rules';

export const COLUMNAR_COLLECTIONS: readonly CodexCollection[] = [
  'codex_feats',
  'codex_skills',
  'codex_species',
  'codex_traits',
  'codex_parts',
  'codex_properties',
  'codex_equipment',
  'codex_archetypes',
  'codex_creature_feats',
];

const ALLOWED_COLLECTIONS: ReadonlySet<string> = new Set<string>([
  ...COLUMNAR_COLLECTIONS,
  'core_rules',
]);

export function isCodexCollection(value: unknown): value is CodexCollection {
  return typeof value === 'string' && ALLOWED_COLLECTIONS.has(value);
}

export function isColumnarCollection(value: unknown): boolean {
  return isCodexCollection(value) && value !== 'core_rules';
}

/** Throws before any Supabase client is constructed when the caller passes an unknown table. */
export function assertCodexCollection(value: unknown): CodexCollection {
  if (!isCodexCollection(value)) throw new Error('Unknown collection');
  return value;
}
