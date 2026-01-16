/**
 * Library Page
 * =============
 * User's personal library of created powers, techniques, items, and creatures.
 * Uses unified AbilityCard component with CRUD operations.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Wand2, Swords, Shield, Users, Search, SortAsc, SortDesc } from 'lucide-react';
import { cn, transformPowerToCardData, transformTechniqueToCardData } from '@/lib/utils';
import { ProtectedRoute } from '@/components/layout';
import { ItemList, CreatureStatBlock, AbilityCard } from '@/components/shared';
import type { PartChip } from '@/components/shared';
import { 
  transformWeapon,
  transformArmor,
  transformEquipment,
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
  { id: 'items', label: 'Armaments', icon: <Shield className="w-4 h-4" />, createHref: '/item-creator', createLabel: 'Create Armament' },
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-400 text-white hover:bg-primary-500 transition-colors shadow-sm"
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

const POWER_SORTS = [
  { id: 'name', label: 'Name' },
  { id: 'energy', label: 'Energy' },
  { id: 'tp', label: 'TP' },
];

function PowersTab({ onDelete }: { onDelete: (item: DisplayItem) => void }) {
  const { data: powers, isLoading, error } = useUserPowers();
  const { data: partsDb = [] } = usePowerParts();
  const [search, setSearch] = useState('');
  const [sortState, setSortState] = useState<{ field: string; dir: 1 | -1 }>({ field: 'name', dir: 1 });
  
  // Transform powers to AbilityCard format
  const cardData = useMemo(() => {
    if (!powers || !partsDb.length) return [];
    
    return powers.map(power => {
      const display = derivePowerDisplay(
        {
          name: power.name,
          description: power.description,
          parts: power.parts || [],
          damage: power.damage,
        },
        partsDb
      );
      
      const damageStr = formatPowerDamage(power.damage);
      const cardInfo = transformPowerToCardData(power.docId, display, damageStr);
      
      return {
        ...cardInfo,
        energy: display.energy,
        tp: display.tp,
      };
    });
  }, [powers, partsDb]);
  
  // Filter and sort
  const filteredData = useMemo(() => {
    let result = cardData;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort
    result = [...result].sort((a, b) => {
      if (sortState.field === 'name') {
        return sortState.dir * a.name.localeCompare(b.name);
      }
      if (sortState.field === 'energy') {
        return sortState.dir * (a.energy - b.energy);
      }
      if (sortState.field === 'tp') {
        return sortState.dir * (a.tp - b.tp);
      }
      return 0;
    });
    
    return result;
  }, [cardData, search, sortState]);
  
  if (error) {
    return <ErrorState message="Failed to load powers" />;
  }
  
  if (!isLoading && cardData.length === 0) {
    return <EmptyState type="powers" href="/power-creator" />;
  }
  
  return (
    <div className="space-y-4">
      {/* Search and Sort Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search powers..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortState.field}
            onChange={(e) => setSortState(prev => ({ ...prev, field: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
          >
            {POWER_SORTS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setSortState(prev => ({ ...prev, dir: prev.dir === 1 ? -1 : 1 }))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
          >
            {sortState.dir === 1 ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            <span>{sortState.dir === 1 ? 'Asc' : 'Desc'}</span>
          </button>
        </div>
      </div>
      
      {/* Results count */}
      <div className="text-sm text-gray-500">
        {isLoading ? 'Loading...' : `${filteredData.length} power${filteredData.length !== 1 ? 's' : ''} found`}
      </div>
      
      {/* Power Cards */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading powers...</div>
      ) : filteredData.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No powers match your search.</div>
      ) : (
        <div className="space-y-3">
          {filteredData.map(power => (
            <AbilityCard
              key={power.id}
              id={power.id}
              name={power.name}
              description={power.description}
              type="power"
              stats={power.stats}
              parts={power.parts}
              partsLabel="Parts & Proficiencies"
              totalTP={power.totalTP}
              damage={power.damage}
              showActions
              onEdit={() => window.location.href = `/power-creator?edit=${power.id}`}
              onDelete={() => onDelete({ id: power.id, name: power.name } as DisplayItem)}
              onDuplicate={() => window.location.href = `/power-creator?copy=${power.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const TECHNIQUE_SORTS = [
  { id: 'name', label: 'Name' },
  { id: 'energy', label: 'Energy' },
  { id: 'tp', label: 'TP' },
];

function TechniquesTab({ onDelete }: { onDelete: (item: DisplayItem) => void }) {
  const { data: techniques, isLoading, error } = useUserTechniques();
  const { data: partsDb = [] } = useTechniqueParts();
  const [search, setSearch] = useState('');
  const [sortState, setSortState] = useState<{ field: string; dir: 1 | -1 }>({ field: 'name', dir: 1 });
  
  // Transform techniques to AbilityCard format
  const cardData = useMemo(() => {
    if (!techniques || !partsDb.length) return [];
    
    return techniques.map(tech => {
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
      
      const cardInfo = transformTechniqueToCardData(tech.docId, display);
      
      return {
        ...cardInfo,
        energy: display.energy,
        tp: display.tp,
        weaponName: display.weaponName,
      };
    });
  }, [techniques, partsDb]);
  
  // Filter and sort
  const filteredData = useMemo(() => {
    let result = cardData;
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.weaponName.toLowerCase().includes(searchLower)
      );
    }
    
    result = [...result].sort((a, b) => {
      if (sortState.field === 'name') {
        return sortState.dir * a.name.localeCompare(b.name);
      }
      if (sortState.field === 'energy') {
        return sortState.dir * (a.energy - b.energy);
      }
      if (sortState.field === 'tp') {
        return sortState.dir * (a.tp - b.tp);
      }
      return 0;
    });
    
    return result;
  }, [cardData, search, sortState]);
  
  if (error) {
    return <ErrorState message="Failed to load techniques" />;
  }
  
  if (!isLoading && cardData.length === 0) {
    return <EmptyState type="techniques" href="/technique-creator" />;
  }
  
  return (
    <div className="space-y-4">
      {/* Search and Sort Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search techniques..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortState.field}
            onChange={(e) => setSortState(prev => ({ ...prev, field: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
          >
            {TECHNIQUE_SORTS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setSortState(prev => ({ ...prev, dir: prev.dir === 1 ? -1 : 1 }))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
          >
            {sortState.dir === 1 ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            <span>{sortState.dir === 1 ? 'Asc' : 'Desc'}</span>
          </button>
        </div>
      </div>
      
      {/* Results count */}
      <div className="text-sm text-gray-500">
        {isLoading ? 'Loading...' : `${filteredData.length} technique${filteredData.length !== 1 ? 's' : ''} found`}
      </div>
      
      {/* Technique Cards */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading techniques...</div>
      ) : filteredData.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No techniques match your search.</div>
      ) : (
        <div className="space-y-3">
          {filteredData.map(tech => (
            <AbilityCard
              key={tech.id}
              id={tech.id}
              name={tech.name}
              description={tech.description}
              type="technique"
              stats={tech.stats}
              parts={tech.parts}
              partsLabel="Parts & Proficiencies"
              totalTP={tech.totalTP}
              damage={tech.damage}
              showActions
              onEdit={() => window.location.href = `/technique-creator?edit=${tech.id}`}
              onDelete={() => onDelete({ id: tech.id, name: tech.name } as DisplayItem)}
              onDuplicate={() => window.location.href = `/technique-creator?copy=${tech.id}`}
            />
          ))}
        </div>
      )}
    </div>
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
  { id: 'level', label: 'Level', field: 'level', type: 'number' },
];

function CreaturesTab({ onDelete }: { onDelete: (item: DisplayItem) => void }) {
  const { data: creatures, isLoading, error } = useUserCreatures();
  const [search, setSearch] = useState('');
  const [sortState, setSortState] = useState<{ field: string; dir: 1 | -1 }>({ field: 'name', dir: 1 });
  
  // Filter and sort creatures
  const filteredCreatures = useMemo(() => {
    if (!creatures) return [];
    
    return creatures
      .filter(creature => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
          creature.name?.toLowerCase().includes(searchLower) ||
          creature.type?.toLowerCase().includes(searchLower) ||
          creature.description?.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        const { field, dir } = sortState;
        if (field === 'name') return dir * (a.name || '').localeCompare(b.name || '');
        if (field === 'level') return dir * ((a.level ?? 0) - (b.level ?? 0));
        return 0;
      });
  }, [creatures, search, sortState]);
  
  if (error) {
    return <ErrorState message="Failed to load creatures" />;
  }
  
  if (!isLoading && (!creatures || creatures.length === 0)) {
    return <EmptyState type="creatures" href="/creature-creator" />;
  }
  
  return (
    <div className="space-y-4">
      {/* Search and Sort Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search creatures..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortState.field}
            onChange={(e) => setSortState(prev => ({ ...prev, field: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            {CREATURE_SORTS.map(opt => (
              <option key={opt.id} value={opt.field}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setSortState(prev => ({ ...prev, dir: prev.dir === 1 ? -1 : 1 }))}
            className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground"
          >
            {sortState.dir === 1 ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>
      </div>
      
      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {isLoading ? 'Loading...' : `${filteredCreatures.length} creature${filteredCreatures.length !== 1 ? 's' : ''} found`}
      </div>
      
      {/* Creature Stat Blocks */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading creatures...</div>
      ) : filteredCreatures.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">No creatures match your search.</div>
      ) : (
        <div className="space-y-3">
          {filteredCreatures.map(creature => (
            <CreatureStatBlock
              key={creature.docId}
              creature={{
                id: creature.docId,
                name: creature.name,
                description: creature.description,
                level: creature.level,
                type: creature.type,
                size: creature.size,
                hp: creature.hp,
                hitPoints: creature.hitPoints,
                energyPoints: creature.energyPoints,
                abilities: creature.abilities,
                defenses: creature.defenses,
                powerProficiency: creature.powerProficiency,
                martialProficiency: creature.martialProficiency,
                resistances: creature.resistances,
                weaknesses: creature.weaknesses,
                immunities: creature.immunities,
                conditionImmunities: creature.conditionImmunities,
                senses: creature.senses,
                movementTypes: creature.movementTypes,
                languages: creature.languages,
                skills: creature.skills,
                powers: creature.powers,
                techniques: creature.techniques,
                feats: creature.feats,
                armaments: creature.armaments,
              }}
              onEdit={() => { window.location.href = `/creature-creator?edit=${creature.docId}`; }}
              onDelete={() => onDelete({ id: creature.docId, name: creature.name } as DisplayItem)}
              onDuplicate={() => { window.location.href = `/creature-creator?copy=${creature.docId}`; }}
            />
          ))}
        </div>
      )}
    </div>
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
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-400 text-white hover:bg-primary-500 transition-colors shadow-sm"
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
