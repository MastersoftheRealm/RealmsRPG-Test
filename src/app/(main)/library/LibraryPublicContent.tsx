/**
 * Library Public Content
 * ======================
 * Realms Library lists (Powers, Techniques, Armaments, Creatures) for the Library page.
 * Browse and add to My Library (use as-is or customize). Requires login to add.
 */

'use client';

import { useState, useMemo } from 'react';
import { Plus, Wand2, Swords, Shield, Users } from 'lucide-react';
import {
  GridListRow,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  ListEmptyState,
  ConfirmActionModal,
  type ChipData,
} from '@/components/shared';
import { useToast, IconButton } from '@/components/ui';
import { useSort } from '@/hooks/use-sort';
import {
  useOfficialLibrary,
  useAddOfficialToLibrary,
  usePowerParts,
  useTechniqueParts,
  useItemProperties,
} from '@/hooks';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { deriveTechniqueDisplay, formatTechniqueDamage } from '@/lib/calculators/technique-calc';
import type { ItemPropertyPayload } from '@/lib/calculators/item-calc';
import {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  formatRange as formatItemRange,
  trainingPointsForItemPropertyRef,
} from '@/lib/calculators/item-calc';
import { formatDamageDisplay, formatListCellLabel } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

export type LibraryPublicTabId = 'powers' | 'techniques' | 'empowered-techniques' | 'items' | 'creatures';

const POWER_GRID = '1.5fr 0.8fr 1fr 1fr 0.8fr 1fr 1fr 40px';
const TECHNIQUE_GRID = '1.5fr 0.8fr 0.8fr 1fr 1fr 1fr 40px';
const ITEM_GRID = '1.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 40px';
const CREATURE_GRID = '1.5fr 0.8fr 1fr 40px';

interface LibraryPublicContentProps {
  activeTab: LibraryPublicTabId;
  onLoginRequired: () => void;
  /** When true, show lists without Add to library (e.g. for /browse when not logged in). */
  readOnly?: boolean;
}

export function LibraryPublicContent({ activeTab, onLoginRequired, readOnly = false }: LibraryPublicContentProps) {
  if (activeTab === 'powers') return <PublicPowersList onLoginRequired={onLoginRequired} readOnly={readOnly} />;
  if (activeTab === 'techniques') return <PublicTechniquesList onLoginRequired={onLoginRequired} readOnly={readOnly} />;
  if (activeTab === 'empowered-techniques') return <PublicTechniquesList onLoginRequired={onLoginRequired} readOnly={readOnly} mode="empowered" />;
  if (activeTab === 'items') return <PublicItemsList onLoginRequired={onLoginRequired} readOnly={readOnly} />;
  if (activeTab === 'creatures') return <PublicCreaturesList onLoginRequired={onLoginRequired} readOnly={readOnly} />;
  return null;
}

function getEmpoweredTotals(item: unknown): { energy?: number; tp?: number } {
  const raw = item as Record<string, unknown>;
  const totals = raw.totals as Record<string, unknown> | undefined;
  return {
    energy: typeof totals?.energy === 'number' ? totals.energy : undefined,
    tp: typeof totals?.trainingPoints === 'number' ? totals.trainingPoints : undefined,
  };
}

