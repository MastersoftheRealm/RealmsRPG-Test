'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  SectionHeader,
  SearchInput,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
  ListEmptyState as EmptyState,
  ValueStepper,
  QuantitySelector,
  ChipSelect,
} from '@/components/shared';
import { Modal, Button, Input, IconButton, useToast } from '@/components/ui';
import { useCodexArchetypes, useCodexEquipment, useCodexFeats, useCodexSkills, useCodexItemProperties, useCodexPowerParts } from '@/hooks/use-codex';
import { useOfficialLibrary } from '@/hooks/use-official-library';
import { useQueryClient } from '@tanstack/react-query';
import { deleteCodexDoc, saveArchetypeWithPath } from './actions';
import { Pencil, Copy, Plus, X } from 'lucide-react';
import { getFeatLevel, formatFeatName } from '@/lib/leveled-feats';
import { formatListCellLabel } from '@/lib/utils';
import {
  parseArchetypePathData,
  pathHiddenFromPlayerPicker,
  serializeLevel1LoadoutsField,
  coerceJsonRecord,
  parseOptionalJsonField,
  parseIdQuantityStrings,
  serializeIdQuantityStrings,
  filterFeatGuidanceGroups,
  mergeFeatGuidanceGroups,
  seedFeatGroupsFromFlatFeats,
  unionFeatIdsFromGuidanceGroups,
  resolvePathGuidanceAudience,
  type Level1ArmorStep,
} from '@/lib/game/archetype-path';
import { validateLevel1Skills, validatePathDataForPublish } from '@/lib/game/path-validation';
import { snapshotOfficialPowerForInnate } from '@/lib/game/innate-eligibility';
import {
  createItemTpResolver,
  trainingPointLimitFromRecommendedAbilities,
} from '@/lib/guided-creator/loadout-tp';
import { LAYER1_GOVERNANCE } from '@/lib/constants/creator-layer-governance';
import type { PowerPart } from '@/hooks/codex-types';
import type { LibraryPower } from '@/types/library';
import type { AbilityName } from '@/types/abilities';
import type { CodexSkill } from '@/types/codex';
import type { PathGuidanceAudience, PathGuidanceGroup } from '@/types/archetype';

const COPY_NAME_SUFFIX = ' copy';
const ABILITY_OPTIONS = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'] as const;
/** Level-1 ability cap mirrors the character creator (ABILITY_CONSTRAINTS.getMaxAbility(1)). */
const RECOMMENDED_ABILITY_MAX = 3;
const PATH_LEVEL1_MAX_BASE_SKILLS = LAYER1_GOVERNANCE.maxPathRecommendedBaseSkills;

/**
 * Base skills: empty/null `base_skill_id` only (TASK-515 AC + guided curated-skills SoT).
 * `base_skill_id === 0` is an any-base sub-skill — not a base skill for path recommendations.
 */
function isCodexBaseSkill(skill: Pick<CodexSkill, 'base_skill_id'>): boolean {
  return skill.base_skill_id == null;
}

function isCodexSubSkill(skill: Pick<CodexSkill, 'base_skill_id'>): boolean {
  return skill.base_skill_id != null;
}

function toastLevel1SkillWarnings(
  skillIds: string[],
  skills: CodexSkill[],
  showToast: (message: string, type: 'warning') => void
): void {
  const byId = new Map(skills.map((s) => [String(s.id), s]));
  const issues = validateLevel1Skills(skillIds, {
    isSubSkill: (id) => {
      const skill = byId.get(String(id));
      if (!skill) return null;
      return isCodexSubSkill(skill);
    },
  });
  for (const issue of issues) {
    showToast(issue.message, 'warning');
  }
}

function armamentTypeOf(
  id: string,
  typeById: Map<string, string>
): 'weapon' | 'shield' | 'armor' | 'unknown' {
  const t = typeById.get(id);
  if (t === 'weapon' || t === 'shield' || t === 'armor') return t;
  return 'unknown';
}

type RecommendedAbilities = Partial<Record<AbilityName, number>>;

function labelForAbility(ability: string): string {
  return ability.charAt(0).toUpperCase() + ability.slice(1);
}

type CodexFeatLike = {
  id?: string;
  name?: string;
  description?: string;
  feat_lvl?: number;
  base_feat_id?: string;
  lvl_req?: number;
  char_feat?: boolean;
};
function toLeveledFeatLike(f: CodexFeatLike) {
  return { ...f, id: f.id ?? '' };
}

/** Selected feats as expandable rows so admins can read Codex descriptions after picking. */
function SelectedFeatRows({
  featIds,
  featById,
  onRemove,
}: {
  featIds: string[];
  featById: Map<string, CodexFeatLike>;
  onRemove: (id: string) => void;
}) {
  if (featIds.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {featIds.map((id) => {
        const feat = featById.get(id);
        const name = feat
          ? formatFeatName(toLeveledFeatLike(feat)) || id
          : id;
        const description = feat?.description?.trim() || 'No description in Codex.';
        return (
          <GridListRow
            key={id}
            id={id}
            name={name}
            description={description}
            compact
            onDelete={() => onRemove(id)}
          />
        );
      })}
    </div>
  );
}

/** Quantity row for armaments / equipment — full-width so label and controls do not overlap. */
function PathQuantityRow({
  label,
  quantity,
  onQuantityChange,
  onRemove,
  removeLabel,
}: {
  label: string;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border-light bg-surface px-3 py-2 min-h-[44px]">
      <span className="text-sm text-text-primary min-w-0 flex-1 truncate" title={label}>
        {label}
      </span>
      <QuantitySelector
        quantity={quantity}
        onChange={onQuantityChange}
        min={1}
        className="shrink-0"
        decrementLabel={`Decrease quantity for ${label}`}
        incrementLabel={`Increase quantity for ${label}`}
      />
      <IconButton
        variant="ghost"
        size="sm"
        className="shrink-0 min-h-[44px] min-w-[44px]"
        onClick={onRemove}
        label={removeLabel}
      >
        <X className="w-4 h-4" />
      </IconButton>
    </div>
  );
}

function guidedAbilitiesFromPath(pathData: unknown): RecommendedAbilities {
  const level1 = parseArchetypePathData(pathData)?.level1;
  return level1?.recommended_abilities ?? {};
}

/** Build the persisted recommended-abilities object (only non-zero entries); null when none set. */
function serializeRecommendedAbilities(abilities: RecommendedAbilities): RecommendedAbilities | null {
  const entries = ABILITY_OPTIONS.map((ability) => [ability, abilities[ability] ?? 0] as const).filter(
    ([, value]) => value > 0
  );
  return entries.length > 0 ? (Object.fromEntries(entries) as RecommendedAbilities) : null;
}

function guidedEquipmentMetaFromPath(pathData: unknown): {
  armorStep: Level1ArmorStep | '';
  sharedEquipmentEntries: PathItemEntry[];
} {
  const level1 = parseArchetypePathData(pathData)?.level1;
  return {
    armorStep: level1?.armorStep ?? '',
    sharedEquipmentEntries: (level1?.sharedEquipment ?? []).map((entry) => ({
      id: entry.id,
      quantity: entry.quantity ?? 1,
    })),
  };
}

type PathItemEntry = { id: string; quantity: number };

type PathLevelForm = {
  rowId: string;
  level: number;
  feats: string[];
  skills: string[];
  powers: string[];
  /** Level 1 only: recommended Innate Powers (distinct from powers). */
  innatePowers: string[];
  techniques: string[];
  armaments: string[];
  equipment: string[];
  /** Level 1 only: armaments with quantity for path recommended gear */
  armamentEntries: PathItemEntry[];
  /** Level 1 only: equipment with quantity for path recommended gear */
  equipmentEntries: PathItemEntry[];
  /** Level 1 only: recommend Unarmed Prowess proficiency in equipment step */
  recommendUnarmedProwess: boolean;
  removeFeats: string[];
  removePowers: string[];
  removeTechniques: string[];
  removeArmaments: string[];
  notes: string;
};

type SelectionOption = { value: string; label: string };

function toCsv(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value.map(String).filter(Boolean).join(', ');
}

function toSelectionArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function resolveSelectedValues(values: string[], options: SelectionOption[]): string[] {
  if (!values.length) return [];
  if (!options.length) return dedupeStrings(values);

  const byValue = new Map(options.map((opt) => [opt.value.toLowerCase(), opt.value]));
  const byLabel = new Map(options.map((opt) => [opt.label.toLowerCase(), opt.value]));

  return dedupeStrings(
    values.map((raw) => {
      const normalized = raw.toLowerCase();
      return byValue.get(normalized) || byLabel.get(normalized) || raw;
    })
  );
}

function parsePathData(value: unknown): Record<string, unknown> | undefined {
  return coerceJsonRecord(value);
}

function makeLevelRow(level = 2): PathLevelForm {
  return {
    rowId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level,
    feats: [],
    skills: [],
    powers: [],
    innatePowers: [],
    techniques: [],
    armaments: [],
    equipment: [],
    armamentEntries: [],
    equipmentEntries: [],
    recommendUnarmedProwess: false,
    removeFeats: [],
    removePowers: [],
    removeTechniques: [],
    removeArmaments: [],
    notes: '',
  };
}

function newFeatGuidanceGroup(audience: PathGuidanceAudience): PathGuidanceGroup {
  const suffix = Math.random().toString(36).slice(2, 8);
  return {
    id: `feat-${audience}-${Date.now().toString(36)}-${suffix}`,
    title: audience === 'character' ? 'Character feat picks' : 'Archetype feat picks',
    why: '',
    audience,
    feats: [],
  };
}

