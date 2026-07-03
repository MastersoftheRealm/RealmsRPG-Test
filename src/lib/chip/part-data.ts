/** Part/property chip payload (powers, techniques, items). */
export interface PartData {
  name: string;
  text?: string;
  description?: string;
  tpCost?: number;
  energyCost?: number;
  optionLevels?: {
    opt1?: number;
    opt2?: number;
    opt3?: number;
  };
  category?: string;
  options?: Array<{ label: string; description?: string; level: number }>;
}
