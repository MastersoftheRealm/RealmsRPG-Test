import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CodexArchetypesTab } from './CodexArchetypesTab';
import { CodexCreatureFeatsTab } from './CodexCreatureFeatsTab';
import { CodexEquipmentTab } from './CodexEquipmentTab';
import { CodexFeatsTab } from './CodexFeatsTab';
import { CodexPartsTab } from './CodexPartsTab';
import { CodexPropertiesTab } from './CodexPropertiesTab';
import { CodexSkillsTab } from './CodexSkillsTab';
import { CodexSpeciesTab } from './CodexSpeciesTab';
import { CodexTraitsTab } from './CodexTraitsTab';

const emptyQuery = {
  data: [] as unknown[],
  isLoading: false,
  error: null,
  refetch: () => undefined,
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => undefined }),
}));

vi.mock('@/hooks/use-codex-source-catalog', () => ({
  useCodexSourceCatalog: () => ({ options: [], isLoading: false, isError: false }),
}));

vi.mock('@/hooks/use-game-rules', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-game-rules')>();
  return {
    ...actual,
    useGameRules: () => ({
      rules: actual.getGameRulesFallback(),
      isLoading: false,
      error: null,
    }),
  };
});

vi.mock('@/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks')>();
  return {
    ...actual,
    useCodexFeats: () => emptyQuery,
    useCodexSkills: () => emptyQuery,
    useCodexArchetypes: () => emptyQuery,
    useSpecies: () => emptyQuery,
    useUserSpecies: () => emptyQuery,
    useTraits: () => emptyQuery,
    useEquipment: () => emptyQuery,
    useItemProperties: () => emptyQuery,
    useParts: () => emptyQuery,
    useCreatureFeats: () => emptyQuery,
    useCharacter: () => ({ data: undefined, isLoading: false, error: null }),
    useCharacters: () => ({ data: [], isLoading: false, error: null }),
    useOfficialLibrary: () => emptyQuery,
    usePathListFilter: () => ({
      selectedPathIds: [] as string[],
      setSelectedPathIds: () => undefined,
      pathIndex: { options: [] as { id: string; name: string }[] },
      pathRecommendedIds: null,
      pathFilterActive: false,
    }),
  };
});

function searchInputLabel(html: string): string | undefined {
  const inputs = html.match(/<input\b[^>]*>/g) ?? [];
  const search = inputs.find((tag) => tag.includes('search-input'));
  return search?.match(/\baria-label="([^"]*)"/)?.[1];
}

describe('Codex search fields have an accessible name (86e3jmdp9)', () => {
  it.each([
    ['Feats', 'Search names, tags, descriptions', CodexFeatsTab],
    ['Skills', 'Search names, descriptions', CodexSkillsTab],
    ['Species', 'Search species', CodexSpeciesTab],
    ['Archetypes', 'Search archetype paths', CodexArchetypesTab],
    ['Equipment', 'Search equipment', CodexEquipmentTab],
    ['Properties', 'Search properties', CodexPropertiesTab],
    ['Parts', 'Search parts', CodexPartsTab],
    ['Traits', 'Search traits', CodexTraitsTab],
    ['Creature Feats', 'Search creature feats', CodexCreatureFeatsTab],
  ] as const)('%s search is labeled %s', (_tab, label, Tab) => {
    const html = renderToStaticMarkup(<Tab codexMode="public" />);
    expect(searchInputLabel(html)).toBe(label);
  });
});