function PublicPowersList({ onLoginRequired, readOnly = false }: { onLoginRequired: () => void; readOnly?: boolean }) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const { data: items = [], isLoading, error, refetch } = useOfficialLibrary('powers');
  const { data: partsDb = [] } = usePowerParts();
  const addMutation = useAddOfficialToLibrary('powers');
  const [search, setSearch] = useState('');
  const [addConfirm, setAddConfirm] = useState<{ name: string; raw: Record<string, unknown> } | null>(null);
  const { sortState, handleSort, sortItems } = useSort('name');

  const openAddConfirm = (name: string, raw: Record<string, unknown>) => {
    if (readOnly || !user) {
      if (!user) onLoginRequired();
      return;
    }
    setAddConfirm({ name, raw });
  };

  const handleAddConfirm = () => {
    if (!addConfirm) return;
    addMutation.mutate(addConfirm.raw, {
      onSuccess: () => {
        showToast('Added to My Library. You can use it as-is or edit a copy.', 'success');
        setAddConfirm(null);
      },
      onError: (e) => {
        showToast(e?.message ?? 'Failed to add to library', 'error');
      },
    });
  };

  const cardData = useMemo(() => {
    return items.map((p: Record<string, unknown>) => {
      const doc: PowerDocument = {
        name: String(p.name ?? ''),
        description: String(p.description ?? ''),
        parts: Array.isArray(p.parts) ? (p.parts as PowerDocument['parts']) : [],
        damage: p.damage as PowerDocument['damage'],
        actionType: p.actionType as string | undefined,
        isReaction: p.isReaction as boolean | undefined,
        range: p.range as PowerDocument['range'],
        area: p.area as PowerDocument['area'],
        duration: p.duration as PowerDocument['duration'],
      };
      const display = derivePowerDisplay(doc, partsDb);
      const damageStr = formatPowerDamage(doc.damage);
      const parts: ChipData[] = display.partChips.map(chip => ({
        name: chip.text.split(' | TP:')[0].replace(/\s*\(Opt\d+ \d+\)/g, '').trim(),
        description: chip.description,
        cost: chip.finalTP,
        costLabel: 'TP',
      }));
      return {
        id: String(p.id ?? p.docId ?? ''),
        raw: p,
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
  }, [items, partsDb]);

  const filtered = useMemo(() => {
    let r = cardData;
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(x => String(x.name ?? '').toLowerCase().includes(s) || String(x.description ?? '').toLowerCase().includes(s));
    }
    return sortItems(r);
  }, [cardData, search, sortItems]);

  if (error) return <ErrorDisplay message="Failed to load Realms Library powers" onRetry={() => { void refetch(); }} />;
  if (!isLoading && cardData.length === 0) {
    return <ListEmptyState icon={<Wand2 className="w-8 h-8" />} title="No powers yet" message="Official powers will appear here when added to Realms Library." />;
  }

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search powers..." />
      </div>
      <ListHeader
        columns={[
          { key: 'name', label: 'NAME', align: 'left' as const },
          { key: 'energy', label: 'ENERGY', align: 'center' as const },
          { key: 'action', label: 'ACTION', align: 'center' as const },
          { key: 'duration', label: 'DURATION', align: 'center' as const },
          { key: 'range', label: 'RANGE', align: 'center' as const },
          { key: 'area', label: 'AREA', align: 'center' as const },
          { key: 'damage', label: 'DAMAGE', align: 'center' as const },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={POWER_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? <LoadingState /> : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">No powers match your search.</div>
        ) : (
          filtered.map(p => (
            <GridListRow
              key={p.id}
              id={p.id}
              name={p.name}
              description={p.description}
              gridColumns={POWER_GRID}
              columns={[
                { key: 'Energy', value: p.energy, highlight: true, align: 'center' },
                { key: 'Action', value: p.action, align: 'center' },
                { key: 'Duration', value: p.duration, align: 'center' },
                { key: 'Range', value: p.range, align: 'center' },
                { key: 'Area', value: p.area, align: 'center' },
                { key: 'Damage', value: p.damage, align: 'center' },
              ]}
              chips={p.parts}
              chipsLabel="Parts"
              totalCost={p.tp}
              costLabel="TP"
              badges={[{ label: 'Realms', color: 'blue' }]}
              rightSlot={readOnly ? undefined : (
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); openAddConfirm(p.name, p.raw); }}
                  label="Add to my library"
                  className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                >
                  <Plus className="w-4 h-4" />
                </IconButton>
              )}
              onAddToLibrary={readOnly ? undefined : () => openAddConfirm(p.name, p.raw)}
            />
          ))
        )}
      </div>
      <ConfirmActionModal
        isOpen={!readOnly && !!addConfirm}
        onClose={() => setAddConfirm(null)}
        onConfirm={handleAddConfirm}
        title="Add to your library?"
        description={addConfirm ? `Add "${addConfirm.name}" to your library?` : ''}
        confirmLabel="Add"
        loadingLabel="Adding..."
        isLoading={addMutation.isPending}
        icon="publish"
      />
    </div>
  );
}

