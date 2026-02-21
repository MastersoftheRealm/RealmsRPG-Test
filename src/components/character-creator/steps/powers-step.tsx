/**
 * Powers Step
 * ===========
 * Allow users to select powers and techniques for their character.
 * Uses powers from user's library with ItemSelectionModal.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Wand2, Swords, X, ExternalLink } from 'lucide-react';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { UnifiedSelectionModal, type SelectableItem } from '@/components/shared/unified-selection-modal';
import { GridListRow, ListHeader } from '@/components/shared';
import { Button, IconButton } from '@/components/ui';
import { useUserPowers, useUserTechniques, usePowerParts, useTechniqueParts, usePublicLibrary, type PowerPart, type TechniquePart } from '@/hooks';
import type { UserPower, UserTechnique } from '@/hooks/use-user-library';
import { SourceFilter, type SourceFilterValue } from '@/components/shared';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';

/** Capitalize first letter of each word for display */
function capitalize(s: string | undefined): string {
  if (!s) return '-';
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

const POWER_MODAL_COLUMNS = [
  { key: 'name', label: 'NAME', sortable: true },
  { key: 'Action', label: 'ACTION', sortable: false },
  { key: 'Damage', label: 'DAMAGE', sortable: false },
  { key: 'Area', label: 'AREA', sortable: false },
];
const POWER_GRID_COLUMNS = '1.4fr 0.8fr 0.8fr 0.7fr';

const TECHNIQUE_MODAL_COLUMNS = [
  { key: 'name', label: 'NAME', sortable: true },
  { key: 'Energy', label: 'ENERGY', sortable: false },
  { key: 'Weapon', label: 'WEAPON', sortable: false },
  { key: 'Training Pts', label: 'TRAINING PTS', sortable: false },
];
const TECHNIQUE_GRID_COLUMNS = '1.4fr 0.7fr 1fr 0.8fr';

export function PowersStep() {
  const { draft, updateDraft, nextStep, prevStep } = useCharacterCreatorStore();
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);
  const [source, setSource] = useState<SourceFilterValue>('all');
  
  // Fetch user's library and public library
  const { data: userPowers = [], isLoading: powersLoading } = useUserPowers();
  const { data: userTechniques = [], isLoading: techniquesLoading } = useUserTechniques();
  const { data: publicPowers = [] } = usePublicLibrary('powers');
  const { data: publicTechniques = [] } = usePublicLibrary('techniques');
  const { data: powerParts } = usePowerParts();
  const { data: techniqueParts } = useTechniqueParts();
  
  const normalizedPublicPowers = useMemo(() => 
    (publicPowers as Record<string, unknown>[]).map((p) => ({
      id: String(p.id ?? p.docId ?? ''),
      docId: String(p.id ?? p.docId ?? ''),
      name: String(p.name ?? ''),
      description: String(p.description ?? ''),
      parts: p.parts ?? [],
      actionType: p.actionType,
      isReaction: !!p.isReaction,
      range: p.range,
      area: p.area,
      duration: p.duration,
      damage: p.damage,
    })) as UserPower[],
    [publicPowers]
  );
  const normalizedPublicTechniques = useMemo(() => 
    (publicTechniques as Record<string, unknown>[]).map((t) => ({
      id: String(t.id ?? t.docId ?? ''),
      docId: String(t.id ?? t.docId ?? ''),
      name: String(t.name ?? ''),
      description: String(t.description ?? ''),
      parts: t.parts ?? [],
      weapon: t.weapon,
      damage: t.damage,
    })) as UserTechnique[],
    [publicTechniques]
  );
  
  // Get selected powers and techniques from character draft
  const selectedPowers = draft.powers || [];
  const selectedTechniques = draft.techniques || [];
  
  const selectedPowerIds = useMemo(
    () => new Set(selectedPowers.map((p: { id: string | number }) => String(p.id))), 
    [selectedPowers]
  );
  const selectedTechniqueIds = useMemo(
    () => new Set(selectedTechniques.map((t: { id: string | number }) => String(t.id))), 
    [selectedTechniques]
  );
  
  const powersForList = useMemo(() => {
    const my = (source === 'my' || source === 'all') ? userPowers : [];
    const pub = (source === 'public' || source === 'all') ? normalizedPublicPowers : [];
    return [...my, ...pub];
  }, [source, userPowers, normalizedPublicPowers]);
  const techniquesForList = useMemo(() => {
    const my = (source === 'my' || source === 'all') ? userTechniques : [];
    const pub = (source === 'public' || source === 'all') ? normalizedPublicTechniques : [];
    return [...my, ...pub];
  }, [source, userTechniques, normalizedPublicTechniques]);
  
  // Transform powers to SelectableItems — match add-library-item layout (Action, Damage, Area)
  const availablePowers = useMemo((): SelectableItem[] => {
    return powersForList.map((power: UserPower) => {
      const damageStr = power.damage?.length
        ? power.damage.map((d: { type?: string }) => capitalize(d.type)).join(', ')
        : '-';
      const areaStr = power.area?.type ? capitalize(power.area.type) : '-';
      return {
        id: power.docId,
        name: power.name,
        description: power.description,
        columns: [
          { key: 'Action', value: capitalize(power.actionType), align: 'center' as const },
          { key: 'Damage', value: damageStr, align: 'center' as const },
          { key: 'Area', value: areaStr, align: 'center' as const },
        ],
        chips: power.parts?.map(p => ({ name: String(p.name || p.id) })) || undefined,
        data: power,
      };
    });
  }, [powersForList]);

  // Transform techniques to SelectableItems — match add-library-item (Energy, Weapon, Training Pts)
  const availableTechniques = useMemo((): SelectableItem[] => {
    return techniquesForList.map((tech: UserTechnique) => {
      const display = deriveTechniqueDisplay(
        {
          name: tech.name,
          description: tech.description,
          parts: tech.parts || [],
          damage: Array.isArray(tech.damage) && tech.damage[0] ? tech.damage[0] : undefined,
          weapon: tech.weapon,
        },
        techniqueParts ?? []
      );
      return {
        id: tech.docId,
        name: tech.name,
        description: tech.description,
        columns: [
          { key: 'Energy', value: String(display.energy), align: 'center' as const },
          { key: 'Weapon', value: display.weaponName || '-', align: 'center' as const },
          { key: 'Training Pts', value: String(display.tp), align: 'center' as const },
        ],
        chips: tech.parts?.map(p => ({ name: String(p.name || p.id) })) || undefined,
        data: tech,
      };
    });
  }, [techniquesForList, techniqueParts]);
  
  // Display items for selected powers/techniques
  const selectedPowerItems = useMemo((): SelectableItem[] => {
    return availablePowers.filter(p => selectedPowerIds.has(p.id));
  }, [availablePowers, selectedPowerIds]);
  
  const selectedTechniqueItems = useMemo((): SelectableItem[] => {
    return availableTechniques.filter(t => selectedTechniqueIds.has(t.id));
  }, [availableTechniques, selectedTechniqueIds]);
  
  // Handle power selection - include full parts data for TP calculation (works for user or public)
  const handlePowerSelect = useCallback((items: SelectableItem[]) => {
    const powers = items.map(item => {
      const userPower = (item.data as UserPower | undefined) ?? userPowers.find((p: UserPower) => p.docId === item.id) ?? normalizedPublicPowers.find((p: UserPower) => p.docId === item.id);
      const partsWithTP = (userPower?.parts || []).map((savedPart: { id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number }) => {
        const codexPart = powerParts?.find((rp: PowerPart) => 
          String(rp.id) === String(savedPart.id) || 
          rp.name?.toLowerCase() === savedPart.name?.toLowerCase()
        );
        return {
          id: savedPart.id !== undefined ? String(savedPart.id) : undefined,
          name: savedPart.name || codexPart?.name,
          base_tp: codexPart?.base_tp || 0,
          op_1_lvl: savedPart.op_1_lvl || 0,
          op_1_tp: codexPart?.op_1_tp || 0,
          op_2_lvl: savedPart.op_2_lvl || 0,
          op_2_tp: codexPart?.op_2_tp || 0,
          op_3_lvl: savedPart.op_3_lvl || 0,
          op_3_tp: codexPart?.op_3_tp || 0,
        };
      });
      return {
        id: item.id,
        name: item.name,
        description: userPower?.description,
        parts: partsWithTP,
      };
    });
    updateDraft({ powers });
    setShowPowerModal(false);
  }, [updateDraft, userPowers, normalizedPublicPowers, powerParts]);
  
  // Handle technique selection - include full parts data for TP calculation (works for user or public)
  const handleTechniqueSelect = useCallback((items: SelectableItem[]) => {
    const techniques = items.map(item => {
      const userTech = (item.data as UserTechnique | undefined) ?? userTechniques.find((t: UserTechnique) => t.docId === item.id) ?? normalizedPublicTechniques.find((t: UserTechnique) => t.docId === item.id);
      const partsWithTP = (userTech?.parts || []).map((savedPart: { id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number }) => {
        const codexPart = techniqueParts?.find((rp: TechniquePart) => 
          String(rp.id) === String(savedPart.id) || 
          rp.name?.toLowerCase() === savedPart.name?.toLowerCase()
        );
        return {
          id: savedPart.id !== undefined ? String(savedPart.id) : undefined,
          name: savedPart.name || codexPart?.name,
          base_tp: codexPart?.base_tp || 0,
          op_1_lvl: savedPart.op_1_lvl || 0,
          op_1_tp: codexPart?.op_1_tp || 0,
          op_2_lvl: savedPart.op_2_lvl || 0,
          op_2_tp: codexPart?.op_2_tp || 0,
          op_3_lvl: savedPart.op_3_lvl || 0,
          op_3_tp: codexPart?.op_3_tp || 0,
        };
      });
      return {
        id: item.id,
        name: item.name,
        description: userTech?.description,
        parts: partsWithTP,
      };
    });
    updateDraft({ techniques });
    setShowTechniqueModal(false);
  }, [updateDraft, userTechniques, normalizedPublicTechniques, techniqueParts]);
  
  // Remove a power
  const removePower = useCallback((powerId: string) => {
    const newPowers = selectedPowers.filter((p: { id: string | number }) => String(p.id) !== powerId);
    updateDraft({ powers: newPowers });
  }, [selectedPowers, updateDraft]);
  
  // Remove a technique
  const removeTechnique = useCallback((techniqueId: string) => {
    const newTechniques = selectedTechniques.filter((t: { id: string | number }) => String(t.id) !== techniqueId);
    updateDraft({ techniques: newTechniques });
  }, [selectedTechniques, updateDraft]);
  
  const hasContent = powersForList.length > 0 || techniquesForList.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Powers & Techniques
        </h1>
        <p className="text-muted-foreground">
          Select powers and techniques from your library for your character to know.
        </p>
      </div>
      
      {/* Empty state if no content */}
      {!powersLoading && !techniquesLoading && !hasContent && (
        <div className="bg-muted/30 border border-border rounded-xl p-8 text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Wand2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Powers or Techniques Yet
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create powers and techniques in your library first, then come back to add them to your character.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/power-creator"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-400 text-white hover:bg-primary-500 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Power
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              href="/technique-creator"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Technique
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
      
      {/* Powers Section */}
      {(hasContent || powersLoading) && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Powers</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedPowers.length} power{selectedPowers.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowPowerModal(true)}
              disabled={powersForList.length === 0}
            >
              <Plus className="w-4 h-4" />
              Add Powers
            </Button>
          </div>
          
          {selectedPowerItems.length > 0 ? (
            <div className="border border-border-light rounded-lg overflow-hidden">
              <ListHeader
                columns={POWER_MODAL_COLUMNS.map(({ key, label }) => ({ key, label, width: key === 'name' ? '1.4fr' : '0.8fr', align: (key === 'name' ? 'left' : 'center') as 'left' | 'center' | 'right' }))}
                gridColumns={POWER_GRID_COLUMNS}
              />
              <div className="space-y-1">
                {selectedPowerItems.map(power => (
                  <GridListRow
                    key={power.id}
                    id={power.id}
                    name={power.name}
                    description={power.description}
                    columns={power.columns}
                    gridColumns={POWER_GRID_COLUMNS}
                    rightSlot={
                      <IconButton
                        variant="danger"
                        size="sm"
                        onClick={() => removePower(power.id)}
                        label="Remove power"
                      >
                        <X className="w-4 h-4" />
                      </IconButton>
                    }
                    compact
                  />
                ))}
              </div>
            </div>
          ) : userPowers.length > 0 ? (
            <div className="p-4 rounded-lg border border-dashed border-border text-center text-muted-foreground">
              No powers selected. Click &quot;Add Powers&quot; to choose from your library.
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-dashed border-border text-center">
              <span className="text-muted-foreground">No powers in your library. </span>
              <Link href="/power-creator" className="text-primary hover:underline inline-flex items-center gap-1">
                Create one <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </section>
      )}
      
      {/* Techniques Section */}
      {(hasContent || techniquesLoading) && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-martial-light flex items-center justify-center">
                <Swords className="w-5 h-5 text-martial-dark" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Techniques</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedTechniques.length} technique{selectedTechniques.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowTechniqueModal(true)}
              disabled={techniquesForList.length === 0}
              className="bg-martial-dark hover:bg-martial-text"
            >
              <Plus className="w-4 h-4" />
              Add Techniques
            </Button>
          </div>
          
          {selectedTechniqueItems.length > 0 ? (
            <div className="border border-border-light rounded-lg overflow-hidden">
              <ListHeader
                columns={TECHNIQUE_MODAL_COLUMNS.map(({ key, label }) => ({ key, label, width: key === 'name' ? '1.4fr' : key === 'Energy' ? '0.7fr' : key === 'Weapon' ? '1fr' : '0.8fr', align: (key === 'name' ? 'left' : 'center') as 'left' | 'center' | 'right' }))}
                gridColumns={TECHNIQUE_GRID_COLUMNS}
              />
              <div className="space-y-1">
                {selectedTechniqueItems.map(tech => (
                  <GridListRow
                    key={tech.id}
                    id={tech.id}
                    name={tech.name}
                    description={tech.description}
                    columns={tech.columns}
                    gridColumns={TECHNIQUE_GRID_COLUMNS}
                    rightSlot={
                      <IconButton
                        variant="danger"
                        size="sm"
                        onClick={() => removeTechnique(tech.id)}
                        label="Remove technique"
                      >
                        <X className="w-4 h-4" />
                      </IconButton>
                    }
                    compact
                  />
                ))}
              </div>
            </div>
          ) : userTechniques.length > 0 ? (
            <div className="p-4 rounded-lg border border-dashed border-border text-center text-muted-foreground">
              No techniques selected. Click &quot;Add Techniques&quot; to choose from your library.
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-dashed border-border text-center">
              <span className="text-muted-foreground">No techniques in your library. </span>
              <Link href="/technique-creator" className="text-primary hover:underline inline-flex items-center gap-1">
                Create one <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </section>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border">
        <Button
          variant="secondary"
          onClick={prevStep}
        >
          ← Back
        </Button>
        <Button
          onClick={nextStep}
        >
          Continue →
        </Button>
      </div>
      
      {/* Power Selection Modal — same column headers/layout as character sheet add-library-item */}
      <UnifiedSelectionModal
        isOpen={showPowerModal}
        onClose={() => setShowPowerModal(false)}
        headerExtra={<SourceFilter value={source} onChange={setSource} />}
        onConfirm={handlePowerSelect}
        items={availablePowers}
        title="Select Powers"
        description="Choose powers from your library or public library. Click a row (or the + button) to select, then click Add Selected."
        initialSelectedIds={selectedPowerIds}
        searchPlaceholder="Search powers..."
        itemLabel="power"
        isLoading={powersLoading}
        columns={POWER_MODAL_COLUMNS}
        gridColumns={POWER_GRID_COLUMNS}
      />

      {/* Technique Selection Modal — same column headers/layout as character sheet add-library-item */}
      <UnifiedSelectionModal
        isOpen={showTechniqueModal}
        onClose={() => setShowTechniqueModal(false)}
        headerExtra={<SourceFilter value={source} onChange={setSource} />}
        onConfirm={handleTechniqueSelect}
        items={availableTechniques}
        title="Select Techniques"
        description="Choose techniques from your library or public library. Click a row (or the + button) to select, then click Add Selected."
        initialSelectedIds={selectedTechniqueIds}
        searchPlaceholder="Search techniques..."
        itemLabel="technique"
        isLoading={techniquesLoading}
        columns={TECHNIQUE_MODAL_COLUMNS}
        gridColumns={TECHNIQUE_GRID_COLUMNS}
      />
    </div>
  );
}

export default PowersStep;
