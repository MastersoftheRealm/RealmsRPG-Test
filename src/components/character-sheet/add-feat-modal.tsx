/**
 * Add Feat Modal — UnifiedSelectionModal wrapper
 * Adds archetype or character feats from Codex. Used by CharacterSheetModals.
 */

'use client';

import { useState, useEffect, useMemo, useCallback, useId } from 'react';
import { useCodexFeats, useCodexSkills, type Feat, type Skill } from '@/hooks';
import { getSkillBonusForFeatRequirement } from '@/lib/game/formulas';
import { buildFeatLevelChips, getFeatLevel, groupFeatFamilies, formatFeatName } from '@/lib/leveled-feats';
import { Alert } from '@/components/ui';
import { UnifiedSelectionModal, type SelectableItem } from '@/components/shared/unified-selection-modal';
import type { ChipData } from '@/components/shared/grid-list-row';
import type { Character } from '@/types';

interface FeatModal extends Feat {
  effect?: string;
  max_uses?: number;
}

interface AddFeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  featType: 'archetype' | 'character' | 'state';
  character: Character;
  existingFeatIds: (string | number)[];
  onAdd: (feats: FeatModal[]) => void;
}

/** Id of the previous-level feat required to take this feat. Null if level 1 or no base. */
function getPreviousLevelFeatId(feat: FeatModal, allFeats: FeatModal[]): string | null {
  const level = getFeatLevel(feat);
  if (level <= 1) return null;
  if (feat.base_feat_id && level === 2) return feat.base_feat_id;
  if (feat.base_feat_id && level >= 3) {
    const prev = allFeats.find(
      (f) => f.base_feat_id === feat.base_feat_id && getFeatLevel(f) === level - 1
    );
    return prev ? String(prev.id) : null;
  }
  return null;
}

function featToSelectableItem(
  feat: FeatModal,
  familyLevels: FeatModal[],
  disabled: boolean,
  warningMessage: string | undefined,
  skillIdToName: Map<string, string>
): SelectableItem {
  const detailSections: Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }> = [];
  const typeChips: ChipData[] = [];
  if (feat.char_feat) typeChips.push({ name: 'Character Feat', category: 'skill' });
  else typeChips.push({ name: 'Archetype Feat', category: 'archetype' });
  if (feat.state_feat) typeChips.push({ name: 'State Feat', category: 'archetype' });
  if (typeChips.length > 0) detailSections.push({ label: 'Type', chips: typeChips, hideLabelIfSingle: true });
  if (feat.category) detailSections.push({ label: 'Category', chips: [{ name: feat.category, category: 'default' }], hideLabelIfSingle: true });
  const tagChips: ChipData[] = feat.tags?.map(tag => ({ name: tag, category: 'tag' as const })) || [];
  if (tagChips.length > 0) detailSections.push({ label: 'Tags', chips: tagChips, hideLabelIfSingle: true });
  const abilityReqChips: ChipData[] = (feat.ability_req || []).map((a, i) => {
    const val = feat.abil_req_val?.[i];
    return { name: `${a}${typeof val === 'number' ? ` ${val}+` : ''}`, category: 'default' as const };
  });
  if (abilityReqChips.length > 0) detailSections.push({ label: 'Ability Requirements', chips: abilityReqChips });
  const skillReqChips: ChipData[] = (feat.skill_req || []).map((id, i) => {
    const label = skillIdToName.get(String(id)) || String(id);
    const val = feat.skill_req_val?.[i];
    return { name: `${label}${typeof val === 'number' ? ` ${val}+` : ''}`, category: 'skill' as const };
  });
  if (skillReqChips.length > 0) detailSections.push({ label: 'Skill Requirements', chips: skillReqChips });
  const levelChips = buildFeatLevelChips(familyLevels, feat.id);
  if (levelChips.length > 0) detailSections.push({ label: 'Feat Levels', chips: levelChips });

  const usesVal = feat.uses_per_rec ?? (feat as FeatModal).max_uses;
  const usesDisplay = (usesVal === 0 || usesVal === undefined) ? '-' : String(usesVal);
  return {
    id: String(feat.id),
    name: formatFeatName(feat),
    description: feat.description || (feat as FeatModal).effect,
    columns: [
      { key: 'uses_per_rec', label: 'Uses', value: usesDisplay, align: 'center' as const },
      { key: 'rec_period', label: 'Recovery', value: feat.rec_period || '-', align: 'center' as const },
      { key: 'category', label: 'Category', value: feat.category || '-', align: 'center' as const },
    ],
    detailSections: detailSections.length > 0 ? detailSections : undefined,
    disabled,
    warningMessage: warningMessage || undefined,
    data: feat,
  };
}

