import { PART_IDS } from './id-constants';

type SavedPartLike = {
  id?: string | number;
  name?: string;
  op_1_lvl?: number;
};

type SavedEmpoweredPowerLike = {
  addWeaponPowerPart?: SavedPartLike | null;
  autoMechanics?: SavedPartLike[];
  parts?: SavedPartLike[];
};

const normalizeName = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export function shouldPersistCreatorWeaponId(args: {
  weaponId: string | number;
  allowNoAttack?: boolean;
}): boolean {
  const id = String(args.weaponId);
  if (id === '0') return false;
  if (!args.allowNoAttack && id === 'no-attack') return false;
  return true;
}

export function inferTechniqueWeaponTpFromSavedParts(savedParts: SavedPartLike[]): number {
  const addWeaponPart = savedParts.find(
    (part) =>
      String(part.id) === String(PART_IDS.ADD_WEAPON_ATTACK) ||
      normalizeName(part.name) === 'add weapon attack'
  );
  return addWeaponPart ? Number(addWeaponPart.op_1_lvl || 0) + 1 : 0;
}

export function inferEmpoweredWeaponTpFromPowerPayload(power: SavedEmpoweredPowerLike | undefined): number {
  if (!power) return 0;
  const candidates: SavedPartLike[] = [
    ...(power.addWeaponPowerPart ? [power.addWeaponPowerPart] : []),
    ...(power.autoMechanics || []),
    ...(power.parts || []),
  ];
  const addWeaponPart = candidates.find(
    (part) =>
      String(part.id) === String(PART_IDS.ADD_WEAPON_TO_POWER) ||
      normalizeName(part.name) === 'add weapon to power'
  );
  return addWeaponPart ? Number(addWeaponPart.op_1_lvl || 0) + 1 : 0;
}
