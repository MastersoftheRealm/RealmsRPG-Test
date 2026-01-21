/**
 * Proficiencies Tab
 * =================
 * Shows training points and proficiencies extracted from powers, techniques, and equipment
 * Matches vanilla site's proficiencies functionality
 */

'use client';

import { useMemo } from 'react';
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
  // RTDB parts data for enrichment
  powerPartsDb?: RTDBPart[];
  techniquePartsDb?: RTDBPart[];
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

      const lvl1 = partData.op_1_lvl || 0;
      const lvl2 = partData.op_2_lvl || 0;
      const lvl3 = partData.op_3_lvl || 0;
      const baseTP = partData.base_tp || 0;
      const op1TP = partData.op_1_tp || 0;
      const op2TP = partData.op_2_tp || 0;
      const op3TP = partData.op_3_tp || 0;
      
      const rawTP = baseTP + op1TP * lvl1 + op2TP * lvl2 + op3TP * lvl3;
      if (Math.floor(rawTP) <= 0) return;
      
      const key = partName;
      if (profs.has(key)) {
        const ex = profs.get(key)!;
        ex.op1Lvl = Math.max(ex.op1Lvl, lvl1);
        ex.op2Lvl = Math.max(ex.op2Lvl || 0, lvl2);
        ex.op3Lvl = Math.max(ex.op3Lvl || 0, lvl3);
      } else {
        // Try to get description from RTDB
        const rtdbPart = rtdbParts.find(p => p.name?.toLowerCase() === partName.toLowerCase());
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

      const lvl1 = partData.op_1_lvl || 0;
      const lvl2 = partData.op_2_lvl || 0;
      const lvl3 = partData.op_3_lvl || 0;
      const baseTP = partData.base_tp || 0;
      const op1TP = partData.op_1_tp || 0;
      const op2TP = partData.op_2_tp || 0;
      const op3TP = partData.op_3_tp || 0;
      
      const rawTP = baseTP + op1TP * lvl1 + op2TP * lvl2 + op3TP * lvl3;
      if (Math.floor(rawTP) <= 0) return;
      
      const key = partName;
      if (profs.has(key)) {
        const ex = profs.get(key)!;
        ex.op1Lvl = Math.max(ex.op1Lvl, lvl1);
        ex.op2Lvl = Math.max(ex.op2Lvl || 0, lvl2);
        ex.op3Lvl = Math.max(ex.op3Lvl || 0, lvl3);
      } else {
        // Try to get description from RTDB
        const rtdbPart = rtdbParts.find(p => p.name?.toLowerCase() === partName.toLowerCase());
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
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-t-lg border border-gray-200">
        <span className="font-semibold text-sm text-gray-700">{title}</span>
        <span className="text-sm text-gray-500">
          TP: <span className="font-semibold text-primary-600">{totalTP}</span>
        </span>
      </div>
      
      <div className="border border-t-0 border-gray-200 rounded-b-lg p-3">
        {profs.size === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-2">No proficiencies</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Array.from(profs.values()).map((prof, index) => {
              const tp = calculateProfTP(prof);
              let label = prof.name;
              if (prof.damageType) label += ` (${prof.damageType})`;
              if (prof.op1Lvl > 0) label += ` Lvl ${prof.op1Lvl}`;
              
              return (
                <div
                  key={index}
                  className="px-2 py-1 text-xs bg-primary-50 text-primary-700 border border-primary-200 rounded-full"
                  title={prof.description || `${label} - TP: ${tp}`}
                >
                  {label} | {tp} TP
                </div>
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
  powerPartsDb = [],
  techniquePartsDb = [],
}: ProficienciesTabProps) {
  // Extract all proficiencies - with RTDB enrichment
  const powerProfs = useMemo(() => extractPowerProficiencies(powers, powerPartsDb), [powers, powerPartsDb]);
  const techniqueProfs = useMemo(() => extractTechniqueProficiencies(techniques, techniquePartsDb), [techniques, techniquePartsDb]);
  const weaponProfs = useMemo(() => extractEquipmentProficiencies(weapons, []), [weapons]);
  const armorProfs = useMemo(() => extractEquipmentProficiencies([], armor), [armor]);

  // Calculate total TP spent
  const totalSpent = useMemo(() => {
    let sum = 0;
    [powerProfs, techniqueProfs, weaponProfs, armorProfs].forEach(profs => {
      profs.forEach(prof => {
        sum += calculateProfTP(prof);
      });
    });
    return sum;
  }, [powerProfs, techniqueProfs, weaponProfs, armorProfs]);

  // Calculate available training points
  // Formula: 22 + (archetype_ability * level) + (2 * (level - 1)) - total_spent
  const baseTP = 22;
  const trainingPoints = baseTP + (archetypeAbility * level) + (2 * (level - 1)) - totalSpent;

  return (
    <div>
      {/* Training Points Box */}
      <div className="flex justify-center mb-6">
        <div className="px-8 py-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
          <div className="text-center">
            <span className="text-lg font-semibold text-gray-600">Training Points: </span>
            <span className={`text-2xl font-bold ${trainingPoints >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
              {trainingPoints}
            </span>
          </div>
          <div className="text-xs text-gray-400 text-center mt-1">
            {baseTP} base + ({archetypeAbility} × {level}) + {2 * (level - 1)} bonus - {totalSpent} spent
          </div>
        </div>
      </div>

      {/* Proficiency Sections */}
      <ProficiencySection title="Power Proficiencies" profs={powerProfs} />
      <ProficiencySection title="Technique Proficiencies" profs={techniqueProfs} />
      <ProficiencySection title="Weapon Proficiencies" profs={weaponProfs} />
      <ProficiencySection title="Armor Proficiencies" profs={armorProfs} />
    </div>
  );
}
