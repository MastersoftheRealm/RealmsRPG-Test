/**
 * Library Public Content
 * ======================
 * Public library lists (Powers, Techniques, Armaments, Creatures) for the Library page.
 * Browse and add to my library. Requires login to add.
 */

'use client';

import { useState, useMemo } from 'react';
import { Wand2, Swords, Shield, Users } from 'lucide-react';
import {
  GridListRow,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  ListEmptyState,
  type ChipData,
} from '@/components/shared';
import { useToast } from '@/components/ui';
import { useSort } from '@/hooks/use-sort';
import {
  usePublicLibrary,
  useAddPublicToLibrary,
  usePowerParts,
  useTechniqueParts,
  useItemProperties,
} from '@/hooks';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { deriveTechniqueDisplay, formatTechniqueDamage } from '@/lib/calculators/technique-calc';
import type { ItemPropertyPayload } from '@/lib/calculators/item-calc';
import { calculateItemCosts, calculateCurrencyCostAndRarity, formatRange as formatItemRange } from '@/lib/calculators/item-calc';
import { useAuthStore } from '@/stores/auth-store';

export type LibraryPublicTabId = 'powers' | 'techniques' | 'items' | 'creatures';

const POWER_GRID = '1.5fr 0.8fr 1fr 1fr 0.8fr 1fr 1fr 40px';
const TECHNIQUE_GRID = '1.5fr 0.8fr 0.8fr 1fr 1fr 1fr 40px';
const ITEM_GRID = '1.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 40px';
const CREATURE_GRID = '1.5fr 0.8fr 1fr 40px';

interface LibraryPublicContentProps {
  activeTab: LibraryPublicTabId;
  onLoginRequired: () => void;
}

export function LibraryPublicContent({ activeTab, onLoginRequired }: LibraryPublicContentProps) {
  if (activeTab === 'powers') return <PublicPowersList onLoginRequired={onLoginRequired} />;
  if (activeTab === 'techniques') return <PublicTechniquesList onLoginRequired={onLoginRequired} />;
  if (activeTab === 'items') return <PublicItemsList onLoginRequired={onLoginRequired} />;
  if (activeTab === 'creatures') return <PublicCreaturesList onLoginRequired={onLoginRequired} />;
  return null;
}

