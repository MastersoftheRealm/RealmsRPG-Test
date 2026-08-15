/**
 * AddCombatantModal — Encounter / session participant picker
 * ==========================================================
 * Intentional non-USM selection shell (TASK-571). Extend this component for
 * combat, skill, downtime, VTT, and future session-play “add participant”
 * flows — do not fork a parallel modal and do not migrate this grammar onto
 * UnifiedSelectionModal (catalog add-X stays on USM).
 *
 * Why distinct from USM: library ↔ campaign scope, campaign drill-down,
 * quantity + combatant type (enemy/ally/companion), and initiative / encounter
 * payload shaping on confirm.
 *
 * Supports: Creature Library, Campaign Characters. Call sites today: combat +
 * skill encounter views (mixed encounters reuse those views). Reuse the same
 * export for VTT / downtime / etc.
 */

'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn, generateId } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api-client';
import { BookOpen, Users } from 'lucide-react';
import { Modal, Button, SearchInput, LoadingState, EmptyState, useToast } from '@/components/ui';
import { SegmentedControl } from '@/components/shared';
import { ValueStepper } from '@/components/shared/value-stepper';
import {
  fetchCampaignCharacterForEncounter,
  useAuthStore,
  useUserCreatures,
  useCampaignsFull,
  type UserCreature,
} from '@/hooks';
import { calculateCreatureMaxHealth, calculateCreatureMaxEnergy } from '@/lib/game/encounter-utils';
import { formatCreatureLevelShort } from '@/lib/game';
import type { TrackedCombatant, CombatantType, SkillParticipant } from '@/types/encounter';
import type { Campaign } from '@/types/campaign';

type TabId = 'library' | 'campaign';

export interface AddCombatantModalProps {
  onClose: () => void;
  onAdd: (combatants: TrackedCombatant[]) => void;
  /** For skill mode, also provide onAddParticipants */
  onAddParticipants?: (participants: SkillParticipant[]) => void;
  /** Mixed encounter pages reuse combat/skill views — pass those modes, not a third value. */
  mode: 'combat' | 'skill';
}

/** Roll initiative: d20 + acuity bonus */
function rollInitiative(acuity: number): number {
  return Math.floor(Math.random() * 20) + 1 + acuity;
}

