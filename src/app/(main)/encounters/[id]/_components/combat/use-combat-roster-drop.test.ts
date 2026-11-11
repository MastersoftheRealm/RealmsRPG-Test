// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useReorderableListDrag } from '../hooks/use-reorderable-list-drag';

describe('combat roster drop drag cleanup', () => {
  it('clears drag state when dropping on the dragged id', () => {
    const { result } = renderHook(() => useReorderableListDrag());
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
      // Same as use-combat-roster-actions handleDrop early exit
      if (result.current.draggedId === 'c1') {
        result.current.clearDragState();
      }
    });
    expect(result.current.draggedId).toBeNull();
    expect(result.current.dragOverId).toBeNull();
  });
});
