/**
 * Character sheet — library domain actions (TASK-381 Phase 2)
 * ==========================================================
 * Powers, techniques, inventory (weapons/armor/shields/equipment), currency,
 * and add-modal dispatch. Auto-proficiency apply is injected from the facade.
 */

'use client';

import { useCallback } from 'react';
import { mergeEquipmentIntoInventory } from '@/lib/game/skill-allocation';
import type { Character, CharacterPower, CharacterTechnique, Item } from '@/types';
import type { CharacterSheetStats } from './use-character-sheet-derived';
import type { AddModalType } from './character-sheet-context';
import { matchesSheetEquipmentItem } from './sheet-item-match';

type UseSheetLibraryActionsArgs = {
  character: Character | null;
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  calculatedStats: CharacterSheetStats | null;
  addModalType: AddModalType;
  applyAutoProficiencies: (next: Character, reason: string) => Character | null;
};

export function useSheetLibraryActions({
  character,
  setCharacter,
  calculatedStats,
  addModalType,
  applyAutoProficiencies,
}: UseSheetLibraryActionsArgs) {
  const handleAddPowers = useCallback(
    (powers: CharacterPower[], asInnate = false) => {
      setCharacter((prev) => {
        if (!prev) return prev;
        const toAdd = asInnate ? powers.map((p) => ({ ...p, innate: true })) : powers;
        const candidate: Character = {
          ...prev,
          powers: [...(prev.powers || []), ...toAdd],
        };
        return applyAutoProficiencies(candidate, 'Adding powers');
      });
    },
    [applyAutoProficiencies, setCharacter],
  );

  const handleRemovePower = useCallback(
    (powerId: string | number) => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              powers: (prev.powers || []).filter(
                (p) => p.id !== powerId && String(p.id) !== String(powerId),
              ),
            }
          : null,
      );
    },
    [character, setCharacter],
  );

  const handleTogglePowerInnate = useCallback(
    (powerId: string | number, isInnate: boolean) => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              powers: (prev.powers || []).map((p) =>
                p.id === powerId || String(p.id) === String(powerId)
                  ? { ...p, innate: isInnate }
                  : p,
              ),
            }
          : null,
      );
    },
    [character, setCharacter],
  );

  const handleUsePower = useCallback(
    (_powerId: string | number, energyCost: number) => {
      if (!calculatedStats) return;
      setCharacter((prev) => {
        if (!prev) return null;
        const curEnergy = prev.currentEnergy ?? prev.energy?.current ?? calculatedStats.maxEnergy;
        if (curEnergy < energyCost) return prev;
        return { ...prev, currentEnergy: curEnergy - energyCost };
      });
    },
    [calculatedStats, setCharacter],
  );

  const handleAddTechniques = useCallback(
    (techniques: CharacterTechnique[]) => {
      setCharacter((prev) => {
        if (!prev) return prev;
        const candidate: Character = {
          ...prev,
          techniques: [...(prev.techniques || []), ...techniques],
        };
        return applyAutoProficiencies(candidate, 'Adding techniques');
      });
    },
    [applyAutoProficiencies, setCharacter],
  );

  const handleRemoveTechnique = useCallback(
    (techId: string | number) => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              techniques: (prev.techniques || []).filter(
                (t) => t.id !== techId && String(t.id) !== String(techId),
              ),
            }
          : null,
      );
    },
    [character, setCharacter],
  );

  const handleUseTechnique = useCallback(
    (_techId: string | number, energyCost: number) => {
      if (!calculatedStats) return;
      setCharacter((prev) => {
        if (!prev) return null;
        const curEnergy = prev.currentEnergy ?? prev.energy?.current ?? calculatedStats.maxEnergy;
        if (curEnergy < energyCost) return prev;
        return { ...prev, currentEnergy: curEnergy - energyCost };
      });
    },
    [calculatedStats, setCharacter],
  );

  const handleAddWeapons = useCallback(
    (items: Item[]) => {
      if (!character) return;
      const candidate: Character = {
        ...character,
        equipment: {
          ...character.equipment,
          weapons: [...((character.equipment?.weapons as Item[]) || []), ...items],
        },
      };
      const next = applyAutoProficiencies(candidate, 'Adding weapons');
      if (!next) return;
      setCharacter(next);
    },
    [character, applyAutoProficiencies, setCharacter],
  );

  const handleRemoveWeapon = useCallback(
    (itemId: string | number) => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              equipment: {
                ...prev.equipment,
                weapons: ((prev.equipment?.weapons as Item[]) || []).filter(
                  (w, idx) => !matchesSheetEquipmentItem(w, itemId, idx),
                ),
              },
            }
          : null,
      );
    },
    [character, setCharacter],
  );

  const handleToggleEquipWeapon = useCallback(
    (itemId: string | number) => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              equipment: {
                ...prev.equipment,
                weapons: ((prev.equipment?.weapons as Item[]) || []).map((w, idx) =>
                  matchesSheetEquipmentItem(w, itemId, idx)
                    ? { ...w, equipped: !w.equipped }
                    : w,
                ),
              },
            }
          : null,
      );
    },
    [character, setCharacter],
  );

  const handleAddArmor = useCallback(
    (items: Item[]) => {
      if (!character) return;
      const candidate: Character = {
        ...character,
        equipment: {
          ...character.equipment,
          armor: [...((character.equipment?.armor as Item[]) || []), ...items],
        },
      };
      const next = applyAutoProficiencies(candidate, 'Adding armor');
      if (!next) return;
      setCharacter(next);
    },
    [character, applyAutoProficiencies, setCharacter],
  );

  const handleRemoveArmor = useCallback(
    (itemId: string | number) => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              equipment: {
                ...prev.equipment,
                armor: ((prev.equipment?.armor as Item[]) || []).filter(
                  (a, idx) => !matchesSheetEquipmentItem(a, itemId, idx),
                ),
              },
            }
          : null,
      );
    },
    [character, setCharacter],
  );

  const handleToggleEquipArmor = useCallback(
    (itemId: string | number) => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              equipment: {
                ...prev.equipment,
                armor: ((prev.equipment?.armor as Item[]) || []).map((a, idx) =>
                  matchesSheetEquipmentItem(a, itemId, idx)
                    ? { ...a, equipped: !a.equipped }
                    : a,
                ),
              },
            }
          : null,
      );
    },
    [character, setCharacter],
  );

  const handleAddShields = useCallback(
    (items: Item[]) => {
      if (!character) return;
      const candidate: Character = {
        ...character,
        equipment: {
          ...character.equipment,
          shields: [...((character.equipment?.shields as Item[]) || []), ...items],
        },
      };
      const next = applyAutoProficiencies(candidate, 'Adding shields');
      if (!next) return;
      setCharacter(next);
    },
    [character, applyAutoProficiencies, setCharacter],
  );

  const handleRemoveShield = useCallback(
    (itemId: string | number) => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              equipment: {
                ...prev.equipment,
                shields: ((prev.equipment?.shields as Item[]) || []).filter(
                  (s, idx) => !matchesSheetEquipmentItem(s, itemId, idx),
                ),
              },
            }
          : null,
      );
    },
    [character, setCharacter],
  );

  const handleToggleEquipShield = useCallback(
    (itemId: string | number) => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              equipment: {
                ...prev.equipment,
                shields: ((prev.equipment?.shields as Item[]) || []).map((s, idx) =>
                  matchesSheetEquipmentItem(s, itemId, idx)
                    ? { ...s, equipped: !s.equipped }
                    : s,
                ),
              },
            }
          : null,
      );
    },
    [character, setCharacter],
  );

  const handleAddEquipment = useCallback(
    (items: Item[]) => {
      if (!character) return;
      const currentItems = (character.equipment?.items as Item[]) || [];
      const candidate: Character = {
        ...character,
        equipment: {
          ...character.equipment,
          items: mergeEquipmentIntoInventory(currentItems, items),
        },
      };
      const next = applyAutoProficiencies(candidate, 'Adding equipment');
      if (!next) return;
      setCharacter(next);
    },
    [character, applyAutoProficiencies, setCharacter],
  );

  const handleRemoveEquipment = useCallback(
    (itemId: string | number) => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              equipment: {
                ...prev.equipment,
                items: ((prev.equipment?.items as Item[]) || []).filter(
                  (e, idx) => !matchesSheetEquipmentItem(e, itemId, idx),
                ),
              },
            }
          : null,
      );
    },
    [character, setCharacter],
  );

  const handleEquipmentQuantityChange = useCallback(
    (itemId: string | number, delta: number) => {
      if (!character) return;
      setCharacter((prev) => {
        if (!prev) return null;
        const currentItems = (prev.equipment?.items as Item[]) || [];
        const items = currentItems.flatMap((item, idx) => {
          if (!matchesSheetEquipmentItem(item, itemId, idx)) return [item];
          const newQty = (item.quantity ?? 1) + delta;
          if (newQty < 1) return [];
          return [{ ...item, quantity: newQty }];
        });
        return {
          ...prev,
          equipment: { ...prev.equipment, items },
        };
      });
    },
    [character, setCharacter],
  );

  const handleCurrencyChange = useCallback(
    (value: number) => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              currency: value,
            }
          : null,
      );
    },
    [character, setCharacter],
  );

  const handleModalAdd = useCallback(
    (items: CharacterPower[] | CharacterTechnique[] | Item[]) => {
      if (!addModalType) return;

      switch (addModalType) {
        case 'power':
          handleAddPowers(items as CharacterPower[]);
          break;
        case 'innate-power':
          handleAddPowers(items as CharacterPower[], true);
          break;
        case 'technique':
          handleAddTechniques(items as CharacterTechnique[]);
          break;
        case 'weapon':
          handleAddWeapons(items as Item[]);
          break;
        case 'armor':
          handleAddArmor(items as Item[]);
          break;
        case 'shield':
          handleAddShields(items as Item[]);
          break;
        case 'equipment':
          handleAddEquipment(items as Item[]);
          break;
      }
    },
    [
      addModalType,
      handleAddPowers,
      handleAddTechniques,
      handleAddWeapons,
      handleAddArmor,
      handleAddShields,
      handleAddEquipment,
    ],
  );

  return {
    handleRemovePower,
    handleTogglePowerInnate,
    handleUsePower,
    handleRemoveTechnique,
    handleUseTechnique,
    handleRemoveWeapon,
    handleToggleEquipWeapon,
    handleRemoveArmor,
    handleToggleEquipArmor,
    handleRemoveShield,
    handleToggleEquipShield,
    handleRemoveEquipment,
    handleEquipmentQuantityChange,
    handleCurrencyChange,
    handleModalAdd,
  };
}
