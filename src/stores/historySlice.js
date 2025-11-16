// History management slice - provides undo/redo functionality using zundo middleware
import { temporal } from 'zundo';

// History slice that provides methods to interact with the temporal store
const createHistorySlice = (set, get, api) => ({
  // History configuration
  historyConfig: {
    // Limit the number of history states to prevent memory issues
    limit: 50,

    // Properties to track in history - only include data that should be undoable
    trackedProperties: [
      'panels', // Track panel changes (symbols, dancers)
    ],

    // Properties to exclude from history tracking
    excludedProperties: [
      // UI state that shouldn't be undoable
      'selectedPanel',
      'selectedHand',
      'selectedDancer',
      'selectedShapeId',
      'handFlash',
      'lockUi',
      'opacity',

      // Auto-save state
      'hasUnsavedChanges',
      'lastSaveTime',
      '_autoSaveTimer',

      // History state itself
      'pastStates',
      'futureStates',
      'historyConfig',

      // Internal functions
      '_localToAbsolute',
      '_absoluteToLocal',
    ],
  },

  // Custom equality function for zundo to determine when to create a new history state
  historyEquality: (pastState, currentState) => {
    // Only check the tracked properties for changes
    const { trackedProperties } = get().historyConfig;

    for (const prop of trackedProperties) {
      if (
        JSON.stringify(pastState[prop]) !== JSON.stringify(currentState[prop])
      ) {
        return false;
      }
    }

    return true;
  },

  // Action creators that will be wrapped by zundo to be undoable
  // These are helper methods that other actions can use to mark operations as undoable

  // Create a savepoint for undo/redo (used before starting operations that should be undoable)
  saveHistoryState: () => {
    // This is handled automatically by zundo when state changes
    // This method is mainly for explicit savepoints if needed
  },

  // Group multiple operations into a single undo/redo step
  // Usage:
  // - Call startUndoGroup() before a series of operations
  // - Perform multiple state changes
  // - Call endUndoGroup() to group them as one undoable operation
  startUndoGroup: () => {
    // Implementation will depend on how we want to batch operations
    // For now, we'll rely on temporal middleware's built-in batching
  },

  endUndoGroup: () => {
    // Paired with startUndoGroup
  },

  // Helper to check if undo/redo is available
  canUndo: () => {
    const temporalStore = api?.temporal;
    if (!temporalStore) return false;
    const { pastStates } = temporalStore.getState();
    return pastStates.length > 0;
  },

  canRedo: () => {
    const temporalStore = api?.temporal;
    if (!temporalStore) return false;
    const { futureStates } = temporalStore.getState();
    return futureStates.length > 0;
  },
});

export default createHistorySlice;
