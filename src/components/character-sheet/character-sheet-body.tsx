/**
 * Character Sheet Body — desktop grid + mobile side-scroll (TASK-348).
 * Single LibrarySection mount shared across breakpoints (TASK-317).
 * Mobile panel gutters: basis-full + gap-4 inside PageContainer (TASK-538 / TASK-868).
 * Mobile C1: height-bound carousel so panels scroll internally (TASK-838).
 * Mobile header collapses on panel scroll so it can leave the viewport (TASK-868).
 * Header is not an inner scroller — vertical gestures on it bridge to the active panel (TASK-902).
 */

'use client';

import {
  Children,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import type { AbilityName } from '@/types';
import { tabListOverflowState } from '@/components/ui/tab-navigation';
import { cn } from '@/lib/utils';
import { calculateSkillPointsForEntity } from '@/lib/game/formulas';
import { AbilitiesSection } from './abilities-section';
import { SkillsSection } from './skills-section';
import { ArchetypeSection } from './archetype-section';
import { LibrarySection } from './library-section';
import { useCharacterSheet } from './character-sheet-context';
import { nextSheetHeaderCollapsed } from './sheet-mobile-header-collapse';

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
  'box-border shrink-0 grow-0 basis-full snap-start [scroll-snap-stop:always] overflow-x-hidden overflow-y-auto max-md:h-full max-md:min-h-0 max-md:overscroll-y-contain pb-4 max-md:pb-[var(--sheet-panel-end-pad)]';

const HEADER_GESTURE_AXIS_PX = 8;

function isMobileSheetViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
}

function activeMobilePanel(carousel: HTMLElement): HTMLElement | null {
  const origin = carousel.getBoundingClientRect().left;
  const panels = carousel.querySelectorAll<HTMLElement>('[data-sheet-mobile-panel]');
  let active: HTMLElement | null = null;
  let best = Number.POSITIVE_INFINITY;
  for (const panel of panels) {
    const delta = Math.abs(panel.getBoundingClientRect().left - origin);
    if (delta < best) {
      best = delta;
      active = panel;
    }
  }
  return active;
}

function activeMobilePanelScrollTop(carousel: HTMLElement): number {
  return activeMobilePanel(carousel)?.scrollTop ?? 0;
}

/**
 * Collapse the sheet header once a mobile panel scrolls past hysteresis.
 * Header is not a scroller — vertical touch/wheel on it is bridged to the active panel.
 */
function useMobileSheetHeaderCollapse(columnRef: RefObject<HTMLDivElement | null>) {
  const [collapsed, setCollapsed] = useState(false);
  const collapsedRef = useRef(false);

  useEffect(() => {
    const root = columnRef.current;
    if (!root) return;

    const applyScrollTop = (scrollTop: number) => {
      if (!isMobileSheetViewport()) {
        collapsedRef.current = false;
        setCollapsed(false);
        return;
      }
      const next = nextSheetHeaderCollapsed(collapsedRef.current, scrollTop);
      if (next === collapsedRef.current) return;
      collapsedRef.current = next;
      setCollapsed(next);
    };

    const syncFromScroller = (scroller: HTMLElement) => {
      if (scroller.dataset.sheetMobileCarousel !== undefined) {
        applyScrollTop(activeMobilePanelScrollTop(scroller));
        return;
      }
      if (scroller.dataset.sheetMobilePanel !== undefined) {
        applyScrollTop(scroller.scrollTop);
      }
    };

    const onScroll = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || target === root) return;
      syncFromScroller(target);
    };

    const onViewportChange = () => {
      if (!isMobileSheetViewport()) {
        collapsedRef.current = false;
        setCollapsed(false);
      }
    };

    root.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onViewportChange);
    return () => {
      root.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onViewportChange);
    };
  }, [columnRef]);

  useEffect(() => {
    const root = columnRef.current;
    if (!root) return;
    const header = root.querySelector<HTMLElement>('[data-sheet-mobile-header]');
    if (!header) return;

    let startY = 0;
    let startX = 0;
    let axis: 'undecided' | 'vertical' | 'horizontal' = 'undecided';
    let panel: HTMLElement | null = null;

    const resolvePanel = () => {
      const carousel = root.querySelector<HTMLElement>('[data-sheet-mobile-carousel]');
      return carousel ? activeMobilePanel(carousel) : null;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (!isMobileSheetViewport() || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (!touch) return;
      startY = touch.clientY;
      startX = touch.clientX;
      axis = 'undecided';
      panel = resolvePanel();
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!panel || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (!touch) return;
      const dy = startY - touch.clientY;
      const dx = touch.clientX - startX;
      if (axis === 'undecided') {
        if (Math.abs(dy) < HEADER_GESTURE_AXIS_PX && Math.abs(dx) < HEADER_GESTURE_AXIS_PX) return;
        axis = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
        if (axis === 'horizontal') {
          panel = null;
          return;
        }
      }
      if (axis !== 'vertical') return;
      panel.scrollTop += dy;
      startY = touch.clientY;
      startX = touch.clientX;
      event.preventDefault();
    };

    const onWheel = (event: WheelEvent) => {
      if (!isMobileSheetViewport()) return;
      const active = resolvePanel();
      if (!active) return;
      active.scrollTop += event.deltaY;
      event.preventDefault();
    };

    header.addEventListener('touchstart', onTouchStart, { passive: true });
    header.addEventListener('touchmove', onTouchMove, { passive: false });
    header.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      header.removeEventListener('touchstart', onTouchStart);
      header.removeEventListener('touchmove', onTouchMove);
      header.removeEventListener('wheel', onWheel);
    };
  }, [columnRef]);

  return collapsed;
}

