import type { SavedPart, SavedProperty, UserItem, UserPower, UserTechnique } from '@/hooks/use-user-library';
import { findByIdOrName } from '@/lib/id-constants';

type PartLike = {
  id?: string | number;
  name?: string;
  op_1_desc?: string | null;
  op_2_desc?: string | null;
  op_3_desc?: string | null;
  op_1_en?: number | null;
  op_2_en?: number | null;
  op_3_en?: number | null;
  op_1_tp?: number | null;
  op_2_tp?: number | null;
  op_3_tp?: number | null;
};

type PropertyLike = {
  id?: string | number;
  name?: string;
  op_1_desc?: string | null;
  op_1_ip?: number | null;
  op_1_tp?: number | null;
  op_1_c?: number | null;
};

export type SyncIssueCode =
  | 'missing_part'
  | 'missing_property'
  | 'missing_option_1'
  | 'missing_option_2'
  | 'missing_option_3'
  | 'definitions_changed'
  | 'never_synced';

export interface SyncIssue {
  code: SyncIssueCode;
  itemName?: string;
  refId?: string;
  refName?: string;
  message: string;
}

export interface SyncResult<T> {
  value: T;
  issues: SyncIssue[];
  hasDrift: boolean;
  changed: boolean;
}

interface SyncOptions {
  dropMissingRefs?: boolean;
}

type SyncMetaCarrier = {
  syncMeta?: {
    dependencyFingerprint?: string;
    syncedAt?: string;
  };
};

function hasValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

function hasPartOption(def: PartLike, option: 1 | 2 | 3): boolean {
  if (option === 1) return hasValue(def.op_1_desc) || hasValue(def.op_1_en) || hasValue(def.op_1_tp);
  if (option === 2) return hasValue(def.op_2_desc) || hasValue(def.op_2_en) || hasValue(def.op_2_tp);
  return hasValue(def.op_3_desc) || hasValue(def.op_3_en) || hasValue(def.op_3_tp);
}

function hasPropertyOption(def: PropertyLike): boolean {
  return hasValue(def.op_1_desc) || hasValue(def.op_1_ip) || hasValue(def.op_1_tp) || hasValue(def.op_1_c);
}

function toRefId(value: unknown): string | undefined {
  if (value == null) return undefined;
  const asString = String(value).trim();
  return asString.length ? asString : undefined;
}

function partDisplayName(part: SavedPart): string {
  return String(part.name ?? part.id ?? 'Unknown part');
}

function propertyDisplayName(property: SavedProperty): string {
  return String(property.name ?? property.id ?? 'Unknown property');
}

function normalizeForFingerprint(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeForFingerprint);
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, normalizeForFingerprint(v)]);
    return Object.fromEntries(entries);
  }
  return value;
}

function stableFingerprint(value: unknown): string {
  return JSON.stringify(normalizeForFingerprint(value));
}

function getStoredFingerprint(item: unknown): string | undefined {
  if (!item || typeof item !== 'object') return undefined;
  const carrier = item as SyncMetaCarrier;
  const fromMeta = carrier.syncMeta?.dependencyFingerprint;
  return typeof fromMeta === 'string' && fromMeta.trim().length > 0 ? fromMeta : undefined;
}

function withSyncMeta<T extends object>(value: T, dependencyFingerprint: string): T & SyncMetaCarrier {
  const now = new Date().toISOString();
  const prev = (value as SyncMetaCarrier).syncMeta ?? {};
  return {
    ...value,
    syncMeta: {
      ...prev,
      dependencyFingerprint,
      syncedAt: now,
    },
  };
}

function buildPowerPartFingerprint(parts: SavedPart[] = [], partsDb: PartLike[] = []): string {
  const refs = parts.map((part) => {
    const def = findByIdOrName(partsDb, { id: part.id, name: part.name });
    return {
      ref: {
        id: part.id ?? null,
        name: part.name ?? null,
        op_1_lvl: part.op_1_lvl ?? 0,
        op_2_lvl: part.op_2_lvl ?? 0,
        op_3_lvl: part.op_3_lvl ?? 0,
        applyDuration: part.applyDuration ?? false,
      },
      def: def
        ? {
            id: def.id ?? null,
            name: def.name ?? null,
            op_1_desc: def.op_1_desc ?? null,
            op_2_desc: def.op_2_desc ?? null,
            op_3_desc: def.op_3_desc ?? null,
            op_1_en: def.op_1_en ?? null,
            op_2_en: def.op_2_en ?? null,
            op_3_en: def.op_3_en ?? null,
            op_1_tp: def.op_1_tp ?? null,
            op_2_tp: def.op_2_tp ?? null,
            op_3_tp: def.op_3_tp ?? null,
          }
        : null,
    };
  });
  return stableFingerprint(refs);
}

