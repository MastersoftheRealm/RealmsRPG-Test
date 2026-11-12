// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultEncounter } from '@/types/encounter';
import type { Encounter } from '@/types/encounter';
import { useCombatRosterActions } from './use-combat-roster-actions';

vi.mock('@/hooks', () => ({
  useAuth: () => ({ user: { uid: 'u1' } }),
  fetchCampaignCharacterForEncounter: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({}),
}));

vi.mock('../hooks/use-linked-campaign-characters', () => ({
  useLinkedCampaignCharacters: () => ({
    linkedCampaign: null,
    existingCampaignCharacterIds: new Set<string>(),
    availableCampaignCharacters: [],
  }),
}));

describe('combat roster drop drag cleanup', () => {
  it('clears drag state when dropping on the dragged id', () => {
    const encounter: Encounter = { ...createDefaultEncounter('combat', 'C'), id: 'enc-combat-1' };
    let state: Encounter = encounter;
    const setEncounter: React.Dispatch<React.SetStateAction<Encounter | null>> = (value) => {
      state = typeof value === 'function' ? (value(state) ?? state) : (value ?? state);
    };

    const { result } = renderHook(() =>
      useCombatRosterActions({
        encounter: state,
        setEncounter,
        campaignsFull: [],
      }),
    );

    const dataTransfer = {
      effectAllowed: 'move',
      dropEffect: 'move',
      setData: () => {},
    } as unknown as DataTransfer;
    const event = {
      dataTransfer,
      preventDefault: vi.fn(),
    } as unknown as React.DragEvent<HTMLDivElement>;

    act(() => {
      result.current.handleDragStart(event, 'c1');
      result.current.handleDragOver(event, 'c2');
    });
    expect(result.current.draggedId).toBe('c1');
    expect(result.current.dragOverId).toBe('c2');

    act(() => {
      result.current.handleDrop(event, 'c1');
    });
    expect(result.current.draggedId).toBeNull();
    expect(result.current.dragOverId).toBeNull();
  });
});
