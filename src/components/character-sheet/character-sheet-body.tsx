/**
 * Character Sheet Body — desktop grid + mobile side-scroll (TASK-348).
 * Single LibrarySection mount shared across breakpoints (TASK-317).
 * Mobile panel gutters: basis-full + gap-4 + PageContainer-matched scroll-px (TASK-538).
 * Mobile C1: height-bound carousel so panels scroll internally (TASK-838).
 */

'use client';

import type { ReactNode } from 'react';
import type { AbilityName } from '@/types';
import { cn } from '@/lib/utils';
import { calculateSkillPointsForEntity } from '@/lib/game/formulas';
import { AbilitiesSection } from './abilities-section';
import { SkillsSection } from './skills-section';
import { ArchetypeSection } from './archetype-section';
import { LibrarySection } from './library-section';
import { useCharacterSheet } from './character-sheet-context';

/**
 * Site `Header` is `h-20` (5rem). Below md, lock the sheet column to the leftover
 * viewport so the carousel cannot stretch to the tallest sibling (TASK-838 / C1).
 * `box-border` + dock padding reserves the C4 bottom strip (TASK-837).
 */
export const CHARACTER_SHEET_MOBILE_FRAME_CLASSNAME =
  'character-sheet-mobile-frame max-md:box-border max-md:flex max-md:h-[calc(100svh-5rem)] max-md:flex-col max-md:overflow-hidden max-md:pb-[var(--sheet-mobile-dock-height)]';

/** Marks the owner sheet so the RollLog FAB shares the mobile action-dock strip. */
export const CHARACTER_SHEET_MOBILE_DOCK_SCOPE_CLASSNAME = 'has-sheet-mobile-dock';

const MOBILE_SNAP_PANEL_CLASSNAME =
  'box-border shrink-0 grow-0 basis-full snap-start [scroll-snap-stop:always] overflow-x-hidden overflow-y-auto max-md:h-full max-md:min-h-0 max-md:overscroll-y-contain max-md:pb-4';

const DESKTOP_GRID_PANEL_CLASSNAME =
  'md:flex md:min-h-[400px] md:min-w-0 md:basis-auto md:flex-col md:overflow-visible';

/** Flex column below md; `contents` on md+ so header + body stay PageContainer siblings. */
export function CharacterSheetColumn({ children }: { children: ReactNode }) {
  return (
    <div className="max-md:flex max-md:min-h-0 max-md:flex-1 max-md:flex-col md:contents max-md:[&>*:first-child]:shrink-0">
      {children}
    </div>
  );
}

function AbilitiesPanel({ className }: { className?: string | undefined }) {
  const {
    character,
    isEditMode,
    isTempModifierMode,
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
        isTempModifierMode={isTempModifierMode}
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

function SkillsPanel({ className }: { className?: string | undefined }) {
  const {
    character,
    isEditMode,
    isTempModifierMode,
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
      isTempModifierMode={isTempModifierMode}
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

function ArchetypePanel({ className }: { className?: string | undefined }) {
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

function LibraryPanel({ className }: { className?: string | undefined }) {
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
          gap between panels, scroll-padding so snap aligns with the same gutters.
          Height-bound below md so overflow-y-auto on each panel actually engages (TASK-838). */}
      <div
        className="-mx-4 flex touch-pan-x snap-x snap-mandatory scroll-px-4 flex-nowrap gap-4 overflow-x-auto scroll-smooth px-4 pb-4 max-md:min-h-0 max-md:flex-1 max-md:overflow-y-hidden sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:grid md:snap-none md:scroll-px-0 md:grid-cols-1 md:items-stretch md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-[1fr_1fr_2fr]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <section
          aria-label="Abilities & Defenses"
          data-tour-id="sheet-tour-abilities"
          className={cn(MOBILE_SNAP_PANEL_CLASSNAME, 'md:hidden')}
        >
          <AbilitiesPanel />
        </section>

        <section
          aria-label="Skills"
          data-tour-id="sheet-tour-skills"
          className={cn(MOBILE_SNAP_PANEL_CLASSNAME, DESKTOP_GRID_PANEL_CLASSNAME)}
        >
          <SkillsPanel className="min-h-0 flex-1 md:min-h-0" />
        </section>

        <section
          aria-label="Archetype & Attacks"
          className={cn(MOBILE_SNAP_PANEL_CLASSNAME, DESKTOP_GRID_PANEL_CLASSNAME)}
        >
          <ArchetypePanel className="min-h-0 flex-1 md:min-h-0" />
        </section>

        <section
          aria-label="Library"
          data-tour-id="sheet-tour-library"
          className={cn(MOBILE_SNAP_PANEL_CLASSNAME, DESKTOP_GRID_PANEL_CLASSNAME)}
        >
          <LibraryPanel className="min-h-0 flex-1 md:min-h-0" />
        </section>
      </div>
    </>
  );
}
