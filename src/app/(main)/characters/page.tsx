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
import { useCharacters, useDeleteCharacter } from '@/hooks';

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

  const handleCreateCharacter = () => {
    router.push('/characters/new');
  };

  const handleDeleteCharacter = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteCharacter.mutateAsync(id);
    } catch (err) {
      console.error('Error deleting character:', err);
      alert('Failed to delete character. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Characters</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-gray-200 rounded-lg" />
              <div className="mt-4 h-5 bg-gray-200 rounded w-3/4" />
              <div className="mt-2 h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Characters</h1>
        <div className="text-center py-12">
          <p className="text-red-600">Error loading characters. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Characters</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {characters?.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onDelete={handleDeleteCharacter}
            isDeleting={deletingId === character.id}
          />
        ))}
        
        <AddCharacterCard onClick={handleCreateCharacter} />
      </div>

      {characters?.length === 0 ? (
        <p className="text-center text-gray-500 mt-8">
          You have no saved characters yet. Click &quot;Add Character&quot; to create your first one!
        </p>
      ) : null}
    </div>
  );
}
