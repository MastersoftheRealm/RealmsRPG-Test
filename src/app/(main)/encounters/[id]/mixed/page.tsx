/**
 * Mixed Encounter Page
 * =====================
 * Combines combat and skill encounter functionality in a tab-based view.
 * Both states stored on the same Encounter document.
 */

'use client';

import { useState, useCallback, useMemo, useEffect, DragEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  Cloud,
  CloudOff,
  Swords,
  Brain,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Users,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/layout';
import {
  PageContainer,
  LoadingState,
  Alert,
  Button,
  Input,
  Checkbox,
} from '@/components/ui';
import { ValueStepper } from '@/components/shared';
import { useEncounter, useSaveEncounter, useAutoSave, useCampaignsFull } from '@/hooks';
import { AddCombatantModal } from '@/components/shared/add-combatant-modal';
import { RollProvider, RollLog } from '@/components/character-sheet';
import type { Campaign } from '@/types/campaign';
import { CombatantCard } from '@/app/(main)/encounter-tracker/CombatantCard';
import { CONDITION_OPTIONS } from '@/app/(main)/encounter-tracker/encounter-tracker-constants';
import type {
  Encounter,
  TrackedCombatant,
  SkillParticipant,
  SkillEncounterState,
  Combatant,
  CombatantCondition,
  CombatantType,
} from '@/types/encounter';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

type ViewTab = 'combat' | 'skill';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function MixedEncounterPage({ params }: PageParams) {
  return (
    <ProtectedRoute>
      <MixedEncounterContent params={params} />
    </ProtectedRoute>
  );
}

function MixedEncounterContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: encounterId } = use(params);
  const router = useRouter();
  const { data: encounterData, isLoading, error } = useEncounter(encounterId);
  const saveMutation = useSaveEncounter();

  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeView, setActiveView] = useState<ViewTab>('combat');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingAllChars, setAddingAllChars] = useState(false);
  const { data: campaignsFull = [] } = useCampaignsFull();

  // Initialize
  useEffect(() => {
    if (encounterData && !isInitialized) {
      const enc = { ...encounterData };
      if (!enc.skillEncounter) {
        enc.skillEncounter = {
          difficultyScore: 10,
          requiredSuccesses: 2,
          requiredFailures: 3,
          participants: [],
          currentSuccesses: 0,
          currentFailures: 0,
        };
      }
      setEncounter(enc);
      setIsInitialized(true);
    }
  }, [encounterData, isInitialized]);

  // Auto-save
  const { isSaving, hasUnsavedChanges } = useAutoSave({
    data: encounter,
    onSave: async (data) => {
      if (!data || !encounterId) return;
      const { id: _id, createdAt: _ca, ...rest } = data;
      await saveMutation.mutateAsync({ id: encounterId, data: rest });
    },
    delay: 1500,
    enabled: isInitialized && !!encounter,
  });

  // ==================== COMBAT LOGIC ====================
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [newCombatant, setNewCombatant] = useState({
    name: '',
    initiative: 0,
    acuity: 0,
    maxHealth: 20,
    maxEnergy: 10,
    armor: 0,
    evasion: 10,
    combatantType: 'ally' as CombatantType,
    isAlly: true,
    isSurprised: false,
    quantity: 1,
  });

  const sortedCombatants = useMemo(() => {
    if (!encounter) return [];
    const companions = encounter.combatants.filter(c => c.combatantType === 'companion');
    const nonCompanions = encounter.combatants.filter(c => c.combatantType !== 'companion');
    if (encounter.round === 1) {
      const notSurprised = nonCompanions.filter(c => !c.isSurprised);
      const surprised = nonCompanions.filter(c => c.isSurprised);
      return [...notSurprised, ...surprised, ...companions];
    }
    return [...nonCompanions, ...companions];
  }, [encounter]);

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id);
  }, []);
  const handleDragEnd = useCallback(() => { setDraggedId(null); setDragOverId(null); }, []);
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, id: string) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (id !== draggedId) setDragOverId(id); }, [draggedId]);
  const handleDragLeave = useCallback(() => setDragOverId(null), []);
  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) { setDraggedId(null); setDragOverId(null); return; }
    setEncounter(prev => {
      if (!prev) return prev;
      const combatants = [...prev.combatants];
      const di = combatants.findIndex(c => c.id === draggedId);
      const ti = combatants.findIndex(c => c.id === targetId);
      if (di === -1 || ti === -1) return prev;
      const [item] = combatants.splice(di, 1);
      combatants.splice(ti, 0, item);
      return { ...prev, combatants };
    });
    setDraggedId(null); setDragOverId(null);
  }, [draggedId]);

  const addCombatant = () => {
    if (!newCombatant.name.trim()) return;
    const qty = Math.max(1, Math.min(26, newCombatant.quantity || 1));
    const newOnes: TrackedCombatant[] = [];
    for (let i = 0; i < qty; i++) {
      const suffix = qty > 1 ? ` ${String.fromCharCode(65 + i)}` : '';
      newOnes.push({
        id: generateId(), name: newCombatant.name + suffix, initiative: newCombatant.initiative,
        acuity: newCombatant.acuity, maxHealth: newCombatant.maxHealth, maxEnergy: newCombatant.maxEnergy,
        armor: newCombatant.armor, evasion: newCombatant.evasion, currentHealth: newCombatant.maxHealth,
        currentEnergy: newCombatant.maxEnergy, ap: 4, conditions: [], notes: '',
        combatantType: newCombatant.combatantType, isAlly: newCombatant.combatantType !== 'enemy',
        isSurprised: newCombatant.isSurprised, sourceType: 'manual',
      });
    }
    setEncounter(prev => prev ? { ...prev, combatants: [...prev.combatants, ...newOnes] } : prev);
    setNewCombatant({ name: '', initiative: 0, acuity: 0, maxHealth: 20, maxEnergy: 10, armor: 0, evasion: 10, combatantType: 'ally', isAlly: true, isSurprised: false, quantity: 1 });
  };

  const updateCombatant = (id: string, updates: Partial<Combatant>) => {
    setEncounter(prev => prev ? { ...prev, combatants: prev.combatants.map(c => c.id === id ? { ...c, ...updates } : c) } : prev);
  };
  const removeCombatant = (id: string) => {
    setEncounter(prev => prev ? { ...prev, combatants: prev.combatants.filter(c => c.id !== id) } : prev);
  };
  const duplicateCombatant = (combatant: Combatant) => {
    const dup: TrackedCombatant = { ...combatant, id: generateId(), currentHealth: combatant.maxHealth, currentEnergy: combatant.maxEnergy, conditions: [] };
    setEncounter(prev => prev ? { ...prev, combatants: [...prev.combatants, dup] } : prev);
  };
  const addCondition = (id: string, conditionName: string) => {
    const condDef = CONDITION_OPTIONS.find(c => c.name === conditionName);
    const isLeveled = condDef?.leveled ?? true;
    setEncounter(prev => { if (!prev) return prev; return { ...prev, combatants: prev.combatants.map(c => { if (c.id !== id || c.conditions.some(cc => cc.name === conditionName)) return c; return { ...c, conditions: [...c.conditions, { name: conditionName, level: isLeveled ? 1 : 0 }] }; }) }; });
  };
  const removeCondition = (id: string, conditionName: string) => {
    setEncounter(prev => { if (!prev) return prev; return { ...prev, combatants: prev.combatants.map(c => c.id !== id ? c : { ...c, conditions: c.conditions.filter(cc => cc.name !== conditionName) }) }; });
  };
  const updateConditionLevel = (id: string, conditionName: string, delta: number) => {
    setEncounter(prev => { if (!prev) return prev; return { ...prev, combatants: prev.combatants.map(c => { if (c.id !== id) return c; return { ...c, conditions: c.conditions.map(cc => { if (cc.name !== conditionName) return cc; const nl = cc.level + delta; if (nl <= 0) return null; return { ...cc, level: nl }; }).filter((cc): cc is CombatantCondition => cc !== null) }; }) }; });
  };
  const updateAP = (id: string, delta: number) => {
    setEncounter(prev => { if (!prev) return prev; return { ...prev, combatants: prev.combatants.map(c => c.id !== id ? c : { ...c, ap: Math.max(0, Math.min(10, c.ap + delta)) }) }; });
  };
  const applyDamage = useCallback((id: string, amount: number) => { setEncounter(prev => { if (!prev) return prev; return { ...prev, combatants: prev.combatants.map(c => c.id === id ? { ...c, currentHealth: Math.max(0, c.currentHealth - amount) } : c) }; }); }, []);
  const applyHealing = useCallback((id: string, amount: number) => { setEncounter(prev => { if (!prev) return prev; return { ...prev, combatants: prev.combatants.map(c => c.id === id ? { ...c, currentHealth: Math.min(c.maxHealth, c.currentHealth + amount) } : c) }; }); }, []);
  const applyEnergyDrain = useCallback((id: string, amount: number) => { setEncounter(prev => { if (!prev) return prev; return { ...prev, combatants: prev.combatants.map(c => c.id === id ? { ...c, currentEnergy: Math.max(0, c.currentEnergy - amount) } : c) }; }); }, []);
  const applyEnergyRestore = useCallback((id: string, amount: number) => { setEncounter(prev => { if (!prev) return prev; return { ...prev, combatants: prev.combatants.map(c => c.id === id ? { ...c, currentEnergy: Math.min(c.maxEnergy, c.currentEnergy + amount) } : c) }; }); }, []);

  const startCombat = () => { if (sortedCombatants.length === 0) return; setEncounter(prev => prev ? { ...prev, round: 1, currentTurnIndex: 0, isActive: true, status: 'active' } : prev); };
  const nextTurn = () => { setEncounter(prev => { if (!prev) return prev; const ni = prev.currentTurnIndex + 1; if (ni >= sortedCombatants.length) return { ...prev, round: prev.round + 1, currentTurnIndex: 0 }; return { ...prev, currentTurnIndex: ni }; }); };
  const previousTurn = () => { setEncounter(prev => { if (!prev || (prev.currentTurnIndex === 0 && prev.round === 1)) return prev; if (prev.currentTurnIndex === 0) return { ...prev, round: prev.round - 1, currentTurnIndex: sortedCombatants.length - 1 }; return { ...prev, currentTurnIndex: prev.currentTurnIndex - 1 }; }); };
  const endCombat = () => { setEncounter(prev => prev ? { ...prev, round: 0, currentTurnIndex: -1, isActive: false, status: 'paused' } : prev); };

  const sortInitiative = () => {
    setEncounter(prev => {
      if (!prev) return prev;
      const s = (a: Combatant, b: Combatant) => { if (b.initiative !== a.initiative) return b.initiative - a.initiative; return b.acuity - a.acuity; };
      const companions = prev.combatants.filter(c => c.combatantType === 'companion').sort(s);
      const allies = prev.combatants.filter(c => c.combatantType === 'ally').sort(s);
      const enemies = prev.combatants.filter(c => c.combatantType === 'enemy').sort(s);
      let useAlly = allies[0] && enemies[0] ? s(allies[0], enemies[0]) <= 0 : !!allies[0];
      const sorted: Combatant[] = [];
      const ac = [...allies], ec = [...enemies];
      while (ac.length > 0 || ec.length > 0) {
        if (useAlly && ac.length > 0) sorted.push(ac.shift()!);
        else if (!useAlly && ec.length > 0) sorted.push(ec.shift()!);
        else if (ac.length > 0) sorted.push(ac.shift()!);
        else if (ec.length > 0) sorted.push(ec.shift()!);
        useAlly = !useAlly;
      }
      return { ...prev, combatants: [...sorted, ...companions] };
    });
  };

  // ==================== SKILL LOGIC ====================
  const skill = encounter?.skillEncounter;
  const [newParticipantName, setNewParticipantName] = useState('');

  const outcome = useMemo(() => {
    if (!skill) return 'in-progress';
    const reqS = skill.requiredSuccesses ?? 999;
    const reqF = skill.requiredFailures ?? 999;
    if (skill.currentSuccesses >= reqS) return 'success';
    if (skill.currentFailures >= reqF) return 'failure';
    return 'in-progress';
  }, [skill]);

  const updateSkill = useCallback((updates: Partial<SkillEncounterState>) => {
    setEncounter(prev => { if (!prev || !prev.skillEncounter) return prev; return { ...prev, skillEncounter: { ...prev.skillEncounter, ...updates } }; });
  }, []);

  const addSkillParticipant = () => {
    if (!newParticipantName.trim()) return;
    updateSkill({ participants: [...(skill?.participants || []), { id: generateId(), name: newParticipantName.trim(), hasRolled: false, sourceType: 'manual' }] });
    setNewParticipantName('');
  };

  const removeSkillParticipant = (id: string) => { if (!skill) return; updateSkill({ participants: skill.participants.filter(p => p.id !== id) }); };

  const updateParticipantRoll = (id: string, rollValue: number) => {
    if (!skill) return;
    const isSuccess = rollValue >= skill.difficultyScore;
    const updated = skill.participants.map(p => p.id !== id ? p : { ...p, rollValue, isSuccess, hasRolled: true });
    updateSkill({ participants: updated, currentSuccesses: updated.filter(p => p.hasRolled && p.isSuccess).length, currentFailures: updated.filter(p => p.hasRolled && !p.isSuccess).length });
  };

  const clearParticipantRoll = (id: string) => {
    if (!skill) return;
    const updated = skill.participants.map(p => p.id !== id ? p : { ...p, rollValue: undefined, isSuccess: undefined, hasRolled: false });
    updateSkill({ participants: updated, currentSuccesses: updated.filter(p => p.hasRolled && p.isSuccess).length, currentFailures: updated.filter(p => p.hasRolled && !p.isSuccess).length });
  };

  const resetAllRolls = () => {
    if (!skill) return;
    updateSkill({ participants: skill.participants.map(p => ({ ...p, rollValue: undefined, isSuccess: undefined, hasRolled: false, skillUsed: undefined })), currentSuccesses: 0, currentFailures: 0 });
  };

  // ==================== MODAL HANDLERS ====================
  const addCombatantsFromModal = (combatants: TrackedCombatant[]) => {
    setEncounter(prev => prev ? { ...prev, combatants: [...prev.combatants, ...combatants] } : prev);
    setShowAddModal(false);
  };
  const addParticipantsFromModal = (participants: SkillParticipant[]) => {
    updateSkill({ participants: [...(skill?.participants || []), ...participants] });
    setShowAddModal(false);
  };

  const linkedCampaign = encounter?.campaignId
    ? campaignsFull.find((c: Campaign) => c.id === encounter.campaignId)
    : undefined;

  const addAllCampaignCharacters = useCallback(async () => {
    if (!encounter?.campaignId || !linkedCampaign?.characters?.length) return;
    setAddingAllChars(true);
    try {
      const results = await Promise.all(
        linkedCampaign.characters.map(async (c: { userId: string; characterId: string; characterName: string }) => {
          try {
            const res = await fetch(
              `/api/campaigns/${encounter.campaignId}/characters/${c.userId}/${c.characterId}?scope=encounter`
            );
            if (!res.ok) return null;
            return { charMeta: c, data: await res.json() };
          } catch {
            return null;
          }
        })
      );
      const combatants: TrackedCombatant[] = results
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .map((r) => {
          const d = r.data;
          const abilities = d.abilities || {};
          return {
            id: generateId(),
            name: r.charMeta.characterName,
            initiative: 0,
            acuity: abilities.acuity ?? 0,
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
          };
        });
      setEncounter(prev => prev ? { ...prev, combatants: [...prev.combatants, ...combatants] } : prev);
      const participants: SkillParticipant[] = linkedCampaign.characters.map(
        (c: { userId: string; characterId: string; characterName: string }) => ({
          id: generateId(),
          name: c.characterName,
          hasRolled: false,
          sourceType: 'campaign-character' as const,
          sourceId: c.characterId,
        })
      );
      updateSkill({ participants: [...(skill?.participants || []), ...participants] });
    } catch (err) {
      console.error('Failed to add campaign characters:', err);
    } finally {
      setAddingAllChars(false);
    }
  }, [encounter, linkedCampaign, skill?.participants, updateSkill]);

  // ==================== RENDER ====================
  if (isLoading) return <PageContainer size="full"><LoadingState message="Loading encounter..." size="lg" /></PageContainer>;
  if (error || (!isLoading && !encounterData)) return <PageContainer size="full"><Alert variant="danger" title="Encounter not found">This encounter may have been deleted.</Alert><Link href="/encounters" className="mt-4 inline-block text-primary-600 hover:underline">Back to Encounters</Link></PageContainer>;
  if (!encounter || !skill) return <PageContainer size="full"><LoadingState message="Initializing..." /></PageContainer>;

  return (
    <RollProvider>
    <PageContainer size="full">
      {/* Header */}
      <div className="mb-6">
        <Link href="/encounters" className="inline-flex items-center gap-1 text-text-secondary hover:text-primary-600 mb-2 text-sm">
          <ChevronLeft className="w-4 h-4" /> Back to Encounters
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{encounter.name}</h1>
            <p className="text-text-secondary">Mixed Encounter{encounter.description ? ` \u2014 ${encounter.description}` : ''}</p>
            <p className="text-xs mt-1 flex items-center gap-1">
              {isSaving ? <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1"><CloudOff className="w-3 h-3" /> Saving...</span>
                : hasUnsavedChanges ? <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1"><CloudOff className="w-3 h-3" /> Unsaved changes</span>
                : <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><Cloud className="w-3 h-3" /> Saved to cloud</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-6 p-1 bg-surface-alt rounded-lg max-w-xs">
        <button
          onClick={() => setActiveView('combat')}
          className={cn('flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors', activeView === 'combat' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary')}
        >
          <Swords className="w-4 h-4" /> Combat
        </button>
        <button
          onClick={() => setActiveView('skill')}
          className={cn('flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors', activeView === 'skill' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary')}
        >
          <Brain className="w-4 h-4" /> Skill
        </button>
      </div>

      {activeView === 'combat' ? (
        /* ================ COMBAT VIEW ================ */
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-surface rounded-xl shadow-md p-4 flex flex-wrap items-center gap-4 sticky top-4 z-10">
              {!encounter.isActive ? (
                <>
                  <Button onClick={startCombat} disabled={encounter.combatants.length === 0}>Start Encounter</Button>
                  <Button onClick={sortInitiative}>Sort Initiative</Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={previousTurn}>Previous</Button>
                  <Button onClick={nextTurn}>Next Turn</Button>
                  <Button variant="danger" onClick={endCombat}>End Combat</Button>
                </>
              )}
              {encounter.isActive && <div className="px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 rounded-lg font-bold ml-auto">Round {encounter.round}</div>}
            </div>
            <div className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto pr-2">
              {sortedCombatants.length === 0 ? (
                <div className="bg-surface rounded-xl shadow-md p-8 text-center text-text-muted">No combatants added.</div>
              ) : sortedCombatants.map((c, i) => (
                <CombatantCard key={c.id} combatant={c} isCurrentTurn={encounter.isActive && i === encounter.currentTurnIndex}
                  isDragOver={dragOverId === c.id} isDragging={draggedId === c.id}
                  onUpdate={u => updateCombatant(c.id, u)} onRemove={() => removeCombatant(c.id)}
                  onDuplicate={() => duplicateCombatant(c)} onAddCondition={cn => addCondition(c.id, cn)}
                  onRemoveCondition={cn => removeCondition(c.id, cn)} onUpdateConditionLevel={(cn, d) => updateConditionLevel(c.id, cn, d)}
                  onUpdateAP={d => updateAP(c.id, d)} onDamage={a => applyDamage(c.id, a)} onHeal={a => applyHealing(c.id, a)}
                  onEnergyDrain={a => applyEnergyDrain(c.id, a)} onEnergyRestore={a => applyEnergyRestore(c.id, a)}
                  onDragStart={e => handleDragStart(e, c.id)} onDragEnd={handleDragEnd}
                  onDragOver={e => handleDragOver(e, c.id)} onDragLeave={handleDragLeave} onDrop={e => handleDrop(e, c.id)} />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-surface rounded-xl shadow-md p-6 sticky top-24">
              <h3 className="text-lg font-bold text-text-primary mb-4">Add Combatant</h3>
              <div className="mb-4 space-y-2">
                <label className="block text-sm font-medium text-text-secondary">Campaign</label>
                <select
                  value={encounter.campaignId ?? ''}
                  onChange={(e) => {
                    const id = e.target.value || undefined;
                    setEncounter(prev => prev ? { ...prev, campaignId: id } : prev);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-border-light bg-background text-text-primary text-sm"
                >
                  <option value="">No campaign</option>
                  {campaignsFull.map((c: Campaign) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {linkedCampaign && (linkedCampaign.characters?.length ?? 0) > 0 && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={addAllCampaignCharacters}
                    disabled={addingAllChars || encounter.isActive}
                  >
                    {addingAllChars ? 'Adding…' : `Add all Characters (${linkedCampaign.characters?.length ?? 0})`}
                  </Button>
                )}
              </div>
              <Button variant="secondary" className="w-full mb-4" onClick={() => setShowAddModal(true)}>From Library / Campaign</Button>
              <div className="space-y-4">
                <Input label="Name" value={newCombatant.name} onChange={e => setNewCombatant(p => ({ ...p, name: e.target.value }))} placeholder="Creature name..." />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Roll" type="number" value={newCombatant.initiative || ''} onChange={e => setNewCombatant(p => ({ ...p, initiative: parseInt(e.target.value) || 0 }))} />
                  <Input label="Acuity" type="number" value={newCombatant.acuity || ''} onChange={e => setNewCombatant(p => ({ ...p, acuity: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Max HP" type="number" value={newCombatant.maxHealth} onChange={e => setNewCombatant(p => ({ ...p, maxHealth: parseInt(e.target.value) || 1 }))} />
                  <Input label="Max EN" type="number" value={newCombatant.maxEnergy} onChange={e => setNewCombatant(p => ({ ...p, maxEnergy: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {(['ally', 'enemy', 'companion'] as const).map(t => (
                    <label key={t} className="flex items-center gap-2">
                      <input type="radio" name="mixedCombType" checked={newCombatant.combatantType === t} onChange={() => setNewCombatant(p => ({ ...p, combatantType: t, isAlly: t !== 'enemy' }))} className="w-4 h-4" />
                      <span className="text-sm font-medium capitalize">{t}</span>
                    </label>
                  ))}
                </div>
                <Button onClick={addCombatant} disabled={!newCombatant.name.trim()} className="w-full font-bold">Add Creature</Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================ SKILL VIEW ================ */
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Progress */}
            <div className="bg-surface rounded-xl border border-border-light p-4 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-green-700 dark:text-green-300">Successes: {skill.currentSuccesses} / {skill.requiredSuccesses ?? '—'}</span>
                </div>
                <div className="h-3 bg-surface-alt rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full transition-all" style={{ width: Math.min(100, ((skill.requiredSuccesses ?? 1) > 0 ? (skill.currentSuccesses / (skill.requiredSuccesses ?? 1)) * 100 : 0)) + '%' }}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-red-700 dark:text-red-300">Failures: {skill.currentFailures} / {skill.requiredFailures ?? '—'}</span>
                </div>
                <div className="h-3 bg-surface-alt rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full transition-all" style={{ width: Math.min(100, ((skill.requiredFailures ?? 1) > 0 ? (skill.currentFailures / (skill.requiredFailures ?? 1)) * 100 : 0)) + '%' }}></div></div>
              </div>
              {outcome !== 'in-progress' && (
                <div className={cn('text-center py-2 rounded-lg font-bold', outcome === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300')}>
                  {outcome === 'success' ? 'Success!' : 'Failure!'}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={resetAllRolls}><RotateCcw className="w-4 h-4" /> New Round</Button>
            </div>

            {/* Participants */}
            <div className="space-y-2">
              {skill.participants.length === 0 ? (
                <div className="bg-surface rounded-xl border border-border-light p-8 text-center text-text-muted"><Users className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No participants yet.</p></div>
              ) : skill.participants.map(p => (
                <SkillParticipantCard key={p.id} participant={p} ds={skill.difficultyScore} onUpdateRoll={v => updateParticipantRoll(p.id, v)} onClearRoll={() => clearParticipantRoll(p.id)} onRemove={() => removeSkillParticipant(p.id)} />
              ))}
            </div>
          </div>

          {/* Skill Sidebar */}
          <div className="space-y-6">
            <div className="bg-surface rounded-xl border border-border-light p-6">
              <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-blue-500" /> Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Difficulty Score (DS)</label>
                  <ValueStepper value={skill.difficultyScore} onChange={v => updateSkill({ difficultyScore: v })} min={1} max={40} size="sm" enableHoldRepeat />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Required Successes</label>
                  <ValueStepper value={skill.requiredSuccesses ?? 2} onChange={v => updateSkill({ requiredSuccesses: v })} min={1} max={50} size="sm" enableHoldRepeat />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Required Failures</label>
                  <ValueStepper value={skill.requiredFailures ?? 3} onChange={v => updateSkill({ requiredFailures: v })} min={1} max={50} size="sm" enableHoldRepeat />
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border-light p-6">
              <h3 className="font-bold text-text-primary mb-4">Add Participants</h3>
              <Button variant="secondary" className="w-full mb-4" onClick={() => setShowAddModal(true)}>From Library / Campaign</Button>
              <div className="flex gap-2">
                <Input value={newParticipantName} onChange={e => setNewParticipantName(e.target.value)} placeholder="Name..." onKeyDown={e => e.key === 'Enter' && addSkillParticipant()} />
                <Button onClick={addSkillParticipant} disabled={!newParticipantName.trim()}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddCombatantModal
          onClose={() => setShowAddModal(false)}
          onAdd={addCombatantsFromModal}
          onAddParticipants={addParticipantsFromModal}
          mode="mixed"
        />
      )}

      <RollLog viewOnlyCampaignId={encounter.campaignId} />
    </PageContainer>
    </RollProvider>
  );
}

// Simplified Skill Participant Card for mixed view
function SkillParticipantCard({ participant, ds, onUpdateRoll, onClearRoll, onRemove }: {
  participant: SkillParticipant; ds: number; onUpdateRoll: (v: number) => void; onClearRoll: () => void; onRemove: () => void;
}) {
  const [rollInput, setRollInput] = useState('');
  const submitRoll = () => { const v = parseInt(rollInput, 10); if (!isNaN(v)) { onUpdateRoll(v); setRollInput(''); } };

  return (
    <div className={cn('flex items-center gap-4 p-4 bg-surface rounded-xl border transition-colors', participant.hasRolled ? (participant.isSuccess ? 'border-green-300 dark:border-green-700' : 'border-red-300 dark:border-red-700') : 'border-border-light')}>
      <div className="flex-shrink-0">
        {participant.hasRolled ? (participant.isSuccess ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-red-600" />) : <div className="w-6 h-6 rounded-full border-2 border-border-light" />}
      </div>
      <div className="flex-1 min-w-0"><div className="font-medium text-text-primary">{participant.name}</div></div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {participant.hasRolled ? (
          <><div className={cn('px-3 py-1 rounded-lg font-bold text-sm', participant.isSuccess ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300')}>{participant.rollValue} <span className="text-xs font-normal ml-1">vs {ds}</span></div><button onClick={onClearRoll} className="p-1 text-text-muted hover:text-text-secondary rounded" title="Clear"><RotateCcw className="w-3.5 h-3.5" /></button></>
        ) : (
          <><input type="number" value={rollInput} onChange={e => setRollInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitRoll()} placeholder="Roll" className="w-16 px-2 py-1 text-sm border border-border-light rounded-lg bg-surface text-text-primary focus:border-primary-500 focus:outline-none" /><Button size="sm" onClick={submitRoll} disabled={!rollInput}>Roll</Button></>
        )}
      </div>
      <button onClick={onRemove} className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0" title="Remove"><Trash2 className="w-4 h-4" /></button>
    </div>
  );
}
