/**
 * Library Page
 * =============
 * User's personal library of created powers, techniques, items, and creatures.
 * Uses unified ItemList component with CRUD operations.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Wand2, Swords, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProtectedRoute } from '@/components/layout';
import { ItemList } from '@/components/shared';
import { 
  transformWeapon,
  transformArmor,
  transformEquipment,
  transformCreature 
} from '@/lib/item-transformers';
import {
  derivePowerDisplay,
  formatPowerDamage,
} from '@/lib/calculators/power-calc';
import {
  deriveTechniqueDisplay,
} from '@/lib/calculators/technique-calc';
import {
  useUserPowers,
  useUserTechniques,
  useUserItems,
  useUserCreatures,
  useDeletePower,
  useDeleteTechnique,
  useDeleteItem,
  useDeleteCreature,
  usePowerParts,
  useTechniqueParts,
  useItemProperties,
} from '@/hooks';
import type { DisplayItem, SortOption, ItemActions, ItemStat, ItemDetail } from '@/types';

type TabId = 'powers' | 'techniques' | 'items' | 'creatures';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  createHref: string;
  createLabel: string;
}

const TABS: Tab[] = [
  { id: 'powers', label: 'Powers', icon: <Wand2 className="w-4 h-4" />, createHref: '/power-creator', createLabel: 'Create Power' },
  { id: 'techniques', label: 'Techniques', icon: <Swords className="w-4 h-4" />, createHref: '/technique-creator', createLabel: 'Create Technique' },
  { id: 'items', label: 'Items', icon: <Shield className="w-4 h-4" />, createHref: '/item-creator', createLabel: 'Create Item' },
  { id: 'creatures', label: 'Creatures', icon: <Users className="w-4 h-4" />, createHref: '/creature-creator', createLabel: 'Create Creature' },
];

export default function LibraryPage() {
  return (
    <ProtectedRoute>
      <LibraryContent />
    </ProtectedRoute>
  );
}

function LibraryContent() {
  const [activeTab, setActiveTab] = useState<TabId>('powers');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: TabId; item: DisplayItem } | null>(null);
  
  // Get counts for tab badges
  const { data: powers = [] } = useUserPowers();
  const { data: techniques = [] } = useUserTechniques();
  const { data: items = [] } = useUserItems();
  const { data: creatures = [] } = useUserCreatures();
  
  const counts: Record<TabId, number> = {
    powers: powers.length,
    techniques: techniques.length,
    items: items.length,
    creatures: creatures.length,
  };
  
  const currentTab = TABS.find(t => t.id === activeTab)!;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Library</h1>
          <p className="text-muted-foreground mt-1">
            Your custom powers, techniques, items, and creatures
          </p>
        </div>
        <Link
          href={currentTab.createHref}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {currentTab.createLabel}
        </Link>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {tab.icon}
              {tab.label}
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full',
                activeTab === tab.id
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}>
                {counts[tab.id]}
              </span>
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'powers' && <PowersTab onDelete={(item) => setDeleteConfirm({ type: 'powers', item })} />}
      {activeTab === 'techniques' && <TechniquesTab onDelete={(item) => setDeleteConfirm({ type: 'techniques', item })} />}
      {activeTab === 'items' && <ItemsTab onDelete={(item) => setDeleteConfirm({ type: 'items', item })} />}
      {activeTab === 'creatures' && <CreaturesTab onDelete={(item) => setDeleteConfirm({ type: 'creatures', item })} />}
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          type={deleteConfirm.type}
          item={deleteConfirm.item}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

// =============================================================================
// Tab Components
// =============================================================================

const POWER_SORTS: SortOption[] = [
  { id: 'name', label: 'Name', field: 'name', type: 'string' },
  { id: 'cost', label: 'Energy', field: 'cost', type: 'number' },
];

function PowersTab({ onDelete }: { onDelete: (item: DisplayItem) => void }) {
  const { data: powers, isLoading, error } = useUserPowers();
  const { data: partsDb = [] } = usePowerParts();
  
  const displayItems = useMemo((): DisplayItem[] => {
    if (!powers || !partsDb.length) return [];
    
    return powers.map(power => {
      // Use derivePowerDisplay to calculate all values from parts
      const display = derivePowerDisplay(
        {
          name: power.name,
          description: power.description,
          parts: power.parts || [],
          damage: power.damage,
        },
        partsDb
      );
      
      // Format damage string
      const damageStr = formatPowerDamage(power.damage);
      
      // Build stats array for column display
      const stats: ItemStat[] = [
        { label: 'Energy', value: String(display.energy) },
        { label: 'Action', value: display.actionType },
        { label: 'Duration', value: display.duration },
        { label: 'Range', value: display.range },
        { label: 'Area', value: display.area },
      ];
      if (damageStr) {
        stats.push({ label: 'Damage', value: damageStr });
      }
      
      // Build details for expanded view
      const details: ItemDetail[] = [];
      if (display.tp > 0) {
        details.push({ label: 'Training Points', value: String(display.tp) });
      }
      if (display.tpSources.length > 0) {
        details.push({ label: 'TP Breakdown', value: display.tpSources });
      }
      
      return {
        id: power.docId,
        name: power.name,
        description: power.description,
        category: 'power',
        cost: display.energy,
        costLabel: 'EN',
        stats,
        details,
        badges: [],
        sourceData: power as unknown as Record<string, unknown>,
      } as DisplayItem;
    });
  }, [powers, partsDb]);
  
  const actions: ItemActions = {
    onEdit: (item) => {
      // Navigate to power creator with this power loaded
      window.location.href = `/power-creator?edit=${item.id}`;
    },
    onDelete,
    onDuplicate: (item) => {
      // Navigate to power creator with copy of this power
      window.location.href = `/power-creator?copy=${item.id}`;
    },
  };
  
  if (error) {
    return <ErrorState message="Failed to load powers" />;
  }
  
  if (!isLoading && displayItems.length === 0) {
    return <EmptyState type="powers" href="/power-creator" />;
  }
  
  return (
    <ItemList
      items={displayItems}
      mode="manage"
      layout="list"
      actions={actions}
      sortOptions={POWER_SORTS}
      searchPlaceholder="Search powers..."
      loading={isLoading}
      emptyMessage="No powers found"
    />
  );
}

const TECHNIQUE_SORTS: SortOption[] = [
  { id: 'name', label: 'Name', field: 'name', type: 'string' },
  { id: 'cost', label: 'TP', field: 'cost', type: 'number' },
];

function TechniquesTab({ onDelete }: { onDelete: (item: DisplayItem) => void }) {
  const { data: techniques, isLoading, error } = useUserTechniques();
  const { data: partsDb = [] } = useTechniqueParts();
  
  const displayItems = useMemo((): DisplayItem[] => {
    if (!techniques || !partsDb.length) return [];
    
    return techniques.map(tech => {
      // Use deriveTechniqueDisplay to calculate all values from parts
      const display = deriveTechniqueDisplay(
        {
          name: tech.name,
          description: tech.description,
          parts: tech.parts || [],
          damage: tech.damage?.[0],
          weapon: tech.weapon,
        },
        partsDb
      );
      
      // Build stats array for column display
      const stats: ItemStat[] = [
        { label: 'Energy', value: String(display.energy) },
        { label: 'TP', value: String(display.tp) },
        { label: 'Action', value: display.actionType },
        { label: 'Weapon', value: display.weaponName },
      ];
      if (display.damageStr) {
        stats.push({ label: 'Damage', value: display.damageStr });
      }
      
      // Build details for expanded view
      const details: ItemDetail[] = [];
      if (display.tpSources.length > 0) {
        details.push({ label: 'TP Breakdown', value: display.tpSources });
      }
      
      return {
        id: tech.docId,
        name: tech.name,
        description: tech.description,
        category: 'technique',
        cost: display.tp,
        costLabel: 'TP',
        stats,
        details,
        badges: display.weaponName !== 'Unarmed' ? [{ label: display.weaponName, variant: 'default' as const }] : [],
        sourceData: tech as unknown as Record<string, unknown>,
      } as DisplayItem;
    });
  }, [techniques, partsDb]);
  
  const actions: ItemActions = {
    onEdit: (item) => {
      window.location.href = `/technique-creator?edit=${item.id}`;
    },
    onDelete,
    onDuplicate: (item) => {
      window.location.href = `/technique-creator?copy=${item.id}`;
    },
  };
  
  if (error) {
    return <ErrorState message="Failed to load techniques" />;
  }
  
  if (!isLoading && displayItems.length === 0) {
    return <EmptyState type="techniques" href="/technique-creator" />;
  }
  
  return (
    <ItemList
      items={displayItems}
      mode="manage"
      layout="list"
      actions={actions}
      sortOptions={TECHNIQUE_SORTS}
      searchPlaceholder="Search techniques..."
      loading={isLoading}
      emptyMessage="No techniques found"
    />
  );
}

const ITEM_SORTS: SortOption[] = [
  { id: 'name', label: 'Name', field: 'name', type: 'string' },
  { id: 'type', label: 'Type', field: 'type', type: 'string' },
];

function ItemsTab({ onDelete }: { onDelete: (item: DisplayItem) => void }) {
  const { data: items, isLoading, error } = useUserItems();
  // Properties loaded for future enrichment (property ID to name lookup)
  useItemProperties();
  
  const displayItems = useMemo((): DisplayItem[] => {
    if (!items) return [];
    return items.map(item => {
      if (item.type === 'weapon') {
        return transformWeapon({
          id: item.docId,
          name: item.name,
          description: item.description,
          damage: item.damage,
          properties: item.properties,
          type: 'weapon',
        });
      } else if (item.type === 'armor') {
        return transformArmor({
          id: item.docId,
          name: item.name,
          description: item.description,
          defense: item.armorValue,
          properties: item.properties,
          type: 'armor',
        });
      } else {
        return transformEquipment({
          id: item.docId,
          name: item.name,
          description: item.description,
          type: item.type,
        });
      }
    });
  }, [items]);
  
  const actions: ItemActions = {
    onEdit: (item) => {
      window.location.href = `/item-creator?edit=${item.id}`;
    },
    onDelete,
    onDuplicate: (item) => {
      window.location.href = `/item-creator?copy=${item.id}`;
    },
  };
  
  if (error) {
    return <ErrorState message="Failed to load items" />;
  }
  
  if (!isLoading && displayItems.length === 0) {
    return <EmptyState type="items" href="/item-creator" />;
  }
  
  return (
    <ItemList
      items={displayItems}
      mode="manage"
      layout="list"
      actions={actions}
      sortOptions={ITEM_SORTS}
      searchPlaceholder="Search items..."
      loading={isLoading}
      emptyMessage="No items found"
    />
  );
}

const CREATURE_SORTS: SortOption[] = [
  { id: 'name', label: 'Name', field: 'name', type: 'string' },
  { id: 'level', label: 'Level', field: 'cost', type: 'number' },
];

function CreaturesTab({ onDelete }: { onDelete: (item: DisplayItem) => void }) {
  const { data: creatures, isLoading, error } = useUserCreatures();
  
  const displayItems = useMemo((): DisplayItem[] => {
    if (!creatures) return [];
    return creatures.map(creature => transformCreature({
      id: creature.docId,
      name: creature.name,
      description: creature.description,
      level: creature.level,
      type: creature.type,
      size: creature.size,
      hp: creature.hp,
      abilities: creature.abilities,
    }));
  }, [creatures]);
  
  const actions: ItemActions = {
    onEdit: (item) => {
      window.location.href = `/creature-creator?edit=${item.id}`;
    },
    onDelete,
    onDuplicate: (item) => {
      window.location.href = `/creature-creator?copy=${item.id}`;
    },
  };
  
  if (error) {
    return <ErrorState message="Failed to load creatures" />;
  }
  
  if (!isLoading && displayItems.length === 0) {
    return <EmptyState type="creatures" href="/creature-creator" />;
  }
  
  return (
    <ItemList
      items={displayItems}
      mode="manage"
      layout="list"
      actions={actions}
      sortOptions={CREATURE_SORTS}
      searchPlaceholder="Search creatures..."
      loading={isLoading}
      emptyMessage="No creatures found"
    />
  );
}

// =============================================================================
// Helper Components
// =============================================================================

function EmptyState({ type, href }: { type: string; href: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
        {type === 'powers' && <Wand2 className="w-8 h-8 text-muted-foreground" />}
        {type === 'techniques' && <Swords className="w-8 h-8 text-muted-foreground" />}
        {type === 'items' && <Shield className="w-8 h-8 text-muted-foreground" />}
        {type === 'creatures' && <Users className="w-8 h-8 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        No {type} yet
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Create your first {type.slice(0, -1)} to see it here in your library.
      </p>
      <Link
        href={href}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create {type.slice(0, -1)}
      </Link>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-destructive font-medium">{message}</p>
      <p className="text-muted-foreground text-sm mt-1">Please try again later</p>
    </div>
  );
}

function DeleteConfirmModal({ 
  type, 
  item, 
  onClose 
}: { 
  type: TabId; 
  item: DisplayItem; 
  onClose: () => void;
}) {
  const deletePower = useDeletePower();
  const deleteTechnique = useDeleteTechnique();
  const deleteItem = useDeleteItem();
  const deleteCreature = useDeleteCreature();
  
  const isDeleting = deletePower.isPending || deleteTechnique.isPending || 
                     deleteItem.isPending || deleteCreature.isPending;
  
  const handleDelete = async () => {
    try {
      switch (type) {
        case 'powers':
          await deletePower.mutateAsync(item.id);
          break;
        case 'techniques':
          await deleteTechnique.mutateAsync(item.id);
          break;
        case 'items':
          await deleteItem.mutateAsync(item.id);
          break;
        case 'creatures':
          await deleteCreature.mutateAsync(item.id);
          break;
      }
      onClose();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card rounded-xl shadow-xl border border-border p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Delete {item.name}?
        </h3>
        <p className="text-muted-foreground mb-6">
          This action cannot be undone. This will permanently delete the {type.slice(0, -1)} from your library.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
