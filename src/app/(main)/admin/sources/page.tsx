'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CodexBrowseListShell, ErrorDisplay, GridListRow } from '@/components/patterns';
import { EmptyState, PageContainer, PageHeader, Select } from '@/components/ui';
import { useSort } from '@/hooks/use-sort';
import {
  ADMIN_CODEX_SOURCE_SECTIONS,
  catalogNameList,
  otherSourcesLabel,
  rowsMatchingSource,
  type AdminCodexSourceRow,
} from '@/lib/codex/admin-source-list';
import type { CodexSourceCatalogEntry, CodexSourceTable } from '@/lib/codex/source-catalog';
import { fetchAdminCodexSourceCatalog, fetchAdminCodexSourceRows } from './actions';
import {
  ADMIN_SOURCES_BACK_LINK,
  ADMIN_SOURCES_EMPTY_CATALOG_MESSAGE,
  ADMIN_SOURCES_EMPTY_CATALOG_TITLE,
  ADMIN_SOURCES_EMPTY_SOURCE_TITLE,
  ADMIN_SOURCES_LIST_COLUMN_NAME,
  ADMIN_SOURCES_LIST_COLUMN_SOURCES,
  ADMIN_SOURCES_LOAD_ERROR,
  ADMIN_SOURCES_LOADING,
  ADMIN_SOURCES_PAGE_DESCRIPTION,
  ADMIN_SOURCES_PAGE_TITLE,
  ADMIN_SOURCES_SELECT_LABEL,
  ADMIN_SOURCES_SELECT_PLACEHOLDER,
} from './admin-sources-copy';

const CATALOG_QUERY_KEY = ['admin', 'sources', 'catalog'] as const;
const ROWS_QUERY_KEY = ['admin', 'sources', 'rows'] as const;

const LIST_GRID = '1.5fr 1fr';

const HEADER_COLUMNS = [
  { key: 'name', label: ADMIN_SOURCES_LIST_COLUMN_NAME },
  { key: 'sources', label: ADMIN_SOURCES_LIST_COLUMN_SOURCES },
];

function sectionTitle(label: string, count: number): string {
  return `${label} (${count})`;
}

function AdminSourceTypeSection({
  sectionLabel,
  rows,
  catalogNames,
  selectedSource,
  isLoading,
}: {
  sectionLabel: string;
  rows: AdminCodexSourceRow[];
  catalogNames: readonly string[];
  selectedSource: string;
  isLoading: boolean;
}) {
  const [search, setSearch] = useState('');
  const { sortState, handleSort } = useSort('name');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? rows.filter((row) => {
          const name = (row.name ?? '').toLowerCase();
          const others = otherSourcesLabel(row.sources, selectedSource, catalogNames).toLowerCase();
          return name.includes(q) || others.includes(q);
        })
      : rows;
    return [...base].sort((a, b) => {
      const aVal =
        sortState.col === 'sources'
          ? otherSourcesLabel(a.sources, selectedSource, catalogNames)
          : (a.name ?? '');
      const bVal =
        sortState.col === 'sources'
          ? otherSourcesLabel(b.sources, selectedSource, catalogNames)
          : (b.name ?? '');
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortState.dir === 1 ? cmp : -cmp;
    });
  }, [rows, search, selectedSource, catalogNames, sortState]);

  return (
    <section className="min-w-0">
      <h2 className="mb-3 text-lg font-semibold text-text-primary">{sectionLabel}</h2>
      <CodexBrowseListShell
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search names and sources…"
        searchAriaLabel={`Search ${sectionLabel}`}
        headerColumns={HEADER_COLUMNS}
        gridColumns={LIST_GRID}
        sortState={sortState}
        onSort={handleSort}
        isLoading={isLoading}
        loadingMessage={ADMIN_SOURCES_LOADING}
        isEmpty={!isLoading && filtered.length === 0}
        emptyTitle={ADMIN_SOURCES_EMPTY_SOURCE_TITLE}
        emptyMessage=""
      >
        {filtered.map((row) => (
          <GridListRow
            key={String(row.id)}
            id={String(row.id)}
            name={row.name ?? ''}
            gridColumns={LIST_GRID}
            columns={[
              {
                key: 'sources',
                value: otherSourcesLabel(row.sources, selectedSource, catalogNames),
              },
            ]}
          />
        ))}
      </CodexBrowseListShell>
    </section>
  );
}

