/**
 * Library Page
 * =============
 * User's personal library of created powers, techniques, items, and creatures.
 * Uses unified GridListRow component with grid-aligned rows matching Codex style.
 * Styled consistently with the Codex page.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Wand2, Swords, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProtectedRoute } from '@/components/layout';
import { PageContainer, PageHeader, TabNavigation, Button } from '@/components/ui';
import { 
  GridListRow,
  CreatureStatBlock, 
  DeleteConfirmModal,
  SearchInput,
  SortHeader,
  ColumnHeaders,
  ListContainer,
  LoadingSpinner,
  ErrorDisplay,
  ListEmptyState,
  type ChipData,
} from '@/components/shared';
import {
  derivePowerDisplay,
  formatPowerDamage,
} from '@/lib/calculators/power-calc';
import {
  deriveTechniqueDisplay,
  formatTechniqueDamage,
} from '@/lib/calculators/technique-calc';
import {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  formatRange as formatItemRange,
  formatDamage as formatItemDamage,
} from '@/lib/calculators/item-calc';
import {
  useUserPowers,
  useUserTechniques,
  useUserItems,
  useUserCreatures,
  useDeletePower,
  useDeleteTechnique,
  useDeleteItem,
  useDeleteCreature,
  useDuplicatePower,
  useDuplicateTechnique,
  useDuplicateItem,
  useDuplicateCreature,
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

// Grid column definitions matching vanilla site
const POWER_GRID_COLUMNS = '1.5fr 0.8fr 1fr 1fr 0.8fr 1fr 1fr 40px';
const TECHNIQUE_GRID_COLUMNS = '1.5fr 0.8fr 0.8fr 1fr 1fr 1fr 40px';
const ARMAMENT_GRID_COLUMNS = '1.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 40px';

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
  
  const tabsWithCounts = TABS.map(tab => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    badge: counts[tab.id].toString(),
  }));
  
  return (
    <PageContainer size="xl">
      {/* Header with Create Button */}
      <PageHeader
        title="My Library"
        description="Your custom powers, techniques, armaments, and creatures"
        actions={
          <Link href={currentTab.createHref}>
            <Button variant="primary">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{currentTab.createLabel}</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        }
      />
      
      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabsWithCounts}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabId)}
        variant="underline"
        className="mb-6"
      />
      
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
    </PageContainer>
  );
}

// =============================================================================
// Powers Tab - Grid-aligned rows matching vanilla site
// =============================================================================

interface TabProps {
  onDelete: (item: DisplayItem) => void;
}

// Power header columns matching vanilla site
const POWER_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'energy', label: 'Energy' },
  { key: 'action', label: 'Action' },
  { key: 'duration', label: 'Duration' },
  { key: 'range', label: 'Range' },
  { key: 'area', label: 'Area' },
  { key: 'damage', label: 'Damage' },
];

