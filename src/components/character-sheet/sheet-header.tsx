/**
 * Character Sheet Header
 * ======================
 * Displays character identity, portrait, and vital stats
 * 
 * Features:
 * - Health colors: green (normal), orange (half health), red (terminal)
 * - Smart value editing: type a value to set, prefix with +/- to modify
 * - Four-corner resource layout matching vanilla site
 * - Prominent speed/evasion display
 */

'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { HealthEnergyAllocator } from '@/components/creator';
import { ValueStepper } from '@/components/shared';
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

/**
 * Get health color based on current health percentage
 * - Green: > 50% health
 * - Orange: <= 50% but > 25% (half health, rounded up)
 * - Red: <= 25% (terminal range, rounded up)
 */
function getHealthColor(current: number, max: number): 'green' | 'orange' | 'red' {
  if (max <= 0) return 'red';
  const halfThreshold = Math.ceil(max / 2);
  const terminalThreshold = Math.ceil(max / 4);
  
  if (current <= terminalThreshold) return 'red';
  if (current <= halfThreshold) return 'orange';
  return 'green';
}

/**
 * Smart Resource Input
 * - Click value to select all for easy editing
 * - Type a number and press Enter to set that value
 * - Type +N or -N and press Enter to modify by that amount
 * - Use stepper buttons with typed value (if not pressed Enter yet)
 */
