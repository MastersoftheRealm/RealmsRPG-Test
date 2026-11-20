/** @vitest-environment happy-dom */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  CharacterAutosaveBaselineProvider,
  useAdvanceCharacterAutosaveBaseline,
  useRegisterCharacterAutosaveBaseline,
} from './character-autosave-baseline-context';

const HEALTH_ROW = '10000000-0000-4000-8000-000000000001';

function useBaselineHarness(characterId: string, initial: Record<string, unknown>) {
  const ref = React.useRef<Record<string, unknown> | null>(initial);
  useRegisterCharacterAutosaveBaseline(characterId, ref);
  const advance = useAdvanceCharacterAutosaveBaseline();
  return { ref, advance };
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <CharacterAutosaveBaselineProvider>{children}</CharacterAutosaveBaselineProvider>;
}

describe('CharacterAutosaveBaselineProvider', () => {
  it('does not restore a persisted baseline snapshot on remount', () => {
    const initial = {
      notes: 'start',
      equipment: { items: [{ id: 'health-potion', name: 'Health Potion', quantity: 3 }] },
    };

    const { result: first, unmount } = renderHook(
      () => useBaselineHarness('c1', structuredClone(initial) as Record<string, unknown>),
      { wrapper: Wrapper },
    );

    act(() => {
      first.current.ref.current = {
        notes: 'after-advance',
        equipment: { items: [{ id: 'health-potion', name: 'Health Potion', quantity: 99 }] },
      };
    });
    unmount();

    const { result: second } = renderHook(
      () => useBaselineHarness('c1', structuredClone(initial) as Record<string, unknown>),
      { wrapper: Wrapper },
    );

    expect(second.current.ref.current?.notes).toBe('start');
    expect(
      (second.current.ref.current?.equipment as { items: Array<{ quantity?: number }> }).items[0]
        ?.quantity,
    ).toBe(3);
  });

  it('advances the mounted sheet ref when library/sheet reports a save result', () => {
    const initial = {
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 2,
          },
        ],
      },
    };

    const { result } = renderHook(() => useBaselineHarness('c1', initial), { wrapper: Wrapper });

    act(() => {
      result.current.advance('c1', {
        applied: {
          inventoryPatch: {
            ops: [
              {
                op: 'update',
                bucket: 'items',
                inventoryRowId: HEALTH_ROW,
                expected: {
                  quantity: 2,
                  equipped: false,
                  name: 'Health Potion',
                  type: '',
                  description: '',
                  cost: null,
                },
                item: {
                  id: 'health-potion',
                  name: 'Health Potion',
                  quantity: 4,
                  equipped: false,
                },
              },
            ],
          },
        },
        updatedAt: '2026-01-02T00:00:00.000Z',
      });
    });

    expect(
      (result.current.ref.current?.equipment as { items: Array<{ quantity?: number }> }).items[0]
        ?.quantity,
    ).toBe(4);
  });
});