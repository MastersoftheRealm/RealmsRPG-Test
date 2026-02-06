/**
 * Proficiencies Tab
 * =================
 * Shows training points and proficiencies extracted from powers, techniques, and equipment
 * Matches vanilla site's proficiencies functionality
 * 
 * Uses unified components: SectionHeader, TabSummarySection
 */

'use client';

import { useMemo } from 'react';
import { Chip } from '@/components/ui';
import { Check, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeader, TabSummarySection, SummaryItem, SummaryRow } from '@/components/shared';
import type { CharacterPower, CharacterTechnique, Item } from '@/types';

/** RTDB part data for enrichment */
interface RTDBPart {
  id: string;
  name: string;
  description?: string;
  base_tp?: number;
  op_1_tp?: number;
  op_2_tp?: number;
  op_3_tp?: number;
}

interface ProficiencyData {
  name: string;
  description?: string;
  baseTP: number;
  op1Lvl: number;
  op1TP: number;
  op2Lvl?: number;
  op2TP?: number;
  op3Lvl?: number;
  op3TP?: number;
  damageType?: string | null;
}

interface ProficienciesTabProps {
  powers: CharacterPower[];
  techniques: CharacterTechnique[];
  weapons: Item[];
  armor: Item[];
  level: number;
  archetypeAbility: number; // The archetype's key ability score value
  // Unarmed prowess level (0 = none, 1-5 = prowess levels)
  unarmedProwess?: number;
  // Edit mode for selecting/upgrading unarmed prowess
  isEditMode?: boolean;
  onUnarmedProwessChange?: (level: number) => void;
  // RTDB parts data for enrichment
  powerPartsDb?: RTDBPart[];
  techniquePartsDb?: RTDBPart[];
}

// Unarmed Prowess constants (matching equipment-step.tsx)
const UNARMED_PROWESS_BASE_TP = 10;
const UNARMED_PROWESS_UPGRADE_TP = 6;
const UNARMED_PROWESS_LEVELS = [
  { level: 1, charLevel: 1, name: 'Unarmed Prowess', damage: 'Ability' },
  { level: 2, charLevel: 4, name: 'Unarmed Prowess II', damage: '1d2 + Ability' },
  { level: 3, charLevel: 8, name: 'Unarmed Prowess III', damage: '1d4 + Ability' },
  { level: 4, charLevel: 12, name: 'Unarmed Prowess IV', damage: '1d6 + Ability' },
  { level: 5, charLevel: 16, name: 'Unarmed Prowess V', damage: '1d8 + Ability' },
];

// Calculate TP cost for unarmed prowess
function calculateUnarmedProwessTP(level: number): number {
  if (level <= 0) return 0;
  return UNARMED_PROWESS_BASE_TP + (level - 1) * UNARMED_PROWESS_UPGRADE_TP;
}

// Calculate TP for a proficiency
function calculateProfTP(prof: ProficiencyData): number {
  const rawTP = (prof.baseTP || 0) +
    (prof.op1TP || 0) * (prof.op1Lvl || 0) +
    (prof.op2TP || 0) * (prof.op2Lvl || 0) +
    (prof.op3TP || 0) * (prof.op3Lvl || 0);
  return Math.floor(rawTP);
}