function PublicTechniquesList({
  onLoginRequired,
  readOnly = false,
  mode = 'standard',
}: {
  onLoginRequired: () => void;
  readOnly?: boolean;
  mode?: 'standard' | 'empowered';
}) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const { data: items = [], isLoading, error, refetch } = useOfficialLibrary(mode === 'empowered' ? 'empowered-techniques' : 'techniques');
  const { data: partsDb = [] } = useTechniqueParts();
  const addMutation = useAddOfficialToLibrary(mode === 'empowered' ? 'empowered-techniques' : 'techniques');
  const [search, setSearch] = useState('');
  const [addConfirm, setAddConfirm] = useState<{ name: string; raw: Record<string, unknown> } | null>(null);
  const { sortState, handleSort, sortItems } = useSort('name');

  const openAddConfirm = (name: string, raw: Record<string, unknown>) => {
    if (readOnly || !user) {
      if (!user) onLoginRequired();
      return;
    }
    setAddConfirm({ name, raw });
  };

  const handleAddConfirm = () => {
    if (!addConfirm) return;
    addMutation.mutate(addConfirm.raw, {
      onSuccess: () => {
        showToast('Added to My Library. You can use it as-is or edit a copy.', 'success');
        setAddConfirm(null);
      },
      onError: (e) => {
        showToast(e?.message ?? 'Failed to add to library', 'error');
      },
    });
  };

  const filteredItems = items;

  const cardData = useMemo(() => {
    return filteredItems.map((t: Record<string, unknown>) => {
      const empowered = mode === 'empowered';
      const doc: TechniqueDocument = {
        name: String(t.name ?? ''),
        description: String(t.description ?? ''),
        parts: Array.isArray(t.parts) ? (t.parts as TechniqueDocument['parts']) : [],
        damage: Array.isArray(t.damage) ? (t.damage[0] as TechniqueDocument['damage']) : (t.damage as TechniqueDocument['damage']),
        weapon: t.weapon as TechniqueDocument['weapon'],
      };
      const display = deriveTechniqueDisplay(doc, partsDb);
      const totals = getEmpoweredTotals(t);
      const damageStr = formatTechniqueDamage(doc.damage);
      const parts: ChipData[] = display.partChips.map(chip => ({
        name: chip.text.split(' | TP:')[0].replace(/\s*\(Opt\d+ \d+\)/g, '').trim(),
        description: chip.description,
        cost: chip.finalTP,
        costLabel: 'TP',
      }));
      return {
        id: String(t.id ?? t.docId ?? ''),
        raw: t,
        name: display.name,
        description: display.description,
        energy: empowered ? (totals.energy ?? display.energy) : display.energy,
        tp: empowered ? (totals.tp ?? display.tp) : display.tp,
        action: display.actionType,
        weapon: display.weaponName || '-',
        damage: damageStr,
        parts,
      };
    });
  }, [filteredItems, mode, partsDb]);

  const filtered = useMemo(() => {
    let r = cardData;
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(x => String(x.name ?? '').toLowerCase().includes(s) || String(x.description ?? '').toLowerCase().includes(s) || String(x.weapon ?? '').toLowerCase().includes(s));
    }
    return sortItems(r);
  }, [cardData, search, sortItems]);

  if (error) return <ErrorDisplay message={`Failed to load Realms Library ${mode === 'empowered' ? 'empowered techniques' : 'techniques'}`} onRetry={() => { void refetch(); }} />;
  if (!isLoading && cardData.length === 0) {
    return (
      <ListEmptyState
        icon={<Swords className="w-8 h-8" />}
        title={mode === 'empowered' ? 'No empowered techniques yet' : 'No techniques yet'}
        message={mode === 'empowered' ? 'Official empowered techniques will appear here when added to Realms Library.' : 'Official techniques will appear here when added to Realms Library.'}
      />
    );
  }

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder={mode === 'empowered' ? 'Search empowered techniques...' : 'Search techniques...'} />
      </div>
      <ListHeader
        columns={[
          { key: 'name', label: 'NAME', align: 'left' as const },
          { key: 'energy', label: 'ENERGY', align: 'center' as const },
          { key: 'tp', label: 'TP', align: 'center' as const },
          { key: 'action', label: 'ACTION', align: 'center' as const },
          { key: 'weapon', label: 'WEAPON', align: 'center' as const },
          { key: 'damage', label: 'DAMAGE', align: 'center' as const },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={TECHNIQUE_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? <LoadingState /> : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">
            {mode === 'empowered' ? 'No empowered techniques match your search.' : 'No techniques match your search.'}
          </div>
        ) : (
          filtered.map(t => (
            <GridListRow
              key={t.id}
              id={t.id}
              name={t.name}
              description={t.description}
              gridColumns={TECHNIQUE_GRID}
              columns={[
                { key: 'Energy', value: t.energy, highlight: true, align: 'center' },
                { key: 'TP', value: t.tp, align: 'center' },
                { key: 'Action', value: t.action, align: 'center' },
                { key: 'Weapon', value: t.weapon, align: 'center' },
                { key: 'Damage', value: t.damage, align: 'center' },
              ]}
              chips={t.parts}
              chipsLabel="Parts"
              totalCost={t.tp}
              costLabel="TP"
              badges={[{ label: 'Realms', color: 'blue' }]}
              rightSlot={readOnly ? undefined : (
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); openAddConfirm(t.name, t.raw); }}
                  label="Add to my library"
                  className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                >
                  <Plus className="w-4 h-4" />
                </IconButton>
              )}
              onAddToLibrary={readOnly ? undefined : () => openAddConfirm(t.name, t.raw)}
            />
          ))
        )}
      </div>
      <ConfirmActionModal
        isOpen={!readOnly && !!addConfirm}
        onClose={() => setAddConfirm(null)}
        onConfirm={handleAddConfirm}
        title="Add to your library?"
        description={addConfirm ? `Add "${addConfirm.name}" to your library?` : ''}
        confirmLabel="Add"
        loadingLabel="Adding..."
        isLoading={addMutation.isPending}
        icon="publish"
      />
    </div>
  );
}

