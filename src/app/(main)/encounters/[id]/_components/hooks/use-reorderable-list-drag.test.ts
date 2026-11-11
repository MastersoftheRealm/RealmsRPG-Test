// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useReorderableListDrag } from './use-reorderable-list-drag';

function dragEventStub(effectAllowed = ''): React.DragEvent<HTMLDivElement> {
  const dataTransfer = {
    effectAllowed,
    dropEffect: 'none',
    setData: () => {},
  } as unknown as DataTransfer;
  return {
    dataTransfer,
    preventDefault: () => {},
  } as unknown as React.DragEvent<HTMLDivElement>;
}

describe('useReorderableListDrag', () => {
  it('sets dataTransfer effectAllowed to move on drag start', () => {
    const { result } = renderHook(() => useReorderableListDrag());
    const event = dragEventStub();

    act(() => {
      result.current.handleDragStart(event, 'row-1');
    });

    expect(event.dataTransfer.effectAllowed).toBe('move');
    expect(result.current.draggedId).toBe('row-1');
  });

  it('clears drag state on drag end', () => {
    const { result } = renderHook(() => useReorderableListDrag());
    const startEvent = dragEventStub();

    act(() => {
      result.current.handleDragStart(startEvent, 'row-1');
      result.current.handleDragOver(dragEventStub('move'), 'row-2');
      result.current.handleDragEnd();
    });

    expect(result.current.draggedId).toBeNull();
    expect(result.current.dragOverId).toBeNull();
  });
});
