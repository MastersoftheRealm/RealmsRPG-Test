/** Part/property chip payload (powers, techniques, items). */
export interface PartData {
  name: string;
  text?: string | undefined;
  description?: string | undefined;
  tpCost?: number | undefined;
  energyCost?: number | undefined;
  optionLevels?:
    | {
        opt1?: number | undefined;
        opt2?: number | undefined;
        opt3?: number | undefined;
      }
    | undefined;
  category?: string | undefined;
  options?: Array<{ label: string; description?: string | undefined; level: number }> | undefined;
}
