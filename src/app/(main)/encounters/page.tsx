/**
 * Encounters Hub Page
 * ====================
 * List, create, filter, and manage encounters (combat, skill, mixed).
 * Replaces the old Encounter Tracker as the main entry point.
 */

'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Swords,
  Brain,
  Blend,
  Plus,
  Trash2,
  ChevronRight,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProtectedRoute } from '@/components/layout';
import {
  PageContainer,
  PageHeader,
  Button,
  EmptyState,
  LoadingState,
  Alert,
  Modal,
  Input,
  TabNavigation,
  SearchInput,
  useToast,
} from '@/components/ui';
import { DeleteConfirmModal } from '@/components/shared';
import { useEncounters, useCreateEncounter, useDeleteEncounter } from '@/hooks';
import { createDefaultEncounter } from '@/types/encounter';
import type { EncounterType, EncounterStatus, EncounterSummary } from '@/types/encounter';

const TYPE_LABELS: Record<EncounterType, string> = {
  combat: 'Combat',
  skill: 'Skill',
  mixed: 'Mixed',
};

const TYPE_ICONS: Record<EncounterType, React.ReactNode> = {
  combat: <Swords className="w-4 h-4" />,
  skill: <Brain className="w-4 h-4" />,
  mixed: <Blend className="w-4 h-4" />,
};

const TYPE_COLORS: Record<EncounterType, string> = {
  combat: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  skill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  mixed: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
};

const STATUS_COLORS: Record<EncounterStatus, string> = {
  preparing: 'bg-surface-alt text-text-secondary',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-surface-alt text-text-muted',
};

type TabId = 'all' | 'active' | 'completed';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
];

