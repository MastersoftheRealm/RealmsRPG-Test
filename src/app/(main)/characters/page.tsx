/**
 * Characters List Page
 * ======================
 * Displays user's characters with create/delete functionality.
 * Guests can view the page with an empty state and create a character (unsaved) to try the creator.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CharacterCard, AddCharacterCard } from '@/components/character';
import { PageContainer, PageHeader, EmptyState, useToast } from '@/components/ui';
import { Alert } from '@/components/ui/alert';
import { DeleteConfirmModal, SearchInput, ListHeader, ErrorDisplay } from '@/components/shared';
import { useCharacters, useDeleteCharacter, useDuplicateCharacter, useAuth } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { UserPlus } from 'lucide-react';

export default function CharactersPage() {
  return <CharactersContent />;
}

function CharactersContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, initialized: authInitialized } = useAuth();
  const { data: characters = [], isLoading, error, refetch } = useCharacters({ enabled: !!user });
  const deleteCharacter = useDeleteCharacter();
  const duplicateCharacter = useDuplicateCharacter();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCreateCharacter = () => {
    router.push('/characters/new');
  };

  const handleSignIn = () => {
    router.push('/login?returnTo=/characters');
  };

  const handleDeleteCharacter = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setDeleteError(null);
  };

  const handleDuplicateCharacter = (id: string, name: string) => {
    setDuplicatingId(id);
    duplicateCharacter.mutate(id, {
      onSuccess: (newId) => {
        showToast(`Duplicated "${name}"`, 'success');
        router.push(`/characters/${newId}`);
      },
      onError: (e) => {
        showToast(e?.message ?? 'Failed to duplicate character', 'error');
      },
      onSettled: () => {
        setDuplicatingId(null);
      },
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    setDeleteError(null);
    try {
      await deleteCharacter.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      setDeleteError('Failed to delete character. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCharacters = useMemo(() => {
    let result = characters;

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          (c.archetypeName?.toLowerCase().includes(searchLower) ?? false) ||
          (c.ancestryName?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    return sortItems(result);
  }, [characters, search, sortItems]);

  // Show skeleton until auth resolves too, so logged-in users don't briefly
  // see the guest empty state before their characters query is enabled.
  if (!authInitialized || isLoading) {
    return (
      <PageContainer size="xl">
        <PageHeader title="Characters" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] skeleton rounded-xl" />
              <div className="mt-4 h-5 skeleton rounded w-3/4" />
              <div className="mt-2 h-4 skeleton rounded w-1/2" />
            </div>
          ))}
        </div>
      </PageContainer>
    );
  }

  if (error && user) {
    return (
      <PageContainer size="xl">
        <PageHeader title="Characters" />
        <ErrorDisplay
          message="Error loading characters"
          subMessage="Something went wrong while loading your characters."
          onRetry={() => { void refetch(); }}
        />
      </PageContainer>
    );
  }

  const hasCharacters = characters.length > 0;

  return (
    <PageContainer size="xl">
      <PageHeader title="Characters" />

      {deleteError && (
        <div className="mb-4">
          <Alert variant="danger" title="Delete failed">
            {deleteError}
          </Alert>
        </div>
      )}

      {hasCharacters ? (
        <div className="space-y-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search characters..."
          />
          <ListHeader
            columns={[
              { key: 'name', label: 'NAME' },
              { key: 'level', label: 'LEVEL' },
              { key: 'updatedAt', label: 'UPDATED' },
            ]}
            gridColumns="1fr 0.5fr 0.5fr"
            sortState={sortState}
            onSort={handleSort}
          />
          {filteredCharacters.length === 0 ? (
            <p className="py-12 text-center text-text-secondary">No characters match your search.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredCharacters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onDelete={handleDeleteCharacter}
                  onDuplicate={handleDuplicateCharacter}
                  isDeleting={deletingId === character.id}
                  isDuplicating={duplicatingId === character.id}
                />
              ))}

              <AddCharacterCard onClick={handleCreateCharacter} />
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<UserPlus className="w-10 h-10" />}
          title={user ? 'No characters yet' : 'Characters'}
          description={
            user
              ? 'Create your first character to begin your adventure in Realms RPG.'
              : 'Create a character to try the creator. Sign in to save characters to your account.'
          }
          action={{
            label: 'Create Character',
            onClick: handleCreateCharacter,
          }}
          secondaryAction={
            !user
              ? {
                  label: 'Sign in',
                  onClick: handleSignIn,
                }
              : undefined
          }
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={deleteTarget.name}
          itemType="character"
          deleteContext="account"
          isDeleting={deletingId === deleteTarget.id}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </PageContainer>
  );
}
