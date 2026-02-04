/**
 * Load From Library Modal
 * ========================
 * Reusable modal for loading saved items from user's library
 * Used by Power Creator, Technique Creator, and Item Creator
 */

'use client';

import { useState, useMemo } from 'react';
import { X, FileText, Zap, Sword, Shield, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchInput, IconButton, Alert, Modal } from '@/components/ui';

export type LibraryItemType = 'power' | 'technique' | 'item' | 'creature';

export interface LibraryItem {
  id: string;
  docId: string;
  name: string;
  description?: string;
}

interface LoadFromLibraryModalProps<T extends LibraryItem> {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: T) => void;
  items: T[] | undefined;
  isLoading: boolean;
  error: Error | null;
  itemType: LibraryItemType;
  title?: string;
}

const TYPE_CONFIG: Record<LibraryItemType, { icon: React.ReactNode; color: string; emptyText: string }> = {
  power: {
    icon: <Zap className="w-5 h-5" />,
    color: 'text-energy',
    emptyText: 'No saved powers found. Create some powers first!',
  },
  technique: {
    icon: <Sword className="w-5 h-5" />,
    color: 'text-martial',
    emptyText: 'No saved techniques found. Create some techniques first!',
  },
  item: {
    icon: <Shield className="w-5 h-5" />,
    color: 'text-tp',
    emptyText: 'No saved items found. Create some items first!',
  },
  creature: {
    icon: <FileText className="w-5 h-5" />,
    color: 'text-success',
    emptyText: 'No saved creatures found. Create some creatures first!',
  },
};

export function LoadFromLibraryModal<T extends LibraryItem>({
  isOpen,
  onClose,
  onSelect,
  items,
  isLoading,
  error,
  itemType,
  title,
}: LoadFromLibraryModalProps<T>) {
  const [search, setSearch] = useState('');
  
  const config = TYPE_CONFIG[itemType];
  const displayTitle = title || `Load ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!search.trim()) return items;
    
    const searchLower = search.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
    );
  }, [items, search]);

  const handleSelect = (item: T) => {
    onSelect(item);
    onClose();
    setSearch('');
  };

  // Custom header for Modal
  const modalHeader = (
    <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={config.color}>{config.icon}</span>
        <h2 className="text-xl font-bold text-text-primary">{displayTitle}</h2>
      </div>
      <IconButton
        label="Close modal"
        variant="ghost"
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </IconButton>
    </div>
  );

  // Custom footer for Modal
  const modalFooter = (
    <div className="px-6 py-4 border-t border-border-light bg-surface-secondary">
      <p className="text-sm text-text-muted text-center">
        {items?.length || 0} {itemType}(s) in your library
      </p>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      header={modalHeader}
      footer={modalFooter}
      showCloseButton={false}
      flexLayout
      contentClassName=""
      className="max-h-[80vh]"
    >
      {/* Search */}
      <div className="px-6 py-3 border-b border-border-light">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={`Search ${itemType}s...`}
          size="sm"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : error ? (
          <Alert variant="danger" className="mx-4">
            Error loading library: {error.message}
          </Alert>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted">
              {items?.length === 0 ? config.emptyText : 'No matching items found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className={cn(
                  'w-full text-left p-4 rounded-lg border border-border-light',
                  'hover:border-primary-300 hover:bg-primary-50 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn('opacity-60', config.color)}>{config.icon}</span>
                  <span className="font-semibold text-text-primary">{item.name}</span>
                </div>
                {item.description && (
                  <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                    {item.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
