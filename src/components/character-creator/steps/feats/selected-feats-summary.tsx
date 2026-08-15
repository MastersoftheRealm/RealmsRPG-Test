'use client';

import { cn } from '@/lib/utils';
import { statusPanel } from '@/lib/ui/status-surface-classes';
import { DescriptorChip } from '@/components/ui';
import { statusBadgeDescriptorVariant } from '@/lib/chip/descriptor-chip-variants';
import { formatFeatName, getFeatLevel } from '@/lib/leveled-feats';
import type { Feat } from '@/hooks';
import { SelectedFeatChipRow } from './selected-feat-chip-row';
import type { SelectedFeat } from './feat-list-columns';

interface SelectedFeatsSummaryProps {
  selectedArchetypeFeats: SelectedFeat[];
  selectedCharacterFeats: SelectedFeat[];
  maxArchetypeFeats: number;
  maxCharacterFeats: number;
  featById: Map<string, Feat>;
  feats: Feat[] | undefined;
  expandedSelectedId: string | null;
  onExpandedSelectedIdChange: (id: string | null) => void;
  onRemoveFeat: (featId: string) => void;
}

export function SelectedFeatsSummary({
  selectedArchetypeFeats,
  selectedCharacterFeats,
  maxArchetypeFeats,
  maxCharacterFeats,
  featById,
  feats,
  expandedSelectedId,
  onExpandedSelectedIdChange,
  onRemoveFeat,
}: SelectedFeatsSummaryProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Archetype Feats Selected */}
      <div
        className={cn(
          'rounded-xl border-2 p-4',
          selectedArchetypeFeats.length === maxArchetypeFeats
            ? statusPanel.complete
            : statusPanel.warning,
        )}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-bold text-text-primary">Archetype Feats</h3>
          <DescriptorChip
            size="md"
            variant={statusBadgeDescriptorVariant(
              selectedArchetypeFeats.reduce(
                (sum, f) => sum + getFeatLevel(featById.get(String(f.id))),
                0,
              ) === maxArchetypeFeats
                ? 'complete'
                : 'warning',
            )}
            className="font-bold"
          >
            {selectedArchetypeFeats.reduce(
              (sum, f) => sum + getFeatLevel(featById.get(String(f.id))),
              0,
            )}{' '}
            / {maxArchetypeFeats}
          </DescriptorChip>
        </div>
        <div data-chip-group className="flex flex-wrap items-start gap-2">
          {selectedArchetypeFeats.length === 0 ? (
            <span className="text-sm text-text-muted italic">None selected</span>
          ) : (
            selectedArchetypeFeats.map((feat) => {
              const key = `arch-${feat.id}`;
              const isExpanded = expandedSelectedId === key;
              const fullFeat = feats?.find((f) => String(f.id) === String(feat.id));
              const displayName = fullFeat ? formatFeatName(fullFeat) : feat.name;
              return (
                <SelectedFeatChipRow
                  key={feat.id}
                  displayName={displayName}
                  description={fullFeat?.description ?? feat.description}
                  variant="listWarning"
                  isExpanded={isExpanded}
                  onToggleExpand={() => onExpandedSelectedIdChange(isExpanded ? null : key)}
                  onRemove={() => onRemoveFeat(feat.id)}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Character Feats Selected */}
      <div
        className={cn(
          'rounded-xl border-2 p-4',
          selectedCharacterFeats.length === maxCharacterFeats
            ? statusPanel.complete
            : statusPanel.info,
        )}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-bold text-text-primary">Character Feats</h3>
          <DescriptorChip
            size="md"
            variant={statusBadgeDescriptorVariant(
              selectedCharacterFeats.reduce(
                (sum, f) => sum + getFeatLevel(featById.get(String(f.id))),
                0,
              ) === maxCharacterFeats
                ? 'complete'
                : 'info',
            )}
            className="font-bold"
          >
            {selectedCharacterFeats.reduce(
              (sum, f) => sum + getFeatLevel(featById.get(String(f.id))),
              0,
            )}{' '}
            / {maxCharacterFeats}
          </DescriptorChip>
        </div>
        <div data-chip-group className="flex flex-wrap items-start gap-2">
          {selectedCharacterFeats.length === 0 ? (
            <span className="text-sm text-text-muted italic">None selected</span>
          ) : (
            selectedCharacterFeats.map((feat) => {
              const key = `char-${feat.id}`;
              const isExpanded = expandedSelectedId === key;
              const fullFeat = feats?.find((f) => String(f.id) === String(feat.id));
              const displayName = fullFeat ? formatFeatName(fullFeat) : feat.name;
              return (
                <SelectedFeatChipRow
                  key={feat.id}
                  displayName={displayName}
                  description={fullFeat?.description ?? feat.description}
                  variant="list"
                  isExpanded={isExpanded}
                  onToggleExpand={() => onExpandedSelectedIdChange(isExpanded ? null : key)}
                  onRemove={() => onRemoveFeat(feat.id)}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
