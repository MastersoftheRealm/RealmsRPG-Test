'use client';

import { ExpandableChip } from '@/components/ui';

export function SelectedFeatChipRow({
  displayName,
  description,
  variant,
  isExpanded,
  onToggleExpand,
  onRemove,
}: {
  displayName: string;
  description?: string | undefined;
  variant: 'listWarning' | 'list';
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="inline-flex max-w-full items-start gap-1">
      <ExpandableChip
        label={displayName}
        description={description}
        variant={variant}
        expanded={isExpanded}
        onToggle={(e) => {
          e.stopPropagation();
          onToggleExpand();
        }}
        fullWidthWhenExpanded
        interactiveHover
        className="min-w-0"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`Remove ${displayName}`}
        className="min-h-[var(--touch-target-min,44px)] min-w-[var(--touch-target-min,44px)] shrink-0 font-bold text-danger-fg hover:opacity-80"
      >
        ×
      </button>
    </div>
  );
}
