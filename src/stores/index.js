import { create } from 'zustand';
import { temporal } from 'zundo';
import {
  autoSaveMiddleware,
  loadFromLocalStorage,
} from './autoSaveMiddleware.js';
import coordinateTransforms from './coordinateTransforms.js';
import createInitialPanel from './panelFactory.js';
import createPanelSlice from './panelSlice.js';
import createDancerSlice from './dancerSlice.js';
import createShapeSlice from './shapeSlice.js';
import createUISlice from './uiSlice.js';
import createLockSlice from './lockSlice.js';
import createSerializationSlice from './serializationSlice.js';
import createKeystrokeSlice from './keystrokeSlice.js';
import { UI_DIMENSIONS } from '../utils/dimensions.js';

const createInitialState = () => ({
  panelSize: UI_DIMENSIONS.DEFAULT_PANEL_SIZE,
  globalCanvasSize: 1.0,
  selectedPanel: null,
  selectedHand: null,
  selectedItems: [], // Array of {type: 'dancer'|'shape', panelId, id}
  panels: [createInitialPanel()],
  hasUnsavedChanges: false,
  lastSaveTime: Date.now(),
  // Document state
  documentTitle: 'Untitled Dance',
  currentFileHandle: null,
  // UI state
  handFlash: [],
  lockUi: { active: false, selected: [] },
  magnifyEnabled: false,
  opacity: {
    dancers: { value: 1, disabled: false },
    symbols: { value: 1, disabled: false },
    disabled: [],
  },
  hideList: [], // Elements to hide (dancers or shape IDs)
  _autoSaveTimer: null,
});

// Create initial store with auto-save functionality
export const initialState = () => {
  const initialStoreState = createInitialState();
  // Try to restore from auto-save first
  const savedData = loadFromLocalStorage();
  if (
    savedData &&
    savedData.panels &&
    Array.isArray(savedData.panels) &&
    savedData.panels.length > 0
  ) {
    console.log('Restoring from auto-save...');
    const loadedCanvasSize = savedData.globalCanvasSize || 1.0;
    return {
      ...initialStoreState,
      globalCanvasSize: loadedCanvasSize,
      panelSize: {
        width: Math.round(
          UI_DIMENSIONS.DEFAULT_PANEL_SIZE.width * loadedCanvasSize,
        ),
        height: Math.round(
          UI_DIMENSIONS.DEFAULT_PANEL_SIZE.height * loadedCanvasSize,
        ),
      },
      panels: savedData.panels,
    };
  }

  // Default initial state
  return initialStoreState;
};

export const useAppStore = create(
  autoSaveMiddleware(
    temporal(
      (set, get, api) => {
        const state = initialState();

        return {
          // Start with the initial state
          ...state,

          // Include coordinate transform utilities
          _localToAbsolute: coordinateTransforms.localToAbsolute,
          _absoluteToLocal: coordinateTransforms.absoluteToLocal,

          // Combine all slices
          ...createPanelSlice(set, get, api),
          ...createDancerSlice(set, get, api),
          ...createShapeSlice(set, get, api),
          ...createUISlice(set, get, api),
          ...createLockSlice(set, get, api),
          ...createSerializationSlice(set, get, api),
          ...createKeystrokeSlice(set, get, api),
        };
      },
      {
        // Temporal middleware configuration
        limit: 100,

        // Only track state changes to 'panels' for undo/redo
        // panels contains _historyCapture flag to force history saves when needed
        partialize: (state) => ({
          panels: state.panels,
        }),
        equality: (pastState, currentState) =>
          JSON.stringify(pastState.panels) ===
          JSON.stringify(currentState.panels),
      },
    ),
  ),
);

useAppStore.setState({
  startDragMode: () => {
    // Force a state change by incrementing _historyCapture in the first panel
    const currentState = useAppStore.getState();
    if (currentState.panels.length > 0) {
      const firstPanel = currentState.panels[0];
      const currentCapture = firstPanel._historyCapture || 0;
      const newPanels = [
        { ...firstPanel, _historyCapture: currentCapture + 1 },
        ...currentState.panels.slice(1),
      ];
      useAppStore.setState({ panels: newPanels }, false);
    }

    // Immediately pause tracking after the setState
    // The pause happens synchronously so subsequent updates won't be tracked
    if (useAppStore.temporal) {
      useAppStore.temporal.getState().pause();
    }
  },
  endDragMode: () => {
    if (useAppStore.temporal) {
      useAppStore.temporal.getState().resume();
    }
  },
});