function PowersTab({ onDelete }: TabProps) {
  const router = useRouter();
  const { data: powers, isLoading, error } = useUserPowers();
  const { data: partsDb = [] } = usePowerParts();
  const duplicatePower = useDuplicatePower();
  const [search, setSearch] = useState('');
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });
  
  // Transform powers to display format
  const cardData = useMemo(() => {
    if (!powers || !partsDb.length) return [];
    
    return powers.map(power => {
      const display = derivePowerDisplay(
        {
          name: power.name,
          description: power.description,
          parts: power.parts || [],
          damage: power.damage,
          // Pass directly saved fields for range, area, duration, actionType
          actionType: power.actionType,
          isReaction: power.isReaction,
          range: power.range,
          area: power.area,
          duration: power.duration,
        },
        partsDb
      );
      
      const damageStr = formatPowerDamage(power.damage);
      
      // Transform parts to ChipData format
      const parts: ChipData[] = display.partChips.map(chip => ({
        name: chip.text.split(' | TP:')[0].replace(/\s*\(Opt\d+ \d+\)/g, '').trim(),
        description: chip.description,
        cost: chip.finalTP,
        costLabel: 'TP',
      }));
      
      return {
        id: power.docId,
        name: display.name,
        description: display.description,
        energy: display.energy,
        action: display.actionType,
        duration: display.duration,
        range: display.range,
        area: display.area,
        damage: damageStr,
        tp: display.tp,
        parts,
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
      const col = sortState.col;
      const aVal = a[col as keyof typeof a];
      const bVal = b[col as keyof typeof b];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortState.dir * (aVal - bVal);
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortState.dir * aVal.localeCompare(bVal);
      }
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
          <Button asChild>
            <Link href="/power-creator">
              <Plus className="w-4 h-4" />
              Create Power
            </Link>
          </Button>
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
      
      {/* Column Headers - Grid aligned */}
      <div 
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: POWER_GRID_COLUMNS }}
      >
        {POWER_COLUMNS.map(col => (
          <SortHeader
            key={col.key}
            label={col.label.toUpperCase()}
            col={col.key}
            sortState={sortState}
            onSort={handleSort}
          />
        ))}
      </div>
      
      {/* Power List */}
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingSpinner />
        ) : filteredData.length === 0 ? (
          <div className="py-12 text-center text-text-muted">No powers match your search.</div>
        ) : (
          filteredData.map(power => (
            <GridListRow
              key={power.id}
              id={power.id}
              name={power.name}
              description={power.description}
              gridColumns={POWER_GRID_COLUMNS}
              columns={[
                { key: 'Energy', value: power.energy, highlight: true },
                { key: 'Action', value: power.action },
                { key: 'Duration', value: power.duration },
                { key: 'Range', value: power.range },
                { key: 'Area', value: power.area },
                { key: 'Damage', value: power.damage },
              ]}
              chips={power.parts}
              chipsLabel="Parts & Proficiencies"
              totalCost={power.tp}
              costLabel="TP"
              onEdit={() => window.open(`/power-creator?edit=${power.id}`, '_blank')}
              onDelete={() => onDelete({ id: power.id, name: power.name } as DisplayItem)}
              onDuplicate={() => duplicatePower.mutate(power.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Techniques Tab - Grid-aligned rows matching vanilla site
// =============================================================================

// Technique header columns matching vanilla site
const TECHNIQUE_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'energy', label: 'Energy' },
  { key: 'tp', label: 'TP' },
  { key: 'action', label: 'Action' },
  { key: 'weapon', label: 'Weapon' },
  { key: 'damage', label: 'Damage' },
];

function TechniquesTab({ onDelete }: TabProps) {
  const router = useRouter();
  const { data: techniques, isLoading, error } = useUserTechniques();
  const { data: partsDb = [] } = useTechniqueParts();
  const duplicateTechnique = useDuplicateTechnique();
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
      
      const damageStr = formatTechniqueDamage(tech.damage?.[0]);
      
      // Transform parts to ChipData format
      const parts: ChipData[] = display.partChips.map(chip => ({
        name: chip.text.split(' | TP:')[0].replace(/\s*\(Opt\d+ \d+\)/g, '').trim(),
        description: chip.description,
        cost: chip.finalTP,
        costLabel: 'TP',
      }));
      
      return {
        id: tech.docId,
        name: display.name,
        description: display.description,
        energy: display.energy,
        tp: display.tp,
        action: display.actionType,
        weapon: display.weaponName || '-',
        damage: damageStr,
        parts,
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
        t.weapon.toLowerCase().includes(searchLower)
      );
    }
    
    result = [...result].sort((a, b) => {
      const col = sortState.col;
      const aVal = a[col as keyof typeof a];
      const bVal = b[col as keyof typeof b];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortState.dir * (aVal - bVal);
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortState.dir * aVal.localeCompare(bVal);
      }
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
          <Button asChild>
            <Link href="/technique-creator">
              <Plus className="w-4 h-4" />
              Create Technique
            </Link>
          </Button>
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
      
      {/* Column Headers - Grid aligned */}
      <div 
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: TECHNIQUE_GRID_COLUMNS }}
      >
        {TECHNIQUE_COLUMNS.map(col => (
          <SortHeader
            key={col.key}
            label={col.label.toUpperCase()}
            col={col.key}
            sortState={sortState}
            onSort={handleSort}
          />
        ))}
      </div>
      
      {/* Technique List */}
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingSpinner />
        ) : filteredData.length === 0 ? (
          <div className="py-12 text-center text-text-muted">No techniques match your search.</div>
        ) : (
          filteredData.map(tech => (
            <GridListRow
              key={tech.id}
              id={tech.id}
              name={tech.name}
              description={tech.description}
              gridColumns={TECHNIQUE_GRID_COLUMNS}
              columns={[
                { key: 'Energy', value: tech.energy, highlight: true },
                { key: 'TP', value: tech.tp },
                { key: 'Action', value: tech.action },
                { key: 'Weapon', value: tech.weapon },
                { key: 'Damage', value: tech.damage },
              ]}
              chips={tech.parts}
              chipsLabel="Parts & Proficiencies"
              totalCost={tech.tp}
              costLabel="TP"
              onEdit={() => window.open(`/technique-creator?edit=${tech.id}`, '_blank')}
              onDelete={() => onDelete({ id: tech.id, name: tech.name } as DisplayItem)}
              onDuplicate={() => duplicateTechnique.mutate(tech.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Items Tab - Grid-aligned rows matching vanilla site
// =============================================================================

// Armament header columns matching vanilla site
const ARMAMENT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'rarity', label: 'Rarity' },
  { key: 'currency', label: 'Currency' },
  { key: 'tp', label: 'TP' },
  { key: 'range', label: 'Range' },
  { key: 'damage', label: 'Damage' },
];

// Helper to format damage from various formats (string, object, or array)
function formatDamageValue(damage: unknown): string {
  if (!damage) return '';
  
  // If it's already a string, return it
  if (typeof damage === 'string') {
    return damage;
  }
  
  // If it's an array, format each entry and join
  if (Array.isArray(damage)) {
    const formatted = damage.map(d => {
      if (typeof d === 'string') return d;
      if (typeof d === 'object' && d !== null) {
        const entry = d as { size?: number | string; amount?: number | string; type?: string };
        const parts: string[] = [];
        if (entry.amount && entry.size) {
          parts.push(`${entry.amount}d${entry.size}`);
        } else if (entry.amount) {
          parts.push(String(entry.amount));
        }
        if (entry.type && entry.type !== 'none') {
          parts.push(String(entry.type));
        }
        return parts.join(' ');
      }
      return '';
    }).filter(Boolean);
    return formatted.join(', ') || '';
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
    
    if (d.type && d.type !== 'none') {
      parts.push(String(d.type));
    }
    
    return parts.join(' ');
  }
  
  return '';
}

function ItemsTab({ onDelete }: TabProps) {
  const router = useRouter();
  const { data: items, isLoading, error } = useUserItems();
  const { data: propertiesDb = [] } = useItemProperties();
  const duplicateItem = useDuplicateItem();
  const [search, setSearch] = useState('');
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });
  
  // Transform items to display format with property chips
  const cardData = useMemo(() => {
    if (!items) return [];
    
    return items.map(item => {
      // Calculate item costs for currency and rarity
      const costs = calculateItemCosts(item.properties || [], propertiesDb);
      const { currencyCost, rarity } = calculateCurrencyCostAndRarity(costs.totalCurrency, costs.totalIP);
      
      // Format range from properties
      const rangeStr = formatItemRange(item.properties || []);
      
      // Build property chips from the database
      const parts: ChipData[] = (item.properties || []).map(prop => {
        const propId = typeof prop === 'string' ? null : prop.id;
        const propName = typeof prop === 'string' ? prop : prop.name || '';
        const optLevel = typeof prop === 'string' ? 1 : prop.op_1_lvl || 1;
        
        // Find property in database
        const dbProp = propId 
          ? propertiesDb.find(p => String(p.id) === String(propId))
          : propertiesDb.find(p => p.name?.toLowerCase() === propName.toLowerCase());
        
        const baseTp = dbProp?.base_tp ?? dbProp?.tp_cost ?? 0;
        
        return {
          name: dbProp?.name || propName,
          description: dbProp?.description || '',
          cost: baseTp * optLevel,
          costLabel: 'TP',
          level: optLevel > 1 ? optLevel : undefined,
        };
      });
      
      // Calculate total TP
      const totalTP = parts.reduce((sum, p) => sum + (p.cost || 0), 0);
      
      // Determine item type label
      const typeLabel = item.type === 'weapon' ? 'Weapon' 
        : item.type === 'armor' ? 'Armor' 
        : 'Equipment';
      
      // Format damage
      const formattedDamage = formatDamageValue(item.damage);
      
      return {
        id: item.docId,
        name: item.name,
        description: item.description || '',
        type: typeLabel,
        rarity: rarity,
        currency: Math.round(currencyCost),
        tp: Math.round(totalTP),
        range: rangeStr || '-',
        damage: formattedDamage || '-',
        parts,
      };
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
      const col = sortState.col;
      const aVal = a[col as keyof typeof a];
      const bVal = b[col as keyof typeof b];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortState.dir * (aVal - bVal);
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortState.dir * aVal.localeCompare(bVal);
      }
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
          <Button asChild>
            <Link href="/item-creator">
              <Plus className="w-4 h-4" />
              Create Armament
            </Link>
          </Button>
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
      
      {/* Column Headers - Grid aligned */}
      <div 
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: ARMAMENT_GRID_COLUMNS }}
      >
        {ARMAMENT_COLUMNS.map(col => (
          <SortHeader
            key={col.key}
            label={col.label.toUpperCase()}
            col={col.key}
            sortState={sortState}
            onSort={handleSort}
          />
        ))}
      </div>
      
      {/* Armament List */}
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingSpinner />
        ) : filteredData.length === 0 ? (
          <div className="py-12 text-center text-text-muted">No armaments match your search.</div>
        ) : (
          filteredData.map(item => (
            <GridListRow
              key={item.id}
              id={item.id}
              name={item.name}
              description={item.description}
              gridColumns={ARMAMENT_GRID_COLUMNS}
              columns={[
                { key: 'Type', value: item.type },
                { key: 'Rarity', value: item.rarity },
                { key: 'Currency', value: item.currency },
                { key: 'TP', value: item.tp, highlight: true },
                { key: 'Range', value: item.range },
                { key: 'Damage', value: item.damage },
              ]}
              chips={item.parts}
              chipsLabel="Properties & Proficiencies"
              totalCost={item.tp}
              costLabel="TP"
              onEdit={() => window.open(`/item-creator?edit=${item.id}`, '_blank')}
              onDelete={() => onDelete({ id: item.id, name: item.name } as DisplayItem)}
              onDuplicate={() => duplicateItem.mutate(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Creatures Tab
// =============================================================================

function CreaturesTab({ onDelete }: TabProps) {
  const router = useRouter();
  const { data: creatures, isLoading, error } = useUserCreatures();
  const duplicateCreature = useDuplicateCreature();
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
          <Button asChild>
            <Link href="/creature-creator">
              <Plus className="w-4 h-4" />
              Create Creature
            </Link>
          </Button>
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
        <div className="py-12 text-center text-text-muted">No creatures match your search.</div>
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
              onEdit={() => window.open(`/creature-creator?edit=${creature.docId}`, '_blank')}
              onDelete={() => onDelete({ id: creature.docId, name: creature.name } as DisplayItem)}
              onDuplicate={() => duplicateCreature.mutate(creature.docId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
