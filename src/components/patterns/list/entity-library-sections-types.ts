import type { ReactNode } from 'react';
import type { ColumnValue, ChipData } from '@/components/patterns/list/grid-list-row';
import type { SortState } from '@/components/patterns/list/list-header';
import type { ListHeaderRowChrome } from '@/components/patterns/list/grid-list-row-chrome';
import type { ListRowThumbnailProps } from '@/components/patterns/list/list-row-thumbnail';
import type { MetadataDetailSection } from '@/lib/chip/list-row-metadata';

/** Optional per-row chrome passed through to GridListRow (character sheet edit/use flows). */
export type EntityRowExtras = {
  columns?: ColumnValue[];
  gridColumns?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  onDelete?: () => void;
  badges?: Array<{ label: string; color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' }>;
  equipped?: boolean;
  innate?: boolean;
  hideInnateBadge?: boolean;
  requirements?: ReactNode;
  partsChips?: ChipData[];
  chips?: ChipData[];
  chipsLabel?: string;
  totalTp?: number;
  columnSpans?: (number | undefined)[];
  detailSections?: MetadataDetailSection[];
  uses?: { current: number; max: number };
  hideUsesInName?: boolean;
  nameContent?: ReactNode;
  /** In-box expanded description after-slot (TASK-783). */
  descriptionAfter?: ReactNode;
  supplementalExpandedContent?: ReactNode;
  /** Art-capable rows: pair with ListHeader `hasThumbnailColumn`. */
  thumbnail?: ListRowThumbnailProps;
};

export type EntityListControls = {
  sortState?: SortState;
  onSort?: (columnKey: string) => void;
  rowChrome?: ListHeaderRowChrome;
  onAdd?: () => void;
  addLabel?: string;
  emptyMessage?: string;
  /** Multi-section character sheet library tabs: session collapse (empty → closed). */
  collapsible?: boolean;
  /**
   * Heading level for the internal SectionHeader. Default `2`.
   * Nested creator lists (e.g. creature Inventory) pass `3`.
   */
  headingLevel?: 2 | 3 | 4;
};

export type EntityPowerRow = {
  id?: string | number;
  name: string;
  description?: string;
  actionType?: string;
  damage?: string | ReactNode;
  area?: string;
  duration?: string;
  energyCost?: number;
  innate?: boolean;
  partsChips?: ChipData[];
  totalTp?: number;
  requirements?: ReactNode;
} & EntityRowExtras;

export type EntityTechniqueRow = {
  id?: string | number;
  name: string;
  description?: string;
  actionType?: string;
  energyCost?: number;
  weaponName?: string;
  tp?: number | string;
  partsChips?: ChipData[];
  totalTp?: number;
} & EntityRowExtras;

export type EntityWeaponRow = {
  id?: string | number;
  name: string;
  description?: string;
  damage?: string;
  range?: string;
  attackBonus?: number;
  chips?: ChipData[];
} & EntityRowExtras;

export type EntityShieldRow = {
  id?: string | number;
  name: string;
  description?: string;
  damage?: string;
  properties?: Array<{ id?: number; name?: string; op_1_lvl?: number }>;
  chips?: ChipData[];
} & EntityRowExtras;

export type EntityArmorRow = {
  id?: string | number;
  name: string;
  description?: string;
  damageReduction?: number;
  armorValue?: number;
  chips?: ChipData[];
} & EntityRowExtras;

export type EntityEquipmentRow = {
  id?: string | number;
  name: string;
  description?: string;
  type?: string;
  quantity?: number;
} & EntityRowExtras;

export type EntityFeatRow = {
  id?: string | number;
  name: string;
  description?: string;
  maxUses?: number;
  currentUses?: number;
  recovery?: string;
} & EntityRowExtras;
