/**
 * Archetype Section
 * =================
 * Displays character archetype, proficiencies, and feats
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import type { Character, CharacterFeat } from '@/types';

interface ArchetypeSectionProps {
  character: Character;
  isEditMode?: boolean;
  onFeatUse?: (featId: string, currentUses: number) => void;
  onAddArchetypeFeat?: () => void;
  onAddCharacterFeat?: () => void;
}

function ProficiencyMeter({ 
  label, 
  value, 
  maxValue = 6,
  color = 'blue' 
}: { 
  label: string; 
  value: number; 
  maxValue?: number;
  color?: 'blue' | 'purple' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: maxValue }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full',
              i < value ? colorClasses[color] : 'bg-gray-200'
            )}
          />
        ))}
      </div>
    </div>
  );
}

function FeatCard({ 
  feat, 
  isEditMode,
  onUse 
}: { 
  feat: CharacterFeat; 
  isEditMode?: boolean;
  onUse?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasUsesRemaining = feat.maxUses && (feat.currentUses ?? feat.maxUses) > 0;

  return (
    <div 
      className={cn(
        'border border-gray-200 rounded-lg overflow-hidden transition-all',
        expanded && 'shadow-md'
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800">{feat.name}</span>
          {feat.type && (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              feat.type === 'archetype' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
            )}>
              {feat.type}
            </span>
          )}
        </div>
        {feat.maxUses && (
          <span className={cn(
            'text-sm font-medium',
            hasUsesRemaining ? 'text-green-600' : 'text-gray-400'
          )}>
            {feat.currentUses ?? feat.maxUses}/{feat.maxUses}
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-2">
            {feat.description || 'No description available.'}
          </p>
          
          {feat.maxUses && isEditMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUse?.();
              }}
              disabled={!hasUsesRemaining}
              className={cn(
                'px-3 py-1 rounded text-sm font-medium transition-colors',
                hasUsesRemaining 
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              Use Ability
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ArchetypeSection({
  character,
  isEditMode = false,
  onFeatUse,
  onAddArchetypeFeat,
  onAddCharacterFeat,
}: ArchetypeSectionProps) {
  const martialProf = character.martialProficiency ?? 0;
  const powerProf = character.powerProficiency ?? 0;
  
  // Combine archetype and character feats
  const allFeats = [
    ...(character.archetypeFeats || []).map(f => ({ ...f, type: 'archetype' as const })),
    ...(character.feats || []).map(f => ({ ...f, type: 'character' as const })),
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
      {/* Archetype Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">
          {character.archetype?.name || 'No Archetype'}
        </h2>
        {character.archetype?.description && (
          <p className="text-sm text-gray-500 mt-1">
            {character.archetype.description}
          </p>
        )}
      </div>

      {/* Proficiencies */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <ProficiencyMeter 
          label="Martial" 
          value={martialProf}
          color="red"
        />
        <ProficiencyMeter 
          label="Power" 
          value={powerProf}
          color="purple"
        />
      </div>

      {/* Abilities used */}
      <div className="flex flex-wrap gap-2 mb-4">
        {character.mart_abil && (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
            Martial: {character.mart_abil}
          </span>
        )}
        {character.pow_abil && (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
            Power: {character.pow_abil}
          </span>
        )}
      </div>

      {/* Feats */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Feats ({allFeats.length})
          </h3>
          {isEditMode && (
            <div className="flex gap-2">
              <button
                onClick={onAddArchetypeFeat}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Archetype
              </button>
              <button
                onClick={onAddCharacterFeat}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Character
              </button>
            </div>
          )}
        </div>
        
        {allFeats.length > 0 ? (
          <div className="space-y-2">
            {allFeats.map((feat, index) => (
              <FeatCard
                key={feat.id || index}
                feat={feat}
                isEditMode={isEditMode}
                onUse={() => onFeatUse?.(String(feat.id), (feat.currentUses ?? feat.maxUses ?? 1) - 1)}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm italic">No feats selected</p>
        )}
      </div>
    </div>
  );
}