export default function AdminSourcesPage() {
  const [pickedSource, setPickedSource] = useState('');

  const catalogQuery = useQuery({
    queryKey: CATALOG_QUERY_KEY,
    queryFn: () => fetchAdminCodexSourceCatalog(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const rowsQuery = useQuery({
    queryKey: ROWS_QUERY_KEY,
    queryFn: () => fetchAdminCodexSourceRows(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: catalogQuery.isSuccess,
  });

  const catalog = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const catalogNames = useMemo(
    () => catalogNameList(catalog, rowsQuery.data ?? {}),
    [catalog, rowsQuery.data],
  );

  const selectedSource = useMemo(() => {
    if (pickedSource && catalog.some((entry) => entry.name === pickedSource)) {
      return pickedSource;
    }
    return catalog[0]?.name ?? '';
  }, [pickedSource, catalog]);

  const selectedEntry = useMemo(
    () => catalog.find((entry) => entry.name === selectedSource),
    [catalog, selectedSource],
  );

  const loadError = catalogQuery.error ?? rowsQuery.error;
  const isLoading = catalogQuery.isPending || rowsQuery.isPending;

  const retry = () => {
    void catalogQuery.refetch();
    if (catalogQuery.isSuccess) void rowsQuery.refetch();
  };

  if (loadError) {
    return (
      <PageContainer size="xl">
        <div className="mb-4">
          <Link
            href="/admin"
            className="text-sm text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-outline-border"
          >
            {ADMIN_SOURCES_BACK_LINK}
          </Link>
        </div>
        <PageHeader title={ADMIN_SOURCES_PAGE_TITLE} description={ADMIN_SOURCES_PAGE_DESCRIPTION} />
        <ErrorDisplay
          message={loadError instanceof Error ? loadError.message : ADMIN_SOURCES_LOAD_ERROR}
          onRetry={retry}
        />
      </PageContainer>
    );
  }

  if (!isLoading && catalog.length === 0) {
    return (
      <PageContainer size="xl">
        <div className="mb-4">
          <Link
            href="/admin"
            className="text-sm text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-outline-border"
          >
            {ADMIN_SOURCES_BACK_LINK}
          </Link>
        </div>
        <PageHeader title={ADMIN_SOURCES_PAGE_TITLE} description={ADMIN_SOURCES_PAGE_DESCRIPTION} />
        <EmptyState
          title={ADMIN_SOURCES_EMPTY_CATALOG_TITLE}
          message={ADMIN_SOURCES_EMPTY_CATALOG_MESSAGE}
        />
      </PageContainer>
    );
  }

  const sourceOptions = catalog.map((entry) => ({
    value: entry.name,
    label: `${entry.name} (${entry.total})`,
  }));

  const countForTable = (table: CodexSourceTable, entry: CodexSourceCatalogEntry | undefined) =>
    entry?.counts[table] ?? 0;

  return (
    <PageContainer size="xl">
      <div className="mb-4">
        <Link
          href="/admin"
          className="text-sm text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-outline-border"
        >
          {ADMIN_SOURCES_BACK_LINK}
        </Link>
      </div>

      <PageHeader title={ADMIN_SOURCES_PAGE_TITLE} description={ADMIN_SOURCES_PAGE_DESCRIPTION} />

      <div className="mb-6 w-full min-w-0 sm:max-w-md">
        <Select
          label={ADMIN_SOURCES_SELECT_LABEL}
          placeholder={ADMIN_SOURCES_SELECT_PLACEHOLDER}
          options={sourceOptions}
          value={selectedSource}
          onChange={(event) => setPickedSource(event.target.value)}
          disabled={isLoading || sourceOptions.length === 0}
        />
      </div>

      {selectedSource ? (
        <div className="flex min-w-0 flex-col gap-10">
          {ADMIN_CODEX_SOURCE_SECTIONS.map((section) => {
            const tableRows = rowsMatchingSource(rowsQuery.data?.[section.table], selectedSource);
            const headingCount = selectedEntry
              ? countForTable(section.table, selectedEntry)
              : tableRows.length;
            if (!isLoading && headingCount === 0) return null;

            return (
              <AdminSourceTypeSection
                key={section.table}
                sectionLabel={sectionTitle(section.label, headingCount)}
                rows={tableRows}
                catalogNames={catalogNames}
                selectedSource={selectedSource}
                isLoading={isLoading}
              />
            );
          })}
          {!isLoading &&
            ADMIN_CODEX_SOURCE_SECTIONS.every(
              (section) =>
                countForTable(section.table, selectedEntry) === 0 &&
                rowsMatchingSource(rowsQuery.data?.[section.table], selectedSource).length === 0,
            ) && <EmptyState title={ADMIN_SOURCES_EMPTY_SOURCE_TITLE} message="" />}
        </div>
      ) : null}
    </PageContainer>
  );
}
