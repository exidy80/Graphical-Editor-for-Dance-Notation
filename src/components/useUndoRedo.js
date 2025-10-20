import { useTemporalStore } from './useTemporalStore';

// Hook to access undo/redo functionality
export const useUndoRedo = () => {
  const {
    undo,
    redo,
    pastStates,
    futureStates,
    clear,
    startDragOperation,
    endDragOperation,
    dragState,
  } = useTemporalStore();

  return {
    undo,
    redo,
    clear,
    startDragOperation,
    endDragOperation,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
    undoCount: pastStates.length,
    redoCount: futureStates.length,
    isDragging: dragState.isDragging,
    dragType: dragState.dragType,
  };
};
