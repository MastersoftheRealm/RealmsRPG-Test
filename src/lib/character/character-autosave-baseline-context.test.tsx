/** @vitest-environment happy-dom */
import React, { useEffect, useState } from 'react';
import { render, renderHook, act } from '@testing-library/react';
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
  it('does not restore a persisted baseline snapshot on remount', async () => {
    const initial = {
      notes: 'start',
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 3,
          },
        ],
      },
    };
    const serverRow = {
      notes: 'server',
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 4,
          },
        ],
      },
    };

    type Harness = ReturnType<typeof useBaselineHarness>;
    const harnessLatch = { current: null as Harness | null };

    function BaselineHost({ row }: { row: Record<string, unknown> }) {
      const harness = useBaselineHarness('c1', structuredClone(row) as Record<string, unknown>);
      useEffect(() => {
        harnessLatch.current = harness;
      }, [harness]);
      return null;
    }

    function Tree() {
      const [generation, setGeneration] = useState(0);
      const [row, setRow] = useState<Record<string, unknown>>(initial);
      return (
        <Wrapper>
          <BaselineHost key={generation} row={row} />
          <button
            type="button"
            data-testid="remount-with-server-row"
            onClick={() => {
              setRow(structuredClone(serverRow));
              setGeneration((g) => g + 1);
            }}
          />
        </Wrapper>
      );
    }

    const view = render(<Tree />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      harnessLatch.current?.advance('c1', {
        applied: structuredClone(initial) as Record<string, unknown>,
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
    });

    await act(async () => {
      view.getByTestId('remount-with-server-row').click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(
      (
        harnessLatch.current?.ref.current?.equipment as { items: Array<{ quantity?: number }> }
      ).items[0]?.quantity,
    ).toBe(4);
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