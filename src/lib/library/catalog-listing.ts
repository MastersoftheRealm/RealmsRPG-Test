/**
 * Official / Codex catalog listing (ADR-0027).
 * Created library items: listed = Public library catalogs; unlisted = Admin library.
 * Packs / piece paywalls are a later system — do not filter parents by child ownership.
 */

export const CATALOG_LISTINGS = ['listed', 'unlisted'] as const;
export type CatalogListing = (typeof CATALOG_LISTINGS)[number];

export const DEFAULT_CATALOG_LISTING: CatalogListing = 'listed';

export type CreatorSaveTarget = 'private' | 'public' | 'admin';

export const CATALOG_LISTING_LABELS: Record<CatalogListing, string> = {
  listed: 'Public library',
  unlisted: 'Admin library',
};

export const CREATOR_SAVE_TARGET_OPTIONS: {
  value: CreatorSaveTarget;
  label: string;
}[] = [
  { value: 'private', label: 'My library' },
  { value: 'public', label: CATALOG_LISTING_LABELS.listed },
  { value: 'admin', label: CATALOG_LISTING_LABELS.unlisted },
];

export type CatalogListingScope = 'all' | CatalogListing;

export const CATALOG_LISTING_SCOPE_OPTIONS: {
  value: CatalogListingScope;
  label: string;
}[] = [
  { value: 'all', label: 'All' },
  { value: 'listed', label: CATALOG_LISTING_LABELS.listed },
  { value: 'unlisted', label: CATALOG_LISTING_LABELS.unlisted },
];

export function catalogListingClassOptions(compact: boolean): {
  value: CatalogListing;
  label: string;
}[] {
  return [
    { value: 'listed', label: compact ? 'Public' : CATALOG_LISTING_LABELS.listed },
    { value: 'unlisted', label: compact ? 'Admin' : CATALOG_LISTING_LABELS.unlisted },
  ];
}

export function parseCatalogListing(value: unknown): CatalogListing {
  return value === 'unlisted' ? 'unlisted' : DEFAULT_CATALOG_LISTING;
}

export function catalogListingToSaveTarget(
  listing: CatalogListing,
): Exclude<CreatorSaveTarget, 'private'> {
  return listing === 'unlisted' ? 'admin' : 'public';
}

export function saveTargetToCatalogListing(target: CreatorSaveTarget): CatalogListing | null {
  if (target === 'private') return null;
  return target === 'admin' ? 'unlisted' : 'listed';
}

export function isOfficialSaveTarget(target: CreatorSaveTarget): boolean {
  return target === 'public' || target === 'admin';
}

export function wantsIncludeUnlisted(searchParams: URLSearchParams): boolean {
  return searchParams.get('includeUnlisted') === '1';
}

export function officialLibraryQueryPath(type: string, includeUnlisted: boolean): string {
  const base = `/api/official/${type}`;
  return includeUnlisted ? `${base}?includeUnlisted=1` : base;
}

/** Resolve creator save destination from a loaded library row. */
export function resolveCreatorSaveTargetFromItem(item: unknown): CreatorSaveTarget {
  if (!item || typeof item !== 'object') return 'private';
  const row = item as {
    _source?: unknown;
    catalogListing?: unknown;
    catalog_listing?: unknown;
  };
  if (row._source !== 'official') return 'private';
  return catalogListingToSaveTarget(parseCatalogListing(row.catalogListing ?? row.catalog_listing));
}

/** Find a load-modal / ?edit= row by id or docId. */
export function findLoadedLibraryItem(
  items: readonly unknown[],
  editId: string | null | undefined,
): unknown {
  if (!editId) return undefined;
  return items.find((item) => {
    if (!item || typeof item !== 'object') return false;
    const row = item as { id?: unknown; docId?: unknown };
    return String(row.id ?? '') === editId || String(row.docId ?? '') === editId;
  });
}
