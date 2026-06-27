/** Option row for part/property chips (level > 0) with optional description */
export interface ChipOptionData {
  label: string;
  description?: string;
  level: number;
}

export interface ChipData {
  /** Chip label/name */
  name: string;
  /** Description (shown when chip is expanded) */
  description?: string;
  /** Cost value (TP, IP, etc.) */
  cost?: number;
  /** Cost label (default: 'TP') */
  costLabel?: string;
  /** Optional level indicator */
  level?: number;
  /** Chip category for styling */
  category?: 'default' | 'cost' | 'tag' | 'warning' | 'success' | 'archetype' | 'skill';
  /** Options with level > 0 (shown below description in expanded chip, collapsible) */
  options?: ChipOptionData[];
}