function buildItemPropertyFingerprint(properties: SavedProperty[] = [], propertiesDb: PropertyLike[] = []): string {
  const refs = properties.map((property) => {
    const def = findByIdOrName(propertiesDb, { id: property.id, name: property.name });
    return {
      ref: {
        id: property.id ?? null,
        name: property.name ?? null,
        op_1_lvl: property.op_1_lvl ?? 0,
      },
      def: def
        ? {
            id: def.id ?? null,
            name: def.name ?? null,
            op_1_desc: def.op_1_desc ?? null,
            op_1_ip: def.op_1_ip ?? null,
            op_1_tp: def.op_1_tp ?? null,
            op_1_c: def.op_1_c ?? null,
          }
        : null,
    };
  });
  return stableFingerprint(refs);
}

export function syncPowerParts(
  itemName: string,
  parts: SavedPart[] = [],
  partsDb: PartLike[] = [],
  options: SyncOptions = {}
): SyncResult<SavedPart[]> {
  if (!Array.isArray(partsDb) || partsDb.length === 0) {
    return {
      value: [...(parts ?? [])],
      issues: [],
      hasDrift: false,
      changed: false,
    };
  }
  const issues: SyncIssue[] = [];
  const nextParts: SavedPart[] = [];

  for (const part of parts) {
    const def = findByIdOrName(partsDb, { id: part.id, name: part.name });
    const refId = toRefId(part.id);
    const refName = part.name;

    if (!def) {
      issues.push({
        code: 'missing_part',
        itemName,
        refId,
        refName,
        message: `${partDisplayName(part)} no longer exists in current rules.`,
      });
      if (!options.dropMissingRefs) nextParts.push({ ...part });
      continue;
    }

    const next: SavedPart = { ...part };

    if ((part.op_1_lvl ?? 0) > 0 && !hasPartOption(def, 1)) {
      issues.push({
        code: 'missing_option_1',
        itemName,
        refId,
        refName,
        message: `${partDisplayName(part)} option 1 is no longer available and will be ignored.`,
      });
      delete next.op_1_lvl;
    }
    if ((part.op_2_lvl ?? 0) > 0 && !hasPartOption(def, 2)) {
      issues.push({
        code: 'missing_option_2',
        itemName,
        refId,
        refName,
        message: `${partDisplayName(part)} option 2 is no longer available and will be ignored.`,
      });
      delete next.op_2_lvl;
    }
    if ((part.op_3_lvl ?? 0) > 0 && !hasPartOption(def, 3)) {
      issues.push({
        code: 'missing_option_3',
        itemName,
        refId,
        refName,
        message: `${partDisplayName(part)} option 3 is no longer available and will be ignored.`,
      });
      delete next.op_3_lvl;
    }

    nextParts.push(next);
  }

  const before = JSON.stringify(parts ?? []);
  const after = JSON.stringify(nextParts);
  return { value: nextParts, issues, hasDrift: issues.length > 0, changed: before !== after };
}

export function syncTechniqueParts(
  itemName: string,
  parts: SavedPart[] = [],
  partsDb: PartLike[] = [],
  options: SyncOptions = {}
): SyncResult<SavedPart[]> {
  return syncPowerParts(itemName, parts, partsDb, options);
}

export function syncItemProperties(
  itemName: string,
  properties: SavedProperty[] = [],
  propertiesDb: PropertyLike[] = [],
  options: SyncOptions = {}
): SyncResult<SavedProperty[]> {
  if (!Array.isArray(propertiesDb) || propertiesDb.length === 0) {
    return {
      value: [...(properties ?? [])],
      issues: [],
      hasDrift: false,
      changed: false,
    };
  }
  const issues: SyncIssue[] = [];
  const nextProperties: SavedProperty[] = [];

  for (const property of properties) {
    const def = findByIdOrName(propertiesDb, { id: property.id, name: property.name });
    const refId = toRefId(property.id);
    const refName = property.name;

    if (!def) {
      issues.push({
        code: 'missing_property',
        itemName,
        refId,
        refName,
        message: `${propertyDisplayName(property)} no longer exists in current rules.`,
      });
      if (!options.dropMissingRefs) nextProperties.push({ ...property });
      continue;
    }

    const next: SavedProperty = { ...property };
    if ((property.op_1_lvl ?? 0) > 0 && !hasPropertyOption(def)) {
      issues.push({
        code: 'missing_option_1',
        itemName,
        refId,
        refName,
        message: `${propertyDisplayName(property)} option 1 is no longer available and will be ignored.`,
      });
      delete next.op_1_lvl;
    }
    nextProperties.push(next);
  }

  const before = JSON.stringify(properties ?? []);
  const after = JSON.stringify(nextProperties);
  return { value: nextProperties, issues, hasDrift: issues.length > 0, changed: before !== after };
}

