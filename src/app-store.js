import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { shallow } from 'zustand/shallow';

const initialDancer = {
  x: 150,
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
  headShape: 'Upright',
  handShape: { left: 'Waist', right: 'Waist' },
};

const createInitialPanel = () => ({
  id: uuidv4(),
  dancers: [
    { ...initialDancer, id: uuidv4(), y: 40, colour: 'red', rotation: 180 },
    { ...initialDancer, id: uuidv4(), y: 220, colour: 'blue', rotation: 0 },
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
});

const useStore = create((set, get) => ({
  panels: {
    byId: {},
    allIds: [],
  },
  selectedPanelId: null,
  selectedDancer: null,
  selectedHand: null,
  selectedShape: null,
  panelSize: { width: 300, height: 300 },
  opacity: { dancers: 1, symbols: 1 },
  disabled: { dancers: false, symbols: false },

  initialize: () =>
    set(() => {
      const panel = createInitialPanel();
      return {
        panels: {
          byId: { [panel.id]: panel },
          allIds: [panel.id],
        },
      };
    }),

  updatePanelState: (panelId, updater) =>
    set((state) => ({
      panels: {
        ...state.panels,
        byId: {
          ...state.panels.byId,
          [panelId]: updater(state.panels.byId[panelId]),
        },
      },
    })),

  updateDancer: (panelId, dancerId, updates) => {
    const updatePanel = (panel) => ({
      ...panel,
      dancers: panel.dancers.map((d) =>
        d.id === dancerId ? { ...d, ...updates } : d,
      ),
    });
    get().updatePanelState(panelId, updatePanel);
  },

  addShape: (panelId, shape) => {
    const updatePanel = (panel) => ({
      ...panel,
      shapes: [...panel.shapes, { ...shape, id: uuidv4() }],
    });
    get().updatePanelState(panelId, updatePanel);
  },

  updateShape: (panelId, shapeId, updates) => {
    const updatePanel = (panel) => ({
      ...panel,
      shapes: panel.shapes.map((s) =>
        s.id === shapeId ? { ...s, ...updates } : s,
      ),
    });
    get().updatePanelState(panelId, updatePanel);
  },

  deleteShape: (panelId, shapeId) => {
    const updatePanel = (panel) => ({
      ...panel,
      shapes: panel.shapes.filter((s) => s.id !== shapeId),
    });
    get().updatePanelState(panelId, updatePanel);
  },

  selectPanel: (panelId) =>
    set({
      selectedPanelId: panelId,
      selectedDancer: null,
      selectedHand: null,
      selectedShape: null,
    }),

  selectDancer: (panelId, dancer) =>
    set((state) => ({
      selectedPanelId: panelId,
      selectedDancer: state.selectedDancer?.id === dancer.id ? null : dancer,
    })),

  selectHand: (panelId, dancerId, handSide) =>
    set((state) => ({
      selectedPanelId: panelId,
      selectedHand:
        state.selectedHand?.dancerId === dancerId &&
        state.selectedHand?.handSide === handSide
          ? null
          : { dancerId, handSide },
    })),

  selectShape: (panelId, shape) =>
    set((state) => ({
      selectedPanelId: panelId,
      selectedShape: state.selectedShape?.id === shape.id ? null : shape,
    })),

  clearSelection: () =>
    set({
      selectedPanelId: null,
      selectedDancer: null,
      selectedHand: null,
      selectedShape: null,
    }),

  addPanel: () =>
    set((state) => {
      const newPanel = createInitialPanel();
      return {
        panels: {
          byId: { ...state.panels.byId, [newPanel.id]: newPanel },
          allIds: [...state.panels.allIds, newPanel.id],
        },
      };
    }),

  removePanel: (panelId) =>
    set((state) => ({
      panels: {
        byId: Object.fromEntries(
          Object.entries(state.panels.byId).filter(([id]) => id !== panelId),
        ),
        allIds: state.panels.allIds.filter((id) => id !== panelId),
      },
      selectedPanelId:
        state.selectedPanelId === panelId ? null : state.selectedPanelId,
    })),

  clonePanel: (panelId) =>
    set((state) => {
      const panel = state.panels.byId[panelId];
      if (!panel) return state;

      const clonedPanel = {
        ...panel,
        id: uuidv4(),
        dancers: panel.dancers.map((d) => ({ ...d, id: uuidv4() })),
        shapes: panel.shapes.map((s) => ({ ...s, id: uuidv4() })),
      };

      return {
        panels: {
          byId: { ...state.panels.byId, [clonedPanel.id]: clonedPanel },
          allIds: [...state.panels.allIds, clonedPanel.id],
        },
      };
    }),

  movePanel: (panelId, direction) =>
    set((state) => {
      const currentIndex = state.panels.allIds.indexOf(panelId);
      if (currentIndex === -1) return state;

      const newAllIds = [...state.panels.allIds];
      const targetIndex =
        direction === 'left'
          ? Math.max(0, currentIndex - 1)
          : Math.min(newAllIds.length - 1, currentIndex + 1);

      newAllIds.splice(currentIndex, 1);
      newAllIds.splice(targetIndex, 0, panelId);

      return {
        panels: {
          ...state.panels,
          allIds: newAllIds,
        },
      };
    }),

  toggleOpacity: (type) =>
    set((state) => {
      const newOpacity = state.opacity[type] === 1 ? 0.5 : 1;
      const newDisabled = state.opacity[type] === 1;
      return {
        opacity: {
          ...state.opacity,
          [type]: newOpacity,
        },
        disabled: { ...state.disabled, [type]: newDisabled },
      };
    }),
}));

useStore.getState().initialize();

// Custom hooks for components

export const useAppState = () => {
  return useStore((state) => {
    const { selectedPanelId } = state;
    return {
      panels: state.panels.allIds.map((id) => state.panels.byId[id]),
      selectedPanelId,
      selectedPanel: selectedPanelId
        ? state.panels.byId[selectedPanelId]
        : null,
      selectedDancer: state.selectedDancer,
      selectedHand: state.selectedHand,
      selectedShape: state.selectedShape,
    };
  }, shallow);
};

export const useGlobalSettings = () => {
  return useStore((state) => ({
    panelSize: state.panelSize,
    opacity: state.opacity,
    disabled: state.disabled,
  }));
};

export const usePanelState = (panelId) => {
  return useStore((state) => state.panels.byId[panelId]);
};

export const usePanelIds = () => {
  return useStore((state) => state.panels.allIds);
};

export const useSelectedPanelId = () => {
  return useStore((state) => state.selectedPanelId);
};

export const useSelectedPanel = () => {
  const selectedPanelId = useSelectedPanelId();
  return useStore((state) =>
    selectedPanelId ? state.panels.byId[selectedPanelId] : null,
  );
};

export const useSelection = () => {
  return useStore((state) => ({
    selectedDancer: state.selectedDancer,
    selectedHand: state.selectedHand,
    selectedShape: state.selectedShape,
  }));
};

export const usePanelActions = (panelId) => {
  const store = useStore();
  return {
    updateDancer: (dancerId, updates) =>
      store.updateDancer(panelId, dancerId, updates),
    addShape: (shape) => store.addShape(panelId, shape),
    updateShape: (shapeId, updates) =>
      store.updateShape(panelId, shapeId, updates),
    deleteShape: (shapeId) => store.deleteShape(panelId, shapeId),
    selectDancer: (dancerId) => store.selectDancer(panelId, dancerId),
    selectHand: (dancerId, handSide) =>
      store.selectHand(panelId, dancerId, handSide),
    selectShape: (shapeId) => store.selectShape(panelId, shapeId),
  };
};

export const useAppActions = () => {
  const store = useStore();
  return {
    addPanel: store.addPanel,
    removePanel: store.removePanel,
    clonePanel: store.clonePanel,
    movePanel: store.movePanel,
    selectPanel: store.selectPanel,
    clearSelection: store.clearSelection,
    toggleOpacity: store.toggleOpacity,
  };
};
