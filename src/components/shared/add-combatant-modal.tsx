/**
 * Add Combatant Modal
 * ====================
 * Shared modal for adding combatants/participants to encounters.
 * Supports: From Creature Library, From Campaign Characters.
 * Reused across combat, skill, and mixed encounter pages.
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BookOpen, Users, Search, Plus, Minus } from 'lucide-react';
import { Modal, Button, Input, SearchInput } from '@/components/ui';
import { ValueStepper } from '@/components/shared/value-stepper';
import { useUserCreatures, useCampaignsFull, type UserCreature } from '@/hooks';
import { calculateCreatureMaxHealth, calculateCreatureMaxEnergy } from '@/lib/game/encounter-utils';
import type { TrackedCombatant, CombatantType, SkillParticipant } from '@/types/encounter';
import type { Campaign, CampaignCharacter } from '@/types/campaign';

type TabId = 'library' | 'campaign';

interface AddCombatantModalProps {
  onClose: () => void;
  onAdd: (combatants: TrackedCombatant[]) => void;
  /** For skill mode, also provide onAddParticipants */
  onAddParticipants?: (participants: SkillParticipant[]) => void;
  mode: 'combat' | 'skill' | 'mixed';
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/** Roll initiative: d20 + acuity bonus */
function rollInitiative(acuity: number): number {
  return Math.floor(Math.random() * 20) + 1 + acuity;
}