export function getPowerSyncResult(power: UserPower, partsDb: PartLike[]): SyncResult<UserPower> {
  const partsResult = syncPowerParts(power.name ?? 'Power', power.parts ?? [], partsDb);
  const currentFingerprint = buildPowerPartFingerprint(power.parts ?? [], partsDb);
  const storedFingerprint = getStoredFingerprint(power);
  const hasRefs = (power.parts?.length ?? 0) > 0;
  const definitionsChanged = hasRefs && !!storedFingerprint && storedFingerprint !== currentFingerprint;
  const neverSynced = hasRefs && !storedFingerprint;
  const extraIssues: SyncIssue[] = [];
  if (definitionsChanged) {
    extraIssues.push({
      code: 'definitions_changed',
      itemName: power.name,
      message: 'Referenced part definitions were updated in the current patch.',
    });
  } else if (neverSynced) {
    extraIssues.push({
      code: 'never_synced',
      itemName: power.name,
      message: 'This item has not been synced to the current patch metadata yet.',
    });
  }
  return {
    value: { ...power, parts: partsResult.value },
    issues: [...partsResult.issues, ...extraIssues],
    hasDrift: partsResult.hasDrift || definitionsChanged || neverSynced,
    changed: partsResult.changed || definitionsChanged || neverSynced,
  };
}

export function getTechniqueSyncResult(technique: UserTechnique, partsDb: PartLike[]): SyncResult<UserTechnique> {
  const partsResult = syncTechniqueParts(technique.name ?? 'Technique', technique.parts ?? [], partsDb);
  const currentFingerprint = buildPowerPartFingerprint(technique.parts ?? [], partsDb);
  const storedFingerprint = getStoredFingerprint(technique);
  const hasRefs = (technique.parts?.length ?? 0) > 0;
  const definitionsChanged = hasRefs && !!storedFingerprint && storedFingerprint !== currentFingerprint;
  const neverSynced = hasRefs && !storedFingerprint;
  const extraIssues: SyncIssue[] = [];
  if (definitionsChanged) {
    extraIssues.push({
      code: 'definitions_changed',
      itemName: technique.name,
      message: 'Referenced part definitions were updated in the current patch.',
    });
  } else if (neverSynced) {
    extraIssues.push({
      code: 'never_synced',
      itemName: technique.name,
      message: 'This item has not been synced to the current patch metadata yet.',
    });
  }
  return {
    value: { ...technique, parts: partsResult.value },
    issues: [...partsResult.issues, ...extraIssues],
    hasDrift: partsResult.hasDrift || definitionsChanged || neverSynced,
    changed: partsResult.changed || definitionsChanged || neverSynced,
  };
}

export function getItemSyncResult(item: UserItem, propertiesDb: PropertyLike[]): SyncResult<UserItem> {
  const propsResult = syncItemProperties(item.name ?? 'Item', item.properties ?? [], propertiesDb);
  const currentFingerprint = buildItemPropertyFingerprint(item.properties ?? [], propertiesDb);
  const storedFingerprint = getStoredFingerprint(item);
  const hasRefs = (item.properties?.length ?? 0) > 0;
  const definitionsChanged = hasRefs && !!storedFingerprint && storedFingerprint !== currentFingerprint;
  const neverSynced = hasRefs && !storedFingerprint;
  const extraIssues: SyncIssue[] = [];
  if (definitionsChanged) {
    extraIssues.push({
      code: 'definitions_changed',
      itemName: item.name,
      message: 'Referenced property definitions were updated in the current patch.',
    });
  } else if (neverSynced) {
    extraIssues.push({
      code: 'never_synced',
      itemName: item.name,
      message: 'This item has not been synced to the current patch metadata yet.',
    });
  }
  return {
    value: { ...item, properties: propsResult.value },
    issues: [...propsResult.issues, ...extraIssues],
    hasDrift: propsResult.hasDrift || definitionsChanged || neverSynced,
    changed: propsResult.changed || definitionsChanged || neverSynced,
  };
}

