/**
 * TagFilter Component
 * ====================
 * Tag filter with multi-select chips and Any/All toggle.
 * Matches vanilla site's tag filter behavior.
 */

'use client';

import { Chip } from '@/components/ui';

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
  const availableTags = tags.filter(t => !selectedTags.includes(t));

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedTags.includes(value)) {
      onSelect(value);
      e.target.value = '';
    }
  };

  return (
    <div className={`filter-group ${className}`}>
      <label className="block text-sm font-medium text-text-secondary mb-1">
        {label}
      </label>
      <div className="flex gap-2 items-center">
        <select
          onChange={handleChange}
          className="flex-1 px-3 py-2 border border-border-light rounded-md bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          defaultValue=""
        >
          <option value="">{placeholder}</option>
          {availableTags.map(tag => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 bg-surface-alt px-3 py-2 rounded-md">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="tagMode"
              checked={tagMode === 'any'}
              onChange={() => onModeChange('any')}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm">Any</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="tagMode"
              checked={tagMode === 'all'}
              onChange={() => onModeChange('all')}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500"
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
