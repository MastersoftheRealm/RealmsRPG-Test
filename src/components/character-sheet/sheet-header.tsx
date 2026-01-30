/**
 * Character Sheet Header
 * ======================
 * Displays character identity, portrait, and vital stats
 * Defense blocks are clickable to roll saving throws
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { useRollsOptional } from './roll-context';
import { HealthEnergyAllocator } from '@/components/creator';
import type { Character } from '@/types';

interface CalculatedStats {
  maxHealth: number;
  maxEnergy: number;
  terminal: number;
  speed: number;
  evasion: number;
  armor: number;
  defenseBonuses: Record<string, number>;
  defenseScores: Record<string, number>;
}

interface SheetHeaderProps {
  character: Character;
  calculatedStats: CalculatedStats;
  isEditMode?: boolean;
  onHealthChange?: (value: number) => void;
  onEnergyChange?: (value: number) => void;
  onHealthPointsChange?: (value: number) => void;
  onEnergyPointsChange?: (value: number) => void;
  onPortraitChange?: (file: File) => void;
  isUploadingPortrait?: boolean;
  // Speed/Evasion base editing
  speedBase?: number;
  evasionBase?: number;
  onSpeedBaseChange?: (value: number) => void;
  onEvasionBaseChange?: (value: number) => void;
  // Innate info from archetype progression
  innateThreshold?: number;
  innatePools?: number;
}

function ResourceBar({
  label,
  current,
  max,
  color,
  terminalThreshold,
  showControls,
  onChange,
}: {
  label: string;
  current: number;
  max: number;
  color: 'red' | 'blue';
  terminalThreshold?: number;
  showControls?: boolean;
  onChange?: (value: number) => void;
}) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const isTerminal = terminalThreshold && current <= terminalThreshold && current > 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm font-medium">
        <span className="text-text-secondary">{label}</span>
        <span className={cn(
          'font-bold',
          isTerminal && 'text-yellow-600',
          current <= 0 && 'text-red-600'
        )}>
          {current} / {max}
        </span>
      </div>
      <div className="relative h-6 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute inset-y-0 left-0 transition-all duration-300',
            color === 'red' ? 'bg-red-500' : 'bg-blue-500',
            isTerminal && 'bg-yellow-500 animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        />
        {terminalThreshold && (
          <div
            className="absolute inset-y-0 w-0.5 bg-yellow-600 opacity-50"
            style={{ left: `${(terminalThreshold / max) * 100}%` }}
            title={`Terminal: ${terminalThreshold}`}
          />
        )}
      </div>
      {showControls && onChange && (
        <div className="flex gap-2 mt-1 items-center justify-center">
          <button
            onClick={() => onChange(Math.max(0, current - 1))}
            className="px-2 py-1 bg-neutral-200 rounded hover:bg-neutral-300 text-sm font-bold"
            disabled={current <= 0}
          >
            −
          </button>
          <input
            type="number"
            value={current}
            onChange={(e) => onChange(Math.max(0, Math.min(max, parseInt(e.target.value) || 0)))}
            className="w-16 text-center border rounded px-2 py-1 text-sm"
            min={0}
            max={max}
          />
          <button
            onClick={() => onChange(Math.min(max, current + 1))}
            className="px-2 py-1 bg-neutral-200 rounded hover:bg-neutral-300 text-sm font-bold"
            disabled={current >= max}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value, subValue }: { label: string; value: number | string; subValue?: string }) {
  return (
    <div className="flex flex-col items-center p-2 bg-neutral-100 rounded-lg min-w-[60px]">
      <span className="text-xs text-text-muted uppercase tracking-wide">{label}</span>
      <span className="text-xl font-bold text-text-primary">{value}</span>
      {subValue && <span className="text-xs text-text-muted">{subValue}</span>}
    </div>
  );
}

// Editable stat block for speed/evasion base values
function EditableStatBlock({ 
  label, 
  value, 
  baseValue,
  defaultBase,
  subValue, 
  isEditMode,
  onChange,
  minBase = 0,
  maxBase = 20,
}: { 
  label: string; 
  value: number | string; 
  baseValue?: number;
  defaultBase?: number;
  subValue?: string;
  isEditMode?: boolean;
  onChange?: (newBase: number) => void;
  minBase?: number;
  maxBase?: number;
}) {
  // Check if base is overridden from default
  const isOverridden = defaultBase !== undefined && baseValue !== undefined && baseValue !== defaultBase;
  
  if (isEditMode && onChange && baseValue !== undefined) {
    return (
      <div className="flex flex-col items-center p-2 bg-neutral-100 rounded-lg min-w-[70px]">
        <span className="text-xs text-text-muted uppercase tracking-wide">{label}</span>
        <span className="text-xl font-bold text-text-primary">{value}</span>
        <div className="flex items-center gap-1 mt-1">
          <button
            onClick={() => onChange(Math.max(minBase, baseValue - 1))}
            disabled={baseValue <= minBase}
            className={cn(
              'w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-colors',
              baseValue > minBase
                ? 'bg-neutral-300 hover:bg-neutral-400 text-text-secondary'
                : 'bg-neutral-200 text-text-muted cursor-not-allowed'
            )}
          >
            −
          </button>
          <span className={cn(
            'text-xs min-w-[2.5rem] text-center',
            isOverridden ? 'text-danger-600 font-bold' : 'text-text-muted'
          )}>
            Base: {baseValue}
          </span>
          <button
            onClick={() => onChange(Math.min(maxBase, baseValue + 1))}
            disabled={baseValue >= maxBase}
            className={cn(
              'w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-colors',
              baseValue < maxBase
                ? 'bg-neutral-300 hover:bg-neutral-400 text-text-secondary'
                : 'bg-neutral-200 text-text-muted cursor-not-allowed'
            )}
          >
            +
          </button>
        </div>
        {subValue && <span className="text-xs text-text-muted mt-0.5">{subValue}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-2 bg-neutral-100 rounded-lg min-w-[60px]">
      <span className="text-xs text-text-muted uppercase tracking-wide">{label}</span>
      <span className="text-xl font-bold text-text-primary">{value}</span>
      {subValue && <span className="text-xs text-text-muted">{subValue}</span>}
    </div>
  );
}

function DefenseBlock({ name, bonus, score, onRoll }: { name: string; bonus: number; score: number; onRoll?: () => void }) {
  const formattedBonus = bonus >= 0 ? `+${bonus}` : `${bonus}`;
  
  return (
    <div 
      onClick={onRoll}
      className={cn(
        "flex flex-col items-center p-2 bg-white border border-neutral-200 rounded-lg min-w-[70px] transition-all",
        onRoll && "cursor-pointer hover:bg-primary-50 hover:border-primary-300 active:scale-95"
      )}
      role={onRoll ? 'button' : undefined}
      title={onRoll ? `Click to roll ${name} save` : undefined}
    >
      <span className="text-[10px] text-text-muted uppercase tracking-wide">{name}</span>
      <span className="text-lg font-bold text-text-primary">{score}</span>
      <span className="text-xs text-text-muted">{formattedBonus}</span>
    </div>
  );
}

export function SheetHeader({
  character,
  calculatedStats,
  isEditMode = false,
  onHealthChange,
  onEnergyChange,
  onHealthPointsChange,
  onEnergyPointsChange,
  onPortraitChange,
  isUploadingPortrait = false,
  speedBase = 6,
  evasionBase = 10,
  onSpeedBaseChange,
  onEvasionBaseChange,
  innateThreshold = 0,
  innatePools = 0,
}: SheetHeaderProps) {
  const currentHealth = character.health?.current ?? calculatedStats.maxHealth;
  const currentEnergy = character.energy?.current ?? calculatedStats.maxEnergy;
  const rollContext = useRollsOptional();
  
  const genderSymbol = character.description?.includes('female') ? '♀' : 
                       character.description?.includes('male') ? '♂' : '';

  // Check if character can level up (XP >= level * 4)
  const xp = character.experience ?? 0;
  const level = character.level || 1;
  const canLevelUp = xp >= (level * 4);

  // Calculate H/E pool (vanilla formula: 18 + 12*(level-1))
  const totalHEPool = 18 + 12 * (level - 1);
  const healthPoints = character.healthPoints ?? 0;
  const energyPoints = character.energyPoints ?? 0;
  const spentHEPoints = healthPoints + energyPoints;
  const remainingHEPoints = totalHEPool - spentHEPoints;

  // Handle portrait file selection
  const handlePortraitClick = () => {
    if (!isEditMode || !onPortraitChange) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onPortraitChange(file);
      }
    };
    input.click();
  };

  // Defense names mapping
  const defenseLabels: Record<string, string> = {
    might: 'Might',
    fortitude: 'Fortitude',
    reflex: 'Reflex',
    discernment: 'Discernment',
    mentalFortitude: 'Mental Fort',
    resolve: 'Resolve',
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Portrait and Identity */}
        <div className="flex gap-4">
          <div 
            className={cn(
              "relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-neutral-200 flex-shrink-0",
              isEditMode && onPortraitChange && "cursor-pointer group"
            )}
            onClick={handlePortraitClick}
            title={isEditMode && onPortraitChange ? "Click to change portrait" : undefined}
          >
            <Image
              src={character.portrait || '/images/placeholder-portrait.png'}
              alt={character.name}
              fill
              className={cn(
                "object-cover transition-opacity",
                isUploadingPortrait && "opacity-50"
              )}
              sizes="(max-width: 768px) 96px, 128px"
            />
            {/* Upload overlay in edit mode */}
            {isEditMode && onPortraitChange && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl">
                  📷
                </span>
              </div>
            )}
            {/* Loading spinner */}
            {isUploadingPortrait && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Spinner size="md" variant="white" />
              </div>
            )}
          </div>
          
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
              {character.name}
              {genderSymbol && <span className="ml-2 text-text-muted">{genderSymbol}</span>}
            </h1>
            <p className="text-text-secondary">
              Level {character.level} {character.ancestry?.name || 'Unknown Ancestry'}
            </p>
            <p className="text-text-muted text-sm">
              {character.archetype?.name || 'No Archetype'}
            </p>
            {/* Archetype Abilities Display */}
            {(character.pow_abil || character.mart_abil) && (
              <p className="text-xs text-text-muted flex items-center gap-1">
                {character.pow_abil && (
                  <span className="text-category-power">Power: {character.pow_abil}</span>
                )}
                {character.pow_abil && character.mart_abil && (
                  <span className="text-neutral-300">•</span>
                )}
                {character.mart_abil && (
                  <span className="text-category-technique">Martial: {character.mart_abil}</span>
                )}
              </p>
            )}
            {/* XP Display with Level Up indicator */}
            <p className="text-text-muted text-sm flex items-center gap-1">
              <span>XP: {character.experience ?? 0}</span>
              {canLevelUp && (
                <span 
                  className="text-success-600 animate-pulse" 
                  title="Ready to level up!"
                >
                  ⬆
                </span>
              )}
              {canLevelUp && (
                <span className="text-xs text-success-600">(Level up available!)</span>
              )}
            </p>
          </div>
        </div>

        {/* Core Stats */}
        <div className="flex flex-wrap gap-2 items-start">
          <EditableStatBlock 
            label="Speed" 
            value={calculatedStats.speed}
            baseValue={speedBase}
            defaultBase={6}
            isEditMode={isEditMode}
            onChange={onSpeedBaseChange}
            minBase={1}
            maxBase={20}
          />
          <EditableStatBlock 
            label="Evasion" 
            value={calculatedStats.evasion}
            baseValue={evasionBase}
            defaultBase={10}
            isEditMode={isEditMode}
            onChange={onEvasionBaseChange}
            minBase={0}
            maxBase={20}
          />
          <StatBlock label="Armor" value={calculatedStats.armor} />
          <StatBlock label="Terminal" value={calculatedStats.terminal} subValue="HP ÷ 4" />
          {innateThreshold > 0 && (
            <StatBlock 
              label="Innate" 
              value={innateThreshold} 
              subValue={innatePools > 0 ? `${innatePools} pools` : undefined} 
            />
          )}
        </div>

        {/* Resources - always show +/- controls */}
        <div className="flex-1 space-y-3 min-w-[200px]">
          <ResourceBar
            label="Health"
            current={currentHealth}
            max={calculatedStats.maxHealth}
            color="red"
            terminalThreshold={calculatedStats.terminal}
            showControls={true}
            onChange={onHealthChange}
          />
          <ResourceBar
            label="Energy"
            current={currentEnergy}
            max={calculatedStats.maxEnergy}
            color="blue"
            showControls={true}
            onChange={onEnergyChange}
          />
          
          {/* Health-Energy Pool Allocation (edit mode only) */}
          {isEditMode && onHealthPointsChange && onEnergyPointsChange && (
            <div className="mt-4">
              <HealthEnergyAllocator
                hpBonus={healthPoints}
                energyBonus={energyPoints}
                poolTotal={totalHEPool}
                maxHp={calculatedStats.maxHealth}
                maxEnergy={calculatedStats.maxEnergy}
                onHpChange={onHealthPointsChange}
                onEnergyChange={onEnergyPointsChange}
                variant="inline"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