export function AddCombatantModal({ onClose, onAdd, onAddParticipants, mode }: AddCombatantModalProps) {
  const [tab, setTab] = useState<TabId>('library');

  return (
    <Modal isOpen onClose={onClose} title="Add From Library / Campaign" fullScreenOnMobile>
      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 p-1 bg-surface-alt rounded-lg">
        <button
          onClick={() => setTab('library')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            tab === 'library' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
          )}
        >
          <BookOpen className="w-4 h-4" /> Creature Library
        </button>
        <button
          onClick={() => setTab('campaign')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            tab === 'campaign' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
          )}
        >
          <Users className="w-4 h-4" /> Campaign Characters
        </button>
      </div>

      {tab === 'library' ? (
        <CreatureLibraryTab onAdd={onAdd} onAddParticipants={onAddParticipants} mode={mode} onClose={onClose} />
      ) : (
        <CampaignCharactersTab onAdd={onAdd} onAddParticipants={onAddParticipants} mode={mode} onClose={onClose} />
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Creature Library Tab
// ---------------------------------------------------------------------------

function CreatureLibraryTab({
  onAdd,
  onAddParticipants,
  mode,
  onClose,
}: {
  onAdd: (combatants: TrackedCombatant[]) => void;
  onAddParticipants?: (participants: SkillParticipant[]) => void;
  mode: string;
  onClose: () => void;
}) {
  const { data: creatures = [], isLoading } = useUserCreatures();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UserCreature | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [combatantType, setCombatantType] = useState<CombatantType>('enemy');

  const filtered = useMemo(() => {
    if (!search) return creatures;
    const s = search.toLowerCase();
    return creatures.filter(
      (c) => c.name.toLowerCase().includes(s) || c.type?.toLowerCase().includes(s)
    );
  }, [creatures, search]);

  const handleAdd = () => {
    if (!selected) return;

    const level = selected.level || 1;
    const abilities = selected.abilities || {};
    const vitality = abilities.vitality ?? abilities.vit ?? 0;
    const agility = abilities.agility ?? abilities.agi ?? 0;
    const acuity = abilities.acuity ?? abilities.acu ?? 0;
    const maxHealth = calculateCreatureMaxHealth(level, vitality, selected.hitPoints ?? 0);
    const maxEnergy = calculateCreatureMaxEnergy(level, abilities, selected.energyPoints ?? 0);
    const evasion = 10 + agility;

    if (mode === 'skill' && onAddParticipants) {
      const participants: SkillParticipant[] = [];
      for (let i = 0; i < quantity; i++) {
        const suffix = quantity > 1 ? ` ${String.fromCharCode(65 + i)}` : '';
        participants.push({
          id: generateId(),
          name: selected.name + suffix,
          hasRolled: false,
          sourceType: 'creature-library',
          sourceId: selected.id,
        });
      }
      onAddParticipants(participants);
      onClose();
      return;
    }

    const combatants: TrackedCombatant[] = [];
    for (let i = 0; i < quantity; i++) {
      const suffix = quantity > 1 ? ` ${String.fromCharCode(65 + i)}` : '';
      combatants.push({
        id: generateId(),
        name: selected.name + suffix,
        initiative: rollInitiative(acuity),
        acuity,
        maxHealth,
        currentHealth: maxHealth,
        maxEnergy,
        currentEnergy: maxEnergy,
        armor: 0,
        evasion,
        ap: 4,
        conditions: [],
        notes: '',
        combatantType,
        isAlly: combatantType !== 'enemy',
        isSurprised: false,
        sourceType: 'creature-library',
        sourceId: selected.id,
      });
    }
    onAdd(combatants);
    onClose();
  };

  if (isLoading) {
    return <div className="py-8 text-center text-text-muted">Loading creatures...</div>;
  }

  if (creatures.length === 0) {
    return (
      <div className="py-8 text-center text-text-muted">
        <p>No creatures in your library.</p>
        <p className="text-sm mt-1">Create creatures in the Creature Creator first.</p>
      </div>
    );
  }

  return (
    <div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search creatures..." />

      <div className="mt-3 max-h-[250px] overflow-y-auto space-y-1">
        {filtered.map((creature) => (
          <button
            key={creature.id}
            onClick={() => setSelected(creature)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg transition-colors',
              selected?.id === creature.id
                ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-300'
                : 'hover:bg-surface-alt border border-transparent'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-text-primary">{creature.name}</span>
                <span className="text-xs text-text-muted ml-2">Lv {creature.level}</span>
                {creature.type && <span className="text-xs text-text-muted ml-1">({creature.type})</span>}
              </div>
              <div className="text-xs text-text-muted">
                HP {calculateCreatureMaxHealth(creature.level || 1, creature.abilities?.vitality ?? 0, creature.hitPoints ?? 0)}
                {' / '}
                EN {calculateCreatureMaxEnergy(creature.level || 1, creature.abilities || {}, creature.energyPoints ?? 0)}
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="py-4 text-center text-text-muted text-sm">No creatures match your search.</p>
        )}
      </div>

      {selected && (
        <div className="mt-4 pt-4 border-t border-border-light space-y-3">
          <p className="text-sm font-medium text-text-primary">
            Adding: <span className="text-primary-600">{selected.name}</span>
          </p>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">Quantity</label>
              <ValueStepper value={quantity} onChange={setQuantity} min={1} max={26} size="sm" />
            </div>

            {mode !== 'skill' && (
              <div className="flex items-center gap-2">
                {(['enemy', 'ally', 'companion'] as const).map((t) => (
                  <label key={t} className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="modalCombatantType"
                      checked={combatantType === t}
                      onChange={() => setCombatantType(t)}
                      className="w-3.5 h-3.5"
                    />
                    <span className="text-xs font-medium capitalize">{t}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleAdd} className="w-full">
            Add {quantity > 1 ? `${quantity} Creatures` : selected.name}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Campaign Characters Tab
// ---------------------------------------------------------------------------

function CampaignCharactersTab({
  onAdd,
  onAddParticipants,
  mode,
  onClose,
}: {
  onAdd: (combatants: TrackedCombatant[]) => void;
  onAddParticipants?: (participants: SkillParticipant[]) => void;
  mode: string;
  onClose: () => void;
}) {
  const { data: campaigns = [], isLoading } = useCampaignsFull();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedChars, setSelectedChars] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleChar = (key: string) => {
    setSelectedChars((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleAdd = async () => {
    if (!selectedCampaign || selectedChars.size === 0) return;
    setLoading(true);

    try {
      const chars = selectedCampaign.characters.filter(
        (c) => selectedChars.has(`${c.userId}-${c.characterId}`)
      );

      // Fetch each character's data via the API (scope=encounter allows any campaign member)
      const results = await Promise.all(
        chars.map(async (c) => {
          try {
            const res = await fetch(
              `/api/campaigns/${selectedCampaign.id}/characters/${c.userId}/${c.characterId}?scope=encounter`
            );
            if (!res.ok) return null;
            return { charMeta: c, data: await res.json() };
          } catch {
            return null;
          }
        })
      );

      if (mode === 'skill' && onAddParticipants) {
        const participants: SkillParticipant[] = results
          .filter((r): r is NonNullable<typeof r> => r !== null)
          .map((r) => ({
            id: generateId(),
            name: r.charMeta.characterName,
            hasRolled: false,
            sourceType: 'campaign-character' as const,
            sourceId: r.charMeta.characterId,
            sourceUserId: r.charMeta.userId,
          }));
        onAddParticipants(participants);
        onClose();
        return;
      }

      const combatants: TrackedCombatant[] = results
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .map((r) => {
          const d = r.data;
          const abilities = d.abilities || {};
          const acuity = abilities.acuity ?? 0;
          return {
            id: generateId(),
            name: r.charMeta.characterName,
            initiative: rollInitiative(acuity),
            acuity,
            maxHealth: d.health?.max ?? 20,
            currentHealth: (d as Record<string, unknown>).currentHealth as number ?? d.health?.current ?? d.health?.max ?? 20,
            maxEnergy: d.energy?.max ?? 10,
            currentEnergy: (d as Record<string, unknown>).currentEnergy as number ?? d.energy?.current ?? d.energy?.max ?? 10,
            armor: 0,
            evasion: d.evasion ?? 10 + (abilities.agility ?? 0),
            ap: 4,
            conditions: [],
            notes: '',
            combatantType: 'ally' as CombatantType,
            isAlly: true,
            isSurprised: false,
            sourceType: 'campaign-character' as const,
            sourceId: r.charMeta.characterId,
            sourceUserId: r.charMeta.userId,
          };
        });

      onAdd(combatants);
      onClose();
    } catch (err) {
      console.error('Failed to fetch campaign characters:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center text-text-muted">Loading campaigns...</div>;
  }

  if (campaigns.length === 0) {
    return (
      <div className="py-8 text-center text-text-muted">
        <p>You are not in any campaigns.</p>
        <p className="text-sm mt-1">Join or create a campaign first.</p>
      </div>
    );
  }

  return (
    <div>
      {!selectedCampaign ? (
        <div className="space-y-2">
          <p className="text-sm text-text-secondary mb-3">Select a campaign:</p>
          {campaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => setSelectedCampaign(campaign)}
              className="w-full text-left px-4 py-3 rounded-lg border border-border-light hover:border-primary-300 hover:bg-surface-alt transition-colors"
            >
              <div className="font-medium text-text-primary">{campaign.name}</div>
              <div className="text-xs text-text-muted">
                {campaign.characters?.length ?? 0} characters
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => { setSelectedCampaign(null); setSelectedChars(new Set()); }}
            className="text-sm text-primary-600 hover:underline mb-3"
          >
            &larr; Back to campaigns
          </button>

          <p className="text-sm text-text-secondary mb-3">
            Select characters from <span className="font-medium">{selectedCampaign.name}</span>:
          </p>

          <div className="max-h-[250px] overflow-y-auto space-y-1">
            {(selectedCampaign.characters || []).map((c) => {
              const key = `${c.userId}-${c.characterId}`;
              const isSelected = selectedChars.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleChar(key)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors',
                    isSelected
                      ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-300'
                      : 'hover:bg-surface-alt border border-transparent'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                    isSelected ? 'border-primary-500 bg-primary-500 text-white' : 'border-border-light'
                  )}>
                    {isSelected && <span className="text-xs">&#10003;</span>}
                  </div>
                  <div>
                    <span className="font-medium text-text-primary">{c.characterName}</span>
                    <span className="text-xs text-text-muted ml-2">
                      Lv {c.level}
                      {c.species && ` \u00b7 ${c.species}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedChars.size > 0 && (
            <Button onClick={handleAdd} disabled={loading} className="w-full mt-4">
              {loading
                ? 'Loading characters...'
                : `Add ${selectedChars.size} Character${selectedChars.size > 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
