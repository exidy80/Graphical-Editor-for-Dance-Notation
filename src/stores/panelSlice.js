import createInitialPanel from './panelFactory.js';

// Panel management slice - handles panel CRUD operations and panel-level state
const createPanelSlice = (set, get) => ({
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
  },

  handlePanelSelection: (panelId) => set({ selectedPanel: panelId }),
});

export default createPanelSlice;
