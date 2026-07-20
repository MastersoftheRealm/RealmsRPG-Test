'use client';

import { GridListRow, QuantitySelector } from '@/components/shared';
import { IconButton } from '@/components/ui';
import { formatFeatName } from '@/lib/leveled-feats';
import { X } from 'lucide-react';
import { toLeveledFeatLike, type CodexFeatLike } from './admin-archetype-path-form';

/** Selected feats as expandable rows so admins can read Codex descriptions after picking. */
export function SelectedFeatRows({
  featIds,
  featById,
  onRemove,
}: {
  featIds: string[];
  featById: Map<string, CodexFeatLike>;
  onRemove: (id: string) => void;
}) {
  if (featIds.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {featIds.map((id) => {
        const feat = featById.get(id);
        const name = feat ? formatFeatName(toLeveledFeatLike(feat)) || id : id;
        const description = feat?.description?.trim() || 'No description in Codex.';
        return (
          <GridListRow
            key={id}
            id={id}
            name={name}
            description={description}
            compact
            onDelete={() => onRemove(id)}
          />
        );
      })}
    </div>
  );
}

/** Quantity row for armaments / equipment — full-width so label and controls do not overlap. */
export function PathQuantityRow({
  label,
  quantity,
  onQuantityChange,
  onRemove,
  removeLabel,
}: {
  label: string;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border-light bg-surface px-3 py-2 min-h-[44px]">
      <span className="text-sm text-text-primary min-w-0 flex-1 truncate" title={label}>
        {label}
      </span>
      <QuantitySelector
        quantity={quantity}
        onChange={onQuantityChange}
        min={1}
        className="shrink-0"
        decrementLabel={`Decrease quantity for ${label}`}
        incrementLabel={`Increase quantity for ${label}`}
      />
      <IconButton
        variant="ghost"
        size="sm"
        className="shrink-0 min-h-[44px] min-w-[44px]"
        onClick={onRemove}
        label={removeLabel}
      >
        <X className="w-4 h-4" />
      </IconButton>
    </div>
  );
}
