/**
 * Library Page
 * =============
 * User's personal library of created powers, techniques, items, and creatures.
 * Uses unified GridListRow component with grid-aligned rows matching Codex style.
 * Styled consistently with the Codex page.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Wand2, Swords, Shield, Users } from 'lucide-react';
import { ProtectedRoute } from '@/components/layout';
import { PageContainer, PageHeader, TabNavigation, Button } from '@/components/ui';
import { DeleteConfirmModal, SourceFilter, type SourceFilterValue } from '@/components/shared';
import {
  useUserPowers,
  useUserTechniques,
  useUserItems,
  useUserCreatures,
  useDeletePower,
  useDeleteTechnique,
  useDeleteItem,
  useDeleteCreature,
} from '@/hooks';
import type { DisplayItem } from '@/types';
import { LibraryPowersTab } from './LibraryPowersTab';
import { LibraryTechniquesTab } from './LibraryTechniquesTab';
import { LibraryItemsTab } from './LibraryItemsTab';
import { LibraryCreaturesTab } from './LibraryCreaturesTab';

type TabId = 'powers' | 'techniques' | 'items' | 'creatures';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  createHref: string;
  createLabel: string;
}

const TABS: Tab[] = [
  { id: 'powers', label: 'Powers', icon: <Wand2 className="w-4 h-4" />, createHref: '/power-creator', createLabel: 'Create Power' },
  { id: 'techniques', label: 'Techniques', icon: <Swords className="w-4 h-4" />, createHref: '/technique-creator', createLabel: 'Create Technique' },
  { id: 'items', label: 'Armaments', icon: <Shield className="w-4 h-4" />, createHref: '/item-creator', createLabel: 'Create Armament' },
  { id: 'creatures', label: 'Creatures', icon: <Users className="w-4 h-4" />, createHref: '/creature-creator', createLabel: 'Create Creature' },
];

export default function LibraryPage() {
  return (
    <ProtectedRoute>
      <LibraryContent />
    </ProtectedRoute>
  );
}

function LibraryContent() {
  const [activeTab, setActiveTab] = useState<TabId>('powers');
  const [source, setSource] = useState<SourceFilterValue>('my');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: TabId; item: DisplayItem } | null>(null);

  const { data: powers = [] } = useUserPowers();
  const { data: techniques = [] } = useUserTechniques();
  const { data: items = [] } = useUserItems();
  const { data: creatures = [] } = useUserCreatures();

  const deletePower = useDeletePower();
  const deleteTechnique = useDeleteTechnique();
  const deleteItem = useDeleteItem();
  const deleteCreature = useDeleteCreature();

  const counts: Record<TabId, number> = {
    powers: powers.length,
    techniques: techniques.length,
    items: items.length,
    creatures: creatures.length,
  };

  const currentTab = TABS.find(t => t.id === activeTab)!;

  const isDeleting = deletePower.isPending || deleteTechnique.isPending ||
    deleteItem.isPending || deleteCreature.isPending;

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      switch (deleteConfirm.type) {
        case 'powers':
          await deletePower.mutateAsync(deleteConfirm.item.id);
          break;
        case 'techniques':
          await deleteTechnique.mutateAsync(deleteConfirm.item.id);
          break;
        case 'items':
          await deleteItem.mutateAsync(deleteConfirm.item.id);
          break;
        case 'creatures':
          await deleteCreature.mutateAsync(deleteConfirm.item.id);
          break;
      }
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const tabsWithCounts = TABS.map(tab => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    badge: counts[tab.id].toString(),
  }));

  return (
    <PageContainer size="xl">
      <PageHeader
        title="My Library"
        description="Your custom powers, techniques, armaments, and creatures"
        actions={
          <Link href={currentTab.createHref}>
            <Button variant="primary">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{currentTab.createLabel}</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        }
      />

      <TabNavigation
        tabs={tabsWithCounts}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabId)}
        variant="underline"
        className="mb-6"
      />

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <SourceFilter value={source} onChange={setSource} />
      </div>

      {activeTab === 'powers' && <LibraryPowersTab source={source} onDelete={(item) => setDeleteConfirm({ type: 'powers', item })} />}
      {activeTab === 'techniques' && <LibraryTechniquesTab source={source} onDelete={(item) => setDeleteConfirm({ type: 'techniques', item })} />}
      {activeTab === 'items' && <LibraryItemsTab source={source} onDelete={(item) => setDeleteConfirm({ type: 'items', item })} />}
      {activeTab === 'creatures' && <LibraryCreaturesTab source={source} onDelete={(item) => setDeleteConfirm({ type: 'creatures', item })} />}

      {deleteConfirm && (
        <DeleteConfirmModal
          itemName={deleteConfirm.item.name}
          itemType={deleteConfirm.type.slice(0, -1)}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </PageContainer>
  );
}
