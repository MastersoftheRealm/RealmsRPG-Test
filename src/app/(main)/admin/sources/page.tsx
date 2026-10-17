'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CodexBrowseListShell, ErrorDisplay, GridListRow } from '@/components/patterns';
import {
  Button,
  EmptyState,
  LoadingState,
  PageContainer,
  PageHeader,
  Select,
} from '@/components/ui';
import { codexKeys } from '@/hooks/use-codex';
import { useSort } from '@/hooks/use-sort';
import {
  ADMIN_CODEX_SOURCE_SECTIONS,
  catalogNameList,
  otherSourcesLabel,
  rowsMatchingSource,
  type AdminCodexSourceRow,
} from '@/lib/codex/admin-source-list';
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
  ADMIN_SOURCES_SEARCH_PLACEHOLDER,
  ADMIN_SOURCES_SELECT_LABEL,
  ADMIN_SOURCES_SELECT_PLACEHOLDER,
  adminSourcesSectionSearchLabel,
} from './admin-sources-copy';

/** Same prefix as `useCodexSourceCatalog` so an admin save refreshes this page. */
const CATALOG_QUERY_KEY = [...codexKeys.all, 'admin-sources', 'catalog'] as const;
const ROWS_QUERY_KEY = [...codexKeys.all, 'admin-sources', 'rows'] as const;

const QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 2,
  refetchOnWindowFocus: false,
} as const;

const LIST_GRID = '1.5fr 1fr';

const HEADER_COLUMNS = [
  { key: 'name', label: ADMIN_SOURCES_LIST_COLUMN_NAME },
  { key: 'sources', label: ADMIN_SOURCES_LIST_COLUMN_SOURCES },
];

function sectionTitle(label: string, count: number): string {
  return `${label} (${count})`;
}

function AdminSourcesFrame({ children }: { children: ReactNode }) {
  return (
    <PageContainer size="xl">
      <div className="mb-4">
        <Button variant="secondary" asChild>
          <Link href="/admin">{ADMIN_SOURCES_BACK_LINK}</Link>
        </Button>
      </div>
      <PageHeader title={ADMIN_SOURCES_PAGE_TITLE} description={ADMIN_SOURCES_PAGE_DESCRIPTION} />
      {children}
    </PageContainer>
  );
}

function AdminSourceTypeSection({
  sectionLabel,
  rows,
  catalogNames,
  selectedSource,
}: {
  sectionLabel: string;
  rows: AdminCodexSourceRow[];
  catalogNames: readonly string[];
  selectedSource: string;
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
      <h2 className="mb-3 min-w-0 text-lg font-semibold break-words text-text-primary">
        {sectionLabel}
      </h2>
      <CodexBrowseListShell
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={ADMIN_SOURCES_SEARCH_PLACEHOLDER}
        searchAriaLabel={adminSourcesSectionSearchLabel(sectionLabel)}
        headerColumns={HEADER_COLUMNS}
        gridColumns={LIST_GRID}
        sortState={sortState}
        onSort={handleSort}
        isEmpty={filtered.length === 0}
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
                label: ADMIN_SOURCES_LIST_COLUMN_SOURCES,
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
    ...QUERY_OPTIONS,
  });

  // Rows stay off until the catalog read succeeds, so an auth or catalog failure
  // does not also scan every codex table. Membership on the page comes from this
  // live read; the cached catalog is the failure signal and the editor's chip list.
  const rowsQuery = useQuery({
    queryKey: ROWS_QUERY_KEY,
    queryFn: () => fetchAdminCodexSourceRows(),
    ...QUERY_OPTIONS,
    enabled: catalogQuery.isSuccess,
  });

  const catalog = useMemo(() => rowsQuery.data?.catalog ?? [], [rowsQuery.data]);
  const rowsByTable = rowsQuery.data?.rowsByTable;
  const catalogNames = useMemo(
    () => catalogNameList(catalog, rowsByTable ?? {}),
    [catalog, rowsByTable],
  );

  const selectedSource = useMemo(() => {
    if (pickedSource && catalog.some((entry) => entry.name === pickedSource)) {
      return pickedSource;
    }
    return catalog[0]?.name ?? '';
  }, [pickedSource, catalog]);

  const loadError = catalogQuery.error ?? rowsQuery.error;
  const ready = catalogQuery.isSuccess && rowsQuery.isSuccess;

  const retry = () => {
    void catalogQuery.refetch();
    if (catalogQuery.isSuccess) void rowsQuery.refetch();
  };

  if (loadError) {
    return (
      <AdminSourcesFrame>
        <ErrorDisplay
          message={loadError instanceof Error ? loadError.message : ADMIN_SOURCES_LOAD_ERROR}
          onRetry={retry}
        />
      </AdminSourcesFrame>
    );
  }

  if (!ready) {
    return (
      <AdminSourcesFrame>
        <LoadingState message={ADMIN_SOURCES_LOADING} />
      </AdminSourcesFrame>
    );
  }

  if (catalog.length === 0) {
    return (
      <AdminSourcesFrame>
        <EmptyState
          title={ADMIN_SOURCES_EMPTY_CATALOG_TITLE}
          message={ADMIN_SOURCES_EMPTY_CATALOG_MESSAGE}
        />
      </AdminSourcesFrame>
    );
  }

  const sourceOptions = catalog.map((entry) => ({
    value: entry.name,
    label: `${entry.name} (${entry.total})`,
  }));

  const sections = ADMIN_CODEX_SOURCE_SECTIONS.map((section) => {
    const tableRows = rowsMatchingSource(rowsByTable?.[section.table], selectedSource);
    return { section, tableRows };
  }).filter((entry) => entry.tableRows.length > 0);

  return (
    <AdminSourcesFrame>
      <div className="mb-6 w-full min-w-0 sm:max-w-md">
        <Select
          label={ADMIN_SOURCES_SELECT_LABEL}
          placeholder={ADMIN_SOURCES_SELECT_PLACEHOLDER}
          options={sourceOptions}
          value={selectedSource}
          onChange={(event) => setPickedSource(event.target.value)}
        />
      </div>

      {sections.length > 0 ? (
        <div className="flex min-w-0 flex-col gap-10">
          {sections.map(({ section, tableRows }) => (
            <AdminSourceTypeSection
              key={section.table}
              sectionLabel={sectionTitle(section.label, tableRows.length)}
              rows={tableRows}
              catalogNames={catalogNames}
              selectedSource={selectedSource}
            />
          ))}
        </div>
      ) : (
        <EmptyState title={ADMIN_SOURCES_EMPTY_SOURCE_TITLE} />
      )}
    </AdminSourcesFrame>
  );
}
