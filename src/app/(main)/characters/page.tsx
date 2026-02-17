/**
 * Characters List Page
 * ======================
 * Displays user's characters with create/delete functionality
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/layout';
import { CharacterCard, AddCharacterCard } from '@/components/character';
import { PageContainer, PageHeader, EmptyState } from '@/components/ui';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { DeleteConfirmModal } from '@/components/shared';
import { useCharacters, useDeleteCharacter } from '@/hooks';
import { UserPlus } from 'lucide-react';

export default function CharactersPage() {
  return (
    <ProtectedRoute>
      <CharactersContent />
    </ProtectedRoute>
  );
}

function CharactersContent() {
  const router = useRouter();
  const { data: characters, isLoading, error } = useCharacters();
  const deleteCharacter = useDeleteCharacter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCreateCharacter = () => {
    router.push('/characters/new');
  };

  const handleDeleteCharacter = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    setDeleteError(null);
    try {
      await deleteCharacter.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Error deleting character:', err);
      setDeleteError('Failed to delete character. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
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

  if (error) {
    return (
      <PageContainer size="xl">
        <PageHeader title="Characters" />
        <Alert variant="danger" title="Error loading characters">
          Something went wrong while loading your characters. Please try again.
        </Alert>
      </PageContainer>
    );
  }

  // Check if we have characters to show
  const hasCharacters = characters && characters.length > 0;

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
        // Grid layout when we have characters
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onDelete={handleDeleteCharacter}
              isDeleting={deletingId === character.id}
            />
          ))}
          
          <AddCharacterCard onClick={handleCreateCharacter} />
        </div>
      ) : (
        // Empty state when no characters
        <EmptyState
          icon={<UserPlus className="w-10 h-10" />}
          title="No characters yet"
          description="Create your first character to begin your adventure in Realms RPG."
          action={{
            label: 'Create Character',
            onClick: handleCreateCharacter,
          }}
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
