'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Modal,
  PageContainer,
  PageHeader,
  LoadingState,
  EmptyState,
  TabNavigation,
  TabContentPanel,
  useTabGroup,
  DescriptorChip,
} from '@/components/ui';
import { ErrorDisplay } from '@/components/patterns';
import { apiFetch } from '@/lib/api-client';
import {
  formatCodexChangeValue,
  formatCodexChangelogHeadline,
  parseChangedFieldsForOperation,
  readCodexChangelogEntityName,
  type CodexFieldChange,
} from '@/lib/codex-changelog-display';

type TabId =
  | 'codex_feats'
  | 'codex_skills'
  | 'codex_species'
  | 'codex_traits'
  | 'codex_parts'
  | 'codex_properties'
  | 'codex_equipment'
  | 'codex_archetypes'
  | 'codex_creature_feats'
  | 'core_rules';

type Operation = 'create' | 'update' | 'delete';

type ChangeLogEntry = {
  id: string;
  entity_type: TabId;
  entity_id: string;
  operation: Operation;
  changed_at: string;
  changed_by_user_id: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  changed_fields: Array<Record<string, unknown>> | null;
  actor: {
    id: string;
    username: string | null;
    usernameDisplay: string | null;
    displayName: string | null;
    email: string | null;
  } | null;
};

const TABS: { id: TabId; label: string; labelMobile?: string | undefined }[] = [
  { id: 'codex_feats', label: 'Feats' },
  { id: 'codex_skills', label: 'Skills' },
  { id: 'codex_species', label: 'Species' },
  { id: 'codex_traits', label: 'Traits' },
  { id: 'codex_parts', label: 'Power & Technique Parts', labelMobile: 'Parts' },
  { id: 'codex_properties', label: 'Armament Properties', labelMobile: 'Properties' },
  { id: 'codex_equipment', label: 'Equipment' },
  { id: 'codex_archetypes', label: 'Archetypes' },
  { id: 'codex_creature_feats', label: 'Creature Feats' },
  { id: 'core_rules', label: 'Core Rules' },
];

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

function operationChipVariant(operation: Operation): 'success' | 'danger' | 'primary' {
  if (operation === 'create') return 'success';
  if (operation === 'delete') return 'danger';
  return 'primary';
}

function readActorLabel(entry: ChangeLogEntry): string {
  return (
    entry.actor?.displayName ??
    entry.actor?.usernameDisplay ??
    entry.actor?.username ??
    entry.changed_by_user_id
  );
}

function readFieldChanges(entry: ChangeLogEntry): CodexFieldChange[] {
  return parseChangedFieldsForOperation(entry.operation, entry.changed_fields);
}

function ChangedFieldsTable({ changes }: { changes: CodexFieldChange[] }) {
  if (changes.length === 0) {
    return <p className="text-sm text-text-muted">No field-level diff recorded for this entry.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-surface-alt text-left text-xs text-text-muted uppercase">
          <tr>
            <th className="px-3 py-2 font-semibold">Field</th>
            <th className="px-3 py-2 font-semibold">Before</th>
            <th className="px-3 py-2 font-semibold">After</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((change) => (
            <tr key={change.field} className="border-t border-border-light align-top">
              <td className="px-3 py-2 font-medium text-text-primary">{change.field}</td>
              <td className="max-w-[16rem] px-3 py-2 break-words text-text-secondary">
                {formatCodexChangeValue(change.before)}
              </td>
              <td className="max-w-[16rem] px-3 py-2 break-words text-text-primary">
                {formatCodexChangeValue(change.after)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminChangelogsPage() {
  const { tabGroupId, sharedPanelId } = useTabGroup();
  const [activeTab, setActiveTab] = useState<TabId>('codex_feats');
  const [selectedEntry, setSelectedEntry] = useState<ChangeLogEntry | null>(null);

  const {
    data: rows = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'changelogs', activeTab],
    queryFn: () =>
      apiFetch<ChangeLogEntry[]>(
        `/api/admin/changelogs?entityType=${encodeURIComponent(activeTab)}&limit=200`,
      ),
  });
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to load changelogs'
    : null;

  const tabs = useMemo(
    () =>
      TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        labelMobile: tab.labelMobile,
      })),
    [],
  );

  return (
    <PageContainer size="xl">
      <PageHeader
        title="Changelogs"
        description="Review the latest codex and core-rules edits by tab. Each entity keeps the newest 10 entries."
      />

      <div className="mb-4">
        <Button variant="secondary" asChild>
          <Link href="/admin">← Back to Admin</Link>
        </Button>
      </div>

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId as TabId);
          setSelectedEntry(null);
        }}
        variant="underline"
        className="mb-6"
        tabGroupId={tabGroupId}
        sharedTabPanelId={sharedPanelId}
      />

      <TabContentPanel tabGroupId={tabGroupId} id={sharedPanelId} activeTab={activeTab}>
        {loading ? (
          <LoadingState size="lg" padding="md" />
        ) : error ? (
          <ErrorDisplay message={error} onRetry={() => void refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState title="No changelog entries yet for this tab." size="sm" />
        ) : (
          <div className="space-y-3">
            {rows.map((entry) => {
              const entityName = readCodexChangelogEntityName(entry.before_data, entry.after_data);
              const fieldChanges = readFieldChanges(entry);
              const headline = formatCodexChangelogHeadline({
                operation: entry.operation,
                entityType: entry.entity_type,
                entityName,
                fieldChanges,
              });
              const showFieldDump = entry.operation !== 'create' && fieldChanges.length > 0;
              return (
                <article key={entry.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm text-text-secondary">
                        {dateFormatter.format(new Date(entry.changed_at))} by{' '}
                        {readActorLabel(entry)}
                      </p>
                      <h2 className="text-base font-semibold text-text-primary">
                        {entityName}{' '}
                        <span className="font-normal text-text-secondary">({entry.entity_id})</span>
                      </h2>
                    </div>
                    <DescriptorChip
                      variant={operationChipVariant(entry.operation)}
                      size="sm"
                      className="font-semibold tracking-wide uppercase"
                    >
                      {entry.operation}
                    </DescriptorChip>
                  </div>

                  <p className="mt-3 text-sm text-text-secondary">{headline}</p>

                  {showFieldDump ? (
                    <div className="mt-3">
                      <ChangedFieldsTable changes={fieldChanges.slice(0, 4)} />
                      {fieldChanges.length > 4 ? (
                        <p className="mt-2 text-xs text-text-muted">
                          +{fieldChanges.length - 4} more fields in details
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {entry.operation !== 'create' ? (
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" variant="secondary" onClick={() => setSelectedEntry(entry)}>
                        View details
                      </Button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </TabContentPanel>

      <Modal
        isOpen={selectedEntry !== null}
        onClose={() => setSelectedEntry(null)}
        title="Changelog Details"
        size="xl"
        fullScreenOnMobile
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface-alt p-3">
              <p className="text-sm text-text-secondary">
                {dateFormatter.format(new Date(selectedEntry.changed_at))} by{' '}
                {readActorLabel(selectedEntry)}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Operation:{' '}
                <span className="font-medium text-text-primary">{selectedEntry.operation}</span>
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Entity:{' '}
                <span className="font-medium text-text-primary">{selectedEntry.entity_id}</span>
              </p>
            </div>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-text-primary">Changed Fields</h3>
              <ChangedFieldsTable changes={readFieldChanges(selectedEntry)} />
            </section>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
