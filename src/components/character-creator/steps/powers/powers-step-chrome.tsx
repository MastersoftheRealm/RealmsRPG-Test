'use client';

import Link from 'next/link';
import { Plus, Wand2, ExternalLink } from 'lucide-react';
import { InfoTippy, LoadoutBudgetBar } from '@/components/shared';
import { Button, Spinner } from '@/components/ui';
import { PathHelpCard, PathNotes } from '@/components/character-creator/PathHelpCard';
import type { PathGuidanceGroup } from '@/types/archetype';
import { powersSelectionHelp } from '../../../../../public/tooltip-text';

export interface PowersStepChromeProps {
  pathMode: boolean;
  layer: number;
  proficiencySpent: number;
  proficiencyLimit: number;
  onExpandLayer: () => void;
  onCollapseLayer: () => void;
  pathRecommendationsLoading: boolean;
  pathName: string | undefined;
  hasPathPowerRecs: boolean;
  hasPathTechniqueRecs: boolean;
  minimizeTechniques: boolean;
  pathNotes?: string;
  guidanceGroups: PathGuidanceGroup[] | undefined;
  powersLoading: boolean;
  techniquesLoading: boolean;
  hasContent: boolean;
  isPathMode: boolean;
}

export function PowersStepChrome({
  pathMode,
  layer,
  proficiencySpent,
  proficiencyLimit,
  onExpandLayer,
  onCollapseLayer,
  pathRecommendationsLoading,
  pathName,
  hasPathPowerRecs,
  hasPathTechniqueRecs,
  minimizeTechniques,
  pathNotes,
  guidanceGroups,
  powersLoading,
  techniquesLoading,
  hasContent,
  isPathMode,
}: PowersStepChromeProps) {
  return (
    <>
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-1 mb-2">
          <h2 className="text-2xl font-bold text-text-primary">Powers & Techniques</h2>
          <InfoTippy
            content={powersSelectionHelp}
            allowHTML
            label="Powers and techniques help"
            size="inline"
          />
        </div>
        <p className="text-text-muted dark:text-text-secondary">
          Select powers and techniques from your library for your character to know.
        </p>
        <div className="mt-4 flex flex-col items-center justify-center gap-3">
          <LoadoutBudgetBar
            tpTotal={proficiencyLimit}
            tpSpent={proficiencySpent}
            className="mb-0"
          />
          {pathMode && (
            <div className="flex flex-wrap gap-2 justify-center">
              {layer === 1 ? (
                <Button variant="outline" onClick={onExpandLayer} className="min-h-11">
                  See all powers & techniques
                </Button>
              ) : (
                <Button variant="outline" onClick={onCollapseLayer} className="min-h-11">
                  ← Back to recommendations
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {pathRecommendationsLoading && (
        <div className="bg-primary-subtle-bg border border-primary-subtle-border rounded-xl p-6 flex items-center gap-4 mb-8">
          <Spinner className="w-6 h-6 flex-shrink-0 text-primary-link-fg" aria-hidden />
          <div>
            <p className="text-text-primary font-medium">
              Loading recommended powers and techniques from the library…
            </p>
            <p className="text-sm text-text-muted dark:text-text-secondary mt-0.5">
              Your path&apos;s recommendations will appear here in a moment.
            </p>
          </div>
        </div>
      )}
      {!pathRecommendationsLoading &&
        pathMode &&
        pathName &&
        (hasPathPowerRecs || hasPathTechniqueRecs) && (
          <>
            <PathHelpCard pathName={pathName}>
              {hasPathPowerRecs && hasPathTechniqueRecs && !minimizeTechniques
                ? 'Recommended powers and techniques fit your build. Keep what you like.'
                : hasPathPowerRecs
                  ? 'Recommended powers fit your build. Innate vs regular marked where applicable.'
                  : 'Recommended techniques fit your build.'}
            </PathHelpCard>
            <PathNotes pathName={pathName} notes={pathNotes} />
            {(guidanceGroups ?? [])
              .filter((g) => g.powers?.length || g.techniques?.length)
              .map((group) => (
                <div
                  key={group.id}
                  className="mb-4 rounded-xl border border-border-light bg-surface-alt px-4 py-3"
                >
                  <h3 className="font-semibold text-text-primary">{group.title}</h3>
                  {group.why && <p className="text-sm text-text-secondary mt-1">{group.why}</p>}
                </div>
              ))}
          </>
        )}

      {!powersLoading &&
        !techniquesLoading &&
        isPathMode &&
        !hasPathPowerRecs &&
        !hasPathTechniqueRecs && (
          <div className="bg-muted/30 border border-border rounded-xl p-6 text-center mb-8">
            <p className="text-text-muted dark:text-text-secondary">
              This path doesn&apos;t recommend specific powers or techniques. You can add them from
              your library later if you like.
            </p>
          </div>
        )}

      {!powersLoading &&
        !techniquesLoading &&
        !hasContent &&
        !(isPathMode && !hasPathPowerRecs && !hasPathTechniqueRecs) && (
          <div className="bg-muted/30 border border-border rounded-xl p-8 text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Wand2 className="w-8 h-8 text-text-muted dark:text-text-secondary" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">
              No Powers or Techniques Yet
            </h3>
            <p className="text-text-muted dark:text-text-secondary mb-6 max-w-md mx-auto">
              Create powers and techniques in your library first, then come back to add them to your
              character.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/power-creator"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-button text-text-on-dark hover:bg-primary-button-hover transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create Power
                <ExternalLink className="w-3 h-3" />
              </Link>
              <Link
                href="/technique-creator"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Technique
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
    </>
  );
}