function PublicPowersList({ onLoginRequired }: { onLoginRequired: () => void }) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const { data: items = [], isLoading, error } = usePublicLibrary('powers');
  const { data: partsDb = [] } = usePowerParts();
  const addMutation = useAddPublicToLibrary('powers');
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

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

  if (error) return <ErrorDisplay message="Failed to load public powers" />;
  if (!isLoading && cardData.length === 0) {
    return <ListEmptyState icon={<Wand2 className="w-8 h-8" />} title="No public powers" message="Public powers will appear here when admins add them." />;
  }

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search powers..." />
      </div>
      <ListHeader
        columns={[
          { key: 'name', label: 'NAME' },
          { key: 'energy', label: 'ENERGY', sortable: false as const },
          { key: 'action', label: 'ACTION', sortable: false as const },
          { key: 'duration', label: 'DURATION', sortable: false as const },
          { key: 'range', label: 'RANGE', sortable: false as const },
          { key: 'area', label: 'AREA', sortable: false as const },
          { key: 'damage', label: 'DAMAGE', sortable: false as const },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={POWER_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? <LoadingState /> : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-muted">No powers match your search.</div>
        ) : (
          filtered.map(p => (
            <GridListRow
              key={p.id}
              id={p.id}
              name={p.name}
              description={p.description}
              gridColumns={POWER_GRID}
              columns={[
                { key: 'Energy', value: p.energy, highlight: true },
                { key: 'Action', value: p.action },
                { key: 'Duration', value: p.duration },
                { key: 'Range', value: p.range },
                { key: 'Area', value: p.area },
                { key: 'Damage', value: p.damage },
              ]}
              chips={p.parts}
              chipsLabel="Parts"
              totalCost={p.tp}
              costLabel="TP"
              badges={[{ label: 'Public', color: 'blue' }]}
              onAddToLibrary={() => {
                if (!user) {
                  onLoginRequired();
                  return;
                }
                addMutation.mutate(p.raw, {
                  onError: (e) => showToast(e?.message ?? 'Failed to add to library', 'error'),
                });
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PublicTechniquesList({ onLoginRequired }: { onLoginRequired: () => void }) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const { data: items = [], isLoading, error } = usePublicLibrary('techniques');
  const { data: partsDb = [] } = useTechniqueParts();
  const addMutation = useAddPublicToLibrary('techniques');
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    return items.map((t: Record<string, unknown>) => {
      const doc: TechniqueDocument = {
        name: String(t.name ?? ''),
        description: String(t.description ?? ''),
        parts: Array.isArray(t.parts) ? (t.parts as TechniqueDocument['parts']) : [],
        damage: Array.isArray(t.damage) ? (t.damage[0] as TechniqueDocument['damage']) : (t.damage as TechniqueDocument['damage']),
        weapon: t.weapon as TechniqueDocument['weapon'],
      };
      const display = deriveTechniqueDisplay(doc, partsDb);
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
        energy: display.energy,
        tp: display.tp,
        action: display.actionType,
        weapon: display.weaponName || '-',
        damage: damageStr,
        parts,
      };
    });
  }, [items, partsDb]);

  const filtered = useMemo(() => {
    let r = cardData;
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(x => String(x.name ?? '').toLowerCase().includes(s) || String(x.description ?? '').toLowerCase().includes(s) || String(x.weapon ?? '').toLowerCase().includes(s));
    }
    return sortItems(r);
  }, [cardData, search, sortItems]);

  if (error) return <ErrorDisplay message="Failed to load public techniques" />;
  if (!isLoading && cardData.length === 0) {
    return <ListEmptyState icon={<Swords className="w-8 h-8" />} title="No public techniques" message="Public techniques will appear here when admins add them." />;
  }

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search techniques..." />
      </div>
      <ListHeader
        columns={[
          { key: 'name', label: 'NAME' },
          { key: 'energy', label: 'ENERGY', sortable: false as const },
          { key: 'tp', label: 'TP', sortable: false as const },
          { key: 'action', label: 'ACTION', sortable: false as const },
          { key: 'weapon', label: 'WEAPON', sortable: false as const },
          { key: 'damage', label: 'DAMAGE', sortable: false as const },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={TECHNIQUE_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? <LoadingState /> : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-muted">No techniques match your search.</div>
        ) : (
          filtered.map(t => (
            <GridListRow
              key={t.id}
              id={t.id}
              name={t.name}
              description={t.description}
              gridColumns={TECHNIQUE_GRID}
              columns={[
                { key: 'Energy', value: t.energy, highlight: true },
                { key: 'TP', value: t.tp },
                { key: 'Action', value: t.action },
                { key: 'Weapon', value: t.weapon },
                { key: 'Damage', value: t.damage },
              ]}
              chips={t.parts}
              chipsLabel="Parts"
              totalCost={t.tp}
              costLabel="TP"
              badges={[{ label: 'Public', color: 'blue' }]}
              onAddToLibrary={() => {
                if (!user) {
                  onLoginRequired();
                  return;
                }
                addMutation.mutate(t.raw, {
                  onError: (e) => showToast(e?.message ?? 'Failed to add to library', 'error'),
                });
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PublicItemsList({ onLoginRequired }: { onLoginRequired: () => void }) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const { data: items = [], isLoading, error } = usePublicLibrary('items');
  const { data: propertiesDb = [] } = useItemProperties();
  const addMutation = useAddPublicToLibrary('items');
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    return items.map((item: Record<string, unknown>) => {
      const props = (Array.isArray(item.properties) ? item.properties : []) as ItemPropertyPayload[];
      const costs = calculateItemCosts(props, propertiesDb);
      const { currencyCost, rarity } = calculateCurrencyCostAndRarity(costs.totalCurrency, costs.totalIP);
      const rangeStr = formatItemRange(props);
      const damage = item.damage;
      let damageStr = '';
      if (Array.isArray(damage) && damage[0]) {
        const d = damage[0] as { amount?: number; size?: number; type?: string };
        damageStr = [d.amount && d.size ? `${d.amount}d${d.size}` : '', d.type].filter(Boolean).join(' ');
      }
      const typeMap: Record<string, string> = { weapon: 'Weapon', armor: 'Armor', shield: 'Shield', equipment: 'Equipment' };
      const typeStr = typeMap[String(item.type ?? '').toLowerCase()] || String(item.type ?? '');
      const parts: ChipData[] = ((item.properties as Array<{ id?: unknown; name?: string; op_1_lvl?: number }>) || []).map(prop => ({
        name: prop.name || '',
        cost: prop.op_1_lvl ?? 1,
        costLabel: 'Lvl',
      }));
      return {
        id: String(item.id ?? item.docId ?? ''),
        raw: item,
        name: String(item.name ?? ''),
        description: String(item.description ?? ''),
        type: typeStr,
        rarity,
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

  if (error) return <ErrorDisplay message="Failed to load public armaments" />;
  if (!isLoading && cardData.length === 0) {
    return <ListEmptyState icon={<Shield className="w-8 h-8" />} title="No public armaments" message="Public armaments will appear here when admins add them." />;
  }

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search armaments..." />
      </div>
      <ListHeader
        columns={[
          { key: 'name', label: 'NAME' },
          { key: 'type', label: 'TYPE', sortable: false as const },
          { key: 'rarity', label: 'RARITY', sortable: false as const },
          { key: 'currency', label: 'CURRENCY', sortable: false as const },
          { key: 'tp', label: 'TP', sortable: false as const },
          { key: 'range', label: 'RANGE', sortable: false as const },
          { key: 'damage', label: 'DAMAGE', sortable: false as const },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={ITEM_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? <LoadingState /> : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-muted">No armaments match your search.</div>
        ) : (
          filtered.map(i => (
            <GridListRow
              key={i.id}
              id={i.id}
              name={i.name}
              description={i.description}
              gridColumns={ITEM_GRID}
              columns={[
                { key: 'Type', value: i.type },
                { key: 'Rarity', value: i.rarity },
                { key: 'Currency', value: i.currency },
                { key: 'TP', value: i.tp },
                { key: 'Range', value: i.range },
                { key: 'Damage', value: i.damage },
              ]}
              chips={i.parts}
              chipsLabel="Properties"
              totalCost={i.tp}
              costLabel="TP"
              badges={[{ label: 'Public', color: 'blue' }]}
              onAddToLibrary={() => {
                if (!user) {
                  onLoginRequired();
                  return;
                }
                addMutation.mutate(i.raw, {
                  onError: (e) => showToast(e?.message ?? 'Failed to add to library', 'error'),
                });
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PublicCreaturesList({ onLoginRequired }: { onLoginRequired: () => void }) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const { data: items = [], isLoading, error } = usePublicLibrary('creatures');
  const addMutation = useAddPublicToLibrary('creatures');
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

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

  if (error) return <ErrorDisplay message="Failed to load public creatures" />;
  if (!isLoading && cardData.length === 0) {
    return <ListEmptyState icon={<Users className="w-8 h-8" />} title="No public creatures" message="Public creatures will appear here when admins add them." />;
  }

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search creatures..." />
      </div>
      <ListHeader
        columns={[
          { key: 'name', label: 'NAME' },
          { key: 'level', label: 'LEVEL', sortable: false as const },
          { key: 'type', label: 'TYPE', sortable: false as const },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={CREATURE_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? <LoadingState /> : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-muted">No creatures match your search.</div>
        ) : (
          filtered.map(c => (
            <GridListRow
              key={c.id}
              id={c.id}
              name={c.name}
              description={c.description}
              gridColumns={CREATURE_GRID}
              columns={[
                { key: 'Level', value: c.level, highlight: true },
                { key: 'Type', value: c.type },
              ]}
              badges={[{ label: 'Public', color: 'blue' }]}
              onAddToLibrary={() => {
                if (!user) {
                  onLoginRequired();
                  return;
                }
                addMutation.mutate(c.raw, {
                  onError: (e) => showToast(e?.message ?? 'Failed to add to library', 'error'),
                });
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
