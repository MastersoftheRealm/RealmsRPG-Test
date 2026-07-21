'use client';

import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { PartsPropertiesHelpKey } from '@/lib/chip/list-row-metadata';
import {
  partsProficienciesGenericHelp,
  partsProficienciesPowerHelp,
  partsProficienciesTechniqueHelp,
  propertiesProficienciesArmorHelp,
  propertiesProficienciesItemHelp,
  propertiesProficienciesShieldHelp,
  propertiesProficienciesWeaponHelp,
} from '../../../public/tooltip-text';
import { InfoTippy } from './info-tippy';

export function partsPropertiesHelpContent(key: PartsPropertiesHelpKey): ReactNode {
  switch (key) {
    case 'power-parts':
      return partsProficienciesPowerHelp;
    case 'technique-parts':
      return partsProficienciesTechniqueHelp;
    case 'parts':
      return partsProficienciesGenericHelp;
    case 'weapon-properties':
      return propertiesProficienciesWeaponHelp;
    case 'armor-properties':
      return propertiesProficienciesArmorHelp;
    case 'shield-properties':
      return propertiesProficienciesShieldHelp;
    case 'item-properties':
    case 'properties':
      return propertiesProficienciesItemHelp;
    default:
      return partsProficienciesGenericHelp;
  }
}

export const DETAIL_SECTION_LABEL_CLASS =
  'text-xs font-semibold text-text-muted dark:text-text-secondary uppercase tracking-wider';

/** Shared label + optional collapse chevron + InfoTippy for expanded detail sections (TASK-583). */
export function DetailSectionLabel({
  label,
  collapsible,
  open,
  onToggle,
  helpContent,
}: {
  label: string;
  collapsible: boolean;
  open: boolean;
  onToggle: () => void;
  helpContent: ReactNode | null;
}) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {collapsible ? (
        <h3 className={cn(DETAIL_SECTION_LABEL_CLASS, 'm-0')}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="inline-flex items-center gap-1.5 text-left hover:text-text-primary transition-colors [@media(pointer:coarse)]:min-h-[44px]"
            aria-expanded={open}
            aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
          >
            <span>{label}</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 shrink-0 transition-transform duration-base ease-standard',
                open && 'rotate-180'
              )}
              aria-hidden
            />
          </button>
        </h3>
      ) : (
        <h3 className={DETAIL_SECTION_LABEL_CLASS}>{label}</h3>
      )}
      {helpContent ? (
        <span className="inline-flex shrink-0" onClick={(e) => e.stopPropagation()}>
          <InfoTippy content={helpContent} label={`${label} help`} size="inline" />
        </span>
      ) : null}
    </div>
  );
}