function PublicItemsList({ onLoginRequired, readOnly = false }: { onLoginRequired: () => void; readOnly?: boolean }) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const { data: items = [], isLoading, error, refetch } = useOfficialLibrary('items');
  const { data: propertiesDb = [] } = useItemProperties();
  const addMutation = useAddOfficialToLibrary('items');
  const [search, setSearch] = useState('');
  const [addConfirm, setAddConfirm] = useState<{ name: string; raw: Record<string, unknown> } | null>(null);
  const { sortState, handleSort, sortItems } = useSort('name');

  const openAddConfirm = (name: string, raw: Record<string, unknown>) => {
    if (readOnly || !user) {
      if (!user) onLoginRequired();
      return;
    }
    setAddConfirm({ name, raw });
  };

  const handleAddConfirm = () => {
    if (!addConfirm) return;
    addMutation.mutate(addConfirm.raw, {
      onSuccess: () => {
        showToast('Added to My Library. You can use it as-is or edit a copy.', 'success');
        setAddConfirm(null);
      },
      onError: (e) => {
        showToast(e?.message ?? 'Failed to add to library', 'error');
      },
    });
  };

  const cardData = useMemo(() => {
    return items.map((item: Record<string, unknown>) => {
      const props = (Array.isArray(item.properties) ? item.properties : []) as ItemPropertyPayload[];
      const costs = calculateItemCosts(props, propertiesDb);
      const { currencyCost, rarity } = calculateCurrencyCostAndRarity(costs.totalCurrency, costs.totalIP);
      const rangeStr = formatItemRange(props);
      const damageStr = formatDamageDisplay(item.damage) || '';
      const parts: ChipData[] = (
        (item.properties as Array<string | { id?: unknown; name?: string; op_1_lvl?: number }>) || []
      ).map((prop) => {
        const propName = typeof prop === 'string' ? prop : (prop.name || '');
        const dbProp = propertiesDb.find(
          (p: { name?: string }) => p.name?.toLowerCase() === String(propName).toLowerCase()
        );
        const cost = trainingPointsForItemPropertyRef(prop, propertiesDb);
        const lvl = typeof prop === 'object' && prop && prop.op_1_lvl != null ? prop.op_1_lvl : 0;
        return {
          name: dbProp?.name || propName || '',
          description: dbProp?.description || '',
          cost: cost > 0 ? cost : undefined,
          costLabel: 'TP',
          category: (cost > 0 ? 'cost' : 'default') as 'cost' | 'default',
          level: lvl > 1 ? lvl : undefined,
        };
      });
      return {
        id: String(item.id ?? item.docId ?? ''),
        raw: item,
        name: String(item.name ?? ''),
        description: String(item.description ?? ''),
        type: formatListCellLabel(item.type),
        rarity: formatListCellLabel(rarity),
        currency: currencyCost,
        tp: costs.totalTP,
        range: rangeStr,
        damage: damageStr,
        parts,
      };
    });
  }, [items, propertiesDb]);

  const filtered = useMemo(() => {
    let r = cardData;
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(x => String(x.name ?? '').toLowerCase().includes(s) || String(x.description ?? '').toLowerCase().includes(s) || String(x.type ?? '').toLowerCase().includes(s));
    }
    return sortItems(r);
  }, [cardData, search, sortItems]);

  if (error) return <ErrorDisplay message="Failed to load Realms Library armaments" onRetry={() => { void refetch(); }} />;
  if (!isLoading && cardData.length === 0) {
    return <ListEmptyState icon={<Shield className="w-8 h-8" />} title="No armaments yet" message="Official armaments will appear here when added to Realms Library." />;
  }

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search armaments..." />
      </div>
      <ListHeader
        columns={[
          { key: 'name', label: 'NAME', align: 'left' as const },
          { key: 'type', label: 'TYPE', align: 'center' as const },
          { key: 'rarity', label: 'RARITY', align: 'center' as const },
          { key: 'currency', label: 'CURRENCY', align: 'center' as const },
          { key: 'tp', label: 'TP', align: 'center' as const },
          { key: 'range', label: 'RANGE', align: 'center' as const },
          { key: 'damage', label: 'DAMAGE', align: 'center' as const },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={ITEM_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? <LoadingState /> : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">No armaments match your search.</div>
        ) : (
          filtered.map(i => (
            <GridListRow
              key={i.id}
              id={i.id}
              name={i.name}
              description={i.description}
              gridColumns={ITEM_GRID}
              columns={[
                { key: 'Type', value: i.type, align: 'center' },
                { key: 'Rarity', value: i.rarity, align: 'center' },
                { key: 'Currency', value: i.currency, align: 'center' },
                { key: 'TP', value: i.tp, align: 'center' },
                { key: 'Range', value: i.range, align: 'center' },
                { key: 'Damage', value: i.damage, align: 'center' },
              ]}
              chips={i.parts}
              chipsLabel="Properties"
              totalCost={i.tp}
              costLabel="TP"
              badges={[{ label: 'Realms', color: 'blue' }]}
              rightSlot={readOnly ? undefined : (
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); openAddConfirm(i.name, i.raw); }}
                  label="Add to my library"
                  className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                >
                  <Plus className="w-4 h-4" />
                </IconButton>
              )}
              onAddToLibrary={readOnly ? undefined : () => openAddConfirm(i.name, i.raw)}
            />
          ))
        )}
      </div>
      <ConfirmActionModal
        isOpen={!readOnly && !!addConfirm}
        onClose={() => setAddConfirm(null)}
        onConfirm={handleAddConfirm}
        title="Add to your library?"
        description={addConfirm ? `Add "${addConfirm.name}" to your library?` : ''}
        confirmLabel="Add"
        loadingLabel="Adding..."
        isLoading={addMutation.isPending}
        icon="publish"
      />
    </div>
  );
}