/** Load guidance groups for admin edit; seed from flat feats when groups lack feat lists. */
function guidanceGroupsFromPathData(pathData: unknown, flatFeats: string[]): PathGuidanceGroup[] {
  const parsed = parseArchetypePathData(pathData);
  const existing = parsed?.level1?.guidance_groups ?? [];
  return seedFeatGroupsFromFlatFeats(flatFeats, existing);
}

function toLevelForm(
  raw: Record<string, unknown>,
  level = 2,
  optionsByKey?: Partial<Record<keyof Omit<PathLevelForm, 'rowId' | 'level' | 'notes'>, SelectionOption[]>>
): PathLevelForm {
  const rawArmaments = Array.isArray(raw.armaments) ? (raw.armaments as string[]).map(String) : toSelectionArray(raw.armaments);
  const rawEquipment = Array.isArray(raw.equipment) ? (raw.equipment as string[]).map(String) : toSelectionArray(raw.equipment);
  const armamentEntries = parseIdQuantityStrings(rawArmaments);
  const equipmentEntries = parseIdQuantityStrings(rawEquipment);
  return {
    rowId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level: Number(raw.level ?? level) || level,
    feats: resolveSelectedValues(toSelectionArray(raw.feats), optionsByKey?.feats ?? []),
    skills: resolveSelectedValues(toSelectionArray(raw.skills), optionsByKey?.skills ?? []),
    powers: resolveSelectedValues(toSelectionArray(raw.powers), optionsByKey?.powers ?? []),
    innatePowers: resolveSelectedValues(
      toSelectionArray(raw.innatePowers ?? raw.innate_powers),
      optionsByKey?.innatePowers ?? optionsByKey?.powers ?? []
    ),
    techniques: resolveSelectedValues(toSelectionArray(raw.techniques), optionsByKey?.techniques ?? []),
    armaments: armamentEntries.map((e) => e.id),
    equipment: equipmentEntries.map((e) => e.id),
    armamentEntries,
    equipmentEntries,
    recommendUnarmedProwess: raw.recommendUnarmedProwess === true,
    removeFeats: resolveSelectedValues(toSelectionArray(raw.removeFeats), optionsByKey?.removeFeats ?? []),
    removePowers: resolveSelectedValues(toSelectionArray(raw.removePowers), optionsByKey?.removePowers ?? []),
    removeTechniques: resolveSelectedValues(toSelectionArray(raw.removeTechniques), optionsByKey?.removeTechniques ?? []),
    removeArmaments: resolveSelectedValues(toSelectionArray(raw.removeArmaments), optionsByKey?.removeArmaments ?? []),
    notes: typeof raw.notes === 'string' ? raw.notes : '',
  };
}

function buildLevelPayload(level: PathLevelForm, includeLevel: boolean): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (includeLevel) payload.level = level.level;
  const feats = dedupeStrings(level.feats);
  const skills = dedupeStrings(level.skills);
  const powers = dedupeStrings(level.powers);
  const innatePowers = dedupeStrings(level.innatePowers);
  const techniques = dedupeStrings(level.techniques);
  const isLevel1 = !includeLevel;
  const armaments = isLevel1 && level.armamentEntries?.length
    ? serializeIdQuantityStrings(level.armamentEntries)
    : dedupeStrings(level.armaments);
  const equipment = isLevel1 && level.equipmentEntries?.length
    ? serializeIdQuantityStrings(level.equipmentEntries)
    : dedupeStrings(level.equipment);
  const removeFeats = dedupeStrings(level.removeFeats);
  const removePowers = dedupeStrings(level.removePowers);
  const removeTechniques = dedupeStrings(level.removeTechniques);
  const removeArmaments = dedupeStrings(level.removeArmaments);
  if (feats.length) payload.feats = feats;
  if (skills.length) payload.skills = skills;
  if (powers.length) payload.powers = powers;
  if (isLevel1 && innatePowers.length) payload.innatePowers = innatePowers;
  if (techniques.length) payload.techniques = techniques;
  if (armaments.length) payload.armaments = armaments;
  if (equipment.length) payload.equipment = equipment;
  if (removeFeats.length) payload.removeFeats = removeFeats;
  if (removePowers.length) payload.removePowers = removePowers;
  if (removeTechniques.length) payload.removeTechniques = removeTechniques;
  if (removeArmaments.length) payload.removeArmaments = removeArmaments;
  if (level.notes.trim()) payload.notes = level.notes.trim();
  if (isLevel1 && (level as PathLevelForm).recommendUnarmedProwess) payload.recommendUnarmedProwess = true;
  return payload;
}

