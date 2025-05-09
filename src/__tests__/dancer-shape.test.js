import { act } from 'react';
import { useStore } from 'app-store';

describe('dancer and shape updates (with helpers)', () => {
  beforeEach(() => {
    useStore.setState(useStore.getInitialState());
  });

  it('updates dancer position correctly using updateDancer', () => {
    const state = useStore.getState();
    const panelId = state.panels.allIds[0];
    const dancerId = state.panels.byId[panelId].dancers[0];
    const oldX = state.dancers.byId[dancerId].x;

    act(() => {
      useStore.getState().updateDancer(dancerId, { x: oldX + 100 });
    });

    const newState = useStore.getState();
    expect(newState.dancers.byId[dancerId].x).toBe(oldX + 100);
  });

  it('updates shape rotation correctly using updateShape', () => {
    const state = useStore.getState();
    const panelId = state.panels.allIds[0];
    const shapeId = state.panels.byId[panelId].shapes[0];

    act(() => {
      useStore.getState().updateShape(shapeId, { rotation: 45 });
    });

    const newState = useStore.getState();
    expect(newState.shapes.byId[shapeId].rotation).toBe(45);
  });

  it('does not overwrite other dancers when updating one', () => {
    const state = useStore.getState();
    const panelId = state.panels.allIds[0];
    const [firstId, secondId] = state.panels.byId[panelId].dancers;
    const oldY = state.dancers.byId[secondId].y;

    act(() => {
      useStore.getState().updateDancer(firstId, { x: 999 });
    });

    const newState = useStore.getState();
    expect(newState.dancers.byId[secondId].y).toBe(oldY); // untouched
  });

  it('does not overwrite other shapes when updating one', () => {
    act(() => useStore.getState().addPanel()); // add a second shape

    const state = useStore.getState();
    const allShapeIds = state.shapes.allIds;
    const [firstId, secondId] = allShapeIds;
    const oldX = state.shapes.byId[secondId].x;

    act(() => {
      useStore.getState().updateShape(firstId, { x: 555 });
    });

    const newState = useStore.getState();
    expect(newState.shapes.byId[secondId].x).toBe(oldX); // untouched
  });
});
