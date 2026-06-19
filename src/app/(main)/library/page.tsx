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
import { Plus, Wand2, Swords, Shield, Users, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks';
import { PageContainer, PageHeader, TabNavigation, TabContentPanel, useTabGroup, Button, useToast } from '@/components/ui';
import { DeleteConfirmModal, LoginPromptModal, SegmentedControl, LoadingState } from '@/components/shared';
import {
  useUserPowers,
  useUserTechniques,
  useUserEmpoweredTechniques,
  useUserItems,
  useUserCreatures,
  useDeletePower,
  useDeleteTechnique,
  useDeleteEmpoweredTechnique,
  useDeleteItem,
  useDeleteCreature,
  useOfficialLibrary,
  useEnhancedItems,
  useDeleteEnhancedItem,
} from '@/hooks';
import type { DisplayItem } from '@/types';
import type { UserEnhancedItem } from '@/types/crafting';
import { LibraryPowersTab } from './LibraryPowersTab';
import { LibraryTechniquesTab } from './LibraryTechniquesTab';
import { LibraryItemsTab } from './LibraryItemsTab';
import { LibraryCreaturesTab } from './LibraryCreaturesTab';
import { LibraryEnhancedTab } from './LibraryEnhancedTab';
import { LibraryPublicContent, type LibraryPublicTabId } from './LibraryPublicContent';

type TabId = 'powers' | 'techniques' | 'empowered-techniques' | 'items' | 'creatures' | 'enhanced';

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
  { id: 'empowered-techniques', label: 'Empowered', icon: <Swords className="w-4 h-4" />, createHref: '/empowered-technique-creator', createLabel: 'Create Empowered Technique' },
  { id: 'items', label: 'Armaments', icon: <Shield className="w-4 h-4" />, createHref: '/item-creator', createLabel: 'Create Armament' },
  { id: 'creatures', label: 'Creatures', icon: <Users className="w-4 h-4" />, createHref: '/creature-creator', createLabel: 'Create Creature' },
  { id: 'enhanced', label: 'Enhanced', icon: <Sparkles className="w-4 h-4" />, createHref: '/crafting', createLabel: 'From Crafting' },
];

type LibraryMode = 'my' | 'public';

export default function LibraryPage() {
  return <LibraryContent />;
}

