import type { ReactNode } from 'react';
import type { ColumnValue, ChipData } from '@/components/patterns/list/grid-list-row';
import type { SortState } from '@/components/patterns/list/list-header';
import type { ListHeaderRowChrome } from '@/components/patterns/list/grid-list-row-chrome';
import type { ListRowThumbnailProps } from '@/components/patterns/list/list-row-thumbnail';
import type { MetadataDetailSection } from '@/lib/chip/list-row-metadata';
import type { AllowUndefinedOptionals } from '@/lib/utils/exact-optional';

/** Optional per-row chrome passed through to GridListRow (character sheet edit/use flows). */
type EntityRowExtrasFields = {
  columns?: ColumnValue[] | undefined;
  gridColumns?: string | undefined;
  leftSlot?: ReactNode | undefined;
  rightSlot?: ReactNode | undefined;
  onDelete?: (() => void) | undefined;
  badges?:
    | Array<{
        label: string;
        color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' | undefined;
      }>
    | undefined;
  equipped?: boolean | undefined;
  innate?: boolean | undefined;
  hideInnateBadge?: boolean | undefined;
  requirements?: ReactNode | undefined;
  partsChips?: ChipData[] | undefined;
  chips?: ChipData[] | undefined;
  chipsLabel?: string | undefined;
  totalTp?: number | undefined;
  columnSpans?: (number | undefined)[] | undefined;
  detailSections?: MetadataDetailSection[] | undefined;
  uses?: { current: number; max: number } | undefined;
  hideUsesInName?: boolean | undefined;
  nameContent?: ReactNode | undefined;
  /** In-box expanded description after-slot (TASK-783). */
  descriptionAfter?: ReactNode | undefined;
  supplementalExpandedContent?: ReactNode | undefined;
  /** Art-capable rows: pair with ListHeader `hasThumbnailColumn`. */
  thumbnail?: ListRowThumbnailProps | undefined;
};

export type EntityRowExtras = AllowUndefinedOptionals<EntityRowExtrasFields>;

type EntityListControlsFields = {
  sortState?: SortState | undefined;
  onSort?: ((columnKey: string) => void) | undefined;
  rowChrome?: ListHeaderRowChrome | undefined;
  onAdd?: (() => void) | undefined;
  addLabel?: string | undefined;
  emptyMessage?: string | undefined;
  /** Multi-section character sheet library tabs: session collapse (empty → closed). */
  collapsible?: boolean | undefined;
  /**
   * Heading level for the internal SectionHeader. Default `2`.
   * Nested creator lists (e.g. creature Inventory) pass `3`.
   */
  headingLevel?: 2 | 3 | 4 | undefined;
};

export type EntityListControls = AllowUndefinedOptionals<EntityListControlsFields>;

type EntityPowerRowFields = {
  id?: string | number | undefined;
  name: string;
  description?: string | undefined;
  actionType?: string | undefined;
  damage?: string | ReactNode | undefined;
  area?: string | undefined;
  duration?: string | undefined;
  energyCost?: number | undefined;
  innate?: boolean | undefined;
  partsChips?: ChipData[] | undefined;
  totalTp?: number | undefined;
  requirements?: ReactNode | undefined;
} & EntityRowExtras;

export type EntityPowerRow = AllowUndefinedOptionals<EntityPowerRowFields>;

type EntityTechniqueRowFields = {
  id?: string | number | undefined;
  name: string;
  description?: string | undefined;
  actionType?: string | undefined;
  energyCost?: number | undefined;
  weaponName?: string | undefined;
  tp?: number | string | undefined;
  partsChips?: ChipData[] | undefined;
  totalTp?: number | undefined;
} & EntityRowExtras;

export type EntityTechniqueRow = AllowUndefinedOptionals<EntityTechniqueRowFields>;

type EntityWeaponRowFields = {
  id?: string | number | undefined;
  name: string;
  description?: string | undefined;
  damage?: string | undefined;
  range?: string | undefined;
  attackBonus?: number | undefined;
  chips?: ChipData[] | undefined;
} & EntityRowExtras;

export type EntityWeaponRow = AllowUndefinedOptionals<EntityWeaponRowFields>;

type EntityShieldRowFields = {
  id?: string | number | undefined;
  name: string;
  description?: string | undefined;
  damage?: string | undefined;
  properties?:
    | Array<{
        id?: number | undefined;
        name?: string | undefined;
        op_1_lvl?: number | undefined;
      }>
    | undefined;
  chips?: ChipData[] | undefined;
} & EntityRowExtras;

export type EntityShieldRow = AllowUndefinedOptionals<EntityShieldRowFields>;

type EntityArmorRowFields = {
  id?: string | number | undefined;
  name: string;
  description?: string | undefined;
  damageReduction?: number | undefined;
  armorValue?: number | undefined;
  chips?: ChipData[] | undefined;
} & EntityRowExtras;

export type EntityArmorRow = AllowUndefinedOptionals<EntityArmorRowFields>;

type EntityEquipmentRowFields = {
  id?: string | number | undefined;
  name: string;
  description?: string | undefined;
  type?: string | undefined;
  quantity?: number | undefined;
} & EntityRowExtras;

export type EntityEquipmentRow = AllowUndefinedOptionals<EntityEquipmentRowFields>;

type EntityFeatRowFields = {
  id?: string | number | undefined;
  name: string;
  description?: string | undefined;
  maxUses?: number | undefined;
  currentUses?: number | undefined;
  recovery?: string | undefined;
} & EntityRowExtras;

export type EntityFeatRow = AllowUndefinedOptionals<EntityFeatRowFields>;
