'use client';

/**
 * CreatureStatBlock - D&D-style Creature Display
 * ===============================================
 * Compact, scannable stat block format for creatures.
 * Used in Library, Encounter Tracker, and Creature Creator preview.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit, Trash2, Copy, Heart, Zap, Shield, Swords } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui';

// =============================================================================
// Types
// =============================================================================

export interface CreatureAbilities {
  strength?: number;
  agility?: number;
  vitality?: number;
  intellect?: number;
  charisma?: number;
  perception?: number;
  willpower?: number;
  [key: string]: number | undefined;
}

export interface CreatureDefenses {
  might?: number;
  fortitude?: number;
  reflex?: number;
  discernment?: number;
  mentalFortitude?: number;
  resolve?: number;
  [key: string]: number | undefined;
}

export interface CreatureData {
  id: string;
  name: string;
  description?: string;
  level?: number;
  type?: string;
  size?: string;
  hp?: number;
  hitPoints?: number;
  energyPoints?: number;
  abilities?: CreatureAbilities;
  defenses?: CreatureDefenses;
  powerProficiency?: number;
  martialProficiency?: number;
  resistances?: string[];
  weaknesses?: string[];
  immunities?: string[];
  conditionImmunities?: string[];
  senses?: string[];
  movementTypes?: string[];
  languages?: string[];
  skills?: Array<{ name: string; value: number; proficient?: boolean }> | Record<string, number>;
  powers?: Array<{ name: string; description?: string }>;
  techniques?: Array<{ name: string; description?: string }>;
  feats?: Array<{ name: string; description?: string }>;
  armaments?: Array<{ name: string }>;
}

export interface CreatureStatBlockProps {
  creature: CreatureData;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  showActions?: boolean;
  expanded?: boolean;
  compact?: boolean;
  className?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

function getAbilityAbbrev(ability: string): string {
  const abbrevs: Record<string, string> = {
    strength: 'STR',
    agility: 'AGI',
    vitality: 'VIT',
    intellect: 'INT',
    charisma: 'CHA',
    perception: 'PER',
    willpower: 'WIL',
  };
  return abbrevs[ability.toLowerCase()] || ability.slice(0, 3).toUpperCase();
}

function getDefenseAbbrev(defense: string): string {
  const abbrevs: Record<string, string> = {
    might: 'Mgt',
    fortitude: 'Fort',
    reflex: 'Ref',
    discernment: 'Dis',
    mentalFortitude: 'MF',
    resolve: 'Res',
  };
  return abbrevs[defense] || defense.slice(0, 3);
}

// =============================================================================
// Sub-components
// =============================================================================

function AbilityRow({ abilities }: { abilities: CreatureAbilities }) {
  const order = ['strength', 'agility', 'vitality', 'intellect', 'charisma', 'perception', 'willpower'];
  const entries = order.filter(key => abilities[key] !== undefined);
  
  return (
    <div className="grid grid-cols-7 gap-1 text-center text-xs">
      {entries.map((ability) => {
        const value = abilities[ability] ?? 0;
        return (
          <div key={ability} className="flex flex-col">
            <span className="font-bold text-text-muted">{getAbilityAbbrev(ability)}</span>
            <span className={cn(
              'font-medium',
              value > 0 ? 'text-success-600' : value < 0 ? 'text-danger-600' : 'text-text-muted'
            )}>
              {formatModifier(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DefenseRow({ defenses }: { defenses: CreatureDefenses }) {
  const order = ['might', 'fortitude', 'reflex', 'discernment', 'mentalFortitude', 'resolve'];
  const entries = order.filter(key => defenses[key] !== undefined && defenses[key] !== 0);
  
  if (entries.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {entries.map((defense) => {
        const value = defenses[defense] ?? 0;
        return (
          <span key={defense} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
            {getDefenseAbbrev(defense)} {formatModifier(value)}
          </span>
        );
      })}
    </div>
  );
}

function TagList({ label, items, variant = 'default' }: { 
  label: string; 
  items: string[]; 
  variant?: 'default' | 'success' | 'danger' | 'warning';
}) {
  if (!items || items.length === 0) return null;
  
  const colors = {
    default: 'bg-surface-alt text-text-secondary',
    success: 'bg-green-100 text-green-700',
    danger: 'bg-red-100 text-red-700',
    warning: 'bg-yellow-100 text-yellow-700',
  };
  
  return (
    <div className="text-xs">
      <span className="font-semibold text-text-muted">{label}: </span>
      {items.map((item, i) => (
        <span key={i}>
          <span className={cn('px-1.5 py-0.5 rounded', colors[variant])}>{item}</span>
          {i < items.length - 1 && ' '}
        </span>
      ))}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function CreatureStatBlock({
  creature,
  onEdit,
  onDelete,
  onDuplicate,
  showActions = true,
  expanded: initialExpanded = false,
  compact = false,
  className,
}: CreatureStatBlockProps) {
  const [expanded, setExpanded] = useState(initialExpanded);
  
  const hp = creature.hitPoints ?? creature.hp ?? 0;
  const ep = creature.energyPoints ?? 0;
  
  return (
    <div className={cn(
      'bg-surface rounded-lg border border-border-light shadow-sm overflow-hidden',
      className
    )}>
      {/* Header - always visible */}
      <div 
        className="bg-gradient-to-r from-neutral-800 to-neutral-700 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-white text-lg">{creature.name}</h3>
            <div className="flex gap-2">
              {creature.size && (
                <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded">
                  {creature.size}
                </span>
              )}
              {creature.type && (
                <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded">
                  {creature.type}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Quick stats in header */}
            <div className="flex items-center gap-3 text-white text-sm">
              {creature.level !== undefined && (
                <span className="font-medium">Lv {creature.level}</span>
              )}
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-400" />
                {hp}
              </span>
              {ep > 0 && (
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  {ep}
                </span>
              )}
            </div>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-white/70" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/70" />
            )}
          </div>
        </div>
      </div>
      
      {/* Expanded content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Description */}
          {creature.description && (
            <p className="text-sm text-text-muted italic border-l-2 border-border-light pl-3">
              {creature.description}
            </p>
          )}
          
          {/* Abilities */}
          {creature.abilities && Object.keys(creature.abilities).length > 0 && (
            <div className="border-t border-b border-border-light py-3">
              <AbilityRow abilities={creature.abilities} />
            </div>
          )}
          
          {/* Defenses & Proficiencies */}
          <div className="space-y-2">
            {creature.defenses && <DefenseRow defenses={creature.defenses} />}
            
            <div className="flex flex-wrap gap-3 text-xs">
              {creature.powerProficiency !== undefined && creature.powerProficiency > 0 && (
                <span className="flex items-center gap-1 text-power-text">
                  <Zap className="w-3 h-3" /> Power +{creature.powerProficiency}
                </span>
              )}
              {creature.martialProficiency !== undefined && creature.martialProficiency > 0 && (
                <span className="flex items-center gap-1 text-martial-text">
                  <Swords className="w-3 h-3" /> Martial +{creature.martialProficiency}
                </span>
              )}
            </div>
          </div>
          
          {/* Damage Modifiers */}
          <div className="space-y-1">
            <TagList label="Resistances" items={creature.resistances || []} variant="success" />
            <TagList label="Weaknesses" items={creature.weaknesses || []} variant="danger" />
            <TagList label="Immunities" items={creature.immunities || []} variant="default" />
            <TagList label="Condition Immunities" items={creature.conditionImmunities || []} />
          </div>
          
          {/* Senses, Movement, Languages */}
          {(creature.senses?.length || creature.movementTypes?.length || creature.languages?.length) && (
            <div className="space-y-1 text-xs text-text-muted">
              {creature.senses && creature.senses.length > 0 && (
                <div><span className="font-semibold">Senses:</span> {creature.senses.join(', ')}</div>
              )}
              {creature.movementTypes && creature.movementTypes.length > 0 && (
                <div><span className="font-semibold">Movement:</span> {creature.movementTypes.join(', ')}</div>
              )}
              {creature.languages && creature.languages.length > 0 && (
                <div><span className="font-semibold">Languages:</span> {creature.languages.join(', ')}</div>
              )}
            </div>
          )}
          
          {/* Skills */}
          {creature.skills && (
            <div className="text-xs">
              <span className="font-semibold text-text-muted">Skills: </span>
              <span className="text-text-secondary">
                {Array.isArray(creature.skills)
                  ? creature.skills
                      .filter(s => s.value !== 0 || s.proficient)
                      .map(s => `${s.name} ${formatModifier(s.value)}${s.proficient ? '*' : ''}`)
                      .join(', ')
                  : Object.entries(creature.skills)
                      .filter(([, value]) => value !== 0)
                      .map(([skill, value]) => `${skill} ${formatModifier(value as number)}`)
                      .join(', ')
                }
              </span>
            </div>
          )}
          
          {/* Combat - Powers, Techniques, Feats */}
          {!compact && (
            <div className="space-y-2 pt-2 border-t border-border-light">
              {creature.powers && creature.powers.length > 0 && (
                <div className="text-xs">
                  <span className="font-semibold text-power-text">Powers: </span>
                  <span className="text-text-secondary">
                    {creature.powers.map(p => p.name).join(', ')}
                  </span>
                </div>
              )}
              {creature.techniques && creature.techniques.length > 0 && (
                <div className="text-xs">
                  <span className="font-semibold text-martial-text">Techniques: </span>
                  <span className="text-text-secondary">
                    {creature.techniques.map(t => t.name).join(', ')}
                  </span>
                </div>
              )}
              {creature.feats && creature.feats.length > 0 && (
                <div className="text-xs">
                  <span className="font-semibold text-blue-700">Feats: </span>
                  <span className="text-text-secondary">
                    {creature.feats.map(f => f.name).join(', ')}
                  </span>
                </div>
              )}
              {creature.armaments && creature.armaments.length > 0 && (
                <div className="text-xs">
                  <span className="font-semibold text-text-secondary">Equipment: </span>
                  <span className="text-text-muted">
                    {creature.armaments.map(a => a.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Actions */}
          {showActions && (onEdit || onDelete || onDuplicate) && (
            <div className="flex justify-end gap-2 pt-3 border-t border-border-light">
              {onDuplicate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CreatureStatBlock;
