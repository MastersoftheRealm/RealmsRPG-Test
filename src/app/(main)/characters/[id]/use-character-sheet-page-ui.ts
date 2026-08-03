/**
 * Character sheet page UI chrome (TASK-666d follow-up)
 * ====================================================
 * Edit mode, modals, tour offer, level-up guide, settings saves.
 */

'use client';

import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { saveCharacter } from '@/services/character-service';
import { cleanForSave } from '@/lib/data-enrichment';
import { type LevelUpGuideContent } from '@/lib/level-up-guide';
import { shouldOfferSheetTour } from '@/lib/onboarding-preferences';
import type { Character, CharacterLibraryTabId, CharacterVisibility } from '@/types';
import type { SpeedDisplayUnit } from '@/lib/utils/number';
import type {
  AddModalType,
  FeatModalType,
  SkillModalType,
} from '@/components/character-sheet/character-sheet-context';

export function useCharacterSheetPageUi({
  id,
  character,
  setCharacter,
  showToast,
  hasUnsavedChanges,
  saveNow,
}: {
  id: string;
  character: Character | null;
  setCharacter: Dispatch<SetStateAction<Character | null>>;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  hasUnsavedChanges: boolean;
  saveNow: () => Promise<void>;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isEditMode, setIsEditMode] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [sheetTourOfferLatched, setSheetTourOfferLatched] = useState(false);
  const [sheetTourActive, setSheetTourActive] = useState(false);
  const [levelUpGuide, setLevelUpGuide] = useState<LevelUpGuideContent | null>(null);
  const [addModalType, setAddModalType] = useState<AddModalType>(null);
  const [libraryActiveTab, setLibraryActiveTab] = useState<CharacterLibraryTabId>('feats');
  const [featModalType, setFeatModalType] = useState<FeatModalType>(null);
  const [skillModalType, setSkillModalType] = useState<SkillModalType>(null);
  const [featToRemove, setFeatToRemove] = useState<{ id: string; name: string } | null>(null);
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [portraitRefreshKey, setPortraitRefreshKey] = useState<number | null>(null);
  const [showEditArchetypeModal, setShowEditArchetypeModalState] = useState(false);
  const [editArchetypeSessionKey, setEditArchetypeSessionKey] = useState(0);
  const setShowEditArchetypeModal = useCallback((open: boolean) => {
    if (open) setEditArchetypeSessionKey((k) => k + 1);
    setShowEditArchetypeModalState(open);
  }, []);
  const [showEditSpeciesModal, setShowEditSpeciesModal] = useState(false);

  const handleToggleEditMode = useCallback(async () => {
    if (isEditMode && hasUnsavedChanges) {
      await saveNow();
    }
    setIsEditMode(!isEditMode);
  }, [isEditMode, hasUnsavedChanges, saveNow]);

  const urlWantsTourOffer = searchParams.get('offerTour') === '1';
  if (urlWantsTourOffer && shouldOfferSheetTour() && !sheetTourOfferLatched) {
    setSheetTourOfferLatched(true);
  }
  const showSheetTourOffer = sheetTourOfferLatched;
  useEffect(() => {
    if (!urlWantsTourOffer) return;
    router.replace(pathname, { scroll: false });
  }, [urlWantsTourOffer, router, pathname]);

  const handleSettingsConfirmVisibility = useCallback(
    async (v: CharacterVisibility) => {
      if (!character) return;
      setCharacter((prev) => (prev ? { ...prev, visibility: v } : null));
      const payload = cleanForSave({ ...character, visibility: v });
      await saveCharacter(id, payload);
      const label = v === 'public' ? 'Public' : v === 'private' ? 'Private' : 'Campaign';
      showToast(`Visibility set to ${label}.`, 'success');
      setShowSettingsModal(false);
    },
    [character, id, showToast, setCharacter],
  );

  const handleSettingsConfirm = useCallback(
    async (updates: {
      visibility?: CharacterVisibility;
      speedDisplayUnit?: SpeedDisplayUnit;
    }) => {
      if (!character) return;
      const next = { ...character, ...updates };
      setCharacter((prev) => (prev ? { ...prev, ...updates } : null));
      const payload = cleanForSave(next);
      await saveCharacter(id, payload);
      if (updates.visibility) {
        const label =
          updates.visibility === 'public'
            ? 'Public'
            : updates.visibility === 'private'
              ? 'Private'
              : 'Campaign';
        showToast(`Visibility set to ${label}.`, 'success');
      }
      if (updates.speedDisplayUnit) {
        const unitLabel =
          updates.speedDisplayUnit === 'feet'
            ? 'feet'
            : updates.speedDisplayUnit === 'meters'
              ? 'meters'
              : 'spaces';
        showToast(`Speed display set to ${unitLabel}.`, 'success');
      }
      setShowSettingsModal(false);
    },
    [character, id, showToast, setCharacter],
  );

  return {
    isEditMode,
    setIsEditMode,
    showLevelUpModal,
    setShowLevelUpModal,
    showRecoveryModal,
    setShowRecoveryModal,
    showSettingsModal,
    setShowSettingsModal,
    showSheetTourOffer,
    setSheetTourOfferLatched,
    sheetTourActive,
    setSheetTourActive,
    levelUpGuide,
    setLevelUpGuide,
    addModalType,
    setAddModalType,
    libraryActiveTab,
    setLibraryActiveTab,
    featModalType,
    setFeatModalType,
    skillModalType,
    setSkillModalType,
    featToRemove,
    setFeatToRemove,
    uploadingPortrait,
    setUploadingPortrait,
    portraitRefreshKey,
    setPortraitRefreshKey,
    showEditArchetypeModal,
    setShowEditArchetypeModal,
    editArchetypeSessionKey,
    showEditSpeciesModal,
    setShowEditSpeciesModal,
    handleToggleEditMode,
    handleSettingsConfirmVisibility,
    handleSettingsConfirm,
  };
}
