import type { PowerComposition } from '@/lib/calculators/power-composition';
import type { LibraryPower } from '@/types/library';
import type { ListHeaderRowChrome } from './grid-list-row-chrome';

export interface CreatureAbilities {
  strength?: number | undefined;
  vitality?: number | undefined;
  agility?: number | undefined;
  acuity?: number | undefined;
  intelligence?: number | undefined;
  charisma?: number | undefined;
  /** @deprecated Use intelligence - legacy D&D-style */
  intellect?: number | undefined;
  /** @deprecated Use acuity - legacy D&D-style */
  perception?: number | undefined;
  /** @deprecated Use charisma - legacy D&D-style */
  willpower?: number | undefined;
  [key: string]: number | undefined;
}

export interface CreatureDefenses {
  might?: number | undefined;
  fortitude?: number | undefined;
  reflex?: number | undefined;
  discernment?: number | undefined;
  mentalFortitude?: number | undefined;
  resolve?: number | undefined;
  [key: string]: number | undefined;
}

export type CreatureStatBlockArmament = {
  name: string;
  description?: string | undefined;
  type?: string | undefined;
  quantity?: number | undefined;
  damage?: string | undefined;
  range?: string | undefined;
  armorValue?: number | undefined;
  damageReduction?: number | undefined;
  properties?: Array<{
    id?: number | undefined;
    name?: string | undefined;
    op_1_lvl?: number | undefined;
  }>;
  libraryItem?: {
    properties?: Array<{
      id?: number | undefined;
      name?: string | undefined;
      op_1_lvl?: number | undefined;
    }>;
  };
  image_id?: string | null | undefined;
  image_url?: string | null | undefined;
};

export interface CreatureData {
  id: string;
  name: string;
  description?: string | undefined;
  imageUrl?: string | undefined;
  level?: number | undefined;
  type?: string | undefined;
  size?: string | undefined;
  hp?: number | undefined;
  hitPoints?: number | undefined;
  energyPoints?: number | undefined;
  abilities?: CreatureAbilities | undefined;
  defenses?: CreatureDefenses | undefined;
  powerProficiency?: number | undefined;
  martialProficiency?: number | undefined;
  resistances?: string[] | undefined;
  weaknesses?: string[] | undefined;
  immunities?: string[] | undefined;
  conditionImmunities?: string[] | undefined;
  senses?: string[] | undefined;
  movementTypes?: string[] | undefined;
  languages?: string[] | undefined;
  skills?:
    | Array<{
        id?: string | undefined;
        name: string;
        value: number;
        proficient?: boolean | undefined;
        baseSkillId?: string | undefined;
        isSubSkill?: boolean | undefined;
      }>
    | Record<string, number>
    | undefined;
  powers?:
    | Array<{
        id?: string | undefined;
        name: string;
        description?: string | undefined;
        energy?: number | undefined;
        action?: string | undefined;
        actionType?: string | undefined;
        isReaction?: boolean | undefined;
        /** Display string, or the structured mechanic when the library row is missing. */
        area?: string | NonNullable<LibraryPower['area']> | undefined;
        /** Display string, or the structured mechanic when the library row is missing. */
        duration?: string | NonNullable<LibraryPower['duration']> | undefined;
        damage?: string | undefined;
        /** Display string, or the structured mechanic when the library row is missing. */
        range?: string | NonNullable<LibraryPower['range']> | undefined;
        composition?: PowerComposition | undefined;
        innate?: boolean | undefined;
        image_id?: string | null | undefined;
        image_url?: string | null | undefined;
        parts?:
          | Array<
              | string
              | {
                  id?: string | number | undefined;
                  name?: string | undefined;
                  op_1_lvl?: number | undefined;
                  op_2_lvl?: number | undefined;
                  op_3_lvl?: number | undefined;
                  applyDuration?: boolean | undefined;
                }
            >
          | undefined;
        /** Structured mechanics saved with the creature power. Display strings stay on range/area/duration. */
        rangeValue?: LibraryPower['range'] | undefined;
        areaValue?: LibraryPower['area'] | undefined;
        durationValue?: LibraryPower['duration'] | undefined;
        damageValue?: LibraryPower['damage'] | undefined;
      }>
    | undefined;
  techniques?:
    | Array<{
        id?: string | undefined;
        name: string;
        description?: string | undefined;
        energy?: number | undefined;
        action?: string | undefined;
        weapon?: string | undefined;
        tp?: number | undefined;
        damage?: string | undefined;
        image_id?: string | null | undefined;
        image_url?: string | null | undefined;
        parts?:
          | Array<
              | string
              | {
                  id?: string | number | undefined;
                  name?: string | undefined;
                  op_1_lvl?: number | undefined;
                  op_2_lvl?: number | undefined;
                  op_3_lvl?: number | undefined;
                }
            >
          | undefined;
      }>
    | undefined;
  feats?: Array<{ name: string; description?: string | undefined }> | undefined;
  weapons?: CreatureStatBlockArmament[] | undefined;
  armor?: CreatureStatBlockArmament[] | undefined;
  shields?: CreatureStatBlockArmament[] | undefined;
  equipment?: CreatureStatBlockArmament[] | undefined;
  /** Legacy mixed bag. Prefer kind buckets; migrate with resolveCreatureInventoryBuckets. */
  armaments?: CreatureStatBlockArmament[] | undefined;
}

export interface CreatureStatBlockProps {
  creature: CreatureData;
  onEdit?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  onDuplicate?: (() => void) | undefined;
  onAddToLibrary?: (() => void) | undefined;
  rightSlot?: React.ReactNode | undefined;
  /** Pair with ListHeader `rowChrome` when `rightSlot` is conditional (e.g. patch sync). */
  rowChrome?: ListHeaderRowChrome | undefined;
  warningMessage?: string | undefined;
  badges?:
    | Array<{
        label: string;
        color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' | undefined;
      }>
    | undefined;
  showActions?: boolean | undefined;
  expanded?: boolean | undefined;
  compact?: boolean | undefined;
  className?: string | undefined;
}