export function sanitizePowerForSync(power: UserPower, partsDb: PartLike[]): SyncResult<UserPower> {
  const partsResult = syncPowerParts(power.name ?? 'Power', power.parts ?? [], partsDb, { dropMissingRefs: true });
  const currentFingerprint = buildPowerPartFingerprint(partsResult.value, partsDb);
  const storedFingerprint = getStoredFingerprint(power);
  const hasRefs = (power.parts?.length ?? 0) > 0;
  const metaDrift = hasRefs && (!storedFingerprint || storedFingerprint !== currentFingerprint);
  const nextValue = withSyncMeta({ ...power, parts: partsResult.value }, currentFingerprint);
  const changed = JSON.stringify(power) !== JSON.stringify(nextValue);
  return {
    value: nextValue,
    issues: partsResult.issues,
    hasDrift: partsResult.hasDrift || metaDrift,
    changed: partsResult.changed || changed,
  };
}

export function sanitizeTechniqueForSync(technique: UserTechnique, partsDb: PartLike[]): SyncResult<UserTechnique> {
  const partsResult = syncTechniqueParts(technique.name ?? 'Technique', technique.parts ?? [], partsDb, { dropMissingRefs: true });
  const currentFingerprint = buildPowerPartFingerprint(partsResult.value, partsDb);
  const storedFingerprint = getStoredFingerprint(technique);
  const hasRefs = (technique.parts?.length ?? 0) > 0;
  const metaDrift = hasRefs && (!storedFingerprint || storedFingerprint !== currentFingerprint);
  const nextValue = withSyncMeta({ ...technique, parts: partsResult.value }, currentFingerprint);
  const changed = JSON.stringify(technique) !== JSON.stringify(nextValue);
  return {
    value: nextValue,
    issues: partsResult.issues,
    hasDrift: partsResult.hasDrift || metaDrift,
    changed: partsResult.changed || changed,
  };
}

export function sanitizeItemForSync(item: UserItem, propertiesDb: PropertyLike[]): SyncResult<UserItem> {
  const propsResult = syncItemProperties(item.name ?? 'Item', item.properties ?? [], propertiesDb, { dropMissingRefs: true });
  const currentFingerprint = buildItemPropertyFingerprint(propsResult.value, propertiesDb);
  const storedFingerprint = getStoredFingerprint(item);
  const hasRefs = (item.properties?.length ?? 0) > 0;
  const metaDrift = hasRefs && (!storedFingerprint || storedFingerprint !== currentFingerprint);
  const nextValue = withSyncMeta({ ...item, properties: propsResult.value }, currentFingerprint);
  const changed = JSON.stringify(item) !== JSON.stringify(nextValue);
  return {
    value: nextValue,
    issues: propsResult.issues,
    hasDrift: propsResult.hasDrift || metaDrift,
    changed: propsResult.changed || changed,
  };
}

type CreatureLike = {
  id?: string;
  docId?: string;
  name?: string;
  powers?: Array<{
    id?: string;
    name: string;
    parts?: SavedPart[];
  }>;
  techniques?: Array<{
    id?: string;
    name: string;
    parts?: SavedPart[];
  }>;
  armaments?: Array<{
    id?: string;
    name: string;
    properties?: SavedProperty[];
  }>;
};

export function getCreatureSyncResult(
  creature: CreatureLike,
  powerPartsDb: PartLike[],
  techniquePartsDb: PartLike[],
  itemPropertiesDb: PropertyLike[]
): SyncResult<CreatureLike> {
  const issues: SyncIssue[] = [];
  let changed = false;

  const nextPowers = (creature.powers ?? []).map((p) => {
    const r = syncPowerParts(`${creature.name ?? 'Creature'}: ${p.name}`, p.parts ?? [], powerPartsDb);
    if (r.hasDrift) issues.push(...r.issues);
    if (r.changed) changed = true;
    return { ...p, parts: r.value };
  });

  const nextTechniques = (creature.techniques ?? []).map((t) => {
    const r = syncTechniqueParts(`${creature.name ?? 'Creature'}: ${t.name}`, t.parts ?? [], techniquePartsDb);
    if (r.hasDrift) issues.push(...r.issues);
    if (r.changed) changed = true;
    return { ...t, parts: r.value };
  });

  const nextArmaments = (creature.armaments ?? []).map((a) => {
    const r = syncItemProperties(`${creature.name ?? 'Creature'}: ${a.name}`, a.properties ?? [], itemPropertiesDb);
    if (r.hasDrift) issues.push(...r.issues);
    if (r.changed) changed = true;
    return { ...a, properties: r.value };
  });

  const next: CreatureLike = {
    ...creature,
    ...(creature.powers ? { powers: nextPowers } : {}),
    ...(creature.techniques ? { techniques: nextTechniques } : {}),
    ...(creature.armaments ? { armaments: nextArmaments } : {}),
  };
  const currentFingerprint = stableFingerprint({
    powers: nextPowers.map((p) => ({ name: p.name, fp: buildPowerPartFingerprint(p.parts ?? [], powerPartsDb) })),
    techniques: nextTechniques.map((t) => ({ name: t.name, fp: buildPowerPartFingerprint(t.parts ?? [], techniquePartsDb) })),
    armaments: nextArmaments.map((a) => ({ name: a.name, fp: buildItemPropertyFingerprint(a.properties ?? [], itemPropertiesDb) })),
  });
  const storedFingerprint = getStoredFingerprint(creature);
  const hasRefs =
    (creature.powers?.some((p) => (p.parts?.length ?? 0) > 0) ?? false) ||
    (creature.techniques?.some((t) => (t.parts?.length ?? 0) > 0) ?? false) ||
    (creature.armaments?.some((a) => (a.properties?.length ?? 0) > 0) ?? false);
  const definitionsChanged = hasRefs && !!storedFingerprint && storedFingerprint !== currentFingerprint;
  const neverSynced = hasRefs && !storedFingerprint;
  if (definitionsChanged) {
    issues.push({
      code: 'definitions_changed',
      itemName: creature.name,
      message: 'Referenced creature dependency definitions were updated in the current patch.',
    });
  } else if (neverSynced) {
    issues.push({
      code: 'never_synced',
      itemName: creature.name,
      message: 'This creature has not been synced to the current patch metadata yet.',
    });
  }

  return { value: next, issues, hasDrift: issues.length > 0, changed: changed || definitionsChanged || neverSynced };
}

