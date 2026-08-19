/**
 * Character sheet page UI chrome (TASK-666d follow-up)
 * ====================================================
 * Edit mode, modals, tour offer, level-up guide, settings saves.
 */

'use client';

import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { saveCharacterWithConflictRetry } from '@/services/character-service';
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
  const [isTempModifierMode, setIsTempModifierMode] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [sheetTourOfferLatched, setSheetTourOfferLatched] = useState(false);
  const [sheetTourActive, setSheetTourActive] = useState(false);
  const [sheetTourRestartKey, setSheetTourRestartKey] = useState(0);
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
    if (isEditMode) {
      if (hasUnsavedChanges) await saveNow();
      setIsEditMode(false);
      return;
    }
    if (isTempModifierMode && hasUnsavedChanges) await saveNow();
    setIsTempModifierMode(false);
    setIsEditMode(true);
  }, [isEditMode, isTempModifierMode, hasUnsavedChanges, saveNow]);

  const handleToggleTempModifierMode = useCallback(async () => {
    if (isTempModifierMode) {
      if (hasUnsavedChanges) await saveNow();
      setIsTempModifierMode(false);
      return;
    }
    if (isEditMode && hasUnsavedChanges) await saveNow();
    setIsEditMode(false);
    setIsTempModifierMode(true);
  }, [isEditMode, isTempModifierMode, hasUnsavedChanges, saveNow]);

  /** Level-up spend path — always Edit, never Temp (TASK-782). */
  const enterEditMode = useCallback(() => {
    setIsTempModifierMode(false);
    setIsEditMode(true);
  }, []);

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
      const result = await saveCharacterWithConflictRetry(
        id,
        { visibility: v },
        {
          updatedAt: character.updatedAt,
          mergeOnConflict: (remote) => ({
            dirty: { visibility: v },
            updatedAt: remote.updatedAt,
          }),
        },
      );
      if (result.updatedAt) {
        setCharacter((prev) =>
          prev ? { ...prev, visibility: v, updatedAt: result.updatedAt } : null,
        );
      }
      const label = v === 'public' ? 'Public' : v === 'private' ? 'Private' : 'Campaign';
      showToast(`Visibility set to ${label}.`, 'success');
      setShowSettingsModal(false);
    },
    [character, id, showToast, setCharacter],
  );

  const handleSettingsConfirm = useCallback(
    async (updates: {
      visibility?: CharacterVisibility | undefined;
      speedDisplayUnit?: SpeedDisplayUnit | undefined;
    }) => {
      if (!character) return;
      setCharacter((prev) => (prev ? { ...prev, ...updates } : null));
      const result = await saveCharacterWithConflictRetry(id, updates, {
        updatedAt: character.updatedAt,
        mergeOnConflict: (remote) => ({
          dirty: updates,
          updatedAt: remote.updatedAt,
        }),
      });
      if (result.updatedAt) {
        setCharacter((prev) =>
          prev ? { ...prev, ...updates, updatedAt: result.updatedAt } : null,
        );
      }
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

  const handleRetakeSheetTour = useCallback(() => {
    setSheetTourRestartKey((k) => k + 1);
    setSheetTourActive(true);
  }, []);

  return {
    isEditMode,
    isTempModifierMode,
    enterEditMode,
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
    sheetTourRestartKey,
    handleRetakeSheetTour,
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
    handleToggleTempModifierMode,
    handleSettingsConfirmVisibility,
    handleSettingsConfirm,
  };
}
