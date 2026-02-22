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
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatSpeedForDisplay } from '@/lib/utils/number';
import { Spinner } from '@/components/ui/spinner';
import { HealthEnergyAllocator } from '@/components/creator';
import { ValueStepper, ImageUploadModal, EditSectionToggle } from '@/components/shared';
import { useCharacterSheetOptional } from './character-sheet-context';
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
  onActionPointsChange?: (value: number) => void;
  onHealthPointsChange?: (value: number) => void;
  onEnergyPointsChange?: (value: number) => void;
  onPortraitChange?: (file: File) => void | Promise<void>;
  isUploadingPortrait?: boolean;
  /** After upload, pass a timestamp so the portrait image reloads (cache-bust). */
  portraitRefreshKey?: number | null;
  // Character name editing
  onNameChange?: (name: string) => void;
  // Experience editing
  onExperienceChange?: (value: number) => void;
  // Speed/Evasion base editing
  speedBase?: number;
  evasionBase?: number;
  onSpeedBaseChange?: (value: number) => void;
  onEvasionBaseChange?: (value: number) => void;
  /** How to display speed: spaces (default), feet, or meters. Edit is always in spaces. */
  speedDisplayUnit?: 'spaces' | 'feet' | 'meters';
  // Innate info from archetype progression
  innateThreshold?: number;
  innatePools?: number;
  // Edit archetype/ability (opens modal from sheet)
  onEditArchetype?: () => void;
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
  showBar = false,
}: {
  label: string;
  current: number;
  max: number;
  onChange?: (value: number) => void;
  colorVariant?: 'health' | 'energy' | 'default';
  subLabel?: string;
  showBar?: boolean;
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
        // Allow values above max (no upper clamp)
        const newValue = Math.max(0, current + delta);
        onChange(newValue);
        setInputValue(String(newValue));
      }
    } else if (trimmed.startsWith('-')) {
      const delta = parseInt(trimmed.slice(1), 10);
      if (!isNaN(delta)) {
        const newValue = Math.max(0, current - delta);
        onChange(newValue);
        setInputValue(String(newValue));
      }
    } else {
      // Direct value: allow any non-negative value including above max (e.g. temp HP/over-heal)
      const newValue = parseInt(trimmed, 10);
      if (!isNaN(newValue)) {
        const value = Math.max(0, newValue);
        onChange(value);
        setInputValue(String(value));
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
        // Apply that delta to the typed number - allow above max
        const result = Math.max(0, current + (stepperDelta * typedNum));
        onChange(result);
        setInputValue(String(result));
        setIsEditing(false);
        return;
      }
    }
    
    onChange(newValue);
    setInputValue(String(newValue));
  };
  
  // Color classes: light = tinted panel; dark = same surface as UI, subtle colored border (no bright green/blue background)
  const bgColor = colorVariant === 'health' 
    ? 'bg-success-50 dark:bg-surface border-success-200 dark:border-success-800/50' 
    : colorVariant === 'energy'
      ? 'bg-info-50 dark:bg-surface border-info-200 dark:border-info-800/50'
      : 'bg-surface-alt dark:bg-surface border-border-light dark:border-border';
  
  const labelColor = colorVariant === 'health'
    ? 'text-success-700 dark:text-success-400'
    : colorVariant === 'energy'
      ? 'text-info-700 dark:text-info-400'
      : 'text-text-secondary dark:text-text-primary';
  
  // Calculate bar percentage - cap at 100% for display but allow tracking above max
  const isAboveMax = current > max;
  const percentage = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  
  // Bar color: gold when above max, otherwise normal colors; dark mode alternatives
  // Half health = amber/yellow-orange (distinguishable from terminal red)
  // Terminal = deep crimson red
  const barColorClass = isAboveMax 
    ? 'bg-warning-400 dark:bg-warning-500'
    : colorVariant === 'health' 
      ? (percentage > 50 ? 'bg-success-500 dark:bg-success-400' : percentage > 25 ? 'bg-warning-500 dark:bg-warning-400' : 'bg-danger-600 dark:bg-danger-500')
      : colorVariant === 'energy' ? 'bg-info-500 dark:bg-info-400' : 'bg-primary-500 dark:bg-primary-400';
  
  const inputBorderText = colorVariant === 'health'
    ? 'border-success-300 dark:border-success-700/60 text-success-800 dark:text-success-300'
    : colorVariant === 'energy'
      ? 'border-info-300 dark:border-info-700/60 text-info-800 dark:text-info-300'
      : 'border-border-light dark:border-border text-text-primary';
  
  return (
    <div className={cn('flex flex-col p-3 rounded-lg border', bgColor)}>
      <div className="flex items-center justify-between mb-1">
        <span className={cn('text-xs font-semibold uppercase tracking-wide', labelColor)}>
          {label}
        </span>
        {subLabel && (
          <span className="text-xs text-text-muted dark:text-text-secondary">{subLabel}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
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
            'w-12 text-center text-lg font-bold rounded border px-1 py-0.5',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
            inputBorderText
          )}
        />
        <span className={cn('text-base font-medium', labelColor)}>/ {max}</span>
        {onChange && (
          <ValueStepper
            value={current}
            onChange={handleStepperChange}
            min={0}
            // No max - allow incrementing above max (gold bar shows when above)
            colorVariant={colorVariant === 'health' ? 'health' : colorVariant === 'energy' ? 'energy' : 'default'}
            enableHoldRepeat
            size="sm"
            variant="compact"
            hideValue
            decrementTitle={`Decrease ${label.toLowerCase()}`}
            incrementTitle={`Increase ${label.toLowerCase()}`}
          />
        )}
      </div>
      {/* Inline bar - dark mode track */}
      {showBar && (
        <div className="relative h-2 mt-2 bg-surface dark:bg-black/30 rounded-full overflow-hidden">
          <div
            className={cn('absolute inset-y-0 left-0 transition-all duration-300 rounded-full', barColorClass)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Pencil state for Speed/Evasion base: red when over default, green when under
 */
function getSpeedEvasionPencilState(
  baseValue: number | undefined,
  defaultBase: number | undefined
): 'normal' | 'has-points' | 'over-budget' {
  if (baseValue === undefined || defaultBase === undefined) return 'normal';
  if (baseValue > defaultBase) return 'over-budget'; // increasing base = red
  if (baseValue < defaultBase) return 'has-points';  // decreasing base = green
  return 'normal';
}

/**
 * Large stat block for Speed and Evasion
 * - Pencil icon toggles base editing visibility (like other sections)
 * - Red when base > default, green when base < default
 */
function LargeStatBlock({ 
  label, 
  value, 
  valueSuffix,
  baseValue,
  defaultBase,
  isEditMode,
  onChange,
  minBase = 0,
  maxBase = 20,
}: { 
  label: string; 
  value: number | string; 
  valueSuffix?: string;
  baseValue?: number;
  defaultBase?: number;
  isEditMode?: boolean;
  onChange?: (newBase: number) => void;
  minBase?: number;
  maxBase?: number;
}) {
  const [isEditingBase, setIsEditingBase] = useState(false);
  const pencilState = getSpeedEvasionPencilState(baseValue, defaultBase);
  const showEditControls = isEditMode && onChange && baseValue !== undefined && isEditingBase;
  
  return (
    <div className="flex flex-col items-center p-4 bg-surface-alt rounded-xl border border-border-light min-w-[100px]">
      <div className="flex items-center gap-1.5 w-full justify-center">
        <span className="text-sm font-semibold text-text-secondary uppercase tracking-wide">{label}</span>
        {isEditMode && onChange && (
          <EditSectionToggle
            onClick={() => setIsEditingBase(prev => !prev)}
            state={pencilState}
            isActive={isEditingBase}
            title={isEditingBase ? 'Hide base editing' : 'Edit base value'}
          />
        )}
      </div>
      <span className="text-4xl font-bold text-text-primary mt-1">
        {value}{valueSuffix ? <span className="text-xl font-semibold text-text-secondary ml-0.5">{valueSuffix}</span> : null}
      </span>
      
      {showEditControls && (
        <div className="flex items-center gap-1 mt-2">
          <button
            onClick={() => onChange(Math.max(minBase, baseValue! - 1))}
            disabled={baseValue! <= minBase}
            className={cn(
              'w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-colors',
              baseValue! > minBase
                ? 'bg-surface hover:bg-border-light text-text-secondary'
                : 'bg-surface text-text-muted cursor-not-allowed'
            )}
          >
            −
          </button>
          <span className={cn(
            'text-xs min-w-[3rem] text-center',
            pencilState === 'over-budget' ? 'text-danger-600 font-bold' :
            pencilState === 'has-points' ? 'text-success-600 font-bold' : 'text-text-muted'
          )}>
            Base: {baseValue}
          </span>
          <button
            onClick={() => onChange(Math.min(maxBase, baseValue! + 1))}
            disabled={baseValue! >= maxBase}
            className={cn(
              'w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-colors',
              baseValue! < maxBase
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
    healthColor === 'green' ? 'bg-success-500' :
    healthColor === 'orange' ? 'bg-warning-500' :
    'bg-danger-700';
  
  return (
    <div className="relative h-3 bg-surface rounded-full overflow-hidden">
      <div
        className={cn('absolute inset-y-0 left-0 transition-all duration-300 rounded-full', barColorClass)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

const DEFAULT_ACTION_POINTS = 4;

export function SheetHeader({
  character: characterProp,
  calculatedStats,
  isEditMode: isEditModeProp = false,
  onHealthChange,
  onEnergyChange,
  onActionPointsChange,
  onHealthPointsChange,
  onEnergyPointsChange,
  onPortraitChange,
  isUploadingPortrait = false,
  portraitRefreshKey = null,
  onNameChange,
  onExperienceChange,
  speedBase = 6,
  evasionBase = 10,
  onSpeedBaseChange,
  onEvasionBaseChange,
  speedDisplayUnit = 'spaces',
  innateThreshold = 0,
  innatePools = 0,
  onEditArchetype,
}: SheetHeaderProps) {
  const ctx = useCharacterSheetOptional();
  const character = (ctx?.character ?? characterProp) as Character;
  const isEditMode = ctx?.isEditMode ?? isEditModeProp;
  const currentHealth = character.currentHealth ?? character.health?.current ?? calculatedStats.maxHealth;
  const currentEnergy = character.currentEnergy ?? character.energy?.current ?? calculatedStats.maxEnergy;
  const actionPoints = character.actionPoints ?? DEFAULT_ACTION_POINTS;
  
  // State for editing character name
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(character.name || '');
  
  // State for editing XP
  const [isEditingXP, setIsEditingXP] = useState(false);
  const [xpInput, setXpInput] = useState(String(character.experience ?? 0));
  
  // Check if character can level up (XP >= level * 4)
  const xp = character.experience ?? 0;
  const level = character.level || 1;
  const canLevelUp = xp >= (level * 4);

  // Handle XP submission
  const handleXPSubmit = () => {
    const value = parseInt(xpInput, 10);
    if (!isNaN(value) && value >= 0 && onExperienceChange) {
      onExperienceChange(value);
    }
    setIsEditingXP(false);
  };

  // Calculate H/E pool (vanilla formula: 18 + 12*(level-1))
  const totalHEPool = 18 + 12 * (level - 1);
  const healthPoints = character.healthPoints ?? 0;
  const energyPoints = character.energyPoints ?? 0;

  // Image upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Handle portrait click - open the upload modal
  const handlePortraitClick = () => {
    if (!isEditMode || !onPortraitChange) return;
    setShowUploadModal(true);
  };
  
  // Handle cropped image from the modal - await upload so modal stays open until done
  const handleCroppedImage = async (blob: Blob) => {
    if (!onPortraitChange) return;
    const file = new File([blob], 'portrait.jpg', { type: 'image/jpeg' });
    await onPortraitChange(file);
  };

  // Get health color for styling
  const healthColor = getHealthColor(currentHealth, calculatedStats.maxHealth);

  // Speed display (spaces → value + unit per settings)
  const speedDisplay = formatSpeedForDisplay(calculatedStats.speed, speedDisplayUnit);
  const speedDisplayValue = typeof speedDisplay.value === 'number' && speedDisplay.value % 1 !== 0
    ? speedDisplay.value.toFixed(1) : String(speedDisplay.value);

  // Handle name editing
  const handleNameSubmit = () => {
    if (nameInput.trim() && nameInput !== character.name && onNameChange) {
      onNameChange(nameInput.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="bg-surface rounded-xl shadow-md p-4 md:p-6 mb-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Portrait and Identity */}
        <div className="flex gap-4 flex-shrink-0 items-center">
          {/* Portrait - Larger and vertically centered */}
          <div 
            className={cn(
              "relative w-28 h-28 md:w-36 md:h-36 rounded-xl overflow-hidden bg-surface flex-shrink-0 border-3 shadow-lg",
              healthColor === 'green' && 'border-success-400',
              healthColor === 'orange' && 'border-warning-400',
              healthColor === 'red' && 'border-danger-600',
              isEditMode && onPortraitChange && "cursor-pointer group"
            )}
            onClick={handlePortraitClick}
            title={isEditMode && onPortraitChange ? "Click to change portrait" : undefined}
          >
            <Image
              key={`portrait-${character.portrait ?? ''}-${portraitRefreshKey ?? ''}`}
              src={
                character.portrait
                  ? `${character.portrait}${portraitRefreshKey != null ? `?t=${portraitRefreshKey}` : ''}`
                  : '/images/placeholder-portrait.png'
              }
              alt={character.name}
              fill
              unoptimized
              className={cn(
                "object-cover transition-opacity",
                isUploadingPortrait && "opacity-50"
              )}
              sizes="(max-width: 768px) 112px, 144px"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/placeholder-portrait.png';
              }}
            />
            {/* Upload overlay in edit mode */}
            {isEditMode && onPortraitChange && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-3xl">
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
            {/* Editable Name - Always available with pencil icon */}
            {isEditingName && onNameChange ? (
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSubmit();
                  if (e.key === 'Escape') {
                    setNameInput(character.name || '');
                    setIsEditingName(false);
                  }
                }}
                className="text-2xl md:text-3xl font-bold text-text-primary px-2 py-1 border-2 border-primary-400 rounded-lg focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary truncate flex items-center gap-2">
                {character.name}
                {onNameChange && isEditMode && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-primary-500 hover:text-primary-600 transition-colors hover:scale-110"
                    title="Edit name"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </h1>
            )}
            
            {/* Level and Species - separated */}
            <p className="text-base text-text-primary">
              Level {character.level} · <span className="font-medium">{character.ancestry?.name || character.species || 'Unknown'}</span>
            </p>
            
            {/* Archetype: Abilities */}
            <p className="text-base text-text-primary flex items-center gap-2">
              <span>
                {character.archetype?.name || (character.archetype?.type ? character.archetype.type.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'No Archetype')}
                {(character.pow_abil || character.mart_abil) && ': '}
                {character.pow_abil && (
                  <span className="text-category-power capitalize">{character.pow_abil}</span>
                )}
                {character.pow_abil && character.mart_abil && ' / '}
                {character.mart_abil && (
                  <span className="text-category-technique capitalize">{character.mart_abil}</span>
                )}
              </span>
              {onEditArchetype && (
                <button
                  onClick={onEditArchetype}
                  className="text-primary-500 hover:text-primary-600 transition-colors hover:scale-110"
                  title="Edit archetype and ability"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </p>
            
            {/* XP Display - Always editable with pencil icon */}
            <div className="text-base text-text-primary flex items-center gap-2">
              {isEditingXP && onExperienceChange ? (
                <div className="flex items-center gap-1">
                  <span>XP:</span>
                  <input
                    type="number"
                    value={xpInput}
                    onChange={(e) => setXpInput(e.target.value)}
                    onBlur={handleXPSubmit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleXPSubmit();
                      if (e.key === 'Escape') {
                        setXpInput(String(character.experience ?? 0));
                        setIsEditingXP(false);
                      }
                    }}
                    className="w-16 px-1 py-0 text-base border-2 border-primary-400 rounded focus:ring-2 focus:ring-primary-500"
                    min={0}
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  <span>XP: {character.experience ?? 0}</span>
                  {onExperienceChange && (
                    <button
                      onClick={() => {
                        setXpInput(String(character.experience ?? 0));
                        setIsEditingXP(true);
                      }}
                      className="text-primary-500 hover:text-primary-600 transition-colors hover:scale-110"
                      title="Edit XP"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
              {canLevelUp && (
                <span 
                  className="text-success-600 animate-pulse text-sm font-medium" 
                  title="Ready to level up!"
                >
                  ⬆ Level up!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center section with Speed/Evasion - grows to fill available space */}
        <div className="flex-1 flex items-center justify-center gap-4">
          <LargeStatBlock 
            label="Speed" 
            value={speedDisplayValue}
            valueSuffix={speedDisplay.suffix}
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

        {/* Right: Action Points (left, spans vertically) + Health & Energy (right) */}
        <div className="w-full min-w-0 md:min-w-[260px] lg:w-1/3 flex flex-col">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            {/* Action Points - left column, spans full height of Health+Energy */}
            <div className={cn(
              'flex flex-col justify-center p-3 rounded-lg border min-w-[72px]',
              'bg-surface-alt dark:bg-surface border-border-light dark:border-border'
            )}>
              <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary dark:text-text-primary text-center mb-1.5">
                Action Points
              </span>
              <div className="flex items-center justify-center">
                {onActionPointsChange ? (
                  <ValueStepper
                    value={actionPoints}
                    onChange={onActionPointsChange}
                    min={0}
                    max={10}
                    colorVariant="default"
                    enableHoldRepeat
                    size="sm"
                    variant="compact"
                    hideValue={false}
                    decrementTitle="Decrease action points"
                    incrementTitle="Increase action points"
                  />
                ) : (
                  <span className="text-lg font-bold text-text-primary">{actionPoints}</span>
                )}
              </div>
            </div>

            {/* Health & Energy stacked */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <ResourceInput
                label="Health"
                current={currentHealth}
                max={calculatedStats.maxHealth}
                onChange={onHealthChange}
                colorVariant="health"
                subLabel={`Terminal: ${calculatedStats.terminal}`}
                showBar
              />
              <ResourceInput
                label="Energy"
                current={currentEnergy}
                max={calculatedStats.maxEnergy}
                onChange={onEnergyChange}
                colorVariant="energy"
                subLabel={innateThreshold > 0 ? `Innate: ${innateThreshold}${innatePools > 1 ? ` (${innatePools}×)` : ''}` : undefined}
                showBar
              />
            </div>
          </div>

          {/* Health-Energy Pool Allocation (edit mode only) */}
          {isEditMode && onHealthPointsChange && onEnergyPointsChange && (
            <div className="mt-2">
              <HealthEnergyAllocator
                hpBonus={healthPoints}
                energyBonus={energyPoints}
                poolTotal={totalHEPool}
                maxHp={calculatedStats.maxHealth}
                maxEnergy={calculatedStats.maxEnergy}
                onHpChange={onHealthPointsChange}
                onEnergyChange={onEnergyPointsChange}
                variant="inline"
                allowOverallocation
                enableHoldRepeat
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Portrait Upload Modal */}
      <ImageUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onConfirm={handleCroppedImage}
        cropShape="rect"
        aspect={3 / 4}
        title="Upload Character Portrait"
      />
    </div>
  );
}