export function sanitizeCreatureForSync(
  creature: CreatureLike,
  powerPartsDb: PartLike[],
  techniquePartsDb: PartLike[],
  itemPropertiesDb: PropertyLike[]
): SyncResult<CreatureLike> {
  const issues: SyncIssue[] = [];
  let changed = false;

  const nextPowers = (creature.powers ?? []).map((p) => {
    const r = syncPowerParts(`${creature.name ?? 'Creature'}: ${p.name}`, p.parts ?? [], powerPartsDb, { dropMissingRefs: true });
    if (r.hasDrift) issues.push(...r.issues);
    if (r.changed) changed = true;
    return { ...p, parts: r.value };
  });

  const nextTechniques = (creature.techniques ?? []).map((t) => {
    const r = syncTechniqueParts(`${creature.name ?? 'Creature'}: ${t.name}`, t.parts ?? [], techniquePartsDb, { dropMissingRefs: true });
    if (r.hasDrift) issues.push(...r.issues);
    if (r.changed) changed = true;
    return { ...t, parts: r.value };
  });

  const nextArmaments = (creature.armaments ?? []).map((a) => {
    const r = syncItemProperties(`${creature.name ?? 'Creature'}: ${a.name}`, a.properties ?? [], itemPropertiesDb, { dropMissingRefs: true });
    if (r.hasDrift) issues.push(...r.issues);
    if (r.changed) changed = true;
    return { ...a, properties: r.value };
  });

  const next: CreatureLike = {
    ...creature,
    ...(creature.powers ? { powers: nextPowers } : {}),
    ...(creature.techniques ? { techniques: nextTechniques } : {}),
    ...(creature.armaments ? { armaments: nextArmaments } : {}),
  };
  const currentFingerprint = stableFingerprint({
    powers: nextPowers.map((p) => ({ name: p.name, fp: buildPowerPartFingerprint(p.parts ?? [], powerPartsDb) })),
    techniques: nextTechniques.map((t) => ({ name: t.name, fp: buildPowerPartFingerprint(t.parts ?? [], techniquePartsDb) })),
    armaments: nextArmaments.map((a) => ({ name: a.name, fp: buildItemPropertyFingerprint(a.properties ?? [], itemPropertiesDb) })),
  });
  const storedFingerprint = getStoredFingerprint(creature);
  const hasRefs =
    (creature.powers?.some((p) => (p.parts?.length ?? 0) > 0) ?? false) ||
    (creature.techniques?.some((t) => (t.parts?.length ?? 0) > 0) ?? false) ||
    (creature.armaments?.some((a) => (a.properties?.length ?? 0) > 0) ?? false);
  const metaDrift = hasRefs && (!storedFingerprint || storedFingerprint !== currentFingerprint);
  const withMeta = withSyncMeta(next as object, currentFingerprint) as CreatureLike;
  const before = JSON.stringify(creature);
  const after = JSON.stringify(withMeta);
  return {
    value: withMeta,
    issues,
    hasDrift: issues.length > 0 || metaDrift,
    changed: changed || before !== after,
  };
}
