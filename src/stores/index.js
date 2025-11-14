import { create } from 'zustand';
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

// Create initial store with auto-save functionality
const initialState = () => {
  // Try to restore from auto-save first
  const savedData = loadFromLocalStorage();

  if (
    savedData &&
    savedData.panels &&
    Array.isArray(savedData.panels) &&
    savedData.panels.length > 0
  ) {
    console.log('Restoring from auto-save...');
    return {
      panelSize: savedData.panelSize || UI_DIMENSIONS.DEFAULT_PANEL_SIZE,
      selectedPanel: null, // Reset UI state
      selectedHand: null,
      selectedDancer: null,
      selectedShapeId: null,
      panels: savedData.panels,
      hasUnsavedChanges: false,
      lastSaveTime: Date.now(),
      // UI state that's not persisted
      handFlash: [],
      lockUi: { active: false, selected: [] },
      opacity: {
        dancers: { value: 1, disabled: false },
        symbols: { value: 1, disabled: false },
      },
      _autoSaveTimer: null,
    };
  }

  // Default initial state
  return {
    panelSize: UI_DIMENSIONS.DEFAULT_PANEL_SIZE,
    selectedPanel: null,
    selectedHand: null,
    selectedDancer: null,
    selectedShapeId: null,
    panels: [createInitialPanel()],
    hasUnsavedChanges: false,
    lastSaveTime: Date.now(),
    // UI state
    handFlash: [],
    lockUi: { active: false, selected: [] },
    opacity: {
      dancers: { value: 1, disabled: false },
      symbols: { value: 1, disabled: false },
    },
    _autoSaveTimer: null,
  };
};

export const useAppStore = create(
  autoSaveMiddleware((set, get) => {
    // Initialize state with auto-save recovery
    const state = initialState();

    return {
      // Start with the initial state
      ...state,

      // Include coordinate transform utilities
      _localToAbsolute: coordinateTransforms.localToAbsolute,
      _absoluteToLocal: coordinateTransforms.absoluteToLocal,

      // Combine all slices
      ...createPanelSlice(set, get),
      ...createDancerSlice(set, get),
      ...createShapeSlice(set, get),
      ...createUISlice(set, get),
      ...createLockSlice(set, get),
      ...createSerializationSlice(set, get),
      ...createKeystrokeSlice(set, get),
    };
  }),
);
