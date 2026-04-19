'use client';

import { SectionCostBadge } from '@/components/shared';
import type { CreatorWeaponLibrary } from '@/lib/creator-weapon-options';

export interface WeaponOption {
  id: string | number;
  name: string;
  isUserWeapon?: boolean;
  /** When set, controls optgroup (General / My Library / Realms Library). */
  weaponLibrary?: CreatorWeaponLibrary;
}

interface WeaponSelectorProps {
  label?: string;
  value: string | number;
  options: WeaponOption[];
  onChange: (weaponId: string) => void;
  ariaLabel?: string;
  badgeEn?: number;
  badgeTp?: number;
}

export function WeaponSelector({
  label = 'Weapon',
  value,
  options,
  onChange,
  ariaLabel = 'Weapon',
  badgeEn,
  badgeTp,
}: WeaponSelectorProps) {
  const libraryOf = (option: WeaponOption): CreatorWeaponLibrary => {
    if (option.weaponLibrary) return option.weaponLibrary;
    return option.isUserWeapon ? 'my' : 'builtin';
  };

  const generalOptions = options.filter((option) => libraryOf(option) === 'builtin');
  const myLibraryOptions = options.filter((option) => libraryOf(option) === 'my');
  const realmsLibraryOptions = options.filter((option) => libraryOf(option) === 'official');

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label className="block text-sm font-medium text-text-secondary">{label}</label>
        {(badgeEn !== undefined || badgeTp !== undefined) && (
          <SectionCostBadge en={badgeEn ?? 0} tp={badgeTp ?? 0} />
        )}
      </div>
      <select
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
        aria-label={ariaLabel}
      >
        <optgroup label="General">
          {generalOptions.map((option) => (
            <option key={String(option.id)} value={String(option.id)}>
              {option.name}
            </option>
          ))}
        </optgroup>
        {myLibraryOptions.length > 0 && (
          <optgroup label="My Library">
            {myLibraryOptions.map((option) => (
              <option key={String(option.id)} value={String(option.id)}>
                {option.name}
              </option>
            ))}
          </optgroup>
        )}
        {realmsLibraryOptions.length > 0 && (
          <optgroup label="Realms Library">
            {realmsLibraryOptions.map((option) => (
              <option key={String(option.id)} value={String(option.id)}>
                {option.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
