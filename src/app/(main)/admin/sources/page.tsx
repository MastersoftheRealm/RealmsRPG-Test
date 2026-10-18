'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CodexBrowseListShell,
  ConfirmActionModal,
  ErrorDisplay,
  GridListRow,
  UnifiedSelectionModal,
  type SelectableItem,
} from '@/components/patterns';
import {
  Alert,
  Button,
  EmptyState,
  IconButton,
  Input,
  LoadingState,
  Modal,
  PageContainer,
  PageHeader,
  Select,
  useToast,
} from '@/components/ui';
import { ADMIN_CODEX_ROW_ACTIONS_WIDTH } from '@/app/(main)/admin/codex/admin-codex-row-actions';
import { codexKeys } from '@/hooks/use-codex';
import { useSort } from '@/hooks/use-sort';
import {
  ADMIN_CODEX_SOURCE_SECTIONS,
  catalogNameList,
  otherSourcesLabel,
  rowsMatchingSource,
  type AdminCodexSourceRow,
  type CodexSourceTable,
} from '@/lib/codex/admin-source-list';
import {
  codexSourceKey,
  codexSourceMembershipRemoveOffered,
  codexSourceNameError,
  codexSourcesOrCore,
  itemMatchesSources,
  resolveCodexSourceName,
} from '@/lib/codex/sources';
import { Minus } from 'lucide-react';
import {
  batchAddAdminCodexSourceMembership,
  fetchAdminCodexSourceCatalog,
  fetchAdminCodexSourceRows,
  removeAdminCodexSourceMembership,
  type AdminCodexSourceMembershipTarget,
} from './actions';
import {
  ADMIN_SOURCES_ADD_MODAL_CONFIRM,
  ADMIN_SOURCES_ADD_MODAL_SEARCH,
  ADMIN_SOURCES_ADD_MODAL_TYPE_COLUMN,
  ADMIN_SOURCES_BACK_LINK,
  ADMIN_SOURCES_CANCEL,
  ADMIN_SOURCES_EMPTY_CATALOG_MESSAGE,
  ADMIN_SOURCES_EMPTY_CATALOG_TITLE,
  ADMIN_SOURCES_EMPTY_SOURCE_ADD_BUTTON,
  ADMIN_SOURCES_EMPTY_SOURCE_TITLE,
  ADMIN_SOURCES_LIST_COLUMN_NAME,
  ADMIN_SOURCES_LIST_COLUMN_SOURCES,
  ADMIN_SOURCES_LOAD_ERROR,
  ADMIN_SOURCES_LOADING,
  ADMIN_SOURCES_NEW_SOURCE_BUTTON,
  ADMIN_SOURCES_NEW_SOURCE_DRAFT_HELPER,
  ADMIN_SOURCES_NEW_SOURCE_FIELD_LABEL,
  ADMIN_SOURCES_NEW_SOURCE_MODAL_TITLE,
  ADMIN_SOURCES_NEW_SOURCE_SUBMIT,
  ADMIN_SOURCES_PAGE_DESCRIPTION,
  ADMIN_SOURCES_PAGE_TITLE,
  ADMIN_SOURCES_REMOVE_CONFIRM_BUTTON,
  ADMIN_SOURCES_SAVED_TOAST,
  ADMIN_SOURCES_SEARCH_PLACEHOLDER,
  ADMIN_SOURCES_SECTION_ADD_BUTTON,
  ADMIN_SOURCES_SELECT_LABEL,
  ADMIN_SOURCES_SELECT_PLACEHOLDER,
  adminSourcesAddModalTitle,
  adminSourcesRemoveButtonLabel,
  adminSourcesRemoveConfirmBody,
  adminSourcesRemoveConfirmTitle,
  adminSourcesRemoveLastSourceBody,
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

const LIST_GRID = '1.5fr 1fr 8.5rem';
const ADD_MODAL_GRID = '1.2fr 1fr';
const ADD_MODAL_COLUMNS = [
  { key: 'name', label: ADMIN_SOURCES_LIST_COLUMN_NAME },
  { key: 'type', label: ADMIN_SOURCES_ADD_MODAL_TYPE_COLUMN },
];

type AddModalScope = { table: CodexSourceTable; label: string } | 'all';

type RemoveTarget = {
  table: CodexSourceTable;
  row: AdminCodexSourceRow;
};

function membershipTarget(
  table: CodexSourceTable,
  row: AdminCodexSourceRow,
): AdminCodexSourceMembershipTarget {
  return {
    table,
    id: row.id,
    expectedUpdatedAt: row.updated_at ?? undefined,
    currentSources: row.sources,
  };
}

function rowPickerId(table: CodexSourceTable, id: string | number): string {
  return `${table}:${id}`;
}

function parseRowPickerId(pickerId: string): { table: CodexSourceTable; id: string } | null {
  const idx = pickerId.indexOf(':');
  if (idx <= 0) return null;
  const table = pickerId.slice(0, idx) as CodexSourceTable;
  const id = pickerId.slice(idx + 1);
  if (!ADMIN_CODEX_SOURCE_SECTIONS.some((section) => section.table === table)) return null;
  return { table, id };
}

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
  sectionTable,
  rows,
  catalogNames,
  selectedSource,
  onAdd,
  onRemove,
  isSaving,
}: {
  sectionLabel: string;
  sectionTable: CodexSourceTable;
  rows: AdminCodexSourceRow[];
  catalogNames: readonly string[];
  selectedSource: string;
  onAdd: () => void;
  onRemove: (target: RemoveTarget) => void;
  isSaving: boolean;
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

  const headerColumns = [
    { key: 'name', label: ADMIN_SOURCES_LIST_COLUMN_NAME },
    { key: 'sources', label: ADMIN_SOURCES_LIST_COLUMN_SOURCES },
    { key: '_actions', label: '', sortable: false },
  ];

  return (
    <section className="min-w-0">
      <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h2 className="min-w-0 text-lg font-semibold break-words text-text-primary">
          {sectionTitle(sectionLabel, rows.length)}
        </h2>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAdd}
          disabled={isSaving}
          className="shrink-0"
        >
          {ADMIN_SOURCES_SECTION_ADD_BUTTON}
        </Button>
      </div>
      <CodexBrowseListShell
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={ADMIN_SOURCES_SEARCH_PLACEHOLDER}
        searchAriaLabel={adminSourcesSectionSearchLabel(sectionLabel)}
        headerColumns={headerColumns}
        gridColumns={LIST_GRID}
        sortState={sortState}
        onSort={handleSort}
        isEmpty={filtered.length === 0}
        rowChrome={{ rightSlot: true }}
        rightSlotWidth={ADMIN_CODEX_ROW_ACTIONS_WIDTH}
      >
        {filtered.map((row) => {
          const itemName = row.name ?? 'Unnamed item';
          const canRemove = codexSourceMembershipRemoveOffered(
            row.sources,
            selectedSource,
            catalogNames,
          );
          return (
            <GridListRow
              key={String(row.id)}
              id={String(row.id)}
              name={itemName}
              gridColumns={LIST_GRID}
              columns={[
                {
                  key: 'sources',
                  label: ADMIN_SOURCES_LIST_COLUMN_SOURCES,
                  value: otherSourcesLabel(row.sources, selectedSource, catalogNames),
                },
              ]}
              rightSlotWidth={ADMIN_CODEX_ROW_ACTIONS_WIDTH}
              rightSlot={
                canRemove ? (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    label={adminSourcesRemoveButtonLabel(itemName, selectedSource)}
                    disabled={isSaving}
                    onClick={() => onRemove({ table: sectionTable, row })}
                  >
                    <Minus className="h-4 w-4" aria-hidden />
                  </IconButton>
                ) : null
              }
            />
          );
        })}
      </CodexBrowseListShell>
    </section>
  );
}