function PublicCreaturesList({ onLoginRequired, readOnly = false }: { onLoginRequired: () => void; readOnly?: boolean }) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const { data: items = [], isLoading, error, refetch } = useOfficialLibrary('creatures');
  const addMutation = useAddOfficialToLibrary('creatures');
  const [search, setSearch] = useState('');
  const [addConfirm, setAddConfirm] = useState<{ name: string; raw: Record<string, unknown> } | null>(null);
  const { sortState, handleSort, sortItems } = useSort('name');

  const openAddConfirm = (name: string, raw: Record<string, unknown>) => {
    if (readOnly || !user) {
      if (!user) onLoginRequired();
      return;
    }
    setAddConfirm({ name, raw });
  };

  const handleAddConfirm = () => {
    if (!addConfirm) return;
    addMutation.mutate(addConfirm.raw, {
      onSuccess: () => {
        showToast('Added to My Library. You can use it as-is or edit a copy.', 'success');
        setAddConfirm(null);
      },
      onError: (e) => {
        showToast(e?.message ?? 'Failed to add to library', 'error');
      },
    });
  };

  const cardData = useMemo(() => {
    return items.map((c: Record<string, unknown>) => ({
      id: String(c.id ?? c.docId ?? ''),
      raw: c,
      name: String(c.name ?? ''),
      description: String(c.description ?? ''),
      level: Number(c.level ?? 0),
      type: String(c.type ?? ''),
    }));
  }, [items]);

  const filtered = useMemo(() => {
    let r = cardData;
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(x => String(x.name ?? '').toLowerCase().includes(s) || String(x.type ?? '').toLowerCase().includes(s) || String(x.description ?? '').toLowerCase().includes(s));
    }
    return sortItems(r);
  }, [cardData, search, sortItems]);

  if (error) return <ErrorDisplay message="Failed to load Realms Library creatures" onRetry={() => { void refetch(); }} />;
  if (!isLoading && cardData.length === 0) {
    return <ListEmptyState icon={<Users className="w-8 h-8" />} title="No creatures yet" message="Official creatures will appear here when added to Realms Library." />;
  }

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search creatures..." />
      </div>
      <ListHeader
        columns={[
          { key: 'name', label: 'NAME', align: 'left' as const },
          { key: 'level', label: 'LEVEL', align: 'center' as const },
          { key: 'type', label: 'TYPE', align: 'center' as const },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={CREATURE_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? <LoadingState /> : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">No creatures match your search.</div>
        ) : (
          filtered.map(c => (
            <GridListRow
              key={c.id}
              id={c.id}
              name={c.name}
              description={c.description}
              gridColumns={CREATURE_GRID}
              columns={[
                { key: 'Level', value: c.level, highlight: true, align: 'center' },
                { key: 'Type', value: formatListCellLabel(c.type), align: 'center' },
              ]}
              badges={[{ label: 'Realms', color: 'blue' }]}
              rightSlot={readOnly ? undefined : (
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); openAddConfirm(c.name, c.raw); }}
                  label="Add to my library"
                  className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                >
                  <Plus className="w-4 h-4" />
                </IconButton>
              )}
              onAddToLibrary={readOnly ? undefined : () => openAddConfirm(c.name, c.raw)}
            />
          ))
        )}
      </div>
      <ConfirmActionModal
        isOpen={!readOnly && !!addConfirm}
        onClose={() => setAddConfirm(null)}
        onConfirm={handleAddConfirm}
        title="Add to your library?"
        description={addConfirm ? `Add "${addConfirm.name}" to your library?` : ''}
        confirmLabel="Add"
        loadingLabel="Adding..."
        isLoading={addMutation.isPending}
        icon="publish"
      />
    </div>
  );
}
