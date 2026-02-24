/**
 * Library Page
 * =============
 * My Library: user's personal library (powers, techniques, armaments, creatures).
 * Realms Library: official game content; browse and add items to your library (use as-is or customize).
 * Guests can browse Realms Library read-only; sign in for My Library and to add items.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Wand2, Swords, Shield, Users, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks';
import { PageContainer, PageHeader, TabNavigation, Button, useToast } from '@/components/ui';
import { DeleteConfirmModal, LoginPromptModal } from '@/components/shared';
import {
  useUserPowers,
  useUserTechniques,
  useUserItems,
  useUserCreatures,
  useDeletePower,
  useDeleteTechnique,
  useDeleteItem,
  useDeleteCreature,
  usePublicLibrary,
} from '@/hooks';
import type { DisplayItem } from '@/types';
import { LibraryPowersTab } from './LibraryPowersTab';
import { LibraryTechniquesTab } from './LibraryTechniquesTab';
import { LibraryItemsTab } from './LibraryItemsTab';
import { LibraryCreaturesTab } from './LibraryCreaturesTab';
import { LibraryPublicContent, type LibraryPublicTabId } from './LibraryPublicContent';

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

type LibraryMode = 'my' | 'public';

export default function LibraryPage() {
  return <LibraryContent />;
}

function LibraryContent() {
  const { user } = useAuth();
  const isGuest = !user;
  const { showToast } = useToast();
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('public');
  const [activeTab, setActiveTab] = useState<TabId>('powers');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: TabId; item: DisplayItem } | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    if (!isGuest) setLibraryMode('my');
  }, [isGuest]);

  const { data: powers = [] } = useUserPowers();
  const { data: techniques = [] } = useUserTechniques();
  const { data: items = [] } = useUserItems();
  const { data: creatures = [] } = useUserCreatures();

  const { data: publicPowers = [] } = usePublicLibrary('powers');
  const { data: publicTechniques = [] } = usePublicLibrary('techniques');
  const { data: publicItems = [] } = usePublicLibrary('items');
  const { data: publicCreatures = [] } = usePublicLibrary('creatures');

  const deletePower = useDeletePower();
  const deleteTechnique = useDeleteTechnique();
  const deleteItem = useDeleteItem();
  const deleteCreature = useDeleteCreature();

  const myCounts: Record<TabId, number> = {
    powers: powers.length,
    techniques: techniques.length,
    items: items.length,
    creatures: creatures.length,
  };

  const publicCounts: Record<TabId, number> = {
    powers: publicPowers.length,
    techniques: publicTechniques.length,
    items: publicItems.length,
    creatures: publicCreatures.length,
  };

  const counts = libraryMode === 'my' ? myCounts : publicCounts;
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
      showToast((error as Error)?.message ?? 'Failed to delete item', 'error');
    }
  };

  const tabsWithCounts = TABS.map(tab => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    badge: counts[tab.id].toString(),
  }));

  const isPublic = libraryMode === 'public';

  return (
    <PageContainer size="xl">
      {isGuest && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-lg bg-primary-600/10 border border-primary-600/20 px-4 py-3 text-text-primary">
          <span>You&apos;re browsing the Realms Library. Sign in to see My Library and add items to your collection.</span>
          <Link href="/login?returnTo=/library">
            <Button variant="primary" size="sm">
              <LogIn className="w-4 h-4" aria-hidden />
              Sign in
            </Button>
          </Link>
        </div>
      )}
      <PageHeader
        title={isPublic ? 'Realms Library' : 'My Library'}
        description={isPublic ? 'Official Realms content. Add items to My Library to use as-is or customize.' : 'Your custom powers, techniques, armaments, and creatures'}
        actions={
          !isPublic && !isGuest ? (
            <Link href={currentTab.createHref}>
              <Button variant="primary">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{currentTab.createLabel}</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-4 min-w-0">
        {!isGuest && (
          <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-alt flex-shrink-0">
            <button
            type="button"
            onClick={() => setLibraryMode('my')}
            className={cn(
              'px-3 py-1.5 rounded text-sm font-medium transition-colors',
              libraryMode === 'my' ? 'bg-primary-600 text-white' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            My Library
          </button>
          <button
            type="button"
            onClick={() => setLibraryMode('public')}
            className={cn(
              'px-3 py-1.5 rounded text-sm font-medium transition-colors',
              libraryMode === 'public' ? 'bg-primary-600 text-white' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            Realms Library
          </button>
        </div>
        )}
      </div>

      <div className="min-w-0 mb-6">
        <TabNavigation
          tabs={tabsWithCounts}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as TabId)}
          variant="underline"
        />
      </div>

      {isPublic ? (
        <LibraryPublicContent
          activeTab={activeTab as LibraryPublicTabId}
          onLoginRequired={() => setShowLoginPrompt(true)}
          readOnly={isGuest}
        />
      ) : (
        <>
          {activeTab === 'powers' && <LibraryPowersTab onDelete={(item) => setDeleteConfirm({ type: 'powers', item })} />}
          {activeTab === 'techniques' && <LibraryTechniquesTab onDelete={(item) => setDeleteConfirm({ type: 'techniques', item })} />}
          {activeTab === 'items' && <LibraryItemsTab onDelete={(item) => setDeleteConfirm({ type: 'items', item })} />}
          {activeTab === 'creatures' && <LibraryCreaturesTab onDelete={(item) => setDeleteConfirm({ type: 'creatures', item })} />}
        </>
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={deleteConfirm.item.name}
          itemType={deleteConfirm.type.slice(0, -1)}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirm(null)}
        />
      )}

      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} returnPath="/library" />
    </PageContainer>
  );
}
