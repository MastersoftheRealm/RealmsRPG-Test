export interface CreatureAbilities {
  strength?: number;
  vitality?: number;
  agility?: number;
  acuity?: number;
  intelligence?: number;
  charisma?: number;
  /** @deprecated Use intelligence - legacy D&D-style */
  intellect?: number;
  /** @deprecated Use acuity - legacy D&D-style */
  perception?: number;
  /** @deprecated Use charisma - legacy D&D-style */
  willpower?: number;
  [key: string]: number | undefined;
}

export interface CreatureDefenses {
  might?: number;
  fortitude?: number;
  reflex?: number;
  discernment?: number;
  mentalFortitude?: number;
  resolve?: number;
  [key: string]: number | undefined;
}

export interface CreatureData {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  level?: number;
  type?: string;
  size?: string;
  hp?: number;
  hitPoints?: number;
  energyPoints?: number;
  abilities?: CreatureAbilities;
  defenses?: CreatureDefenses;
  powerProficiency?: number;
  martialProficiency?: number;
  resistances?: string[];
  weaknesses?: string[];
  immunities?: string[];
  conditionImmunities?: string[];
  senses?: string[];
  movementTypes?: string[];
  languages?: string[];
  skills?: Array<{ id?: string; name: string; value: number; proficient?: boolean; baseSkillId?: string; isSubSkill?: boolean }> | Record<string, number>;
  powers?: Array<{
    id?: string;
    name: string;
    description?: string;
    energy?: number;
    action?: string;
    area?: string;
    duration?: string;
    damage?: string;
    range?: string;
    innate?: boolean;
    image_id?: string | null;
    image_url?: string | null;
    parts?: Array<string | { id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number }>;
  }>;
  techniques?: Array<{
    id?: string;
    name: string;
    description?: string;
    energy?: number;
    action?: string;
    weapon?: string;
    tp?: number;
    damage?: string;
    image_id?: string | null;
    image_url?: string | null;
    parts?: Array<string | { id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number }>;
  }>;
  feats?: Array<{ name: string; description?: string }>;
  armaments?: Array<{
    name: string;
    description?: string;
    type?: string;
    damage?: string;
    range?: string;
    armorValue?: number;
    damageReduction?: number;
    properties?: Array<{ id?: number; name?: string; op_1_lvl?: number }>;
    libraryItem?: { properties?: Array<{ id?: number; name?: string; op_1_lvl?: number }> };
    image_id?: string | null;
    image_url?: string | null;
  }>;
}

export interface CreatureStatBlockProps {
  creature: CreatureData;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  rightSlot?: React.ReactNode;
  warningMessage?: string;
  badges?: Array<{ label: string; color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' }>;
  showActions?: boolean;
  expanded?: boolean;
  compact?: boolean;
  className?: string;
}
