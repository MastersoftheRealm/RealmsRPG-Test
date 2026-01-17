/**
 * Library Page
 * =============
 * User's personal library of created powers, techniques, items, and creatures.
 * Uses unified AbilityCard component with CRUD operations.
 * Styled consistently with the Codex page.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Wand2, Swords, Shield, Users } from 'lucide-react';
import { cn, transformPowerToCardData, transformTechniqueToCardData, transformArmamentToCardData } from '@/lib/utils';
import { ProtectedRoute } from '@/components/layout';
import { 
  AbilityCard, 
  CreatureStatBlock, 
  DeleteConfirmModal,
  SearchInput,
  SortHeader,
  ResultsCount,
  ColumnHeaders,
  ListContainer,
  LoadingSpinner,
  ErrorDisplay,
  ListEmptyState,
} from '@/components/shared';
import type { PartChip } from '@/components/shared';
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
import type { DisplayItem } from '@/types';

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
  
  // Delete mutations
  const deletePower = useDeletePower();
  const deleteTechnique = useDeleteTechnique();
  const deleteItem = useDeleteItem();
  const deleteCreature = useDeleteCreature();
  
  const counts: Record<TabId, number> = {
    powers: powers.length,
    techniques: techniques.length,
    items: items.length,
    creatures: creatures.length,
  };
  
  const currentTab = TABS.find(t => t.id === activeTab)!;
  
  const isDeleting = deletePower.isPending || deleteTechnique.isPending || 
                     deleteItem.isPending || deleteCreature.isPending;
  
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      switch (deleteConfirm.type) {
        case 'powers':
          await deletePower.mutateAsync(deleteConfirm.item.id);
          break;
        case 'techniques':
          await deleteTechnique.mutateAsync(deleteConfirm.item.id);
          break;
        case 'items':
          await deleteItem.mutateAsync(deleteConfirm.item.id);
          break;
        case 'creatures':
          await deleteCreature.mutateAsync(deleteConfirm.item.id);
          break;
      }
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header - Matching Codex style */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Library</h1>
            <p className="text-gray-600 mt-1">
              Your custom powers, techniques, armaments, and creatures
            </p>
          </div>
          <Link
            href={currentTab.createHref}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{currentTab.createLabel}</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>
      </div>
      
      {/* Tab Navigation - Matching Codex style */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full',
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600'
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
          itemName={deleteConfirm.item.name}
          itemType={deleteConfirm.type.slice(0, -1)}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

// =============================================================================
// Powers Tab
// =============================================================================

interface TabProps {
  onDelete: (item: DisplayItem) => void;
}

function PowersTab({ onDelete }: TabProps) {
  const { data: powers, isLoading, error } = useUserPowers();
  const { data: partsDb = [] } = usePowerParts();
  const [search, setSearch] = useState('');
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });
  
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
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }
    
    result = [...result].sort((a, b) => {
      if (sortState.col === 'name') return sortState.dir * a.name.localeCompare(b.name);
      if (sortState.col === 'energy') return sortState.dir * (a.energy - b.energy);
      if (sortState.col === 'tp') return sortState.dir * (a.tp - b.tp);
      return 0;
    });
    
    return result;
  }, [cardData, search, sortState]);
  
  const handleSort = useCallback((col: string) => {
    setSortState(prev => ({
      col,
      dir: prev.col === col ? (prev.dir === 1 ? -1 : 1) : 1,
    }));
  }, []);
  
  if (error) {
    return <ErrorDisplay message="Failed to load powers" subMessage="Please try again later" />;
  }
  
  if (!isLoading && cardData.length === 0) {
    return (
      <ListEmptyState
        icon={<Wand2 className="w-8 h-8" />}
        title="No powers yet"
        message="Create your first power to see it here in your library."
        action={
          <Link
            href="/power-creator"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Power
          </Link>
        }
      />
    );
  }
  
  return (
    <div>
      {/* Search Bar */}
      <div className="mb-4">
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder="Search powers..." 
        />
      </div>
      
      {/* Results Count - Above headers to match Codex */}
      <ResultsCount count={filteredData.length} itemLabel="power" isLoading={isLoading} />
      
      {/* Column Headers */}
      <ColumnHeaders
        columns={[
          { key: 'name', label: 'Name', width: '2fr' },
          { key: 'energy', label: 'Energy', width: '1fr' },
          { key: 'tp', label: 'TP', width: '1fr' },
        ]}
        sortState={sortState}
        onSort={handleSort}
        className="grid-cols-3"
      />
      
      {/* Power Cards */}
      {isLoading ? (
        <LoadingSpinner />
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

// =============================================================================
// Techniques Tab
// =============================================================================

function TechniquesTab({ onDelete }: TabProps) {
  const { data: techniques, isLoading, error } = useUserTechniques();
  const { data: partsDb = [] } = useTechniqueParts();
  const [search, setSearch] = useState('');
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });
  
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
      if (sortState.col === 'name') return sortState.dir * a.name.localeCompare(b.name);
      if (sortState.col === 'energy') return sortState.dir * (a.energy - b.energy);
      if (sortState.col === 'tp') return sortState.dir * (a.tp - b.tp);
      return 0;
    });
    
    return result;
  }, [cardData, search, sortState]);
  
  const handleSort = useCallback((col: string) => {
    setSortState(prev => ({
      col,
      dir: prev.col === col ? (prev.dir === 1 ? -1 : 1) : 1,
    }));
  }, []);
  
  if (error) {
    return <ErrorDisplay message="Failed to load techniques" subMessage="Please try again later" />;
  }
  
  if (!isLoading && cardData.length === 0) {
    return (
      <ListEmptyState
        icon={<Swords className="w-8 h-8" />}
        title="No techniques yet"
        message="Create your first technique to see it here in your library."
        action={
          <Link
            href="/technique-creator"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Technique
          </Link>
        }
      />
    );
  }
  
  return (
    <div>
      <div className="mb-4">
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder="Search techniques..." 
        />
      </div>
      
      {/* Results Count - Above headers to match Codex */}
      <ResultsCount count={filteredData.length} itemLabel="technique" isLoading={isLoading} />
      
      <ColumnHeaders
        columns={[
          { key: 'name', label: 'Name', width: '2fr' },
          { key: 'energy', label: 'Energy', width: '1fr' },
          { key: 'tp', label: 'TP', width: '1fr' },
        ]}
        sortState={sortState}
        onSort={handleSort}
        className="grid-cols-3"
      />
      
      {isLoading ? (
        <LoadingSpinner />
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

// =============================================================================
// Items Tab - Using AbilityCard with property chips
// =============================================================================

// Helper to format damage from various formats (string or object)
function formatDamageValue(damage: unknown): string {
  if (!damage) return '';
  
  // If it's already a string, return it
  if (typeof damage === 'string') {
    return damage;
  }
  
  // If it's an object with {size, amount, type}, format it
  if (typeof damage === 'object' && damage !== null) {
    const d = damage as { size?: number | string; amount?: number | string; type?: string };
    const parts: string[] = [];
    
    // Format as "XdY type" (e.g., "2d6 fire")
    if (d.amount && d.size) {
      parts.push(`${d.amount}d${d.size}`);
    } else if (d.amount) {
      parts.push(String(d.amount));
    }
    
    if (d.type) {
      parts.push(String(d.type));
    }
    
    return parts.join(' ');
  }
  
  return '';
}

function ItemsTab({ onDelete }: TabProps) {
  const { data: items, isLoading, error } = useUserItems();
  const { data: propertiesDb = [] } = useItemProperties();
  const [search, setSearch] = useState('');
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });
  
  // Transform items to AbilityCard format with property chips
  const cardData = useMemo(() => {
    if (!items) return [];
    
    return items.map(item => {
      // Build properties with full data from the database
      const properties = (item.properties || []).map(prop => {
        const propId = typeof prop === 'string' ? null : prop.id;
        const propName = typeof prop === 'string' ? prop : prop.name || '';
        const optLevel = typeof prop === 'string' ? 1 : prop.op_1_lvl || 1;
        
        // Find property in database
        const dbProp = propId 
          ? propertiesDb.find(p => String(p.id) === String(propId))
          : propertiesDb.find(p => p.name.toLowerCase() === propName.toLowerCase());
        
        const tpCost = dbProp?.base_tp ?? dbProp?.tp_cost ?? 0;
        
        return {
          id: propId || propName,
          name: dbProp?.name || propName,
          description: dbProp?.description || '',
          tpCost: tpCost * optLevel,
          optionLevels: { opt1: optLevel > 1 ? optLevel : undefined },
        };
      });
      
      // Calculate total TP
      const totalTP = properties.reduce((sum, p) => sum + (p.tpCost || 0), 0);
      
      // Determine item type label
      const typeLabel = item.type === 'weapon' ? 'Weapon' 
        : item.type === 'armor' ? 'Armor' 
        : 'Equipment';
      
      // Format damage (handle both string and object formats)
      const formattedDamage = formatDamageValue(item.damage);
      
      return transformArmamentToCardData(
        item.docId,
        item.name,
        item.description || '',
        properties,
        {
          damage: formattedDamage,
          defense: item.armorValue,
          type: typeLabel,
        },
        totalTP
      );
    });
  }, [items, propertiesDb]);
  
  const filteredData = useMemo(() => {
    let result = cardData;
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.parts.some(p => p.name.toLowerCase().includes(searchLower))
      );
    }
    
    result = [...result].sort((a, b) => {
      if (sortState.col === 'name') return sortState.dir * a.name.localeCompare(b.name);
      if (sortState.col === 'tp') return sortState.dir * (a.totalTP - b.totalTP);
      return 0;
    });
    
    return result;
  }, [cardData, search, sortState]);
  
  const handleSort = useCallback((col: string) => {
    setSortState(prev => ({
      col,
      dir: prev.col === col ? (prev.dir === 1 ? -1 : 1) : 1,
    }));
  }, []);
  
  if (error) {
    return <ErrorDisplay message="Failed to load armaments" subMessage="Please try again later" />;
  }
  
  if (!isLoading && cardData.length === 0) {
    return (
      <ListEmptyState
        icon={<Shield className="w-8 h-8" />}
        title="No armaments yet"
        message="Create your first weapon, armor, or equipment to see it here."
        action={
          <Link
            href="/item-creator"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Armament
          </Link>
        }
      />
    );
  }
  
  return (
    <div>
      <div className="mb-4">
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder="Search armaments..." 
        />
      </div>
      
      {/* Results Count - Above headers to match Codex */}
      <ResultsCount count={filteredData.length} itemLabel="armament" isLoading={isLoading} />
      
      <ColumnHeaders
        columns={[
          { key: 'name', label: 'Name', width: '2fr' },
          { key: 'tp', label: 'TP', width: '1fr' },
        ]}
        sortState={sortState}
        onSort={handleSort}
        className="grid-cols-2"
      />
      
      {isLoading ? (
        <LoadingSpinner />
      ) : filteredData.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No armaments match your search.</div>
      ) : (
        <div className="space-y-3">
          {filteredData.map(item => (
            <AbilityCard
              key={item.id}
              id={item.id}
              name={item.name}
              description={item.description}
              type="armament"
              stats={item.stats}
              parts={item.parts}
              partsLabel="Properties & Proficiencies"
              totalTP={item.totalTP}
              damage={item.damage}
              showActions
              onEdit={() => window.location.href = `/item-creator?edit=${item.id}`}
              onDelete={() => onDelete({ id: item.id, name: item.name } as DisplayItem)}
              onDuplicate={() => window.location.href = `/item-creator?copy=${item.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Creatures Tab
// =============================================================================

function CreaturesTab({ onDelete }: TabProps) {
  const { data: creatures, isLoading, error } = useUserCreatures();
  const [search, setSearch] = useState('');
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });
  
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
        const { col, dir } = sortState;
        if (col === 'name') return dir * (a.name || '').localeCompare(b.name || '');
        if (col === 'level') return dir * ((a.level ?? 0) - (b.level ?? 0));
        return 0;
      });
  }, [creatures, search, sortState]);
  
  const handleSort = useCallback((col: string) => {
    setSortState(prev => ({
      col,
      dir: prev.col === col ? (prev.dir === 1 ? -1 : 1) : 1,
    }));
  }, []);
  
  if (error) {
    return <ErrorDisplay message="Failed to load creatures" subMessage="Please try again later" />;
  }
  
  if (!isLoading && (!creatures || creatures.length === 0)) {
    return (
      <ListEmptyState
        icon={<Users className="w-8 h-8" />}
        title="No creatures yet"
        message="Create your first creature to see it here in your library."
        action={
          <Link
            href="/creature-creator"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Creature
          </Link>
        }
      />
    );
  }
  
  return (
    <div>
      <div className="mb-4">
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder="Search creatures..." 
        />
      </div>
      
      {/* Results Count - Above headers to match Codex */}
      <ResultsCount count={filteredCreatures.length} itemLabel="creature" isLoading={isLoading} />
      
      <ColumnHeaders
        columns={[
          { key: 'name', label: 'Name', width: '2fr' },
          { key: 'level', label: 'Level', width: '1fr' },
        ]}
        sortState={sortState}
        onSort={handleSort}
        className="grid-cols-2"
      />
      
      {isLoading ? (
        <LoadingSpinner />
      ) : filteredCreatures.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No creatures match your search.</div>
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
