// Shape interaction slice - handles shape drawing, selection, and manipulation
const createShapeSlice = (set, get) => ({
  // Actions
  handleShapeSelection: (panelId, shapeId, multiSelect = false) => {
    const { selectedItems } = get();
    set({ selectedPanel: panelId });
    if (multiSelect) {
      // Ctrl/Cmd-click: toggle this shape in the selection
      const existingIndex = selectedItems.findIndex(
        (item) => item.id === shapeId,
      );
      set({
        selectedItems:
          existingIndex >= 0
            ? selectedItems.filter((_, idx) => idx !== existingIndex)
            : [...selectedItems, { type: 'shape', panelId, id: shapeId }],
      });
    } else {
      // Single click: select only this shape, deselect all others
      set({
        selectedItems: [{ type: 'shape', panelId, id: shapeId }],
      });
    }
  },

  handleShapeDraw: (shape) => {
    const { selectedPanel } = get();
    if (selectedPanel === null) return;
    set((state) => ({
      panels: state.panels.map((panel) =>
        panel.id === selectedPanel
          ? { ...panel, shapes: [...panel.shapes, shape] }
          : panel,
      ),
    }));
  },

  handleDelete: (selectedShape) => {
    if (!selectedShape) return;
    const { panelId, shapeId } = selectedShape;
    set((state) => ({
      panels: state.panels.map((panel) =>
        panel.id === panelId
          ? { ...panel, shapes: panel.shapes.filter((s) => s.id !== shapeId) }
          : panel,
      ),
      selectedItems: state.selectedItems.filter((item) => item.id !== shapeId),
    }));
  },

  updateShapeState: (panelId, shapeId, newState) => {
    set((state) => ({
      panels: state.panels.map((panel) =>
        panel.id === panelId
          ? {
              ...panel,
              shapes: panel.shapes.map((s) =>
                s.id === shapeId ? { ...s, ...newState } : s,
              ),
            }
          : panel,
      ),
    }));
  },
});

export default createShapeSlice;
