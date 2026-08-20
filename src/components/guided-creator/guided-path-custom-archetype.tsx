/**
 * Guided Path · Layer 3 — custom archetype (type + power/martial abilities).
 * Absorbs Advanced forge UX into the guided shell (REALMS §5.1).
 */

'use client';

import { Card } from '@/components/ui';
import { AbilityPickButton, InfoTippy } from '@/components/patterns';
import { ARCHETYPE_ABILITY_OPTIONS } from '@/lib/game/archetype-edit';
import { ARCHETYPE_CATEGORY_INFO } from '@/lib/constants/copy';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import type { AbilityName, ArchetypeCategory } from '@/types';
import {
  guidedChooseArchetypeTypeHelp,
  guidedMartialPathTypeHelp,
  guidedPoweredMartialPathTypeHelp,
  guidedPowerPathTypeHelp,
  martialAbility,
  powerAbility,
} from '../../../public/tooltip-text';
import { GuidedChoiceCard } from './guided-choice-card';
import { GUIDED_CHOICE_GRID_CLASS, GUIDED_CHOICE_GRID_ITEM_CLASS } from './guided-choice-styles';
import { GuidedSectionTitle } from './guided-section-title';

const stepCopy = GUIDED_CREATOR_COPY.steps.path;

const TYPE_ORDER: ArchetypeCategory[] = ['power', 'powered-martial', 'martial'];

const TYPE_TIP: Record<ArchetypeCategory, string> = {
  power: guidedPowerPathTypeHelp,
  'powered-martial': guidedPoweredMartialPathTypeHelp,
  martial: guidedMartialPathTypeHelp,
};

export interface GuidedPathCustomArchetypeProps {
  selectedType: ArchetypeCategory | null;
  powAbil: AbilityName | null;
  martAbil: AbilityName | null;
  onSelectType: (type: ArchetypeCategory) => void;
  onSelectPowerAbility: (ability: AbilityName) => void;
  onSelectMartialAbility: (ability: AbilityName) => void;
}

export function GuidedPathCustomArchetype({
  selectedType,
  powAbil,
  martAbil,
  onSelectType,
  onSelectPowerAbility,
  onSelectMartialAbility,
}: GuidedPathCustomArchetypeProps) {
  return (
    <div className="space-y-6">
      <div>
        <GuidedSectionTitle
          className="mb-3"
          titleAddon={
            <InfoTippy
              content={guidedChooseArchetypeTypeHelp}
              label="About choosing your archetype type"
            />
          }
        >
          {stepCopy.chooseTypeHeading}
        </GuidedSectionTitle>
        <div className={GUIDED_CHOICE_GRID_CLASS}>
          {TYPE_ORDER.map((type) => {
            const info = ARCHETYPE_CATEGORY_INFO[type];
            return (
              <GuidedChoiceCard
                key={type}
                className={GUIDED_CHOICE_GRID_ITEM_CLASS}
                title={info.title}
                description={info.description}
                selected={selectedType === type}
                onSelect={() => onSelectType(type)}
                titleMeta={<InfoTippy content={TYPE_TIP[type]} label={`About ${info.title}`} />}
              />
            );
          })}
        </div>
      </div>

      {selectedType ? (
        <Card className="border border-border-light bg-surface-alt p-4 shadow-none sm:p-6">
          <GuidedSectionTitle className="mb-4">
            {stepCopy.chooseAbilityHeading[selectedType]}
          </GuidedSectionTitle>

          {selectedType === 'powered-martial' ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center gap-1">
                  <h4 className="text-sm font-medium text-power-fg">
                    {stepCopy.powerAbilityLabel}
                  </h4>
                  <InfoTippy content={powerAbility} label="Power ability help" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ARCHETYPE_ABILITY_OPTIONS.map((ability) => (
                    <AbilityPickButton
                      key={`power-${ability}`}
                      variant="power"
                      ability={ability}
                      selected={powAbil === ability}
                      disabled={martAbil === ability}
                      onPick={() => onSelectPowerAbility(ability)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-1">
                  <h4 className="text-sm font-medium text-martial-fg">
                    {stepCopy.martialAbilityLabel}
                  </h4>
                  <InfoTippy content={martialAbility} label="Martial ability help" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ARCHETYPE_ABILITY_OPTIONS.map((ability) => (
                    <AbilityPickButton
                      key={`martial-${ability}`}
                      variant="martial"
                      ability={ability}
                      selected={martAbil === ability}
                      disabled={powAbil === ability}
                      onPick={() => onSelectMartialAbility(ability)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {ARCHETYPE_ABILITY_OPTIONS.map((ability) => (
                <AbilityPickButton
                  key={ability}
                  variant={selectedType === 'power' ? 'power' : 'martial'}
                  ability={ability}
                  selected={selectedType === 'power' ? powAbil === ability : martAbil === ability}
                  disabled={false}
                  onPick={() =>
                    selectedType === 'power'
                      ? onSelectPowerAbility(ability)
                      : onSelectMartialAbility(ability)
                  }
                />
              ))}
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
