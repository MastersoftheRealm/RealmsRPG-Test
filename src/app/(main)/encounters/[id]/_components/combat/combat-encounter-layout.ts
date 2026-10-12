/**
 * Combat encounter columns (86e3k91a8).
 * Equal `lg:grid-cols-4` put the add-combatant rail at ~195px on a 1024px
 * viewport, so button labels and the Acuity placeholder clipped. One flexible
 * track plus a 16–22rem rail fits those controls from `lg` up.
 */
export const COMBAT_ENCOUNTER_LAYOUT_CLASS =
  'grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:items-stretch';
