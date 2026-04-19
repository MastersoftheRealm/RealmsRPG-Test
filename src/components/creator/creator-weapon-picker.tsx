'use client';

import { useEffect } from 'react';
import { SourceFilter } from '@/components/shared/filters/source-filter';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';
import { WeaponSelector } from './weapon-selector';
import type { CreatorWeaponOption } from '@/lib/creator-weapon-options';

export interface CreatorWeaponPickerProps {
  librarySource: SourceFilterValue;
  onLibrarySourceChange: (value: SourceFilterValue) => void;
  fullOptions: CreatorWeaponOption[];
  visibleOptions: CreatorWeaponOption[];
  weapon: CreatorWeaponOption;
  onWeaponChange: (weapon: CreatorWeaponOption) => void;
  label?: string;
  ariaLabel?: string;
  badgeEn?: number;
  badgeTp?: number;
  sourceFilterClassName?: string;
}

/**
 * Source toggle (All / Realms Library / My Library) + weapon dropdown for power/technique creators.
 * Parents should compute `fullOptions` / `visibleOptions` with `useCreatorWeaponOptions`.
 */
export function CreatorWeaponPicker({
  librarySource,
  onLibrarySourceChange,
  fullOptions,
  visibleOptions,
  weapon,
  onWeaponChange,
  label = 'Weapon',
  ariaLabel = 'Weapon',
  badgeEn,
  badgeTp,
  sourceFilterClassName,
}: CreatorWeaponPickerProps) {
  useEffect(() => {
    const stillVisible = visibleOptions.some((o) => String(o.id) === String(weapon.id));
    if (!stillVisible) {
      const fallback =
        fullOptions.find((o) => o.weaponLibrary === 'builtin' && String(o.id) === '0') ??
        visibleOptions[0] ??
        fullOptions[0];
      if (fallback) onWeaponChange(fallback);
    }
  }, [fullOptions, librarySource, onWeaponChange, visibleOptions, weapon.id]);

  return (
    <div className="space-y-2">
      <SourceFilter value={librarySource} onChange={onLibrarySourceChange} className={sourceFilterClassName} />
      <WeaponSelector
        label={label}
        value={weapon.id}
        options={visibleOptions}
        onChange={(selectedId) => {
          const selected = fullOptions.find((o) => String(o.id) === selectedId);
          if (selected) onWeaponChange(selected);
        }}
        ariaLabel={ariaLabel}
        badgeEn={badgeEn}
        badgeTp={badgeTp}
      />
    </div>
  );
}