function LibraryContent() {
  const { tabGroupId, sharedPanelId } = useTabGroup();
  const { user, initialized: authInitialized } = useAuth();
  const isGuest = !user;
  const { showToast } = useToast();
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('public');
  const [modeInitialized, setModeInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('powers');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: TabId; item: DisplayItem | UserEnhancedItem } | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    if (!authInitialized) return;
    if (!modeInitialized) {
      setLibraryMode(user ? 'my' : 'public');
      setModeInitialized(true);
    }
  }, [authInitialized, user, modeInitialized]);

  // The Enhanced tab only exists in My Library; if we switch to Realms mode
  // while it's active, fall back to a valid tab so content doesn't go blank.
  useEffect(() => {
    if (libraryMode === 'public' && activeTab === 'enhanced') setActiveTab('powers');
  }, [libraryMode, activeTab]);

  const fetchMyLibrary = libraryMode === 'my' && !!user;
  const fetchPublicLibrary = libraryMode === 'public';

  const { data: powers = [] } = useUserPowers({ enabled: fetchMyLibrary });
  const { data: techniques = [] } = useUserTechniques({ enabled: fetchMyLibrary });
  const { data: empoweredTechniques = [] } = useUserEmpoweredTechniques({ enabled: fetchMyLibrary });
  const { data: items = [] } = useUserItems({ enabled: fetchMyLibrary });
  const { data: creatures = [] } = useUserCreatures({ enabled: fetchMyLibrary });

  const { data: publicPowers = [] } = useOfficialLibrary('powers', { enabled: fetchPublicLibrary });
  const { data: publicTechniques = [] } = useOfficialLibrary('techniques', { enabled: fetchPublicLibrary });
  const { data: publicEmpoweredTechniques = [] } = useOfficialLibrary('empowered-techniques', { enabled: fetchPublicLibrary });
  const { data: publicItems = [] } = useOfficialLibrary('items', { enabled: fetchPublicLibrary });
  const { data: publicCreatures = [] } = useOfficialLibrary('creatures', { enabled: fetchPublicLibrary });

  const deletePower = useDeletePower();
  const deleteTechnique = useDeleteTechnique();
  const deleteEmpoweredTechnique = useDeleteEmpoweredTechnique();
  const deleteItem = useDeleteItem();
  const deleteCreature = useDeleteCreature();
  const deleteEnhancedItem = useDeleteEnhancedItem();

  const { data: enhancedItems = [] } = useEnhancedItems('user', { enabled: fetchMyLibrary });

  const myCounts: Record<TabId, number> = {
    powers: powers.length,
    techniques: techniques.length,
    'empowered-techniques': empoweredTechniques.length,
    items: items.length,
    creatures: creatures.length,
    enhanced: enhancedItems.length,
  };

  const publicCounts: Record<TabId, number> = {
    powers: publicPowers.length,
    techniques: publicTechniques.length,
    'empowered-techniques': publicEmpoweredTechniques.length,
    items: publicItems.length,
    creatures: publicCreatures.length,
    enhanced: 0,
  };

  const counts = libraryMode === 'my' ? myCounts : publicCounts;
  const currentTab = TABS.find(t => t.id === activeTab)!;

  const isDeleting = deletePower.isPending || deleteTechnique.isPending || deleteEmpoweredTechnique.isPending ||
    deleteItem.isPending || deleteCreature.isPending || deleteEnhancedItem.isPending;

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
        case 'empowered-techniques':
          await deleteEmpoweredTechnique.mutateAsync(deleteConfirm.item.id);
          break;
        case 'items':
          await deleteItem.mutateAsync(deleteConfirm.item.id);
          break;
        case 'creatures':
          await deleteCreature.mutateAsync(deleteConfirm.item.id);
          break;
        case 'enhanced':
          await deleteEnhancedItem.mutateAsync(deleteConfirm.item.id);
          break;
      }
      setDeleteConfirm(null);
    } catch (error) {
      showToast((error as Error)?.message ?? 'Failed to delete item', 'error');
    }
  };

  const tabsWithCounts = (libraryMode === 'public' ? TABS.filter((t) => t.id !== 'enhanced') : TABS).map(tab => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    count: counts[tab.id],
  }));

  const isPublic = libraryMode === 'public';

  if (!authInitialized || !modeInitialized) {
    return (
      <PageContainer size="xl">
        <PageHeader title="Library" />
        <LoadingState message="Loading library..." />
      </PageContainer>
    );
  }

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
          <div className="flex items-center gap-2">
            {!isPublic && !isGuest ? (
              <Link href={currentTab.createHref}>
                <Button variant="primary">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">{currentTab.createLabel}</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-4 min-w-0">
        {!isGuest && (
          <SegmentedControl
            value={libraryMode}
            onChange={setLibraryMode}
            options={[
              { value: 'my', label: 'My Library' },
              { value: 'public', label: 'Realms Library' },
            ]}
            aria-label="Library scope"
            className="flex-shrink-0"
          />
        )}
      </div>

      <div className="min-w-0 mb-6">
        <TabNavigation
          tabs={tabsWithCounts}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as TabId)}
          variant="underline"
          tabGroupId={tabGroupId}
          sharedTabPanelId={sharedPanelId}
        />
      </div>

      <TabContentPanel tabGroupId={tabGroupId} id={sharedPanelId} activeTab={activeTab}>
      {isPublic ? (
        <LibraryPublicContent
          activeTab={activeTab as LibraryPublicTabId}
          onLoginRequired={() => setShowLoginPrompt(true)}
          readOnly={isGuest}
        />
      ) : (
        <>
          {activeTab === 'powers' && <LibraryPowersTab onDelete={(item) => setDeleteConfirm({ type: 'powers', item })} />}
          {activeTab === 'techniques' && <LibraryTechniquesTab onDelete={(item) => setDeleteConfirm({ type: 'techniques', item })} mode="standard" />}
          {activeTab === 'empowered-techniques' && <LibraryTechniquesTab onDelete={(item) => setDeleteConfirm({ type: 'empowered-techniques', item })} mode="empowered" />}
          {activeTab === 'items' && <LibraryItemsTab onDelete={(item) => setDeleteConfirm({ type: 'items', item })} />}
          {activeTab === 'creatures' && <LibraryCreaturesTab onDelete={(item) => setDeleteConfirm({ type: 'creatures', item })} />}
          {activeTab === 'enhanced' && <LibraryEnhancedTab onDelete={(item) => setDeleteConfirm({ type: 'enhanced', item })} />}
        </>
      )}
      </TabContentPanel>

      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={deleteConfirm.item.name}
          itemType={deleteConfirm.type === 'enhanced' ? 'enhanced item' : deleteConfirm.type.slice(0, -1)}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirm(null)}
        />
      )}

      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} returnPath="/library" />
    </PageContainer>
  );
}