/** C1 edge fade on the sheet carousel — same overflow metric as tab strips (TASK-840). */
function useSheetCarouselOverflow(carouselRef: RefObject<HTMLDivElement | null>) {
  const [overflow, setOverflow] = useState({ start: false, end: false });

  useLayoutEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const update = () => {
      if (!isMobileSheetViewport()) {
        setOverflow({ start: false, end: false });
        return;
      }
      setOverflow(tabListOverflowState(el.scrollLeft, el.clientWidth, el.scrollWidth));
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [carouselRef]);

  return overflow;
}

const DESKTOP_GRID_PANEL_CLASSNAME =
  'md:flex md:min-h-[400px] md:min-w-0 md:basis-auto md:flex-col md:overflow-visible';

/** Flex column below md; `contents` on md+ so header + body stay PageContainer siblings. */
export function CharacterSheetColumn({ children }: { children: ReactNode }) {
  const columnRef = useRef<HTMLDivElement>(null);
  const headerCollapsed = useMobileSheetHeaderCollapse(columnRef);
  const [header, ...rest] = Children.toArray(children);

  return (
    <div
      ref={columnRef}
      className="max-md:flex max-md:min-h-0 max-md:w-full max-md:min-w-0 max-md:flex-1 max-md:flex-col max-md:overflow-y-hidden max-md:overscroll-y-contain md:contents"
    >
      <div
        data-sheet-mobile-header
        className={cn(
          'max-md:min-w-0 max-md:shrink-0 max-md:transition-[max-height,opacity] max-md:duration-200 max-md:ease-out motion-reduce:max-md:transition-none md:contents',
          headerCollapsed &&
            'max-md:pointer-events-none max-md:max-h-0 max-md:overflow-hidden max-md:opacity-0',
        )}
        inert={headerCollapsed || undefined}
      >
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
  const carouselOverflow = useSheetCarouselOverflow(carouselRef);

  return (
    <>
      {/* Desktop: Abilities full width */}
      <div className="hidden md:block" data-tour-id="sheet-tour-abilities">
        <AbilitiesPanel />
      </div>

      {/* Shared grid (desktop) + side-scroll panels (mobile); Library mounts once.
          Mobile: panel basis = PageContainer content width (same as SheetHeader);
          gap between panels; no scroller padding so snap stays aligned (TASK-868).
          Height-bound below md so overflow-y-auto on each panel actually engages (TASK-838).
          C1 rest-state fade via tabListOverflowState (TASK-840 metric; no -mx/scroll-px). */}
      <div
        ref={carouselRef}
        data-sheet-mobile-carousel
        data-overflow-start={carouselOverflow.start ? 'true' : 'false'}
        data-overflow-end={carouselOverflow.end ? 'true' : 'false'}
        className="flex snap-x snap-mandatory flex-nowrap gap-4 overflow-x-auto scroll-smooth pb-4 max-md:min-h-0 max-md:w-full max-md:min-w-0 max-md:flex-1 max-md:touch-pan-x max-md:touch-pan-y max-md:overflow-y-hidden md:grid md:snap-none md:grid-cols-1 md:items-stretch md:overflow-visible md:pb-0 lg:grid-cols-[1fr_1fr_2fr]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <section
          aria-label="Abilities & Defenses"
          data-tour-id="sheet-tour-abilities"
          data-sheet-mobile-panel
          className={cn(MOBILE_SNAP_PANEL_CLASSNAME, 'md:hidden')}
        >
          <AbilitiesPanel />
        </section>

        <section
          aria-label="Skills"
          data-tour-id="sheet-tour-skills"
          data-sheet-mobile-panel
          className={cn(MOBILE_SNAP_PANEL_CLASSNAME, DESKTOP_GRID_PANEL_CLASSNAME)}
        >
          <SkillsPanel className="min-h-0 flex-1 md:min-h-0" />
        </section>

        <section
          aria-label="Archetype & Attacks"
          data-sheet-mobile-panel
          className={cn(MOBILE_SNAP_PANEL_CLASSNAME, DESKTOP_GRID_PANEL_CLASSNAME)}
        >
          <ArchetypePanel className="min-h-0 flex-1 md:min-h-0" />
        </section>

        <section
          aria-label="Library"
          data-tour-id="sheet-tour-library"
          data-sheet-mobile-panel
          className={cn(MOBILE_SNAP_PANEL_CLASSNAME, DESKTOP_GRID_PANEL_CLASSNAME)}
        >
          <LibraryPanel className="min-h-0 flex-1 md:min-h-0" />
        </section>
      </div>
    </>
  );
}
