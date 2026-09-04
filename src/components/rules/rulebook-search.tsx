'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SearchInput } from '@/components/ui';
import { searchRulebook, type RulebookSearchChunk } from '@/lib/rules/rulebook-search';

export function RulebookSearch({ chunks }: { chunks: readonly RulebookSearchChunk[] }) {
  const [query, setQuery] = useState('');
  const hits = useMemo(() => searchRulebook(chunks, query), [chunks, query]);
  const showResults = query.trim().length >= 2;

  return (
    <div className="mb-4 px-1">
      <SearchInput
        value={query}
        onChange={setQuery}
        size="sm"
        placeholder="Search the rulebook"
        aria-label="Search the rulebook"
      />
      {showResults ? (
        <ul className="mt-2 space-y-1" role="listbox" aria-label="Rulebook search results">
          {hits.length === 0 ? (
            <li className="px-3 py-2 text-sm text-text-muted">No matching rules.</li>
          ) : (
            hits.map((hit) => (
              <li key={`${hit.slug}-${hit.headingId}-${hit.href}`}>
                <Link
                  href={hit.href}
                  className="touch-tier-standard block rounded-md px-3 py-1.5 hover:bg-surface-alt"
                >
                  <span className="block text-sm font-medium text-text-primary">
                    {hit.headingTitle}
                  </span>
                  <span className="block text-xs text-text-muted">{hit.chapterTitle}</span>
                  <span className="mt-0.5 block text-xs text-text-secondary">{hit.snippet}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
