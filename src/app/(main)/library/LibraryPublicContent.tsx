/**
 * Library Public Content
 * ======================
 * Realms Library lists (Powers, Techniques, Armaments, Creatures) for the Library page.
 * Browse and add to My Library (use as-is or customize). Requires login to add.
 */

'use client';

import { useState } from 'react';
import { Wand2, Swords, Shield, Users } from 'lucide-react';
import {
  ConfirmActionModal,
  OfficialPowerList,
  OfficialTechniqueList,
  OfficialItemList,
  OfficialCreatureList,
} from '@/components/shared';
import { useToast } from '@/components/ui';
import {
  useOfficialLibrary,
  useAddOfficialToLibrary,
  usePowerParts,
  useTechniqueParts,
  useItemProperties,
} from '@/hooks';
import { useAuthStore } from '@/stores/auth-store';

export type LibraryPublicTabId = 'powers' | 'techniques' | 'empowered-techniques' | 'items' | 'creatures';

interface LibraryPublicContentProps {
  activeTab: LibraryPublicTabId;
  onLoginRequired: () => void;
  /** When true, show lists without Add to library (e.g. for /browse when not logged in). */
  readOnly?: boolean;
}

export function LibraryPublicContent({ activeTab, onLoginRequired, readOnly = false }: LibraryPublicContentProps) {
  if (activeTab === 'powers') return <PublicPowersList onLoginRequired={onLoginRequired} readOnly={readOnly} />;
  if (activeTab === 'techniques') return <PublicTechniquesList onLoginRequired={onLoginRequired} readOnly={readOnly} />;
  if (activeTab === 'empowered-techniques') {
    return <PublicTechniquesList onLoginRequired={onLoginRequired} readOnly={readOnly} mode="empowered" />;
  }
  if (activeTab === 'items') return <PublicItemsList onLoginRequired={onLoginRequired} readOnly={readOnly} />;
  if (activeTab === 'creatures') return <PublicCreaturesList onLoginRequired={onLoginRequired} readOnly={readOnly} />;
  return null;
}

function useAddToLibraryFlow(
  readOnly: boolean,
  onLoginRequired: () => void,
  onSuccessMessage = 'Added to My Library. You can use it as-is or edit a copy.'
) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [addConfirm, setAddConfirm] = useState<{ name: string; raw: Record<string, unknown> } | null>(null);

  const openAddConfirm = (name: string, raw: Record<string, unknown>) => {
    if (readOnly || !user) {
      if (!user) onLoginRequired();
      return;
    }
    setAddConfirm({ name, raw });
  };

  const confirmModal = (isPending: boolean, onConfirm: () => void) => (
    <ConfirmActionModal
      isOpen={!readOnly && !!addConfirm}
      onClose={() => setAddConfirm(null)}
      onConfirm={onConfirm}
      title="Add to your library?"
      description={addConfirm ? `Add "${addConfirm.name}" to your library?` : ''}
      confirmLabel="Add"
      loadingLabel="Adding..."
      isLoading={isPending}
      icon="publish"
    />
  );

  const wrapAddSuccess = (mutate: (raw: Record<string, unknown>, opts: { onSuccess: () => void; onError: (e: Error) => void }) => void) => {
    if (!addConfirm) return;
    mutate(addConfirm.raw, {
      onSuccess: () => {
        showToast(onSuccessMessage, 'success');
        setAddConfirm(null);
      },
      onError: (e) => {
        showToast(e?.message ?? 'Failed to add to library', 'error');
      },
    });
  };

  return { openAddConfirm, addConfirm, confirmModal, wrapAddSuccess };
}

function PublicPowersList({ onLoginRequired, readOnly = false }: { onLoginRequired: () => void; readOnly?: boolean }) {
  const { data: items = [], isLoading, error, refetch } = useOfficialLibrary('powers');
  const { data: partsDb = [] } = usePowerParts();
  const addMutation = useAddOfficialToLibrary('powers');
  const { openAddConfirm, confirmModal, wrapAddSuccess } = useAddToLibraryFlow(readOnly, onLoginRequired);

  return (
    <>
      <OfficialPowerList
        items={items as Array<Record<string, unknown>>}
        partsDb={partsDb}
        isLoading={isLoading}
        error={error}
        onRetry={() => { void refetch(); }}
        errorMessage="Failed to load Realms Library powers"
        emptyIcon={<Wand2 className="w-8 h-8" />}
        emptyTitle="No powers yet"
        emptyMessage="Official powers will appear here when added to Realms Library."
        variant="library"
        readOnly={readOnly}
        onAddRequest={(row) => openAddConfirm(row.name, row.raw)}
      />
      {confirmModal(addMutation.isPending, () => wrapAddSuccess(addMutation.mutate))}
    </>
  );
}

