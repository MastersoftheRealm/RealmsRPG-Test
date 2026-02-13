/**
 * Encounter Tracker Page
 * ======================
 * Combat encounter management tool for tracking initiative,
 * health, conditions, and combat state
 */

'use client';

import { useState, useCallback, useMemo, useEffect, DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { Save } from 'lucide-react';
import { LoadingState, Button, Checkbox, Input, PageContainer } from '@/components/ui';
import { ValueStepper } from '@/components/shared';
import type { Combatant, CombatantCondition, CombatantType, EncounterState } from './encounter-tracker-types';
import { STORAGE_KEY, CONDITION_OPTIONS } from './encounter-tracker-constants';
import { CombatantCard } from './CombatantCard';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/** Roll initiative: d20 + acuity bonus */
function rollInitiative(acuity: number): number {
  return Math.floor(Math.random() * 20) + 1 + acuity;
}

function EncounterTrackerContent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [encounter, setEncounter] = useState<EncounterState>({
    name: 'New Encounter',
    combatants: [],
    round: 0,
    currentTurnIndex: -1,
    isActive: false,
    applySurprise: false,
  });

  // Load saved encounter from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as EncounterState;
        setEncounter(parsed);
      }
    } catch (e) {
      console.error('Failed to load encounter:', e);
    }
    setIsLoaded(true);
  }, []);

  // Auto-save encounter to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return; // Don't save until initial load is complete
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(encounter));
    } catch (e) {
      console.error('Failed to save encounter:', e);
    }
  }, [encounter, isLoaded]);

  const [newCombatant, setNewCombatant] = useState(() => ({
    name: '',
    initiative: rollInitiative(0),
    acuity: 0,
    maxHealth: 20,
    maxEnergy: 10,
    armor: 0,
    evasion: 10,
    combatantType: 'ally' as CombatantType,
    isAlly: true, // For backwards compatibility
    isSurprised: false,
    quantity: 1,
  }));

  // Drag-and-drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedId) {
      setDragOverId(id);
    }
  }, [draggedId]);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    setEncounter(prev => {
      const combatants = [...prev.combatants];
      const draggedIndex = combatants.findIndex(c => c.id === draggedId);
      const targetIndex = combatants.findIndex(c => c.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      // Remove dragged item and insert at target position
      const [draggedItem] = combatants.splice(draggedIndex, 1);
      combatants.splice(targetIndex, 0, draggedItem);

      return { ...prev, combatants };
    });

    setDraggedId(null);
    setDragOverId(null);
  }, [draggedId]);

  // Display combatants in their current order
  // Auto-apply surprise during round 1 (surprised go to end), companions always go last
  const sortedCombatants = useMemo(() => {
    let combatants = [...encounter.combatants];
    
    // Separate companions (they always go at the end)
    const companions = combatants.filter(c => c.combatantType === 'companion');
    const nonCompanions = combatants.filter(c => c.combatantType !== 'companion');
    
    if (encounter.round === 1) {
      // Move surprised non-companions to the end (before companions)
      const notSurprised = nonCompanions.filter(c => !c.isSurprised);
      const surprised = nonCompanions.filter(c => c.isSurprised);
      return [...notSurprised, ...surprised, ...companions];
    }
    
    return [...nonCompanions, ...companions];
  }, [encounter.combatants, encounter.round]);

  // Generate suffix letters for duplicate names (A, B, C, etc.)
  const getNextSuffix = (baseName: string, existingCombatants: Combatant[]): string => {
    const existingNames = existingCombatants
      .map(c => c.name)
      .filter(name => name.startsWith(baseName));
    
    if (existingNames.length === 0) return '';
    
    // Find the highest letter suffix used
    const usedSuffixes = existingNames
      .map(name => {
        const match = name.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*([A-Z])?$`));
        return match ? match[1] || '' : '';
      })
      .filter(Boolean);
    
    // Get next available letter
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const letter of alphabet) {
      if (!usedSuffixes.includes(letter)) {
        return ` ${letter}`;
      }
    }
    return ` ${alphabet.length + 1}`;
  };

  const addCombatant = () => {
    if (!newCombatant.name.trim()) return;
    
    const quantity = Math.max(1, Math.min(26, newCombatant.quantity || 1));
    const newCombatants: Combatant[] = [];
    
    for (let i = 0; i < quantity; i++) {
      const suffix = quantity > 1 ? ` ${String.fromCharCode(65 + i)}` : '';
      const combatant: Combatant = {
        id: generateId(),
        name: newCombatant.name + suffix,
        initiative: newCombatant.initiative,
        acuity: newCombatant.acuity,
        maxHealth: newCombatant.maxHealth,
        maxEnergy: newCombatant.maxEnergy,
        armor: newCombatant.armor,
        evasion: newCombatant.evasion,
        currentHealth: newCombatant.maxHealth,
        currentEnergy: newCombatant.maxEnergy,
        ap: 4, // Default AP
        conditions: [],
        notes: '',
        combatantType: newCombatant.combatantType,
        isAlly: newCombatant.combatantType === 'ally' || newCombatant.combatantType === 'companion',
        isSurprised: newCombatant.isSurprised,
      };
      newCombatants.push(combatant);
    }
    
    setEncounter(prev => ({
      ...prev,
      combatants: [...prev.combatants, ...newCombatants],
    }));
    
    setNewCombatant({
      name: '',
      initiative: rollInitiative(0),
      acuity: 0,
      maxHealth: 20,
      maxEnergy: 10,
      armor: 0,
      evasion: 10,
      combatantType: 'ally',
      isAlly: true,
      isSurprised: false,
      quantity: 1,
    });
  };

  // Duplicate a combatant with next letter suffix
  const duplicateCombatant = (combatant: Combatant) => {
    // Get base name without existing letter suffix
    const baseNameMatch = combatant.name.match(/^(.+?)\s*[A-Z]?$/);
    const baseName = baseNameMatch ? baseNameMatch[1].trim() : combatant.name;
    
    const suffix = getNextSuffix(baseName, [...encounter.combatants, combatant]);
    
    const duplicate: Combatant = {
      ...combatant,
      id: generateId(),
      name: baseName + suffix,
      currentHealth: combatant.maxHealth,
      currentEnergy: combatant.maxEnergy,
      conditions: [],
    };
    
    setEncounter(prev => ({
      ...prev,
      combatants: [...prev.combatants, duplicate],
    }));
  };

  const removeCombatant = (id: string) => {
    setEncounter(prev => ({
      ...prev,
      combatants: prev.combatants.filter(c => c.id !== id),
    }));
  };

  const updateCombatant = (id: string, updates: Partial<Combatant>) => {
    setEncounter(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  };

  // Add a condition to a combatant
  const addCondition = (id: string, conditionName: string) => {
    const condDef = CONDITION_OPTIONS.find(c => c.name === conditionName);
    // Custom conditions are leveled by default
    const isLeveled = condDef?.leveled ?? true;
    
    setEncounter(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => {
        if (c.id !== id) return c;
        // Check if already has condition
        if (c.conditions.some(cond => cond.name === conditionName)) return c;
        return {
          ...c,
          conditions: [...c.conditions, { name: conditionName, level: isLeveled ? 1 : 0 }]
        };
      }),
    }));
  };

  // Remove a condition from a combatant
  const removeCondition = (id: string, conditionName: string) => {
    setEncounter(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => {
        if (c.id !== id) return c;
        return {
          ...c,
          conditions: c.conditions.filter(cond => cond.name !== conditionName)
        };
      }),
    }));
  };

  // Increase/decrease condition level (for leveled conditions)
  const updateConditionLevel = (id: string, conditionName: string, delta: number) => {
    setEncounter(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => {
        if (c.id !== id) return c;
        return {
          ...c,
          conditions: c.conditions.map(cond => {
            if (cond.name !== conditionName) return cond;
            const newLevel = cond.level + delta;
            // Remove if level drops to 0 or below
            if (newLevel <= 0) return null;
            return { ...cond, level: newLevel };
          }).filter((cond): cond is CombatantCondition => cond !== null)
        };
      }),
    }));
  };

  // Update AP for a combatant
  const updateAP = (id: string, delta: number) => {
    setEncounter(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => {
        if (c.id !== id) return c;
        return { ...c, ap: Math.max(0, Math.min(10, c.ap + delta)) };
      }),
    }));
  };

  // Note: AP can be manually reset via the updateCombatant function if needed

  const startCombat = () => {
    if (sortedCombatants.length === 0) return;
    setEncounter(prev => ({
      ...prev,
      round: 1,
      currentTurnIndex: 0,
      isActive: true,
    }));
  };

  const nextTurn = () => {
    setEncounter(prev => {
      const nextIndex = prev.currentTurnIndex + 1;
      if (nextIndex >= sortedCombatants.length) {
        return {
          ...prev,
          round: prev.round + 1,
          currentTurnIndex: 0,
        };
      }
      return {
        ...prev,
        currentTurnIndex: nextIndex,
      };
    });
  };

  const previousTurn = () => {
    setEncounter(prev => {
      if (prev.currentTurnIndex === 0 && prev.round === 1) return prev;
      if (prev.currentTurnIndex === 0) {
        return {
          ...prev,
          round: prev.round - 1,
          currentTurnIndex: sortedCombatants.length - 1,
        };
      }
      return {
        ...prev,
        currentTurnIndex: prev.currentTurnIndex - 1,
      };
    });
  };

  const endCombat = () => {
    setEncounter(prev => ({
      ...prev,
      round: 0,
      currentTurnIndex: -1,
      isActive: false,
    }));
  };

  const resetEncounter = () => {
    setEncounter(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => ({
        ...c,
        currentHealth: c.maxHealth,
        currentEnergy: c.maxEnergy,
        ap: 4,
        conditions: [],
        isSurprised: false,
      })),
      round: 0,
      currentTurnIndex: -1,
      isActive: false,
    }));
  };

  // Sort by alternative initiative (alternating between allies and enemies), companions always last
  const sortInitiative = () => {
    setEncounter(prev => {
      const sortByRollAndAcuity = (a: Combatant, b: Combatant) => {
        if (b.initiative !== a.initiative) return b.initiative - a.initiative;
        return b.acuity - a.acuity;
      };

      // Separate companions (they always go last in their own order)
      const companions = prev.combatants
        .filter(c => c.combatantType === 'companion')
        .sort(sortByRollAndAcuity);

      // Alternating sort: split by side, sort each, then interleave
      const allies = prev.combatants
        .filter(c => c.combatantType === 'ally')
        .sort(sortByRollAndAcuity);
      const enemies = prev.combatants
        .filter(c => c.combatantType === 'enemy')
        .sort(sortByRollAndAcuity);

      // Determine which side starts (whoever has highest initiative)
      const firstAlly = allies[0];
      const firstEnemy = enemies[0];
      let startWithAlly = true;

      if (firstAlly && firstEnemy) {
        const comparison = sortByRollAndAcuity(firstAlly, firstEnemy);
        startWithAlly = comparison <= 0; // Ally goes first if equal or lower (means higher initiative)
      } else if (!firstAlly) {
        startWithAlly = false;
      }

      // Interleave allies and enemies
      const sorted: Combatant[] = [];
      const alliesCopy = [...allies];
      const enemiesCopy = [...enemies];
      let useAlly = startWithAlly;

      while (alliesCopy.length > 0 || enemiesCopy.length > 0) {
        if (useAlly && alliesCopy.length > 0) {
          sorted.push(alliesCopy.shift()!);
        } else if (!useAlly && enemiesCopy.length > 0) {
          sorted.push(enemiesCopy.shift()!);
        } else if (alliesCopy.length > 0) {
          sorted.push(alliesCopy.shift()!);
        } else if (enemiesCopy.length > 0) {
          sorted.push(enemiesCopy.shift()!);
        }
        useAlly = !useAlly;
      }

      // Add companions at the end
      return { ...prev, combatants: [...sorted, ...companions] };
    });
  };

  const applyDamage = useCallback((id: string, amount: number) => {
    updateCombatant(id, {
      currentHealth: Math.max(0, encounter.combatants.find(c => c.id === id)!.currentHealth - amount)
    });
  }, [encounter.combatants]);

  const applyHealing = useCallback((id: string, amount: number) => {
    const combatant = encounter.combatants.find(c => c.id === id)!;
    updateCombatant(id, {
      currentHealth: Math.min(combatant.maxHealth, combatant.currentHealth + amount)
    });
  }, [encounter.combatants]);

  const applyEnergyDrain = useCallback((id: string, amount: number) => {
    updateCombatant(id, {
      currentEnergy: Math.max(0, encounter.combatants.find(c => c.id === id)!.currentEnergy - amount)
    });
  }, [encounter.combatants]);

  const applyEnergyRestore = useCallback((id: string, amount: number) => {
    const combatant = encounter.combatants.find(c => c.id === id)!;
    updateCombatant(id, {
      currentEnergy: Math.min(combatant.maxEnergy, combatant.currentEnergy + amount)
    });
  }, [encounter.combatants]);

  // Calculate current turn number across all rounds
  const currentTurnNumber = useMemo(() => {
    if (!encounter.isActive) return 0;
    return (encounter.round - 1) * sortedCombatants.length + encounter.currentTurnIndex + 1;
  }, [encounter.isActive, encounter.round, encounter.currentTurnIndex, sortedCombatants.length]);

  // Show loading state until localStorage is checked
  if (!isLoaded) {
    return (
      <PageContainer size="full">
        <div className="flex items-center justify-center py-20">
          <LoadingState message="Loading encounter..." size="lg" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Encounter Tracker</h1>
          <p className="text-text-secondary">
            Manage combat encounters, track initiative, and monitor combatant status.
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
            <Save className="w-3 h-3" />
            Auto-saved to browser
          </p>
        </div>
        <div className="flex items-center gap-2 text-lg">
          {encounter.isActive && (
            <div className="px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 rounded-lg font-bold">
              Round {encounter.round} • Turn {encounter.currentTurnIndex + 1}/{sortedCombatants.length}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Combatant List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Combat Controls - Sticky */}
          <div className="bg-surface rounded-xl shadow-md p-4 flex flex-wrap items-center gap-4 sticky top-4 z-10">
            {!encounter.isActive ? (
              <>
                <Button
                  onClick={startCombat}
                  disabled={encounter.combatants.length === 0}
                >
                  Start Encounter
                </Button>
                <Button
                  onClick={sortInitiative}
                  title="Sort by alternative initiative (alternating allies/enemies, companions last)"
                >
                  Sort Initiative ⇆
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={previousTurn}
                >
                  ← Previous
                </Button>
                <Button
                  onClick={nextTurn}
                >
                  Next Turn →
                </Button>
                <Button
                  variant="danger"
                  onClick={endCombat}
                >
                  End Combat
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              onClick={resetEncounter}
              className="ml-auto"
            >
              Reset All
            </Button>
            <Button
              variant="danger"
              onClick={() => setEncounter(prev => ({ ...prev, combatants: [] }))}
            >
              Clear All
            </Button>
          </div>

          {/* Help tip when not in combat */}
          {!encounter.isActive && sortedCombatants.length > 0 && (
            <div className="text-xs text-text-muted flex items-center gap-4 px-2">
              <span>💡 Drag the grip handle to reorder • Surprised creatures go last in round 1 • Companions always go last</span>
            </div>
          )}

          {/* Combatant Cards - Scrollable Container */}
          <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 scroll-smooth">
            {sortedCombatants.length === 0 ? (
              <div className="bg-surface rounded-xl shadow-md p-8 text-center text-text-muted">
                No combatants added yet. Add some using the panel on the right.
              </div>
            ) : (
              sortedCombatants.map((combatant, index) => (
                <CombatantCard
                  key={combatant.id}
                  combatant={combatant}
                  isCurrentTurn={encounter.isActive && index === encounter.currentTurnIndex}
                  isDragOver={dragOverId === combatant.id}
                  isDragging={draggedId === combatant.id}
                  onUpdate={(updates) => updateCombatant(combatant.id, updates)}
                  onRemove={() => removeCombatant(combatant.id)}
                  onDuplicate={() => duplicateCombatant(combatant)}
                  onAddCondition={(condition) => addCondition(combatant.id, condition)}
                  onRemoveCondition={(condition) => removeCondition(combatant.id, condition)}
                  onUpdateConditionLevel={(condition, delta) => updateConditionLevel(combatant.id, condition, delta)}
                  onUpdateAP={(delta) => updateAP(combatant.id, delta)}
                  onDamage={(amount) => applyDamage(combatant.id, amount)}
                  onHeal={(amount) => applyHealing(combatant.id, amount)}
                  onEnergyDrain={(amount) => applyEnergyDrain(combatant.id, amount)}
                  onEnergyRestore={(amount) => applyEnergyRestore(combatant.id, amount)}
                  onDragStart={(e) => handleDragStart(e, combatant.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, combatant.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, combatant.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Add Combatant Panel */}
        <div className="space-y-6">
          <div className="bg-surface rounded-xl shadow-md p-6 sticky top-24">
            <h3 className="text-lg font-bold text-text-primary mb-4">Add Combatant</h3>
            
            <div className="space-y-4">
              <Input
                label="Name"
                type="text"
                value={newCombatant.name}
                onChange={(e) => setNewCombatant(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Creature name..."
              />
              
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Roll"
                  type="number"
                  value={newCombatant.initiative || ''}
                  onChange={(e) => setNewCombatant(prev => ({ ...prev, initiative: parseInt(e.target.value) || 0 }))}
                  placeholder="Init"
                />
                <Input
                  label="Acuity"
                  type="number"
                  value={newCombatant.acuity || ''}
                  onChange={(e) => setNewCombatant(prev => ({ ...prev, acuity: parseInt(e.target.value) || 0 }))}
                  placeholder="Acuity"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Max HP"
                  type="number"
                  value={newCombatant.maxHealth}
                  onChange={(e) => setNewCombatant(prev => ({ ...prev, maxHealth: parseInt(e.target.value) || 1 }))}
                />
                <Input
                  label="Max EN"
                  type="number"
                  value={newCombatant.maxEnergy}
                  onChange={(e) => setNewCombatant(prev => ({ ...prev, maxEnergy: parseInt(e.target.value) || 0 }))}
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Quantity</label>
                <div className="flex items-center gap-2">
                  <ValueStepper
                    value={newCombatant.quantity || 1}
                    onChange={(value) => setNewCombatant(prev => ({ ...prev, quantity: value }))}
                    min={1}
                    max={26}
                    size="sm"
                    enableHoldRepeat
                  />
                  <span className="text-xs text-text-muted ml-2">Creates A, B, C... suffixes</span>
                </div>
              </div>

              {/* Ally/Enemy/Companion Toggle */}
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="combatantType"
                    checked={newCombatant.combatantType === 'ally'}
                    onChange={() => setNewCombatant(prev => ({ ...prev, combatantType: 'ally', isAlly: true }))}
                    className="w-4 h-4 text-blue-600 dark:text-blue-400"
                  />
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Ally</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="combatantType"
                    checked={newCombatant.combatantType === 'enemy'}
                    onChange={() => setNewCombatant(prev => ({ ...prev, combatantType: 'enemy', isAlly: false }))}
                    className="w-4 h-4 text-red-600 dark:text-red-400"
                  />
                  <span className="text-sm text-red-700 dark:text-red-300 font-medium">Enemy</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="combatantType"
                    checked={newCombatant.combatantType === 'companion'}
                    onChange={() => setNewCombatant(prev => ({ ...prev, combatantType: 'companion', isAlly: true }))}
                    className="w-4 h-4 text-companion"
                  />
                  <span className="text-sm text-companion-text dark:text-violet-300 font-medium">Companion</span>
                </label>
              </div>
              
              <Checkbox
                checked={newCombatant.isSurprised}
                onChange={(e) => setNewCombatant(prev => ({ ...prev, isSurprised: e.target.checked }))}
                label="Surprised (goes last in round 1)"
              />
              
              <Button
                onClick={addCombatant}
                disabled={!newCombatant.name.trim()}
                className="w-full font-bold"
              >
                Add Creature
              </Button>
            </div>
          </div>

          {/* Quick Reference */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Conditions Reference</h3>
            <div className="flex flex-wrap gap-1">
              {CONDITION_OPTIONS.map(condition => (
                <span 
                  key={condition.name} 
                  title={condition.description}
                  className={cn(
                    'px-2 py-1 text-xs rounded-full cursor-help',
                    condition.leveled 
                      ? 'bg-companion-light text-companion-text' 
                      : 'bg-surface-alt text-text-secondary'
                  )}
                >
                  {condition.name}{condition.leveled && ' ⬇'}
                </span>
              ))}
            </div>
            <div className="mt-3 text-xs text-text-muted space-y-1">
              <p><span className="inline-block w-3 h-3 rounded-full bg-companion-light mr-1"></span>Purple = Leveled (has levels)</p>
              <p><span className="inline-block w-3 h-3 rounded-full bg-indigo-100 mr-1"></span>Indigo = Custom condition</p>
              <p className="pt-1">Click name to ↑ level, × to ↓ level (removes at 0)</p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default function EncounterTrackerPage() {
  // Redirect to new Encounters system with optional localStorage import
  return <EncounterTrackerRedirect />;
}

import { EncounterTrackerRedirect } from './redirect-page';
