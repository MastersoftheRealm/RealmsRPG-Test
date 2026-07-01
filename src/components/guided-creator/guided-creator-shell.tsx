/**
 * GuidedCreatorShell
 * ==================
 * Orchestrates the guided character creator.
 */

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { ConfirmActionModal } from '@/components/shared';
import { ChevronDown, RotateCcw } from 'lucide-react';
import {
  useGuidedCreatorStore,
  GUIDED_CHAPTERS,
  type GuidedSubStep,
} from '@/stores/guided-creator-store';
import { GuidedCreatorPageShell } from './guided-creator-page-shell';
import { CharacterPreviewPanel } from './character-preview-panel';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import {
  PathStep,
  SpeciesStep,
  AncestryStep,
  AbilitiesStep,
  SkillsStep,
  ArchetypeFeatsStep,
  CharacterFeatStep,
  LoadoutStep,
  PowersTechniquesStep,
  RevealStep,
} from './steps';

const shellCopy = GUIDED_CREATOR_COPY.shell;

const STEP_COMPONENTS: Record<GuidedSubStep, React.ComponentType> = {
  path: PathStep,
  species: SpeciesStep,
  ancestry: AncestryStep,
  abilities: AbilitiesStep,
  skills: SkillsStep,
  'archetype-feats': ArchetypeFeatsStep,
  'character-feat': CharacterFeatStep,
  loadout: LoadoutStep,
  'powers-techniques': PowersTechniquesStep,
  reveal: RevealStep,
};

function ChapterRail({ className }: { className?: string }) {
  const { currentSubStep, completedSubSteps, canNavigateToSubStep, setSubStep } = useGuidedCreatorStore();
  const activeChapterIndex = GUIDED_CHAPTERS.findIndex((c) => c.subSteps.includes(currentSubStep));

  return (
    <nav aria-label="Creation chapters" className={cn(className)}>
      <ol
        className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-thin pb-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {GUIDED_CHAPTERS.map((chapter, index) => {
          const isComplete = chapter.subSteps.every((s) => completedSubSteps.includes(s));
          const isActive = index === activeChapterIndex;
          const firstSub = chapter.subSteps[0];
          const canOpen = canNavigateToSubStep(firstSub);

          return (
            <li key={chapter.id} className="shrink-0">
              <button
                type="button"
                onClick={() => canOpen && setSubStep(firstSub)}
                disabled={!canOpen}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-pill px-3 py-2 min-h-11 text-sm font-medium transition-colors border',
                  isActive &&
                    'bg-primary-button text-text-on-dark border-primary-button shadow-card',
                  !isActive &&
                    isComplete &&
                    'bg-success-light text-success-fg border-success-200/60 dark:border-success-800/40',
                  !isActive &&
                    !isComplete &&
                    canOpen &&
                    'bg-surface text-text-secondary border-border-light hover:bg-surface-alt',
                  !isActive &&
                    !isComplete &&
                    !canOpen &&
                    'bg-surface text-text-muted dark:text-text-secondary border-border-light cursor-not-allowed'
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-pill font-display text-xs font-bold',
                    isActive
                      ? 'bg-white/20 text-text-on-dark'
                      : isComplete
                        ? 'bg-success-fg/15 text-success-fg'
                        : 'bg-surface-alt text-text-secondary'
                  )}
                  aria-hidden="true"
                >
                  {isComplete && !isActive ? '✓' : index + 1}
                </span>
                <span className="whitespace-nowrap font-nunito">{chapter.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function GuidedCreatorShell() {
  const { currentSubStep, resetCreator } = useGuidedCreatorStore();
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [showRestart, setShowRestart] = useState(false);

  const StepComponent = STEP_COMPONENTS[currentSubStep];
  const activeChapterIndex = GUIDED_CHAPTERS.findIndex((c) => c.subSteps.includes(currentSubStep));
  const activeChapter = activeChapterIndex >= 0 ? GUIDED_CHAPTERS[activeChapterIndex] : null;
  const chapterNumber = activeChapterIndex >= 0 ? activeChapterIndex + 1 : 1;

  const progressLabel = useMemo(() => {
    if (!activeChapter) return shellCopy.stepProgressFallback;
    return `Chapter ${chapterNumber} of ${GUIDED_CHAPTERS.length} · ${activeChapter.title}`;
  }, [activeChapter, chapterNumber]);

  const isRevealStep = currentSubStep === 'reveal';

  return (
    <GuidedCreatorPageShell
      compact
      subtitle={progressLabel}
      actions={
        <Button
          variant="outline"
          onClick={() => setShowRestart(true)}
          className={cn(
            'min-h-11',
            'border-primary-outline-border text-primary-outline-fg',
            'dark:border-text-on-dark/80 dark:text-text-on-dark dark:bg-text-on-dark/10 dark:hover:bg-text-on-dark/20'
          )}
        >
          <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {shellCopy.restart}
        </Button>
      }
    >
      <div
        className={cn(
          'sticky top-0 z-20 -mx-4 px-4 py-2.5 mb-4',
          'bg-background/95 backdrop-blur-md',
          'border-b border-border-light dark:border-border shadow-sm'
        )}
      >
        <ChapterRail />
      </div>

      {!isRevealStep && (
        <div className="lg:hidden mb-3">
          <button
            type="button"
            onClick={() => setMobilePreviewOpen((o) => !o)}
            aria-expanded={mobilePreviewOpen}
            className="flex w-full items-center justify-between rounded-card border border-border-light dark:border-border bg-surface-alt/60 px-4 py-3 min-h-11 text-sm font-medium text-text-primary font-nunito shadow-card"
          >
            {shellCopy.previewToggle}
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', mobilePreviewOpen && 'rotate-180')}
              aria-hidden="true"
            />
          </button>
          {mobilePreviewOpen && (
            <CharacterPreviewPanel variant="strip" className="mt-2" />
          )}
        </div>
      )}

      {!isRevealStep && (
        <CharacterPreviewPanel variant="strip" className="mb-4 hidden lg:flex" />
      )}

      <div
        className={cn(
          'rounded-card border border-border-light dark:border-border bg-surface-alt/60 shadow-card',
          isRevealStep ? 'p-5 md:p-8' : 'p-5 md:p-7'
        )}
      >
        <StepComponent />
      </div>

      <ConfirmActionModal
        isOpen={showRestart}
        onClose={() => setShowRestart(false)}
        onConfirm={() => {
          resetCreator();
          setShowRestart(false);
        }}
        title={shellCopy.restartModal.title}
        description={shellCopy.restartModal.description}
        confirmLabel={shellCopy.restartModal.confirmLabel}
        confirmVariant="danger"
      />
    </GuidedCreatorPageShell>
  );
}
