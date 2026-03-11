/**
 * Crafting Hub Page
 * =================
 * List crafting sessions (planned, in progress, completed). Start Crafting -> /crafting/new.
 */

'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Hammer, Plus, ArrowUpCircle, Sparkles } from 'lucide-react';
import {
  PageContainer,
  PageHeader,
  Button,
  EmptyState,
  LoadingState,
  Alert,
  SearchInput,
  TabNavigation,
  useToast,
} from '@/components/ui';
import { DeleteConfirmModal, HubListRow } from '@/components/shared';
import {
  useCraftingSessions,
  useDeleteCraftingSession,
  useAuth,
} from '@/hooks';
import type { CraftingSessionSummary, CraftingSessionStatus } from '@/types/crafting';

const STATUS_LABELS: Record<CraftingSessionStatus, string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Completed',
};

const STATUS_COLORS: Record<CraftingSessionStatus, string> = {
  planned: 'bg-surface-alt text-text-secondary',
  in_progress: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-surface-alt text-text-muted dark:text-text-secondary',
};

type TabId = 'all' | 'in_progress' | 'completed';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
];

export default function CraftingHubPage() {
  return (
    <Suspense
      fallback={
        <PageContainer size="xl">
          <LoadingState message="Loading crafting sessions..." />
        </PageContainer>
      }
    >
      <CraftingHubContent />
    </Suspense>
  );
}

function CraftingHubContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { data: sessions = [], isLoading, error } = useCraftingSessions();
  const deleteMutation = useDeleteCraftingSession();

  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CraftingSessionSummary | null>(null);

  const filteredSessions = useMemo(() => {
    let result = [...sessions];
    if (activeTab === 'in_progress') {
      result = result.filter((s) => s.status === 'in_progress' || s.status === 'planned');
    } else if (activeTab === 'completed') {
      result = result.filter((s) => s.status === 'completed');
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (x) =>
          x.itemName.toLowerCase().includes(s)
      );
    }
    return result;
  }, [sessions, activeTab, search]);

  const inProgressCount = sessions.filter(
    (s) => s.status === 'in_progress' || s.status === 'planned'
  ).length;
  const completedCount = sessions.filter((s) => s.status === 'completed').length;

  const handleStartCrafting = () => {
    router.push('/crafting/new');
  };

  const handleUpgradeItem = () => {
    router.push('/crafting/new?mode=upgrade');
  };

  const handleUpgradePotency = () => {
    router.push('/crafting/new?mode=upgrade-potency');
  };

  const handleOpen = (session: CraftingSessionSummary) => {
    router.push(`/crafting/${session.id}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete crafting session:', err);
      showToast((err as Error)?.message ?? 'Failed to delete session', 'error');
    }
  };

  return (
    <PageContainer size="xl">
      {!user && (
        <div className="mb-4 rounded-lg bg-primary-600/10 border border-primary-600/20 px-4 py-3 text-text-primary text-sm">
          You&apos;re not signed in. Sign in to save crafting sessions to your account.
          <Link
            href="/login?returnTo=/crafting"
            className="ml-2 font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            Sign in
          </Link>
        </div>
      )}
      <PageHeader
        title="Crafting"
        description="Manage crafting sessions. Start a new craft, upgrade equipment, track rolls and successes, and view outcomes."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleUpgradePotency}>
              <Sparkles className="w-4 h-4" />
              Upgrade potency
            </Button>
            <Button variant="outline" onClick={handleUpgradeItem}>
              <ArrowUpCircle className="w-4 h-4" />
              Upgrade item
            </Button>
            <Button onClick={handleStartCrafting}>
              <Plus className="w-4 h-4" />
              Start Crafting
            </Button>
          </div>
        }
      />

      <TabNavigation
        tabs={TABS.map((t) => ({
          ...t,
          count:
            t.id === 'all'
              ? sessions.length
              : t.id === 'in_progress'
                ? inProgressCount
                : completedCount,
        }))}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="mt-6 max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-4 min-w-0">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by item..."
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Loading crafting sessions..." />
        ) : error ? (
          <Alert variant="danger" title="Failed to load crafting sessions">
            {error.message}
          </Alert>
        ) : filteredSessions.length === 0 ? (
          <EmptyState
            icon={<Hammer className="w-10 h-10" />}
            title={
              search || activeTab !== 'all'
                ? 'No sessions match your filters'
                : 'No crafting sessions yet'
            }
            description={
              search || activeTab !== 'all'
                ? 'Try adjusting your search or tab.'
                : 'Start Crafting to begin a new session.'
            }
            action={
              !search && activeTab === 'all'
                ? {
                    label: 'Start Crafting',
                    onClick: handleStartCrafting,
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            {filteredSessions.map((session) => (
              <HubListRow
                key={session.id}
                icon={<Hammer className="w-5 h-5" />}
                iconContainerClassName="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                title={session.itemName}
                badge={STATUS_LABELS[session.status]}
                badgeClassName={STATUS_COLORS[session.status]}
                subtitle={
                  [
                    session.currencyCost > 0 && `${session.currencyCost} currency`,
                    session.updatedAt &&
                      new Date(session.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }),
                  ]
                    .filter(Boolean)
                    .join(' · ')
                }
                onClick={() => handleOpen(session)}
                onDelete={() => setDeleteTarget(session)}
                deleteAriaLabel={`Delete crafting session ${session.itemName}`}
              />
            ))}
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={deleteTarget.itemName}
          itemType="crafting session"
          deleteContext="crafting"
          isDeleting={deleteMutation.isPending}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </PageContainer>
  );
}

