// panelSlice.js
import createInitialPanel from './panelFactory.js';
import * as ShapeTypes from '../constants/shapeTypes';
import { UI_DIMENSIONS } from '../utils/dimensions.js';

const _recenterPanel = (panel, center) => {
  const canvasCenterX = UI_DIMENSIONS.CANVAS_SIZE.width / 2;
  const canvasCenterY = UI_DIMENSIONS.CANVAS_SIZE.height / 2;

  // recenter based on provided center point
  const offsetX = canvasCenterX - center.x;
  const offsetY = canvasCenterY - center.y;

  const recenteredPanel = {
    ...panel,
    dancers: panel.dancers.map((d) => ({
      ...d,
      x: d.x + offsetX,
      y: d.y + offsetY,
    })),
    shapes: panel.shapes.map((s) => ({
      ...s,
      x: s.x + offsetX,
      y: s.y + offsetY,
    })),
  };

  return recenteredPanel;
};

// Panel management slice - handles panel CRUD operations and panel-level state
const createPanelSlice = (set, get, api) => ({
  // Actions (initial state for panels and panelSize is set in index.js)
  setPanels: (panels) => set({ panels }),

  addPanel: (panelId) => {
    const newPanel = createInitialPanel();
    set((state) => {
      if (!panelId)
        return {
          panels: [...state.panels, newPanel],
          selectedPanel: newPanel.id,
        };
      const index = state.panels.findIndex((p) => p.id === panelId);
      const newPanels = [...state.panels];
      newPanels.splice(index + 1, 0, newPanel);
      return { panels: newPanels, selectedPanel: newPanel.id };
    });
  },

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

    const stageNext = clonedPanel.shapes.find(
      (shape) => shape.type === ShapeTypes.STAGE_NEXT,
    );

    const recenteredPanel = stageNext
      ? _recenterPanel(clonedPanel, stageNext)
      : clonedPanel;

    const stageX = recenteredPanel.shapes.find(
      (shape) => shape.type === ShapeTypes.STAGE_X,
    );

    // move stageX to center
    if (stageX) {
      stageX.x = UI_DIMENSIONS.CANVAS_SIZE.width / 2;
      stageX.y = UI_DIMENSIONS.CANVAS_SIZE.height / 2;
    }

    set((state) => {
      const index = state.panels.findIndex((p) => p.id === panelId);
      const newPanels = [...state.panels];
      newPanels.splice(index + 1, 0, recenteredPanel);
      return { panels: newPanels, selectedPanel: recenteredPanel.id };
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

    // First reset zoom and panel size
    set({
      globalZoomLevel: 1.0,
      panelSize: UI_DIMENSIONS.DEFAULT_PANEL_SIZE,
    });

    // Now create initial panel with correct size
    // Reset to initial state with one panel containing two dancers in default positions
    set({
      panels: [createInitialPanel()],
      selectedPanel: null,
      selectedDancer: null,
      selectedHand: null,
      selectedShapeId: null,
      lockUi: { active: false, selected: [] },
      documentTitle: 'Untitled Dance',
      currentFileHandle: null,
      hasUnsavedChanges: false,
      lastSaveTime: Date.now(),
      opacity: {
        dancers: { value: 1, disabled: false },
        symbols: { value: 1, disabled: false },
        disabled: [],
      },
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

  recenterPanel: (panel, center) => {
    set((state) => {
      const recenteredPanel = _recenterPanel(panel, center);
      return {
        panels: state.panels.map((p) =>
          p.id === panel.id ? recenteredPanel : p,
        ),
      };
    });
  },

  recenterAllPanels: () => {
    set((state) => {
      const recenteredPanels = state.panels.map((panel) => {
        // Find stage markers to determine current center
        const stageXMarker = panel.shapes?.find(
          (s) => s.type === ShapeTypes.STAGE_X,
        );
        const stageNextMarker = panel.shapes?.find(
          (s) => s.type === ShapeTypes.STAGE_NEXT,
        );

        if (!stageXMarker && !stageNextMarker) {
          // No stage markers, calculate center from dancers
          if (panel.dancers && panel.dancers.length > 0) {
            const avgX =
              panel.dancers.reduce((sum, d) => sum + d.x, 0) /
              panel.dancers.length;
            const avgY =
              panel.dancers.reduce((sum, d) => sum + d.y, 0) /
              panel.dancers.length;

            return _recenterPanel(panel, { x: avgX, y: avgY });
          }
          return panel; // No dancers either, return unchanged
        }

        // Use stage marker position as current center
        const currentCenterX =
          stageXMarker?.x ||
          stageNextMarker?.x ||
          UI_DIMENSIONS.CANVAS_SIZE.width / 2;
        const currentCenterY =
          stageXMarker?.y ||
          stageNextMarker?.y ||
          UI_DIMENSIONS.CANVAS_SIZE.height / 2;

        // Apply offset to all dancers and shapes
        return _recenterPanel(panel, { x: currentCenterX, y: currentCenterY });
      });

      return { panels: recenteredPanels };
    });
  },

  handlePanelSelection: (panelId) => set({ selectedPanel: panelId }),

  updatePanelNotes: (panelId, notes) => {
    set((state) => ({
      panels: state.panels.map((p) => (p.id === panelId ? { ...p, notes } : p)),
    }));
  },
});

export default createPanelSlice;