export default function AdminSourcesPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [pickedSource, setPickedSource] = useState('');
  const [sessionDraftSources, setSessionDraftSources] = useState<string[]>([]);
  const [newSourceOpen, setNewSourceOpen] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceError, setNewSourceError] = useState<string | null>(null);
  const [addScope, setAddScope] = useState<AddModalScope | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const catalogQuery = useQuery({
    queryKey: CATALOG_QUERY_KEY,
    queryFn: () => fetchAdminCodexSourceCatalog(),
    ...QUERY_OPTIONS,
  });

  const rowsQuery = useQuery({
    queryKey: ROWS_QUERY_KEY,
    queryFn: () => fetchAdminCodexSourceRows(),
    ...QUERY_OPTIONS,
    enabled: catalogQuery.isSuccess,
  });

  const catalog = useMemo(() => rowsQuery.data?.catalog ?? [], [rowsQuery.data]);
  const rowsByTable = rowsQuery.data?.rowsByTable;
  const catalogNames = useMemo(
    () => [...catalogNameList(catalog, rowsByTable ?? {}), ...sessionDraftSources],
    [catalog, rowsByTable, sessionDraftSources],
  );

  const selectedSource = useMemo(() => {
    if (pickedSource) {
      const resolved = resolveCodexSourceName(pickedSource, catalogNames);
      const inCatalog = catalog.some((entry) => entry.name === resolved);
      const inDrafts = sessionDraftSources.some(
        (name) => codexSourceKey(name) === codexSourceKey(resolved),
      );
      if (inCatalog || inDrafts) return resolved;
    }
    if (catalog[0]?.name) return catalog[0].name;
    return sessionDraftSources[0] ?? '';
  }, [pickedSource, catalog, catalogNames, sessionDraftSources]);

  const invalidateData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: CATALOG_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ROWS_QUERY_KEY }),
    ]);
  }, [queryClient]);

  const loadError = catalogQuery.error ?? rowsQuery.error;
  const ready = catalogQuery.isSuccess && rowsQuery.isSuccess;

  const retry = () => {
    void catalogQuery.refetch();
    if (catalogQuery.isSuccess) void rowsQuery.refetch();
  };

  const sourceOptions = useMemo(() => {
    const options = catalog.map((entry) => ({
      value: entry.name,
      label: `${entry.name} (${entry.total})`,
    }));
    for (const draft of sessionDraftSources) {
      if (catalog.some((entry) => codexSourceKey(entry.name) === codexSourceKey(draft))) continue;
      options.push({ value: draft, label: `${draft} (0)` });
    }
    return options;
  }, [catalog, sessionDraftSources]);

  const addModalItems = useMemo((): SelectableItem[] => {
    if (!addScope || !selectedSource || !rowsByTable) return [];
    const items: SelectableItem[] = [];
    for (const section of ADMIN_CODEX_SOURCE_SECTIONS) {
      if (addScope !== 'all' && addScope.table !== section.table) continue;
      for (const row of rowsByTable[section.table] ?? []) {
        if (itemMatchesSources(row.sources, [selectedSource])) continue;
        items.push({
          id: rowPickerId(section.table, row.id),
          name: row.name ?? 'Unnamed item',
          columns: [
            { key: 'type', label: ADMIN_SOURCES_ADD_MODAL_TYPE_COLUMN, value: section.label },
          ],
          keywords: section.label,
        });
      }
    }
    return items;
  }, [addScope, rowsByTable, selectedSource]);

  const filteredAddModalItems = useMemo(() => {
    if (typeFilter === 'all') return addModalItems;
    return addModalItems.filter((item) => {
      const typeCol = item.columns?.find((col) => col.key === 'type');
      return typeCol?.value === typeFilter;
    });
  }, [addModalItems, typeFilter]);

  const typeFilterOptions = useMemo(() => {
    const labels = new Set<string>();
    for (const item of addModalItems) {
      const typeCol = item.columns?.find((col) => col.key === 'type');
      if (typeCol?.value) labels.add(String(typeCol.value));
    }
    return [
      { value: 'all', label: 'All types' },
      ...[...labels].sort((a, b) => a.localeCompare(b)).map((label) => ({ value: label, label })),
    ];
  }, [addModalItems]);

  const openAddModal = (scope: AddModalScope) => {
    setAddError(null);
    setTypeFilter(scope === 'all' ? 'all' : scope.label);
    setAddScope(scope);
  };

  const closeAddModal = () => {
    setAddScope(null);
    setAddError(null);
    setTypeFilter('all');
  };

  const handleCreateSource = () => {
    const collapsed = resolveCodexSourceName(newSourceName, catalogNames);
    const error = collapsed ? codexSourceNameError(collapsed) : 'Source name is required.';
    if (error) {
      setNewSourceError(error);
      return;
    }
    setNewSourceError(null);
    const resolved = resolveCodexSourceName(collapsed, catalogNames);
    if (!catalog.some((entry) => codexSourceKey(entry.name) === codexSourceKey(resolved))) {
      setSessionDraftSources((prev) => {
        if (prev.some((name) => codexSourceKey(name) === codexSourceKey(resolved))) return prev;
        return [...prev, resolved];
      });
    }
    setPickedSource(resolved);
    setNewSourceOpen(false);
    setNewSourceName('');
  };

  const handleAddConfirm = async (selectedItems: SelectableItem[]) => {
    if (!selectedSource || selectedItems.length === 0) return;
    setIsSaving(true);
    setAddError(null);
    const targets: AdminCodexSourceMembershipTarget[] = [];
    for (const item of selectedItems) {
      const pickerId = item.id;
      const parsed = parseRowPickerId(pickerId);
      if (!parsed) continue;
      const row = rowsByTable?.[parsed.table]?.find((entry) => String(entry.id) === parsed.id);
      if (!row) continue;
      targets.push(membershipTarget(parsed.table, row));
    }
    const result = await batchAddAdminCodexSourceMembership(targets, selectedSource);
    setIsSaving(false);
    if (!result.success) {
      setAddError(
        result.updatedCount > 0
          ? `${result.error ?? 'Update failed.'} (${result.updatedCount} item${
              result.updatedCount === 1 ? '' : 's'
            } were added before the error.)`
          : (result.error ?? 'Update failed.'),
      );
      if (result.updatedCount > 0) {
        await invalidateData();
      }
      return;
    }
    await invalidateData();
    showToast(ADMIN_SOURCES_SAVED_TOAST, 'success');
    closeAddModal();
  };

  const handleRemoveConfirm = async () => {
    if (!removeTarget || !selectedSource) return;
    setIsSaving(true);
    setRemoveError(null);
    const result = await removeAdminCodexSourceMembership(
      membershipTarget(removeTarget.table, removeTarget.row),
      selectedSource,
    );
    setIsSaving(false);
    if (!result.success) {
      setRemoveError(result.error ?? 'Update failed.');
      return;
    }
    await invalidateData();
    showToast(ADMIN_SOURCES_SAVED_TOAST, 'success');
    setRemoveTarget(null);
  };

  const removeConfirmBody = useMemo(() => {
    if (!removeTarget || !selectedSource) return '';
    const itemName = removeTarget.row.name ?? 'Unnamed item';
    const others = codexSourcesOrCore(removeTarget.row.sources, catalogNames).filter(
      (name) => codexSourceKey(name) !== codexSourceKey(selectedSource),
    );
    if (others.length === 0) {
      return adminSourcesRemoveLastSourceBody(itemName, selectedSource);
    }
    return adminSourcesRemoveConfirmBody(itemName, selectedSource);
  }, [removeTarget, selectedSource, catalogNames]);

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

  const hasSelectableSource = Boolean(selectedSource);
  const showEmptyCatalog = catalog.length === 0 && sessionDraftSources.length === 0;

  if (showEmptyCatalog) {
    return (
      <AdminSourcesFrame>
        <div className="mb-6 flex min-w-0 flex-wrap items-end gap-3">
          <Button type="button" onClick={() => setNewSourceOpen(true)}>
            {ADMIN_SOURCES_NEW_SOURCE_BUTTON}
          </Button>
        </div>
        <EmptyState
          title={ADMIN_SOURCES_EMPTY_CATALOG_TITLE}
          message={ADMIN_SOURCES_EMPTY_CATALOG_MESSAGE}
        />
        <Modal
          isOpen={newSourceOpen}
          onClose={() => {
            setNewSourceOpen(false);
            setNewSourceError(null);
          }}
          title={ADMIN_SOURCES_NEW_SOURCE_MODAL_TITLE}
          fullScreenOnMobile
          footer={
            <div className="flex w-full flex-wrap justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setNewSourceOpen(false);
                  setNewSourceError(null);
                }}
              >
                {ADMIN_SOURCES_CANCEL}
              </Button>
              <Button onClick={handleCreateSource}>{ADMIN_SOURCES_NEW_SOURCE_SUBMIT}</Button>
            </div>
          }
        >
          <div className="flex min-w-0 flex-col gap-3">
            <Input
              label={ADMIN_SOURCES_NEW_SOURCE_FIELD_LABEL}
              value={newSourceName}
              onChange={(event) => setNewSourceName(event.target.value)}
            />
            <p className="text-sm text-text-secondary">{ADMIN_SOURCES_NEW_SOURCE_DRAFT_HELPER}</p>
            {newSourceError ? <Alert variant="danger">{newSourceError}</Alert> : null}
          </div>
        </Modal>
      </AdminSourcesFrame>
    );
  }

  const sections = ADMIN_CODEX_SOURCE_SECTIONS.map((section) => {
    const tableRows = rowsMatchingSource(rowsByTable?.[section.table], selectedSource);
    return { section, tableRows };
  }).filter((entry) => entry.tableRows.length > 0);

  return (
    <AdminSourcesFrame>
      <div className="mb-6 flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full min-w-0 sm:max-w-md sm:flex-1">
          <Select
            label={ADMIN_SOURCES_SELECT_LABEL}
            placeholder={ADMIN_SOURCES_SELECT_PLACEHOLDER}
            options={sourceOptions}
            value={selectedSource}
            onChange={(event) => setPickedSource(event.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => setNewSourceOpen(true)}
        >
          {ADMIN_SOURCES_NEW_SOURCE_BUTTON}
        </Button>
      </div>

      {sections.length > 0 ? (
        <div className="flex min-w-0 flex-col gap-10">
          {sections.map(({ section, tableRows }) => (
            <AdminSourceTypeSection
              key={section.table}
              sectionLabel={section.label}
              sectionTable={section.table}
              rows={tableRows}
              catalogNames={catalogNames}
              selectedSource={selectedSource}
              onAdd={() => openAddModal({ table: section.table, label: section.label })}
              onRemove={(target) => {
                setRemoveError(null);
                setRemoveTarget(target);
              }}
              isSaving={isSaving}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-w-0 flex-col items-start gap-4">
          <EmptyState title={ADMIN_SOURCES_EMPTY_SOURCE_TITLE} />
          {hasSelectableSource ? (
            <Button type="button" onClick={() => openAddModal('all')} disabled={isSaving}>
              {ADMIN_SOURCES_EMPTY_SOURCE_ADD_BUTTON}
            </Button>
          ) : null}
        </div>
      )}

      <UnifiedSelectionModal
        isOpen={addScope !== null}
        onClose={closeAddModal}
        title={adminSourcesAddModalTitle(selectedSource)}
        items={filteredAddModalItems}
        onConfirm={handleAddConfirm}
        columns={ADD_MODAL_COLUMNS}
        gridColumns={ADD_MODAL_GRID}
        searchPlaceholder={ADMIN_SOURCES_ADD_MODAL_SEARCH}
        searchFields={['name', 'keywords']}
        confirmLabel={ADMIN_SOURCES_ADD_MODAL_CONFIRM}
        size="lg"
        showFilters={typeFilterOptions.length > 2}
        filterContent={
          <Select
            label={ADMIN_SOURCES_ADD_MODAL_TYPE_COLUMN}
            options={typeFilterOptions}
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          />
        }
        optionsDefaultExpanded={addScope !== 'all'}
        error={addError ? new Error(addError) : null}
      />

      <ConfirmActionModal
        isOpen={removeTarget !== null}
        onClose={() => {
          setRemoveTarget(null);
          setRemoveError(null);
        }}
        onConfirm={() => void handleRemoveConfirm()}
        title={adminSourcesRemoveConfirmTitle(selectedSource)}
        description={removeError ?? removeConfirmBody}
        confirmLabel={ADMIN_SOURCES_REMOVE_CONFIRM_BUTTON}
        cancelLabel={ADMIN_SOURCES_CANCEL}
        confirmVariant="danger"
        isLoading={isSaving}
        loadingLabel="Removing…"
      />

      <Modal
        isOpen={newSourceOpen}
        onClose={() => {
          setNewSourceOpen(false);
          setNewSourceError(null);
        }}
        title={ADMIN_SOURCES_NEW_SOURCE_MODAL_TITLE}
        fullScreenOnMobile
        footer={
          <div className="flex w-full flex-wrap justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setNewSourceOpen(false);
                setNewSourceError(null);
              }}
            >
              {ADMIN_SOURCES_CANCEL}
            </Button>
            <Button onClick={handleCreateSource}>{ADMIN_SOURCES_NEW_SOURCE_SUBMIT}</Button>
          </div>
        }
      >
        <div className="flex min-w-0 flex-col gap-3">
          <Input
            label={ADMIN_SOURCES_NEW_SOURCE_FIELD_LABEL}
            value={newSourceName}
            onChange={(event) => setNewSourceName(event.target.value)}
          />
          <p className="text-sm text-text-secondary">{ADMIN_SOURCES_NEW_SOURCE_DRAFT_HELPER}</p>
          {newSourceError ? <Alert variant="danger">{newSourceError}</Alert> : null}
        </div>
      </Modal>
    </AdminSourcesFrame>
  );
}
