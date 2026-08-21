/**
 * Codex detail URL slugs (ADR-0021).
 * `{slugified-name}--{id}` so lookup is by id without a slug column.
 */

const NON_SLUG = /[^a-z0-9]+/g;

export function slugifyCodexName(name: string): string {
  const slug = name
    .normalize('NFKD')
    .toLowerCase()
    .replace(NON_SLUG, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'entry';
}

export function codexEntrySlug(name: string, id: string): string {
  return `${slugifyCodexName(name)}--${id}`;
}

export function parseCodexEntrySlug(slug: string): { nameSlug: string; id: string } | null {
  const separator = slug.lastIndexOf('--');
  if (separator <= 0) return null;
  const id = slug.slice(separator + 2);
  const nameSlug = slug.slice(0, separator);
  if (!id || !nameSlug) return null;
  return { nameSlug, id };
}

export function codexDetailHref(
  collection: CodexDetailCollection,
  name: string,
  id: string,
): string {
  return `/codex/${collection}/${codexEntrySlug(name, id)}`;
}

/** URL segment under `/codex/[collection]/[slug]`. */
export const CODEX_DETAIL_COLLECTIONS = [
  'feats',
  'skills',
  'species',
  'archetypes',
  'equipment',
  'properties',
  'parts',
  'traits',
  'creature-feats',
] as const;

export type CodexDetailCollection = (typeof CODEX_DETAIL_COLLECTIONS)[number];

export function isCodexDetailCollection(value: string): value is CodexDetailCollection {
  return (CODEX_DETAIL_COLLECTIONS as readonly string[]).includes(value);
}

export const CODEX_DETAIL_TABLE: Record<CodexDetailCollection, string> = {
  feats: 'codex_feats',
  skills: 'codex_skills',
  species: 'codex_species',
  archetypes: 'codex_archetypes',
  equipment: 'codex_equipment',
  properties: 'codex_properties',
  parts: 'codex_parts',
  traits: 'codex_traits',
  'creature-feats': 'codex_creature_feats',
};

export const CODEX_DETAIL_LABEL: Record<CodexDetailCollection, string> = {
  feats: 'Feat',
  skills: 'Skill',
  species: 'Species',
  archetypes: 'Archetype Path',
  equipment: 'Equipment',
  properties: 'Armament Property',
  parts: 'Part',
  traits: 'Trait',
  'creature-feats': 'Creature Feat',
};