export function AddCombatantModal({
  onClose,
  onAdd,
  onAddParticipants,
  mode,
}: AddCombatantModalProps) {
  const [tab, setTab] = useState<TabId>('library');

  return (
    <Modal isOpen onClose={onClose} title="Add From Library / Campaign" fullScreenOnMobile>
      <SegmentedControl
        value={tab}
        onChange={setTab}
        equalWidth
        options={[
          {
            value: 'library',
            label: 'Creature Library',
            icon: <BookOpen className="h-4 w-4" aria-hidden />,
          },
          {
            value: 'campaign',
            label: 'Campaign Characters',
            icon: <Users className="h-4 w-4" aria-hidden />,
          },
        ]}
        aria-label="Add combatants from"
        className="mb-4"
      />

      {tab === 'library' ? (
        <CreatureLibraryTab
          onAdd={onAdd}
          onAddParticipants={onAddParticipants}
          mode={mode}
          onClose={onClose}
        />
      ) : (
        <CampaignCharactersTab
          onAdd={onAdd}
          onAddParticipants={onAddParticipants}
          mode={mode}
          onClose={onClose}
        />
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
      (c) => c.name.toLowerCase().includes(s) || c.type?.toLowerCase().includes(s),
    );
  }, [creatures, search]);

  const handleAdd = () => {
    if (!selected) return;

    const level = selected.level || 1;
    const abilities = selected.abilities || {};
    const agility = abilities.agility ?? abilities.agi ?? 0;
    const acuity = abilities.acuity ?? abilities.acu ?? 0;
    const maxHealth = calculateCreatureMaxHealth(level, abilities, selected.hitPoints ?? 0);
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
    return <LoadingState message="Loading creatures..." size="md" padding="sm" />;
  }

  if (creatures.length === 0) {
    return (
      <EmptyState
        title="No creatures in your library."
        description="Create creatures in the Creature Creator first."
        size="sm"
      />
    );
  }

  return (
    <div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search creatures..." />

      <div className="mt-3 max-h-[250px] space-y-1 overflow-y-auto">
        {filtered.map((creature) => (
          <button
            key={creature.id}
            onClick={() => setSelected(creature)}
            className={cn(
              'w-full rounded-lg px-3 py-2 text-left transition-colors',
              selected?.id === creature.id
                ? 'border border-primary-subtle-border bg-primary-subtle-bg'
                : 'border border-transparent hover:bg-surface-alt',
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-text-primary">{creature.name}</span>
                <span className="ml-2 text-xs text-text-muted">
                  {formatCreatureLevelShort(creature.level)}
                </span>
                {creature.type && (
                  <span className="ml-1 text-xs text-text-muted">({creature.type})</span>
                )}
              </div>
              <div className="text-xs text-text-muted">
                HP{' '}
                {calculateCreatureMaxHealth(
                  creature.level || 1,
                  creature.abilities || {},
                  creature.hitPoints ?? 0,
                )}
                {' / '}
                EN{' '}
                {calculateCreatureMaxEnergy(
                  creature.level || 1,
                  creature.abilities || {},
                  creature.energyPoints ?? 0,
                )}
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && <EmptyState title="No creatures match your search." size="sm" />}
      </div>

      {selected && (
        <div className="mt-4 space-y-3 border-t border-border-light pt-4">
          <p className="text-sm font-medium text-text-primary">
            Adding: <span className="text-primary-link-fg">{selected.name}</span>
          </p>

          <div className="flex items-center gap-4">
            <div>
              <label className="mb-1 block text-xs text-text-muted">Quantity</label>
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
                      className="h-3.5 w-3.5"
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
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
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
      const chars = selectedCampaign.characters.filter((c) =>
        selectedChars.has(`${c.userId}-${c.characterId}`),
      );

      // Same ?scope=encounter fetcher as combat HP sync (member-readable; not the RM-view GET)
      const results = await Promise.all(
        chars.map(async (c) => {
          try {
            const data = await fetchCampaignCharacterForEncounter(
              queryClient,
              selectedCampaign.id,
              user?.uid,
              c.userId,
              c.characterId,
            );
            if (!data) return null;
            return { charMeta: c, data };
          } catch {
            return null;
          }
        }),
      );

      const loaded = results.filter((r): r is NonNullable<typeof r> => r !== null);
      if (chars.length > 0 && loaded.length === 0) {
        showToast(
          'Could not load selected characters. Check your connection and try again.',
          'error',
        );
        return;
      }

      if (mode === 'skill' && onAddParticipants) {
        const participants: SkillParticipant[] = loaded.map((r) => ({
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

      const combatants: TrackedCombatant[] = loaded.map((r) => {
        const d = r.data;
        const abilities = d.abilities || {};
        const acuity = abilities.acuity ?? 0;
        return {
          id: generateId(),
          name: r.charMeta.characterName,
          initiative: rollInitiative(acuity),
          acuity,
          maxHealth: d.health?.max ?? 20,
          currentHealth:
            ((d as Record<string, unknown>).currentHealth as number) ??
            d.health?.current ??
            d.health?.max ??
            20,
          maxEnergy: d.energy?.max ?? 10,
          currentEnergy:
            ((d as Record<string, unknown>).currentEnergy as number) ??
            d.energy?.current ??
            d.energy?.max ??
            10,
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
      showToast(getErrorMessage(err, 'Failed to add campaign characters'), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading campaigns..." size="md" padding="sm" />;
  }

  if (campaigns.length === 0) {
    return (
      <EmptyState
        title="You are not in any campaigns."
        description="Join or create a campaign first."
        size="sm"
      />
    );
  }

  return (
    <div>
      {!selectedCampaign ? (
        <div className="space-y-2">
          <p className="mb-3 text-sm text-text-secondary">Select a campaign:</p>
          {campaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => setSelectedCampaign(campaign)}
              className="w-full rounded-lg border border-border-light px-4 py-3 text-left transition-colors hover:border-primary-outline-border hover:bg-surface-alt"
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
            onClick={() => {
              setSelectedCampaign(null);
              setSelectedChars(new Set());
            }}
            className="mb-3 text-sm text-primary-link-fg hover:underline"
          >
            &larr; Back to campaigns
          </button>

          <p className="mb-3 text-sm text-text-secondary">
            Select characters from <span className="font-medium">{selectedCampaign.name}</span>:
          </p>

          <div className="max-h-[250px] space-y-1 overflow-y-auto">
            {(selectedCampaign.characters || []).map((c) => {
              const key = `${c.userId}-${c.characterId}`;
              const isSelected = selectedChars.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleChar(key)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                    isSelected
                      ? 'border border-primary-subtle-border bg-primary-subtle-bg'
                      : 'border border-transparent hover:bg-surface-alt',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2',
                      isSelected
                        ? 'border-primary-outline-border bg-primary-button text-text-on-dark'
                        : 'border-border-light',
                    )}
                  >
                    {isSelected && <span className="text-xs">&#10003;</span>}
                  </div>
                  <div>
                    <span className="font-medium text-text-primary">{c.characterName}</span>
                    <span className="ml-2 text-xs text-text-muted">
                      Lv {c.level}
                      {c.species && ` \u00b7 ${c.species}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedChars.size > 0 && (
            <Button onClick={handleAdd} disabled={loading} className="mt-4 w-full">
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
