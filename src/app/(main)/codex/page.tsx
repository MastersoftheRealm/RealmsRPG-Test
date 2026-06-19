/**
 * Codex Page - Full Implementation
 * =================================
 * Complete game reference (pieces/parts: feats, skills, species, equipment, parts, properties, etc.).
 * Realms Codex vs My Codex: same pattern as Library (My Library / Realms Library).
 * Realms Codex = default; all official DB codex data. My Codex = future user-created content (placeholder for now).
 * Realms Library content (powers, techniques, armaments, creatures) lives on the Library page.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { PageContainer, PageHeader, TabNavigation, TabContentPanel, useTabGroup, Button } from '@/components/ui';
import { CodexCharacterFilter } from '@/components/codex';
import { CodexFeatsTab } from './CodexFeatsTab';
import { CodexSkillsTab } from './CodexSkillsTab';
import { CodexSpeciesTab } from './CodexSpeciesTab';
import { CodexEquipmentTab } from './CodexEquipmentTab';
import { CodexPropertiesTab } from './CodexPropertiesTab';
import { CodexPartsTab } from './CodexPartsTab';
import { CodexTraitsTab } from './CodexTraitsTab';
import { CodexCreatureFeatsTab } from './CodexCreatureFeatsTab';
import { CodexArchetypesTab } from './CodexArchetypesTab';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SegmentedControl } from '@/components/shared';

type CodexMode = 'public' | 'my';

type TabId = 'feats' | 'skills' | 'species' | 'archetypes' | 'equipment' | 'properties' | 'parts' | 'traits' | 'creature_feats';

/** localStorage key for the persisted "view as character" selection. */
const CODEX_CHARACTER_FILTER_KEY = 'codex:characterFilterId';

const MAIN_TAB_IDS: TabId[] = ['feats', 'skills', 'species', 'archetypes', 'equipment'];
const ADVANCED_TAB_IDS: TabId[] = ['parts', 'properties', 'creature_feats', 'traits'];

const TAB_META: { id: TabId; label: string; labelMobile?: string }[] = [
  { id: 'feats', label: 'Feats' },
  { id: 'skills', label: 'Skills' },
  { id: 'species', label: 'Species' },
  { id: 'archetypes', label: 'Archetypes' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'parts', label: 'Power & Technique Parts', labelMobile: 'Parts' },
  { id: 'properties', label: 'Armament Properties', labelMobile: 'Properties' },
  { id: 'creature_feats', label: 'Creature Feats', labelMobile: 'Creature' },
  { id: 'traits', label: 'Traits' },
];

export default function CodexPage() {
  const { tabGroupId, sharedPanelId } = useTabGroup();
  const [codexMode, setCodexMode] = useState<CodexMode>('public');
  const [activeTab, setActiveTab] = useState<TabId>('feats');
  const [showAdvanced, setShowAdvanced] = useState(false);
  // "View as character" selection — shared across all tabs and persisted locally.
  const [characterFilterId, setCharacterFilterId] = useState('');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CODEX_CHARACTER_FILTER_KEY);
      if (stored) setCharacterFilterId(stored);
    } catch {
      // ignore storage access errors (private mode, etc.)
    }
  }, []);

  const handleCharacterFilterChange = useCallback((id: string) => {
    setCharacterFilterId(id);
    try {
      if (id) window.localStorage.setItem(CODEX_CHARACTER_FILTER_KEY, id);
      else window.localStorage.removeItem(CODEX_CHARACTER_FILTER_KEY);
    } catch {
      // ignore storage access errors
    }
  }, []);

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
          title={isPublic ? 'Realms Codex' : 'My Codex'}
          description={
            isPublic
              ? 'Complete reference for the Realms RPG system: feats, skills, species, archetype paths, equipment, parts, and properties.'
              : 'Your custom species and other codex content appear here. Create species in the Species Creator.'
          }
        />
        <div className="flex items-center gap-2">
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-4 min-w-0">
        <SegmentedControl
          value={codexMode}
          onChange={setCodexMode}
          options={[
            { value: 'public', label: 'Realms Codex' },
            { value: 'my', label: 'My Codex' },
          ]}
          aria-label="Codex scope"
          className="flex-shrink-0"
        />
        <CodexCharacterFilter
          value={characterFilterId}
          onChange={handleCharacterFilterChange}
        />
      </div>

      <div className="min-w-0 mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <TabNavigation
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={onTabChange}
              variant="underline"
              tabGroupId={tabGroupId}
              sharedTabPanelId={sharedPanelId}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAdvanced}
            className={cn(
              'gap-1.5 flex-shrink-0 min-h-[44px]',
              showAdvanced && 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
            )}
            aria-pressed={showAdvanced}
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced
          </Button>
        </div>
      </div>

      <TabContentPanel tabGroupId={tabGroupId} id={sharedPanelId} activeTab={activeTab}>
      {isPublic && (
        <>
          {activeTab === 'feats' && <CodexFeatsTab codexMode="public" characterId={characterFilterId} />}
          {activeTab === 'skills' && <CodexSkillsTab codexMode="public" />}
          {activeTab === 'species' && <CodexSpeciesTab codexMode="public" />}
          {activeTab === 'archetypes' && <CodexArchetypesTab codexMode="public" />}
          {activeTab === 'equipment' && <CodexEquipmentTab codexMode="public" />}
          {activeTab === 'properties' && <CodexPropertiesTab codexMode="public" />}
          {activeTab === 'parts' && <CodexPartsTab codexMode="public" />}
          {activeTab === 'traits' && <CodexTraitsTab codexMode="public" />}
          {activeTab === 'creature_feats' && <CodexCreatureFeatsTab codexMode="public" />}
        </>
      )}
      {!isPublic && (
        <>
          {activeTab === 'feats' && <CodexFeatsTab codexMode="my" characterId={characterFilterId} />}
          {activeTab === 'skills' && <CodexSkillsTab codexMode="my" />}
          {activeTab === 'species' && <CodexSpeciesTab codexMode="my" />}
          {activeTab === 'archetypes' && <CodexArchetypesTab codexMode="my" />}
          {activeTab === 'equipment' && <CodexEquipmentTab codexMode="my" />}
          {activeTab === 'properties' && <CodexPropertiesTab codexMode="my" />}
          {activeTab === 'parts' && <CodexPartsTab codexMode="my" />}
          {activeTab === 'traits' && <CodexTraitsTab codexMode="my" />}
          {activeTab === 'creature_feats' && <CodexCreatureFeatsTab codexMode="my" />}
        </>
      )}
      </TabContentPanel>
    </PageContainer>
  );
}
