/**
 * Creature Creator - Load Creature Modal
 */

'use client';

import { X } from 'lucide-react';
import { useUserCreatures } from '@/hooks';
import { IconButton, Modal } from '@/components/ui';
import type { CreatureState } from './creature-creator-types';
import { initialState } from './creature-creator-constants';

export function LoadCreatureModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (creature: CreatureState) => void;
}) {
  const { data: userCreatures = [] } = useUserCreatures();

  const modalHeader = (
    <div className="p-4 border-b flex justify-between items-center">
      <h2 className="text-xl font-bold">Load Creature from Library</h2>
      <IconButton variant="ghost" onClick={onClose} label="Close">
        <X className="w-5 h-5" />
      </IconButton>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      header={modalHeader}
      showCloseButton={false}
      contentClassName="p-4 overflow-y-auto max-h-[60vh]"
      className="max-h-[80vh]"
    >
      {userCreatures.length === 0 ? (
        <p className="text-text-muted text-center py-8">No creatures in your library</p>
      ) : (
        <div className="space-y-2">
          {userCreatures.map(c => (
            <button
              key={c.docId}
              onClick={() => {
                const loadedCreature: CreatureState = {
                  name: c.name || '',
                  level: c.level || 1,
                  type: (c as unknown as CreatureState).type || 'Humanoid',
                  size: (c as unknown as CreatureState).size || 'medium',
                  description: c.description || '',
                  archetypeType: (c as unknown as CreatureState).archetypeType || 'power',
                  abilities: (c as unknown as CreatureState).abilities || initialState.abilities,
                  defenses: (c as unknown as CreatureState).defenses || initialState.defenses,
                  hitPoints: (c as unknown as CreatureState).hitPoints || 0,
                  energyPoints: (c as unknown as CreatureState).energyPoints || 0,
                  powerProficiency: (c as unknown as CreatureState).powerProficiency || 0,
                  martialProficiency: (c as unknown as CreatureState).martialProficiency || 0,
                  enablePowers: (c as unknown as CreatureState).enablePowers ?? ((c as unknown as CreatureState).powers?.length > 0),
                  enableTechniques: (c as unknown as CreatureState).enableTechniques ?? ((c as unknown as CreatureState).techniques?.length > 0),
                  enableArmaments: (c as unknown as CreatureState).enableArmaments ?? ((c as unknown as CreatureState).armaments?.length > 0),
                  resistances: (c as unknown as CreatureState).resistances || [],
                  weaknesses: (c as unknown as CreatureState).weaknesses || [],
                  immunities: (c as unknown as CreatureState).immunities || [],
                  conditionImmunities: (c as unknown as CreatureState).conditionImmunities || [],
                  senses: (c as unknown as CreatureState).senses || [],
                  movementTypes: (c as unknown as CreatureState).movementTypes || [],
                  languages: (c as unknown as CreatureState).languages || [],
                  skills: (c as unknown as CreatureState).skills || [],
                  powers: (c as unknown as CreatureState).powers || [],
                  techniques: (c as unknown as CreatureState).techniques || [],
                  feats: (c as unknown as CreatureState).feats || [],
                  armaments: (c as unknown as CreatureState).armaments || [],
                };
                onSelect(loadedCreature);
                onClose();
              }}
              className="w-full p-3 text-left bg-surface-alt hover:bg-primary-50 rounded-lg border border-border-light"
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-text-muted">
                Level {c.level} {(c as unknown as CreatureState).type || 'Creature'}
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
