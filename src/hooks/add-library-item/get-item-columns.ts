import type { ColumnValue } from '@/components/shared/grid-list-row';
import type { UserItem, UserPower, UserTechnique } from '../use-user-library';
import { formatDamageDisplay, formatActionTypeForDisplay, formatSavedActionTypeForDisplay } from '@/lib/utils';
import { deriveShieldAmountFromProperties, deriveShieldDamageFromProperties } from '@/lib/calculators';
import type { AddLibraryItemType, EqItem } from './types';

function capitalize(s: string | undefined): string {
  if (!s) return '-';
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getItemColumns(
  item: UserPower | UserTechnique | UserItem | EqItem,
  itemType: AddLibraryItemType,
  techniqueDisplay?: { energy: number; weaponName: string; tp: number; actionType: string }
): ColumnValue[] {
  if (itemType === 'power') {
    const power = item as UserPower;
    const damageStr = power.damage?.length ? power.damage.map((d) => capitalize(d.type)).join(', ') : '-';
    const areaStr = power.area?.type ? capitalize(power.area.type) : '-';
    return [
      { key: 'Action', value: formatSavedActionTypeForDisplay(power.actionType, power.isReaction), align: 'center' as const },
      { key: 'Damage', value: damageStr, align: 'center' as const },
      { key: 'Area', value: areaStr, align: 'center' as const },
    ];
  }
  if (itemType === 'technique' && techniqueDisplay) {
    return [
      { key: 'Action', value: techniqueDisplay.actionType || '-', align: 'center' as const },
      { key: 'Energy', value: String(techniqueDisplay.energy), align: 'center' as const },
      { key: 'Weapon', value: techniqueDisplay.weaponName || '-', align: 'center' as const },
      { key: 'Training Pts', value: String(techniqueDisplay.tp), align: 'center' as const },
    ];
  }
  if (itemType === 'technique') {
    const technique = item as UserTechnique;
    return [
      { key: 'Action', value: formatActionTypeForDisplay(technique.actionType ?? ''), align: 'center' as const },
      { key: 'Weapon', value: technique.weapon?.name || '-', align: 'center' as const },
      { key: 'Training Pts', value: '-', align: 'center' as const },
    ];
  }
  if (itemType === 'weapon') {
    const weapon = item as UserItem;
    return weapon.damage ? [{ key: 'Damage', value: formatDamageDisplay(weapon.damage), highlight: true }] : [];
  }
  if (itemType === 'armor') {
    const armor = item as UserItem;
    return armor.armorValue ? [{ key: 'Armor', value: `+${armor.armorValue}`, highlight: true }] : [];
  }
  if (itemType === 'shield') {
    const shield = item as UserItem;
    const props = (shield.properties || []) as Array<{ id?: number; name?: string; op_1_lvl?: number }>;
    const block = deriveShieldAmountFromProperties(props);
    const dmg = deriveShieldDamageFromProperties(props) ?? (shield.damage ? formatDamageDisplay(shield.damage) : null);
    const cols: ColumnValue[] = [];
    if (block !== '-') cols.push({ key: 'Block', value: block, highlight: true });
    if (dmg) cols.push({ key: 'Damage', value: dmg, highlight: true });
    return cols;
  }
  return [];
}
