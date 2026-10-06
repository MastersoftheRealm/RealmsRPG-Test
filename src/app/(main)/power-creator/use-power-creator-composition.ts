/**
 * Power Creator — built-in variants state (ADR-0029).
 * The workspace's field state is always the open tab; other tabs are stored here and
 * swapped in on tab change.
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import type { PowerPart } from '@/hooks';
import {
  POWER_RANDOMIZE_DIE_SIDES,
  normalizePowerComposition,
  type PowerComposition,
  type PowerCompositionStructure,
} from '@/lib/calculators';
import {
  REVERSE_TAB_ID,
  SHARED_TAB_ID,
  buildCompositionPayload,
  diffAgainstShared,
  emptyTabForm,
  isOverlayFieldForced,
  mergeOverlayIntoShared,
  nextVariantId,
  nextVariantLabel,
  defaultVariantTabs,
  setOverlayField,
  specToTabForm,
  spreadDieFaces,
  type CollectedCompositionForms,
  type OverlayFieldKey,
  type OverlayFlagMap,
  type PowerTabForm,
  type PowerVariantTab,
} from './power-creator-composition';

type StoredTabs = {
  shared: PowerTabForm;
  variants: PowerVariantTab[];
  reverse: PowerTabForm;
};

type CompositionInit = {
  structure: PowerCompositionStructure;
  reverseEnabled: boolean;
  stored: StoredTabs;
  activeTabId: string;
  dieSides: number;
  dieFaces: string[];
};

const DEFAULT_DIE_SIDES = 4;

function tabIdsFor(
  structure: PowerCompositionStructure,
  reverseEnabled: boolean,
  variants: PowerVariantTab[],
): string[] {
  const ids: string[] = [];
  if (structure !== 'alternate') ids.push(SHARED_TAB_ID);
  if (structure !== 'none') ids.push(...variants.map((v) => v.id));
  if (reverseEnabled) ids.push(REVERSE_TAB_ID);
  return ids;
}

/** Initial variant tabs from a loaded / cached `composition`. */
export function compositionInitFromSaved(
  raw: PowerComposition | null | undefined,
  topForm: PowerTabForm,
  powerParts: PowerPart[],
): CompositionInit {
  const composition = normalizePowerComposition(raw);
  if (!composition) {
    return {
      structure: 'none',
      reverseEnabled: false,
      stored: { shared: topForm, variants: [], reverse: emptyTabForm() },
      activeTabId: SHARED_TAB_ID,
      dieSides: DEFAULT_DIE_SIDES,
      dieFaces: [],
    };
  }
  const variants: PowerVariantTab[] = composition.variants.map((v) => ({
    id: v.id,
    label: v.label,
    polarity: v.polarity ?? 'positive',
    description: v.description ?? '',
    form: specToTabForm(v, powerParts),
  }));
  const reverseEnabled = !!composition.reverse;
  const ids = tabIdsFor(composition.structure, reverseEnabled, variants);
  const firstVariant = variants[0];
  // Alternate: the live fields are variant 1 (top-level mirrors it).
  if (composition.structure === 'alternate' && firstVariant) firstVariant.form = topForm;
  return {
    structure: composition.structure,
    reverseEnabled,
    stored: {
      shared: topForm,
      variants,
      reverse: composition.reverse
        ? specToTabForm(composition.reverse, powerParts)
        : emptyTabForm(),
    },
    activeTabId: ids[0] ?? SHARED_TAB_ID,
    dieSides: composition.die?.sides ?? DEFAULT_DIE_SIDES,
    dieFaces: composition.die?.faces ?? [],
  };
}

type UsePowerCreatorCompositionArgs = {
  init: CompositionInit;
  liveForm: PowerTabForm;
  applyTabForm: (form: PowerTabForm) => void;
};

