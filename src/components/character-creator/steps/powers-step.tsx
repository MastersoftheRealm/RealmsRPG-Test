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
import { ItemList, ItemSelectionModal } from '@/components/shared';
import { transformPower, transformTechnique } from '@/lib/item-transformers';
import { useUserPowers, useUserTechniques, usePowerParts, useTechniqueParts } from '@/hooks';
import type { DisplayItem, SortOption } from '@/types';

const POWER_SORTS: SortOption[] = [
  { id: 'name', label: 'Name', field: 'name', type: 'string' },
  { id: 'cost', label: 'Energy', field: 'cost', type: 'number' },
];

const TECHNIQUE_SORTS: SortOption[] = [
  { id: 'name', label: 'Name', field: 'name', type: 'string' },
  { id: 'cost', label: 'TP', field: 'cost', type: 'number' },
];

export function PowersStep() {
  const { draft, updateDraft, nextStep, prevStep } = useCharacterCreatorStore();
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);
  
  // Fetch user's library
  const { data: userPowers = [], isLoading: powersLoading } = useUserPowers();
  const { data: userTechniques = [], isLoading: techniquesLoading } = useUserTechniques();
  const { data: powerParts } = usePowerParts();
  const { data: techniqueParts } = useTechniqueParts();
  
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
  
  // Transform user powers to display items
  const availablePowers = useMemo((): DisplayItem[] => {
    return userPowers.map(power => {
      const firstDamage = power.damage?.[0];
      return transformPower({
        id: power.docId,
        name: power.name,
        description: power.description,
        parts: power.parts?.map(p => String(p.name || p.id)) || [],
        damage: firstDamage ? `${firstDamage.amount}d${firstDamage.size}${firstDamage.type ? ` ${firstDamage.type}` : ''}` : undefined,
      });
    });
  }, [userPowers]);
  
  // Transform user techniques to display items
  const availableTechniques = useMemo((): DisplayItem[] => {
    return userTechniques.map(tech => {
      const firstDamage = tech.damage?.[0];
      return transformTechnique({
        id: tech.docId,
        name: tech.name,
        description: tech.description,
        parts: tech.parts?.map(p => String(p.name || p.id)) || [],
        damage: firstDamage ? `${firstDamage.amount}d${firstDamage.size}${firstDamage.type ? ` ${firstDamage.type}` : ''}` : undefined,
      });
    });
  }, [userTechniques]);
  
  // Display items for selected powers/techniques
  const selectedPowerItems = useMemo((): DisplayItem[] => {
    return availablePowers.filter(p => selectedPowerIds.has(p.id));
  }, [availablePowers, selectedPowerIds]);
  
  const selectedTechniqueItems = useMemo((): DisplayItem[] => {
    return availableTechniques.filter(t => selectedTechniqueIds.has(t.id));
  }, [availableTechniques, selectedTechniqueIds]);
  
  // Handle power selection
  const handlePowerSelect = useCallback((items: DisplayItem[]) => {
    const powers = items.map(item => ({
      id: item.id,
      name: item.name,
    }));
    updateDraft({ powers });
    setShowPowerModal(false);
  }, [updateDraft]);
  
  // Handle technique selection
  const handleTechniqueSelect = useCallback((items: DisplayItem[]) => {
    const techniques = items.map(item => ({
      id: item.id,
      name: item.name,
    }));
    updateDraft({ techniques });
    setShowTechniqueModal(false);
  }, [updateDraft]);
  
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
  
  const hasContent = userPowers.length > 0 || userTechniques.length > 0;

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
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
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
            <button
              onClick={() => setShowPowerModal(true)}
              disabled={userPowers.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Powers
            </button>
          </div>
          
          {selectedPowerItems.length > 0 ? (
            <div className="space-y-2">
              {selectedPowerItems.map(power => (
                <div 
                  key={power.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Wand2 className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">{power.name}</span>
                    {power.cost !== undefined && (
                      <span className="text-sm text-muted-foreground">
                        {power.cost} {power.costLabel}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removePower(power.id)}
                    className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
                    title="Remove power"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : userPowers.length > 0 ? (
            <div className="p-4 rounded-lg border border-dashed border-border text-center text-muted-foreground">
              No powers selected. Click "Add Powers" to choose from your library.
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
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Swords className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Techniques</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedTechniques.length} technique{selectedTechniques.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTechniqueModal(true)}
              disabled={userTechniques.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Techniques
            </button>
          </div>
          
          {selectedTechniqueItems.length > 0 ? (
            <div className="space-y-2">
              {selectedTechniqueItems.map(tech => (
                <div 
                  key={tech.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Swords className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-foreground">{tech.name}</span>
                    {tech.cost !== undefined && (
                      <span className="text-sm text-muted-foreground">
                        {tech.cost} {tech.costLabel}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeTechnique(tech.id)}
                    className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
                    title="Remove technique"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : userTechniques.length > 0 ? (
            <div className="p-4 rounded-lg border border-dashed border-border text-center text-muted-foreground">
              No techniques selected. Click "Add Techniques" to choose from your library.
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
        <button
          onClick={prevStep}
          className="px-6 py-3 rounded-xl font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={nextStep}
          className="px-8 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Continue →
        </button>
      </div>
      
      {/* Power Selection Modal */}
      <ItemSelectionModal
        isOpen={showPowerModal}
        onClose={() => setShowPowerModal(false)}
        onConfirm={handlePowerSelect}
        items={availablePowers}
        title="Select Powers"
        description="Choose powers from your library for your character to know."
        initialSelectedIds={selectedPowerIds}
        sortOptions={POWER_SORTS}
        searchPlaceholder="Search powers..."
        loading={powersLoading}
      />
      
      {/* Technique Selection Modal */}
      <ItemSelectionModal
        isOpen={showTechniqueModal}
        onClose={() => setShowTechniqueModal(false)}
        onConfirm={handleTechniqueSelect}
        items={availableTechniques}
        title="Select Techniques"
        description="Choose techniques from your library for your character to know."
        initialSelectedIds={selectedTechniqueIds}
        sortOptions={TECHNIQUE_SORTS}
        searchPlaceholder="Search techniques..."
        loading={techniquesLoading}
      />
    </div>
  );
}

export default PowersStep;
