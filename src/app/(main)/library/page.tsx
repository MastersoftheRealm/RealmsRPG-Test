/**
 * Library Page
 * =============
 * My Library: user's personal library (powers, techniques, armaments, creatures).
 * Realms Library: official game content; browse and add items to your library (use as-is or customize).
 * Guests can browse Realms Library read-only; sign in for My Library and to add items.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Wand2, Swords, Shield, Shirt, Sword, Users, LogIn, Sparkles } from 'lucide-react';
import { libraryTabCount, type LibraryPageTabId } from '@/lib/library/library-tab-counts';
import { useAuth } from '@/hooks';
import {
  PageContainer,
  PageHeader,
  TabNavigation,
  TabContentPanel,
  useTabGroup,
  Button,
  useToast,
} from '@/components/ui';
import {
  DeleteConfirmModal,
  LoginPromptModal,
  SegmentedControl,
  LoadingState,
} from '@/components/shared';
import { getErrorMessage } from '@/lib/api-client';
import {
  useUserLibraryCounts,
  useOfficialLibraryCounts,
  useDeletePower,
  useDeleteTechnique,
  useDeleteEmpoweredTechnique,
  useDeleteItem,
  useDeleteCreature,
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

type TabId = LibraryPageTabId;

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  createHref: string;
  createLabel: string;
}

const TABS: Tab[] = [
  {
    id: 'powers',
    label: 'Powers',
    icon: <Wand2 className="h-4 w-4" />,
    createHref: '/power-creator',
    createLabel: 'Create Power',
  },
  {
    id: 'techniques',
    label: 'Techniques',
    icon: <Swords className="h-4 w-4" />,
    createHref: '/technique-creator',
    createLabel: 'Create Technique',
  },
  {
    id: 'empowered-techniques',
    label: 'Empowered',
    icon: <Swords className="h-4 w-4" />,
    createHref: '/empowered-technique-creator',
    createLabel: 'Create Empowered Technique',
  },
  {
    id: 'weapons',
    label: 'Weapons',
    icon: <Sword className="h-4 w-4" />,
    createHref: '/item-creator',
    createLabel: 'Create Weapon',
  },
  {
    id: 'armor',
    label: 'Armor',
    icon: <Shirt className="h-4 w-4" />,
    createHref: '/item-creator',
    createLabel: 'Create Armor',
  },
  {
    id: 'shields',
    label: 'Shields',
    icon: <Shield className="h-4 w-4" />,
    createHref: '/item-creator',
    createLabel: 'Create Shield',
  },
  {
    id: 'enhanced',
    label: 'Enhanced Items',
    icon: <Sparkles className="h-4 w-4" />,
    createHref: '/crafting',
    createLabel: 'From Crafting',
  },
  {
    id: 'creatures',
    label: 'Creatures',
    icon: <Users className="h-4 w-4" />,
    createHref: '/creature-creator',
    createLabel: 'Create Creature',
  },
];

type LibraryMode = 'my' | 'public';

export default function LibraryPage() {
  return <LibraryContent />;
}

function LibraryContent() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const { tabGroupId, sharedPanelId } = useTabGroup();
  const { user, initialized: authInitialized } = useAuth();
  const isGuest = !user;
  const { showToast } = useToast();
  /** Null until auth is ready — then locked once (parity with former modeInitialized effect). */
  const [libraryMode, setLibraryMode] = useState<LibraryMode | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('powers');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: TabId;
    item: DisplayItem | UserEnhancedItem;
  } | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  if (authInitialized && libraryMode === null) {
    setLibraryMode(viewParam === 'realms' ? 'public' : user ? 'my' : 'public');
  }

  // Guests always browse Realms (even if signed-out without remount after viewing My Library).
  // Signed-in users keep the one-time lock / SegmentedControl choice.
  const resolvedLibraryMode: LibraryMode = !user ? 'public' : (libraryMode ?? 'public');

  // Enhanced exists only in My Library — clamp state and derive display so content never blanks.
  if (resolvedLibraryMode === 'public' && activeTab === 'enhanced') {
    setActiveTab('powers');
  }
  const displayTab: TabId =
    resolvedLibraryMode === 'public' && activeTab === 'enhanced' ? 'powers' : activeTab;

  const fetchMyLibrary = resolvedLibraryMode === 'my' && !!user;
  const fetchPublicLibrary = resolvedLibraryMode === 'public';

  const { data: myCounts } = useUserLibraryCounts({ enabled: fetchMyLibrary });
  const { data: publicCounts } = useOfficialLibraryCounts({ enabled: fetchPublicLibrary });
  const counts = resolvedLibraryMode === 'my' ? myCounts : publicCounts;

  const deletePower = useDeletePower();
  const deleteTechnique = useDeleteTechnique();
  const deleteEmpoweredTechnique = useDeleteEmpoweredTechnique();
  const deleteItem = useDeleteItem();
  const deleteCreature = useDeleteCreature();
  const deleteEnhancedItem = useDeleteEnhancedItem();
  const currentTab = TABS.find((t) => t.id === displayTab)!;

  const isDeleting =
    deletePower.isPending ||
    deleteTechnique.isPending ||
    deleteEmpoweredTechnique.isPending ||
    deleteItem.isPending ||
    deleteCreature.isPending ||
    deleteEnhancedItem.isPending;

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
        case 'weapons':
        case 'armor':
        case 'shields':
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
      showToast(getErrorMessage(error, 'Failed to delete item'), 'error');
    }
  };

  const tabsWithCounts = (
    resolvedLibraryMode === 'public' ? TABS.filter((t) => t.id !== 'enhanced') : TABS
  ).map((tab) => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    count: libraryTabCount(counts, tab.id),
  }));

  const isPublic = resolvedLibraryMode === 'public';

  const deleteItemType = deleteConfirm
    ? deleteConfirm.type === 'enhanced'
      ? 'enhanced item'
      : deleteConfirm.type === 'armor'
        ? 'armor'
        : deleteConfirm.type.slice(0, -1)
    : '';

  if (!authInitialized || libraryMode === null) {
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
        <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-primary-subtle-border bg-primary-subtle-bg px-4 py-3 text-text-primary">
          <span>
            You&apos;re browsing the Realms Library. Sign in to see My Library and add items to your
            collection.
          </span>
          <Link href="/login?returnTo=/library">
            <Button variant="primary" size="sm">
              <LogIn className="h-4 w-4" aria-hidden />
              Sign in
            </Button>
          </Link>
        </div>
      )}
      <PageHeader
        title={isPublic ? 'Realms Library' : 'My Library'}
        description={
          isPublic
            ? 'Official Realms content. Add items to My Library to use as-is or customize.'
            : 'Your custom powers, techniques, armaments, and creatures'
        }
        actions={
          <div className="flex items-center gap-2">
            {!isPublic && !isGuest ? (
              <Link href={currentTab.createHref}>
                <Button variant="primary">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{currentTab.createLabel}</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="mb-4 flex min-w-0 flex-wrap items-center gap-4">
        {!isGuest && (
          <SegmentedControl
            value={resolvedLibraryMode}
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

      <div className="mb-6 min-w-0">
        <TabNavigation
          tabs={tabsWithCounts}
          activeTab={displayTab}
          onTabChange={(tabId) => setActiveTab(tabId as TabId)}
          variant="underline"
          tabGroupId={tabGroupId}
          sharedTabPanelId={sharedPanelId}
        />
      </div>

      <TabContentPanel tabGroupId={tabGroupId} id={sharedPanelId} activeTab={displayTab}>
        {isPublic ? (
          <LibraryPublicContent
            activeTab={displayTab as LibraryPublicTabId}
            onLoginRequired={() => setShowLoginPrompt(true)}
            readOnly={isGuest}
          />
        ) : (
          <>
            {displayTab === 'powers' && (
              <LibraryPowersTab onDelete={(item) => setDeleteConfirm({ type: 'powers', item })} />
            )}
            {displayTab === 'techniques' && (
              <LibraryTechniquesTab
                onDelete={(item) => setDeleteConfirm({ type: 'techniques', item })}
                mode="standard"
              />
            )}
            {displayTab === 'empowered-techniques' && (
              <LibraryTechniquesTab
                onDelete={(item) => setDeleteConfirm({ type: 'empowered-techniques', item })}
                mode="empowered"
              />
            )}
            {displayTab === 'weapons' && (
              <LibraryItemsTab
                armamentKind="weapon"
                onDelete={(item) => setDeleteConfirm({ type: 'weapons', item })}
              />
            )}
            {displayTab === 'armor' && (
              <LibraryItemsTab
                armamentKind="armor"
                onDelete={(item) => setDeleteConfirm({ type: 'armor', item })}
              />
            )}
            {displayTab === 'shields' && (
              <LibraryItemsTab
                armamentKind="shield"
                onDelete={(item) => setDeleteConfirm({ type: 'shields', item })}
              />
            )}
            {displayTab === 'creatures' && (
              <LibraryCreaturesTab
                onDelete={(item) => setDeleteConfirm({ type: 'creatures', item })}
              />
            )}
            {displayTab === 'enhanced' && (
              <LibraryEnhancedTab
                onDelete={(item) => setDeleteConfirm({ type: 'enhanced', item })}
              />
            )}
          </>
        )}
      </TabContentPanel>

      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={deleteConfirm.item.name}
          itemType={deleteItemType}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirm(null)}
        />
      )}

      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        returnPath="/library"
      />
    </PageContainer>
  );
}
