// panelSlice.js
import createInitialPanel from './panelFactory.js';
import * as ShapeTypes from '../constants/shapeTypes';

// Panel management slice - handles panel CRUD operations and panel-level state
const createPanelSlice = (set, get, api) => ({
  // Actions (initial state for panels and panelSize is set in index.js)
  setPanels: (panels) => set({ panels }),

  addPanel: () =>
    set((state) => ({ panels: [...state.panels, createInitialPanel()] })),

  deleteSelectedPanel: (panelId) => {
    const { selectedPanel } = get();
    set((state) => {
      const newPanels = state.panels.filter((p) => p.id !== panelId);
      const deselect =
        selectedPanel === panelId
          ? {
              selectedPanel: null,
              selectedDancer: null,
              selectedHand: null,
              selectedShapeId: null,
            }
          : {};
      return { panels: newPanels, ...deselect };
    });
  },

  clonePanel: (panelId) => {
    const serializedPanel = get().serializePanel(panelId);
    if (!serializedPanel) return;
    const clonedPanel = get().deserializePanel(serializedPanel);

    // Recenter the cloned panel
    const panelSize = get().panelSize;
    const centerX = panelSize.width / 2;
    const centerY = panelSize.height / 2;

    // Find stageNext to use as reference point
    const stageNext = clonedPanel.shapes.find(
      (shape) => shape.type === ShapeTypes.STAGE_NEXT,
    );

    if (stageNext) {
      // Calculate the shift needed to center stageNext
      const deltaX = centerX - stageNext.x;
      const deltaY = centerY - stageNext.y;

      // Shift all dancers relative to stageNext's movement
      clonedPanel.dancers = clonedPanel.dancers.map((dancer) => ({
        ...dancer,
        x: dancer.x + deltaX,
        y: dancer.y + deltaY,
      }));

      // Shift all shapes (including stageNext) relative to stageNext's movement
      clonedPanel.shapes = clonedPanel.shapes.map((shape) => {
        if (shape.type === ShapeTypes.STAGE_X) {
          // stageX moves to center independently
          return { ...shape, x: centerX, y: centerY };
        }
        // All other shapes including stageNext shift together
        return { ...shape, x: shape.x + deltaX, y: shape.y + deltaY };
      });
    }

    set((state) => {
      const index = state.panels.findIndex((p) => p.id === panelId);
      const newPanels = [...state.panels];
      newPanels.splice(index + 1, 0, clonedPanel);
      return { panels: newPanels };
    });
  },

  movePanel: (draggedId, targetId) => {
    set((state) => {
      if (draggedId === targetId) return {};
      const ids = state.panels.map((p) => p.id);
      const fromIndex = ids.indexOf(draggedId);
      const toIndex = ids.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) return {};
      ids.splice(fromIndex, 1);
      ids.splice(toIndex, 0, draggedId);
      const reordered = ids.map((id) => state.panels.find((p) => p.id === id));
      return { panels: reordered };
    });
  },

  resetDancers: () => {
    // Clear any pending auto-save
    const { clearAutoSave } = get();
    if (clearAutoSave) {
      clearAutoSave();
    }

    // Reset to initial state with one panel containing two dancers in default positions
    set({
      panels: [createInitialPanel()],
      selectedPanel: null,
      selectedDancer: null,
      selectedHand: null,
      selectedShapeId: null,
      lockUi: { active: false, selected: [] },
    });

    // Clear undo/redo history via zundo temporal store
    const temporalStore = api?.temporal;
    if (temporalStore) {
      const { clear } = temporalStore.getState();
      if (typeof clear === 'function') {
        clear();
      }
    }
  },

  handlePanelSelection: (panelId) => set({ selectedPanel: panelId }),

  updatePanelNotes: (panelId, notes) => {
    set((state) => ({
      panels: state.panels.map((p) => (p.id === panelId ? { ...p, notes } : p)),
    }));
  },
});

export default createPanelSlice;
