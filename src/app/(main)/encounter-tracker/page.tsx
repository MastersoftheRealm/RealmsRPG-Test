/**
 * Encounter Tracker Page
 * ======================
 * Combat encounter management tool for tracking initiative,
 * health, conditions, and combat state
 */

'use client';

import { useState, useCallback, useMemo, useEffect, DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { ProtectedRoute } from '@/components/layout';
import { Save, GripVertical } from 'lucide-react';

const STORAGE_KEY = 'realms-encounter-tracker';

interface Combatant {
  id: string;
  name: string;
  initiative: number;
  acuity: number; // For tie-breaking
  maxHealth: number;
  currentHealth: number;
  maxEnergy: number;
  currentEnergy: number;
  armor: number;
  evasion: number;
  ap: number; // Action Points
  conditions: CombatantCondition[];
  notes: string;
  isAlly: boolean; // true = ally, false = enemy
  isSurprised: boolean;
}

interface CombatantCondition {
  name: string;
  level: number; // For leveled conditions (conditions with stackable levels)
}

interface ConditionDef {
  name: string;
  leveled: boolean; // true = has levels that can be increased/decreased
  description: string;
}

interface EncounterState {
  name: string;
  combatants: Combatant[];
  round: number;
  currentTurnIndex: number;
  isActive: boolean;
  applySurprise: boolean;
}

// Game-specific conditions from vanilla
const CONDITION_OPTIONS: ConditionDef[] = [
  { name: "Bleeding", leveled: true, description: "Bleeding creatures lose 1 Hit Point for each level of bleeding at the beginning of their turn. Any healing received reduces the bleeding condition by the amount healed." },
  { name: "Blinded", leveled: false, description: "All targets are considered completely obscured to a blinded creature that relies on basic vision. Acuity Skill rolls that rely on sight automatically fail." },
  { name: "Charmed", leveled: false, description: "Charmed creatures can't attack or perform harmful Actions against the creature that charmed them. All Charisma rolls and potencies against this target from the charmer gain +2." },
  { name: "Dazed", leveled: false, description: "Dazed creatures cannot take Reactions." },
  { name: "Deafened", leveled: false, description: "You cannot hear anything in the world around you. You have resistance to sonic damage. Acuity Skill rolls that rely on hearing automatically fail." },
  { name: "Dying", leveled: false, description: "When your Hit Point total is reduced to zero or a negative value, you enter the dying condition. Each turn, at the beginning of your turn, you take 1d4 irreducible damage, doubling each turn." },
  { name: "Exhausted", leveled: true, description: "Exhaustion reduces all bonuses and Evasion by an amount equal to its level. At level 10, the character dies." },
  { name: "Exposed", leveled: true, description: "Exposed creatures decrease their Evasion by 1 for each level of Exposed." },
  { name: "Faint", leveled: false, description: "You have -1 to Evasion, Might, Reflex, and on all D20 rolls requiring balance or poise." },
  { name: "Frightened", leveled: false, description: "Frightened creatures have -2 on all scores and D20 rolls against the source of their fear." },
  { name: "Grappled", leveled: false, description: "Grappled targets have -2 to attack rolls, are +2 to hit, and cannot take movement Actions." },
  { name: "Hidden", leveled: false, description: "While hidden, you have a +2 bonus on attack rolls made against creatures unaware of your location." },
  { name: "Immobile", leveled: false, description: "Immobile creatures cannot take Movement Actions, and their Speed is considered 0." },
  { name: "Invisible", leveled: false, description: "You are considered completely obscured to all creatures relying on basic vision." },
  { name: "Prone", leveled: false, description: "While prone, your movement speed is reduced by ½. You are +2 to hit by others and have -2 to hit others." },
  { name: "Resilient", leveled: true, description: "Resilient creatures take 1 less damage each time they are damaged per Resilient level." },
  { name: "Slowed", leveled: true, description: "Slowed creatures lose 1 or more movement speed depending on the level of Slowed." },
  { name: "Stunned", leveled: true, description: "Stunned creatures lose 1 or more Action Points based on the level of Stun." },
  { name: "Susceptible", leveled: true, description: "Susceptible creatures take 1 extra damage each time they are damaged per Susceptible level." },
  { name: "Terminal", leveled: false, description: "Your current health is at or below ¼ of your maximum health, placing you in the Terminal Range." },
  { name: "Weakened", leveled: true, description: "Weakened creatures decrease all D20 rolls by 1 or more depending on the level of Weakened." },
].sort((a, b) => a.name.localeCompare(b.name));

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
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

  const [newCombatant, setNewCombatant] = useState({
    name: '',
    initiative: 0,
    acuity: 0,
    maxHealth: 20,
    maxEnergy: 10,
    armor: 0,
    evasion: 10,
    isAlly: true,
    isSurprised: false,
  });

  // Drag-and-drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    // Add slight delay to allow drag image to form
    setTimeout(() => {
      const element = document.getElementById(`combatant-${id}`);
      if (element) element.classList.add('opacity-50');
    }, 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedId) {
      const element = document.getElementById(`combatant-${draggedId}`);
      if (element) element.classList.remove('opacity-50');
    }
    setDraggedId(null);
    setDragOverId(null);
  }, [draggedId]);

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
  // Only apply surprise filtering during round 1 (surprised go to end)
  const sortedCombatants = useMemo(() => {
    if (encounter.round === 1 && encounter.applySurprise) {
      // Move surprised combatants to the end
      const notSurprised = encounter.combatants.filter(c => !c.isSurprised);
      const surprised = encounter.combatants.filter(c => c.isSurprised);
      return [...notSurprised, ...surprised];
    }
    return encounter.combatants;
  }, [encounter.combatants, encounter.round, encounter.applySurprise]);

  const addCombatant = () => {
    if (!newCombatant.name.trim()) return;
    
    const combatant: Combatant = {
      id: generateId(),
      name: newCombatant.name,
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
      isAlly: newCombatant.isAlly,
      isSurprised: newCombatant.isSurprised,
    };
    
    setEncounter(prev => ({
      ...prev,
      combatants: [...prev.combatants, combatant],
    }));
    
    setNewCombatant({
      name: '',
      initiative: 0,
      acuity: 0,
      maxHealth: 20,
      maxEnergy: 10,
      armor: 0,
      evasion: 10,
      isAlly: true,
      isSurprised: false,
    });
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

  const toggleSurprise = () => {
    setEncounter(prev => ({ ...prev, applySurprise: !prev.applySurprise }));
  };

  // Sort by initiative, optionally alternating between allies and enemies
  const sortInitiative = (alternate: boolean = false) => {
    setEncounter(prev => {
      const sortByRollAndAcuity = (a: Combatant, b: Combatant) => {
        if (b.initiative !== a.initiative) return b.initiative - a.initiative;
        return b.acuity - a.acuity;
      };

      if (!alternate) {
        // Simple sort by initiative + acuity
        const sorted = [...prev.combatants].sort(sortByRollAndAcuity);
        return { ...prev, combatants: sorted };
      }

      // Alternating sort: split by side, sort each, then interleave
      const allies = prev.combatants.filter(c => c.isAlly).sort(sortByRollAndAcuity);
      const enemies = prev.combatants.filter(c => !c.isAlly).sort(sortByRollAndAcuity);

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

      return { ...prev, combatants: sorted };
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

  // Show loading state until localStorage is checked
  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading encounter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Encounter Tracker</h1>
          <p className="text-gray-600">
            Manage combat encounters, track initiative, and monitor combatant status.
          </p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <Save className="w-3 h-3" />
            Auto-saved to browser
          </p>
        </div>
        <div className="flex items-center gap-2 text-lg">
          {encounter.isActive && (
            <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-bold">
              Round {encounter.round}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Combatant List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Combat Controls */}
          <div className="bg-white rounded-xl shadow-md p-4 flex flex-wrap items-center gap-4">
            {!encounter.isActive ? (
              <>
                <button
                  onClick={startCombat}
                  disabled={encounter.combatants.length === 0}
                  className="px-6 py-2 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Encounter
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => sortInitiative(false)}
                    className="px-4 py-2 rounded-l-lg bg-primary-600 text-white hover:bg-primary-700"
                    title="Sort by initiative roll and acuity"
                  >
                    Sort
                  </button>
                  <button
                    onClick={() => sortInitiative(true)}
                    className="px-3 py-2 rounded-r-lg bg-primary-500 text-white hover:bg-primary-600 text-sm"
                    title="Sort by initiative, alternating between allies and enemies"
                  >
                    ⇆
                  </button>
                </div>
                <label className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                  <input
                    type="checkbox"
                    checked={encounter.applySurprise}
                    onChange={toggleSurprise}
                    className="w-4 h-4 rounded text-amber-600"
                  />
                  <span className="text-sm text-amber-800">Apply Surprise</span>
                </label>
              </>
            ) : (
              <>
                <button
                  onClick={previousTurn}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  ← Previous
                </button>
                <button
                  onClick={nextTurn}
                  className="px-6 py-2 rounded-lg font-bold bg-primary-600 text-white hover:bg-primary-700"
                >
                  Next Turn →
                </button>
                <button
                  onClick={endCombat}
                  className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                >
                  End Combat
                </button>
              </>
            )}
            <button
              onClick={resetEncounter}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 ml-auto"
            >
              Reset All
            </button>
            <button
              onClick={() => setEncounter(prev => ({ ...prev, combatants: [] }))}
              className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
            >
              Clear All
            </button>
          </div>

          {/* Help tip when not in combat */}
          {!encounter.isActive && sortedCombatants.length > 0 && (
            <div className="text-xs text-gray-500 flex items-center gap-4 px-2">
              <span>💡 Drag combatants to reorder manually</span>
              <span>•</span>
              <span>⇆ = Alternating ally/enemy sort</span>
            </div>
          )}

          {/* Combatant Cards */}
          <div className="space-y-3">
            {sortedCombatants.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
                No combatants added yet. Add some using the panel on the right.
              </div>
            ) : (
              sortedCombatants.map((combatant, index) => (
                <CombatantCard
                  key={combatant.id}
                  combatant={combatant}
                  isCurrentTurn={encounter.isActive && index === encounter.currentTurnIndex}
                  isDragOver={dragOverId === combatant.id}
                  onUpdate={(updates) => updateCombatant(combatant.id, updates)}
                  onRemove={() => removeCombatant(combatant.id)}
                  onAddCondition={(condition) => addCondition(combatant.id, condition)}
                  onRemoveCondition={(condition) => removeCondition(combatant.id, condition)}
                  onUpdateConditionLevel={(condition, delta) => updateConditionLevel(combatant.id, condition, delta)}
                  onUpdateAP={(delta) => updateAP(combatant.id, delta)}
                  onDamage={(amount) => applyDamage(combatant.id, amount)}
                  onHeal={(amount) => applyHealing(combatant.id, amount)}
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
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Combatant</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newCombatant.name}
                  onChange={(e) => setNewCombatant(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Creature name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll</label>
                  <input
                    type="number"
                    value={newCombatant.initiative || ''}
                    onChange={(e) => setNewCombatant(prev => ({ ...prev, initiative: parseInt(e.target.value) || 0 }))}
                    placeholder="Init"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Acuity</label>
                  <input
                    type="number"
                    value={newCombatant.acuity || ''}
                    onChange={(e) => setNewCombatant(prev => ({ ...prev, acuity: parseInt(e.target.value) || 0 }))}
                    placeholder="Acuity"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max HP</label>
                  <input
                    type="number"
                    value={newCombatant.maxHealth}
                    onChange={(e) => setNewCombatant(prev => ({ ...prev, maxHealth: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Ally/Enemy Toggle */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="side"
                    checked={newCombatant.isAlly}
                    onChange={() => setNewCombatant(prev => ({ ...prev, isAlly: true }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Ally</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="side"
                    checked={!newCombatant.isAlly}
                    onChange={() => setNewCombatant(prev => ({ ...prev, isAlly: false }))}
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="text-sm text-gray-700">Enemy</span>
                </label>
                <label className="flex items-center gap-2 ml-auto">
                  <input
                    type="checkbox"
                    checked={newCombatant.isSurprised}
                    onChange={(e) => setNewCombatant(prev => ({ ...prev, isSurprised: e.target.checked }))}
                    className="w-4 h-4 rounded text-amber-600"
                  />
                  <span className="text-sm text-gray-700">Surprised</span>
                </label>
              </div>
              
              <button
                onClick={addCombatant}
                disabled={!newCombatant.name.trim()}
                className="w-full py-2 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Creature
              </button>
            </div>
          </div>

          {/* Quick Reference */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Conditions Reference</h3>
            <div className="flex flex-wrap gap-1">
              {CONDITION_OPTIONS.map(condition => (
                <span 
                  key={condition.name} 
                  title={condition.description}
                  className={cn(
                    'px-2 py-1 text-xs rounded-full cursor-help',
                    condition.leveled 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {condition.name}{condition.leveled && ' ⬇'}
                </span>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-500 space-y-1">
              <p><span className="inline-block w-3 h-3 rounded-full bg-purple-100 mr-1"></span>Purple = Leveled (has levels)</p>
              <p><span className="inline-block w-3 h-3 rounded-full bg-indigo-100 mr-1"></span>Indigo = Custom condition</p>
              <p className="pt-1">Click name to ↑ level, × to ↓ level (removes at 0)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CombatantCardProps {
  combatant: Combatant;
  isCurrentTurn: boolean;
  isDragOver: boolean;
  onUpdate: (updates: Partial<Combatant>) => void;
  onRemove: () => void;
  onAddCondition: (condition: string) => void;
  onRemoveCondition: (condition: string) => void;
  onUpdateConditionLevel: (condition: string, delta: number) => void;
  onUpdateAP: (delta: number) => void;
  onDamage: (amount: number) => void;
  onHeal: (amount: number) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
}

function CombatantCard({ 
  combatant, 
  isCurrentTurn, 
  isDragOver,
  onUpdate, 
  onRemove,
  onAddCondition,
  onRemoveCondition,
  onUpdateConditionLevel,
  onUpdateAP,
  onDamage,
  onHeal,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: CombatantCardProps) {
  const [damageInput, setDamageInput] = useState('');
  const [healInput, setHealInput] = useState('');
  const [showConditions, setShowConditions] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState('');
  const [customCondition, setCustomCondition] = useState('');

  const healthPercent = combatant.maxHealth > 0 ? (combatant.currentHealth / combatant.maxHealth) * 100 : 0;
  const isDead = combatant.currentHealth <= 0 && !combatant.isAlly;

  const handleDamage = () => {
    const amount = parseInt(damageInput);
    if (amount > 0) {
      onDamage(amount);
      setDamageInput('');
    }
  };

  const handleHeal = () => {
    const amount = parseInt(healInput);
    if (amount > 0) {
      onHeal(amount);
      setHealInput('');
    }
  };

  const handleAddCondition = () => {
    if (selectedCondition) {
      onAddCondition(selectedCondition);
      setSelectedCondition('');
    }
  };

  const handleAddCustomCondition = () => {
    const name = customCondition.trim();
    if (name && !combatant.conditions.some(c => c.name === name)) {
      onAddCondition(name);
      setCustomCondition('');
    }
  };

  return (
    <div 
      id={`combatant-${combatant.id}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'bg-white rounded-xl shadow-md p-4 transition-all cursor-move',
        isCurrentTurn && 'ring-2 ring-primary-500 shadow-lg',
        isDead && 'bg-red-50 opacity-75',
        isDragOver && 'ring-2 ring-amber-400 bg-amber-50',
        combatant.isAlly ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-red-500'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5" />
          </div>
          {/* Initiative Badge */}
          <div className={cn(
            'w-12 h-12 rounded-lg flex flex-col items-center justify-center',
            isCurrentTurn ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
          )}>
            <span className="text-xl font-bold">{combatant.initiative}</span>
            {combatant.acuity !== 0 && (
              <span className="text-xs opacity-75">+{combatant.acuity}</span>
            )}
          </div>
        </div>

        {/* Main Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={cn('text-lg font-bold', isDead && 'line-through text-gray-500')}>
              {combatant.name}
            </h3>
            {combatant.isSurprised && (
              <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-medium">
                Surprised
              </span>
            )}
            {isCurrentTurn && (
              <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full font-medium">
                Current Turn
              </span>
            )}
            {isDead && (
              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                Down
              </span>
            )}
            
            {/* AP Tracker */}
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-sm text-gray-500">AP:</span>
              <button
                onClick={() => onUpdateAP(-1)}
                className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-sm"
              >
                −
              </button>
              <span className={cn(
                'w-8 text-center font-bold',
                combatant.ap === 0 && 'text-red-600'
              )}>
                {combatant.ap}
              </span>
              <button
                onClick={() => onUpdateAP(1)}
                className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* HP Display */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">HP:</span>
              <input
                type="number"
                value={combatant.currentHealth}
                onChange={(e) => onUpdate({ currentHealth: parseInt(e.target.value) || 0 })}
                className={cn(
                  'w-16 px-2 py-1 text-sm border rounded text-center font-medium',
                  combatant.currentHealth <= 0 ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300'
                )}
              />
              <span className="text-gray-400">/</span>
              <input
                type="number"
                value={combatant.maxHealth}
                onChange={(e) => onUpdate({ maxHealth: parseInt(e.target.value) || 1 })}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
              />
            </div>
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full transition-all',
                  healthPercent > 50 ? 'bg-green-500' :
                  healthPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${Math.max(0, Math.min(100, healthPercent))}%` }}
              />
            </div>
          </div>

          {/* Conditions */}
          {combatant.conditions.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {combatant.conditions.map(cond => {
                const condDef = CONDITION_OPTIONS.find(c => c.name === cond.name);
                // Custom conditions (not in CONDITION_OPTIONS) are leveled by default
                // We can tell by checking if level > 0
                const isLeveled = condDef?.leveled ?? (cond.level > 0);
                const isCustom = !condDef;
                return (
                  <div
                    key={cond.name}
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-full flex items-center gap-1 select-none',
                      isCustom ? 'bg-indigo-100 text-indigo-800' :
                      isLeveled ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                    )}
                    title={condDef?.description ?? 'Custom condition (leveled). Left-click to increase, right-click to decrease level.'}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (isLeveled) {
                        onUpdateConditionLevel(cond.name, -1);
                      } else {
                        onRemoveCondition(cond.name);
                      }
                    }}
                  >
                    <span 
                      onClick={() => isLeveled && onUpdateConditionLevel(cond.name, 1)}
                      className={cn(isLeveled && 'cursor-pointer hover:underline')}
                    >
                      {cond.name}{isLeveled && ` (${cond.level})`}
                    </span>
                    <button
                      onClick={() => isLeveled ? onUpdateConditionLevel(cond.name, -1) : onRemoveCondition(cond.name)}
                      className="hover:text-red-600 font-bold"
                      title={isLeveled ? 'Decrease level (removes at 0)' : 'Remove condition'}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={damageInput}
                onChange={(e) => setDamageInput(e.target.value)}
                placeholder="Dmg"
                className="w-14 px-2 py-1 text-sm border border-gray-300 rounded"
                onKeyDown={(e) => e.key === 'Enter' && handleDamage()}
              />
              <button
                onClick={handleDamage}
                className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Dmg
              </button>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={healInput}
                onChange={(e) => setHealInput(e.target.value)}
                placeholder="Heal"
                className="w-14 px-2 py-1 text-sm border border-gray-300 rounded"
                onKeyDown={(e) => e.key === 'Enter' && handleHeal()}
              />
              <button
                onClick={handleHeal}
                className="px-2 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Heal
              </button>
            </div>
            <button
              onClick={() => setShowConditions(!showConditions)}
              className={cn(
                'px-2 py-1 text-sm rounded',
                showConditions ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              )}
            >
              {showConditions ? '▲' : '▼'} Conditions
            </button>
            <button
              onClick={onRemove}
              className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 ml-auto"
            >
              ✕
            </button>
          </div>

          {/* Conditions Picker */}
          {showConditions && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="">Select Condition...</option>
                  {CONDITION_OPTIONS.map(cond => (
                    <option 
                      key={cond.name} 
                      value={cond.name}
                      disabled={combatant.conditions.some(c => c.name === cond.name)}
                    >
                      {cond.name}{cond.leveled ? ' ⬇' : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddCondition}
                  disabled={!selectedCondition}
                  className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                  placeholder="Custom condition..."
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCondition()}
                  maxLength={30}
                />
                <button
                  onClick={handleAddCustomCondition}
                  disabled={!customCondition.trim()}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  Add Custom
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Left-click to increase level, right-click or × to decrease/remove. Custom conditions are leveled.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EncounterTrackerPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <EncounterTrackerContent />
      </div>
    </ProtectedRoute>
  );
}
