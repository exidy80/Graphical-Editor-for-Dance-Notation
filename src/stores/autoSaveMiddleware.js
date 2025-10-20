// Auto-save utility functions and middleware for Zustand store
const AUTO_SAVE_KEY = 'dance-notation-autosave';

// Define which state properties are consequential (require saving)
const CONSEQUENTIAL_PROPERTIES = new Set(['panels', 'panelSize']);

const saveToLocalStorage = (data) => {
  try {
    const saveData = {
      timestamp: Date.now(),
      data: data,
    };
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(saveData));
  } catch (error) {
    console.warn('Failed to auto-save to localStorage:', error);
  }
};

const loadFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    if (saved) {
      const { timestamp, data } = JSON.parse(saved);
      // Only restore if saved within last 24 hours
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return data;
      }
    }
  } catch (error) {
    console.warn('Failed to load auto-save from localStorage:', error);
  }
  return null;
};

const clearAutoSaveData = () => {
  try {
    localStorage.removeItem(AUTO_SAVE_KEY);
  } catch (error) {
    console.warn('Failed to clear auto-save:', error);
  }
};

// Auto-save middleware that detects consequential changes
const autoSaveMiddleware = (config) => (set, get, api) => {
  let isInternalUpdate = false;

  const originalSet = set;
  const wrappedSet = (partial, replace) => {
    if (isInternalUpdate) {
      return originalSet(partial, replace);
    }

    const prevState = get();
    const result = originalSet(partial, replace);
    const newState = get();

    // Check if any consequential properties changed
    const hasConsequentialChanges =
      (CONSEQUENTIAL_PROPERTIES.has('panels') &&
        JSON.stringify(prevState.panels) !== JSON.stringify(newState.panels)) ||
      (CONSEQUENTIAL_PROPERTIES.has('panelSize') &&
        JSON.stringify(prevState.panelSize) !==
          JSON.stringify(newState.panelSize));

    if (hasConsequentialChanges && !newState.hasUnsavedChanges) {
      // Use internal update to avoid infinite recursion
      isInternalUpdate = true;
      originalSet({ hasUnsavedChanges: true });

      // Schedule auto-save
      if (newState._autoSaveTimer) {
        clearTimeout(newState._autoSaveTimer);
      }
      const timer = setTimeout(() => {
        const currentState = get();
        if (currentState.hasUnsavedChanges) {
          const saveData = {
            panels: currentState.panels,
            panelSize: currentState.panelSize,
          };
          saveToLocalStorage(saveData);
          isInternalUpdate = true;
          originalSet({ hasUnsavedChanges: false, lastSaveTime: Date.now() });
          isInternalUpdate = false;
          console.log('Auto-saved to localStorage');
        }
      }, 2000);

      originalSet({ _autoSaveTimer: timer });
      isInternalUpdate = false;
    }

    return result;
  };

  return config(wrappedSet, get, api);
};

export {
  autoSaveMiddleware,
  loadFromLocalStorage,
  clearAutoSaveData,
  CONSEQUENTIAL_PROPERTIES,
};
