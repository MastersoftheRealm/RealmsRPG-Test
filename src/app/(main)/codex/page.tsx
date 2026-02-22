/**
 * Codex Page - Full Implementation
 * =================================
 * Complete game reference (pieces/parts: feats, skills, species, equipment, parts, properties, etc.).
 * My Codex vs Public Codex: same pattern as Library (My Library / Public Library).
 * Public Codex = default; all DB codex data. My Codex = future user-created content (placeholder for now).
 * Public library content (powers, techniques, armaments, creatures) lives on the Library page.
 */

'use client';

import { useState, useCallback } from 'react';
import { PageContainer, PageHeader, TabNavigation, Button } from '@/components/ui';
import { CodexFeatsTab } from './CodexFeatsTab';
import { CodexSkillsTab } from './CodexSkillsTab';
import { CodexSpeciesTab } from './CodexSpeciesTab';
import { CodexEquipmentTab } from './CodexEquipmentTab';
import { CodexPropertiesTab } from './CodexPropertiesTab';
import { CodexPartsTab } from './CodexPartsTab';
import { CodexTraitsTab } from './CodexTraitsTab';
import { CodexCreatureFeatsTab } from './CodexCreatureFeatsTab';
import { CodexMyCodexEmpty } from './CodexMyCodexEmpty';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type CodexMode = 'public' | 'my';

type TabId = 'feats' | 'skills' | 'species' | 'equipment' | 'properties' | 'parts' | 'traits' | 'creature_feats';

const MAIN_TAB_IDS: TabId[] = ['feats', 'skills', 'species', 'equipment'];
const ADVANCED_TAB_IDS: TabId[] = ['parts', 'properties', 'creature_feats', 'traits'];

const TAB_META: { id: TabId; label: string; labelMobile?: string }[] = [
  { id: 'feats', label: 'Feats' },
  { id: 'skills', label: 'Skills' },
  { id: 'species', label: 'Species' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'parts', label: 'Power & Technique Parts', labelMobile: 'Parts' },
  { id: 'properties', label: 'Armament Properties', labelMobile: 'Properties' },
  { id: 'creature_feats', label: 'Creature Feats', labelMobile: 'Creature' },
  { id: 'traits', label: 'Traits' },
];

export default function CodexPage() {
  const [codexMode, setCodexMode] = useState<CodexMode>('public');
  const [activeTab, setActiveTab] = useState<TabId>('feats');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const visibleTabIds = showAdvanced ? [...MAIN_TAB_IDS, ...ADVANCED_TAB_IDS] : MAIN_TAB_IDS;
  const tabs = visibleTabIds
    .map((id) => TAB_META.find((t) => t.id === id))
    .filter(Boolean)
    .map((tab) => ({ id: tab!.id, label: tab!.label, labelMobile: tab!.labelMobile }));

  const onTabChange = useCallback(
    (tabId: string) => {
      setActiveTab(tabId as TabId);
    },
    []
  );

  const toggleAdvanced = useCallback(() => {
    setShowAdvanced((prev) => {
      const next = !prev;
      if (!next && ADVANCED_TAB_IDS.includes(activeTab)) {
        setActiveTab('feats');
      }
      return next;
    });
  }, [activeTab]);

  const isPublic = codexMode === 'public';

  return (
    <PageContainer size="xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <PageHeader
          title={isPublic ? 'Public Codex' : 'My Codex'}
          description={
            isPublic
              ? 'Complete reference for the Realms RPG system — feats, skills, species, equipment, parts, and properties.'
              : 'Your custom codex content (feats, traits, parts, properties) will appear here when that feature is available.'
          }
        />
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAdvanced}
          className={cn(
            'gap-1.5',
            showAdvanced && 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
          )}
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Advanced
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-alt">
          <button
            type="button"
            onClick={() => setCodexMode('public')}
            className={cn(
              'px-3 py-1.5 rounded text-sm font-medium transition-colors',
              codexMode === 'public' ? 'bg-primary-600 text-white' : 'text-text-muted hover:text-text-secondary'
            )}
          >
            Public Codex
          </button>
          <button
            type="button"
            onClick={() => setCodexMode('my')}
            className={cn(
              'px-3 py-1.5 rounded text-sm font-medium transition-colors',
              codexMode === 'my' ? 'bg-primary-600 text-white' : 'text-text-muted hover:text-text-secondary'
            )}
          >
            My Codex
          </button>
        </div>
      </div>

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        variant="underline"
        className="mb-6"
      />

      {isPublic && (
        <>
          {activeTab === 'feats' && <CodexFeatsTab />}
          {activeTab === 'skills' && <CodexSkillsTab />}
          {activeTab === 'species' && <CodexSpeciesTab />}
          {activeTab === 'equipment' && <CodexEquipmentTab />}
          {activeTab === 'properties' && <CodexPropertiesTab />}
          {activeTab === 'parts' && <CodexPartsTab />}
          {activeTab === 'traits' && <CodexTraitsTab />}
          {activeTab === 'creature_feats' && <CodexCreatureFeatsTab />}
        </>
      )}
      {!isPublic && <CodexMyCodexEmpty />}
    </PageContainer>
  );
}
