/**
 * Character Sheet Body — desktop grid + mobile side-scroll (TASK-348).
 * Single LibrarySection mount shared across breakpoints (TASK-317).
 * Mobile panel gutters: basis-full + gap-4 inside PageContainer (TASK-538 / TASK-868).
 * Mobile C1: height-bound frame; column is the vertical scroller (TASK-838 / TASK-907).
 * Inactive snap panels contribute no height so the tallest sibling cannot stretch the page.
 */

'use client';

import { Children, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { AbilityName } from '@/types';
import { SegmentedControl } from '@/components/patterns';
import { cn } from '@/lib/utils';
import { calculateSkillPointsForEntity } from '@/lib/game/formulas';
import { AbilitiesSection } from './abilities-section';
import { SkillsSection } from './skills-section';
import { ArchetypeSection } from './archetype-section';
import { LibrarySection } from './library-section';
import { useCharacterSheet } from './character-sheet-context';
import {
  SHEET_CAROUSEL_AXIS_PX,
  SHEET_CAROUSEL_PANEL_OPTIONS,
  isMobileSheetViewport,
  isSheetCarouselNearSnap,
  nearestSheetCarouselIndex,
  sheetCarouselGapPx,
  sheetCarouselPanelScrollLeft,
  sheetMobilePanels,
  type SheetCarouselPanelId,
} from './sheet-mobile-carousel';

/**
 * Site `Header` is `h-20` (5rem). Below md, lock the sheet column to the leftover
 * viewport so the carousel cannot stretch to the tallest sibling (TASK-838 / C1).
 * Bottom reserve is `--sheet-mobile-bottom-reserve` (TASK-843): owner dock height
 * when `.has-sheet-mobile-dock` wraps the frame, else 0 (FAB gutter lives on panels).
 */
export const CHARACTER_SHEET_MOBILE_FRAME_CLASSNAME =
  'character-sheet-mobile-frame max-md:box-border max-md:flex max-md:h-[calc(100svh-5rem)] max-md:min-w-0 max-md:w-full max-md:flex-col max-md:overflow-hidden max-md:pb-[var(--sheet-mobile-bottom-reserve)]';

/** Marks the owner sheet so the RollLog FAB shares the mobile action-dock strip. */
export const CHARACTER_SHEET_MOBILE_DOCK_SCOPE_CLASSNAME = 'has-sheet-mobile-dock';

const MOBILE_SNAP_PANEL_CLASSNAME =
  'box-border shrink-0 grow-0 basis-full snap-start [scroll-snap-stop:always] overflow-x-hidden max-md:min-h-0 max-md:overflow-y-hidden pb-4 max-md:pb-[var(--sheet-panel-end-pad)] max-md:[&:not([data-sheet-panel-active])]:h-0 max-md:[&:not([data-sheet-panel-active])]:overflow-hidden max-md:[&:not([data-sheet-panel-active])]:pb-0';

function clearSheetCarouselPanning(carousel: HTMLElement) {
  carousel.removeAttribute('data-sheet-carousel-panning');
  carousel.style.removeProperty('--sheet-carousel-lock-height');
}

/**
 * Keep inactive snap panels out of the column's height; lock height while
 * horizontally panning so the incoming panel is visible. Vertical pan on the
 * carousel is forwarded to the column (header stays in document flow).
 */
function useSheetMobileCarousel(carouselRef: RefObject<HTMLDivElement | null>) {
  const [activeId, setActiveId] = useState<SheetCarouselPanelId>('abilities');

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const syncFromScroll = () => {
      if (!isMobileSheetViewport()) {
        clearSheetCarouselPanning(carousel);
        return;
      }
      const panels = sheetMobilePanels(carousel);
      const gap = sheetCarouselGapPx(carousel);
      const width = carousel.clientWidth;
      const index = nearestSheetCarouselIndex(carousel.scrollLeft, width, gap, panels.length);
      setActiveId(SHEET_CAROUSEL_PANEL_OPTIONS[index]?.value ?? 'abilities');
      if (isSheetCarouselNearSnap(carousel.scrollLeft, width, gap, panels.length)) {
        clearSheetCarouselPanning(carousel);
        return;
      }
      if (carousel.dataset.sheetCarouselPanning !== undefined) return;
      const active = panels[index];
      const lockHeight = Math.round(active?.scrollHeight || carousel.offsetHeight);
      carousel.style.setProperty('--sheet-carousel-lock-height', `${lockHeight}px`);
      carousel.setAttribute('data-sheet-carousel-panning', '');
    };

    syncFromScroll();
    carousel.addEventListener('scroll', syncFromScroll, { passive: true });
    carousel.addEventListener('scrollend', syncFromScroll);
    const ro = new ResizeObserver(syncFromScroll);
    ro.observe(carousel);
    window.addEventListener('resize', syncFromScroll);
    return () => {
      carousel.removeEventListener('scroll', syncFromScroll);
      carousel.removeEventListener('scrollend', syncFromScroll);
      ro.disconnect();
      window.removeEventListener('resize', syncFromScroll);
    };
  }, [carouselRef]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    let startY = 0;
    let startX = 0;
    let axis: 'undecided' | 'vertical' | 'horizontal' = 'undecided';

    const columnOf = () => carousel.closest<HTMLElement>('[data-sheet-mobile-column]');

    const onTouchStart = (event: TouchEvent) => {
      if (!isMobileSheetViewport() || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (!touch) return;
      startY = touch.clientY;
      startX = touch.clientX;
      axis = 'undecided';
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!isMobileSheetViewport() || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (!touch) return;
      const dy = startY - touch.clientY;
      const dx = touch.clientX - startX;
      if (axis === 'undecided') {
        if (Math.abs(dy) < SHEET_CAROUSEL_AXIS_PX && Math.abs(dx) < SHEET_CAROUSEL_AXIS_PX) return;
        axis = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }
      if (axis !== 'vertical') return;
      const column = columnOf();
      if (!column) return;
      column.scrollTop += dy;
      startY = touch.clientY;
      startX = touch.clientX;
      event.preventDefault();
    };

    const onWheel = (event: WheelEvent) => {
      if (!isMobileSheetViewport()) return;
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      const column = columnOf();
      if (!column) return;
      column.scrollTop += event.deltaY;
      event.preventDefault();
    };

    carousel.addEventListener('touchstart', onTouchStart, { passive: true });
    carousel.addEventListener('touchmove', onTouchMove, { passive: false });
    carousel.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      carousel.removeEventListener('touchstart', onTouchStart);
      carousel.removeEventListener('touchmove', onTouchMove);
      carousel.removeEventListener('wheel', onWheel);
    };
  }, [carouselRef]);

  const selectPanel = (id: SheetCarouselPanelId) => {
    setActiveId(id);
    const carousel = carouselRef.current;
    if (!carousel || !isMobileSheetViewport()) return;
    const index = SHEET_CAROUSEL_PANEL_OPTIONS.findIndex((option) => option.value === id);
    const panel = sheetMobilePanels(carousel)[index];
    if (!panel) return;
    clearSheetCarouselPanning(carousel);
    carousel.scrollTo({ left: sheetCarouselPanelScrollLeft(carousel, panel), behavior: 'auto' });
  };

  return { activeId, selectPanel };
}