export default function EncountersPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <PageContainer size="xl">
            <LoadingState message="Loading encounters..." />
          </PageContainer>
        }
      >
        <EncountersContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function EncountersContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: encounters = [], isLoading, error } = useEncounters();
  const createEncounter = useCreateEncounter();
  const deleteEncounterMutation = useDeleteEncounter();

  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EncounterType | ''>('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EncounterSummary | null>(null);

  // Filter and sort encounters
  const filteredEncounters = useMemo(() => {
    let result = [...encounters];

    // Tab filter
    if (activeTab === 'active') {
      result = result.filter((e) => e.status === 'active' || e.status === 'paused');
    } else if (activeTab === 'completed') {
      result = result.filter((e) => e.status === 'completed');
    }

    // Type filter
    if (typeFilter) {
      result = result.filter((e) => e.type === typeFilter);
    }

    // Search
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(s) ||
          e.description?.toLowerCase().includes(s)
      );
    }

    return result;
  }, [encounters, activeTab, typeFilter, search]);

  const activeCount = encounters.filter(
    (e) => e.status === 'active' || e.status === 'paused'
  ).length;
  const completedCount = encounters.filter((e) => e.status === 'completed').length;

  const handleCreate = async (name: string, type: EncounterType, description?: string) => {
    try {
      const data = createDefaultEncounter(type, name, description);
      const id = await createEncounter.mutateAsync(data);
      setCreateModalOpen(false);
      const typePath = type;
      router.push(`/encounters/${id}/${typePath}`);
    } catch (err) {
      console.error('Failed to create encounter:', err);
      showToast((err as Error)?.message ?? 'Failed to create encounter', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEncounterMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete encounter:', err);
      showToast((err as Error)?.message ?? 'Failed to delete encounter', 'error');
    }
  };

  const handleOpen = (encounter: EncounterSummary) => {
    router.push(`/encounters/${encounter.id}/${encounter.type}`);
  };

  const getParticipantLabel = (e: EncounterSummary) => {
    if (e.type === 'skill') return `${e.participantCount} participants`;
    if (e.type === 'mixed')
      return `${e.combatantCount} combatants, ${e.participantCount} participants`;
    return `${e.combatantCount} combatants`;
  };

  return (
    <PageContainer size="xl">
      <PageHeader
        title="Encounters"
        description="Create and manage combat, skill, and mixed encounters for your sessions."
        actions={
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Encounter
          </Button>
        }
      />

      <TabNavigation
        tabs={TABS.map((t) => ({
          ...t,
          count:
            t.id === 'all'
              ? encounters.length
              : t.id === 'active'
                ? activeCount
                : completedCount,
        }))}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="mt-6">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search encounters..."
            />
          </div>
          <div className="flex items-center gap-2">
            {(['', 'combat', 'skill', 'mixed'] as const).map((type) => (
              <button
                key={type || 'all-types'}
                onClick={() => setTypeFilter(type as EncounterType | '')}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg font-medium transition-colors',
                  typeFilter === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-alt text-text-secondary hover:bg-surface-alt/80'
                )}
              >
                {type ? TYPE_LABELS[type] : 'All Types'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingState message="Loading encounters..." />
        ) : error ? (
          <Alert variant="danger" title="Failed to load encounters">
            {error.message}
          </Alert>
        ) : filteredEncounters.length === 0 ? (
          <EmptyState
            icon={<Swords className="w-10 h-10" />}
            title={
              search || typeFilter || activeTab !== 'all'
                ? 'No encounters match your filters'
                : 'No encounters yet'
            }
            description={
              search || typeFilter || activeTab !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Create your first encounter to get started.'
            }
            action={
              !search && !typeFilter && activeTab === 'all'
                ? {
                    label: 'Create Encounter',
                    onClick: () => setCreateModalOpen(true),
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            {filteredEncounters.map((encounter) => (
              <EncounterRow
                key={encounter.id}
                encounter={encounter}
                onOpen={() => handleOpen(encounter)}
                onDelete={() => setDeleteTarget(encounter)}
                participantLabel={getParticipantLabel(encounter)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Encounter Modal */}
      {createModalOpen && (
        <CreateEncounterModal
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreate}
          loading={createEncounter.isPending}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          itemName={deleteTarget.name}
          itemType="encounter"
          deleteContext="encounters"
          isDeleting={deleteEncounterMutation.isPending}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </PageContainer>
  );
}

function EncounterRow({
  encounter,
  onOpen,
  onDelete,
  participantLabel,
}: {
  encounter: EncounterSummary;
  onOpen: () => void;
  onDelete: () => void;
  participantLabel: string;
}) {
  const updatedDate = encounter.updatedAt
    ? new Date(encounter.updatedAt as string).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div
      className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border-light hover:border-primary-300 transition-colors cursor-pointer group"
      onClick={onOpen}
    >
      {/* Type icon */}
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0',
          TYPE_COLORS[encounter.type]
        )}
      >
        {TYPE_ICONS[encounter.type]}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-text-primary truncate">{encounter.name}</h3>
          <span
            className={cn(
              'px-2 py-0.5 text-xs rounded-full font-medium',
              STATUS_COLORS[encounter.status]
            )}
          >
            {encounter.status.charAt(0).toUpperCase() + encounter.status.slice(1)}
          </span>
        </div>
        <p className="text-sm text-text-muted mt-0.5">
          {TYPE_LABELS[encounter.type]}
          {participantLabel && ` \u00b7 ${participantLabel}`}
          {encounter.round > 0 && ` \u00b7 Round ${encounter.round}`}
          {updatedDate && ` \u00b7 ${updatedDate}`}
        </p>
        {encounter.description && (
          <p className="text-xs text-text-muted mt-0.5 truncate">{encounter.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
          title="Delete encounter"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <ChevronRight className="w-5 h-5 text-text-muted" />
      </div>
    </div>
  );
}

function CreateEncounterModal({
  onClose,
  onCreate,
  loading,
}: {
  onClose: () => void;
  onCreate: (name: string, type: EncounterType, description?: string) => void;
  loading: boolean;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<EncounterType>('combat');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), type, description.trim() || undefined);
  };

  return (
    <Modal isOpen onClose={onClose} title="Create Encounter">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Goblin Ambush"
          autoFocus
          required
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Encounter Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['combat', 'skill', 'mixed'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors',
                  type === t
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-border-light hover:border-primary-300'
                )}
              >
                <div className={cn('p-2 rounded-lg', TYPE_COLORS[t])}>
                  {TYPE_ICONS[t]}
                </div>
                <span className="text-sm font-medium text-text-primary">
                  {TYPE_LABELS[t]}
                </span>
                <span className="text-xs text-text-muted text-center">
                  {t === 'combat'
                    ? 'Initiative, HP, conditions'
                    : t === 'skill'
                      ? 'Skill rolls, DS, successes'
                      : 'Combat + skill combined'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description..."
        />

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