function PublicTechniquesList({
  onLoginRequired,
  readOnly = false,
  mode = 'standard',
}: {
  onLoginRequired: () => void;
  readOnly?: boolean;
  mode?: 'standard' | 'empowered';
}) {
  const libraryType = mode === 'empowered' ? 'empowered-techniques' : 'techniques';
  const { data: items = [], isLoading, error, refetch } = useOfficialLibrary(libraryType);
  const { data: partsDb = [] } = useTechniqueParts();
  const addMutation = useAddOfficialToLibrary(libraryType);
  const { openAddConfirm, confirmModal, wrapAddSuccess } = useAddToLibraryFlow(readOnly, onLoginRequired);
  const empowered = mode === 'empowered';

  return (
    <>
      <OfficialTechniqueList
        items={items as Array<Record<string, unknown>>}
        partsDb={partsDb}
        isLoading={isLoading}
        error={error}
        onRetry={() => { void refetch(); }}
        mode={mode}
        errorMessage={`Failed to load Realms Library ${empowered ? 'empowered techniques' : 'techniques'}`}
        emptyIcon={<Swords className="w-8 h-8" />}
        emptyTitle={empowered ? 'No empowered techniques yet' : 'No techniques yet'}
        emptyMessage={
          empowered
            ? 'Official empowered techniques will appear here when added to Realms Library.'
            : 'Official techniques will appear here when added to Realms Library.'
        }
        variant="library"
        readOnly={readOnly}
        onAddRequest={(row) => openAddConfirm(row.name, row.raw)}
      />
      {confirmModal(addMutation.isPending, () => wrapAddSuccess(addMutation.mutate))}
    </>
  );
}

function PublicItemsList({ onLoginRequired, readOnly = false }: { onLoginRequired: () => void; readOnly?: boolean }) {
  const { data: items = [], isLoading, error, refetch } = useOfficialLibrary('items');
  const { data: propertiesDb = [] } = useItemProperties();
  const addMutation = useAddOfficialToLibrary('items');
  const { openAddConfirm, confirmModal, wrapAddSuccess } = useAddToLibraryFlow(readOnly, onLoginRequired);

  return (
    <>
      <OfficialItemList
        items={items as Array<Record<string, unknown>>}
        propertiesDb={propertiesDb}
        isLoading={isLoading}
        error={error}
        onRetry={() => { void refetch(); }}
        errorMessage="Failed to load Realms Library armaments"
        emptyIcon={<Shield className="w-8 h-8" />}
        emptyTitle="No armaments yet"
        emptyMessage="Official armaments will appear here when added to Realms Library."
        variant="library"
        readOnly={readOnly}
        onAddRequest={(row) => openAddConfirm(row.name, row.raw)}
      />
      {confirmModal(addMutation.isPending, () => wrapAddSuccess(addMutation.mutate))}
    </>
  );
}

function PublicCreaturesList({ onLoginRequired, readOnly = false }: { onLoginRequired: () => void; readOnly?: boolean }) {
  const { data: items = [], isLoading, error, refetch } = useOfficialLibrary('creatures');
  const addMutation = useAddOfficialToLibrary('creatures');
  const { openAddConfirm, confirmModal, wrapAddSuccess } = useAddToLibraryFlow(readOnly, onLoginRequired);

  return (
    <>
      <OfficialCreatureList
        items={items as Array<Record<string, unknown>>}
        isLoading={isLoading}
        error={error}
        onRetry={() => { void refetch(); }}
        errorMessage="Failed to load Realms Library creatures"
        emptyIcon={<Users className="w-8 h-8" />}
        emptyTitle="No creatures yet"
        emptyMessage="Official creatures will appear here when added to Realms Library."
        variant="library"
        readOnly={readOnly}
        onAddRequest={(row) => openAddConfirm(row.name, row.raw)}
      />
      {confirmModal(addMutation.isPending, () => wrapAddSuccess(addMutation.mutate))}
    </>
  );
}
