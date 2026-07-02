import type { UserItem, UserPower, UserTechnique } from '../use-user-library';
import type { EqItem } from './types';

export function normalizePublicPower(p: Record<string, unknown>): UserPower {
  const id = String(p.id ?? p.docId ?? '');
  return {
    id,
    docId: id,
    name: String(p.name ?? ''),
    description: String(p.description ?? ''),
    parts: (p.parts ?? []) as UserPower['parts'],
    actionType: p.actionType,
    isReaction: !!p.isReaction,
    range: p.range,
    area: p.area,
    duration: p.duration,
    damage: p.damage,
  } as UserPower;
}

export function normalizePublicTechnique(t: Record<string, unknown>): UserTechnique {
  const id = String(t.id ?? t.docId ?? '');
  return {
    id,
    docId: id,
    name: String(t.name ?? ''),
    description: String(t.description ?? ''),
    parts: (t.parts ?? []) as UserTechnique['parts'],
    weapon: t.weapon,
    damage: t.damage,
  } as UserTechnique;
}

export function normalizePublicItem(i: Record<string, unknown>): UserItem | EqItem {
  const id = String(i.id ?? i.docId ?? '');
  return {
    id,
    docId: id,
    name: String(i.name ?? ''),
    description: String(i.description ?? ''),
    type: ((i.type as string) || 'equipment') as UserItem['type'],
    properties: (i.properties ?? []) as UserItem['properties'],
    damage: i.damage,
    armorValue: i.armorValue as number | undefined,
  } as UserItem;
}
