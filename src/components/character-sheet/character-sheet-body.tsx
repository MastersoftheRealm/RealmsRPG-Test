/**
 * Character Sheet Body — desktop grid + mobile side-scroll (TASK-348).
 * Single LibrarySection mount shared across breakpoints (TASK-317).
 * Mobile panel gutters: basis-full + gap-4 + PageContainer-matched scroll-px (TASK-538).
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
    onTempModifiersChange,
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
        tempModifiers={character.tempModifiers}
        onTempModifiersChange={onTempModifiersChange}
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
    onAddSubSkill,
    onTempModifiersChange,
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
      tempModifiers={character.tempModifiers}
      onTempModifiersChange={onTempModifiersChange}
      onSkillChange={onSkillChange}
      onRemoveSkill={onRemoveSkill}
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
  const { libraryModel, libraryActiveTab, setLibraryActiveTab } = useCharacterSheet();
  if (!libraryModel) return null;
  return (
    <LibrarySection
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
      <div className="hidden md:block" data-tour-id="sheet-tour-abilities">
        <AbilitiesPanel />
      </div>

      {/* Shared grid (desktop) + side-scroll panels (mobile); Library mounts once.
          Mobile: panel basis = padded content width (matches SheetHeader / PageContainer),
          gap between panels, scroll-padding so snap aligns with the same gutters. */}
      <div
        className="flex flex-nowrap gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x -mx-4 px-4 scroll-px-4 pb-4 sm:-mx-6 sm:px-6 sm:scroll-px-6 md:mx-0 md:px-0 md:scroll-px-0 md:pb-0 md:grid md:grid-cols-1 lg:grid-cols-[1fr_1fr_2fr] md:items-stretch md:overflow-visible md:snap-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <section
          aria-label="Abilities & Defenses"
          data-tour-id="sheet-tour-abilities"
          className="md:hidden shrink-0 grow-0 basis-full snap-start [scroll-snap-stop:always] overflow-y-auto overflow-x-hidden box-border"
        >
          <AbilitiesPanel />
        </section>

        <section
          aria-label="Skills"
          data-tour-id="sheet-tour-skills"
          className="shrink-0 grow-0 basis-full snap-start [scroll-snap-stop:always] overflow-y-auto overflow-x-hidden md:min-w-0 md:basis-auto md:overflow-visible md:flex md:flex-col md:min-h-[400px] box-border"
        >
          <SkillsPanel className="flex-1 min-h-0 md:min-h-0" />
        </section>

        <section
          aria-label="Archetype & Attacks"
          className="shrink-0 grow-0 basis-full snap-start [scroll-snap-stop:always] overflow-y-auto overflow-x-hidden md:min-w-0 md:basis-auto md:overflow-visible md:flex md:flex-col md:min-h-[400px] box-border"
        >
          <ArchetypePanel className="flex-1 min-h-0 md:min-h-0" />
        </section>

        <section
          aria-label="Library"
          data-tour-id="sheet-tour-library"
          className="shrink-0 grow-0 basis-full snap-start [scroll-snap-stop:always] overflow-y-auto overflow-x-hidden md:min-w-0 md:basis-auto md:overflow-visible md:flex md:flex-col md:min-h-[400px] box-border"
        >
          <LibraryPanel className="flex-1 min-h-0 md:min-h-0" />
        </section>
      </div>
    </>
  );
}
