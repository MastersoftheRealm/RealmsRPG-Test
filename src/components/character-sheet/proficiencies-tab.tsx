/**
 * Proficiencies Tab
 * =================
 * Shows persisted proficiencies and loadout requirements.
 */

'use client';

import { useMemo, useState } from 'react';
import { Chip, IconButton, Button, Input } from '@/components/ui';
import { Plus, X, RefreshCw } from 'lucide-react';
import { SectionHeader, TabSummarySection, SummaryItem, SummaryRow, ValueStepper } from '@/components/shared';
import { AddProficiencyModal, type AddProficiencyVariant } from './add-proficiency-modal';
import type { CharacterPower, CharacterTechnique, Item, CharacterProficiency } from '@/types';
import {
  buildRequiredProficiencies,
  calculateProficiencyTP,
  dedupeHighestProficiencies,
  filterToRequiredAndCustom,
  filterZeroCostProficiencies,
  generateProficiencyId,
  getMissingRequiredProficiencies,
  getTrainingPointLimit,
  isCustomProficiency,
  mergeOwnedWithRequired,
} from '@/lib/proficiencies';

interface CodexPart {
  id: string;
  name: string;
  base_tp?: number;
  op_1_tp?: number;
  op_2_tp?: number;
  op_3_tp?: number;
}

interface CodexProperty {
  id: string | number;
  name: string;
  base_tp?: number;
  op_1_tp?: number;
}

interface ProficienciesTabProps {
  powers: CharacterPower[];
  techniques: CharacterTechnique[];
  weapons: Item[];
  shields?: Item[];
  armor: Item[];
  level: number;
  archetypeAbility: number;
  powerPartsDb?: CodexPart[];
  techniquePartsDb?: CodexPart[];
  itemPropertiesDb?: CodexProperty[];
  proficiencies?: CharacterProficiency[];
  isEditMode?: boolean;
  onProficienciesChange?: (next: CharacterProficiency[]) => void;
}

function profChipLabel(p: CharacterProficiency): string {
  const levels = [p.op1Level, p.op2Level, p.op3Level].some((v) => (v ?? 0) > 0)
    ? ` Lv.${p.op1Level ?? 0}/${p.op2Level ?? 0}/${p.op3Level ?? 0}`
    : '';
  const damageType = p.damageType ? ` (${p.damageType})` : '';
  return `${p.name}${damageType}${levels}`;
}

type ProficiencyCategory = 'power' | 'technique' | 'armor' | 'weapon' | 'custom';

function getProficiencyCategory(
  p: CharacterProficiency,
  itemPropertiesDb: CodexProperty[]
): ProficiencyCategory {
  if (p.kind === 'power_part') return 'power';
  if (p.kind === 'technique_part') return 'technique';
  if (isCustomProficiency(p)) return 'custom';
  if (p.kind === 'item_property') {
    const prop = itemPropertiesDb.find(
      (x) => String(x.id) === String(p.refId ?? '') || (x.name && p.name && x.name.toLowerCase() === p.name.toLowerCase())
    );
    const type = (prop as { type?: string })?.type?.toLowerCase();
    if (type === 'armor') return 'armor';
    return 'weapon'; // weapon, shield, or unknown
  }
  return 'weapon';
}