function ResourceInput({
  label,
  current,
  max,
  onChange,
  colorVariant = 'default',
  subLabel,
}: {
  label: string;
  current: number;
  max: number;
  onChange?: (value: number) => void;
  colorVariant?: 'health' | 'energy' | 'default';
  subLabel?: string;
}) {
  const [inputValue, setInputValue] = useState(String(current));
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Sync input value when current changes externally
  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(current));
    }
  }, [current, isEditing]);
  
  const handleFocus = () => {
    setIsEditing(true);
    // Select all text when focused
    setTimeout(() => inputRef.current?.select(), 0);
  };
  
  const handleBlur = () => {
    setIsEditing(false);
    // Reset to current value if not committed
    setInputValue(String(current));
  };
  
  const applyValue = () => {
    if (!onChange) return;
    
    const trimmed = inputValue.trim();
    
    // Check for +/- modifiers
    if (trimmed.startsWith('+')) {
      const delta = parseInt(trimmed.slice(1), 10);
      if (!isNaN(delta)) {
        const newValue = Math.max(0, Math.min(max, current + delta));
        onChange(newValue);
        setInputValue(String(newValue));
      }
    } else if (trimmed.startsWith('-')) {
      const delta = parseInt(trimmed.slice(1), 10);
      if (!isNaN(delta)) {
        const newValue = Math.max(0, Math.min(max, current - delta));
        onChange(newValue);
        setInputValue(String(newValue));
      }
    } else {
      // Direct value
      const newValue = parseInt(trimmed, 10);
      if (!isNaN(newValue)) {
        const clamped = Math.max(0, Math.min(max, newValue));
        onChange(clamped);
        setInputValue(String(clamped));
      }
    }
    
    setIsEditing(false);
    inputRef.current?.blur();
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyValue();
    } else if (e.key === 'Escape') {
      setInputValue(String(current));
      setIsEditing(false);
      inputRef.current?.blur();
    }
  };
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  // Stepper uses the pending value if editing, otherwise modifies current
  const handleStepperChange = (newValue: number) => {
    if (!onChange) return;
    
    if (isEditing && inputValue.trim() !== String(current)) {
      // User typed a number but didn't press Enter - use that as the delta base
      const typedNum = parseInt(inputValue.trim(), 10);
      if (!isNaN(typedNum)) {
        // Calculate the delta from current to newValue (stepper clicked)
        const stepperDelta = newValue - current;
        // Apply that delta to the typed number
        const result = Math.max(0, Math.min(max, current + (stepperDelta * typedNum)));
        onChange(result);
        setInputValue(String(result));
        setIsEditing(false);
        return;
      }
    }
    
    onChange(newValue);
    setInputValue(String(newValue));
  };
  
  // Color classes based on variant
  const bgColor = colorVariant === 'health' 
    ? 'bg-red-50 border-red-200' 
    : colorVariant === 'energy'
      ? 'bg-blue-50 border-blue-200'
      : 'bg-surface-alt border-border-light';
  
  const labelColor = colorVariant === 'health'
    ? 'text-red-700'
    : colorVariant === 'energy'
      ? 'text-blue-700'
      : 'text-text-secondary';
  
  return (
    <div className={cn('flex flex-col p-3 rounded-lg border', bgColor)}>
      <span className={cn('text-xs font-semibold uppercase tracking-wide', labelColor)}>
        {label}
      </span>
      <div className="flex items-center gap-2 mt-1">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-14 text-center text-xl font-bold rounded border px-1 py-0.5',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            colorVariant === 'health' && 'border-red-300 text-red-800',
            colorVariant === 'energy' && 'border-blue-300 text-blue-800',
            colorVariant === 'default' && 'border-border-light text-text-primary'
          )}
        />
        <span className={cn('text-lg font-medium', labelColor)}>/ {max}</span>
      </div>
      {subLabel && (
        <span className="text-xs text-text-muted mt-1">{subLabel}</span>
      )}
      {onChange && (
        <div className="mt-2">
          <ValueStepper
            value={current}
            onChange={handleStepperChange}
            min={0}
            max={max}
            colorVariant={colorVariant === 'health' ? 'health' : colorVariant === 'energy' ? 'energy' : 'default'}
            enableHoldRepeat
            size="sm"
            variant="compact"
            hideValue
            decrementTitle={`Decrease ${label.toLowerCase()}`}
            incrementTitle={`Increase ${label.toLowerCase()}`}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Large stat block for Speed and Evasion
 */
function LargeStatBlock({ 
  label, 
  value, 
  baseValue,
  defaultBase,
  isEditMode,
  onChange,
  minBase = 0,
  maxBase = 20,
}: { 
  label: string; 
  value: number | string; 
  baseValue?: number;
  defaultBase?: number;
  isEditMode?: boolean;
  onChange?: (newBase: number) => void;
  minBase?: number;
  maxBase?: number;
}) {
  // Check if base is overridden from default
  const isOverridden = defaultBase !== undefined && baseValue !== undefined && baseValue !== defaultBase;
  
  return (
    <div className="flex flex-col items-center p-4 bg-surface-alt rounded-xl border border-border-light min-w-[100px]">
      <span className="text-sm font-semibold text-text-secondary uppercase tracking-wide">{label}</span>
      <span className="text-4xl font-bold text-text-primary mt-1">{value}</span>
      
      {isEditMode && onChange && baseValue !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          <button
            onClick={() => onChange(Math.max(minBase, baseValue - 1))}
            disabled={baseValue <= minBase}
            className={cn(
              'w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-colors',
              baseValue > minBase
                ? 'bg-surface hover:bg-border-light text-text-secondary'
                : 'bg-surface text-text-muted cursor-not-allowed'
            )}
          >
            −
          </button>
          <span className={cn(
            'text-xs min-w-[3rem] text-center',
            isOverridden ? 'text-danger-600 font-bold' : 'text-text-muted'
          )}>
            Base: {baseValue}
          </span>
          <button
            onClick={() => onChange(Math.min(maxBase, baseValue + 1))}
            disabled={baseValue >= maxBase}
            className={cn(
              'w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-colors',
              baseValue < maxBase
                ? 'bg-surface hover:bg-border-light text-text-secondary'
                : 'bg-surface text-text-muted cursor-not-allowed'
            )}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Small stat block for Terminal and Innate
 */
function SmallStatBlock({ label, value, subValue }: { label: string; value: number | string; subValue?: string }) {
  return (
    <div className="flex flex-col items-center p-2 bg-surface-alt rounded-lg border border-border-light">
      <span className="text-xs text-text-muted uppercase tracking-wide">{label}</span>
      <span className="text-lg font-bold text-text-primary">{value}</span>
      {subValue && <span className="text-xs text-text-muted">{subValue}</span>}
    </div>
  );
}

/**
 * Health bar with color states
 */
function HealthBar({
  current,
  max,
  terminal,
}: {
  current: number;
  max: number;
  terminal: number;
}) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const healthColor = getHealthColor(current, max);
  
  const barColorClass = 
    healthColor === 'green' ? 'bg-green-500' :
    healthColor === 'orange' ? 'bg-orange-500' :
    'bg-red-500';
  
  return (
    <div className="relative h-4 bg-surface rounded-full overflow-hidden border border-border-light">
      <div
        className={cn('absolute inset-y-0 left-0 transition-all duration-300', barColorClass)}
        style={{ width: `${percentage}%` }}
      />
      {/* Terminal threshold marker */}
      <div
        className="absolute inset-y-0 w-0.5 bg-red-600 opacity-60"
        style={{ left: `${(terminal / max) * 100}%` }}
        title={`Terminal: ${terminal}`}
      />
      {/* Half health marker */}
      <div
        className="absolute inset-y-0 w-0.5 bg-orange-500 opacity-40"
        style={{ left: '50%' }}
        title={`Half: ${Math.ceil(max / 2)}`}
      />
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
  
  // Check if character can level up (XP >= level * 4)
  const xp = character.experience ?? 0;
  const level = character.level || 1;
  const canLevelUp = xp >= (level * 4);

  // Calculate H/E pool (vanilla formula: 18 + 12*(level-1))
  const totalHEPool = 18 + 12 * (level - 1);
  const healthPoints = character.healthPoints ?? 0;
  const energyPoints = character.energyPoints ?? 0;

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

  // Get health color for styling
  const healthColor = getHealthColor(currentHealth, calculatedStats.maxHealth);

  return (
    <div className="bg-surface rounded-xl shadow-md p-4 md:p-6 mb-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Portrait and Identity */}
        <div className="flex gap-4 flex-shrink-0">
          {/* Portrait */}
          <div 
            className={cn(
              "relative w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden bg-surface flex-shrink-0 border-2",
              healthColor === 'green' && 'border-green-400',
              healthColor === 'orange' && 'border-orange-400',
              healthColor === 'red' && 'border-red-400',
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
              sizes="(max-width: 768px) 96px, 112px"
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
          
          {/* Character Identity - Clean unified format */}
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary truncate">
              {character.name}
            </h1>
            
            {/* Level X Species */}
            <p className="text-base text-text-primary">
              Level {character.level} {character.ancestry?.name || character.species || 'Unknown'}
            </p>
            
            {/* Archetype: Abilities */}
            <p className="text-base text-text-primary">
              {character.archetype?.name || 'No Archetype'}
              {(character.pow_abil || character.mart_abil) && ': '}
              {character.pow_abil && (
                <span className="text-category-power">{character.pow_abil}</span>
              )}
              {character.pow_abil && character.mart_abil && ' / '}
              {character.mart_abil && (
                <span className="text-category-technique">{character.mart_abil}</span>
              )}
            </p>
            
            {/* XP Display */}
            <p className="text-base text-text-primary flex items-center gap-2">
              <span>XP: {character.experience ?? 0}</span>
              {canLevelUp && (
                <span 
                  className="text-success-600 animate-pulse text-sm font-medium" 
                  title="Ready to level up!"
                >
                  ⬆ Level up!
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Center: Speed and Evasion - Prominent display */}
        <div className="flex gap-3 items-start">
          <LargeStatBlock 
            label="Speed" 
            value={calculatedStats.speed}
            baseValue={speedBase}
            defaultBase={6}
            isEditMode={isEditMode}
            onChange={onSpeedBaseChange}
            minBase={1}
            maxBase={20}
          />
          <LargeStatBlock 
            label="Evasion" 
            value={calculatedStats.evasion}
            baseValue={evasionBase}
            defaultBase={10}
            isEditMode={isEditMode}
            onChange={onEvasionBaseChange}
            minBase={0}
            maxBase={20}
          />
        </div>

        {/* Right: Resources in 2x2 grid (four corners layout) */}
        <div className="flex-1 min-w-[280px]">
          {/* Health bar spanning full width */}
          <div className="mb-3">
            <HealthBar 
              current={currentHealth} 
              max={calculatedStats.maxHealth} 
              terminal={calculatedStats.terminal}
            />
          </div>
          
          {/* 2x2 Grid: Health/Energy top, Terminal/Innate bottom */}
          <div className="grid grid-cols-2 gap-2">
            {/* Health */}
            <ResourceInput
              label="Health"
              current={currentHealth}
              max={calculatedStats.maxHealth}
              onChange={onHealthChange}
              colorVariant="health"
            />
            
            {/* Energy */}
            <ResourceInput
              label="Energy"
              current={currentEnergy}
              max={calculatedStats.maxEnergy}
              onChange={onEnergyChange}
              colorVariant="energy"
            />
            
            {/* Terminal */}
            <SmallStatBlock 
              label="Terminal" 
              value={calculatedStats.terminal} 
              subValue="HP ÷ 4"
            />
            
            {/* Innate Threshold */}
            {innateThreshold > 0 ? (
              <SmallStatBlock 
                label="Innate" 
                value={innateThreshold} 
                subValue={innatePools > 0 ? `${innatePools} pools` : undefined} 
              />
            ) : (
              <div /> /* Empty cell to maintain grid */
            )}
          </div>
          
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
