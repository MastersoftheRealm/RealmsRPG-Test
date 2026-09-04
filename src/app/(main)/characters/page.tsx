/**
 * Characters List Page
 * ======================
 * Displays account characters, plus browser-local guest sheets (ADR-0026).
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CharacterCard, AddCharacterCard } from '@/components/character';
import { PageContainer, PageHeader, EmptyState, useToast } from '@/components/ui';
import { Alert } from '@/components/ui/alert';
import { DeleteConfirmModal, ErrorDisplay } from '@/components/patterns';
import { useCharacters, useDeleteCharacter, useDuplicateCharacter, useAuth } from '@/hooks';
import { isGuestCharacterId } from '@/lib/guest-character-storage';
import { UserPlus } from 'lucide-react';

export default function CharactersPage() {
  return <CharactersContent />;
}

function CharactersContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, initialized: authInitialized } = useAuth();
  const {
    data: characters = [],
    isLoading,
    error,
    refetch,
  } = useCharacters({
    enabled: authInitialized,
  });
  const deleteCharacter = useDeleteCharacter();
  const duplicateCharacter = useDuplicateCharacter();
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

  // Show skeleton until auth resolves too, so logged-in users don't briefly
  // see the guest empty state before their characters query is enabled.
  if (!authInitialized || isLoading) {
    return (
      <PageContainer size="xl">
        <PageHeader title="Characters" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl bg-surface shadow-md">
              <div className="skeleton aspect-square" />
              <div className="space-y-2 p-4">
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
              </div>
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
          onRetry={() => {
            void refetch();
          }}
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
        <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => (
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
      ) : (
        <EmptyState
          icon={<UserPlus className="h-10 w-10" />}
          title={user ? 'No characters yet' : 'Characters'}
          description={
            user
              ? 'Create your first character to begin your adventure in Realms RPG.'
              : 'Create a character to try the sheet in this browser. Sign in to keep characters on your account.'
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
          deleteContext={isGuestCharacterId(deleteTarget.id) ? 'browser' : 'account'}
          isDeleting={deletingId === deleteTarget.id}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </PageContainer>
  );
}