export function ProficienciesTab({
  powers,
  techniques,
  weapons,
  shields = [],
  armor,
  level,
  archetypeAbility,
  powerPartsDb = [],
  techniquePartsDb = [],
  itemPropertiesDb = [],
  proficiencies = [],
  isEditMode = false,
  onProficienciesChange,
}: ProficienciesTabProps) {
  const [customName, setCustomName] = useState('');
  const [customTp, setCustomTp] = useState(1);
  const [addProficiencyVariant, setAddProficiencyVariant] = useState<AddProficiencyVariant | null>(null);

  const required = useMemo(
    () =>
      buildRequiredProficiencies({
        powers,
        techniques,
        weapons,
        shields,
        armor,
        powerPartsDb,
        techniquePartsDb,
        itemPropertiesDb,
      }),
    [powers, techniques, weapons, shields, armor, powerPartsDb, techniquePartsDb, itemPropertiesDb]
  );

  const owned = useMemo(
    () => filterZeroCostProficiencies(dedupeHighestProficiencies(proficiencies)),
    [proficiencies]
  );
  const missing = useMemo(() => getMissingRequiredProficiencies(required, owned), [required, owned]);

  const spent = useMemo(() => owned.reduce((sum, p) => sum + calculateProficiencyTP(p), 0), [owned]);
  const maxTp = useMemo(() => getTrainingPointLimit(level, archetypeAbility), [level, archetypeAbility]);
  const remaining = maxTp - spent;

  const persistProficiencies = (next: CharacterProficiency[]) => {
    if (!onProficienciesChange) return;
    onProficienciesChange(filterZeroCostProficiencies(dedupeHighestProficiencies(next)));
  };

  const addAllMissing = () => {
    if (!onProficienciesChange) return;
    persistProficiencies([...owned, ...missing]);
  };

  const syncProficiencies = () => {
    if (!onProficienciesChange) return;
    const message =
      'Sync will remove proficiencies not needed for your current loadout and add any missing. Custom proficiencies are kept. Continue?';
    if (!window.confirm(message)) return;
    const kept = filterToRequiredAndCustom(owned, required);
    persistProficiencies(mergeOwnedWithRequired(kept, required));
  };

  const removeProf = (id: string) => {
    if (!onProficienciesChange) return;
    persistProficiencies(owned.filter((p) => p.id !== id));
  };

  const addCustom = () => {
    if (!onProficienciesChange) return;
    const name = customName.trim();
    const tp = Math.max(1, customTp);
    if (!name) return;
    const custom: CharacterProficiency = {
      id: generateProficiencyId(),
      kind: 'custom',
      custom: true,
      name,
      baseTP: tp,
      op1Level: 0,
      op2Level: 0,
      op3Level: 0,
      op1TP: 0,
      op2TP: 0,
      op3TP: 0,
    };
    persistProficiencies([...owned, custom]);
    setCustomName('');
    setCustomTp(1);
  };

  const addProficiency = (prof: CharacterProficiency) => {
    if (calculateProficiencyTP(prof) <= 0) return;
    persistProficiencies([...owned, prof]);
  };

  const ownedByCategory = useMemo(() => {
    const map = new Map<ProficiencyCategory, CharacterProficiency[]>();
    owned.forEach((p) => {
      const cat = getProficiencyCategory(p, itemPropertiesDb);
      const list = map.get(cat) ?? [];
      list.push(p);
      map.set(cat, list);
    });
    return map;
  }, [owned, itemPropertiesDb]);

  const weaponShieldProperties = useMemo(
    () =>
      itemPropertiesDb.filter(
        (p) => (p as { type?: string }).type && ['weapon', 'shield'].includes((p as { type?: string }).type!.toLowerCase())
      ),
    [itemPropertiesDb]
  );
  const armorProperties = useMemo(
    () =>
      itemPropertiesDb.filter(
        (p) => (p as { type?: string }).type && (p as { type?: string }).type!.toLowerCase() === 'armor'
      ),
    [itemPropertiesDb]
  );

  return (
    <div className="space-y-4">
      <TabSummarySection variant="default">
        <SummaryRow>
          <SummaryItem icon="🎯" label="TP Limit" value={maxTp} />
          <SummaryItem label="TP Spent" value={spent} />
          <SummaryItem
            label="Remaining"
            value={remaining}
            highlight
            highlightColor={remaining >= 0 ? 'success' : 'danger'}
          />
        </SummaryRow>
      </TabSummarySection>

      {isEditMode && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-surface-alt/50 px-3 py-2">
            <p className="text-xs font-medium text-text-muted mb-2">Catch-all: add every proficiency required by your current loadout</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={addAllMissing} disabled={missing.length === 0}>
                <Plus className="w-4 h-4" /> Add All Missing Proficiencies
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={syncProficiencies}
                aria-label="Sync proficiencies with current loadout (removes unused, adds missing)"
              >
                <RefreshCw className="w-4 h-4" /> Sync Proficiencies
              </Button>
            </div>
            <p className="text-xs text-text-muted mt-2">
              Sync removes proficiencies no longer needed for your current powers/techniques/equipment and adds any missing. Custom proficiencies are kept.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setAddProficiencyVariant('power_part')}>
              <Plus className="w-4 h-4" /> Add Power Part
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setAddProficiencyVariant('technique_part')}>
              <Plus className="w-4 h-4" /> Add Technique Part
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setAddProficiencyVariant('weapon_shield_property')}>
              <Plus className="w-4 h-4" /> Add Weapon/Shield Property
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setAddProficiencyVariant('armor_property')}>
              <Plus className="w-4 h-4" /> Add Armor Property
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Custom proficiency name"
              className="max-w-[240px]"
              aria-label="Custom proficiency name"
            />
            <span className="text-sm text-text-secondary">TP cost:</span>
            <ValueStepper
              value={customTp}
              onChange={(v) => setCustomTp(Math.max(1, v))}
              min={1}
              size="sm"
              variant="inline"
              decrementTitle="Decrease TP cost"
              incrementTitle="Increase TP cost"
            />
            <Button size="sm" variant="primary" onClick={addCustom}>
              Add Custom
            </Button>
          </div>
        </div>
      )}

      <div>
        <SectionHeader
          title="Owned Proficiencies"
          rightContent={<span className="text-xs text-text-muted">{owned.length} total</span>}
        />
        <div className="px-2 py-3 space-y-4">
          {owned.length === 0 ? (
            <p className="text-sm text-text-muted italic text-center py-2">No proficiencies saved.</p>
          ) : (
            <>
              {(['power', 'technique', 'weapon', 'armor', 'custom'] as ProficiencyCategory[]).map((cat) => {
                const list = ownedByCategory.get(cat) ?? [];
                if (list.length === 0) return null;
                const sectionTitle =
                  cat === 'power'
                    ? 'Power parts'
                    : cat === 'technique'
                      ? 'Technique parts'
                      : cat === 'weapon'
                        ? 'Weapon / shield properties'
                        : cat === 'armor'
                          ? 'Armor properties'
                          : 'Custom';
                return (
                  <div key={cat}>
                    <h3 className="text-sm font-medium text-text-secondary mb-2">{sectionTitle}</h3>
                    <div className="flex flex-wrap gap-2">
                      {list.map((prof) => (
                        <div key={prof.id} className="inline-flex items-center gap-1">
                          <Chip variant="proficiency" size="sm">
                            {profChipLabel(prof)} | {calculateProficiencyTP(prof)} TP
                          </Chip>
                          {isEditMode && (
                            <IconButton
                              size="sm"
                              variant="ghost"
                              label={`Remove ${prof.name}`}
                              onClick={() => removeProf(prof.id)}
                            >
                              <X className="w-4 h-4" />
                            </IconButton>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      <div>
        <SectionHeader
          title="Missing For Current Loadout"
          rightContent={<span className="text-xs text-danger-700 dark:text-danger-300">{missing.length} missing</span>}
        />
        <div className="px-2 py-3">
          {missing.length === 0 ? (
            <p className="text-sm text-success-700 dark:text-success-400 italic text-center py-2">
              All current powers, techniques, and armaments are covered.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {missing.map((prof) => (
                <Chip key={prof.id} variant="danger" size="sm">
                  {profChipLabel(prof)} | {calculateProficiencyTP(prof)} TP
                </Chip>
              ))}
            </div>
          )}
        </div>
      </div>

      {addProficiencyVariant && (
        <AddProficiencyModal
          isOpen={!!addProficiencyVariant}
          onClose={() => setAddProficiencyVariant(null)}
          variant={addProficiencyVariant}
          parts={addProficiencyVariant === 'power_part' ? powerPartsDb : addProficiencyVariant === 'technique_part' ? techniquePartsDb : undefined}
          properties={
            addProficiencyVariant === 'weapon_shield_property'
              ? weaponShieldProperties
              : addProficiencyVariant === 'armor_property'
                ? armorProperties
                : undefined
          }
          onAdd={addProficiency}
        />
      )}
    </div>
  );
}
