import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { UserPower, UserTechnique } from '@/hooks/use-user-library';
import type { PowerPart, TechniquePart } from '@/hooks';
import type { CharacterPower, CharacterTechnique } from '@/types';

type SavedPart = {
  id?: string | number;
  name?: string;
  op_1_lvl?: number;
  op_2_lvl?: number;
  op_3_lvl?: number;
  applyDuration?: boolean;
};

function enrichPowerParts(
  savedParts: SavedPart[],
  powerParts: PowerPart[] | undefined | null
) {
  return savedParts.map((savedPart) => {
    const codexPart = powerParts?.find(
      (rp) =>
        String(rp.id) === String(savedPart.id) ||
        rp.name?.toLowerCase() === savedPart.name?.toLowerCase()
    );
    return {
      id: savedPart.id !== undefined ? String(savedPart.id) : undefined,
      name: savedPart.name || codexPart?.name,
      base_tp: codexPart?.base_tp || 0,
      op_1_lvl: savedPart.op_1_lvl || 0,
      op_1_tp: codexPart?.op_1_tp || 0,
      op_2_lvl: savedPart.op_2_lvl || 0,
      op_2_tp: codexPart?.op_2_tp || 0,
      op_3_lvl: savedPart.op_3_lvl || 0,
      op_3_tp: codexPart?.op_3_tp || 0,
    };
  });
}

function enrichTechniqueParts(
  savedParts: SavedPart[],
  techniqueParts: TechniquePart[] | undefined | null
) {
  return savedParts.map((savedPart) => {
    const codexPart = techniqueParts?.find(
      (rp) =>
        String(rp.id) === String(savedPart.id) ||
        rp.name?.toLowerCase() === savedPart.name?.toLowerCase()
    );
    return {
      id: savedPart.id !== undefined ? String(savedPart.id) : undefined,
      name: savedPart.name || codexPart?.name,
      base_tp: codexPart?.base_tp || 0,
      op_1_lvl: savedPart.op_1_lvl || 0,
      op_1_tp: codexPart?.op_1_tp || 0,
      op_2_lvl: savedPart.op_2_lvl || 0,
      op_2_tp: codexPart?.op_2_tp || 0,
      op_3_lvl: savedPart.op_3_lvl || 0,
      op_3_tp: codexPart?.op_3_tp || 0,
    };
  });
}

/** USM merge-by-source: keep draft rows outside the active filter set; replace in-filter with modal selection. */
export function mergePowerModalSelection(args: {
  draftPowers: CharacterPower[];
  selectedItems: SelectableItem[];
  availablePowerIds: Set<string>;
  userPowers: UserPower[];
  publicPowers: UserPower[];
  powerParts: PowerPart[] | undefined | null;
}): CharacterPower[] {
  const { draftPowers, selectedItems, availablePowerIds, userPowers, publicPowers, powerParts } =
    args;
  const keptFromDraft = draftPowers.filter((p) => !availablePowerIds.has(String(p.id)));
  const fromModal = selectedItems.map((item) => {
    const existing = draftPowers.find((p) => String(p.id) === String(item.id));
    const userPower =
      (item.data as UserPower | undefined) ??
      userPowers.find((p) => String(p.docId ?? p.id) === String(item.id)) ??
      publicPowers.find((p) => String(p.docId ?? p.id) === String(item.id));
    return {
      id: item.id,
      name: item.name,
      description: userPower?.description,
      parts: enrichPowerParts((userPower?.parts || []) as SavedPart[], powerParts),
      image_id: userPower?.image_id ?? null,
      image_url: userPower?.image_url ?? null,
      ...(existing?.innate ? { innate: true } : {}),
    };
  });
  return [...keptFromDraft, ...fromModal] as CharacterPower[];
}

export function mergeEmpoweredPowerModalSelection(args: {
  draftPowers: CharacterPower[];
  selectedItems: SelectableItem[];
  availableEmpoweredIds: Set<string>;
}): CharacterPower[] {
  const { draftPowers, selectedItems, availableEmpoweredIds } = args;
  const keptFromDraft = draftPowers.filter((p) => !availableEmpoweredIds.has(String(p.id)));
  const fromModal = selectedItems.map((item) => {
    const existing = draftPowers.find((p) => String(p.id) === String(item.id));
    const technique = item.data as UserTechnique;
    const raw = technique as unknown as Record<string, unknown>;
    const powerData = (raw.power as Record<string, unknown> | undefined) ?? {};
    const savedParts = (Array.isArray(powerData.parts) ? powerData.parts : []) as SavedPart[];
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      empoweredTechnique: true,
      parts: savedParts.map((part) => ({
        id: part.id !== undefined ? String(part.id) : undefined,
        name: part.name,
        op_1_lvl: part.op_1_lvl,
        op_2_lvl: part.op_2_lvl,
        op_3_lvl: part.op_3_lvl,
        applyDuration: part.applyDuration,
      })),
      image_id: technique.image_id ?? null,
      image_url: technique.image_url ?? null,
      ...(existing?.innate ? { innate: true } : {}),
    };
  });
  return [...keptFromDraft, ...fromModal] as CharacterPower[];
}

export function mergeTechniqueModalSelection(args: {
  draftTechniques: CharacterTechnique[];
  selectedItems: SelectableItem[];
  availableTechniqueIds: Set<string>;
  userTechniques: UserTechnique[];
  publicTechniques: UserTechnique[];
  techniqueParts: TechniquePart[] | undefined | null;
}): CharacterTechnique[] {
  const {
    draftTechniques,
    selectedItems,
    availableTechniqueIds,
    userTechniques,
    publicTechniques,
    techniqueParts,
  } = args;
  const keptFromDraft = draftTechniques.filter((t) => !availableTechniqueIds.has(String(t.id)));
  const fromModal = selectedItems.map((item) => {
    const userTech =
      (item.data as UserTechnique | undefined) ??
      userTechniques.find((t) => String(t.docId ?? t.id) === String(item.id)) ??
      publicTechniques.find((t) => String(t.docId ?? t.id) === String(item.id));
    return {
      id: item.id,
      name: item.name,
      description: userTech?.description,
      parts: enrichTechniqueParts((userTech?.parts || []) as SavedPart[], techniqueParts),
      image_id: userTech?.image_id ?? null,
      image_url: userTech?.image_url ?? null,
    };
  });
  return [...keptFromDraft, ...fromModal] as CharacterTechnique[];
}
