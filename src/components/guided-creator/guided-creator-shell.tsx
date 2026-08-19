/**
 * GuidedCreatorShell
 * ==================
 * Orchestrates the guided character creator.
 */

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { ConfirmActionModal } from '@/components/patterns';
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
  const { currentSubStep, isSubStepSatisfied, canNavigateToSubStep, setSubStep } =
    useGuidedCreatorStore();
  const activeChapterIndex = GUIDED_CHAPTERS.findIndex((c) => c.subSteps.includes(currentSubStep));

  return (
    <nav aria-label="Creation chapters" className={cn(className)}>
      <ol
        className="flex scrollbar-thin flex-nowrap gap-2 overflow-x-auto pb-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {GUIDED_CHAPTERS.map((chapter, index) => {
          const isActive = index === activeChapterIndex;
          // ✓ only for chapters the player has moved past — Equipment and Powers hold no
          // required picks, so "satisfied" alone would tick them before they are reached.
          const isComplete =
            index < activeChapterIndex && chapter.subSteps.every(isSubStepSatisfied);
          const firstSub = chapter.subSteps[0];
          if (firstSub === undefined) return null;
          const canOpen = canNavigateToSubStep(firstSub);

          return (
            <li key={chapter.id} className="shrink-0">
              <button
                type="button"
                onClick={() => canOpen && setSubStep(firstSub)}
                disabled={!canOpen}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-pill border px-3 py-2 text-sm font-medium transition-colors',
                  isActive &&
                    'border-primary-button bg-primary-button text-text-on-dark shadow-card',
                  !isActive &&
                    isComplete &&
                    'border-success-200/60 bg-success-light text-success-fg dark:border-success-800/40',
                  !isActive &&
                    !isComplete &&
                    canOpen &&
                    'border-border-light bg-surface text-text-secondary hover:bg-surface-alt',
                  !isActive &&
                    !isComplete &&
                    !canOpen &&
                    'cursor-not-allowed border-border-light bg-surface text-text-muted',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-pill font-display text-xs font-bold',
                    isActive
                      ? 'bg-text-on-dark/20 text-text-on-dark'
                      : isComplete
                        ? 'bg-success-fg/15 text-success-fg'
                        : 'bg-surface-alt text-text-secondary',
                  )}
                  aria-hidden="true"
                >
                  {isComplete && !isActive ? '✓' : index + 1}
                </span>
                <span className="font-nunito whitespace-nowrap">{chapter.title}</span>
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
            'dark:border-text-on-dark/80 dark:bg-text-on-dark/10 dark:text-text-on-dark dark:hover:bg-text-on-dark/20',
          )}
        >
          <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {shellCopy.restart}
        </Button>
      }
    >
      <div
        className={cn(
          'sticky top-0 z-20 -mx-4 mb-4 px-4 py-2.5',
          'bg-background/95 backdrop-blur-md',
          'border-b border-border-light shadow-sm dark:border-border',
        )}
      >
        <ChapterRail />
      </div>

      {!isRevealStep && (
        <div className="mb-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobilePreviewOpen((o) => !o)}
            aria-expanded={mobilePreviewOpen}
            className="flex min-h-11 w-full items-center justify-between rounded-card border border-border-light bg-surface-alt/60 px-4 py-3 font-nunito text-sm font-medium text-text-primary shadow-card dark:border-border"
          >
            {shellCopy.previewToggle}
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', mobilePreviewOpen && 'rotate-180')}
              aria-hidden="true"
            />
          </button>
          {mobilePreviewOpen && <CharacterPreviewPanel variant="strip" className="mt-2" />}
        </div>
      )}

      {!isRevealStep && <CharacterPreviewPanel variant="strip" className="mb-4 hidden lg:flex" />}

      <div
        className={cn(
          'rounded-card border border-border-light bg-surface-alt/60 shadow-card dark:border-border',
          isRevealStep ? 'p-5 md:p-8' : 'p-5 md:p-7',
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
