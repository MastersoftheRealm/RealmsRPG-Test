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
  label?: string;
  placeholder?: string;
  tags: string[];
  selectedTags: string[];
  tagMode: 'any' | 'all';
  onSelect: (tag: string) => void;
  onRemove: (tag: string) => void;
  onModeChange: (mode: 'any' | 'all') => void;
  className?: string;
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
  const uniqueTags = useMemo(() => dedupeStrings(tags), [tags]);
  const availableTags = uniqueTags.filter(t => !selectedTags.includes(t));

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedTags.includes(value)) {
      onSelect(value);
      e.target.value = '';
    }
  };

  return (
    <div className={cn('filter-group', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">
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
        <div className="flex items-center gap-2 bg-surface-alt px-3 py-2 rounded-md">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="tagMode"
              checked={tagMode === 'any'}
              onChange={() => onModeChange('any')}
              className="w-4 h-4 text-primary-link-fg focus:ring-primary-outline-border"
            />
            <span className="text-sm">Any</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="tagMode"
              checked={tagMode === 'all'}
              onChange={() => onModeChange('all')}
              className="w-4 h-4 text-primary-link-fg focus:ring-primary-outline-border"
            />
            <span className="text-sm">All</span>
          </label>
        </div>
      </div>
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTags.map(tag => (
            <Chip
              key={tag}
              variant="primary"
              size="sm"
              onRemove={() => onRemove(tag)}
            >
              {tag}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