export function AdminArchetypesTab() {
  const { showToast } = useToast();
  const { data: archetypes, isLoading, error, refetch } = useCodexArchetypes();
  const { data: codexFeats = [] } = useCodexFeats();
  const { data: codexSkills = [] } = useCodexSkills();
  const { data: codexEquipment = [] } = useCodexEquipment();
  const { data: powerPartsDb = [] } = useCodexPowerParts();
  const { data: officialPowers = [], isLoading: isLoadingOfficialPowers } = useOfficialLibrary('powers');
  const { data: officialTechniques = [], isLoading: isLoadingOfficialTechniques } = useOfficialLibrary('techniques');
  const { data: officialItems = [], isLoading: isLoadingOfficialItems } = useOfficialLibrary('items');
  const { data: itemProperties = [] } = useCodexItemProperties();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  type ArchetypeItem = import('@/types/codex').CodexArchetype;
  const [editing, setEditing] = useState<ArchetypeItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [copySourceName, setCopySourceName] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    type: 'power' as 'power' | 'powered-martial' | 'martial',
    description: '',
    archetypeAbility: '',
    secondaryAbility: '',
    powerProfStart: 0,
    martialProfStart: 0,
    powerProfLevel5: 0,
    martialProfLevel5: 0,
    level1Path: makeLevelRow(1),
    levelPathRows: [makeLevelRow(2)],
    advancedPathJson: '',
    guidedRecommendedAbilities: {} as RecommendedAbilities,
    guidedArmorStep: '' as Level1ArmorStep | '',
    guidedSharedEquipmentEntries: [] as PathItemEntry[],
    /** Level 1 guidance groups (feat groups authored here; others preserved). */
    guidanceGroups: [] as PathGuidanceGroup[],
  });

  const filtered = (archetypes || []).filter(
    (a: ArchetypeItem) =>
      !search ||
      (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const featById = useMemo(() => {
    const map = new Map<string, CodexFeatLike>();
    for (const feat of codexFeats as CodexFeatLike[]) {
      if (feat.id != null && feat.id !== '') map.set(String(feat.id), feat);
    }
    return map;
  }, [codexFeats]);

  const featOptions = useMemo<SelectionOption[]>(
    () =>
      (codexFeats as CodexFeatLike[])
        .map((feat) => {
          const normalized = toLeveledFeatLike(feat);
          return {
            value: String(normalized.id),
            label: formatFeatName(normalized) || String(normalized.id),
          };
        })
        .filter((feat) => feat.value && feat.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [codexFeats]
  );
  const getFeatOptionsForLevel = useCallback(
    (pathLevel: number): SelectionOption[] => {
      return (codexFeats as CodexFeatLike[])
        .filter((feat) => {
          const lvlReq = feat.lvl_req;
          if (lvlReq != null && lvlReq > pathLevel) return false;
          if (pathLevel === 1) return getFeatLevel(toLeveledFeatLike(feat)) === 1;
          return true;
        })
        .map((feat) => {
          const normalized = toLeveledFeatLike(feat);
          return {
            value: String(normalized.id),
            label: formatFeatName(normalized) || String(normalized.id),
          };
        })
        .filter((o) => o.value && o.label)
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    [codexFeats]
  );
  const featOptionsLevel1 = useMemo(() => getFeatOptionsForLevel(1), [getFeatOptionsForLevel]);
  const characterFeatOptionsLevel1 = useMemo(
    () =>
      featOptionsLevel1.filter((opt) => {
        const feat = (codexFeats as CodexFeatLike[]).find((f) => String(f.id) === opt.value);
        return Boolean(feat?.char_feat);
      }),
    [featOptionsLevel1, codexFeats]
  );
  const archetypeFeatOptionsLevel1 = useMemo(
    () =>
      featOptionsLevel1.filter((opt) => {
        const feat = (codexFeats as CodexFeatLike[]).find((f) => String(f.id) === opt.value);
        return !feat?.char_feat;
      }),
    [featOptionsLevel1, codexFeats]
  );

  const allSkillOptions = useMemo<SelectionOption[]>(
    () =>
      (codexSkills as CodexSkill[])
        .map((skill) => ({ value: String(skill.id ?? ''), label: String(skill.name ?? skill.id ?? '') }))
        .filter((skill) => skill.value && skill.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [codexSkills]
  );

  const baseSkillOptions = useMemo<SelectionOption[]>(
    () =>
      (codexSkills as CodexSkill[])
        .filter((skill) => isCodexBaseSkill(skill))
        .map((skill) => ({ value: String(skill.id ?? ''), label: String(skill.name ?? skill.id ?? '') }))
        .filter((skill) => skill.value && skill.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [codexSkills]
  );

  const skillById = useMemo(() => {
    const map = new Map<string, CodexSkill>();
    for (const skill of codexSkills as CodexSkill[]) {
      if (skill.id != null) map.set(String(skill.id), skill);
    }
    return map;
  }, [codexSkills]);

  /** Picker options: base skills + any legacy-selected ids (so chips keep labels). */
  const level1SkillPickerOptions = useMemo<SelectionOption[]>(() => {
    const selected = form.level1Path.skills;
    const byValue = new Map(baseSkillOptions.map((o) => [o.value, o]));
    for (const id of selected) {
      if (byValue.has(id)) continue;
      const fromAll = allSkillOptions.find((o) => o.value === id);
      if (fromAll) byValue.set(id, fromAll);
      else byValue.set(id, { value: id, label: id });
    }
    return Array.from(byValue.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [baseSkillOptions, allSkillOptions, form.level1Path.skills]);

  const level1SkillIssues = useMemo(
    () =>
      validateLevel1Skills(form.level1Path.skills, {
        isSubSkill: (id) => {
          const skill = skillById.get(String(id));
          if (!skill) return null;
          return isCodexSubSkill(skill);
        },
      }),
    [form.level1Path.skills, skillById]
  );

  const powerOptions = useMemo<SelectionOption[]>(
    () =>
      officialPowers
        .map((power) => ({
          value: String(power.id ?? ''),
          label: String(power.name ?? power.id ?? ''),
        }))
        .filter((power) => power.value && power.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [officialPowers]
  );

  const techniqueOptions = useMemo<SelectionOption[]>(
    () =>
      officialTechniques
        .map((technique) => ({
          value: String(technique.id ?? ''),
          label: String(technique.name ?? technique.id ?? ''),
        }))
        .filter((technique) => technique.value && technique.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [officialTechniques]
  );

  const armamentTypeById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of officialItems) {
      const id = String(item.id ?? '');
      if (id) map.set(id, String(item.type ?? '').toLowerCase());
    }
    return map;
  }, [officialItems]);

  const weaponShieldArmamentOptions = useMemo<SelectionOption[]>(
    () =>
      officialItems
        .filter((item) => {
          const type = String(item.type ?? '').toLowerCase();
          return type === 'weapon' || type === 'shield';
        })
        .map((item) => ({
          value: String(item.id ?? ''),
          label: String(item.name ?? item.id ?? ''),
        }))
        .filter((item) => item.value && item.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [officialItems]
  );

  const armorArmamentOptions = useMemo<SelectionOption[]>(
    () =>
      officialItems
        .filter((item) => String(item.type ?? '').toLowerCase() === 'armor')
        .map((item) => ({
          value: String(item.id ?? ''),
          label: String(item.name ?? item.id ?? ''),
        }))
        .filter((item) => item.value && item.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [officialItems]
  );

  /** Combined for labels / unknown checks / remove-armaments (single storage pool). */
  const armamentOptions = useMemo<SelectionOption[]>(
    () =>
      dedupeStrings([
        ...weaponShieldArmamentOptions.map((o) => o.value),
        ...armorArmamentOptions.map((o) => o.value),
      ])
        .map(
          (id) =>
            weaponShieldArmamentOptions.find((o) => o.value === id) ??
            armorArmamentOptions.find((o) => o.value === id)
        )
        .filter((item): item is SelectionOption => Boolean(item))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [weaponShieldArmamentOptions, armorArmamentOptions]
  );

  const level1WeaponShieldEntries = useMemo(
    () =>
      form.level1Path.armamentEntries.filter((entry) => {
        const kind = armamentTypeOf(entry.id, armamentTypeById);
        return kind === 'weapon' || kind === 'shield' || kind === 'unknown';
      }),
    [form.level1Path.armamentEntries, armamentTypeById]
  );

  const level1ArmorEntries = useMemo(
    () =>
      form.level1Path.armamentEntries.filter(
        (entry) => armamentTypeOf(entry.id, armamentTypeById) === 'armor'
      ),
    [form.level1Path.armamentEntries, armamentTypeById]
  );

  const equipmentOptions = useMemo<SelectionOption[]>(() => {
    const codex = (codexEquipment as Array<{ id?: string; name?: string }>)
      .map((item) => ({
        value: String(item.id ?? ''),
        label: `${String(item.name ?? item.id ?? '')} (Codex)`,
      }))
      .filter((item) => item.value && item.label);

    const official = officialItems
      .filter((item) => String(item.type ?? '').toLowerCase() === 'equipment')
      .map((item) => ({
        value: String(item.id ?? ''),
        label: `${String(item.name ?? item.id ?? '')} (Official)`,
      }))
      .filter((item) => item.value && item.label);

    return dedupeStrings([...codex.map((item) => item.value), ...official.map((item) => item.value)])
      .map((id) => codex.find((item) => item.value === id) ?? official.find((item) => item.value === id))
      .filter((item): item is SelectionOption => Boolean(item))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [codexEquipment, officialItems]);

  const optionsByField = useMemo(
    () => ({
      feats: featOptions,
      skills: allSkillOptions,
      powers: powerOptions,
      innatePowers: powerOptions,
      techniques: techniqueOptions,
      armaments: armamentOptions,
      equipment: equipmentOptions,
      removeFeats: featOptions,
      removePowers: powerOptions,
      removeTechniques: techniqueOptions,
      removeArmaments: armamentOptions,
    }),
    [featOptions, allSkillOptions, powerOptions, techniqueOptions, armamentOptions, equipmentOptions]
  );

  const isSelectionDataLoading =
    isLoadingOfficialPowers || isLoadingOfficialTechniques || isLoadingOfficialItems;

  type PathSelectionKey =
    | 'feats'
    | 'skills'
    | 'powers'
    | 'innatePowers'
    | 'techniques'
    | 'armaments'
    | 'equipment'
    | 'removeFeats'
    | 'removePowers'
    | 'removeTechniques'
    | 'removeArmaments';

  const selectionFieldConfig: Array<{ key: PathSelectionKey; label: string; placeholder: string }> = [
    // Level 1 feats authored via guidance groups (TASK-514); higher levels still use ChipSelect.
    { key: 'feats', label: 'Feats', placeholder: 'Select recommended feats' },
    { key: 'skills', label: 'Skills (max 3 base)', placeholder: 'Select up to 3 base skills' },
    { key: 'powers', label: 'Powers', placeholder: 'Select recommended powers' },
    { key: 'innatePowers', label: 'Innate Powers', placeholder: 'Select recommended innate powers' },
    { key: 'techniques', label: 'Techniques', placeholder: 'Select recommended techniques' },
    { key: 'armaments', label: 'Armaments', placeholder: 'Select recommended armaments' },
    { key: 'equipment', label: 'Equipment', placeholder: 'Select recommended equipment' },
  ];

  /** Admin sections include empty newly-added groups (guided filter still requires feats). */
  const isFeatOrientedGuidanceGroup = (g: PathGuidanceGroup) =>
    (g.feats?.length ?? 0) > 0 || g.audience === 'character' || g.audience === 'archetype';
  const characterFeatGroups = useMemo(
    () =>
      form.guidanceGroups.filter(
        (g) => isFeatOrientedGuidanceGroup(g) && resolvePathGuidanceAudience(g) === 'character'
      ),
    [form.guidanceGroups]
  );
  const archetypeFeatGroups = useMemo(
    () =>
      form.guidanceGroups.filter(
        (g) => isFeatOrientedGuidanceGroup(g) && resolvePathGuidanceAudience(g) === 'archetype'
      ),
    [form.guidanceGroups]
  );
  const syncedFeatPreviewLabels = useMemo(() => {
    const ids = unionFeatIdsFromGuidanceGroups(form.guidanceGroups);
    return ids.map((value) => featOptions.find((option) => option.value === value)?.label ?? value);
  }, [form.guidanceGroups, featOptions]);

  const updateFeatGuidanceGroup = (
    groupId: string,
    patch: Partial<Pick<PathGuidanceGroup, 'title' | 'why' | 'feats'>>
  ) => {
    setForm((prev) => ({
      ...prev,
      guidanceGroups: prev.guidanceGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              ...patch,
              audience: resolvePathGuidanceAudience(g),
            }
          : g
      ),
    }));
  };

  const addFeatGuidanceGroup = (audience: PathGuidanceAudience) => {
    const current = filterFeatGuidanceGroups(form.guidanceGroups, audience);
    if (current.length >= LAYER1_GOVERNANCE.maxGroupsPerStep) {
      showToast(
        `At most ${LAYER1_GOVERNANCE.maxGroupsPerStep} ${audience} feat groups (Layer 1 governance).`,
        'warning'
      );
      return;
    }
    setForm((prev) => ({
      ...prev,
      guidanceGroups: [...prev.guidanceGroups, newFeatGuidanceGroup(audience)],
    }));
  };

  const removeFeatGuidanceGroup = (groupId: string) => {
    setForm((prev) => ({
      ...prev,
      guidanceGroups: prev.guidanceGroups.filter((g) => g.id !== groupId),
    }));
  };

  const addLevel1Armament = (value: string) => {
    setForm((prev) => {
      if (prev.level1Path.armamentEntries.some((e) => e.id === value)) return prev;
      return {
        ...prev,
        level1Path: {
          ...prev.level1Path,
          armamentEntries: [...prev.level1Path.armamentEntries, { id: value, quantity: 1 }],
        },
      };
    });
  };

  const updateLevel1ArmamentQty = (id: string, quantity: number) => {
    setForm((prev) => ({
      ...prev,
      level1Path: {
        ...prev.level1Path,
        armamentEntries: prev.level1Path.armamentEntries.map((e) =>
          e.id === id ? { ...e, quantity } : e
        ),
      },
    }));
  };

  const removeLevel1Armament = (id: string) => {
    setForm((prev) => ({
      ...prev,
      level1Path: {
        ...prev.level1Path,
        armamentEntries: prev.level1Path.armamentEntries.filter((e) => e.id !== id),
      },
    }));
  };

  const removeFieldConfig: Array<{ key: PathSelectionKey; label: string; placeholder: string }> = [
    { key: 'removeFeats', label: 'Remove Feats', placeholder: 'Select feats to remove at this level' },
    { key: 'removePowers', label: 'Remove Powers', placeholder: 'Select powers to remove at this level' },
    { key: 'removeTechniques', label: 'Remove Techniques', placeholder: 'Select techniques to remove at this level' },
    { key: 'removeArmaments', label: 'Remove Armaments', placeholder: 'Select armaments to remove at this level' },
  ];

  const getSelectedLabels = (values: string[], options: SelectionOption[]) =>
    values.map((value) => options.find((option) => option.value === value)?.label ?? value);

  function getUnknownSelectionsForLevel(levelForm: PathLevelForm, labelPrefix: string): string[] {
    const unknowns: string[] = [];

    const checkField = (key: PathSelectionKey, label: string) => {
      const options = optionsByField[key];
      const knownIds = new Set(options.map((opt) => opt.value));
      const ids = levelForm[key].filter(Boolean);
      const invalidIds = ids.filter((id) => !knownIds.has(id));
      if (invalidIds.length) {
        const prettyLabels = getSelectedLabels(invalidIds, options);
        unknowns.push(`${labelPrefix}${label}: ${prettyLabels.join(', ')}`);
      }
    };

    const checkEntries = (entries: PathItemEntry[], label: string) => {
      const options = entries.length && label === 'Armaments' ? optionsByField.armaments : optionsByField.equipment;
      if (!options) return;
      const knownIds = new Set(options.map((opt) => opt.value));
      const invalid = entries.filter((e) => !knownIds.has(e.id));
      if (invalid.length) {
        const pretty = invalid.map((e) => getSelectedLabels([e.id], options).join(', ') || e.id);
        unknowns.push(`${labelPrefix}${label}: ${pretty.join(', ')}`);
      }
    };

    checkField('feats', 'Feats');
    checkField('skills', 'Skills');
    checkField('powers', 'Powers');
    checkField('innatePowers', 'Innate Powers');
    checkField('techniques', 'Techniques');
    if (levelForm.armamentEntries?.length) checkEntries(levelForm.armamentEntries, 'Armaments');
    else checkField('armaments', 'Armaments');
    if (levelForm.equipmentEntries?.length) checkEntries(levelForm.equipmentEntries, 'Equipment');
    else checkField('equipment', 'Equipment');
    checkField('removeFeats', 'Remove Feats');
    checkField('removePowers', 'Remove Powers');
    checkField('removeTechniques', 'Remove Techniques');
    checkField('removeArmaments', 'Remove Armaments');

    return unknowns;
  }

  const openAdd = () => {
    setEditing(null);
    setCopySourceName(null);
    setForm({
      name: '',
      type: 'power',
      description: '',
      archetypeAbility: '',
      secondaryAbility: '',
      powerProfStart: 0,
      martialProfStart: 0,
      powerProfLevel5: 0,
      martialProfLevel5: 0,
      level1Path: makeLevelRow(1),
      levelPathRows: [makeLevelRow(2)],
      advancedPathJson: '',
      guidedRecommendedAbilities: {},
      guidedArmorStep: '',
      guidedSharedEquipmentEntries: [],
      guidanceGroups: [],
    });
    setModalOpen(true);
  };

  const openDuplicate = (a: ArchetypeItem) => {
    const parsedPath = parsePathData(a.path_data);
    const rawLevel1 =
      parsedPath && typeof parsedPath.level1 === 'object' && parsedPath.level1 !== null
        ? (parsedPath.level1 as Record<string, unknown>)
        : {};
    const rawLevels = Array.isArray(parsedPath?.levels)
      ? (parsedPath?.levels as unknown[])
      : [];
    const levelRows = rawLevels
      .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
      .map((entry, index) => toLevelForm(entry, index + 2, optionsByField));

    setEditing(null);
    setCopySourceName(a.name || '');
    const equipmentMeta = guidedEquipmentMetaFromPath(a.path_data);
    const level1Path = toLevelForm(rawLevel1, 1, optionsByField);
    setForm({
      name: ((a.name || '').trim() || 'Archetype') + COPY_NAME_SUFFIX,
      type: (a.type || 'power') as 'power' | 'powered-martial' | 'martial',
      description: a.description || '',
      archetypeAbility: a.archetype_ability || '',
      secondaryAbility: a.secondary_ability || '',
      powerProfStart: a.power_prof_start ?? 0,
      martialProfStart: a.martial_prof_start ?? 0,
      powerProfLevel5: a.power_prof_level5 ?? 0,
      martialProfLevel5: a.martial_prof_level5 ?? 0,
      level1Path,
      levelPathRows: levelRows.length ? levelRows : [makeLevelRow(2)],
      advancedPathJson: '',
      guidedRecommendedAbilities: guidedAbilitiesFromPath(a.path_data),
      guidedArmorStep: equipmentMeta.armorStep,
      guidedSharedEquipmentEntries: equipmentMeta.sharedEquipmentEntries,
      guidanceGroups: guidanceGroupsFromPathData(a.path_data, level1Path.feats),
    });
    toastLevel1SkillWarnings(level1Path.skills, codexSkills as CodexSkill[], showToast);
    setModalOpen(true);
  };

  const openEdit = (a: ArchetypeItem) => {
    const parsedPath = parsePathData(a.path_data);
    const rawLevel1 =
      parsedPath && typeof parsedPath.level1 === 'object' && parsedPath.level1 !== null
        ? (parsedPath.level1 as Record<string, unknown>)
        : {};
    const rawLevels = Array.isArray(parsedPath?.levels)
      ? (parsedPath?.levels as unknown[])
      : [];
    const levelRows = rawLevels
      .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
      .map((entry, index) => toLevelForm(entry, index + 2, optionsByField));

    setEditing(a);
    setCopySourceName(null);
    const equipmentMeta = guidedEquipmentMetaFromPath(a.path_data);
    const level1Path = toLevelForm(rawLevel1, 1, optionsByField);
    setForm({
      name: a.name || '',
      type: (a.type || 'power') as 'power' | 'powered-martial' | 'martial',
      description: a.description || '',
      archetypeAbility: a.archetype_ability || '',
      secondaryAbility: a.secondary_ability || '',
      powerProfStart: a.power_prof_start ?? 0,
      martialProfStart: a.martial_prof_start ?? 0,
      powerProfLevel5: a.power_prof_level5 ?? 0,
      martialProfLevel5: a.martial_prof_level5 ?? 0,
      level1Path,
      levelPathRows: levelRows.length ? levelRows : [makeLevelRow(2)],
      advancedPathJson: '',
      guidedRecommendedAbilities: guidedAbilitiesFromPath(a.path_data),
      guidedArmorStep: equipmentMeta.armorStep,
      guidedSharedEquipmentEntries: equipmentMeta.sharedEquipmentEntries,
      guidanceGroups: guidanceGroupsFromPathData(a.path_data, level1Path.feats),
    });
    toastLevel1SkillWarnings(level1Path.skills, codexSkills as CodexSkill[], showToast);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setCopySourceName(null);
    setDeleteConfirm(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;

    const unknownFromLevel1 = getUnknownSelectionsForLevel(form.level1Path, 'Level 1 ');
    const unknownFromLevels = form.levelPathRows.flatMap((row) =>
      getUnknownSelectionsForLevel(row, `Level ${row.level} `)
    );
    const allUnknowns = [...unknownFromLevel1, ...unknownFromLevels];
    if (allUnknowns.length) {
      showToast(
        'Some archetype path entries no longer match existing Codex/Official Library items. ' +
          'Please fix or remove these before saving: ' +
          allUnknowns.join('; '),
        'error'
      );
      return;
    }

    const featGroupsForSave: PathGuidanceGroup[] = form.guidanceGroups
      .filter((g) => (g.feats?.length ?? 0) > 0)
      .map((g) => {
        const audience = resolvePathGuidanceAudience(g);
        const feats = dedupeStrings(g.feats ?? []);
        const why = g.why?.trim();
        return {
          id: g.id,
          title: g.title.trim() || (audience === 'character' ? 'Character feats' : 'Archetype feats'),
          audience,
          ...(why ? { why } : {}),
          feats,
        };
      });
    const nonFeatGroups = form.guidanceGroups.filter(
      (g) =>
        !(g.feats?.length) &&
        ((g.powers?.length ?? 0) > 0 ||
          (g.techniques?.length ?? 0) > 0 ||
          (g.armaments?.length ?? 0) > 0 ||
          (g.equipment?.length ?? 0) > 0 ||
          (g.innatePowers?.length ?? 0) > 0)
    );
    const guidanceGroupsForSave = mergeFeatGuidanceGroups(nonFeatGroups, featGroupsForSave);
    const syncedFeats = unionFeatIdsFromGuidanceGroups(guidanceGroupsForSave);

    const level1Payload = buildLevelPayload(
      {
        ...form.level1Path,
        feats: syncedFeats.length > 0 ? syncedFeats : form.level1Path.feats,
      },
      false
    );
    if (guidanceGroupsForSave.length > 0) {
      level1Payload.guidance_groups = guidanceGroupsForSave;
    }
    const levelsPayload = form.levelPathRows
      .map((row) => buildLevelPayload(row, true))
      .filter((row) => Object.keys(row).length > 1)
      .sort((a, b) => Number(a.level || 0) - Number(b.level || 0));

    let structuredPathData: Record<string, unknown> | undefined;
    if (Object.keys(level1Payload).length > 0 || levelsPayload.length > 0) {
      structuredPathData = {};
      if (Object.keys(level1Payload).length > 0) structuredPathData.level1 = level1Payload;
      if (levelsPayload.length > 0) structuredPathData.levels = levelsPayload;
    }

    if (structuredPathData && pathHiddenFromPlayerPicker(parseArchetypePathData(structuredPathData))) {
      showToast(
        'Level 1 has notes, remove lists, or Unarmed Prowess only; no add recommendations. ' +
          'This path will not appear in the character creator picker or public codex path list until you add level 1 feats, skills, powers, innate powers, techniques, armaments, or equipment.',
        'warning'
      );
    }

    const recommendedAbilitiesValue = serializeRecommendedAbilities(form.guidedRecommendedAbilities);

    let level1Override: Record<string, unknown> | undefined;
    let levelsOverride: Record<string, unknown>[] | undefined;
    if (form.advancedPathJson.trim()) {
      const advancedParse = parseOptionalJsonField(form.advancedPathJson, 'Advanced Path JSON');
      if (!advancedParse.ok) {
        showToast(advancedParse.error, 'error');
        return;
      }
      const override = (advancedParse.value ?? {}) as Record<string, unknown>;
      if (override.level1 && typeof override.level1 === 'object') level1Override = override.level1 as Record<string, unknown>;
      if (Array.isArray(override.levels)) {
        levelsOverride = override.levels.filter(
          (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null
        );
      }
    }

    const previewLevel1 = level1Override || (structuredPathData?.level1 as Record<string, unknown> | undefined) || {};
    const previewExistingLevel1 = editing ? parseArchetypePathData(editing.path_data)?.level1 : undefined;
    const previewAbilities =
      recommendedAbilitiesValue ?? previewExistingLevel1?.recommended_abilities;

    const pathForValidation = parseArchetypePathData({
      level1: {
        ...previewLevel1,
        ...(guidanceGroupsForSave.length > 0
          ? { guidance_groups: guidanceGroupsForSave }
          : {}),
        ...(previewAbilities ? { recommended_abilities: previewAbilities } : {}),
        ...(form.guidedArmorStep ? { armorStep: form.guidedArmorStep } : {}),
        ...(form.guidedSharedEquipmentEntries.length
          ? { sharedEquipment: form.guidedSharedEquipmentEntries }
          : {}),
      },
    });
    if (pathForValidation?.level1) {
      const officialById = new Map(
        (officialPowers as LibraryPower[]).map((p) => [String(p.id ?? ''), p])
      );
      const publishIssues = validatePathDataForPublish(pathForValidation, {
        resolveItemTrainingPoints: createItemTpResolver(
          officialItems,
          codexEquipment,
          itemProperties
        ),
        trainingPointLimit: trainingPointLimitFromRecommendedAbilities(previewAbilities),
        archetypeType: form.type,
        powerProfStart: form.powerProfStart,
        martialProfStart: form.martialProfStart,
        isSubSkill: (skillId) => {
          const skill = skillById.get(String(skillId));
          if (!skill) return null;
          return isCodexSubSkill(skill);
        },
        resolveInnatePower: (powerId) => {
          const power = officialById.get(powerId);
          if (!power) return null;
          return snapshotOfficialPowerForInnate(power, powerPartsDb as PowerPart[]);
        },
      });
      const publishErrors = publishIssues.filter((i) => i.severity === 'error');
      if (publishErrors.length > 0) {
        showToast(publishErrors.map((i) => i.message).join(' '), 'error');
        return;
      }
      const publishWarnings = publishIssues.filter((i) => i.severity === 'warning');
      if (publishWarnings.length > 0) {
        showToast(
          `Layer 1 governance: ${publishWarnings.map((i) => i.message).join(' ')}`,
          'warning'
        );
      }
    }

    setSaving(true);
    const finalLevel1 = previewLevel1;
    const finalLevels = levelsOverride || (structuredPathData?.levels as Record<string, unknown>[] | undefined) || [];
    const existingLevel1 = previewExistingLevel1;
    const advancedGuidance =
      Array.isArray(finalLevel1.guidance_groups) && finalLevel1.guidance_groups.length > 0
        ? (finalLevel1.guidance_groups as PathGuidanceGroup[])
        : null;
    const preservedGuidanceGroups =
      advancedGuidance ?? (guidanceGroupsForSave.length > 0 ? guidanceGroupsForSave : null);
    const preservedRecommendedAbilities =
      recommendedAbilitiesValue ??
      existingLevel1?.recommended_abilities ??
      null;
    // Kits removed from live DB (TASK-442). Persist armorStep + recommended gear only.
    const preservedLoadouts = serializeLevel1LoadoutsField({
      armorStep: form.guidedArmorStep || undefined,
      sharedEquipment: form.guidedSharedEquipmentEntries.length
        ? form.guidedSharedEquipmentEntries
        : undefined,
    });

    const result = await saveArchetypeWithPath({
      ...(editing ? { id: editing.id } : {}),
      name: form.name.trim(),
      type: form.type,
      description: form.description.trim() || undefined,
      archetype_ability: form.archetypeAbility || undefined,
      secondary_ability: form.secondaryAbility || undefined,
      power_prof_start: form.powerProfStart,
      martial_prof_start: form.martialProfStart,
      power_prof_level5: form.powerProfLevel5,
      martial_prof_level5: form.martialProfLevel5,
      level1_feats: toCsv(finalLevel1.feats),
      level1_skills: toCsv(finalLevel1.skills),
      level1_powers: toCsv(finalLevel1.powers),
      level1_innate_powers: toCsv(finalLevel1.innatePowers),
      level1_techniques: toCsv(finalLevel1.techniques),
      level1_armaments: toCsv(finalLevel1.armaments),
      level1_equipment: toCsv(finalLevel1.equipment),
      level1_recommend_unarmed_prowess: finalLevel1.recommendUnarmedProwess === true,
      level1_remove_feats: toCsv(finalLevel1.removeFeats),
      level1_remove_powers: toCsv(finalLevel1.removePowers),
      level1_remove_techniques: toCsv(finalLevel1.removeTechniques),
      level1_remove_armaments: toCsv(finalLevel1.removeArmaments),
      level1_notes: typeof finalLevel1.notes === 'string' ? finalLevel1.notes : undefined,
      level1_guidance_groups: preservedGuidanceGroups,
      level1_recommended_abilities: preservedRecommendedAbilities,
      level1_loadouts: preservedLoadouts,
      levels: finalLevels.map((entry) => ({
        level: Number(entry.level || 0),
        feats: toCsv(entry.feats),
        skills: toCsv(entry.skills),
        powers: toCsv(entry.powers),
        techniques: toCsv(entry.techniques),
        armaments: toCsv(entry.armaments),
        equipment: toCsv(entry.equipment),
        remove_feats: toCsv(entry.removeFeats),
        remove_powers: toCsv(entry.removePowers),
        remove_techniques: toCsv(entry.removeTechniques),
        remove_armaments: toCsv(entry.removeArmaments),
        notes: typeof entry.notes === 'string' ? entry.notes : undefined,
      })),
    });

    setSaving(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['gameData', 'archetypes'] });
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['gameData', 'archetypes'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      closeModal();
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    const result = await deleteCodexDoc('codex_archetypes', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['gameData', 'archetypes'] });
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['gameData', 'archetypes'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      closeModal();
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
    }
  };

  const handleInlineDelete = async (id: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }
    const result = await deleteCodexDoc('codex_archetypes', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['gameData', 'archetypes'] });
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['gameData', 'archetypes'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
      setPendingDeleteId(null);
    }
  };

  if (error) return <ErrorState message="Failed to load archetypes" onRetry={() => { void refetch(); }} />;

  return (
    <div>
      <SectionHeader title="Archetypes" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search archetypes..." />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-surface">
          {filtered.map((a: ArchetypeItem) => (
            <div key={a.id} className="flex items-center border-t border-border first:border-t-0 hover:bg-surface-alt/50">
              <div className="flex-1 min-w-0">
                <GridListRow id={a.id} name={a.name || ''} description={(a as { description?: string }).description || ''} columns={[{ key: 'Type', value: formatListCellLabel(a.type) }]} />
              </div>
              <div className="flex items-center gap-1 pr-2">
                {pendingDeleteId === a.id ? (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-danger-700 dark:text-danger-400 font-medium whitespace-nowrap">Remove?</span>
                    <Button size="sm" variant="danger" onClick={() => handleInlineDelete(a.id)} className="text-xs px-2 py-0.5 h-6">Yes</Button>
                    <Button size="sm" variant="secondary" onClick={() => setPendingDeleteId(null)} className="text-xs px-2 py-0.5 h-6">No</Button>
                  </div>
                ) : (
                  <>
                    <IconButton variant="ghost" size="sm" onClick={() => openEdit(a)} label="Edit" aria-label="Edit">
                      <Pencil className="w-4 h-4" />
                    </IconButton>
                    <IconButton variant="ghost" size="sm" onClick={() => openDuplicate(a)} label="Duplicate" aria-label="Duplicate">
                      <Copy className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDeleteId(a.id)}
                      label="Delete"
                      className="text-danger-fg hover:opacity-80 hover:bg-transparent"
                    >
                      <X className="w-4 h-4" />
                    </IconButton>
                  </>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <EmptyState title="No archetypes found" description="Add one to get started." action={{ label: 'Add Archetype', onClick: openAdd }} size="sm" />
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Archetype' : 'Add Archetype'} size="full" fullScreenOnMobile
        footer={
          <div className="flex justify-between">
            <div>
              {editing && (
                <Button variant="outline" onClick={() => handleDelete(editing.id)} className={deleteConfirm === editing.id ? 'border-danger-500 text-danger-700 dark:text-danger-400' : ''}>
                  {deleteConfirm === editing.id ? 'Click again to confirm delete' : 'Delete'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim() || isSelectionDataLoading}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {copySourceName && (
            <p className="text-sm text-text-secondary rounded-md bg-surface-alt px-3 py-2 border border-border-light">
              Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>. Change the name and details as needed, then save to add the new archetype.
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Archetype name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => {
                const nextType = e.target.value as 'power' | 'powered-martial' | 'martial';
                setForm((f) => ({
                  ...f,
                  type: nextType,
                  level1Path:
                    nextType === 'martial'
                      ? { ...f.level1Path, innatePowers: [] }
                      : f.level1Path,
                }));
              }}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
              aria-label="Archetype type"
            >
              <option value="power">Power</option>
              <option value="powered-martial">Powered-Martial</option>
              <option value="martial">Martial</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Primary Ability</label>
              <select
                value={form.archetypeAbility}
                onChange={(e) => setForm((f) => ({ ...f, archetypeAbility: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                aria-label="Primary archetype ability"
              >
                <option value="">Not set</option>
                {ABILITY_OPTIONS.map((ability) => (
                  <option key={ability} value={ability}>
                    {ability.charAt(0).toUpperCase() + ability.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Secondary Ability</label>
              <select
                value={form.secondaryAbility}
                onChange={(e) => setForm((f) => ({ ...f, secondaryAbility: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                aria-label="Secondary archetype ability"
              >
                <option value="">Not set</option>
                {ABILITY_OPTIONS.map((ability) => (
                  <option key={ability} value={ability}>
                    {ability.charAt(0).toUpperCase() + ability.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Power Prof (Lv1)</label>
              <Input
                type="number"
                value={String(form.powerProfStart)}
                onChange={(e) => setForm((f) => ({ ...f, powerProfStart: Number(e.target.value || 0) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Martial Prof (Lv1)</label>
              <Input
                type="number"
                value={String(form.martialProfStart)}
                onChange={(e) => setForm((f) => ({ ...f, martialProfStart: Number(e.target.value || 0) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Power Prof (Lv5)</label>
              <Input
                type="number"
                value={String(form.powerProfLevel5)}
                onChange={(e) => setForm((f) => ({ ...f, powerProfLevel5: Number(e.target.value || 0) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Martial Prof (Lv5)</label>
              <Input
                type="number"
                value={String(form.martialProfLevel5)}
                onChange={(e) => setForm((f) => ({ ...f, martialProfLevel5: Number(e.target.value || 0) }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Archetype description" className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary" rows={3} />
          </div>
          <div className="rounded-lg border border-border-light p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Archetype Path Builder</h3>
              <p className="text-xs text-text-muted dark:text-text-secondary mt-1">
                Select existing codex and official library entries. No manual CSV input required.
              </p>
              {isSelectionDataLoading && (
                <p className="text-xs text-text-muted dark:text-text-secondary mt-1">
                  Loading official library options...
                </p>
              )}
            </div>

            <div className="rounded-md border border-border-light bg-surface-alt p-3 space-y-2">
              <h4 className="text-sm font-medium text-text-primary">Level 1 Recommendations</h4>
              <p className="text-xs text-text-muted dark:text-text-secondary">
                Only level 1 feats can be recommended at level 1. For each progression level, only feats with level requirement ≤ that level are shown.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectionFieldConfig
                  .filter((f) => {
                    // Level 1 feats → guidance group sections below (TASK-514).
                    if (f.key === 'feats' || f.key === 'armaments' || f.key === 'equipment') return false;
                    if (f.key === 'innatePowers' && form.type === 'martial') return false;
                    return true;
                  })
                  .map((field) => {
                  if (field.key === 'skills') {
                    const atCap =
                      form.level1Path.skills.length >= PATH_LEVEL1_MAX_BASE_SKILLS;
                    const skillOptionsForSelect = atCap
                      ? level1SkillPickerOptions.filter((o) =>
                          form.level1Path.skills.includes(o.value)
                        )
                      : level1SkillPickerOptions;
                    return (
                      <div key="level1-skills" className="space-y-1">
                        <ChipSelect
                          label={field.label}
                          placeholder={
                            atCap
                              ? `Maximum ${PATH_LEVEL1_MAX_BASE_SKILLS} skills (remove one to add)`
                              : field.placeholder
                          }
                          options={skillOptionsForSelect.map((option) => ({
                            value: option.value,
                            label: option.label,
                          }))}
                          selectedValues={form.level1Path.skills}
                          onSelect={(value) => {
                            if (
                              form.level1Path.skills.length >= PATH_LEVEL1_MAX_BASE_SKILLS
                            ) {
                              showToast(
                                `Paths recommend at most ${PATH_LEVEL1_MAX_BASE_SKILLS} base skills. Remove one before adding another.`,
                                'warning'
                              );
                              return;
                            }
                            const skill = skillById.get(value);
                            if (skill && isCodexSubSkill(skill)) {
                              showToast(
                                'Sub-skills cannot be newly selected. Choose a base skill.',
                                'warning'
                              );
                              return;
                            }
                            setForm((prev) => ({
                              ...prev,
                              level1Path: {
                                ...prev.level1Path,
                                skills: dedupeStrings([...prev.level1Path.skills, value]),
                              },
                            }));
                          }}
                          onRemove={(value) =>
                            setForm((prev) => ({
                              ...prev,
                              level1Path: {
                                ...prev.level1Path,
                                skills: prev.level1Path.skills.filter((entry) => entry !== value),
                              },
                            }))
                          }
                        />
                        <p className="text-xs text-text-muted dark:text-text-secondary">
                          Base skills only; target max {PATH_LEVEL1_MAX_BASE_SKILLS}. Legacy paths
                          with more than {PATH_LEVEL1_MAX_BASE_SKILLS} or sub-skills can still be
                          saved (warning only).
                        </p>
                        {level1SkillIssues.length > 0 && (
                          <p
                            role="status"
                            className="text-xs text-warning-fg"
                          >
                            {level1SkillIssues.map((i) => i.message).join(' ')}
                          </p>
                        )}
                      </div>
                    );
                  }
                  const options = field.key === 'feats' ? featOptionsLevel1 : optionsByField[field.key];
                  return (
                  <ChipSelect
                    key={`level1-${field.key}`}
                    label={field.label}
                    placeholder={field.placeholder}
                    options={options.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    selectedValues={form.level1Path[field.key]}
                    onSelect={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        level1Path: {
                          ...prev.level1Path,
                          [field.key]: dedupeStrings([...prev.level1Path[field.key], value]),
                        },
                      }))
                    }
                    onRemove={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        level1Path: {
                          ...prev.level1Path,
                          [field.key]: prev.level1Path[field.key].filter((entry) => entry !== value),
                        },
                      }))
                    }
                  />
                  );
                })}
              </div>
              {form.type !== 'martial' && (
                <p className="text-xs text-text-muted dark:text-text-secondary">
                  Innate Powers are separate from Powers. Save validates Appendix G: Energy ≤ Innate
                  Threshold, Basic/Basic Reaction only, no healing or energy-gain parts, and total Energy
                  ≤ Innate Energy (Power 16 / Powered-Martial 6 at level 1).
                </p>
              )}

              {/* Level 1 feat guidance groups — character vs archetype (TASK-514 / ADR-0004) */}
              <div className="space-y-4 pt-3 border-t border-border-light">
                <div>
                  <h5 className="text-sm font-medium text-text-primary">Feat guidance groups</h5>
                  <p className="text-xs text-text-muted dark:text-text-secondary mt-0.5">
                    Name each group, add a short why, then pick feats. Expand a selected feat to read its
                    Codex description. Flat Level 1 feats sync to the union of these picks on save. Max{' '}
                    {LAYER1_GOVERNANCE.maxGroupsPerStep} groups per audience; max{' '}
                    {LAYER1_GOVERNANCE.maxItemsPerGroup} feats per group.
                  </p>
                </div>

                {(
                  [
                    {
                      audience: 'character' as const,
                      label: 'Character feat groups',
                      groups: characterFeatGroups,
                      options: characterFeatOptionsLevel1,
                    },
                    {
                      audience: 'archetype' as const,
                      label: 'Archetype feat groups',
                      groups: archetypeFeatGroups,
                      options: archetypeFeatOptionsLevel1,
                    },
                  ] as const
                ).map((section) => (
                  <div key={section.audience} className="space-y-3 rounded-md border border-border-light p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h6 className="text-sm font-medium text-text-secondary">{section.label}</h6>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-[44px]"
                        onClick={() => addFeatGuidanceGroup(section.audience)}
                        aria-label={`Add ${section.audience} feat group`}
                      >
                        <Plus className="w-4 h-4 mr-1" aria-hidden />
                        Add group
                      </Button>
                    </div>
                    {section.groups.length === 0 ? (
                      <p className="text-xs text-text-muted dark:text-text-secondary">
                        No {section.audience} feat groups yet.
                      </p>
                    ) : (
                      section.groups.map((group) => {
                        const whyLen = group.why?.length ?? 0;
                        const selectedFeatIds = group.feats ?? [];
                        const atFeatCap =
                          selectedFeatIds.length >= LAYER1_GOVERNANCE.maxItemsPerGroup;
                        return (
                          <div
                            key={group.id}
                            className="space-y-3 rounded-md border border-border-light bg-surface-alt/40 p-3"
                          >
                            <div className="flex items-end gap-2">
                              <div className="flex-1 min-w-0">
                                <label
                                  htmlFor={`gg-title-${group.id}`}
                                  className="block text-xs font-medium text-text-secondary mb-1"
                                >
                                  Group name
                                </label>
                                <Input
                                  id={`gg-title-${group.id}`}
                                  value={group.title}
                                  onChange={(e) =>
                                    updateFeatGuidanceGroup(group.id, { title: e.target.value })
                                  }
                                  placeholder="Group name"
                                  className="min-h-[44px]"
                                />
                              </div>
                              <IconButton
                                variant="ghost"
                                size="sm"
                                className="shrink-0 min-h-[44px] min-w-[44px]"
                                onClick={() => removeFeatGuidanceGroup(group.id)}
                                label={`Remove ${group.title || section.audience} feat group`}
                              >
                                <X className="w-4 h-4" />
                              </IconButton>
                            </div>
                            <div>
                              <label
                                htmlFor={`gg-why-${group.id}`}
                                className="block text-xs font-medium text-text-secondary mb-1"
                              >
                                Why (optional, max {LAYER1_GOVERNANCE.maxWhyCopyLength})
                              </label>
                              <Input
                                id={`gg-why-${group.id}`}
                                value={group.why ?? ''}
                                onChange={(e) =>
                                  updateFeatGuidanceGroup(group.id, {
                                    why: e.target.value.slice(0, LAYER1_GOVERNANCE.maxWhyCopyLength),
                                  })
                                }
                                placeholder="One-line why this group fits the path"
                                className="min-h-[44px]"
                              />
                              {whyLen > LAYER1_GOVERNANCE.maxWhyCopyLength - 20 && (
                                <p className="text-xs text-text-muted dark:text-text-secondary mt-0.5">
                                  {whyLen}/{LAYER1_GOVERNANCE.maxWhyCopyLength}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <ChipSelect
                                label="Add feats"
                                placeholder={
                                  atFeatCap
                                    ? `Max ${LAYER1_GOVERNANCE.maxItemsPerGroup} feats`
                                    : 'Select a feat to add'
                                }
                                options={section.options
                                  .filter((o) => !selectedFeatIds.includes(o.value))
                                  .map((o) => ({ value: o.value, label: o.label }))}
                                selectedValues={[]}
                                onSelect={(value) => {
                                  if (selectedFeatIds.length >= LAYER1_GOVERNANCE.maxItemsPerGroup) {
                                    showToast(
                                      `Max ${LAYER1_GOVERNANCE.maxItemsPerGroup} feats per group.`,
                                      'warning'
                                    );
                                    return;
                                  }
                                  updateFeatGuidanceGroup(group.id, {
                                    feats: dedupeStrings([...selectedFeatIds, value]),
                                  });
                                }}
                              />
                              <SelectedFeatRows
                                featIds={selectedFeatIds}
                                featById={featById}
                                onRemove={(value) =>
                                  updateFeatGuidanceGroup(group.id, {
                                    feats: selectedFeatIds.filter((id) => id !== value),
                                  })
                                }
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ))}
                {syncedFeatPreviewLabels.length > 0 && (
                  <p className="text-xs text-text-secondary">
                    Synced Level 1 feats (union): {syncedFeatPreviewLabels.join(', ')}
                  </p>
                )}
              </div>

              {/* Level 1: Armaments (weapon/shield vs armor) & Equipment with quantity */}
              <div className="space-y-4 pt-3 border-t border-border-light">
                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-text-secondary">
                      Armaments (recommended qty)
                    </h5>
                    <p className="text-xs text-text-muted dark:text-text-secondary mt-0.5">
                      Split like guided loadout (weapons/shields vs armor). Stored as one
                      level-1 armaments list.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <ChipSelect
                        label="Weapons & shields"
                        placeholder="Select weapon or shield"
                        options={weaponShieldArmamentOptions
                          .filter(
                            (o) =>
                              !form.level1Path.armamentEntries.some((e) => e.id === o.value)
                          )
                          .map((o) => ({ value: o.value, label: o.label }))}
                        selectedValues={[]}
                        onSelect={addLevel1Armament}
                      />
                      <div className="space-y-2">
                        {level1WeaponShieldEntries.map((entry) => {
                          const label =
                            armamentOptions.find((o) => o.value === entry.id)?.label ??
                            entry.id;
                          return (
                            <PathQuantityRow
                              key={`weapon-${entry.id}`}
                              label={label}
                              quantity={entry.quantity}
                              onQuantityChange={(q) => updateLevel1ArmamentQty(entry.id, q)}
                              onRemove={() => removeLevel1Armament(entry.id)}
                              removeLabel={`Remove ${label}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <ChipSelect
                        label="Armor"
                        placeholder="Select armor"
                        options={armorArmamentOptions
                          .filter(
                            (o) =>
                              !form.level1Path.armamentEntries.some((e) => e.id === o.value)
                          )
                          .map((o) => ({ value: o.value, label: o.label }))}
                        selectedValues={[]}
                        onSelect={addLevel1Armament}
                      />
                      <div className="space-y-2">
                        {level1ArmorEntries.map((entry) => {
                          const label =
                            armamentOptions.find((o) => o.value === entry.id)?.label ??
                            entry.id;
                          return (
                            <PathQuantityRow
                              key={`armor-${entry.id}`}
                              label={label}
                              quantity={entry.quantity}
                              onQuantityChange={(q) => updateLevel1ArmamentQty(entry.id, q)}
                              onRemove={() => removeLevel1Armament(entry.id)}
                              removeLabel={`Remove ${label}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <ChipSelect
                    label="Equipment (recommended qty)"
                    placeholder="Select equipment"
                    options={equipmentOptions
                      .filter(
                        (o) => !form.level1Path.equipmentEntries.some((e) => e.id === o.value)
                      )
                      .map((o) => ({ value: o.value, label: o.label }))}
                    selectedValues={[]}
                    onSelect={(value) => {
                      if (form.level1Path.equipmentEntries.some((e) => e.id === value)) return;
                      setForm((prev) => ({
                        ...prev,
                        level1Path: {
                          ...prev.level1Path,
                          equipmentEntries: [
                            ...prev.level1Path.equipmentEntries,
                            { id: value, quantity: 1 },
                          ],
                        },
                      }));
                    }}
                  />
                  <div className="space-y-2">
                    {form.level1Path.equipmentEntries.map((entry, idx) => {
                      const label =
                        equipmentOptions.find((o) => o.value === entry.id)?.label ?? entry.id;
                      return (
                        <PathQuantityRow
                          key={`${entry.id}-${idx}`}
                          label={label}
                          quantity={entry.quantity}
                          onQuantityChange={(q) =>
                            setForm((prev) => ({
                              ...prev,
                              level1Path: {
                                ...prev.level1Path,
                                equipmentEntries: prev.level1Path.equipmentEntries.map((e, i) =>
                                  i === idx ? { ...e, quantity: q } : e
                                ),
                              },
                            }))
                          }
                          onRemove={() =>
                            setForm((prev) => ({
                              ...prev,
                              level1Path: {
                                ...prev.level1Path,
                                equipmentEntries: prev.level1Path.equipmentEntries.filter(
                                  (_, i) => i !== idx
                                ),
                              },
                            }))
                          }
                          removeLabel={`Remove ${label}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={form.level1Path.recommendUnarmedProwess}
                  onChange={(e) => setForm((prev) => ({
                    ...prev,
                    level1Path: { ...prev.level1Path, recommendUnarmedProwess: e.target.checked },
                  }))}
                  className="rounded border-border"
                  aria-describedby="unarmed-prowess-desc"
                />
                <span className="text-sm font-medium text-text-primary">Recommend Unarmed Prowess</span>
              </label>
              <p id="unarmed-prowess-desc" className="text-xs text-text-muted dark:text-text-secondary mt-0.5">
                When enabled, the equipment step (choose a path) will show Unarmed Prowess in the simplified view so the player can add it.
              </p>
              <Input
                value={form.level1Path.notes}
                onChange={(e) => setForm((f) => ({ ...f, level1Path: { ...f.level1Path, notes: e.target.value } }))}
                placeholder="Level 1 notes (optional)"
                aria-label="Level 1 path notes"
              />
            </div>

            <div className="space-y-3 rounded-md border border-border-light p-3">
              <h4 className="text-sm font-medium text-text-primary">Guided creator (Simple)</h4>
              <p className="text-xs text-text-muted dark:text-text-secondary">
                Powers the guided character creator: recommended abilities and phased equipment picks.
              </p>
              <div>
                <label htmlFor="guided-armor-step" className="block text-sm font-medium text-text-secondary mb-1">
                  Armor step (guided loadout)
                </label>
                <select
                  id="guided-armor-step"
                  value={form.guidedArmorStep}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      guidedArmorStep: e.target.value as Level1ArmorStep | '',
                    }))
                  }
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                  aria-describedby="guided-armor-step-desc"
                >
                  <option value="">Default (power → none; martial → required)</option>
                  <option value="required">Required: armor phase mandatory</option>
                  <option value="optional">Optional: player may skip armor</option>
                  <option value="none">None: skip armor phase</option>
                </select>
                <p id="guided-armor-step-desc" className="mt-1 text-xs text-text-muted dark:text-text-secondary">
                  Controls whether the guided loadout step includes an armor sub-phase.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Recommended adventuring gear
                </label>
                <ChipSelect
                  label="Add recommended gear item"
                  placeholder="Select recommended equipment"
                  options={equipmentOptions}
                  selectedValues={[]}
                  onSelect={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      guidedSharedEquipmentEntries: [
                        ...prev.guidedSharedEquipmentEntries,
                        { id: value, quantity: 1 },
                      ],
                    }))
                  }
                />
                <div className="space-y-2 mt-1">
                  {form.guidedSharedEquipmentEntries.map((entry, idx) => {
                    const label =
                      equipmentOptions.find((o) => o.value === entry.id)?.label ?? entry.id;
                    return (
                      <PathQuantityRow
                        key={`${entry.id}-${idx}`}
                        label={label}
                        quantity={entry.quantity}
                        onQuantityChange={(q) =>
                          setForm((prev) => ({
                            ...prev,
                            guidedSharedEquipmentEntries: prev.guidedSharedEquipmentEntries.map(
                              (item, i) => (i === idx ? { ...item, quantity: q } : item)
                            ),
                          }))
                        }
                        onRemove={() =>
                          setForm((prev) => ({
                            ...prev,
                            guidedSharedEquipmentEntries: prev.guidedSharedEquipmentEntries.filter(
                              (_, i) => i !== idx
                            ),
                          }))
                        }
                        removeLabel={`Remove recommended gear ${label}`}
                      />
                    );
                  })}
                </div>
              </div>
              <div
                role="group"
                aria-labelledby="guided-recommended-abilities-label"
                aria-describedby="guided-recommended-abilities-desc"
              >
                <span
                  id="guided-recommended-abilities-label"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  Recommended abilities
                </span>
                <p id="guided-recommended-abilities-desc" className="text-xs text-text-muted dark:text-text-secondary mb-2">
                  Suggested level 1 ability spread applied in one click during guided creation. Leave all at
                  0 to skip the recommendation.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ABILITY_OPTIONS.map((ability) => {
                    const value = form.guidedRecommendedAbilities[ability] ?? 0;
                    const abilityLabel = labelForAbility(ability);
                    return (
                      <div
                        key={`rec-ability-${ability}`}
                        className="flex items-center justify-between gap-2 rounded-md border border-border-light bg-surface px-3 py-2"
                      >
                        <span className="text-sm font-medium text-text-primary">{abilityLabel}</span>
                        <ValueStepper
                          value={value}
                          min={0}
                          max={RECOMMENDED_ABILITY_MAX}
                          formatValue={(v) => `+${v}`}
                          decrementTitle={`Decrease recommended ${abilityLabel}`}
                          incrementTitle={`Increase recommended ${abilityLabel}`}
                          onChange={(next) =>
                            setForm((f) => ({
                              ...f,
                              guidedRecommendedAbilities: { ...f.guidedRecommendedAbilities, [ability]: next },
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-text-primary">Level Progression (2+)</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      levelPathRows: [...f.levelPathRows, makeLevelRow(Math.max(2, ...f.levelPathRows.map((row) => row.level)) + 1)],
                    }))
                  }
                >
                  Add Level
                </Button>
              </div>

              {form.levelPathRows.map((row) => (
                <div key={row.rowId} className="rounded-md border border-border-light p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-text-secondary">Level</label>
                      <Input
                        type="number"
                        value={String(row.level)}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            levelPathRows: f.levelPathRows.map((candidate) =>
                              candidate.rowId === row.rowId ? { ...candidate, level: Number(e.target.value || 2) } : candidate
                            ),
                          }))
                        }
                        className="w-20"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          levelPathRows: f.levelPathRows.length > 1 ? f.levelPathRows.filter((candidate) => candidate.rowId !== row.rowId) : [makeLevelRow(2)],
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectionFieldConfig.map((field) => {
                      const isFeatField = field.key === 'feats';
                      const options = isFeatField
                        ? getFeatOptionsForLevel(row.level)
                        : optionsByField[field.key];
                      const selected = row[field.key];
                      if (isFeatField) {
                        return (
                          <div key={`${row.rowId}-${field.key}`} className="space-y-2">
                            <ChipSelect
                              label={`Add ${field.label}`}
                              placeholder={field.placeholder}
                              options={options
                                .filter((option) => !selected.includes(option.value))
                                .map((option) => ({
                                  value: option.value,
                                  label: option.label,
                                }))}
                              selectedValues={[]}
                              onSelect={(value) =>
                                setForm((f) => ({
                                  ...f,
                                  levelPathRows: f.levelPathRows.map((candidate) =>
                                    candidate.rowId === row.rowId
                                      ? {
                                          ...candidate,
                                          [field.key]: dedupeStrings([
                                            ...candidate[field.key],
                                            value,
                                          ]),
                                        }
                                      : candidate
                                  ),
                                }))
                              }
                            />
                            <SelectedFeatRows
                              featIds={selected}
                              featById={featById}
                              onRemove={(value) =>
                                setForm((f) => ({
                                  ...f,
                                  levelPathRows: f.levelPathRows.map((candidate) =>
                                    candidate.rowId === row.rowId
                                      ? {
                                          ...candidate,
                                          [field.key]: candidate[field.key].filter(
                                            (entry) => entry !== value
                                          ),
                                        }
                                      : candidate
                                  ),
                                }))
                              }
                            />
                          </div>
                        );
                      }
                      return (
                        <ChipSelect
                          key={`${row.rowId}-${field.key}`}
                          label={`Add ${field.label}`}
                          placeholder={field.placeholder}
                          options={options.map((option) => ({
                            value: option.value,
                            label: option.label,
                          }))}
                          selectedValues={selected}
                          onSelect={(value) =>
                            setForm((f) => ({
                              ...f,
                              levelPathRows: f.levelPathRows.map((candidate) =>
                                candidate.rowId === row.rowId
                                  ? {
                                      ...candidate,
                                      [field.key]: dedupeStrings([
                                        ...candidate[field.key],
                                        value,
                                      ]),
                                    }
                                  : candidate
                              ),
                            }))
                          }
                          onRemove={(value) =>
                            setForm((f) => ({
                              ...f,
                              levelPathRows: f.levelPathRows.map((candidate) =>
                                candidate.rowId === row.rowId
                                  ? {
                                      ...candidate,
                                      [field.key]: candidate[field.key].filter(
                                        (entry) => entry !== value
                                      ),
                                    }
                                  : candidate
                              ),
                            }))
                          }
                        />
                      );
                    })}
                    {removeFieldConfig.map((field) => {
                      const isFeatField = field.key === 'removeFeats';
                      const options = isFeatField
                        ? getFeatOptionsForLevel(row.level)
                        : optionsByField[field.key];
                      const selected = row[field.key];
                      if (isFeatField) {
                        return (
                          <div key={`${row.rowId}-${field.key}`} className="space-y-2">
                            <ChipSelect
                              label={field.label}
                              placeholder={field.placeholder}
                              options={options
                                .filter((option) => !selected.includes(option.value))
                                .map((option) => ({
                                  value: option.value,
                                  label: option.label,
                                }))}
                              selectedValues={[]}
                              onSelect={(value) =>
                                setForm((f) => ({
                                  ...f,
                                  levelPathRows: f.levelPathRows.map((candidate) =>
                                    candidate.rowId === row.rowId
                                      ? {
                                          ...candidate,
                                          [field.key]: dedupeStrings([
                                            ...candidate[field.key],
                                            value,
                                          ]),
                                        }
                                      : candidate
                                  ),
                                }))
                              }
                            />
                            <SelectedFeatRows
                              featIds={selected}
                              featById={featById}
                              onRemove={(value) =>
                                setForm((f) => ({
                                  ...f,
                                  levelPathRows: f.levelPathRows.map((candidate) =>
                                    candidate.rowId === row.rowId
                                      ? {
                                          ...candidate,
                                          [field.key]: candidate[field.key].filter(
                                            (entry) => entry !== value
                                          ),
                                        }
                                      : candidate
                                  ),
                                }))
                              }
                            />
                          </div>
                        );
                      }
                      return (
                        <ChipSelect
                          key={`${row.rowId}-${field.key}`}
                          label={field.label}
                          placeholder={field.placeholder}
                          options={options.map((option) => ({
                            value: option.value,
                            label: option.label,
                          }))}
                          selectedValues={selected}
                          onSelect={(value) =>
                            setForm((f) => ({
                              ...f,
                              levelPathRows: f.levelPathRows.map((candidate) =>
                                candidate.rowId === row.rowId
                                  ? {
                                      ...candidate,
                                      [field.key]: dedupeStrings([
                                        ...candidate[field.key],
                                        value,
                                      ]),
                                    }
                                  : candidate
                              ),
                            }))
                          }
                          onRemove={(value) =>
                            setForm((f) => ({
                              ...f,
                              levelPathRows: f.levelPathRows.map((candidate) =>
                                candidate.rowId === row.rowId
                                  ? {
                                      ...candidate,
                                      [field.key]: candidate[field.key].filter(
                                        (entry) => entry !== value
                                      ),
                                    }
                                  : candidate
                              ),
                            }))
                          }
                        />
                      );
                    })}
                  </div>
                  <Input
                    value={row.notes}
                    onChange={(e) => setForm((f) => ({ ...f, levelPathRows: f.levelPathRows.map((candidate) => candidate.rowId === row.rowId ? { ...candidate, notes: e.target.value } : candidate) }))}
                    placeholder="Level notes (optional)"
                    aria-label={`Notes for level ${row.level}`}
                  />
                </div>
              ))}
            </div>

            <div>
              <label
                htmlFor="admin-archetype-advanced-path-json"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Advanced Path JSON Override (optional)
              </label>
              <textarea
                id="admin-archetype-advanced-path-json"
                value={form.advancedPathJson}
                onChange={(e) => setForm((f) => ({ ...f, advancedPathJson: e.target.value }))}
                placeholder="Optional: paste full path_data JSON to override builder output."
                className="w-full min-h-[120px] px-3 py-2 rounded-md border border-border bg-background text-text-primary font-mono text-xs"
                rows={6}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
