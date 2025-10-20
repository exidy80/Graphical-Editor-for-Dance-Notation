// Shape interaction slice - handles shape drawing, selection, and manipulation
const createShapeSlice = (set, get) => ({
  // Actions
  handleShapeSelection: (panelId, shapeId) => {
    const { selectedShapeId: prevSelected } = get();
    set({ selectedPanel: panelId });
    if (
      prevSelected &&
      prevSelected.panelId === panelId &&
      prevSelected.shapeId === shapeId
    ) {
      set({ selectedShapeId: null });
    } else {
      set({ selectedShapeId: { panelId, shapeId } });
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
      selectedShapeId: null,
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