// Extract proficiencies from powers - with RTDB enrichment for string parts
function extractPowerProficiencies(powers: CharacterPower[], rtdbParts: RTDBPart[] = []): Map<string, ProficiencyData> {
  const profs = new Map<string, ProficiencyData>();
  
  powers.forEach(power => {
    if (!power.parts) return;
    
    power.parts.forEach((part) => {
      // Parts can be strings (just names) or objects with full data
      if (typeof part === 'string') {
        // String parts - look up in RTDB for TP data
        const rtdbPart = rtdbParts.find(p => p.name?.toLowerCase() === part.toLowerCase());
        if (!profs.has(part)) {
          profs.set(part, {
            name: part,
            description: rtdbPart?.description,
            baseTP: rtdbPart?.base_tp || 0,
            op1Lvl: 0,
            op1TP: rtdbPart?.op_1_tp || 0,
            op2TP: rtdbPart?.op_2_tp || 0,
            op3TP: rtdbPart?.op_3_tp || 0,
          });
        }
        return;
      }
      
      const partData = part;
      if (!partData.name) return;

      const partName = partData.name;

      // Look up RTDB data for TP values if not present on the part
      const rtdbPart = rtdbParts.find(p => 
        p.id === partData.id || 
        p.name?.toLowerCase() === partName.toLowerCase()
      );

      const lvl1 = partData.op_1_lvl || 0;
      const lvl2 = partData.op_2_lvl || 0;
      const lvl3 = partData.op_3_lvl || 0;
      // Use part data if available, fall back to RTDB
      const baseTP = partData.base_tp ?? rtdbPart?.base_tp ?? 0;
      const op1TP = partData.op_1_tp ?? rtdbPart?.op_1_tp ?? 0;
      const op2TP = partData.op_2_tp ?? rtdbPart?.op_2_tp ?? 0;
      const op3TP = partData.op_3_tp ?? rtdbPart?.op_3_tp ?? 0;
      
      const rawTP = baseTP + op1TP * lvl1 + op2TP * lvl2 + op3TP * lvl3;
      if (Math.floor(rawTP) <= 0) return;
      
      const key = partName;
      if (profs.has(key)) {
        const ex = profs.get(key)!;
        ex.op1Lvl = Math.max(ex.op1Lvl, lvl1);
        ex.op2Lvl = Math.max(ex.op2Lvl || 0, lvl2);
        ex.op3Lvl = Math.max(ex.op3Lvl || 0, lvl3);
      } else {
        profs.set(key, {
          name: partName,
          description: rtdbPart?.description,
          baseTP,
          op1Lvl: lvl1,
          op1TP,
          op2Lvl: lvl2,
          op2TP,
          op3Lvl: lvl3,
          op3TP,
        });
      }
    });
  });
  
  return profs;
}

// Extract proficiencies from techniques - with RTDB enrichment for string parts
function extractTechniqueProficiencies(techniques: CharacterTechnique[], rtdbParts: RTDBPart[] = []): Map<string, ProficiencyData> {
  const profs = new Map<string, ProficiencyData>();
  
  techniques.forEach(tech => {
    if (!tech.parts) return;
    
    tech.parts.forEach((part) => {
      // Parts can be strings (just names) or objects with full data
      if (typeof part === 'string') {
        // String parts - look up in RTDB for TP data
        const rtdbPart = rtdbParts.find(p => p.name?.toLowerCase() === part.toLowerCase());
        if (!profs.has(part)) {
          profs.set(part, {
            name: part,
            description: rtdbPart?.description,
            baseTP: rtdbPart?.base_tp || 0,
            op1Lvl: 0,
            op1TP: rtdbPart?.op_1_tp || 0,
            op2TP: rtdbPart?.op_2_tp || 0,
            op3TP: rtdbPart?.op_3_tp || 0,
          });
        }
        return;
      }
      
      const partData = part;
      if (!partData.name) return;

      const partName = partData.name;

      // Look up RTDB data for TP values if not present on the part
      const rtdbPart = rtdbParts.find(p => 
        p.id === partData.id || 
        p.name?.toLowerCase() === partName.toLowerCase()
      );

      const lvl1 = partData.op_1_lvl || 0;
      const lvl2 = partData.op_2_lvl || 0;
      const lvl3 = partData.op_3_lvl || 0;
      // Use part data if available, fall back to RTDB
      const baseTP = partData.base_tp ?? rtdbPart?.base_tp ?? 0;
      const op1TP = partData.op_1_tp ?? rtdbPart?.op_1_tp ?? 0;
      const op2TP = partData.op_2_tp ?? rtdbPart?.op_2_tp ?? 0;
      const op3TP = partData.op_3_tp ?? rtdbPart?.op_3_tp ?? 0;
      
      const rawTP = baseTP + op1TP * lvl1 + op2TP * lvl2 + op3TP * lvl3;
      if (Math.floor(rawTP) <= 0) return;
      
      const key = partName;
      if (profs.has(key)) {
        const ex = profs.get(key)!;
        ex.op1Lvl = Math.max(ex.op1Lvl, lvl1);
        ex.op2Lvl = Math.max(ex.op2Lvl || 0, lvl2);
        ex.op3Lvl = Math.max(ex.op3Lvl || 0, lvl3);
      } else {
        profs.set(key, {
          name: partName,
          description: rtdbPart?.description,
          baseTP,
          op1Lvl: lvl1,
          op1TP,
          op2Lvl: lvl2,
          op2TP,
          op3Lvl: lvl3,
          op3TP,
        });
      }
    });
  });
  
  return profs;
}