export function usePowerCreatorComposition({
  init,
  liveForm,
  applyTabForm,
}: UsePowerCreatorCompositionArgs) {
  const [structure, setStructureState] = useState<PowerCompositionStructure>(init.structure);
  const [reverseEnabled, setReverseEnabledState] = useState(init.reverseEnabled);
  const [stored, setStored] = useState<StoredTabs>(init.stored);
  const [activeTabId, setActiveTabId] = useState(init.activeTabId);
  const [dieSides, setDieSidesState] = useState(init.dieSides);
  const [dieFaces, setDieFaces] = useState<string[]>(init.dieFaces);
  const [overlayByTab, setOverlayByTab] = useState<OverlayFlagMap>({});

  const collected: CollectedCompositionForms = useMemo(
    () => ({
      structure,
      reverseEnabled,
      shared: activeTabId === SHARED_TAB_ID ? liveForm : stored.shared,
      variants: stored.variants.map((v) => (v.id === activeTabId ? { ...v, form: liveForm } : v)),
      reverse: activeTabId === REVERSE_TAB_ID ? liveForm : stored.reverse,
      dieSides,
      dieFaces: Array.from({ length: dieSides }, (_, i) => dieFaces[i] ?? ''),
    }),
    [structure, reverseEnabled, activeTabId, liveForm, stored, dieSides, dieFaces],
  );

  const composition = useMemo(() => buildCompositionPayload(collected), [collected]);

  const tabIds = useMemo(
    () => tabIdsFor(structure, reverseEnabled, stored.variants),
    [structure, reverseEnabled, stored.variants],
  );

  const readTab = useCallback((src: CollectedCompositionForms, tabId: string): PowerTabForm => {
    if (tabId === SHARED_TAB_ID) return src.shared;
    if (tabId === REVERSE_TAB_ID) return src.reverse;
    return src.variants.find((v) => v.id === tabId)?.form ?? emptyTabForm();
  }, []);

  const commit = useCallback(
    (next: StoredTabs, nextActive: string, src: CollectedCompositionForms) => {
      setStored(next);
      applyTabForm(
        readTab(
          { ...src, shared: next.shared, variants: next.variants, reverse: next.reverse },
          nextActive,
        ),
      );
      setActiveTabId(nextActive);
    },
    [applyTabForm, readTab],
  );

  const switchTab = useCallback(
    (tabId: string) => {
      if (tabId === activeTabId) return;
      const src = collected;
      commit({ shared: src.shared, variants: src.variants, reverse: src.reverse }, tabId, src);
    },
    [activeTabId, collected, commit],
  );

  const setStructure = useCallback(
    (next: PowerCompositionStructure) => {
      if (next === structure) return;
      const src = collected;
      let shared = src.shared;
      let variants = src.variants;
      const wasAlternate = structure === 'alternate';
      const isAlternate = next === 'alternate';
      if (isAlternate && !wasAlternate) {
        variants =
          variants.length === 0
            ? defaultVariantTabs(shared, true)
            : variants.map((v) => ({ ...v, form: mergeOverlayIntoShared(shared, v.form) }));
      } else if (wasAlternate && !isAlternate) {
        shared = variants[0]?.form ?? shared;
        if (next !== 'none') {
          variants = variants.map((v) => ({ ...v, form: diffAgainstShared(shared, v.form) }));
        }
      }
      if (next !== 'none' && variants.length === 0) {
        variants = defaultVariantTabs(shared, false);
      }
      if (next === 'randomize' && dieFaces.every((f) => !f)) {
        setDieFaces(spreadDieFaces(dieSides, variants));
      }
      setStructureState(next);
      const first = tabIdsFor(next, reverseEnabled, variants)[0] ?? SHARED_TAB_ID;
      commit({ shared, variants, reverse: src.reverse }, first, src);
    },
    [structure, collected, dieFaces, dieSides, reverseEnabled, commit],
  );

  const setReverseEnabled = useCallback(
    (on: boolean) => {
      setReverseEnabledState(on);
      if (!on && activeTabId === REVERSE_TAB_ID) {
        const src = collected;
        const first = tabIdsFor(structure, false, src.variants)[0] ?? SHARED_TAB_ID;
        commit({ shared: src.shared, variants: src.variants, reverse: src.reverse }, first, src);
      }
    },
    [activeTabId, collected, structure, commit],
  );

  const addVariant = useCallback(() => {
    const src = collected;
    const base =
      structure === 'alternate'
        ? (src.variants.find((v) => v.id === activeTabId)?.form ??
          src.variants[0]?.form ??
          src.shared)
        : emptyTabForm();
    const tab: PowerVariantTab = {
      id: nextVariantId(src.variants),
      label: nextVariantLabel(src.variants),
      polarity: 'positive',
      description: '',
      form: base,
    };
    commit(
      { shared: src.shared, variants: [...src.variants, tab], reverse: src.reverse },
      tab.id,
      src,
    );
  }, [collected, structure, activeTabId, commit]);

  const removeVariant = useCallback(
    (id: string) => {
      const src = collected;
      const variants = src.variants.filter((v) => v.id !== id);
      setDieFaces((prev) => prev.map((f) => (f === id ? '' : f)));
      const nextActive =
        activeTabId === id
          ? (tabIdsFor(structure, reverseEnabled, variants)[0] ?? SHARED_TAB_ID)
          : activeTabId;
      commit({ shared: src.shared, variants, reverse: src.reverse }, nextActive, src);
    },
    [collected, activeTabId, structure, reverseEnabled, commit],
  );

  const updateVariantMeta = useCallback(
    (id: string, patch: Partial<Pick<PowerVariantTab, 'label' | 'polarity' | 'description'>>) => {
      setStored((prev) => ({
        ...prev,
        variants: prev.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)),
      }));
    },
    [],
  );

  const setDieSides = useCallback((sides: number) => {
    if (!(POWER_RANDOMIZE_DIE_SIDES as readonly number[]).includes(sides)) return;
    setDieSidesState(sides);
    setDieFaces((prev) => Array.from({ length: sides }, (_, i) => prev[i] ?? ''));
  }, []);

  const setDieFace = useCallback((index: number, variantId: string) => {
    setDieFaces((prev) => {
      const next = [...prev];
      next[index] = variantId;
      return next;
    });
  }, []);

  const spreadFaces = useCallback(() => {
    setDieFaces(spreadDieFaces(dieSides, stored.variants));
  }, [dieSides, stored.variants]);

  const loadFromSaved = useCallback((next: CompositionInit) => {
    setStructureState(next.structure);
    setReverseEnabledState(next.reverseEnabled);
    setStored(next.stored);
    setActiveTabId(next.activeTabId);
    setDieSidesState(next.dieSides);
    setDieFaces(next.dieFaces);
    setOverlayByTab({});
  }, []);

  const reset = useCallback(() => {
    loadFromSaved({
      structure: 'none',
      reverseEnabled: false,
      stored: { shared: emptyTabForm(), variants: [], reverse: emptyTabForm() },
      activeTabId: SHARED_TAB_ID,
      dieSides: DEFAULT_DIE_SIDES,
      dieFaces: [],
    });
  }, [loadFromSaved]);

  const activeVariant = stored.variants.find((v) => v.id === activeTabId) ?? null;

  const markFieldOverridden = useCallback((tabId: string, field: OverlayFieldKey) => {
    setOverlayByTab((prev) => setOverlayField(prev, tabId, field, true));
  }, []);

  const clearFieldOverridden = useCallback((tabId: string, field: OverlayFieldKey) => {
    setOverlayByTab((prev) => setOverlayField(prev, tabId, field, false));
  }, []);

  const isFieldForcedOverride = useCallback(
    (tabId: string, field: OverlayFieldKey) => isOverlayFieldForced(overlayByTab, tabId, field),
    [overlayByTab],
  );

  return {
    structure,
    setStructure,
    reverseEnabled,
    setReverseEnabled,
    activeTabId,
    switchTab,
    tabIds,
    variants: stored.variants,
    activeVariant,
    addVariant,
    removeVariant,
    updateVariantMeta,
    dieSides,
    setDieSides,
    dieFaces: collected.dieFaces,
    setDieFace,
    spreadFaces,
    collected,
    composition,
    markFieldOverridden,
    clearFieldOverridden,
    isFieldForcedOverride,
    loadFromSaved,
    reset,
  };
}

export type PowerCreatorCompositionState = ReturnType<typeof usePowerCreatorComposition>;
