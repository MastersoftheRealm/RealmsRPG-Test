/**
 * Library Section
 * ===============
 * Displays character's powers, techniques, equipment, proficiencies, and notes
 * Supports edit mode for adding/removing items
 * Weapons have clickable attack/damage rolls
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useRollsOptional } from './roll-context';
import { NotesTab } from './notes-tab';
import { ProficienciesTab } from './proficiencies-tab';
import type { CharacterPower, CharacterTechnique, Item, Abilities } from '@/types';

interface LibrarySectionProps {
  powers: CharacterPower[];
  techniques: CharacterTechnique[];
  weapons: Item[];
  armor: Item[];
  equipment: Item[];
  currency?: number;
  innateEnergy?: number;
  isEditMode?: boolean;
  // Power/Technique/Equipment callbacks
  onAddPower?: () => void;
  onRemovePower?: (id: string | number) => void;
  onAddTechnique?: () => void;
  onRemoveTechnique?: (id: string | number) => void;
  onAddWeapon?: () => void;
  onRemoveWeapon?: (id: string | number) => void;
  onToggleEquipWeapon?: (id: string | number) => void;
  onAddArmor?: () => void;
  onRemoveArmor?: (id: string | number) => void;
  onToggleEquipArmor?: (id: string | number) => void;
  onAddEquipment?: () => void;
  onRemoveEquipment?: (id: string | number) => void;
  onCurrencyChange?: (value: number) => void;
  // Notes tab props
  weight?: number;
  height?: number;
  appearance?: string;
  archetypeDesc?: string;
  notes?: string;
  abilities?: Abilities;
  onWeightChange?: (value: number) => void;
  onHeightChange?: (value: number) => void;
  onAppearanceChange?: (value: string) => void;
  onArchetypeDescChange?: (value: string) => void;
  onNotesChange?: (value: string) => void;
  // Proficiencies tab props
  level?: number;
  archetypeAbility?: number;
}

type TabType = 'powers' | 'techniques' | 'weapons' | 'armor' | 'equipment' | 'proficiencies' | 'notes';

interface PowerCardProps {
  power: CharacterPower;
  innateEnergy?: number;
  isEditMode?: boolean;
  onRemove?: () => void;
}

function PowerCard({ power, innateEnergy, isEditMode, onRemove }: PowerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isInnate = power.cost !== undefined && innateEnergy !== undefined && power.cost <= innateEnergy;

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden',
      isInnate ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white'
    )}>
      <div className="flex items-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left"
        >
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            <span className="font-medium text-gray-800">{power.name}</span>
            {isInnate && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-200 text-purple-700">
                Innate
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {power.cost !== undefined && (
              <span className="text-blue-600 font-medium">{power.cost} EP</span>
            )}
            {power.level && (
              <span>Lvl {power.level}</span>
            )}
          </div>
        </button>
        {isEditMode && onRemove && (
          <button
            onClick={onRemove}
            className="p-2 text-red-500 hover:bg-red-50 transition-colors"
            title="Remove power"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {expanded && power.description && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-sm text-gray-600">{power.description}</p>
        </div>
      )}
    </div>
  );
}

interface TechniqueCardProps {
  technique: CharacterTechnique;
  isEditMode?: boolean;
  onRemove?: () => void;
}

function TechniqueCard({ technique, isEditMode, onRemove }: TechniqueCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left"
        >
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            <span className="font-medium text-gray-800">{technique.name}</span>
          </div>
          {technique.cost !== undefined && (
            <span className="text-sm text-red-600 font-medium">{technique.cost} SP</span>
          )}
        </button>
        {isEditMode && onRemove && (
          <button
            onClick={onRemove}
            className="p-2 text-red-500 hover:bg-red-50 transition-colors"
            title="Remove technique"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {expanded && technique.description && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-sm text-gray-600">{technique.description}</p>
        </div>
      )}
    </div>
  );
}

interface ItemCardProps {
  item: Item;
  type: 'weapon' | 'armor' | 'equipment';
  isEditMode?: boolean;
  onRemove?: () => void;
  onToggleEquip?: () => void;
  onRollAttack?: () => void;
  onRollDamage?: () => void;
}

function ItemCard({ item, type, isEditMode, onRemove, onToggleEquip, onRollAttack, onRollDamage }: ItemCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden',
      item.equipped ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
    )}>
      <div className="flex items-center">
        {isEditMode && onToggleEquip && (type === 'weapon' || type === 'armor') && (
          <button
            onClick={onToggleEquip}
            className={cn(
              'px-2 py-2 transition-colors',
              item.equipped 
                ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                : 'text-gray-400 hover:bg-gray-100'
            )}
            title={item.equipped ? 'Unequip' : 'Equip'}
          >
            {item.equipped ? '✓' : '○'}
          </button>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left"
        >
          <div className="flex items-center gap-2">
            {!isEditMode && item.equipped && (
              <span className="text-green-600">✓</span>
            )}
            <span className="font-medium text-gray-800">{item.name}</span>
            {item.quantity && item.quantity > 1 && (
              <span className="text-xs text-gray-500">×{item.quantity}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {type === 'weapon' && item.damage && (
              <span className="text-red-600 font-medium">{item.damage}</span>
            )}
            {type === 'armor' && item.armor && (
              <span className="text-blue-600 font-medium">+{item.armor} AR</span>
            )}
          </div>
        </button>
        
        {/* Attack/Damage roll buttons for weapons */}
        {type === 'weapon' && !isEditMode && (
          <div className="flex items-center gap-1 pr-2">
            {onRollAttack && (
              <button
                onClick={onRollAttack}
                className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                title="Roll attack"
              >
                ⚔️ Atk
              </button>
            )}
            {onRollDamage && item.damage && (
              <button
                onClick={onRollDamage}
                className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                title="Roll damage"
              >
                💥 Dmg
              </button>
            )}
          </div>
        )}
        
        {isEditMode && onRemove && (
          <button
            onClick={onRemove}
            className="p-2 text-red-500 hover:bg-red-50 transition-colors"
            title="Remove item"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
          {item.description && (
            <p className="text-sm text-gray-600 mb-1">{item.description}</p>
          )}
          {item.properties && item.properties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.properties.map((prop, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-200 rounded">
                  {typeof prop === 'string' ? prop : prop.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LibrarySection({
  powers,
  techniques,
  weapons,
  armor,
  equipment,
  currency = 0,
  innateEnergy = 0,
  isEditMode = false,
  onAddPower,
  onRemovePower,
  onAddTechnique,
  onRemoveTechnique,
  onAddWeapon,
  onRemoveWeapon,
  onToggleEquipWeapon,
  onAddArmor,
  onRemoveArmor,
  onToggleEquipArmor,
  onAddEquipment,
  onRemoveEquipment,
  onCurrencyChange,
  // Notes props
  weight = 70,
  height = 170,
  appearance = '',
  archetypeDesc = '',
  notes = '',
  abilities,
  onWeightChange,
  onHeightChange,
  onAppearanceChange,
  onArchetypeDescChange,
  onNotesChange,
  // Proficiencies props
  level = 1,
  archetypeAbility = 0,
}: LibrarySectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('powers');
  const [currencyInput, setCurrencyInput] = useState(currency.toString());
  const rollContext = useRollsOptional();

  const tabs: { id: TabType; label: string; count?: number; onAdd?: () => void }[] = [
    { id: 'powers', label: 'Powers', count: powers.length, onAdd: onAddPower },
    { id: 'techniques', label: 'Techniques', count: techniques.length, onAdd: onAddTechnique },
    { id: 'weapons', label: 'Weapons', count: weapons.length, onAdd: onAddWeapon },
    { id: 'armor', label: 'Armor', count: armor.length, onAdd: onAddArmor },
    { id: 'equipment', label: 'Equipment', count: equipment.length, onAdd: onAddEquipment },
    { id: 'proficiencies', label: 'Proficiencies' },
    { id: 'notes', label: 'Notes' },
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);

  const handleCurrencyBlur = () => {
    const value = parseInt(currencyInput) || 0;
    if (value !== currency && onCurrencyChange) {
      onCurrencyChange(value);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-4 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-1.5 rounded-t-lg text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-primary-100 text-primary-700 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1 text-xs opacity-70">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Currency + Add Button Row - only show for inventory-related tabs */}
      {['powers', 'techniques', 'weapons', 'armor', 'equipment'].includes(activeTab) && (
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">💰</span>
            {isEditMode && onCurrencyChange ? (
              <input
                type="number"
                value={currencyInput}
                onChange={(e) => setCurrencyInput(e.target.value)}
                onBlur={handleCurrencyBlur}
                className="w-24 px-2 py-1 text-sm font-bold text-amber-600 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500"
              />
            ) : (
              <span className="font-bold text-amber-600">{currency.toLocaleString()}</span>
            )}
            <span className="text-sm text-gray-600">currency</span>
          </div>
          
          {isEditMode && activeTabData?.onAdd && (
            <button
              onClick={activeTabData.onAdd}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            Add
          </button>
        )}
        </div>
      )}

      {/* Content */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {activeTab === 'powers' && (
          powers.length > 0 ? (
            powers.map((power, i) => (
              <PowerCard 
                key={power.id || i} 
                power={power} 
                innateEnergy={innateEnergy}
                isEditMode={isEditMode}
                onRemove={onRemovePower ? () => onRemovePower(power.id || String(i)) : undefined}
              />
            ))
          ) : (
            <p className="text-gray-400 text-sm italic text-center py-4">
              No powers learned
            </p>
          )
        )}

        {activeTab === 'techniques' && (
          techniques.length > 0 ? (
            techniques.map((tech, i) => (
              <TechniqueCard 
                key={tech.id || i} 
                technique={tech}
                isEditMode={isEditMode}
                onRemove={onRemoveTechnique ? () => onRemoveTechnique(tech.id || String(i)) : undefined}
              />
            ))
          ) : (
            <p className="text-gray-400 text-sm italic text-center py-4">
              No techniques learned
            </p>
          )
        )}

        {activeTab === 'weapons' && (
          weapons.length > 0 ? (
            weapons.map((item, i) => {
              // Calculate attack bonus - typically martial ability + proficiency
              // For now we'll use 0 as a baseline (character sheet page should calculate this)
              const attackBonus = (item as Item & { attackBonus?: number }).attackBonus ?? 0;
              return (
                <ItemCard 
                  key={item.id || i} 
                  item={item} 
                  type="weapon"
                  isEditMode={isEditMode}
                  onRemove={onRemoveWeapon ? () => onRemoveWeapon(item.id || String(i)) : undefined}
                  onToggleEquip={onToggleEquipWeapon ? () => onToggleEquipWeapon(item.id || String(i)) : undefined}
                  onRollAttack={rollContext ? () => rollContext.rollAttack(item.name, attackBonus) : undefined}
                  onRollDamage={rollContext && item.damage ? () => rollContext.rollDamage(item.damage as string) : undefined}
                />
              );
            })
          ) : (
            <p className="text-gray-400 text-sm italic text-center py-4">
              No weapons equipped
            </p>
          )
        )}

        {activeTab === 'armor' && (
          armor.length > 0 ? (
            armor.map((item, i) => (
              <ItemCard 
                key={item.id || i} 
                item={item} 
                type="armor"
                isEditMode={isEditMode}
                onRemove={onRemoveArmor ? () => onRemoveArmor(item.id || String(i)) : undefined}
                onToggleEquip={onToggleEquipArmor ? () => onToggleEquipArmor(item.id || String(i)) : undefined}
              />
            ))
          ) : (
            <p className="text-gray-400 text-sm italic text-center py-4">
              No armor equipped
            </p>
          )
        )}

        {activeTab === 'equipment' && (
          equipment.length > 0 ? (
            equipment.map((item, i) => (
              <ItemCard 
                key={item.id || i} 
                item={item} 
                type="equipment"
                isEditMode={isEditMode}
                onRemove={onRemoveEquipment ? () => onRemoveEquipment(item.id || String(i)) : undefined}
              />
            ))
          ) : (
            <p className="text-gray-400 text-sm italic text-center py-4">
              No equipment in inventory
            </p>
          )
        )}

        {activeTab === 'proficiencies' && (
          <ProficienciesTab
            powers={powers}
            techniques={techniques}
            weapons={weapons}
            armor={armor}
            level={level}
            archetypeAbility={archetypeAbility}
          />
        )}

        {activeTab === 'notes' && abilities && (
          <NotesTab
            weight={weight}
            height={height}
            appearance={appearance}
            archetypeDesc={archetypeDesc}
            notes={notes}
            abilities={abilities}
            isEditMode={isEditMode}
            onWeightChange={onWeightChange}
            onHeightChange={onHeightChange}
            onAppearanceChange={onAppearanceChange}
            onArchetypeDescChange={onArchetypeDescChange}
            onNotesChange={onNotesChange}
          />
        )}

        {activeTab === 'notes' && !abilities && (
          <p className="text-gray-400 text-sm italic text-center py-4">
            Character abilities not loaded
          </p>
        )}
      </div>
    </div>
  );
}
