/**
 * Character Sheet Body — desktop grid + mobile side-scroll (TASK-348).
 * Single LibrarySection mount shared across breakpoints (TASK-317).
 */

'use client';

import type { AbilityName } from '@/types';
import { calculateSkillPointsForEntity } from '@/lib/game/formulas';
import { AbilitiesSection } from './abilities-section';
import { SkillsSection } from './skills-section';
import { ArchetypeSection } from './archetype-section';
import { LibrarySection } from './library-section';
import { useCharacterSheet } from './character-sheet-context';

function AbilitiesPanel({ className }: { className?: string }) {
  const {
    character,
    isEditMode,
    pointBudgets,
    onAbilityChange,
    onDefenseChange,
  } = useCharacterSheet();

  return (
    <div className={className}>
      <AbilitiesSection
        abilities={character.abilities}
        defenseSkills={character.defenseVals || character.defenseSkills}
        level={character.level || 1}
        archetypeAbility={(character.pow_abil || character.archetype?.ability) as AbilityName}
        martialAbility={character.mart_abil}
        powerAbility={character.pow_abil}
        isEditMode={isEditMode}
        totalAbilityPoints={pointBudgets?.totalAbilityPoints}
        spentAbilityPoints={pointBudgets?.spentAbilityPoints}
        totalSkillPoints={pointBudgets?.totalSkillPoints}
        spentSkillPoints={pointBudgets?.spentSkillPoints}
        onAbilityChange={onAbilityChange}
        onDefenseChange={onDefenseChange}
      />
    </div>
  );
}

function SkillsPanel({ className }: { className?: string }) {
  const {
    character,
    isEditMode,
    skills,
    pointBudgets,
    characterSpeciesSkills,
    onSkillChange,
    onRemoveSkill,
    onAddSkill,
    onAddSubSkill,
  } = useCharacterSheet();

  return (
    <SkillsSection
      skills={skills}
      abilities={character.abilities}
      isEditMode={isEditMode}
      totalSkillPoints={
        pointBudgets?.totalSkillPoints ??
        calculateSkillPointsForEntity(character.level || 1, 'character')
      }
      spentSkillPoints={pointBudgets?.spentSkillPoints}
      speciesSkills={characterSpeciesSkills}
      onSkillChange={onSkillChange}
      onRemoveSkill={onRemoveSkill}
      onAddSkill={onAddSkill}
      onAddSubSkill={onAddSubSkill}
      className={className}
    />
  );
}

function ArchetypePanel({ className }: { className?: string }) {
  const {
    character,
    isEditMode,
    enrichedData,
    setCharacter,
    onMartialProfChange,
    onPowerProfChange,
    onMilestoneChoiceChange,
  } = useCharacterSheet();

  return (
    <ArchetypeSection
      character={character}
      isEditMode={isEditMode}
      onMartialProfChange={onMartialProfChange}
      onPowerProfChange={onPowerProfChange}
      onMilestoneChoiceChange={onMilestoneChoiceChange}
      unarmedProwess={character.unarmedProwess}
      onUnarmedProwessChange={(level) =>
        setCharacter((prev) => (prev ? { ...prev, unarmedProwess: level } : null))
      }
      enrichedWeapons={enrichedData?.weapons}
      enrichedShields={enrichedData?.shields}
      enrichedArmor={enrichedData?.armor}
      className={className}
    />
  );
}

function LibraryPanel({ className }: { className?: string }) {
  const { librarySectionProps, libraryActiveTab, setLibraryActiveTab } = useCharacterSheet();
  if (!librarySectionProps) return null;
  return (
    <LibrarySection
      {...librarySectionProps}
      className={className}
      activeTab={libraryActiveTab}
      onActiveTabChange={setLibraryActiveTab}
    />
  );
}

export function CharacterSheetBody() {
  return (
    <>
      {/* Desktop: Abilities full width */}
      <div className="hidden md:block">
        <AbilitiesPanel />
      </div>

      {/* Shared grid (desktop) + side-scroll panels (mobile); Library mounts once */}
      <div
        className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x -mx-4 px-4 pb-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-1 lg:grid-cols-[1fr_1fr_2fr] md:gap-4 md:items-stretch md:overflow-visible md:snap-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <section
          aria-label="Abilities & Defenses"
          className="md:hidden flex-shrink-0 w-full min-w-full snap-start [scroll-snap-stop:always] overflow-y-auto overflow-x-hidden box-border"
        >
          <AbilitiesPanel />
        </section>

        <section
          aria-label="Skills"
          className="flex-shrink-0 w-full min-w-full snap-start [scroll-snap-stop:always] overflow-y-auto overflow-x-hidden md:min-w-0 md:overflow-visible md:flex md:flex-col md:min-h-[400px] box-border"
        >
          <SkillsPanel className="flex-1 min-h-0 md:min-h-0" />
        </section>

        <section
          aria-label="Archetype & Attacks"
          className="flex-shrink-0 w-full min-w-full snap-start [scroll-snap-stop:always] overflow-y-auto overflow-x-hidden md:min-w-0 md:overflow-visible md:flex md:flex-col md:min-h-[400px] box-border"
        >
          <ArchetypePanel className="flex-1 min-h-0 md:min-h-0" />
        </section>

        <section
          aria-label="Library"
          className="flex-shrink-0 w-full min-w-full snap-start [scroll-snap-stop:always] overflow-y-auto overflow-x-hidden md:min-w-0 md:overflow-visible md:flex md:flex-col md:min-h-[400px] box-border"
        >
          <LibraryPanel className="flex-1 min-h-0 md:min-h-0" />
        </section>
      </div>
    </>
  );
}
