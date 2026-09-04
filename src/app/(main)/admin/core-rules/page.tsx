/**
 * Admin Core Rules Editor
 * ========================
 * Edit game rules stored in the core_rules table.
 * Each tab edits one category (PROGRESSION_PLAYER, COMBAT, etc.).
 */

'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import {
  PageContainer,
  PageHeader,
  Button,
  TabNavigation,
  TabContentPanel,
  useTabGroup,
  Alert,
  LoadingState,
  Spinner,
} from '@/components/ui';
import { ConfirmActionModal } from '@/components/patterns';
import { useGameRules } from '@/hooks/use-game-rules';
import { updateCodexDoc, createCodexDoc } from '../codex/actions';
import type { CoreRulesMap } from '@/types/core-rules';
import { defined } from '@/lib/utils';
import { TABS, type CategoryId } from './core-rules-tabs';
import { CategoryEditor } from './core-rules-category-editor';

/**
 * Only a missing row justifies falling back to create. Treating every failure as "not there
 * yet" reported succeeded saves as failures and masked real errors behind "already exists".
 */
async function saveCategory(
  docId: string,
  data: Record<string, unknown>,
  failureMessage: string,
): Promise<void> {
  const result = await updateCodexDoc('core_rules', docId, data);
  if (result.success) return;
  if (result.error !== 'Document not found') {
    throw new Error(result.error || failureMessage);
  }
  const createResult = await createCodexDoc('core_rules', docId, data);
  if (!createResult.success) {
    throw new Error(createResult.error || failureMessage);
  }
}

export default function AdminCoreRulesPage() {
  const { tabGroupId, sharedPanelId } = useTabGroup();
  const { rules, isLoading } = useGameRules();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(defined(TABS[0]).id);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [creatureEditData, setCreatureEditData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const activeTabDef = TABS.find((t) => t.id === activeTab)!;
  const categoryId = activeTabDef.category;
  const pendingTabLabel = TABS.find((t) => t.id === pendingTab)?.label ?? '';

  // Re-seed editor when category or fetched rules change (render-time — TASK-430)
  const [seededRules, setSeededRules] = useState<CoreRulesMap | null>(null);
  const [seededCategory, setSeededCategory] = useState<CategoryId | null>(null);
  if (rules && (rules !== seededRules || categoryId !== seededCategory)) {
    const currentData = rules[categoryId];
    setEditData(currentData ? { ...(currentData as unknown as Record<string, unknown>) } : {});
    if (categoryId === 'PROGRESSION_PLAYER') {
      const creatureRules = rules.PROGRESSION_CREATURE;
      setCreatureEditData(
        creatureRules ? { ...(creatureRules as unknown as Record<string, unknown>) } : {},
      );
    } else {
      setCreatureEditData({});
    }
    setDirty(false);
    setError(null);
    setSuccess(null);
    setSeededRules(rules);
    setSeededCategory(categoryId);
  }

  const handleDataChange = useCallback((data: Record<string, unknown>) => {
    setEditData(data);
    setDirty(true);
    setSuccess(null);
  }, []);

  const handleCreatureDataChange = useCallback((data: Record<string, unknown>) => {
    setCreatureEditData(data);
    setDirty(true);
    setSuccess(null);
  }, []);

  // Switching category re-seeds the editor from the fetched rules, so an unguarded tab
  // change silently discards the edits (these are live game rules for every player).
  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTab((current) => {
        if (tabId === current) return current;
        if (dirty) {
          setPendingTab(tabId);
          return current;
        }
        return tabId;
      });
    },
    [dirty],
  );

  const discardAndSwitchTab = useCallback(() => {
    if (!pendingTab) return;
    setDirty(false);
    setActiveTab(pendingTab);
    setPendingTab(null);
  }, [pendingTab]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Save main category
      await saveCategory(categoryId, editData, 'Failed to save');

      // Also save creature progression if on progression tab
      if (categoryId === 'PROGRESSION_PLAYER' && Object.keys(creatureEditData).length > 0) {
        await saveCategory(
          'PROGRESSION_CREATURE',
          creatureEditData,
          'Failed to save creature progression',
        );
      }

      queryClient.invalidateQueries({ queryKey: ['codex'] });

      setDirty(false);
      setSuccess(`${activeTabDef.label} saved successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [editData, creatureEditData, categoryId, activeTabDef.label, queryClient]);

  if (isLoading) {
    return (
      <PageContainer size="xl">
        <LoadingState size="lg" padding="lg" />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="xl">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin" className="text-text-muted transition-colors hover:text-text-primary">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title="Core Rules Editor"
          description="Edit game rules. Changes take effect for all users after you save."
        />
      </div>

      <TabNavigation
        variant="underline"
        tabs={TABS.map((t) => ({ id: t.id, label: t.label }))}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabGroupId={tabGroupId}
        sharedTabPanelId={sharedPanelId}
      />

      <ConfirmActionModal
        isOpen={pendingTab !== null}
        title="Discard unsaved changes?"
        description={`${activeTabDef.label} has unsaved edits. Opening ${pendingTabLabel} will discard them.`}
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        confirmVariant="danger"
        onConfirm={discardAndSwitchTab}
        onClose={() => setPendingTab(null)}
      />

      <TabContentPanel
        tabGroupId={tabGroupId}
        id={sharedPanelId}
        activeTab={activeTab}
        className="mt-4 rounded-lg border border-border bg-surface p-6"
      >
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="mb-4">
            {success}
          </Alert>
        )}

        <CategoryEditor
          category={categoryId}
          data={editData}
          onChange={handleDataChange}
          creatureData={categoryId === 'PROGRESSION_PLAYER' ? creatureEditData : undefined}
          onCreatureChange={
            categoryId === 'PROGRESSION_PLAYER' ? handleCreatureDataChange : undefined
          }
        />

        <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
          <Button onClick={handleSave} disabled={saving || !dirty}>
            {saving ? (
              <>
                <Spinner size="sm" /> Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          {dirty && <span className="text-xs text-warning-fg">Unsaved changes</span>}
        </div>
      </TabContentPanel>
    </PageContainer>
  );
}
