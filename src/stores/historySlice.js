// History management slice - provides undo/redo functionality using zundo middleware
import { temporal } from 'zundo';

// History slice that provides methods to interact with the temporal store
const createHistorySlice = (set, get) => ({
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
    const temporal = get().temporal;
    return temporal ? temporal.pastStates.length > 0 : false;
  },

  canRedo: () => {
    const temporal = get().temporal;
    return temporal ? temporal.futureStates.length > 0 : false;
  },
});

export default createHistorySlice;

// Export temporal middleware configurator for use in main store
export const createTemporalStore = (storeConfig) => {
  return temporal(storeConfig, {
    limit: 50,

    // Equality function to determine when to save state
    equality: (pastState, currentState) => {
      // Define tracked properties for history
      const trackedProperties = ['panels'];

      for (const prop of trackedProperties) {
        if (
          JSON.stringify(pastState[prop]) !== JSON.stringify(currentState[prop])
        ) {
          return false;
        }
      }

      return true;
    },

    // Handle batching - group rapid state changes within this time window
    handleSet: (handleSet) => (fn) => {
      // For now, use default behavior
      // Later we can add custom batching logic for drag operations
      return handleSet(fn);
    },

    // Only track specific properties
    partialize: (state) => {
      const { panels } = state;
      return { panels };
    },
  });
};