const DESKTOP_GRID_PANEL_CLASSNAME =
  'md:flex md:min-h-[400px] md:min-w-0 md:basis-auto md:flex-col md:overflow-visible';

/** Flex column below md; `contents` on md+ so header + body stay PageContainer siblings. */
export function CharacterSheetColumn({ children }: { children: ReactNode }) {
  const [header, ...rest] = Children.toArray(children);

  return (
    <div
      data-sheet-mobile-column
      className="max-md:flex max-md:min-h-0 max-md:w-full max-md:min-w-0 max-md:flex-1 max-md:flex-col max-md:overflow-x-hidden max-md:overflow-y-auto max-md:overscroll-y-contain md:contents"
    >
      <div data-sheet-mobile-header className="max-md:min-w-0 max-md:shrink-0 md:contents">
        {header}
      </div>
      {rest}
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
  const carouselRef = useRef<HTMLDivElement>(null);
  const { activeId, selectPanel } = useSheetMobileCarousel(carouselRef);

  return (
    <>
      {/* Desktop: Abilities full width */}
      <div className="hidden md:block" data-tour-id="sheet-tour-abilities">
        <AbilitiesPanel />
      </div>

      <div className="sticky top-0 z-sticky mb-2 bg-background py-1 md:hidden">
        <SegmentedControl
          size="compact"
          equalWidth
          tabs
          tabPanelId="character-sheet-mobile-carousel"
          aria-label="Character sheet sections"
          className="w-full flex-nowrap"
          value={activeId}
          onChange={selectPanel}
          options={[...SHEET_CAROUSEL_PANEL_OPTIONS]}
        />
      </div>

      {/* Shared grid (desktop) + side-scroll panels (mobile); Library mounts once.
          Mobile: panel basis = PageContainer content width (same as SheetHeader);
          gap between panels; no scroller padding so snap stays aligned (TASK-868).
          Column is the vertical scroller (header in flow). Inactive panels height 0
          so Library cannot stretch Abilities (TASK-838 / TASK-907). C1 affordance is
          the section switcher — not a content-covering fade. */}
      <div
        ref={carouselRef}
        id="character-sheet-mobile-carousel"
        data-sheet-mobile-carousel
        className="flex snap-x snap-mandatory flex-nowrap gap-4 overflow-x-auto pb-4 max-md:min-h-0 max-md:w-full max-md:min-w-0 max-md:shrink-0 max-md:touch-pan-x max-md:items-start max-md:overflow-y-hidden md:grid md:snap-none md:grid-cols-1 md:items-stretch md:overflow-visible md:pb-0 lg:grid-cols-[1fr_1fr_2fr]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <section
          aria-label="Abilities & Defenses"
          data-tour-id="sheet-tour-abilities"
          data-sheet-mobile-panel
          data-sheet-panel-active={activeId === 'abilities' || undefined}
          className={cn(MOBILE_SNAP_PANEL_CLASSNAME, 'md:hidden')}
        >
          <AbilitiesPanel />
        </section>

        <section
          aria-label="Skills"
          data-tour-id="sheet-tour-skills"
          data-sheet-mobile-panel
          data-sheet-panel-active={activeId === 'skills' || undefined}
          className={cn(MOBILE_SNAP_PANEL_CLASSNAME, DESKTOP_GRID_PANEL_CLASSNAME)}
        >
          <SkillsPanel className="min-h-0 flex-1 md:min-h-0" />
        </section>

        <section
          aria-label="Archetype & Attacks"
          data-sheet-mobile-panel
          data-sheet-panel-active={activeId === 'archetype' || undefined}
          className={cn(MOBILE_SNAP_PANEL_CLASSNAME, DESKTOP_GRID_PANEL_CLASSNAME)}
        >
          <ArchetypePanel className="min-h-0 flex-1 md:min-h-0" />
        </section>

        <section
          aria-label="Library"
          data-tour-id="sheet-tour-library"
          data-sheet-mobile-panel
          data-sheet-panel-active={activeId === 'library' || undefined}
          className={cn(MOBILE_SNAP_PANEL_CLASSNAME, DESKTOP_GRID_PANEL_CLASSNAME)}
        >
          <LibraryPanel className="min-h-0 flex-1 md:min-h-0" />
        </section>
      </div>
    </>
  );
}
