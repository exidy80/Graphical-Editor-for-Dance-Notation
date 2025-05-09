import { act } from 'react';
import { useStore } from 'app-store';

describe('app-store', () => {
  beforeEach(() => {
    useStore.setState(useStore.getInitialState());
  });

  it('initializes with one panel, two dancers, and one shape', () => {
    const state = useStore.getState();
    expect(state.panels.allIds.length).toBe(1);
    const panelId = state.panels.allIds[0];
    const panel = state.panels.byId[panelId];
    expect(panel.dancers.length).toBe(2);
    expect(panel.shapes.length).toBe(1);
  });

  it('addPanel adds a new panel with dancers and shapes', () => {
    const before = useStore.getState().panels.allIds.length;
    act(() => useStore.getState().addPanel());
    const after = useStore.getState().panels.allIds.length;
    expect(after).toBe(before + 1);
  });

  it('removePanel deletes panel and associated entities', () => {
    const state = useStore.getState();
    const panelId = state.panels.allIds[0];
    const dancerIds = state.panels.byId[panelId].dancers;
    const shapeIds = state.panels.byId[panelId].shapes;

    act(() => useStore.getState().removePanel(panelId));

    const newState = useStore.getState();
    expect(newState.panels.byId[panelId]).toBeUndefined();
    dancerIds.forEach((id) =>
      expect(newState.dancers.byId[id]).toBeUndefined(),
    );
    shapeIds.forEach((id) => expect(newState.shapes.byId[id]).toBeUndefined());
  });

  it('clonePanel creates deep clone of panel with new IDs', () => {
    const state = useStore.getState();
    const originalPanelId = state.panels.allIds[0];
    const originalDancerCount = Object.keys(state.dancers.byId).length;
    const originalShapeCount = Object.keys(state.shapes.byId).length;

    act(() => useStore.getState().clonePanel(originalPanelId));
    const newState = useStore.getState();

    expect(newState.panels.allIds.length).toBe(2);
    expect(Object.keys(newState.dancers.byId).length).toBe(
      originalDancerCount + 2,
    );
    expect(Object.keys(newState.shapes.byId).length).toBe(
      originalShapeCount + 1,
    );
  });

  it('movePanel reorders panels correctly', () => {
    act(() => {
      useStore.getState().addPanel();
      useStore.getState().addPanel();
    });

    const idsBefore = useStore.getState().panels.allIds;
    const draggedId = idsBefore[0];
    const targetId = idsBefore[2];

    act(() => useStore.getState().movePanel(draggedId, targetId));
    const idsAfter = useStore.getState().panels.allIds;

    expect(idsAfter.indexOf(draggedId)).toBe(idsBefore.indexOf(targetId));
  });
});
