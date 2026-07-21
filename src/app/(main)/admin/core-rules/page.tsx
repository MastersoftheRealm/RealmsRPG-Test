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
import { PageContainer, PageHeader, Button, TabNavigation, TabContentPanel, useTabGroup, Alert, LoadingState, Spinner } from '@/components/ui';
import { useGameRules } from '@/hooks/use-game-rules';
import { updateCodexDoc, createCodexDoc } from '../codex/actions';
import type { CoreRulesMap } from '@/types/core-rules';
import { TABS, type CategoryId } from './core-rules-tabs';
import { CategoryEditor } from './core-rules-category-editor';

export default function AdminCoreRulesPage() {
  const { tabGroupId, sharedPanelId } = useTabGroup();
  const { rules, isLoading } = useGameRules();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [creatureEditData, setCreatureEditData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const activeTabDef = TABS.find(t => t.id === activeTab)!;
  const categoryId = activeTabDef.category;

  // Re-seed editor when category or fetched rules change (render-time — TASK-430)
  const [seededRules, setSeededRules] = useState<CoreRulesMap | null>(null);
  const [seededCategory, setSeededCategory] = useState<CategoryId | null>(null);
  if (rules && (rules !== seededRules || categoryId !== seededCategory)) {
    const currentData = rules[categoryId];
    setEditData(currentData ? { ...(currentData as unknown as Record<string, unknown>) } : {});
    if (categoryId === 'PROGRESSION_PLAYER') {
      const creatureRules = rules.PROGRESSION_CREATURE;
      setCreatureEditData(
        creatureRules ? { ...(creatureRules as unknown as Record<string, unknown>) } : {}
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

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Save main category
      const result = await updateCodexDoc('core_rules', categoryId, editData);
      if (!result.success) {
        const createResult = await createCodexDoc('core_rules', categoryId, editData);
        if (!createResult.success) {
          throw new Error(createResult.error || 'Failed to save');
        }
      }

      // Also save creature progression if on progression tab
      if (categoryId === 'PROGRESSION_PLAYER' && Object.keys(creatureEditData).length > 0) {
        const creatureResult = await updateCodexDoc('core_rules', 'PROGRESSION_CREATURE', creatureEditData);
        if (!creatureResult.success) {
          const createResult = await createCodexDoc('core_rules', 'PROGRESSION_CREATURE', creatureEditData);
          if (!createResult.success) {
            throw new Error(createResult.error || 'Failed to save creature progression');
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['core-rules'] });
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
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin" className="text-text-muted dark:text-text-secondary hover:text-text-primary transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <PageHeader
          title="Core Rules Editor"
          description="Edit game rules. Changes take effect for all users after you save."
        />
      </div>

      <TabNavigation
        variant="underline"
        tabs={TABS.map(t => ({ id: t.id, label: t.label }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabGroupId={tabGroupId}
        sharedTabPanelId={sharedPanelId}
      />

      <TabContentPanel tabGroupId={tabGroupId} id={sharedPanelId} activeTab={activeTab} className="mt-4 rounded-lg border border-border bg-surface p-6">
        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
        {success && <Alert variant="success" className="mb-4">{success}</Alert>}

        <CategoryEditor
          category={categoryId}
          data={editData}
          onChange={handleDataChange}
          creatureData={categoryId === 'PROGRESSION_PLAYER' ? creatureEditData : undefined}
          onCreatureChange={categoryId === 'PROGRESSION_PLAYER' ? handleCreatureDataChange : undefined}
        />

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving ? <><Spinner size="sm" /> Saving...</> : 'Save Changes'}
          </Button>
          {dirty && <span className="text-xs text-warning-700 dark:text-warning-400">Unsaved changes</span>}
        </div>
      </TabContentPanel>
    </PageContainer>
  );
}
