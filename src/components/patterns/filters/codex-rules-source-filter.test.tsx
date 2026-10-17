import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CodexRulesSourceFilter } from './codex-rules-source-filter';

vi.mock('@/app/(main)/admin/codex/source-catalog-action', () => ({
  listCodexSourceCatalog: vi.fn(() => Promise.resolve([])),
}));

function renderFilter(selectedValues: string[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <CodexRulesSourceFilter selectedValues={selectedValues} onChange={() => undefined} />
    </QueryClientProvider>,
  );
}

describe('CodexRulesSourceFilter', () => {
  it('shows a loading placeholder before the catalog resolves', () => {
    const html = renderFilter([]);
    expect(html).toContain('Sources');
    expect(html).toContain('Loading sources…');
    expect(html).not.toContain('Add a source');
  });

  it('keeps a selected chip while the catalog is still loading', () => {
    const html = renderFilter(['Retired']);
    expect(html).toContain('Retired');
    expect(html).toContain('Remove Retired');
  });
});
