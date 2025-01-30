import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

// Store for managing individual panel state
const createPanelStore = () =>
  create((set) => ({
    dancers: [
      {
        id: uuidv4(),
        x: 150,
        y: 40,
        colour: 'red',
        rotation: 180,
        scaleX: 1,
        scaleY: 1,
        leftHandPos: { x: -30, y: -40 },
        rightHandPos: { x: 30, y: -40 },
        leftElbowPos: { x: -45, y: -12 },
        rightElbowPos: { x: 45, y: -12 },
        leftHandRotation: 0,
        rightHandRotation: 0,
        leftUpperArmThickness: 'thick',
        leftLowerArmThickness: 'thick',
        rightUpperArmThickness: 'thick',
        rightLowerArmThickness: 'thick',
      },
      {
        id: uuidv4(),
        x: 150,
        y: 220,
        colour: 'blue',
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        leftHandPos: { x: -30, y: -40 },
        rightHandPos: { x: 30, y: -40 },
        leftElbowPos: { x: -45, y: -12 },
        rightElbowPos: { x: 45, y: -12 },
        leftHandRotation: 0,
        rightHandRotation: 0,
        leftArmThickness: 'thick',
        rightArmThickness: 'thick',
      },
    ],
    headShapes: ['Upright', 'Upright'],
    handShapes: [
      { left: 'Waist', right: 'Waist' },
      { left: 'Waist', right: 'Waist' },
    ],
    shapes: [
      {
        id: uuidv4(),
        type: 'stageX',
        x: 147,
        y: 127,
        width: 20,
        height: 20,
        draggable: true,
        text: 'X',
        fontSize: 20,
        fill: 'black',
      },
    ],

    // Selector for getting a dancer by ID
    getDancerById: (dancerId) => (state) =>
      state.dancers.find((d) => d.id === dancerId),

    // Selector for getting all shapes
    getShapes: (state) => state.shapes,

    // Action to update dancer state
    updateDancer: (dancerId, updates) =>
      set((state) => ({
        dancers: state.dancers.map((d) =>
          d.id === dancerId ? { ...d, ...updates } : d,
        ),
      })),

    // Action methods
    addElement: (element) =>
      set((state) => ({
        shapes: [...state.shapes, element],
      })),

    updateElement: (id, updates) =>
      set((state) => ({
        shapes: state.shapes.map((el) =>
          el.id === id ? { ...el, ...updates } : el,
        ),
      })),

    deleteElement: (id) =>
      set((state) => ({
        shapes: state.shapes.filter((el) => el.id !== id),
      })),
  }));

