'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Modal, PageContainer, PageHeader, Spinner, Textarea, Alert } from '@/components/ui';
import { ErrorDisplay } from '@/components/shared';
import { apiFetch } from '@/lib/api-client';
import { interpolateTooltipTemplate } from '@/lib/tooltips/interpolate';
import { renderMarkdownLite } from '@/lib/tooltips/markdown-lite';
import { useGameRules } from '@/hooks/use-game-rules';
import type { TooltipListResponse, TooltipRecord, TooltipAudience, TooltipPlacement, TooltipTrigger } from '@/types/tooltips';

interface TooltipEditorState {
  id: string | null;
  key: string;
  scope: string;
  title: string;
  bodyMd: string;
  placement: TooltipPlacement;
  trigger: TooltipTrigger;
  audience: TooltipAudience;
  enabled: boolean;
  version: number;
}

const EMPTY_EDITOR: TooltipEditorState = {
  id: null,
  key: '',
  scope: '',
  title: '',
  bodyMd: '',
  placement: 'top',
  trigger: 'auto',
  audience: 'new_player',
  enabled: true,
  version: 1,
};

const SAMPLE_CONTEXT = {
  level: 1,
  archetypeAbility: 2,
};

export default function AdminTooltipsPage() {
  const queryClient = useQueryClient();
  const { rules } = useGameRules();
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<'any' | TooltipAudience>('any');
  const [enabledFilter, setEnabledFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [editor, setEditor] = useState<TooltipEditorState>(EMPTY_EDITOR);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const query = useQuery<TooltipListResponse, Error>({
    queryKey: ['admin-tooltips'],
    queryFn: () => apiFetch<TooltipListResponse>('/api/tooltips?includeAll=1', { cache: 'no-store' }),
    staleTime: 0,
  });

  const rows = query.data?.tooltips ?? [];
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (audienceFilter !== 'any' && row.audience !== audienceFilter) return false;
      if (enabledFilter === 'enabled' && !row.enabled) return false;
      if (enabledFilter === 'disabled' && row.enabled) return false;
      if (!q) return true;
      return (
        row.key.toLowerCase().includes(q) ||
        row.scope.toLowerCase().includes(q) ||
        (row.title ?? '').toLowerCase().includes(q) ||
        row.bodyMd.toLowerCase().includes(q)
      );
    });
  }, [rows, search, audienceFilter, enabledFilter]);

  const openCreate = () => {
    setEditor(EMPTY_EDITOR);
    setMessage(null);
    setIsModalOpen(true);
  };

  const openEdit = (row: TooltipRecord) => {
    setEditor({
      id: row.id,
      key: row.key,
      scope: row.scope,
      title: row.title ?? '',
      bodyMd: row.bodyMd,
      placement: row.placement,
      trigger: row.trigger,
      audience: row.audience,
      enabled: row.enabled,
      version: row.version,
    });
    setMessage(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditor(EMPTY_EDITOR);
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-tooltips'] });
    await queryClient.invalidateQueries({ queryKey: ['tooltips'] });
  };

  const saveTooltip = async () => {
    if (!editor.key.trim() || !editor.scope.trim() || !editor.bodyMd.trim()) {
      setMessage({ type: 'error', text: 'Key, scope, and body are required.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      if (editor.id) {
        await apiFetch('/api/tooltips', {
          method: 'PATCH',
          body: JSON.stringify({
            id: editor.id,
            key: editor.key.trim(),
            scope: editor.scope.trim(),
            title: editor.title.trim() || null,
            bodyMd: editor.bodyMd,
            placement: editor.placement,
            trigger: editor.trigger,
            audience: editor.audience,
            enabled: editor.enabled,
            version: editor.version,
          }),
        });
      } else {
        await apiFetch('/api/tooltips', {
          method: 'POST',
          body: JSON.stringify({
            key: editor.key.trim(),
            scope: editor.scope.trim(),
            title: editor.title.trim() || null,
            bodyMd: editor.bodyMd,
            placement: editor.placement,
            trigger: editor.trigger,
            audience: editor.audience,
            enabled: editor.enabled,
            version: editor.version,
          }),
        });
      }
      await refresh();
      setMessage({ type: 'success', text: editor.id ? 'Tooltip updated.' : 'Tooltip created.' });
      closeModal();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save tooltip' });
    } finally {
      setSaving(false);
    }
  };

  const deleteTooltip = async (id: string) => {
    setMessage(null);
    try {
      await apiFetch(`/api/tooltips?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refresh();
      setMessage({ type: 'success', text: 'Tooltip deleted.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to delete tooltip' });
    }
  };

  const previewTitle = editor.title.trim()
    ? interpolateTooltipTemplate(editor.title, rules, SAMPLE_CONTEXT)
    : null;
  const previewBody = interpolateTooltipTemplate(editor.bodyMd, rules, SAMPLE_CONTEXT);

  return (
    <PageContainer size="xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <PageHeader title="Tooltip Editor" description="Create and manage onboarding/help tooltips across the app." />
        <Button onClick={openCreate}>Create Tooltip</Button>
      </div>

      <div className="mb-4">
        <Button variant="secondary" asChild>
          <Link href="/admin">← Back to Admin</Link>
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'danger'} className="mb-4">
          {message.text}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search key, scope, title, text"
          aria-label="Search tooltips"
        />
        <select
          value={audienceFilter}
          onChange={(event) => setAudienceFilter(event.target.value as 'any' | TooltipAudience)}
          className="rounded-lg border border-border-light bg-surface px-3 py-2"
          aria-label="Filter by audience"
        >
          <option value="any">All audiences</option>
          <option value="new_player">New Player</option>
          <option value="all">All users</option>
          <option value="admin">Admin only</option>
        </select>
        <select
          value={enabledFilter}
          onChange={(event) => setEnabledFilter(event.target.value as 'all' | 'enabled' | 'disabled')}
          className="rounded-lg border border-border-light bg-surface px-3 py-2"
          aria-label="Filter by enabled status"
        >
          <option value="all">All statuses</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {query.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : query.error ? (
        <ErrorDisplay message={query.error.message || 'Failed to load tooltips'} onRetry={() => { void query.refetch(); }} />
      ) : (
        <div className="rounded-lg border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt border-b border-border">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-text-primary">Key</th>
                <th className="text-left px-4 py-2 font-semibold text-text-primary">Scope</th>
                <th className="text-left px-4 py-2 font-semibold text-text-primary">Audience</th>
                <th className="text-left px-4 py-2 font-semibold text-text-primary">Status</th>
                <th className="text-left px-4 py-2 font-semibold text-text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-b border-border-light last:border-0">
                  <td className="px-4 py-3 font-medium text-text-primary">{row.key}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.scope}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.audience}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.enabled ? 'Enabled' : 'Disabled'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => deleteTooltip(row.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted dark:text-text-secondary">
                    No tooltips found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editor.id ? 'Edit Tooltip' : 'Create Tooltip'}
        size="xl"
        fullScreenOnMobile
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Input
              value={editor.key}
              onChange={(event) => setEditor((prev) => ({ ...prev, key: event.target.value }))}
              placeholder="tooltip.key"
              aria-label="Tooltip key"
            />
            <Input
              value={editor.scope}
              onChange={(event) => setEditor((prev) => ({ ...prev, scope: event.target.value }))}
              placeholder="page:/characters/new"
              aria-label="Tooltip scope"
            />
            <Input
              value={editor.title}
              onChange={(event) => setEditor((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Optional title"
              aria-label="Tooltip title"
            />
            <Textarea
              value={editor.bodyMd}
              onChange={(event) => setEditor((prev) => ({ ...prev, bodyMd: event.target.value }))}
              placeholder="Tooltip markdown-lite body"
              rows={8}
              aria-label="Tooltip body"
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-sm text-text-secondary">
                Placement
                <select
                  value={editor.placement}
                  onChange={(event) => setEditor((prev) => ({ ...prev, placement: event.target.value as TooltipPlacement }))}
                  className="rounded-lg border border-border-light bg-surface px-3 py-2 text-text-primary"
                >
                  <option value="top">top</option>
                  <option value="bottom">bottom</option>
                  <option value="left">left</option>
                  <option value="right">right</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-text-secondary">
                Trigger
                <select
                  value={editor.trigger}
                  onChange={(event) => setEditor((prev) => ({ ...prev, trigger: event.target.value as TooltipTrigger }))}
                  className="rounded-lg border border-border-light bg-surface px-3 py-2 text-text-primary"
                >
                  <option value="auto">auto</option>
                  <option value="hover">hover</option>
                  <option value="focus">focus</option>
                  <option value="click">click</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-text-secondary">
                Audience
                <select
                  value={editor.audience}
                  onChange={(event) => setEditor((prev) => ({ ...prev, audience: event.target.value as TooltipAudience }))}
                  className="rounded-lg border border-border-light bg-surface px-3 py-2 text-text-primary"
                >
                  <option value="new_player">new_player</option>
                  <option value="all">all</option>
                  <option value="admin">admin</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-text-secondary">
                Version
                <Input
                  type="number"
                  min={1}
                  value={String(editor.version)}
                  onChange={(event) =>
                    setEditor((prev) => ({
                      ...prev,
                      version: Number.isFinite(Number(event.target.value)) ? Number(event.target.value) : 1,
                    }))
                  }
                  aria-label="Tooltip version"
                />
              </label>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-text-secondary min-h-[44px]">
              <input
                type="checkbox"
                checked={editor.enabled}
                onChange={(event) => setEditor((prev) => ({ ...prev, enabled: event.target.checked }))}
                aria-label="Tooltip enabled"
              />
              Enabled
            </label>
          </div>

          <div className="rounded-lg border border-border-light bg-surface-alt p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Preview</h3>
            {previewTitle && <div className="text-sm font-semibold text-text-primary mb-2">{previewTitle}</div>}
            {renderMarkdownLite(previewBody)}
            <p className="text-xs text-text-muted dark:text-text-secondary mt-3">
              Preview context: level={SAMPLE_CONTEXT.level}, archetypeAbility={SAMPLE_CONTEXT.archetypeAbility}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={saveTooltip} disabled={saving} isLoading={saving}>
            {editor.id ? 'Save Changes' : 'Create Tooltip'}
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
