'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import { codexKeys } from '@/hooks/use-codex';
import { useSort } from '@/hooks/use-sort';
import {
  ADMIN_CODEX_SOURCE_SECTIONS,
  adminSourceRowDetail,
  catalogNameList,
  otherSourcesLabel,
  resolveAdminSelectedSource,
  rowsMatchingSource,
  type AdminCodexSourceRow,
  type CodexSourceTable,
} from '@/lib/codex/admin-source-list';
import {
  codexSourceKey,
  codexSourceMembershipRemoveOffered,
  codexSourceNameError,
  codexSourcesOrCore,
  collapseCodexSourceName,
  itemMatchesSources,
  resolveCodexSourceName,
} from '@/lib/codex/sources';
import { Minus } from 'lucide-react';
import {
  batchAddAdminCodexSourceMembership,
  fetchAdminCodexSourceCatalog,
  fetchAdminCodexSourceRows,
  removeAdminCodexSourceMembership,
  renameAdminCodexSource,
  type AdminCodexSourceMembershipTarget,
} from './actions';
import {
  ADMIN_SOURCES_ADD_FAILED,
  ADMIN_SOURCES_ADD_ITEMS_BUTTON,
  ADMIN_SOURCES_ADD_MODAL_ALL_TYPES,
  ADMIN_SOURCES_ADD_MODAL_CONFIRM,
  ADMIN_SOURCES_ADD_MODAL_SEARCH,
  ADMIN_SOURCES_ADD_MODAL_TYPE_COLUMN,
  ADMIN_SOURCES_BACK_LINK,
  ADMIN_SOURCES_CANCEL,
  ADMIN_SOURCES_EMPTY_CATALOG_MESSAGE,
  ADMIN_SOURCES_EMPTY_CATALOG_TITLE,
  ADMIN_SOURCES_EMPTY_SOURCE_TITLE,
  ADMIN_SOURCES_LIST_COLUMN_NAME,
  ADMIN_SOURCES_LIST_COLUMN_SOURCES,
  ADMIN_SOURCES_LOAD_ERROR,
  ADMIN_SOURCES_LOADING,
  ADMIN_SOURCES_NAME_REQUIRED,
  ADMIN_SOURCES_NEW_SOURCE_BUTTON,
  ADMIN_SOURCES_NEW_SOURCE_DRAFT_HELPER,
  ADMIN_SOURCES_NEW_SOURCE_FIELD_LABEL,
  ADMIN_SOURCES_NEW_SOURCE_MODAL_TITLE,
  ADMIN_SOURCES_NEW_SOURCE_SUBMIT,
  ADMIN_SOURCES_PAGE_DESCRIPTION,
  ADMIN_SOURCES_RENAME_BUTTON,
  ADMIN_SOURCES_RENAME_CONFIRM_BUTTON,
  ADMIN_SOURCES_RENAME_CORE_DEFAULT_NOTE,
  ADMIN_SOURCES_RENAME_FAILED,
  ADMIN_SOURCES_RENAME_FIELD_LABEL,
  ADMIN_SOURCES_RENAME_LOADING,
  ADMIN_SOURCES_RENAME_MODAL_TITLE,
  ADMIN_SOURCES_RENAMED_TOAST,
  ADMIN_SOURCES_PAGE_TITLE,
  ADMIN_SOURCES_REMOVE_CONFIRM_BUTTON,
  ADMIN_SOURCES_REMOVE_LOADING,
  ADMIN_SOURCES_SAVED_TOAST,
  ADMIN_SOURCES_UNNAMED_ITEM,
  ADMIN_SOURCES_UPDATE_FAILED,
  ADMIN_SOURCES_SEARCH_PLACEHOLDER,
  ADMIN_SOURCES_SECTION_ADD_BUTTON,
  ADMIN_SOURCES_SELECT_LABEL,
  ADMIN_SOURCES_SELECT_PLACEHOLDER,
  adminSourcesAddItemsLabel,
  adminSourcesAddModalTitle,
  adminSourcesBatchStoppedMessage,
  adminSourcesRemoveButtonLabel,
  adminSourcesRemoveConfirmBody,
  adminSourcesRemoveConfirmTitle,
  adminSourcesRemoveLastSourceBody,
  adminSourcesMergeConfirmBody,
  adminSourcesRemoveWithError,
  adminSourcesRenameButtonLabel,
  adminSourcesRenameConfirmBody,
  adminSourcesSectionAddLabel,
  adminSourcesSectionSearchLabel,
  adminSourcesRowDetailLine,
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
const REMOVE_SLOT_WIDTH = '2.75rem';
const HEADER_COLUMNS = [
  { key: 'name', label: ADMIN_SOURCES_LIST_COLUMN_NAME },
  { key: 'sources', label: ADMIN_SOURCES_LIST_COLUMN_SOURCES },
];
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
          aria-label={adminSourcesSectionAddLabel(sectionLabel)}
        >
          {ADMIN_SOURCES_SECTION_ADD_BUTTON}
        </Button>
      </div>
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
        rowChrome={{ rightSlot: true }}
        rightSlotWidth={REMOVE_SLOT_WIDTH}
      >
        {filtered.map((row) => {
          const itemName = row.name ?? ADMIN_SOURCES_UNNAMED_ITEM;
          const rowDetail = adminSourceRowDetail(sectionTable, row);
          const detailLine = rowDetail
            ? adminSourcesRowDetailLine(rowDetail.field, rowDetail.value)
            : null;
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
              nameContent={
                detailLine ? (
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="block min-w-0 truncate">{itemName}</span>
                    <span className="block min-w-0 truncate text-sm font-normal text-text-secondary">
                      {detailLine}
                    </span>
                  </span>
                ) : undefined
              }
              gridColumns={LIST_GRID}
              rowChrome={{ rightSlot: true }}
              columns={[
                {
                  key: 'sources',
                  label: ADMIN_SOURCES_LIST_COLUMN_SOURCES,
                  value: otherSourcesLabel(row.sources, selectedSource, catalogNames),
                },
              ]}
              rightSlotWidth={REMOVE_SLOT_WIDTH}
              rightSlot={
                canRemove ? (
                  <IconButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="max-sm:h-11 max-sm:w-11"
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

function closeNewSourceDraft(
  setOpen: (open: boolean) => void,
  setError: (error: string | null) => void,
) {
  setOpen(false);
  setError(null);
}

function RenameSourceModal({
  isOpen,
  name,
  error,
  onNameChange,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  name: string;
  error: string | null;
  onNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ADMIN_SOURCES_RENAME_MODAL_TITLE}
      fullScreenOnMobile
      footer={
        <div className="flex w-full flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            {ADMIN_SOURCES_CANCEL}
          </Button>
          <Button type="button" onClick={onSubmit}>
            {ADMIN_SOURCES_RENAME_CONFIRM_BUTTON}
          </Button>
        </div>
      }
    >
      <Input
        label={ADMIN_SOURCES_RENAME_FIELD_LABEL}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        error={error ?? undefined}
      />
    </Modal>
  );
}

function NewSourceDraftModal({
  isOpen,
  name,
  error,
  onNameChange,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  name: string;
  error: string | null;
  onNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ADMIN_SOURCES_NEW_SOURCE_MODAL_TITLE}
      fullScreenOnMobile
      footer={
        <div className="flex w-full flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            {ADMIN_SOURCES_CANCEL}
          </Button>
          <Button type="button" onClick={onSubmit}>
            {ADMIN_SOURCES_NEW_SOURCE_SUBMIT}
          </Button>
        </div>
      }
    >
      <Input
        label={ADMIN_SOURCES_NEW_SOURCE_FIELD_LABEL}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        error={error ?? undefined}
        helperText={ADMIN_SOURCES_NEW_SOURCE_DRAFT_HELPER}
      />
    </Modal>
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
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [renameFieldError, setRenameFieldError] = useState<string | null>(null);
  const [renameConfirm, setRenameConfirm] = useState(false);
  const [renameConfirmBody, setRenameConfirmBody] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [addScope, setAddScope] = useState<AddModalScope | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const savingRef = useRef(false);
  const sourceSelectRef = useRef<HTMLSelectElement>(null);
  const returnFocusToSource = useRef(false);

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

  const selectedSource = useMemo(
    () =>
      resolveAdminSelectedSource({
        pickedSource,
        catalog,
        sessionDraftSources,
        catalogNames,
      }),
    [pickedSource, catalog, catalogNames, sessionDraftSources],
  );

  const invalidateData = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: codexKeys.all });
  }, [queryClient]);

  useEffect(() => {
    if (removeTarget !== null || renameOpen || renameConfirm || !returnFocusToSource.current) {
      return;
    }
    returnFocusToSource.current = false;
    const timer = window.setTimeout(() => {
      sourceSelectRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [removeTarget, renameOpen, renameConfirm]);

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
    if (
      selectedSource &&
      !options.some((option) => codexSourceKey(option.value) === codexSourceKey(selectedSource))
    ) {
      options.push({ value: selectedSource, label: `${selectedSource} (0)` });
    }
    return options;
  }, [catalog, sessionDraftSources, selectedSource]);

  const addModalItems = useMemo((): SelectableItem[] => {
    if (!addScope || !selectedSource || !rowsByTable) return [];
    const items: SelectableItem[] = [];
    for (const section of ADMIN_CODEX_SOURCE_SECTIONS) {
      if (addScope !== 'all' && addScope.table !== section.table) continue;
      for (const row of rowsByTable[section.table] ?? []) {
        if (itemMatchesSources(row.sources, [selectedSource])) continue;
        items.push({
          id: rowPickerId(section.table, row.id),
          name: row.name ?? ADMIN_SOURCES_UNNAMED_ITEM,
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
      { value: 'all', label: ADMIN_SOURCES_ADD_MODAL_ALL_TYPES },
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

  const handleAddModalClose = () => {
    if (savingRef.current) return;
    closeAddModal();
  };

  const handleCreateSource = () => {
    const collapsed = resolveCodexSourceName(newSourceName, catalogNames);
    const error = collapsed ? codexSourceNameError(collapsed) : ADMIN_SOURCES_NAME_REQUIRED;
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
    if (savingRef.current) return;
    if (!selectedSource || selectedItems.length === 0) return;
    savingRef.current = true;
    setIsSaving(true);
    setAddError(null);
    try {
      const targets: AdminCodexSourceMembershipTarget[] = [];
      for (const item of selectedItems) {
        const parsed = parseRowPickerId(String(item.id));
        if (!parsed) continue;
        const row = rowsByTable?.[parsed.table]?.find((entry) => String(entry.id) === parsed.id);
        if (!row) continue;
        targets.push(membershipTarget(parsed.table, row));
      }
      if (targets.length === 0) {
        const message = ADMIN_SOURCES_ADD_FAILED;
        setAddError(message);
        showToast(message, 'error');
        return;
      }
      const result = await batchAddAdminCodexSourceMembership(targets, selectedSource);
      if (!result.success) {
        const message =
          result.updatedCount > 0
            ? adminSourcesBatchStoppedMessage(
                result.updatedCount,
                result.error ?? ADMIN_SOURCES_UPDATE_FAILED,
              )
            : (result.error ?? ADMIN_SOURCES_UPDATE_FAILED);
        if (result.updatedCount > 0) await invalidateData();
        setAddError(message);
        showToast(message, 'error');
        return;
      }
      await invalidateData();
      showToast(ADMIN_SOURCES_SAVED_TOAST, 'success');
      closeAddModal();
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (savingRef.current) return;
    if (!removeTarget || !selectedSource) return;
    savingRef.current = true;
    setIsSaving(true);
    setRemoveError(null);
    try {
      const result = await removeAdminCodexSourceMembership(
        membershipTarget(removeTarget.table, removeTarget.row),
        selectedSource,
      );
      if (!result.success) {
        const message = result.error ?? ADMIN_SOURCES_UPDATE_FAILED;
        setRemoveError(message);
        showToast(message, 'error');
        return;
      }
      await invalidateData();
      showToast(ADMIN_SOURCES_SAVED_TOAST, 'success');
      returnFocusToSource.current = true;
      setRemoveTarget(null);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const openRename = () => {
    setRenameError(null);
    setRenameFieldError(null);
    setRenameName('');
    setRenameConfirm(false);
    setRenameOpen(true);
  };

  const closeRenameName = () => {
    if (savingRef.current) return;
    setRenameOpen(false);
    setRenameFieldError(null);
  };

  const handleRenameNameSubmit = () => {
    if (!selectedSource) return;
    const collapsed = collapseCodexSourceName(renameName);
    const error = collapsed ? codexSourceNameError(collapsed) : ADMIN_SOURCES_NAME_REQUIRED;
    if (error) {
      setRenameFieldError(error);
      return;
    }
    setRenameFieldError(null);
    const fromKey = codexSourceKey(selectedSource);
    const toKey = codexSourceKey(collapsed);
    const oldCount = catalog.find((entry) => codexSourceKey(entry.name) === fromKey)?.total ?? 0;
    const otherCatalog = catalog.find(
      (entry) => codexSourceKey(entry.name) === toKey && toKey !== fromKey,
    );
    const otherDraft = sessionDraftSources.find(
      (name) => codexSourceKey(name) === toKey && toKey !== fromKey,
    );
    let body: string;
    if (otherCatalog || otherDraft) {
      const newName = otherCatalog?.name ?? otherDraft ?? collapsed;
      const newCount = otherCatalog?.total ?? 0;
      body = adminSourcesMergeConfirmBody(selectedSource, oldCount, newName, newCount);
    } else {
      body = adminSourcesRenameConfirmBody(oldCount);
    }
    if (fromKey === codexSourceKey('Core')) {
      body = `${body} ${ADMIN_SOURCES_RENAME_CORE_DEFAULT_NOTE}`;
    }
    setRenameConfirmBody(body);
    setRenameOpen(false);
    setRenameConfirm(true);
  };

  const handleRenameConfirm = async () => {
    if (savingRef.current) return;
    if (!selectedSource) return;
    const collapsed = collapseCodexSourceName(renameName);
    savingRef.current = true;
    setIsSaving(true);
    setRenameError(null);
    try {
      const result = await renameAdminCodexSource(selectedSource, collapsed);
      if (!result.success) {
        const message = result.error ?? ADMIN_SOURCES_RENAME_FAILED;
        setRenameOpen(false);
        setRenameConfirm(false);
        setRenameError(message);
        showToast(message, 'error');
        return;
      }
      const toKey = codexSourceKey(collapsed);
      const existing = catalog.find((entry) => codexSourceKey(entry.name) === toKey);
      setSessionDraftSources((prev) => {
        const without = prev.filter((name) => {
          const key = codexSourceKey(name);
          return key !== codexSourceKey(selectedSource) && key !== toKey;
        });
        if (existing) return without;
        return [...without, collapsed];
      });
      setPickedSource(existing?.name ?? collapsed);
      await invalidateData();
      showToast(ADMIN_SOURCES_RENAMED_TOAST, 'success');
      setRenameOpen(false);
      setRenameConfirm(false);
      setRenameName('');
      returnFocusToSource.current = true;
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const removeConfirmBody = useMemo(() => {
    if (!removeTarget || !selectedSource) return '';
    const itemName = removeTarget.row.name ?? ADMIN_SOURCES_UNNAMED_ITEM;
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

  const showEmptyCatalog = catalog.length === 0 && sessionDraftSources.length === 0;
  const closeDraft = () => closeNewSourceDraft(setNewSourceOpen, setNewSourceError);

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
        <NewSourceDraftModal
          isOpen={newSourceOpen}
          name={newSourceName}
          error={newSourceError}
          onNameChange={setNewSourceName}
          onClose={closeDraft}
          onSubmit={handleCreateSource}
        />
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
            ref={sourceSelectRef}
            label={ADMIN_SOURCES_SELECT_LABEL}
            placeholder={ADMIN_SOURCES_SELECT_PLACEHOLDER}
            options={sourceOptions}
            value={selectedSource}
            onChange={(event) => {
              setPickedSource(event.target.value);
              setRenameError(null);
            }}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={openRename}
          disabled={isSaving || !selectedSource}
          aria-label={
            selectedSource
              ? adminSourcesRenameButtonLabel(selectedSource)
              : ADMIN_SOURCES_RENAME_BUTTON
          }
        >
          {ADMIN_SOURCES_RENAME_BUTTON}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => setNewSourceOpen(true)}
        >
          {ADMIN_SOURCES_NEW_SOURCE_BUTTON}
        </Button>
        {selectedSource ? (
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => openAddModal('all')}
            disabled={isSaving}
            aria-label={adminSourcesAddItemsLabel(selectedSource)}
          >
            {ADMIN_SOURCES_ADD_ITEMS_BUTTON}
          </Button>
        ) : null}
        {renameError ? (
          <p role="alert" className="basis-full text-sm text-danger-fg">
            {renameError}
          </p>
        ) : null}
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
        <EmptyState title={ADMIN_SOURCES_EMPTY_SOURCE_TITLE} />
      )}

      <UnifiedSelectionModal
        isOpen={addScope !== null}
        onClose={handleAddModalClose}
        title={adminSourcesAddModalTitle(selectedSource)}
        description={addError ?? undefined}
        items={filteredAddModalItems}
        onConfirm={(items) => void handleAddConfirm(items)}
        columns={ADD_MODAL_COLUMNS}
        gridColumns={ADD_MODAL_GRID}
        searchPlaceholder={ADMIN_SOURCES_ADD_MODAL_SEARCH}
        searchFields={['name', 'keywords']}
        confirmLabel={ADMIN_SOURCES_ADD_MODAL_CONFIRM}
        confirmDisabled={() => savingRef.current}
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
      />

      <ConfirmActionModal
        isOpen={removeTarget !== null}
        onClose={() => {
          if (savingRef.current) return;
          setRemoveTarget(null);
          setRemoveError(null);
        }}
        onConfirm={() => void handleRemoveConfirm()}
        title={adminSourcesRemoveConfirmTitle(selectedSource)}
        description={
          removeError
            ? adminSourcesRemoveWithError(removeConfirmBody, removeError)
            : removeConfirmBody
        }
        confirmLabel={ADMIN_SOURCES_REMOVE_CONFIRM_BUTTON}
        cancelLabel={ADMIN_SOURCES_CANCEL}
        confirmVariant="danger"
        isLoading={isSaving}
        loadingLabel={ADMIN_SOURCES_REMOVE_LOADING}
      />

      <NewSourceDraftModal
        isOpen={newSourceOpen}
        name={newSourceName}
        error={newSourceError}
        onNameChange={setNewSourceName}
        onClose={closeDraft}
        onSubmit={handleCreateSource}
      />

      <RenameSourceModal
        isOpen={renameOpen}
        name={renameName}
        error={renameFieldError}
        onNameChange={setRenameName}
        onClose={closeRenameName}
        onSubmit={handleRenameNameSubmit}
      />

      <ConfirmActionModal
        isOpen={renameConfirm}
        onClose={() => {
          if (savingRef.current) return;
          setRenameConfirm(false);
          setRenameOpen(true);
        }}
        onConfirm={() => void handleRenameConfirm()}
        title={ADMIN_SOURCES_RENAME_MODAL_TITLE}
        description={renameConfirmBody}
        confirmLabel={ADMIN_SOURCES_RENAME_CONFIRM_BUTTON}
        cancelLabel={ADMIN_SOURCES_CANCEL}
        confirmVariant="primary"
        isLoading={isSaving}
        loadingLabel={ADMIN_SOURCES_RENAME_LOADING}
      />
    </AdminSourcesFrame>
  );
}
