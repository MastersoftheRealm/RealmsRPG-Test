/**
 * Library Public Content
 * ======================
 * Realms Library lists (Powers, Techniques, Armaments, Creatures) for the Library page.
 * Browse and add to My Library (use as-is or customize). Requires login to add.
 */

'use client';

import { useState } from 'react';
import { Wand2, Swords, Shield, Shirt, Sword, Users } from 'lucide-react';
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
import { getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { LibraryCreature, LibraryItem, LibraryPower, LibraryTechnique } from '@/types/library';
import type { ArmamentLibraryKind } from '@/lib/library/armament-library-labels';

type AddableOfficialItem = LibraryPower | LibraryTechnique | LibraryItem | LibraryCreature;

export type LibraryPublicTabId =
  | 'powers'
  | 'techniques'
  | 'empowered-techniques'
  | 'weapons'
  | 'armor'
  | 'shields'
  | 'creatures';

interface LibraryPublicContentProps {
  activeTab: LibraryPublicTabId;
  onLoginRequired: () => void;
  /** When true, show lists without Add to library (e.g. for /browse when not logged in). */
  readOnly?: boolean;
}

export function LibraryPublicContent({
  activeTab,
  onLoginRequired,
  readOnly = false,
}: LibraryPublicContentProps) {
  if (activeTab === 'powers')
    return <PublicPowersList onLoginRequired={onLoginRequired} readOnly={readOnly} />;
  if (activeTab === 'techniques')
    return <PublicTechniquesList onLoginRequired={onLoginRequired} readOnly={readOnly} />;
  if (activeTab === 'empowered-techniques') {
    return (
      <PublicTechniquesList
        onLoginRequired={onLoginRequired}
        readOnly={readOnly}
        mode="empowered"
      />
    );
  }
  if (activeTab === 'weapons') {
    return (
      <PublicItemsList
        armamentKind="weapon"
        onLoginRequired={onLoginRequired}
        readOnly={readOnly}
      />
    );
  }
  if (activeTab === 'armor') {
    return (
      <PublicItemsList armamentKind="armor" onLoginRequired={onLoginRequired} readOnly={readOnly} />
    );
  }
  if (activeTab === 'shields') {
    return (
      <PublicItemsList
        armamentKind="shield"
        onLoginRequired={onLoginRequired}
        readOnly={readOnly}
      />
    );
  }
  if (activeTab === 'creatures')
    return <PublicCreaturesList onLoginRequired={onLoginRequired} readOnly={readOnly} />;
  return null;
}

function useAddToLibraryFlow<T extends AddableOfficialItem>(
  readOnly: boolean,
  onLoginRequired: () => void,
  onSuccessMessage = 'Added to My Library. You can use it as-is or edit a copy.',
) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [addConfirm, setAddConfirm] = useState<{ name: string; raw: T } | null>(null);

  const openAddConfirm = (name: string, raw: T) => {
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

  const wrapAddSuccess = (
    mutate: (raw: T, opts: { onSuccess: () => void; onError: (e: Error) => void }) => void,
  ) => {
    if (!addConfirm) return;
    mutate(addConfirm.raw, {
      onSuccess: () => {
        showToast(onSuccessMessage, 'success');
        setAddConfirm(null);
      },
      onError: (e) => {
        showToast(getErrorMessage(e, 'Failed to add to library'), 'error');
      },
    });
  };

  return { openAddConfirm, addConfirm, confirmModal, wrapAddSuccess };
}

function PublicPowersList({
  onLoginRequired,
  readOnly = false,
}: {
  onLoginRequired: () => void;
  readOnly?: boolean;
}) {
  const { data: items = [], isLoading, error, refetch } = useOfficialLibrary('powers');
  const { data: partsDb = [] } = usePowerParts();
  const addMutation = useAddOfficialToLibrary('powers');
  const { openAddConfirm, confirmModal, wrapAddSuccess } = useAddToLibraryFlow<LibraryPower>(
    readOnly,
    onLoginRequired,
  );

  return (
    <>
      <OfficialPowerList
        items={items}
        partsDb={partsDb}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        errorMessage="Failed to load Realms Library powers"
        emptyIcon={<Wand2 className="h-8 w-8" />}
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
  const { data: powerPartsDb = [] } = usePowerParts({ enabled: mode === 'empowered' });
  const addMutation = useAddOfficialToLibrary(libraryType);
  const { openAddConfirm, confirmModal, wrapAddSuccess } = useAddToLibraryFlow<LibraryTechnique>(
    readOnly,
    onLoginRequired,
  );
  const empowered = mode === 'empowered';

  return (
    <>
      <OfficialTechniqueList
        items={items}
        partsDb={partsDb}
        powerPartsDb={powerPartsDb}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        mode={mode}
        errorMessage={`Failed to load Realms Library ${empowered ? 'empowered techniques' : 'techniques'}`}
        emptyIcon={<Swords className="h-8 w-8" />}
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

const ARMAMENT_EMPTY_ICONS: Record<ArmamentLibraryKind, React.ReactNode> = {
  weapon: <Sword className="h-8 w-8" />,
  armor: <Shirt className="h-8 w-8" />,
  shield: <Shield className="h-8 w-8" />,
};

function PublicItemsList({
  armamentKind,
  onLoginRequired,
  readOnly = false,
}: {
  armamentKind: ArmamentLibraryKind;
  onLoginRequired: () => void;
  readOnly?: boolean;
}) {
  const { data: items = [], isLoading, error, refetch } = useOfficialLibrary('items');
  const { data: propertiesDb = [] } = useItemProperties();
  const addMutation = useAddOfficialToLibrary('items');
  const { openAddConfirm, confirmModal, wrapAddSuccess } = useAddToLibraryFlow<LibraryItem>(
    readOnly,
    onLoginRequired,
  );

  return (
    <>
      <OfficialItemList
        armamentKind={armamentKind}
        items={items}
        propertiesDb={propertiesDb}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        emptyIcon={ARMAMENT_EMPTY_ICONS[armamentKind]}
        variant="library"
        readOnly={readOnly}
        onAddRequest={(row) => openAddConfirm(row.name, row.raw)}
      />
      {confirmModal(addMutation.isPending, () => wrapAddSuccess(addMutation.mutate))}
    </>
  );
}

function PublicCreaturesList({
  onLoginRequired,
  readOnly = false,
}: {
  onLoginRequired: () => void;
  readOnly?: boolean;
}) {
  const { data: items = [], isLoading, error, refetch } = useOfficialLibrary('creatures');
  const addMutation = useAddOfficialToLibrary('creatures');
  const { openAddConfirm, confirmModal, wrapAddSuccess } = useAddToLibraryFlow<LibraryCreature>(
    readOnly,
    onLoginRequired,
  );

  return (
    <>
      <OfficialCreatureList
        items={items}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        errorMessage="Failed to load Realms Library creatures"
        emptyIcon={<Users className="h-8 w-8" />}
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
