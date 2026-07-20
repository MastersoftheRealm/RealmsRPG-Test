// Grid columns for Advanced creator feat lists (Name, Category, Ability, Recovery, Uses, Add).
// Not the same track sizes as Codex `lib/codex/feat-list` FEAT_GRID_COLUMNS.
export const FEAT_GRID_COLUMNS = '1.5fr 1fr 0.8fr 0.8fr 0.8fr 44px';
export const FEAT_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'category', label: 'CATEGORY' },
  { key: 'ability', label: 'ABILITY' },
  { key: 'rec_period', label: 'RECOVERY' },
  { key: 'uses_per_rec', label: 'USES' },
  { key: '_actions', label: '', sortable: false as const },
];

export interface SelectedFeat {
  id: string;
  name: string;
  description?: string;
  type: 'archetype' | 'character';
}

export interface FeatFilters {
  search: string;
  categories: string[];
  abilityFilter: string[];
  /** Either archetype feats or character feats (no "all" in creator) */
  featType: 'archetype' | 'character';
  hideUnqualified: boolean;
  sortCol: string;
  sortDir: 1 | -1;
}
