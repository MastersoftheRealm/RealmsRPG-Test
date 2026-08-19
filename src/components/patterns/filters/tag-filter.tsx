/**
 * TagFilter Component
 * ====================
 * Tag filter with multi-select chips and Any/All toggle.
 * Matches vanilla site's tag filter behavior.
 */

'use client';

import { useId, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Chip } from '@/components/ui';
import { FilterNativeSelect } from './filter-native-select';
import { dedupeStrings } from './filter-utils';

interface TagFilterProps {
  label?: string | undefined;
  placeholder?: string | undefined;
  tags: string[];
  selectedTags: string[];
  tagMode: 'any' | 'all';
  onSelect: (tag: string) => void;
  onRemove: (tag: string) => void;
  onModeChange: (mode: 'any' | 'all') => void;
  className?: string | undefined;
}

export function TagFilter({
  label = 'Tags',
  placeholder = 'Choose tag',
  tags,
  selectedTags,
  tagMode,
  onSelect,
  onRemove,
  onModeChange,
  className = '',
}: TagFilterProps) {
  const id = useId();
  // Radio-group scope is the whole document, so two mounted TagFilters would
  // share one group and silently clear each other's mode.
  const tagModeName = `${id}-tagMode`;
  const uniqueTags = useMemo(() => dedupeStrings(tags), [tags]);
  const availableTags = uniqueTags.filter((t) => !selectedTags.includes(t));

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedTags.includes(value)) {
      onSelect(value);
      e.target.value = '';
    }
  };

  return (
    <div className={cn('filter-group', className)}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-text-secondary">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <FilterNativeSelect
          id={id}
          onChange={handleChange}
          defaultValue=""
          wrapperClassName="min-w-0 flex-1"
        >
          <option value="">{placeholder}</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </FilterNativeSelect>
        <div
          role="group"
          aria-label="Tag match mode"
          className="flex min-h-11 items-center gap-2 rounded-md bg-surface-alt px-3"
        >
          <label className="flex cursor-pointer items-center gap-1">
            <input
              type="radio"
              name={tagModeName}
              checked={tagMode === 'any'}
              onChange={() => onModeChange('any')}
              className="h-4 w-4 text-primary-link-fg focus:ring-primary-outline-border"
            />
            <span className="text-sm">Any</span>
          </label>
          <label className="flex cursor-pointer items-center gap-1">
            <input
              type="radio"
              name={tagModeName}
              checked={tagMode === 'all'}
              onChange={() => onModeChange('all')}
              className="h-4 w-4 text-primary-link-fg focus:ring-primary-outline-border"
            />
            <span className="text-sm">All</span>
          </label>
        </div>
      </div>
      {selectedTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Chip key={tag} variant="primary" size="sm" onRemove={() => onRemove(tag)}>
              {tag}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
