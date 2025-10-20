import { create } from 'zustand';
import { useAppStore } from './useAppStore';

// Create a separate temporal store to manage history
const useTemporalStore = create((set, get) => ({
  pastStates: [],
  futureStates: [],
  isUndoRedoing: false,
  dragState: {
    isDragging: false,
    dragType: null, // 'dancer', 'hand', 'elbow', 'shape'
    preInteractionState: null,
  },

  // Start a drag operation - save current state and mark as dragging
  startDragOperation: (dragType) => {
    const currentState = useAppStore.getState();
    set({
      dragState: {
        isDragging: true,
        dragType,
        preInteractionState: JSON.parse(JSON.stringify(currentState)),
      },
    });
  },

  // End drag operation - save the pre-drag state to history
  endDragOperation: () => {
    const { dragState } = get();
    if (dragState.isDragging && dragState.preInteractionState) {
      // Save the state from before the drag started
      set((temporal) => ({
        pastStates: [
          ...temporal.pastStates,
          dragState.preInteractionState,
        ].slice(-50),
        futureStates: [], // Clear future when new action is performed
        dragState: {
          isDragging: false,
          dragType: null,
          preInteractionState: null,
        },
      }));
    } else {
      // Just clear drag state if no pre-interaction state
      set({
        dragState: {
          isDragging: false,
          dragType: null,
          preInteractionState: null,
        },
      });
    }
  },

  // Save current state to history
  saveState: (state) => {
    const { isUndoRedoing, dragState } = get();
    if (isUndoRedoing) return; // Don't save during undo/redo operations
    if (dragState.isDragging) return; // Don't save intermediate drag states

    set((temporal) => ({
      pastStates: [
        ...temporal.pastStates,
        JSON.parse(JSON.stringify(state)),
      ].slice(-50),
      futureStates: [], // Clear future when new action is performed
    }));
  },

  // Undo action
  undo: () => {
    const { pastStates, futureStates, dragState } = get();

    // If we're currently dragging, end the drag first
    if (dragState.isDragging) {
      get().endDragOperation();
    }

    const updatedPastStates = get().pastStates;
    if (updatedPastStates.length === 0) return;

    // Set flag to prevent saving during undo
    set({ isUndoRedoing: true });

    const currentState = useAppStore.getState();
    const previousState = updatedPastStates[updatedPastStates.length - 1];

    // Update the main store
    useAppStore.setState(previousState);

    // Update temporal store
    set({
      pastStates: updatedPastStates.slice(0, -1),
      futureStates: [
        JSON.parse(JSON.stringify(currentState)),
        ...futureStates,
      ].slice(0, 50),
      isUndoRedoing: false,
    });
  },

  // Redo action
  redo: () => {
    const { pastStates, futureStates, dragState } = get();

    // If we're currently dragging, end the drag first
    if (dragState.isDragging) {
      get().endDragOperation();
    }

    const updatedFutureStates = get().futureStates;
    if (updatedFutureStates.length === 0) return;

    // Set flag to prevent saving during redo
    set({ isUndoRedoing: true });

    const currentState = useAppStore.getState();
    const nextState = updatedFutureStates[0];

    // Update the main store
    useAppStore.setState(nextState);

    // Update temporal store
    set({
      pastStates: [
        ...pastStates,
        JSON.parse(JSON.stringify(currentState)),
      ].slice(-50),
      futureStates: updatedFutureStates.slice(1),
      isUndoRedoing: false,
    });
  },

  // Clear history
  clear: () => {
    set({
      pastStates: [],
      futureStates: [],
      dragState: {
        isDragging: false,
        dragType: null,
        preInteractionState: null,
      },
    });
  },
}));

// Initialize the store and set up subscription
let previousState = useAppStore.getState();

// Save initial state
useTemporalStore.getState().saveState(previousState);

// Subscribe to all state changes
const unsubscribe = useAppStore.subscribe((state) => {
  const temporal = useTemporalStore.getState();

  // Don't save if we're in the middle of an undo/redo operation
  if (temporal.isUndoRedoing) {
    previousState = state;
    return;
  }

  // Save the previous state (not the current one)
  // The saveState function will check if we're dragging and skip if so
  temporal.saveState(previousState);
  previousState = state;
});

export { useTemporalStore };
