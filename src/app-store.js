import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { addEntities, removeEntities, cloneEntities } from 'utils/entityUtils';

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

const createInitialPanel = () => {
  const panelId = uuidv4();
  const dancers = [
    {
      ...initialDancer,
      panel: panelId,
      id: uuidv4(),
      y: 40,
      colour: 'red',
      rotation: 180,
    },
    {
      ...initialDancer,
      panel: panelId,
      id: uuidv4(),
      y: 220,
      colour: 'blue',
      rotation: 0,
    },
  ];
  const symbols = [
    {
      id: uuidv4(),
      panel: panelId,
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
  ];
  const panel = {
    id: panelId,
    dancers: dancers.map((dancer) => dancer.id),
    shapes: symbols.map((symbol) => symbol.id),
  };
  return { panel, dancers, shapes: symbols };
};

const globalDefaults = {
  opacity: { dancers: 1, symbols: 1 },
  disabled: { dancers: false, symbols: false },
  panelSize: { width: 300, height: 300 },
};

export const useStore = create((set, get) => {
  const { panel, dancers, shapes } = createInitialPanel();

  const initialState = {
    panels: {
      byId: { [panel.id]: panel },
      allIds: [panel.id],
    },
    dancers: {
      byId: dancers.reduce((acc, dancer) => {
        acc[dancer.id] = dancer;
        return acc;
      }, {}),
      allIds: dancers.map((d) => d.id),
    },
    shapes: {
      byId: shapes.reduce((acc, shape) => {
        acc[shape.id] = shape;
        return acc;
      }, {}),
      allIds: shapes.map((s) => s.id),
    },
    selectedPanelId: null,
    selectedDancer: null,
    selectedHand: null,
    selectedShape: null,
    panelSize: globalDefaults.panelSize,
    opacity: globalDefaults.opacity,
    disabled: globalDefaults.disabled,
  };

  return {
    ...initialState,
    getInitialState: () => JSON.parse(JSON.stringify(initialState)), // helps with testing
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

    updateShape: (id, updates) =>
      set((state) => ({
        shapes: {
          byId: {
            ...state.shapes.byId,
            [id]: {
              ...state.shapes.byId[id],
              ...updates,
            },
          },
          allIds: [...state.shapes.allIds],
        },
      })),

    updateDancer: (id, updates) =>
      set((state) => ({
        dancers: {
          byId: {
            ...state.dancers.byId,
            [id]: {
              ...state.dancers.byId[id],
              ...updates,
            },
          },
          allIds: [...state.dancers.allIds],
        },
      })),

    selectPanel: (panelId) =>
      set({
        selectedPanelId: panelId,
        selectedDancer: null,
        selectedHand: null,
        selectedShape: null,
      }),

    clearSelection: () =>
      set({
        selectedPanelId: null,
        selectedDancer: null,
        selectedHand: null,
        selectedShape: null,
      }),

    addPanel: () =>
      set((state) => {
        const { panel, dancers, shapes } = createInitialPanel();

        return {
          panels: addEntities(state.panels, [panel]),
          dancers: addEntities(state.dancers, dancers),
          shapes: addEntities(state.shapes, shapes),
        };
      }),

    removePanel: (panelId) =>
      set((state) => {
        const panel = state.panels.byId[panelId];
        if (!panel) return state;

        const updatedDancers = removeEntities(state.dancers, panel.dancers);
        const updatedShapes = removeEntities(state.shapes, panel.shapes);
        const updatedPanels = removeEntities(state.panels, [panelId]);

        const shouldClearDancer =
          state.selectedDancer &&
          panel.dancers.includes(state.selectedDancer.dancerId);

        const shouldClearShape =
          state.selectedShape &&
          panel.shapes.includes(state.selectedShape.shapeId);

        const shouldClearPanel = state.selectedPanelId === panelId;

        return {
          panels: updatedPanels,
          dancers: updatedDancers,
          shapes: updatedShapes,
          selectedPanelId: shouldClearPanel ? null : state.selectedPanelId,
          selectedDancer: shouldClearDancer ? null : state.selectedDancer,
          selectedHand: shouldClearDancer ? null : state.selectedHand,
          selectedShape: shouldClearShape ? null : state.selectedShape,
        };
      }),

    clonePanel: (panelId) =>
      set((state) => {
        const original = state.panels.byId[panelId];
        if (!original) return state;

        const { clones: clonedDancers, idMap: dancerIdMap } = cloneEntities(
          state.dancers.byId,
          original.dancers,
        );

        const { clones: clonedShapes, idMap: shapeIdMap } = cloneEntities(
          state.shapes.byId,
          original.shapes,
        );

        const newPanelId = uuidv4();
        const clonedPanel = {
          ...original,
          id: newPanelId,
          dancers: original.dancers.map((id) => dancerIdMap[id]),
          shapes: original.shapes.map((id) => shapeIdMap[id]),
        };

        return {
          panels: addEntities(state.panels, [clonedPanel]),
          dancers: addEntities(state.dancers, clonedDancers),
          shapes: addEntities(state.shapes, clonedShapes),
        };
      }),

    movePanel: (draggedId, targetId) =>
      set((state) => {
        if (draggedId === targetId) return state;

        const ids = state.panels.allIds;
        const fromIndex = ids.indexOf(draggedId);
        const toIndex = ids.indexOf(targetId);
        if (fromIndex === -1 || toIndex === -1) return state;

        const reordered = [...ids];
        reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, draggedId);

        return {
          panels: {
            ...state.panels,
            allIds: reordered,
          },
        };
      }),
  };
});
