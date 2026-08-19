'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { ImageUploadModal, RealmsImagePicker, ExpandableImage } from '@/components/patterns';
import type { Character } from '@/types';
import { isPortraitFallbackSrc, withPortraitCacheBust } from '@/lib/portrait';
import { fileFromCroppedBlob } from '@/lib/crop-image';
import { useEffectivePortrait } from '@/hooks/use-effective-portrait';
import { usePortraitFallbackUrl } from '@/hooks/use-portrait-fallback-url';
import { resolveArchetypeDisplayName } from '@/lib/game/archetype-display';
import { calculateXpToLevelUp } from '@/lib/game/formulas';
import { ArchetypePathGuidance } from './archetype-path-identity';

export function SheetHeaderIdentity({
  character,
  isEditMode,
  healthColor,
  onPortraitChange,
  onPortraitUrlChange,
  isUploadingPortrait = false,
  portraitRefreshKey = null,
  onNameChange,
  onExperienceChange,
  onEditArchetype,
  onEditSpecies,
}: {
  character: Character;
  isEditMode: boolean;
  healthColor: 'green' | 'orange' | 'red';
  onPortraitChange?: (file: File) => void | Promise<void>;
  onPortraitUrlChange?: (url: string) => void | Promise<void>;
  isUploadingPortrait?: boolean;
  portraitRefreshKey?: number | null;
  onNameChange?: (name: string) => void;
  onExperienceChange?: (value: number) => void;
  onEditArchetype?: () => void;
  onEditSpecies?: () => void;
}) {
  // State for editing character name
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(character.name || '');

  // State for editing XP
  const [isEditingXP, setIsEditingXP] = useState(false);
  const [xpInput, setXpInput] = useState(String(character.experience ?? 0));

  const xp = character.experience ?? 0;
  const level = character.level || 1;
  const canLevelUp = xp >= calculateXpToLevelUp(level);

  // Handle XP submission
  const handleXPSubmit = () => {
    const value = parseInt(xpInput, 10);
    if (!isNaN(value) && value >= 0 && onExperienceChange) {
      onExperienceChange(value);
    }
    setIsEditingXP(false);
  };

  // Image upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);

  // Handle portrait click - open the upload modal
  const handlePortraitClick = () => {
    if (!isEditMode || !onPortraitChange) return;
    setShowUploadModal(true);
  };

  // Handle cropped image from the modal - await upload so modal stays open until done
  const handleCroppedImage = async (blob: Blob) => {
    if (!onPortraitChange) return;
    const file = fileFromCroppedBlob(blob, 'portrait');
    await onPortraitChange(file);
  };

  const canChangePortrait = Boolean(isEditMode && onPortraitChange);
  const effectivePortrait = useEffectivePortrait(character.portrait);
  const portraitFallbackUrl = usePortraitFallbackUrl();
  const isFallbackPortrait = isPortraitFallbackSrc(effectivePortrait);
  const portraitSrc = withPortraitCacheBust(effectivePortrait, portraitRefreshKey);
  const portraitFrameClass = cn(
    'relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl border-3 bg-image-matte shadow-lg md:h-36 md:w-36',
    healthColor === 'green' && 'border-success-400',
    healthColor === 'orange' && 'border-warning-400',
    healthColor === 'red' && 'border-danger-600',
    canChangePortrait && 'group cursor-pointer',
  );
  const portraitImage = (
    <>
      <Image
        key={`portrait-${character.portrait ?? ''}-${portraitRefreshKey ?? ''}`}
        src={portraitSrc}
        alt=""
        fill
        unoptimized
        priority
        className={cn('object-contain transition-opacity', isUploadingPortrait && 'opacity-50')}
        sizes="(max-width: 768px) 112px, 144px"
        onError={(e) => {
          (e.target as HTMLImageElement).src = portraitFallbackUrl;
        }}
      />
      {/* Upload overlay in edit mode — click opens ImageUploadModal, not ExpandableImage */}
      {canChangePortrait && (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent transition-colors group-hover:bg-text-primary/40">
          <Camera
            className="h-8 w-8 text-text-on-dark opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </div>
      )}
      {isUploadingPortrait && (
        <div className="absolute inset-0 flex items-center justify-center bg-text-primary/30">
          <Spinner size="md" variant="white" />
        </div>
      )}
    </>
  );

  // Handle name editing
  const handleNameSubmit = () => {
    if (nameInput.trim() && nameInput !== character.name && onNameChange) {
      onNameChange(nameInput.trim());
    }
    setIsEditingName(false);
  };

  const normalizedPowerAbility = character.pow_abil?.trim().toLowerCase();
  const normalizedMartialAbility = character.mart_abil?.trim().toLowerCase();
  const showPowerAbility = Boolean(character.pow_abil?.trim());
  const showMartialAbility =
    Boolean(character.mart_abil) && normalizedMartialAbility !== normalizedPowerAbility;

  return (
    <>
      {/* Left: Portrait and Identity */}
      <div className="flex flex-shrink-0 items-center gap-4">
        {/* Portrait — ExpandableImage in play view; edit mode click opens upload */}
        {canChangePortrait ? (
          <div
            role="button"
            tabIndex={0}
            className={portraitFrameClass}
            onClick={handlePortraitClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePortraitClick();
              }
            }}
            title="Click to change portrait"
            aria-label={`Change portrait for ${character.name}`}
          >
            {portraitImage}
          </div>
        ) : (
          <ExpandableImage
            src={portraitSrc}
            alt={character.name}
            disabled={isFallbackPortrait}
            isPlaceholder={isFallbackPortrait}
            className={portraitFrameClass}
          >
            {portraitImage}
          </ExpandableImage>
        )}

        {/* Character Identity - Clean unified format */}
        <div className="flex min-w-0 flex-col justify-center">
          {/* Editable Name - Always available with pencil icon */}
          {isEditingName && onNameChange ? (
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') {
                  setNameInput(character.name || '');
                  setIsEditingName(false);
                }
              }}
              className="rounded-lg border-2 border-primary-outline-border px-2 py-1 text-2xl font-bold text-text-primary focus:ring-2 focus:ring-primary-outline-border md:text-3xl"
              autoFocus
            />
          ) : (
            <h1 className="flex items-center gap-2 truncate text-2xl font-bold text-text-primary md:text-3xl">
              {character.name}
              {onNameChange && isEditMode && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-primary-fg transition-colors hover:scale-110 hover:text-primary-fg-hover"
                  title="Edit name"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </h1>
          )}

          {/* Level and Species - separated */}
          <p className="flex items-center gap-2 text-base text-text-primary">
            Level {character.level} ·{' '}
            <span className="font-medium">
              {character.ancestry?.name || character.species || 'Unknown'}
            </span>
            {onEditSpecies && (
              <button
                onClick={onEditSpecies}
                className="text-primary-fg transition-colors hover:scale-110 hover:text-primary-fg-hover"
                title="Edit species and ancestry"
                aria-label="Edit species and ancestry"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </p>

          {/* Archetype: name and abilities */}
          <div className="text-base text-text-primary">
            <p className="flex flex-wrap items-center gap-2">
              <span>
                {resolveArchetypeDisplayName(character) ||
                  (character.archetype?.type
                    ? character.archetype.type
                        .split('-')
                        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ')
                    : 'No Archetype')}
                {(showPowerAbility || showMartialAbility) && ': '}
                {showPowerAbility && (
                  <span className="text-power-fg capitalize">{character.pow_abil}</span>
                )}
                {showPowerAbility && showMartialAbility && ' / '}
                {showMartialAbility && (
                  <span className="text-martial-fg capitalize">{character.mart_abil}</span>
                )}
              </span>
              {onEditArchetype && (
                <button
                  onClick={onEditArchetype}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-primary-fg transition-colors hover:scale-110 hover:text-primary-fg-hover"
                  title="Edit archetype and ability"
                  aria-label="Edit archetype and ability"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </p>
            <ArchetypePathGuidance character={character} />
          </div>

          {/* XP Display - Always editable with pencil icon */}
          <div className="flex items-center gap-2 text-base text-text-primary">
            {isEditingXP && onExperienceChange ? (
              <div className="flex items-center gap-1">
                <span>XP:</span>
                <input
                  type="number"
                  value={xpInput}
                  onChange={(e) => setXpInput(e.target.value)}
                  onBlur={handleXPSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleXPSubmit();
                    if (e.key === 'Escape') {
                      setXpInput(String(character.experience ?? 0));
                      setIsEditingXP(false);
                    }
                  }}
                  className="w-16 rounded border-2 border-primary-outline-border px-1 py-0 text-base focus:ring-2 focus:ring-primary-outline-border"
                  min={0}
                  autoFocus
                  aria-label="Experience points"
                />
              </div>
            ) : (
              <>
                <span>XP: {character.experience ?? 0}</span>
                {onExperienceChange && (
                  <button
                    onClick={() => {
                      setXpInput(String(character.experience ?? 0));
                      setIsEditingXP(true);
                    }}
                    className="text-primary-fg transition-colors hover:scale-110 hover:text-primary-fg-hover"
                    title="Edit XP"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
            {canLevelUp && (
              <span
                className="animate-pulse text-sm font-medium text-success-fg"
                title="Ready to level up!"
              >
                ⬆ Level up!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Portrait Upload Modal */}
      <ImageUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onConfirm={handleCroppedImage}
        onChooseFromLibrary={onPortraitUrlChange ? () => setShowBankPicker(true) : undefined}
        cropShape="rect"
        aspect={1}
        title="Upload Character Portrait"
      />
      {onPortraitUrlChange && (
        <RealmsImagePicker
          isOpen={showBankPicker}
          onClose={() => setShowBankPicker(false)}
          onSelect={({ image }) => {
            void onPortraitUrlChange(image.publicUrl);
          }}
          categories="portrait"
          allowAdminUpload={false}
          title="Choose Character Portrait"
          description="Pick species or creature art from the Realms Image Library."
        />
      )}
    </>
  );
}