export function AddFeatModal({
  isOpen,
  onClose,
  featType,
  character,
  existingFeatIds,
  onAdd,
}: AddFeatModalProps) {
  const categorySelectId = useId();
  const abilitySelectId = useId();
  const { data: codexFeats = [], isLoading: loading, error: queryError } = useCodexFeats();
  const { data: codexSkills = [] } = useCodexSkills();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAbility, setSelectedAbility] = useState<string>('');
  const [showStateFeats, setShowStateFeats] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);

  const feats = useMemo((): FeatModal[] => {
    if (!codexFeats || !Array.isArray(codexFeats)) return [];
    return codexFeats.map((f) => ({
      ...f,
      id: String(f.id),
      effect: f.description,
      max_uses: f.uses_per_rec,
    }));
  }, [codexFeats]);

  useEffect(() => {
    if (isOpen) {
      setSelectedCategory('');
      setSelectedAbility('');
      setShowStateFeats(false);
      setShowBlocked(false);
    }
  }, [isOpen]);

  const skillIdToName = useMemo(() => {
    const map = new Map<string, string>();
    (codexSkills as Skill[]).forEach((s) => map.set(String(s.id), s.name));
    return map;
  }, [codexSkills]);

  const { categories, abilities } = useMemo(() => {
    const cats = new Set<string>();
    const abils = new Set<string>();
    feats.forEach(f => {
      if (featType === 'character' && !f.char_feat) return;
      if (featType === 'archetype' && f.char_feat) return;
      if (f.category) cats.add(f.category);
      if (f.ability) {
        if (Array.isArray(f.ability)) f.ability.forEach(a => abils.add(a));
        else abils.add(f.ability);
      }
    });
    return { categories: Array.from(cats).sort(), abilities: Array.from(abils).sort() };
  }, [feats, featType]);

  const checkRequirements = useCallback((feat: FeatModal): { meets: boolean; warning?: string } => {
    const warnings: string[] = [];
    if (feat.lvl_req && character.level < feat.lvl_req) warnings.push(`Requires level ${feat.lvl_req}`);
    if (feat.ability_req && feat.abil_req_val) {
      const abilities = character.abilities || {};
      feat.ability_req.forEach((abil, idx) => {
        const required = feat.abil_req_val?.[idx] ?? 0;
        const current = abilities[abil.toLowerCase() as keyof typeof abilities] ?? 0;
        if (current < required) warnings.push(`Requires ${abil} ${required}+`);
      });
    }
    if (feat.skill_req && feat.skill_req_val) {
      const charSkills = character.skills || {};
      let skillsForReq: Record<string, { prof?: boolean; val?: number }>;
      if (Array.isArray(charSkills)) {
        skillsForReq = {};
        (charSkills as Array<{ id?: string; name?: string; skill_val?: number; prof?: boolean }>).forEach((s) => {
          const id = s.id != null ? String(s.id) : '';
          const name = s.name != null ? String(s.name) : '';
          const entry = { prof: s.prof ?? false, val: s.skill_val ?? 0 };
          if (id) skillsForReq[id] = entry;
          if (name && name !== id) skillsForReq[name] = entry;
        });
      } else {
        skillsForReq = (typeof charSkills === 'object' && charSkills) ? (charSkills as Record<string, { prof?: boolean; val?: number }>) : {};
      }
      feat.skill_req.forEach((skillId, idx) => {
        const requiredBonus = feat.skill_req_val?.[idx] ?? 1;
        const skillName = skillIdToName.get(String(skillId)) || String(skillId);
        const { bonus, proficient } = getSkillBonusForFeatRequirement(
          String(skillId), character.abilities || {}, skillsForReq, codexSkills
        );
        if (!proficient) warnings.push(`Requires proficiency in ${skillName}`);
        else if (bonus < requiredBonus) warnings.push(`Requires ${skillName} bonus ${requiredBonus}+ (yours: ${bonus})`);
      });
    }
    const prevLevelId = getPreviousLevelFeatId(feat, feats);
    if (prevLevelId) {
      const allCharFeatIds = [
        ...(character.archetypeFeats || []).map((f) => String(f.id ?? (f as { name?: string }).name)),
        ...(character.feats || []).map((f) => String(f.id ?? (f as { name?: string }).name)),
      ];
      const hasPrereq = allCharFeatIds.includes(prevLevelId);
      if (!hasPrereq) {
        const prevFeat = feats.find((f) => String(f.id) === prevLevelId);
        const prevLevel = prevFeat?.feat_lvl ?? 1;
        warnings.push(`Requires ${prevFeat?.name ?? 'previous level'} (Level ${prevLevel})`);
      }
    }
    return { meets: warnings.length === 0, warning: warnings.join(', ') };
  }, [character, skillIdToName, codexSkills, feats]);

  const items = useMemo((): SelectableItem[] => {
    const baseFiltered = feats
      .filter(feat => {
        if (featType === 'state') {
          if (!feat.state_feat) return false;
        } else if (featType === 'character' && !feat.char_feat) return false;
        else if (featType === 'archetype' && feat.char_feat) return false;
        // Id-only matching: leveled feats can share the same name.
        if (existingFeatIds.includes(feat.id)) return false;
        if (featType !== 'state' && !showStateFeats && feat.state_feat) return false;
        const { meets } = checkRequirements(feat);
        if (!meets && !showBlocked) return false;
        if (selectedCategory && feat.category !== selectedCategory) return false;
        if (selectedAbility && feat.ability !== selectedAbility) return false;
        return true;
      });

    const families = groupFeatFamilies(baseFiltered);
    const existingFeatIdSet = new Set(existingFeatIds.map((id) => String(id)));

    return families
      .map(({ levels }) => {
        const selectableLevels = levels
          .filter((levelFeat) => !existingFeatIdSet.has(String(levelFeat.id)))
          .slice()
          .sort((a, b) => getFeatLevel(b) - getFeatLevel(a));
        if (selectableLevels.length === 0) return null;
        const displayFeat = selectableLevels[0];
        const { meets, warning } = checkRequirements(displayFeat);
        return featToSelectableItem(displayFeat, levels, !meets && !showBlocked, warning, skillIdToName);
      })
      .filter((item): item is SelectableItem => item !== null);
  }, [feats, featType, existingFeatIds, showStateFeats, showBlocked, selectedCategory, selectedAbility, checkRequirements, skillIdToName]);

  const error = queryError ? `Failed to load feats: ${queryError.message}` : null;

  const filterContent = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor={categorySelectId} className="text-sm text-text-muted dark:text-text-secondary">Category:</label>
        <select
          id={categorySelectId}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-sm px-2 py-1 rounded-lg border border-border-light bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor={abilitySelectId} className="text-sm text-text-muted dark:text-text-secondary">Ability:</label>
        <select
          id={abilitySelectId}
          value={selectedAbility}
          onChange={(e) => setSelectedAbility(e.target.value)}
          className="text-sm px-2 py-1 rounded-lg border border-border-light bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All</option>
          {abilities.map(abil => <option key={abil} value={abil}>{abil}</option>)}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-text-muted dark:text-text-secondary">
        <input
          type="checkbox"
          checked={showStateFeats}
          onChange={(e) => setShowStateFeats(e.target.checked)}
          className="rounded border-border-light"
        />
        Show state feats
      </label>
      <label className="flex items-center gap-2 text-sm text-text-muted dark:text-text-secondary">
        <input
          type="checkbox"
          checked={showBlocked}
          onChange={(e) => setShowBlocked(e.target.checked)}
          className="rounded border-border-light"
        />
        Show blocked
      </label>
    </div>
  );

  return (
    <>
      {error && isOpen && (
        <Alert variant="danger" className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md">
          {error}
        </Alert>
      )}
      <UnifiedSelectionModal
        isOpen={isOpen}
        onClose={onClose}
        title={`Add ${featType === 'state' ? 'State' : featType === 'archetype' ? 'Archetype' : 'Character'} Feat`}
        description="Select feats to add to your character. Feats are filtered by your level and requirements. Click a row (or the + button) to select, then click Add Selected."
        items={items}
        isLoading={loading}
        onConfirm={(selected) => onAdd(selected.map(i => i.data as FeatModal))}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'uses_per_rec', label: 'Uses' },
          { key: 'rec_period', label: 'Recovery' },
          { key: 'category', label: 'Category' },
        ]}
        gridColumns="1.5fr 0.6fr 0.6fr 0.8fr"
        itemLabel="feat"
        emptyMessage={error ?? 'No feats match your filters.'}
        searchPlaceholder="Search feats by name, description, or tags..."
        filterContent={filterContent}
        showFilters={true}
        hideDisabled={false}
        size="xl"
        className="max-h-[85vh]"
      />
    </>
  );
}