// Extract proficiencies from weapons/armor properties
// Note: Full TP calculation requires loading property data from RTDB
// For now, just list the property names
function extractEquipmentProficiencies(weapons: Item[], armor: Item[]): Map<string, ProficiencyData> {
  const profs = new Map<string, ProficiencyData>();
  const items = [...weapons, ...armor];
  
  items.forEach(item => {
    if (!item.properties) return;
    
    item.properties.forEach((propRef) => {
      // Properties can be strings or objects with name
      const propName = typeof propRef === 'string' 
        ? propRef 
        : (propRef as { name?: string }).name;
      
      if (!propName) return;
      
      // For now, just list properties without TP data
      // Full TP calculation would require loading from RTDB
      if (!profs.has(propName)) {
        profs.set(propName, {
          name: propName,
          baseTP: 0,
          op1Lvl: 0,
          op1TP: 0,
        });
      }
    });
  });
  
  return profs;
}

interface ProficiencySectionProps {
  title: string;
  profs: Map<string, ProficiencyData>;
}

function ProficiencySection({ title, profs }: ProficiencySectionProps) {
  const totalTP = useMemo(() => {
    let sum = 0;
    profs.forEach(prof => {
      sum += calculateProfTP(prof);
    });
    return sum;
  }, [profs]);

  return (
    <div className="mb-4">
      <SectionHeader 
        title={title}
        rightContent={
          <span className="text-xs text-text-muted">
            TP: <span className="font-semibold text-primary-600">{totalTP}</span>
          </span>
        }
      />
      
      <div className="px-2 py-3">
        {profs.size === 0 ? (
          <p className="text-sm text-text-muted italic text-center py-2">No proficiencies</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Array.from(profs.values()).map((prof, index) => {
              const tp = calculateProfTP(prof);
              let label = prof.name;
              if (prof.damageType) label += ` (${prof.damageType})`;
              if (prof.op1Lvl > 0) label += ` Lvl ${prof.op1Lvl}`;
              
              return (
                <Chip
                  key={index}
                  variant="proficiency"
                  size="sm"
                  title={prof.description || `${label} - TP: ${tp}`}
                >
                  {label} | {tp} TP
                </Chip>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProficienciesTab({
  powers,
  techniques,
  weapons,
  armor,
  level,
  archetypeAbility,
  unarmedProwess = 0,
  isEditMode = false,
  onUnarmedProwessChange,
  powerPartsDb = [],
  techniquePartsDb = [],
}: ProficienciesTabProps) {
  // Extract all proficiencies - with RTDB enrichment
  const powerProfs = useMemo(() => extractPowerProficiencies(powers, powerPartsDb), [powers, powerPartsDb]);
  const techniqueProfs = useMemo(() => extractTechniqueProficiencies(techniques, techniquePartsDb), [techniques, techniquePartsDb]);
  const weaponProfs = useMemo(() => extractEquipmentProficiencies(weapons, []), [weapons]);
  const armorProfs = useMemo(() => extractEquipmentProficiencies([], armor), [armor]);

  // Calculate unarmed prowess TP
  const unarmedProwessTP = calculateUnarmedProwessTP(unarmedProwess);

  // Get available unarmed prowess levels based on character level
  const availableUnarmedLevels = useMemo(() => {
    return UNARMED_PROWESS_LEVELS.filter(up => up.charLevel <= level);
  }, [level]);

  // Calculate total TP spent
  const totalSpent = useMemo(() => {
    let sum = unarmedProwessTP;
    [powerProfs, techniqueProfs, weaponProfs, armorProfs].forEach(profs => {
      profs.forEach(prof => {
        sum += calculateProfTP(prof);
      });
    });
    return sum;
  }, [powerProfs, techniqueProfs, weaponProfs, armorProfs, unarmedProwessTP]);

  // Calculate available training points
  // Formula: 22 + (archetype_ability * level) + (2 * (level - 1)) - total_spent
  const baseTP = 22;
  const trainingPoints = baseTP + (archetypeAbility * level) + (2 * (level - 1)) - totalSpent;

  return (
    <div className="space-y-4">
      {/* Training Points Summary */}
      <TabSummarySection variant="default">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <SummaryRow>
            <SummaryItem 
              icon="📊" 
              label="Training Points" 
              value={trainingPoints}
              highlight
              highlightColor={trainingPoints >= 0 ? 'primary' : 'danger'}
            />
            <SummaryItem 
              label="Spent" 
              value={totalSpent}
            />
          </SummaryRow>
          <span className="text-xs text-text-muted">
            {baseTP} base + ({archetypeAbility} × {level}) + {2 * (level - 1)} bonus
          </span>
        </div>
      </TabSummarySection>

      {/* Unarmed Prowess Section - shown in edit mode or if character has it */}
      {(isEditMode || unarmedProwess > 0) && (
        <div className="mb-4">
          <SectionHeader 
            title="Unarmed Prowess"
            rightContent={
              <span className="text-xs text-text-muted">
                TP: <span className="font-semibold text-primary-600">{unarmedProwessTP}</span>
              </span>
            }
          />
          
          <div className="px-2 py-3">
            {isEditMode ? (
              <div className="space-y-2">
                {/* Only show levels that are available at the character's level */}
                {availableUnarmedLevels.map((prowessLevel) => {
                  const isSelected = unarmedProwess >= prowessLevel.level;
                  const canToggle = onUnarmedProwessChange;
                  const tpCost = prowessLevel.level === 1 ? UNARMED_PROWESS_BASE_TP : UNARMED_PROWESS_UPGRADE_TP;
                  
                  return (
                    <div
                      key={prowessLevel.level}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg border transition-all',
                        isSelected ? 'bg-primary-50 border-primary-300' : 'bg-surface border-border-light',
                        canToggle && 'cursor-pointer hover:border-primary-300'
                      )}
                      onClick={() => {
                        if (!canToggle) return;
                        if (isSelected && unarmedProwess === prowessLevel.level) {
                          // Deselect this level (set to previous)
                          onUnarmedProwessChange(prowessLevel.level - 1);
                        } else if (!isSelected && unarmedProwess === prowessLevel.level - 1) {
                          // Select this level
                          onUnarmedProwessChange(prowessLevel.level);
                        }
                      }}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                        isSelected ? 'bg-primary-600 text-white' : 'bg-surface-alt border border-border-light'
                      )}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-text-primary">{prowessLevel.name}</span>
                        <span className="text-xs text-text-muted ml-2">({prowessLevel.damage})</span>
                      </div>
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        {tpCost} TP
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {unarmedProwess > 0 ? (
                  <Chip variant="proficiency" size="sm">
                    {UNARMED_PROWESS_LEVELS[unarmedProwess - 1]?.name || 'Unarmed Prowess'} | {unarmedProwessTP} TP
                  </Chip>
                ) : (
                  <p className="text-sm text-text-muted italic text-center py-2 w-full">No unarmed prowess</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proficiency Sections */}
      <ProficiencySection title="Power Proficiencies" profs={powerProfs} />
      <ProficiencySection title="Technique Proficiencies" profs={techniqueProfs} />
      <ProficiencySection title="Weapon Proficiencies" profs={weaponProfs} />
      <ProficiencySection title="Armor Proficiencies" profs={armorProfs} />
    </div>
  );
}