// Global store for managing shared state (like selected panel, opacity, etc.)
const useAppStore = create((set) => ({
  panels: [],
  selectedPanel: null,
  selectedHand: null,
  selectedDancer: null,
  selectedShapeId: null,
  panelSize: { width: 300, height: 300 },
  opacity: {
    dancers: { value: 1, disabled: false },
    symbols: { value: 1, disabled: false },
  },

  // Get panel store by panelId (returns the specific panel's store)
  getPanelStoreById: (panelId) => (state) =>
    state.panels.find((panel) => panel.id === panelId),

  // Add panel
  addPanel: () =>
    set((state) => {
      const newPanel = createPanelStore();
      return {
        panels: [...state.panels, newPanel],
      };
    }),

  // Remove panel
  removePanel: (panelId) =>
    set((state) => ({
      panels: state.panels.filter((panel) => panel.id !== panelId),
    })),

  // Set selected panel
  setSelectedPanel: (panelId) =>
    set({
      selectedPanel: panelId,
      selectedDancer: null,
      selectedHand: null,
      selectedShapeId: null, // Deselect everything else when panel changes
    }),

  // Select or deselect a dancer
  handleDancerSelection: (panelId, dancerId) =>
    set((state) => {
      if (
        state.selectedDancer?.panelId === panelId &&
        state.selectedDancer?.dancerId === dancerId
      ) {
        return { selectedDancer: null }; // Deselect if same dancer clicked
      }
      return { selectedPanel: panelId, selectedDancer: { panelId, dancerId } };
    }),

  // Select or deselect a hand
  handleHandClick: (panelId, dancerId, handSide) =>
    set((state) => {
      if (
        state.selectedHand?.panelId === panelId &&
        state.selectedHand?.dancerId === dancerId &&
        state.selectedHand?.handSide === handSide
      ) {
        return { selectedHand: null }; // Deselect if same hand clicked
      }
      return {
        selectedPanel: panelId,
        selectedHand: { panelId, dancerId, handSide },
      };
    }),

  // Deselect everything when the canvas is clicked
  handleCanvasClick: () =>
    set({
      selectedPanel: null,
      selectedHand: null,
      selectedDancer: null,
      selectedShapeId: null,
    }),

  // Getter for opacity values
  getOpacity: (type) => (state) => state.opacity[type],

  // Setter for opacity of dancers or symbols
  setOpacity: (type) =>
    set((state) => {
      const currentOpacity = state.opacity[type].value;
      return {
        opacity: {
          ...state.opacity,
          [type]: {
            value: currentOpacity === 1 ? 0.5 : 1,
            disabled: currentOpacity === 1,
          },
        },
      };
    }),

  // Set selected shape
  handleShapeSelection: (panelId, shapeId) =>
    set((state) => {
      if (
        state.selectedShapeId?.panelId === panelId &&
        state.selectedShapeId?.shapeId === shapeId
      ) {
        return { selectedShapeId: null }; // Deselect if same shape clicked
      }
      return { selectedPanel: panelId, selectedShapeId: { panelId, shapeId } };
    }),

  // Adds a new shape to the selected panel
  handleShapeDraw: (shape) =>
    set((state) => {
      const selectedPanel = state.selectedPanel;
      if (selectedPanel !== null) {
        const panelStore = state.panels.find((p) => p.id === selectedPanel);
        panelStore.addElement(shape); // Add shape to the selected panel
      }
    }),

  // Updates dancer state
  updateDancerState: (panelId, dancerId, newState) =>
    set((state) => {
      const panelStore = state.panels.find((p) => p.id === panelId);
      panelStore.updateElement(dancerId, newState); // Update dancer state in the panel store
    }),

  // Updates shape state
  updateShapeState: (panelId, shapeId, newProps) =>
    set((state) => {
      const panelStore = state.panels.find((p) => p.id === panelId);
      panelStore.updateElement(shapeId, newProps); // Update shape state in the panel store
    }),

  // Removes a shape
  handleDelete: (selectedShape) =>
    set((state) => {
      if (!selectedShape) return;
      const { panelId, shapeId } = selectedShape;
      const panelStore = state.panels.find((p) => p.id === panelId);
      panelStore.deleteElement(shapeId); // Delete shape in the panel store
    }),

  // Clones a panel and adds it to the list of panels
  clonePanel: (panelId) =>
    set((state) => {
      const panelStore = state.panels.find((p) => p.id === panelId);
      if (!panelStore) return;
      const clonedPanel = { ...panelStore };
      clonedPanel.id = uuidv4(); // New ID for cloned panel
      return {
        panels: [...state.panels, clonedPanel],
      };
    }),

  // Move a panel left or right in the order
  movePanel: (panelId, direction) =>
    set((state) => {
      const panelIndex = state.panels.findIndex(
        (panel) => panel.id === panelId,
      );
      if (panelIndex === -1) return;
      const newPanels = [...state.panels];
      const panel = newPanels[panelIndex];

      if (direction === 'right' && panelIndex < newPanels.length - 1) {
        newPanels.splice(panelIndex, 1);
        newPanels.splice(panelIndex + 1, 0, panel);
      } else if (direction === 'left' && panelIndex > 0) {
        newPanels.splice(panelIndex, 1);
        newPanels.splice(panelIndex - 1, 0, panel);
      }

      return { panels: newPanels };
    }),
}));

// Custom hook to access the global state
export const useAppContext = () => {
  const {
    panels,
    selectedPanel,
    panelSize,
    handlePanelSelection,
    clonePanel,
    movePanel,
    setOpacity,
    handleDancerSelection,
    handleHandClick,
    handleCanvasClick,
    handleShapeSelection,
    handleShapeDraw,
    handleDelete,
    updateDancerState,
    updateShapeState,
  } = useAppStore();

  // Fetch the panel store for the selected panel
  const selectedPanelStore = useAppStore
    .getState()
    .getPanelStoreById(selectedPanel);

  // Now you can directly access dancers and other properties via the selected panel's store
  const dancers = selectedPanelStore ? selectedPanelStore.dancers : [];
  const getDancerById = selectedPanelStore
    ? selectedPanelStore.getDancerById
    : () => null;

  // Access opacity values directly
  const opacityDancers = useAppStore.getState().getOpacity('dancers');
  const opacitySymbols = useAppStore.getState().getOpacity('symbols');

  return {
    panels,
    selectedPanel,
    dancers,
    getDancerById,
    handlePanelSelection,
    panelSize,
    clonePanel,
    movePanel,
    setOpacity,
    handleDancerSelection,
    handleHandClick,
    handleCanvasClick,
    handleShapeSelection,
    handleShapeDraw,
    handleDelete,
    updateDancerState,
    updateShapeState,
    opacityDancers, // Access opacity directly
    opacitySymbols, // Access opacity directly
  };
};
