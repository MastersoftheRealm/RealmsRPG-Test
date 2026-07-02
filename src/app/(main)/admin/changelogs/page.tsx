'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Chip, Modal, PageContainer, PageHeader, LoadingState, EmptyState, TabNavigation, TabContentPanel, useTabGroup } from '@/components/ui';
import { ErrorDisplay } from '@/components/shared';
import { apiFetch } from '@/lib/api-client';

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

const TABS: { id: TabId; label: string; labelMobile?: string }[] = [
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

function readEntityName(entry: ChangeLogEntry): string {
  const afterName = typeof entry.after_data?.name === 'string' ? entry.after_data.name : null;
  const beforeName = typeof entry.before_data?.name === 'string' ? entry.before_data.name : null;
  return afterName ?? beforeName ?? '(unnamed)';
}

function readActorLabel(entry: ChangeLogEntry): string {
  return entry.actor?.displayName ?? entry.actor?.usernameDisplay ?? entry.actor?.username ?? entry.changed_by_user_id;
}

export default function AdminChangelogsPage() {
  const { tabGroupId, sharedPanelId } = useTabGroup();
  const [activeTab, setActiveTab] = useState<TabId>('codex_feats');
  const [rows, setRows] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<ChangeLogEntry | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<ChangeLogEntry[]>(
      `/api/admin/changelogs?entityType=${encodeURIComponent(activeTab)}&limit=200`
    )
      .then((data) => {
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load changelogs');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, reloadToken]);

  const tabs = useMemo(
    () =>
      TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        labelMobile: tab.labelMobile,
      })),
    []
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
        <ErrorDisplay message={error} onRetry={() => setReloadToken((token) => token + 1)} />
      ) : rows.length === 0 ? (
        <EmptyState title="No changelog entries yet for this tab." size="sm" />
      ) : (
        <div className="space-y-3">
          {rows.map((entry) => (
            <article key={entry.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm text-text-secondary">
                    {dateFormatter.format(new Date(entry.changed_at))} by {readActorLabel(entry)}
                  </p>
                  <h2 className="text-base font-semibold text-text-primary">
                    {readEntityName(entry)} <span className="text-text-secondary font-normal">({entry.entity_id})</span>
                  </h2>
                </div>
                <Chip
                  variant={operationChipVariant(entry.operation)}
                  size="sm"
                  className="uppercase tracking-wide font-semibold"
                >
                  {entry.operation}
                </Chip>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-text-secondary">
                  Fields changed: {entry.changed_fields?.length ?? 0}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="min-h-[44px]"
                  onClick={() => setSelectedEntry(entry)}
                >
                  View Details
                </Button>
              </div>
            </article>
          ))}
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
                {dateFormatter.format(new Date(selectedEntry.changed_at))} by {readActorLabel(selectedEntry)}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                Operation: <span className="text-text-primary font-medium">{selectedEntry.operation}</span>
              </p>
              <p className="text-sm text-text-secondary mt-1">
                Entity: <span className="text-text-primary font-medium">{selectedEntry.entity_id}</span>
              </p>
            </div>

            <section>
              <h3 className="text-sm font-semibold text-text-primary mb-2">Changed Fields</h3>
              <pre className="rounded-lg border border-border bg-background p-3 text-xs overflow-auto">
                {JSON.stringify(selectedEntry.changed_fields ?? [], null, 2)}
              </pre>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-text-primary mb-2">Before</h3>
              <pre className="rounded-lg border border-border bg-background p-3 text-xs overflow-auto">
                {JSON.stringify(selectedEntry.before_data, null, 2)}
              </pre>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-text-primary mb-2">After</h3>
              <pre className="rounded-lg border border-border bg-background p-3 text-xs overflow-auto">
                {JSON.stringify(selectedEntry.after_data, null, 2)}
              </pre>
            </section>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
