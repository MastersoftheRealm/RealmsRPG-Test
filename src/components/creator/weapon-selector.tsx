'use client';

import { SectionCostBadge } from '@/components/shared';

export interface WeaponOption {
  id: string | number;
  name: string;
  isUserWeapon?: boolean;
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
  const defaultOptions = options.filter((option) => !option.isUserWeapon);
  const userOptions = options.filter((option) => option.isUserWeapon);

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
          {defaultOptions.map((option) => (
            <option key={String(option.id)} value={String(option.id)}>
              {option.name}
            </option>
          ))}
        </optgroup>
        {userOptions.length > 0 && (
          <optgroup label="My Weapons">
            {userOptions.map((option) => (
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
