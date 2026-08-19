'use client';

import Link from 'next/link';
import { Plus, Wand2, ExternalLink } from 'lucide-react';
import { InfoTippy, LoadoutBudgetBar, PathHelpCard, PathNotes } from '@/components/patterns';
import { Button, Spinner } from '@/components/ui';
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
  pathNotes?: string | undefined;
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
      <div className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-1">
          <h2 className="text-2xl font-bold text-text-primary">Powers & Techniques</h2>
          <InfoTippy
            content={powersSelectionHelp}
            allowHTML
            label="Powers and techniques help"
            size="inline"
          />
        </div>
        <p className="text-text-muted">
          Select powers and techniques from your library for your character to know.
        </p>
        <div className="mt-4 flex flex-col items-center justify-center gap-3">
          <LoadoutBudgetBar
            tpTotal={proficiencyLimit}
            tpSpent={proficiencySpent}
            className="mb-0"
          />
          {pathMode && (
            <div className="flex flex-wrap justify-center gap-2">
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
        <div className="mb-8 flex items-center gap-4 rounded-xl border border-primary-subtle-border bg-primary-subtle-bg p-6">
          <Spinner className="h-6 w-6 flex-shrink-0 text-primary-link-fg" aria-hidden />
          <div>
            <p className="font-medium text-text-primary">
              Loading recommended powers and techniques from the library…
            </p>
            <p className="mt-0.5 text-sm text-text-muted">
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
                  {group.why && <p className="mt-1 text-sm text-text-secondary">{group.why}</p>}
                </div>
              ))}
          </>
        )}

      {!powersLoading &&
        !techniquesLoading &&
        isPathMode &&
        !hasPathPowerRecs &&
        !hasPathTechniqueRecs && (
          <div className="mb-8 rounded-xl border border-border bg-muted/30 p-6 text-center">
            <p className="text-text-muted">
              This path doesn&apos;t recommend specific powers or techniques. You can add them from
              your library later if you like.
            </p>
          </div>
        )}

      {!powersLoading &&
        !techniquesLoading &&
        !hasContent &&
        !(isPathMode && !hasPathPowerRecs && !hasPathTechniqueRecs) && (
          <div className="mb-8 rounded-xl border border-border bg-muted/30 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Wand2 className="h-8 w-8 text-text-muted" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-text-primary">
              No Powers or Techniques Yet
            </h3>
            <p className="mx-auto mb-6 max-w-md text-text-muted">
              Create powers and techniques in your library first, then come back to add them to your
              character.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/power-creator"
                className="flex items-center gap-2 rounded-lg bg-primary-button px-4 py-2 text-text-on-dark shadow-sm transition-colors hover:bg-primary-button-hover"
              >
                <Plus className="h-4 w-4" />
                Create Power
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href="/technique-creator"
                className="text-foreground flex items-center gap-2 rounded-lg border border-border px-4 py-2 transition-colors hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
                Create Technique
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
    </>
  );
}
