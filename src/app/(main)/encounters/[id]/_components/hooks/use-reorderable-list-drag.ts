'use client';

import { useCallback, useState, type DragEvent } from 'react';

/** Shared drag-over state for encounter combatant / skill participant reorder lists. */
export function useReorderableListDrag() {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>, id: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (id === draggedId) {
        setDragOverId(null);
        return;
      }
      setDragOverId(id);
    },
    [draggedId],
  );

  const handleDragLeave = useCallback(() => setDragOverId(null), []);

  const clearDragState = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  return {
    draggedId,
    dragOverId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    clearDragState,
  };
}
